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
app.use('/api/feedback', require('./routes/feedback'));   // <-- Feedback route added

const server = http.createServer(app);

try {
  initSocket(server);
  console.log('Socket.IO initialized');
} catch (err) {
  console.error('Socket.IO init failed:', err);
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