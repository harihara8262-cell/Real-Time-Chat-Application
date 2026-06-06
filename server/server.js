const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const config = require('./config');
const authRoutes = require('./routes/auth');
const channelRoutes = require('./routes/channels');
const uploadRoutes = require('./routes/upload');
const socketHandler = require('./sockets/chat');
const Channel = require('./models/Channel');
const User = require('./models/User');

// Initialize Express
const app = express();
const server = http.createServer(app);

// CORS configuration matching frontend URL
app.use(cors({
  origin: [config.FRONTEND_URL, 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local uploads folder
app.use('/uploads', express.static(config.UPLOAD_DIR));

// Bind routes
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/upload', uploadRoutes);

// Database Connection & Bootstrapper
mongoose.connect(config.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected Successfully.');

    // Seed Aether AI bot user
    const botUser = await User.findOne({ username: 'aetherai' });
    if (!botUser) {
      const aetherai = new User({
        username: 'aetherai',
        email: 'aetherai@system.com',
        passwordHash: 'seeded_bot_no_login_possible_hash_123',
        displayName: 'Aether AI',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=aetherai',
        status: 'online',
        statusText: 'AI Assistant online and ready!'
      });
      await aetherai.save();
      console.log('Seeded Aether AI bot user.');
    }

    // Seed default public channels if database is blank
    const defaultChannel = await Channel.findOne({ name: 'general', type: 'public' });
    if (!defaultChannel) {
      const general = new Channel({
        name: 'general',
        type: 'public',
        isDirectMessage: false,
        members: []
      });
      await general.save();
      console.log('Seeded default public #general channel.');
    }

    const loungeChannel = await Channel.findOne({ name: 'gaming-lounge', type: 'public' });
    if (!loungeChannel) {
      const lounge = new Channel({
        name: 'gaming-lounge',
        type: 'public',
        isDirectMessage: false,
        members: []
      });
      await lounge.save();
      console.log('Seeded default public #gaming-lounge channel.');
    }
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
  });

// Setup Socket.IO Server
const io = socketio(server, {
  cors: {
    origin: [config.FRONTEND_URL, 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Bind WebSocket handlers
socketHandler(io);

// Express Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error.' });
});

// Boot HTTP Server
server.listen(config.PORT, () => {
  console.log(`=== Aether Chat Core API & Websockets listening on Port ${config.PORT} ===`);
});
