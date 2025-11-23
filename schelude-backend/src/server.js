require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const { validateEnv } = require('./utils/envValidator');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Validate environment variables before starting
try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:');
  console.error(error.message);
  process.exit(1);
}

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Apply general rate limiter to all routes
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      // Close database connection
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejection, just log it
});
