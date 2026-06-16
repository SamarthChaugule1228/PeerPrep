const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

let io;
const waitingQueue = []; // { socketId, userId, name, preferences }

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

      // Remove duplicate
      const existingIndex = waitingQueue.findIndex(q => q.userId.equals(socket.user._id));
      if (existingIndex !== -1) waitingQueue.splice(existingIndex, 1);

      waitingQueue.push(userEntry);
      console.log(`Queue: ${waitingQueue.length}`);

      const match = findMatch(socket.user._id);
      if (match) {
        // Remove both from queue
        waitingQueue.splice(waitingQueue.findIndex(q => q.userId.equals(match.user1.userId)), 1);
        waitingQueue.splice(waitingQueue.findIndex(q => q.userId.equals(match.user2.userId)), 1);

        try {
          const session = await Session.create({
            participants: [
              { user: match.user1.userId, socketId: match.user1.socketId },
              { user: match.user2.userId, socketId: match.user2.socketId }
            ]
          });

          const partner1 = getPartnerDetails(match.user2, match.user1.preferences.identityPreference);
          const partner2 = getPartnerDetails(match.user1, match.user2.preferences.identityPreference);

          io.to(match.user1.socketId).emit('matched', { sessionId: session._id, partner: partner1 });
          io.to(match.user2.socketId).emit('matched', { sessionId: session._id, partner: partner2 });

          console.log(`Matched: ${match.user1.name} ↔ ${match.user2.name}`);
        } catch (err) {
          console.error('Session error:', err);
        }
      }
    });

    socket.on('cancel-search', () => {
      removeFromQueue(socket.user._id);
    });

    socket.on('disconnect', () => {
      removeFromQueue(socket.user._id);
      console.log(`${socket.user.name} disconnected`);
    });
  });

  return io;
};

function findMatch(currentUserId) {
  const current = waitingQueue.find(q => q.userId.equals(currentUserId));
  if (!current) return null;

  for (const other of waitingQueue) {
    if (other.userId.equals(currentUserId)) continue;
    const p1 = current.preferences;
    const p2 = other.preferences;

    const isMatch =
      p1.interviewType === p2.interviewType ||
      p1.difficulty === p2.difficulty ||
      (p1.targetCompany && p1.targetCompany === p2.targetCompany) ||
      p1.preferredLanguage === p2.preferredLanguage;

    if (isMatch) return { user1: current, user2: other };
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