const mongoose = require('mongoose');

let isReconnecting = false;

const connectDB = async () => {
  try {
    // Validate MongoDB URI
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Enhanced connection options for stability and performance
    const options = {
      // Use new URL parser
      useNewUrlParser: true,
      useUnifiedTopology: true,
      
      // Connection pool settings
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2,  // Minimum number of connections in the pool
      maxIdleTimeMS: 300000, // Close idle connections after 5 minutes
      
      // Timeout settings - increased for stability
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 0, // Disable socket timeout (let TCP handle it)
      connectTimeoutMS: 30000, // 30 seconds
      
      // Heartbeat and keepalive
      heartbeatFrequencyMS: 10000, // Check server status every 10 seconds
      
      // Retry settings
      retryWrites: true,
      retryReads: true,
      
      // Buffer commands if connection is lost
      bufferCommands: true,
      
      // Family settings for IPv4/IPv6 (can be overridden via env)
      family: process.env.MONGODB_IP_FAMILY ? parseInt(process.env.MONGODB_IP_FAMILY) : 4
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    isReconnecting = false;

    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      // Don't exit, let reconnection logic handle it
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
      
      // Attempt to reconnect if not already reconnecting
      if (!isReconnecting) {
        isReconnecting = true;
        setTimeout(() => {
          console.log('Reconnecting to MongoDB...');
          connectDB().catch((err) => {
            console.error('Failed to reconnect to MongoDB:', err);
            isReconnecting = false;
          });
        }, 5000); // Wait 5 seconds before reconnecting
      }
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
      isReconnecting = false;
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established');
      isReconnecting = false;
    });

  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    
    // Don't exit immediately on first failure, try to reconnect
    if (!isReconnecting) {
      isReconnecting = true;
      console.log('Retrying connection in 10 seconds...');
      setTimeout(() => {
        connectDB().catch((err) => {
          console.error('Failed to reconnect to MongoDB:', err);
          process.exit(1); // Exit only after retry fails
        });
      }, 10000);
    }
  }
};

module.exports = connectDB;
