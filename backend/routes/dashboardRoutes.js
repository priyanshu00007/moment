const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(authenticate);

// Dashboard data
router.get('/', dashboardController.getDashboardData);
router.get('/analytics/productivity', dashboardController.getProductivityAnalytics);
router.get('/analytics/tasks', dashboardController.getTaskInsights);
router.get('/analytics/focus', dashboardController.getFocusTimeAnalytics);

module.exports = router;
