const express = require('express');
const router = express.Router();

// Import route modules [17]
const userRoutes = require('./userRoutes');
const taskRoutes = require('./taskRoutes');
const pomodoroRoutes = require('./pomodoroRoutes');
const dashboardRoutes = require('./dashboardRoutes');

// Mount routes
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/pomodoro', pomodoroRoutes);
router.use('/dashboard', dashboardRoutes);

// API info endpoint
router.get('/', (req, res) => {
    res.json({
        message: 'Momentum Task Management API v1',
        version: '1.0.0',
        endpoints: {
            users: '/users',
            tasks: '/tasks', 
            pomodoro: '/pomodoro',
            dashboard: '/dashboard'
        },
        documentation: 'Coming soon...',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
