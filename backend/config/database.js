const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://priyanshurathod518_db_user:mQVAwWmZHRhkzIA0@cluster0.8lb6qx3.mongodb.net/momentum_taskmanager?retryWrites=true&w=majority&appName=Cluster0", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');
    
    // Add sample data
    await addSampleTask();
    await addSampleSessions(); // ← Add this line
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const addSampleTask = async () => {
  try {
    const { Task } = require('../models');
    
    const existingTasks = await Task.countDocuments();
    if (existingTasks > 0) {
      console.log('📋 Tasks already exist, skipping sample data');
      return;
    }

    const sampleTask = {
      title: "Complete project proposal",
      description: "Finish the quarterly project proposal",
      userId: "user_31y7PRGeH2Dmn0Tthurn7B4xh8B", // 🔴 CHANGE THIS
      category: "work",
      priority: "high",
      status: "pending",
      completed: false,
      dueDate: new Date().toISOString(),
      estimatedTime: 60,
      energy: "High"
    };

    await Task.create(sampleTask);
    console.log('✅ Sample task added: Complete project proposal');
    
  } catch (error) {
    console.error('❌ Error adding sample task:', error.message);
  }
};

// ← Add this new function
const addSampleSessions = async () => {
  try {
    const { PomodoroSession } = require('../models');
    
    const existingSessions = await PomodoroSession.countDocuments();
    if (existingSessions > 0) {
      console.log('⏰ Sessions already exist, skipping sample data');
      return;
    }

    const sampleSessions = [
      {
        userId: "user_31y7PRGeH2Dmn0Tthurn7B4xh8B", // 🔴 CHANGE THIS
        taskId: null, // No specific task - just focus session
        duration: 3600, // 1 hour in seconds
        startedAt: new Date('2025-09-16T08:00:00.000Z'),
        endedAt: new Date('2025-09-16T09:00:00.000Z')
      },
      {
        userId: "user_31y7PRGeH2Dmn0Tthurn7B4xh8B", // 🔴 CHANGE THIS
        taskId: null,
        duration: 4500, // 1.25 hours
        startedAt: new Date('2025-09-15T10:00:00.000Z'),
        endedAt: new Date('2025-09-15T11:15:00.000Z')
      },
      {
        userId: "user_31y7PRGeH2Dmn0Tthurn7B4xh8B", // 🔴 CHANGE THIS
        taskId: null,
        duration: 5400, // 1.5 hours
        startedAt: new Date('2025-09-14T14:00:00.000Z'),
        endedAt: new Date('2025-09-14T15:30:00.000Z')
      }
    ];

    await PomodoroSession.insertMany(sampleSessions);
    console.log('✅ Sample sessions added:', sampleSessions.length);
    
  } catch (error) {
    console.error('❌ Error adding sample sessions:', error.message);
  }
};

module.exports = connectDB;


// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     await mongoose.connect("mongodb+srv://priyanshurathod518_db_user:mQVAwWmZHRhkzIA0@cluster0.8lb6qx3.mongodb.net/momentum_taskmanager?retryWrites=true&w=majority&appName=Cluster0", {
//       useNewUrlParser: true,
//       useUnifiedTopology: true
//     });
//     console.log('✅ MongoDB connected');
//   } catch (error) {
//     console.error('❌ MongoDB connection failed:', error.message);
//     process.exit(1); // stop server cleanly if DB fails
//   }
// };

// module.exports = connectDB;


// const mongoose = require('mongoose');
// const logger = require('../utils/logger');

// // MongoDB connection configuration
// const connectDB = async () => {
//     try {
//         // Connection options for production and performance
//         const options = {
//             // Connection pool settings
//             maxPoolSize: 10, // Maintain up to 10 socket connections
//             serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
//             socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            
//             // Buffering settings
//             bufferCommands: false, // Disable mongoose buffering
//             bufferMaxEntries: 0, // Disable mongoose buffering
            
//             // Connection behavior
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
            
//             // Additional options
//             maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
//             compressors: 'snappy', // Enable compression
//         };

//         // Connect to MongoDB
//         const conn = await mongoose.connect(
//             process.env.MONGODB_URI || 
//             "mongodb+srv://priyanshurathod518_db_user:mQVAwWmZHRhkzIA0@cluster0.8lb6qx3.mongodb.net/momentum_taskmanager?retryWrites=true&w=majority&appName=Cluster0",
//             options
//         );

//         // Success logging
//         logger.info(`✅ MongoDB Connected Successfully`);
//         logger.info(`📊 Database Host: ${conn.connection.host}`);
//         logger.info(`📁 Database Name: ${conn.connection.name}`);
//         logger.info(`🌍 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
//         logger.info(`⚙️  Connection Pool Size: ${options.maxPoolSize}`);

//         // Connection event listeners for monitoring
//         mongoose.connection.on('connected', () => {
//             logger.info('🔗 Mongoose connected to MongoDB Atlas');
//         });

//         mongoose.connection.on('error', (err) => {
//             logger.error('❌ Mongoose connection error:', err);
//         });

//         mongoose.connection.on('disconnected', () => {
//             logger.warn('🔌 Mongoose disconnected from MongoDB');
//         });

//         mongoose.connection.on('reconnected', () => {
//             logger.info('🔄 Mongoose reconnected to MongoDB');
//         });

//         mongoose.connection.on('close', () => {
//             logger.info('🚪 Mongoose connection closed');
//         });

//         mongoose.connection.on('fullsetup', () => {
//             logger.info('🎯 Mongoose connected to primary and secondary servers');
//         });

//         mongoose.connection.on('all', () => {
//             logger.info('🌐 Mongoose connected to all servers');
//         });

//         // Graceful shutdown handling
//         const gracefulShutdown = async (signal) => {
//             logger.info(`📥 Received ${signal}. Closing MongoDB connection...`);
            
//             try {
//                 await mongoose.connection.close();
//                 logger.info('✅ MongoDB connection closed successfully');
//                 process.exit(0);
//             } catch (error) {
//                 logger.error('❌ Error closing MongoDB connection:', error);
//                 process.exit(1);
//             }
//         };

//         // Handle different termination signals
//         process.on('SIGINT', () => gracefulShutdown('SIGINT'));
//         process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
//         process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));

//         // Handle application termination
//         process.on('beforeExit', async () => {
//             logger.info('🔄 Application is about to exit, closing database connection...');
//             await mongoose.connection.close();
//         });

//         return conn;

//     } catch (error) {
//         logger.error('❌ Database connection failed:', {
//             message: error.message,
//             code: error.code,
//             name: error.name
//         });

//         // Specific error handling
//         if (error.name === 'MongooseServerSelectionError') {
//             logger.error('🌐 MongoDB Atlas connection failed. Please check:');
//             logger.error('   1. Internet connection');
//             logger.error('   2. MongoDB Atlas IP whitelist');
//             logger.error('   3. Database credentials');
//             logger.error('   4. Network access settings');
//         }

//         if (error.code === 8000) {
//             logger.error('🔐 Authentication failed - check username and password');
//         }

//         if (error.code === 6) {
//             logger.error('🌐 DNS resolution failed - check connection string');
//         }

//         // Exit process with failure
//         logger.error('🛑 Shutting down server due to database connection failure');
//         process.exit(1);
//     }
// };

// // Function to check database health
// const checkDBHealth = async () => {
//     try {
//         const state = mongoose.connection.readyState;
//         const states = {
//             0: 'Disconnected',
//             1: 'Connected',
//             2: 'Connecting',
//             3: 'Disconnecting'
//         };

//         if (state === 1) {
//             // Ping database to check if it's responsive
//             await mongoose.connection.db.admin().ping();
//             return {
//                 status: 'healthy',
//                 state: states[state],
//                 host: mongoose.connection.host,
//                 name: mongoose.connection.name,
//                 ping: 'successful'
//             };
//         } else {
//             return {
//                 status: 'unhealthy',
//                 state: states[state]
//             };
//         }
//     } catch (error) {
//         logger.error('Database health check failed:', error);
//         return {
//             status: 'error',
//             error: error.message
//         };
//     }
// };

// // Function to close database connection
// const closeDB = async () => {
//     try {
//         await mongoose.connection.close();
//         logger.info('📤 Database connection closed manually');
//     } catch (error) {
//         logger.error('❌ Error closing database connection:', error);
//         throw error;
//     }
// };

// // Export functions
// module.exports = {
//     connectDB,
//     checkDBHealth,
//     closeDB
// };
