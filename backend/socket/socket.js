const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const MatchingRequest = require('../models/MatchingRequest');
const MatchingService = require('../services/MatchingService');
const EmailService = require('../services/EmailService');

let io;
const waitingQueue = [];
const userSockets = {}; // Map userId -> socketId for notifications
const instantMatchTimeouts = new Map(); // Map requestId -> timeoutId for 30-second fallback

const initSocket = (server) => {
  io = socketIO(server, {
    cors: { origin: '*' }
  });

  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.user.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`\n✓ User ${socket.user.name} (${socket.user._id}) connected`);
    console.log(`  Socket ID: ${socket.id}`);
    userSockets[socket.user._id] = socket.id;
    console.log(`  Active sockets: ${Object.keys(userSockets).length}`);

    // ---------- FEATURE 1: NEW MATCHING SYSTEM ----------
    /**
     * Start an instant interview
     */
    socket.on('instant-interview-start', async (preferences) => {
      try {
        console.log(`\n=== INSTANT INTERVIEW START ===`);
        console.log(`User ${socket.user.name} (${socket.user._id}) started instant interview`);
        console.log(`Preferences:`, preferences);

        // Cancel prior instant requests only; do not cancel scheduled interviews
        try {
          const oldRequests = await MatchingRequest.find({
            userId: socket.user._id,
            type: 'instant',
            status: { $in: ['waiting', 'matched'] }
          });
          
          for (const oldReq of oldRequests) {
            console.log(`  Cancelling old request ${oldReq._id} (status: ${oldReq.status})`);
            await MatchingService.cancelRequest(oldReq._id);
            
            // Also clear timeout if it exists
            if (instantMatchTimeouts.has(oldReq._id)) {
              clearTimeout(instantMatchTimeouts.get(oldReq._id));
              instantMatchTimeouts.delete(oldReq._id);
            }
          }
        } catch (err) {
          console.error('Error cancelling old requests:', err);
        }

        // Clear any old data from previous interviews
        if (socket.data.activeSessionId) {
          console.log(`  Clearing old session ${socket.data.activeSessionId}`);
          socket.leave(socket.data.activeSessionId);
          delete socket.data.activeSessionId;
        }
        if (socket.data.matchingRequestId && instantMatchTimeouts.has(socket.data.matchingRequestId)) {
          clearTimeout(instantMatchTimeouts.get(socket.data.matchingRequestId));
          instantMatchTimeouts.delete(socket.data.matchingRequestId);
        }

        const matchingRequest = new MatchingRequest({
          userId: socket.user._id,
          type: 'instant',
          interviewType: preferences.interviewType,
          difficulty: preferences.difficulty,
          targetCompany: preferences.targetCompany,
          preferredLanguage: preferences.preferredLanguage,
          identityPreference: preferences.identityPreference || 'Named',
          rolePreference: preferences.rolePreference || 'candidate',
          status: 'waiting'
        });

        await matchingRequest.save();
        socket.data.matchingRequestId = matchingRequest._id;
        console.log(`Created NEW MatchingRequest ${matchingRequest._id}`);

        socket.emit('interview-request-created', {
          requestId: matchingRequest._id,
          type: 'instant'
        });

        // Try to find a match immediately
        console.log(`Attempting immediate match...`);
        const result = await MatchingService.matchInstantInterview(matchingRequest._id);
        console.log(`Immediate match result:`, result.matched ? 'MATCHED' : 'NOT MATCHED');
        
        if (result.matched) {
          console.log(`✓ Immediate match found with ${result.result.request2.userId}`);
          // Clear any timeout if match found immediately
          if (instantMatchTimeouts.has(matchingRequest._id)) {
            clearTimeout(instantMatchTimeouts.get(matchingRequest._id));
            instantMatchTimeouts.delete(matchingRequest._id);
          }
          await emitMatchResult(socket, result, matchingRequest);
        } else {
          // No immediate match - set 30-second timeout for fallback
          console.log(`✗ No immediate match. Setting 30-second fallback timer...`);
          
          const timeoutId = setTimeout(async () => {
            try {
              console.log(`\n>>> 30-SECOND TIMEOUT FIRED for request ${matchingRequest._id}`);
              const fallbackResult = await MatchingService.applyInstantFallback(matchingRequest._id);
              console.log(`Fallback result:`, fallbackResult);
              
              if (fallbackResult.success) {
                console.log(`✓ Instant fallback successful - matched with ${fallbackResult.result.request2.userId}`);
                const partnerSocketId = userSockets[fallbackResult.result.request2.userId];
                console.log(`Partner socket ID: ${partnerSocketId}`);
                
                if (partnerSocketId) {
                  // Notify both users of the fallback peer match
                  const session = fallbackResult.result.session;
                  const partner = await User.findById(fallbackResult.result.request2.userId);
                  const currentUser = await User.findById(matchingRequest.userId);
                  
                  const identityPref = matchingRequest.identityPreference;
                  const partnerDetails = identityPref === 'Anonymous' 
                    ? { anonymous: true }
                    : { anonymous: false, name: partner.name };
                  
                  const currentUserDetails = fallbackResult.result.request2.identityPreference === 'Anonymous'
                    ? { anonymous: true }
                    : { anonymous: false, name: currentUser.name };

                  console.log(`Emitting matched event to both users`);
                  // Emit to both users
                  io.to(userSockets[matchingRequest.userId] || socket.id).emit('matched', {
                    sessionId: session._id,
                    partner: partnerDetails,
                    role: 'candidate',
                    partnerUserId: partner._id,
                    matchType: 'peer',
                    message: 'Peer matched successfully. You can now practice together and decide how you want to conduct the session.'
                  });

                  io.to(partnerSocketId).emit('matched', {
                    sessionId: session._id,
                    partner: currentUserDetails,
                    role: 'candidate',
                    partnerUserId: currentUser._id,
                    matchType: 'peer',
                    message: 'Peer matched successfully. You can now practice together and decide how you want to conduct the session.'
                  });
                } else {
                  console.log(`✗ Partner socket not found for ${fallbackResult.result.request2.userId}`);
                }
              } else {
                // Still no candidate match found, keep waiting
                console.log(`✗ No candidate match found yet`);
              }
            } catch (err) {
              console.error(`Error applying instant fallback:`, err);
            } finally {
              instantMatchTimeouts.delete(matchingRequest._id);
            }
          }, 30 * 1000); // 30 seconds
          
          instantMatchTimeouts.set(matchingRequest._id, timeoutId);
          console.log(`Fallback timer set (ID: ${timeoutId})`);
        }
      } catch (err) {
        console.error('Error starting instant interview:', err);
        socket.emit('error', { msg: 'Failed to start instant interview' });
      }
    });

    /**
     * Start a scheduled interview
     */
    socket.on('scheduled-interview-start', async (preferences) => {
      try {
        console.log(`\n=== SCHEDULED INTERVIEW START ===`);
        console.log(`User ${socket.user.name} (${socket.user._id}) scheduled interview`);
        
        // Cancel previous scheduled requests for this user, but keep other types intact
        try {
          const oldRequests = await MatchingRequest.find({
            userId: socket.user._id,
            type: 'scheduled',
            status: { $in: ['waiting', 'matched'] }
          });
          
          for (const oldReq of oldRequests) {
            console.log(`  Cancelling old request ${oldReq._id} (type: ${oldReq.type}, status: ${oldReq.status})`);
            await MatchingService.cancelRequest(oldReq._id);
            
            // Also clear timeout if it exists (for instant requests)
            if (instantMatchTimeouts.has(oldReq._id)) {
              clearTimeout(instantMatchTimeouts.get(oldReq._id));
              instantMatchTimeouts.delete(oldReq._id);
            }
          }
        } catch (err) {
          console.error('Error cancelling old requests:', err);
        }
        
        const { scheduledDate, startTime, endTime } = preferences;

        // Parse dates
        const scheduled = new Date(scheduledDate);
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const scheduledStartTime = new Date(scheduled);
        scheduledStartTime.setHours(startHour, startMin, 0, 0);

        const scheduledEndTime = new Date(scheduled);
        scheduledEndTime.setHours(endHour, endMin, 0, 0);

        const fallbackEligibleAt = new Date(scheduledStartTime.getTime() - 120 * 60 * 1000);

        console.log(`Scheduled: ${scheduledStartTime} to ${scheduledEndTime}`);
        console.log(`Fallback eligible at: ${fallbackEligibleAt}`);

        const matchingRequest = new MatchingRequest({
          userId: socket.user._id,
          type: 'scheduled',
          interviewType: preferences.interviewType,
          difficulty: preferences.difficulty,
          targetCompany: preferences.targetCompany,
          preferredLanguage: preferences.preferredLanguage,
          identityPreference: preferences.identityPreference || 'Named',
          rolePreference: preferences.rolePreference || 'candidate',
          scheduledDate: scheduled,
          scheduledStartTime,
          scheduledEndTime,
          fallbackEligibleAt,
          status: 'waiting'
        });

        await matchingRequest.save();
        socket.data.matchingRequestId = matchingRequest._id;
        console.log(`Created NEW MatchingRequest ${matchingRequest._id}`);

        socket.emit('scheduled-interview-request-created', {
          requestId: matchingRequest._id,
          scheduledStartTime,
          fallbackEligibleAt
        });

        // Send confirmation email
        await EmailService.sendScheduleConfirmation(
          socket.user.email,
          socket.user.name,
          scheduledStartTime
        );

        // Try to find an interviewer match immediately
        console.log(`Attempting immediate interviewer match...`);
        const interviewerMatch = await MatchingService.findInterviewerMatch(matchingRequest);
        if (interviewerMatch) {
          console.log(`✓ Found interviewer match: ${interviewerMatch.userId}`);
          const result = await MatchingService.matchRequests(matchingRequest._id, interviewerMatch._id, 'interviewer');
          if (!result.error) {
            console.log(`✓ Match successful`);
            
            // Send match notification emails to both users
            const interviewerUser = await User.findById(interviewerMatch.userId);
            const candidateUser = await User.findById(socket.user._id);
            
            await EmailService.sendMatchNotification(
              socket.user.email,
              socket.user.name,
              interviewerUser.name,
              'interviewer',
              scheduledStartTime
            );
            
            await EmailService.sendMatchNotification(
              interviewerUser.email,
              interviewerUser.name,
              candidateUser.name,
              'interviewer',
              scheduledStartTime
            );
            
            await emitMatchResult(socket, { matched: true, matchType: 'interviewer', result }, matchingRequest);
          }
        } else {
          console.log(`✗ No interviewer found. Will wait for fallback mechanism.`);
        }
      } catch (err) {
        console.error('Error starting scheduled interview:', err);
        socket.emit('error', { msg: 'Failed to schedule interview' });
      }
    });

    /**
     * Try to find a match for a pending request
     */
    socket.on('try-find-match', async (requestId) => {
      try {
        const matchingRequest = await MatchingRequest.findById(requestId);
        if (!matchingRequest || !matchingRequest.userId.equals(socket.user._id)) {
          return socket.emit('error', { msg: 'Invalid request' });
        }

        if (matchingRequest.status !== 'waiting') {
          return socket.emit('error', { msg: 'Request is not waiting' });
        }

        let result;
        if (matchingRequest.type === 'instant') {
          result = await MatchingService.matchInstantInterview(requestId);
        } else if (matchingRequest.type === 'scheduled') {
          const now = new Date();
          if (now >= matchingRequest.fallbackEligibleAt) {
            result = await MatchingService.applyScheduledFallback(requestId);
            if (result.success) {
              result.matched = true;
              result.matchType = 'peer';
            }
          } else {
            const interviewerMatch = await MatchingService.findInterviewerMatch(matchingRequest);
            if (interviewerMatch) {
              result = await MatchingService.matchRequests(requestId, interviewerMatch._id, 'interviewer');
              result.matched = true;
              result.matchType = 'interviewer';
            } else {
              result = { matched: false };
            }
          }
        }

        if (result.matched) {
          // Clear any pending timeout if match is found
          if (instantMatchTimeouts.has(requestId)) {
            clearTimeout(instantMatchTimeouts.get(requestId));
            instantMatchTimeouts.delete(requestId);
          }
          await emitMatchResult(socket, result, matchingRequest);
        } else {
          socket.emit('match-not-found', { message: result.message || 'Waiting for a peer...' });
        }
      } catch (err) {
        console.error('Error finding match:', err);
        socket.emit('error', { msg: 'Failed to find match' });
      }
    });

    /**
     * Cancel matching request
     */
    socket.on('cancel-interview-request', async (requestId) => {
      try {
        const matchingRequest = await MatchingRequest.findById(requestId);
        if (!matchingRequest || !matchingRequest.userId.equals(socket.user._id)) {
          return socket.emit('error', { msg: 'Invalid request' });
        }

        // Clear any pending 30-second timeout for instant interviews
        if (matchingRequest.type === 'instant' && instantMatchTimeouts.has(requestId)) {
          clearTimeout(instantMatchTimeouts.get(requestId));
          instantMatchTimeouts.delete(requestId);
        }

        await MatchingService.cancelRequest(requestId);
        socket.emit('interview-request-cancelled', { requestId });
      } catch (err) {
        console.error('Error cancelling interview request:', err);
        socket.emit('error', { msg: 'Failed to cancel request' });
      }
    });

    // ---------- FEATURE 1: OLD MATCHING (BACKWARD COMPATIBILITY) ----------
    socket.on('find-peer', async (preferences) => {
      if (preferences) {
        socket.user.preferences = preferences;
        await socket.user.save();
      }

      const userEntry = {
        socketId: socket.id,
        userId: socket.user._id,
        name: socket.user.name,
        preferences: socket.user.preferences
      };

      const existingIndex = waitingQueue.findIndex(q => q.userId.equals(socket.user._id));
      if (existingIndex !== -1) waitingQueue.splice(existingIndex, 1);

      waitingQueue.push(userEntry);
      console.log(`Queue: ${waitingQueue.length}`);

      const match = findMatch(socket.user._id);
      if (match) {
        waitingQueue.splice(waitingQueue.findIndex(q => q.userId.equals(match.user1.userId)), 1);
        waitingQueue.splice(waitingQueue.findIndex(q => q.userId.equals(match.user2.userId)), 1);

        try {
          const user1Role = match.user1.preferences?.rolePreference === 'candidate' ? 'candidate' : 'interviewer';
          const user2Role = user1Role === 'candidate' ? 'interviewer' : 'candidate';

          const session = await Session.create({
            participants: [
              { user: match.user1.userId, socketId: match.user1.socketId, role: user1Role },
              { user: match.user2.userId, socketId: match.user2.socketId, role: user2Role }
            ],
            matchType: 'interviewer'
          });

          const partner1 = getPartnerDetails(match.user2, match.user1.preferences.identityPreference);
          const partner2 = getPartnerDetails(match.user1, match.user2.preferences.identityPreference);

          io.to(match.user1.socketId).emit('matched', {
            sessionId: session._id,
            partner: partner1,
            role: user1Role,
            partnerUserId: match.user2.userId,
            matchType: 'interviewer'
          });
          io.to(match.user2.socketId).emit('matched', {
            sessionId: session._id,
            partner: partner2,
            role: user2Role,
            partnerUserId: match.user1.userId,
            matchType: 'interviewer'
          });

          console.log(`Matched: ${match.user1.name} (${user1Role}) ↔ ${match.user2.name} (${user2Role})`);
        } catch (err) {
          console.error('Session error:', err);
        }
      }
    });

    socket.on('cancel-search', () => {
      removeFromQueue(socket.user._id);
    });

    // ---------- FEATURE 2: INTERVIEW ROOM COLLABORATION ----------
    socket.on('join-room', async (sessionId) => {
      socket.join(sessionId);
      socket.data.activeSessionId = sessionId;
      console.log(`${socket.user.name} joined room ${sessionId}`);

      try {
        const session = await Session.findById(sessionId);
        if (!session) return;
        socket.emit('session-data', {
          question: session.question,
          code: session.code,
          language: session.language,
          notes: session.notes,
          timerDuration: session.timerDuration,
          timerEnd: session.timerEnd,
          status: session.status,
          matchType: session.matchType
        });
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('code-change', async ({ sessionId, code }) => {
      socket.to(sessionId).emit('code-update', code);
      await Session.findByIdAndUpdate(sessionId, { code });
    });

    socket.on('language-change', async ({ sessionId, language }) => {
      socket.to(sessionId).emit('language-update', language);
      await Session.findByIdAndUpdate(sessionId, { language });
    });

    socket.on('question-change', async ({ sessionId, question }) => {
      socket.to(sessionId).emit('question-update', question);
      await Session.findByIdAndUpdate(sessionId, { question });
    });

    socket.on('notes-change', async ({ sessionId, notes }) => {
      socket.to(sessionId).emit('notes-update', notes);
      await Session.findByIdAndUpdate(sessionId, { notes });
    });

    socket.on('timer-start', async ({ sessionId, duration }) => {
      const timerEnd = new Date(Date.now() + duration * 1000);
      io.to(sessionId).emit('timer-update', { timerEnd });
      await Session.findByIdAndUpdate(sessionId, { timerEnd, timerDuration: duration });
    });

    socket.on('timer-stop', async ({ sessionId }) => {
      io.to(sessionId).emit('timer-update', { timerEnd: null });
      await Session.findByIdAndUpdate(sessionId, { timerEnd: null });
    });

    socket.on('end-interview', async ({ sessionId }) => {
      console.log(`\nEnd interview: ${sessionId}`);
      io.to(sessionId).emit('interview-ended');
      io.to(sessionId).emit('show-feedback');
      await Session.findByIdAndUpdate(sessionId, { status: 'ended' });
      
      // Clear matching data when interview ends
      if (socket.data.activeSessionId === sessionId) {
        socket.data.activeSessionId = null;
        socket.data.matchingRequestId = null;
      }
      socket.leave(sessionId);
    });

    socket.on('leave-room', async ({ sessionId }) => {
      const roomId = sessionId || socket.data.activeSessionId;
      if (roomId) {
        socket.leave(roomId);
        socket.to(roomId).emit('partner-left');
        await Session.findByIdAndUpdate(roomId, { status: 'ended' });
      }
      socket.data.activeSessionId = null;
      socket.data.matchingRequestId = null;
      console.log(`${socket.user.name} left room ${roomId || 'unknown'}`);
    });

    // ---------- FEATURE 3: WEBRTC SIGNALLING ----------
    socket.on('offer', ({ sessionId, offer }) => {
      socket.to(sessionId).emit('offer', offer);
    });

    socket.on('answer', ({ sessionId, answer }) => {
      socket.to(sessionId).emit('answer', answer);
    });

    socket.on('ice-candidate', ({ sessionId, candidate }) => {
      socket.to(sessionId).emit('ice-candidate', candidate);
    });

    socket.on('disconnect', async () => {
      console.log(`\n✗ User ${socket.user.name} (${socket.user._id}) disconnected`);
      
      removeFromQueue(socket.user._id);
      
      // Clear any pending instant interview timeouts for this user
      const userRequestId = socket.data.matchingRequestId;
      if (userRequestId && instantMatchTimeouts.has(userRequestId)) {
        clearTimeout(instantMatchTimeouts.get(userRequestId));
        instantMatchTimeouts.delete(userRequestId);
        console.log(`  Cleared pending timeout for request ${userRequestId}`);
      }
      
      // Only cancel pending instant requests on disconnect; scheduled interviews should remain visible
      if (userRequestId) {
        try {
          const request = await MatchingRequest.findById(userRequestId);
          if (request && request.type === 'instant') {
            await MatchingService.cancelRequest(userRequestId);
            console.log(`  Cancelled MatchingRequest ${userRequestId}`);
          }
        } catch (err) {
          console.error(`  Error cancelling request on disconnect:`, err);
        }
      }
      
      const roomId = socket.data.activeSessionId;
      if (roomId) {
        socket.to(roomId).emit('partner-left');
        await Session.findByIdAndUpdate(roomId, { status: 'ended' });
      }
      delete userSockets[socket.user._id];
      console.log(`  Active sockets: ${Object.keys(userSockets).length}`);
    });
  });

  return io;
};

// ---------- HELPER FUNCTIONS ----------
async function emitMatchResult(socket, result, matchingRequest) {
  try {
    console.log(`\n=== EMITTING MATCH RESULT ===`);
    console.log(`Match type: ${result.matchType}`);
    
    const session = result.result.session;
    const partnerRequest = result.result.request2;
    const partner = await User.findById(partnerRequest.userId);

    console.log(`Partner: ${partner.name} (${partner._id})`);
    console.log(`Partner socket ID: ${userSockets[partner._id]}`);

    // Clear any pending timeout for instant interviews
    if (matchingRequest.type === 'instant' && instantMatchTimeouts.has(matchingRequest._id)) {
      clearTimeout(instantMatchTimeouts.get(matchingRequest._id));
      instantMatchTimeouts.delete(matchingRequest._id);
      console.log(`Cleared pending timeout`);
    }

    const identityPreference = matchingRequest.identityPreference;
    const partnerDetails =
      identityPreference === 'Anonymous'
        ? { anonymous: true }
        : { anonymous: false, name: partner.name };

    const matchTypeMessage =
      result.matchType === 'interviewer'
        ? 'Interview matched successfully'
        : 'Peer matched successfully. You can now practice together and decide how you want to conduct the session.';

    // Determine role for current user
    const isCandidate = matchingRequest.rolePreference === 'candidate';
    const role = isCandidate && result.matchType === 'interviewer' ? 'candidate' : result.matchType === 'interviewer' ? 'interviewer' : 'candidate';

    console.log(`Emitting to current user (${socket.user.name}) - role: ${role}`);
    socket.emit('matched', {
      sessionId: session._id,
      partner: partnerDetails,
      role: role,
      partnerUserId: partner._id,
      matchType: result.matchType,
      message: matchTypeMessage
    });

    // Notify partner
    const partnerSocketId = userSockets[partner._id];
    if (partnerSocketId) {
      const currentUserDetails =
        partnerRequest.identityPreference === 'Anonymous'
          ? { anonymous: true }
          : { anonymous: false, name: (await User.findById(matchingRequest.userId)).name };

      const partnerRole = !isCandidate && result.matchType === 'interviewer' ? 'candidate' : result.matchType === 'interviewer' ? 'interviewer' : 'candidate';

      console.log(`Emitting to partner (${partner.name}) - role: ${partnerRole}`);
      io.to(partnerSocketId).emit('matched', {
        sessionId: session._id,
        partner: currentUserDetails,
        role: partnerRole,
        partnerUserId: matchingRequest.userId,
        matchType: result.matchType,
        message: matchTypeMessage
      });
    } else {
      console.log(`✗ Partner socket not found`);
    }

    // Send match notification emails (especially for scheduled interviews)
    if (matchingRequest.type === 'scheduled') {
      try {
        const currentUser = await User.findById(matchingRequest.userId);
        
        await EmailService.sendMatchNotification(
          currentUser.email,
          currentUser.name,
          partner.name,
          result.matchType,
          matchingRequest.scheduledStartTime
        );
        
        await EmailService.sendMatchNotification(
          partner.email,
          partner.name,
          currentUser.name,
          result.matchType,
          matchingRequest.scheduledStartTime
        );
      } catch (err) {
        console.error('Error sending match notification emails:', err);
      }
    }

    console.log(`✓ Match emitted successfully\n`);
  } catch (err) {
    console.error('Error emitting match result:', err);
  }
}

function findMatch(currentUserId) {
  const current = waitingQueue.find(q => q.userId.equals(currentUserId));
  if (!current) return null;

  const currentRole = current.preferences?.rolePreference || 'candidate';

  for (const other of waitingQueue) {
    if (other.userId.equals(currentUserId)) continue;

    const otherRole = other.preferences?.rolePreference || 'candidate';
    if (currentRole === otherRole) continue;

    return { user1: current, user2: other };
  }
  return null;
}

function removeFromQueue(userId) {
  const index = waitingQueue.findIndex(q => q.userId.equals(userId));
  if (index !== -1) waitingQueue.splice(index, 1);
}

function getPartnerDetails(userEntry, identityPreference) {
  if (identityPreference === 'Anonymous') {
    return { anonymous: true, preferences: userEntry.preferences };
  }
  return { anonymous: false, name: userEntry.name, preferences: userEntry.preferences };
}

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };