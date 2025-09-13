const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Import everything from the models/index.js file
const { sequelize, User, PintSession, ChatMessage } = require('./models');
const userRoutes = require('./routes/users');
const pintSessionRoutes = require('./routes/pintSessions');
const authRoutes = require('./routes/auth');


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your frontend domain
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

async function assertDatabaseConnectionOk() {
  console.log('Checking database connection...');
  try {
    await sequelize.authenticate();
    console.log('Database connection OK! ✅');
  } catch (error) {
    console.log('Unable to connect to the database:');
    console.error(error.message);
    process.exit(1);
  }
}

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user.id;
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.user.displayName} connected with socket ID: ${socket.id}`);

  // Join a session room
  socket.on('joinSessionRoom', async (sessionId) => {
    try {
      // Verify the user is an attendee of this session
      const session = await PintSession.findByPk(sessionId, {
        include: {
          model: User,
          as: 'attendees',
          where: { id: socket.userId },
          required: false
        }
      });

      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Check if user is an attendee or the initiator
      const isAttendee = session.attendees?.some(attendee => attendee.id === socket.userId);
      const isInitiator = session.initiatorId === socket.userId;
      
      if (!isAttendee && !isInitiator) {
        socket.emit('error', { message: 'You are not a member of this session' });
        return;
      }

      socket.join(`session_${sessionId}`);
      socket.currentSessionId = sessionId;
      console.log(`User ${socket.user.displayName} joined room for session ${sessionId}`);
      
      // Notify others in the room
      socket.to(`session_${sessionId}`).emit('userJoinedChat', {
        userId: socket.userId,
        displayName: socket.user.displayName
      });
      
    } catch (error) {
      console.error('Error joining session room:', error);
      socket.emit('error', { message: 'Failed to join session room' });
    }
  });

  // Leave a session room
  socket.on('leaveSessionRoom', (sessionId) => {
    socket.leave(`session_${sessionId}`);
    socket.currentSessionId = null;
    console.log(`User ${socket.user.displayName} left room for session ${sessionId}`);
    
    // Notify others in the room
    socket.to(`session_${sessionId}`).emit('userLeftChat', {
      userId: socket.userId,
      displayName: socket.user.displayName
    });
  });

  // Send a message
  socket.on('sendMessage', async (data) => {
    try {
      const { sessionId, content } = data;
      
      // Validate input
      if (!sessionId || !content || content.trim().length === 0) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      if (content.length > 1000) {
        socket.emit('error', { message: 'Message too long' });
        return;
      }

      // Save message to database
      const message = await ChatMessage.create({
        content: content.trim(),
        senderId: socket.userId,
        sessionId: sessionId
      });

      // Get the message with sender info
      const messageWithSender = await ChatMessage.findByPk(message.id, {
        include: {
          model: User,
          as: 'sender',
          attributes: ['id', 'displayName', 'profilePictureUrl']
        }
      });

      // Broadcast message to all users in the session room
      io.to(`session_${sessionId}`).emit('newMessage', {
        id: messageWithSender.id,
        content: messageWithSender.content,
        createdAt: messageWithSender.createdAt,
        sender: messageWithSender.sender
      });

      console.log(`Message sent in session ${sessionId} by ${socket.user.displayName}`);
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.user.displayName} disconnected`);
    if (socket.currentSessionId) {
      socket.to(`session_${socket.currentSessionId}`).emit('userLeftChat', {
        userId: socket.userId,
        displayName: socket.user.displayName
      });
    }
  });
});

async function init() {
  await assertDatabaseConnectionOk();

  // The 'force: true' option will drop tables before recreating them.
  // Useful in development, but use with caution.
  await sequelize.sync({ force: true });
  console.log('All models were synchronized successfully. 🔄');

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/sessions', pintSessionRoutes);

  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Pint? API! 🍻' });
  });

  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Socket.IO server is ready for connections 🔌');
  });
}

init();