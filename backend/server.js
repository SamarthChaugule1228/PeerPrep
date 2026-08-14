const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initSocket } = require('./socket/socket');
const MatchingService = require('./services/MatchingService');
const MatchingRequest = require('./models/MatchingRequest');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Incoming: ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  console.log('Health check hit');
  res.send('API running');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/experiences', require('./routes/experiences'));
app.use('/api/matching', require('./routes/matching'));

const server = http.createServer(app);

try {
  initSocket(server);
  console.log('Socket.IO initialized');
} catch (err) {
  console.error('Socket.IO init failed:', err);
}

// Initialize background jobs for matching
initializeMatchingJobs();

/**
 * Initialize background jobs for matching
 * - Check for scheduled interview fallbacks every minute
 * - Expire old instant requests every 5 minutes
 */
function initializeMatchingJobs() {
  // Check for scheduled fallbacks every minute
  setInterval(async () => {
    try {
      const now = new Date();
      
      // Find all scheduled requests that are waiting and have reached fallback eligibility
      const fallbackRequests = await MatchingRequest.find({
        type: 'scheduled',
        status: 'waiting',
        fallbackEligibleAt: { $lte: now },
        fallbackAppliedAt: { $exists: false }
      });

      for (const request of fallbackRequests) {
        console.log(`Checking fallback for scheduled request ${request._id}`);
        const result = await MatchingService.applyScheduledFallback(request._id);
        if (result.success) {
          console.log(`Successfully applied fallback for request ${request._id}`);
          // Notify users via Socket.IO
          const { getIO } = require('./socket/socket');
          const io = getIO();
          io.emit('scheduled-fallback-applied', {
            requestId: request._id,
            message: 'Interviewer unavailable. You have been connected with another candidate for peer practice.'
          });
        } else if (result.error) {
          console.log(`Fallback check result: ${result.error}`);
        }
      }
    } catch (err) {
      console.error('Error in scheduled fallback job:', err);
    }
  }, 60 * 1000); // Every minute

  // Expire old instant requests every 5 minutes
  setInterval(async () => {
    try {
      await MatchingService.expireOldRequests(3600); // 1 hour max wait
    } catch (err) {
      console.error('Error in expire requests job:', err);
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  console.log('Matching background jobs initialized');
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on 0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('exit', (code) => {
  console.log(`Process exited with code ${code}`);
});