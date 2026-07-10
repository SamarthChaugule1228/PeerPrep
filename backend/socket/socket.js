const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

let io;
const waitingQueue = [];

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
    console.log(`User ${socket.user.name} connected: ${socket.id}`);

    // ---------- FEATURE 1: MATCHING ----------
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
            ]
          });

          const partner1 = getPartnerDetails(match.user2, match.user1.preferences.identityPreference);
          const partner2 = getPartnerDetails(match.user1, match.user2.preferences.identityPreference);

          io.to(match.user1.socketId).emit('matched', {
            sessionId: session._id,
            partner: partner1,
            role: user1Role,
            partnerUserId: match.user2.userId
          });
          io.to(match.user2.socketId).emit('matched', {
            sessionId: session._id,
            partner: partner2,
            role: user2Role,
            partnerUserId: match.user1.userId
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
          status: session.status
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

    // Updated end-interview handler
    socket.on('end-interview', async ({ sessionId }) => {
      io.to(sessionId).emit('interview-ended');
      io.to(sessionId).emit('show-feedback');   // <-- added
      await Session.findByIdAndUpdate(sessionId, { status: 'ended' });
    });

    socket.on('leave-room', async ({ sessionId }) => {
      const roomId = sessionId || socket.data.activeSessionId;
      if (roomId) {
        socket.leave(roomId);
        socket.to(roomId).emit('partner-left');
        await Session.findByIdAndUpdate(roomId, { status: 'ended' });
      }
      socket.data.activeSessionId = null;
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
      removeFromQueue(socket.user._id);
      const roomId = socket.data.activeSessionId;
      if (roomId) {
        socket.to(roomId).emit('partner-left');
        await Session.findByIdAndUpdate(roomId, { status: 'ended' });
      }
      console.log(`${socket.user.name} disconnected`);
    });
  });

  return io;
};

// ---------- HELPER FUNCTIONS ----------
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