const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const socialRoutes = require('./routes/social');
const profileRoutes = require('./routes/profile');
const timelineRoutes = require('./routes/timeline');
const { initDatabase } = require('./database/db');
const { checkUnlockSchedule } = require('./services/scheduler');
const { authenticateSocket } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend/build')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/timeline', timelineRoutes);


// Socket.IO for real-time features
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);
  
  socket.join(`user_${socket.userId}`);
  
  // Real-time message unlocking
  socket.on('check_unlocks', async () => {
    try {
      const unlockedMessages = await checkUnlockSchedule(socket.userId);
      if (unlockedMessages.length > 0) {
        socket.emit('messages_unlocked', unlockedMessages);
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to check unlocks' });
    }
  });
  
  // Memory collision notifications
  socket.on('join_collision_room', (date) => {
    socket.join(`collision_${date}`);
  });
  
  // Generational thread updates
  socket.on('join_thread', (threadId) => {
    socket.join(`thread_${threadId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Cron jobs for scheduled tasks
cron.schedule('*/5 * * * *', async () => {
  console.log('Running unlock scheduler...');
  try {
    const allUnlocks = await checkUnlockSchedule();
    allUnlocks.forEach(unlock => {
      io.to(`user_${unlock.user_id}`).emit('message_unlocked', unlock);
    });
    

  } catch (error) {
    console.error('Scheduler error:', error);
  }
});

// Memory collision detection (daily at midnight)
cron.schedule('0 0 * * *', async () => {
  console.log('Checking for memory collisions...');
  const { detectCollisions } = require('./services/collisions');
  try {
    const collisions = await detectCollisions();
    collisions.forEach(collision => {
      io.to(`user_${collision.user_id}`).emit('memory_collision', collision);
    });
  } catch (error) {
    console.error('Collision detection error:', error);
  }
});

// Initialize database and start server
const PORT = process.env.PORT || 5000;

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    }
  });
}

initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 EternaNote server running on port ${PORT}`);
    console.log(`📅 Time-locked messaging system active`);
    console.log(`🔐 Encryption and legacy features enabled`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

module.exports = { app, io };