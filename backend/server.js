// few new features
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { User, Task, PomodoroSession } = require('./models');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();
console.log("Gemini API Key Loaded:", !!process.env.GEMINI_API_KEY);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// ========== Middleware ==========
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ========== Root & Health ==========
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Focus App Backend Server',
    status: 'Server running successfully!',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api/v1',
      tasks: '/api/v1/tasks',
      sessions: '/api/v1/sessions'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'Connected',
    server: 'Running'
  });
});

// ========== TASK ROUTES ==========
app.get('/api/v1/tasks', async (req, res) => {
  try {
    const { userId, status, category, limit = 50 } = req.query;
    let filter = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    if (category) filter.category = category;

    const tasks = await Task.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit));
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to get tasks", error: err.message });
  }
});

app.post('/api/v1/tasks', async (req, res) => {
  try {
    const newTask = new Task(req.body);
    const savedTask = await newTask.save();
    res.status(201).json({ success: true, message: "Task created successfully!", data: savedTask });
  } catch (err) {
    res.status(400).json({ success: false, message: "Failed to create task", error: err.message });
  }
});


app.get('/api/v1/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to get task", error: err.message });
  }
});

app.put('/api/v1/tasks/:id', async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedTask) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, message: "Task updated successfully", data: updatedTask });
  } catch (err) {
    res.status(400).json({ success: false, message: "Failed to update task", error: err.message });
  }
});

app.delete('/api/v1/tasks/:id', async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, message: "Task deleted successfully", data: deletedTask });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete task", error: err.message });
  }
});

// PATCH - Mark task completed with validation
app.patch('/api/v1/tasks/:id/complete', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (task.estimatedMinutes > 0 && task.workedSeconds < task.estimatedMinutes * 60) {
      return res.status(400).json({
        success: false,
        message: `Minimum ${task.estimatedMinutes} min required before completion`,
        workedMinutes: Math.floor(task.workedSeconds / 60)
      });
    }

    task.status = 'completed';
    task.completedAt = new Date();
    task.progress.percentage = 100;
    await task.save();

    res.json({ success: true, message: "Task completed successfully!", data: task });
  } catch (err) {
    res.status(400).json({ success: false, message: "Failed to complete task", error: err.message });
  }
});

// ========== DEBUG ROUTES ==========
app.get('/api/v1/debug/all-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    const sessions = await PomodoroSession.find({ userId }).sort({ startedAt: -1 });

    res.json({
      success: true,
      userId,
      stats: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        totalSessions: sessions.length,
        totalFocusTime: sessions.reduce((t, s) => t + s.duration, 0)
      },
      tasks,
      sessions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== SESSION ROUTES ==========
app.post('/api/v1/sessions', async (req, res) => {
  try {
    const { userId, taskId, duration, startedAt, endedAt } = req.body;

    const savedSession = await PomodoroSession.create({
      userId,
      taskId,
      duration: parseInt(duration) || 0,
      startedAt: new Date(startedAt),
      endedAt: new Date(endedAt)
    });

    // update task worked time + last worked at
    if (taskId) {
      await Task.findByIdAndUpdate(taskId, {
        $inc: { workedSeconds: parseInt(duration) },
        $set: { lastWorkedAt: endedAt }
      });
    }

    res.status(201).json({ success: true, message: "Focus session recorded successfully!", data: savedSession });
  } catch (err) {
    res.status(400).json({ success: false, message: "Failed to save session", error: err.message });
  }
});

app.get('/api/v1/sessions', async (req, res) => {
  try {
    const { userId, limit = 50 } = req.query;
    const filter = userId ? { userId } : {};
    const sessions = await PomodoroSession.find(filter).populate('taskId', 'title').sort({ startedAt: -1 }).limit(parseInt(limit));
    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to get sessions", error: err.message });
  }
});

// goal tracker 
const { Goal } = require('./models');

app.post('/api/v1/goals', async (req, res) => {
  try {
    const goal = new Goal(req.body);
    await goal.save();
    res.status(201).json({ success: true, data: goal });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/v1/goals', async (req, res) => {
  try {
    const { userId } = req.query;
    const goals = await Goal.find({ userId });
    res.json({ success: true, data: goals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/v1/goals/:id', async (req, res) => {
  try {
    const updated = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/v1/goals/:id', async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});


// ========== Global Error & 404 ==========
app.use((err, req, res, next) => {
  console.error('🚨 Global error:', err);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ========== Start Server ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// // few new features
// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const connectDB = require('./config/database');
// const { User, Task, PomodoroSession } = require('./models');
// const { GoogleGenerativeAI } = require('@google/generative-ai');

// // Load environment variables
// dotenv.config();
// console.log("Gemini API Key Loaded:", !!process.env.GEMINI_API_KEY);

// // Initialize Gemini AI
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// // Connect to database
// connectDB();

// // Initialize Express app
// const app = express();

// // ========== Middleware ==========
// app.use(cors({
//   origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// }));

// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Request logging
// app.use((req, res, next) => {
//   console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path}`);
//   next();
// });

// // ========== Root & Health ==========
// app.get('/', (req, res) => {
//   res.json({
//     message: '🚀 Focus App Backend Server',
//     status: 'Server running successfully!',
//     timestamp: new Date().toISOString(),
//     endpoints: {
//       health: '/health',
//       api: '/api/v1',
//       tasks: '/api/v1/tasks',
//       sessions: '/api/v1/sessions'
//     }
//   });
// });

// app.get('/health', (req, res) => {
//   res.json({
//     status: 'OK',
//     timestamp: new Date().toISOString(),
//     database: 'Connected',
//     server: 'Running'
//   });
// });

// // ========== TASK ROUTES ==========
// app.get('/api/v1/tasks', async (req, res) => {
//   try {
//     const { userId, status, category, limit = 50 } = req.query;
//     let filter = {};
//     if (userId) filter.userId = userId;
//     if (status) filter.status = status;
//     if (category) filter.category = category;

//     const tasks = await Task.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit));
//     res.json({ success: true, count: tasks.length, data: tasks });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Failed to get tasks", error: err.message });
//   }
// });

// app.post('/api/v1/tasks', async (req, res) => {
//   try {
//     const newTask = new Task(req.body);
//     const savedTask = await newTask.save();
//     res.status(201).json({ success: true, message: "Task created successfully!", data: savedTask });
//   } catch (err) {
//     res.status(400).json({ success: false, message: "Failed to create task", error: err.message });
//   }
// });

// app.get('/api/v1/tasks/:id', async (req, res) => {
//   try {
//     const task = await Task.findById(req.params.id);
//     if (!task) return res.status(404).json({ success: false, message: "Task not found" });
//     res.json({ success: true, data: task });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Failed to get task", error: err.message });
//   }
// });

// app.put('/api/v1/tasks/:id', async (req, res) => {
//   try {
//     const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
//     if (!updatedTask) return res.status(404).json({ success: false, message: "Task not found" });
//     res.json({ success: true, message: "Task updated successfully", data: updatedTask });
//   } catch (err) {
//     res.status(400).json({ success: false, message: "Failed to update task", error: err.message });
//   }
// });

// app.delete('/api/v1/tasks/:id', async (req, res) => {
//   try {
//     const deletedTask = await Task.findByIdAndDelete(req.params.id);
//     if (!deletedTask) return res.status(404).json({ success: false, message: "Task not found" });
//     res.json({ success: true, message: "Task deleted successfully", data: deletedTask });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Failed to delete task", error: err.message });
//   }
// });

// app.put('/api/v1/tasks/:id/complete', async (req, res) => {
//   try {
//     const updatedTask = await Task.findByIdAndUpdate(
//       req.params.id,
//       { status: 'completed', completedAt: new Date(), 'progress.percentage': 100 },
//       { new: true }
//     );
//     if (!updatedTask) return res.status(404).json({ success: false, message: "Task not found" });
//     res.json({ success: true, message: "Task completed successfully!", data: updatedTask });
//   } catch (err) {
//     res.status(400).json({ success: false, message: "Failed to complete task", error: err.message });
//   }
// });

// // ========== DEBUG ROUTES ==========
// app.get('/api/v1/debug/all-data/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
//     const sessions = await PomodoroSession.find({ userId }).sort({ startedAt: -1 });

//     res.json({
//       success: true,
//       userId,
//       stats: {
//         totalTasks: tasks.length,
//         completedTasks: tasks.filter(t => t.status === 'completed').length,
//         totalSessions: sessions.length,
//         totalFocusTime: sessions.reduce((t, s) => t + s.duration, 0)
//       },
//       tasks,
//       sessions
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // ========== SESSION ROUTES ==========
// app.post('/api/v1/sessions', async (req, res) => {
//   try {
//     const sessionData = {
//       userId: req.body.userId,
//       taskId: req.body.taskId || null,
//       duration: parseInt(req.body.duration) || 0,
//       startedAt: new Date(req.body.startedAt),
//       endedAt: new Date(req.body.endedAt)
//     };
//     const savedSession = await new PomodoroSession(sessionData).save();
//     res.status(201).json({ success: true, message: "Focus session recorded successfully!", data: savedSession });
//   } catch (err) {
//     res.status(400).json({ success: false, message: "Failed to save session", error: err.message });
//   }
// });

// app.get('/api/v1/sessions', async (req, res) => {
//   try {
//     const { userId, limit = 50 } = req.query;
//     const filter = userId ? { userId } : {};
//     const sessions = await PomodoroSession.find(filter).populate('taskId', 'title').sort({ startedAt: -1 }).limit(parseInt(limit));
//     res.json({ success: true, count: sessions.length, data: sessions });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Failed to get sessions", error: err.message });
//   }
// });

// // ========== Global Error & 404 ==========
// app.use((err, req, res, next) => {
//   console.error('🚨 Global error:', err);
//   res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
// });

// app.use((req, res) => {
//   res.status(404).json({ success: false, message: "Route not found" });
// });

// // ========== Start Server ==========
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);
// });



//old
// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const connectDB = require('./config/database'); // ← Add database connection
// const { User, Task, PomodoroSession } = require('./models'); // ← Import all models
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// const genAI = new GoogleGenerativeAI("AIzaSyAMj190m7u1va-z76V0vfSu9jX0Xlo7RqY");

// require('dotenv').config();
// console.log("Gemini API Key Loaded:", !!process.env.GEMINI_API_KEY); // Should print true

// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// // Load environment variables
// dotenv.config();

// // Connect to database
// connectDB(); // ← Initialize database connection

// // Initialize Express app
// const app = express();

// // CORS Configuration
// app.use(cors({
//   origin: [
//     'http://localhost:3000', 
//     'http://localhost:3001',
//     'http://127.0.0.1:3000'
//   ],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// }));

// // Middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Add request logging
// app.use((req, res, next) => {
//   console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path}`);
//   next();
// });

// // ✅ Root endpoint
// app.get('/', (req, res) => {
//   res.json({ 
//     message: '🚀 Focus App Backend Server',
//     status: 'Server running successfully!',
//     timestamp: new Date().toISOString(),
//     endpoints: {
//       health: '/health',
//       api: '/api/v1',
//       tasks: '/api/v1/tasks',
//       sessions: '/api/v1/sessions' // ← Add sessions endpoint
//     }
//   });
// });

// // ✅ Health check
// app.get('/health', (req, res) => {
//   res.json({
//     status: 'OK',
//     timestamp: new Date().toISOString(),
//     database: 'Connected',
//     server: 'Running'
//   });
// });

// // ============ TASK ROUTES ============

// // ✅ GET all tasks
// // In your backend/server.js - update the GET tasks route:
// app.get('/api/v1/tasks', async (req, res) => {
//   try {
//     const { userId, status, category, limit = 50 } = req.query;
//     console.log('📋 Fetching tasks for user:', userId);
    
//     let filter = {};
//     if (userId) filter.userId = userId;
//     if (status) filter.status = status;
//     if (category) filter.category = category;
    
//     const tasks = await Task.find(filter)
//       .sort({ createdAt: -1 })
//       .limit(parseInt(limit));
      
//     console.log(`✅ Found ${tasks.length} tasks`);
//     console.log('📋 Task data:', JSON.stringify(tasks, null, 2)); // ← Add this line
      
//     res.json({ 
//       success: true, 
//       count: tasks.length,
//       data: tasks,
//       message: 'Tasks retrieved successfully'
//     });
//   } catch (err) {
//     console.error('❌ Error fetching tasks:', err);
//     res.status(500).json({ 
//       success: false, 
//       message: "Failed to get tasks", 
//       error: err.message 
//     });
//   }
// });

// // ✅ POST create new task
// app.post('/api/v1/tasks', async (req, res) => {
//   try {
//     console.log('📝 Creating new task:', req.body);
    
//     const newTask = new Task(req.body);
//     const savedTask = await newTask.save();
    
//     console.log('✅ Task created:', savedTask.title);
    
//     res.status(201).json({ 
//       success: true, 
//       message: "Task created successfully!", 
//       data: savedTask 
//     });
//   } catch (err) {
//     console.error('❌ Error creating task:', err);
//     res.status(400).json({ 
//       success: false, 
//       message: "Failed to create task", 
//       error: err.message 
//     });
//   }
// });

// // ✅ GET single task by ID
// app.get('/api/v1/tasks/:id', async (req, res) => {
//   try {
//     const task = await Task.findById(req.params.id);
    
//     if (!task) {
//       return res.status(404).json({
//         success: false,
//         message: "Task not found"
//       });
//     }
    
//     res.json({ 
//       success: true, 
//       data: task,
//       message: 'Task retrieved successfully'
//     });
//   } catch (err) {
//     console.error('❌ Error fetching task:', err);
//     res.status(500).json({ 
//       success: false, 
//       message: "Failed to get task", 
//       error: err.message 
//     });
//   }
// });

// // ✅ PUT update task
// app.put('/api/v1/tasks/:id', async (req, res) => {
//   try {
//     console.log('🔄 Updating task:', req.params.id, req.body);
    
//     const updatedTask = await Task.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true, runValidators: true }
//     );
    
//     if (!updatedTask) {
//       return res.status(404).json({
//         success: false,
//         message: "Task not found"
//       });
//     }
    
//     console.log('✅ Task updated:', updatedTask.title);
    
//     res.json({ 
//       success: true, 
//       message: "Task updated successfully",
//       data: updatedTask 
//     });
//   } catch (err) {
//     console.error('❌ Error updating task:', err);
//     res.status(400).json({ 
//       success: false, 
//       message: "Failed to update task", 
//       error: err.message 
//     });
//   }
// });

// // ✅ DELETE task
// app.delete('/api/v1/tasks/:id', async (req, res) => {
//   try {
//     console.log('🗑️ Deleting task:', req.params.id);
    
//     const deletedTask = await Task.findByIdAndDelete(req.params.id);
    
//     if (!deletedTask) {
//       return res.status(404).json({
//         success: false,
//         message: "Task not found"
//       });
//     }
    
//     console.log('✅ Task deleted:', deletedTask.title);
    
//     res.json({ 
//       success: true, 
//       message: "Task deleted successfully",
//       data: deletedTask 
//     });
//   } catch (err) {
//     console.error('❌ Error deleting task:', err);
//     res.status(500).json({ 
//       success: false, 
//       message: "Failed to delete task", 
//       error: err.message 
//     });
//   }
// });

// // ✅ PUT complete task
// app.put('/api/v1/tasks/:id/complete', async (req, res) => {
//   try {
//     console.log('✅ Completing task:', req.params.id);
    
//     const updatedTask = await Task.findByIdAndUpdate(
//       req.params.id,
//       { 
//         status: 'completed',
//         completedAt: new Date(),
//         'progress.percentage': 100
//       },
//       { new: true }
//     );
    
//     if (!updatedTask) {
//       return res.status(404).json({
//         success: false,
//         message: "Task not found"
//       });
//     }
    
//     console.log('✅ Task completed:', updatedTask.title);
    
//     res.json({ 
//       success: true, 
//       message: "Task completed successfully!",
//       data: updatedTask 
//     });
//   } catch (err) {
//     console.error('❌ Error completing task:', err);
//     res.status(400).json({ 
//       success: false, 
//       message: "Failed to complete task", 
//       error: err.message 
//     });
//   }
// });
// //new added 
// app.get('/api/v1/debug/tasks/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    
//     console.log(`📋 Found ${tasks.length} tasks for user: ${userId}`);
//     tasks.forEach((task, index) => {
//       console.log(`   ${index + 1}. ${task.title} (${task.status}) - ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}`);
//     });
    
//     res.json({
//       success: true,
//       userId: userId,
//       count: tasks.length,
//       tasks: tasks
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// app.get('/api/v1/debug/sessions/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const sessions = await PomodoroSession.find({ userId }).sort({ startedAt: -1 });
    
//     console.log(`⏰ Found ${sessions.length} sessions for user: ${userId}`);
//     sessions.forEach((session, index) => {
//       const duration = Math.round(session.duration / 60);
//       const date = new Date(session.startedAt).toLocaleDateString();
//       console.log(`   ${index + 1}. ${duration}min session on ${date}`);
//     });
    
//     res.json({
//       success: true,
//       userId: userId,
//       count: sessions.length,
//       totalFocusTime: sessions.reduce((total, s) => total + s.duration, 0),
//       sessions: sessions
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// app.get('/api/v1/debug/all-data/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
    
//     const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
//     const sessions = await PomodoroSession.find({ userId }).sort({ startedAt: -1 });
    
//     const stats = {
//       totalTasks: tasks.length,
//       completedTasks: tasks.filter(t => t.status === 'completed').length,
//       totalSessions: sessions.length,
//       totalFocusTime: sessions.reduce((total, s) => total + s.duration, 0),
//       totalFocusHours: Math.round(sessions.reduce((total, s) => total + s.duration, 0) / 3600 * 10) / 10
//     };
    
//     console.log('📊 User Data Summary:');
//     console.log(`   👤 User: ${userId}`);
//     console.log(`   📋 Tasks: ${stats.totalTasks} (${stats.completedTasks} completed)`);
//     console.log(`   ⏰ Sessions: ${stats.totalSessions}`);
//     console.log(`   🕐 Focus Time: ${stats.totalFocusHours} hours`);
    
//     res.json({
//       success: true,
//       userId: userId,
//       stats: stats,
//       tasks: tasks,
//       sessions: sessions
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });
// // ============ POMODORO SESSION ROUTES ============

// // ✅ POST create new pomodoro session
// app.post('/api/v1/sessions', async (req, res) => {
//   try {
//     console.log('⏰ Creating new session:', req.body);
    
//     const sessionData = {
//       userId: req.body.userId,
//       taskId: req.body.taskId || null,
//       duration: parseInt(req.body.duration) || 0,
//       startedAt: new Date(req.body.startedAt),
//       endedAt: new Date(req.body.endedAt)
//     };

//     const newSession = new PomodoroSession(sessionData);
//     const savedSession = await newSession.save();
    
//     console.log('✅ Session saved:', {
//       duration: `${Math.round(savedSession.duration / 60)}min`,
//       userId: savedSession.userId,
//       taskId: savedSession.taskId
//     });
    
//     res.status(201).json({ 
//       success: true, 
//       message: "Focus session recorded successfully!", 
//       data: savedSession 
//     });
//   } catch (err) {
//     console.error('❌ Session save error:', err);
//     res.status(400).json({ 
//       success: false, 
//       message: "Failed to save focus session",
//       error: err.message 
//     });
//   }
// });

// // ✅ GET all sessions for a user
// app.get('/api/v1/sessions', async (req, res) => {
//   try {
//     const { userId, limit = 50, startDate, endDate } = req.query;
//     console.log('📊 Fetching sessions for user:', userId);
    
//     let filter = {};
//     if (userId) filter.userId = userId;
    
//     // Optional date range filtering
//     if (startDate || endDate) {
//       filter.startedAt = {};
//       if (startDate) filter.startedAt.$gte = new Date(startDate);
//       if (endDate) filter.startedAt.$lte = new Date(endDate);
//     }
    
//     const sessions = await PomodoroSession.find(filter)
//       .populate('taskId', 'title description')
//       .sort({ startedAt: -1 })
//       .limit(parseInt(limit));
      
//     console.log(`✅ Found ${sessions.length} sessions`);
      
//     res.json({ 
//       success: true, 
//       count: sessions.length,
//       data: sessions,
//       message: 'Sessions retrieved successfully'
//     });
//   } catch (err) {
//     console.error('❌ Error fetching sessions:', err);
//     res.status(500).json({ 
//       success: false, 
//       message: "Failed to get sessions", 
//       error: err.message 
//     });
//   }
// });

// // ✅ GET session statistics for a user
// app.get('/api/v1/sessions/stats/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     console.log('📈 Fetching session stats for user:', userId);
    
//     const sessions = await PomodoroSession.find({ userId });
    
//     const stats = {
//       totalSessions: sessions.length,
//       totalFocusTime: sessions.reduce((total, session) => total + session.duration, 0), // in seconds
//       averageSessionLength: sessions.length > 0 
//         ? Math.round(sessions.reduce((total, session) => total + session.duration, 0) / sessions.length)
//         : 0,
//       longestSession: sessions.length > 0
//         ? Math.max(...sessions.map(session => session.duration))
//         : 0,
//       sessionsThisWeek: sessions.filter(session => {
//         const weekAgo = new Date();
//         weekAgo.setDate(weekAgo.getDate() - 7);
//         return new Date(session.startedAt) >= weekAgo;
//       }).length,
//       sessionsToday: sessions.filter(session => {
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         const tomorrow = new Date(today);
//         tomorrow.setDate(today.getDate() + 1);
//         const sessionDate = new Date(session.startedAt);
//         return sessionDate >= today && sessionDate < tomorrow;
//       }).length
//     };
    
//     console.log('✅ Session stats calculated:', {
//       totalSessions: stats.totalSessions,
//       totalFocusTime: `${Math.round(stats.totalFocusTime / 60)}min`
//     });
    
//     res.json({ 
//       success: true, 
//       data: stats,
//       message: 'Session statistics retrieved successfully'
//     });
//   } catch (err) {
//     console.error('❌ Error fetching session stats:', err);
//     res.status(500).json({ 
//       success: false, 
//       message: "Failed to get session statistics", 
//       error: err.message 
//     });
//   }
// });
// app.get('/api/v1/debug/tasks/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    
//     console.log(`📋 Found ${tasks.length} tasks for user: ${userId}`);
//     tasks.forEach((task, index) => {
//       console.log(`   ${index + 1}. ${task.title} (${task.status}) - ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}`);
//     });
    
//     res.json({
//       success: true,
//       userId: userId,
//       count: tasks.length,
//       tasks: tasks
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// app.get('/api/v1/debug/tasks/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    
//     console.log(`📋 Found ${tasks.length} tasks for user: ${userId}`);
//     tasks.forEach((task, index) => {
//       console.log(`   ${index + 1}. ${task.title} (${task.status}) - ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}`);
//     });
    
//     res.json({
//       success: true,
//       userId: userId,
//       count: tasks.length,
//       tasks: tasks
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error('🚨 Global error:', err);
//   res.status(500).json({
//     success: false,
//     message: 'Internal server error',
//     error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
//   });
// });



// // 404 handler
// app.use((err, req, res, next) => {
//   console.error('🚨 Global error:', err);
//   res.status(500).json({
//     success: false,
//     message: 'Internal server error',
//     error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
//   });
// });
// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log('🚀 ================================');
//   console.log('🚀 FOCUS APP BACKEND SERVER');
//   console.log('🚀 ================================');
//   console.log(`✅ Server running on port ${PORT}`);
//   console.log(`🌐 Server URL: http://localhost:${PORT}`);
//   console.log(`📋 API Base: http://localhost:${PORT}/api/v1`);
//   console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
//   console.log(`📝 Tasks API: http://localhost:${PORT}/api/v1/tasks`);
//   console.log(`⏰ Sessions API: http://localhost:${PORT}/api/v1/sessions`);
//   console.log('🚀 ================================');
// });

// // Graceful shutdown
// process.on('SIGINT', () => {
//   console.log('\n🛑 Shutting down server gracefully...');
//   process.exit(0);
// });
