const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initSocket } = require('./socket/socket');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`Incoming: ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/', (req, res) => {
  console.log('Health check hit');
  res.send('API running');
});

// Routes
app.use('/api/auth', require('./routes/auth'));

const server = http.createServer(app);

try {
  initSocket(server);
  console.log('Socket.IO initialized');
} catch (err) {
  console.error('Socket.IO init failed:', err);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// NEW – log process exit
process.on('exit', (code) => {
  console.log(`Process exited with code ${code}`);
});