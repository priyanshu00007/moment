const dashboardService = require('../services/dashboardService');
const logger = require('../utils/logger');

// Get complete dashboard data
const getDashboardData = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const dashboardData = await dashboardService.getDashboardData(userId);
    
    res.json({
      success: true,
      data: dashboardData,
      message: 'Dashboard data retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get productivity analytics
const getProductivityAnalytics = async (req, res) => {
  try {
    const { userId } = req.user;
    const { period = 'week' } = req.query;
    
    const analytics = await dashboardService.getProductivityAnalytics(userId, period);
    
    res.json({
      success: true,
      data: analytics,
      period,
      message: 'Productivity analytics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching productivity analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get task insights
const getTaskInsights = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const insights = await dashboardService.getTaskInsights(userId);
    
    res.json({
      success: true,
      data: insights,
      message: 'Task insights retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching task insights:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get focus time analytics
const getFocusTimeAnalytics = async (req, res) => {
  try {
    const { userId } = req.user;
    const { days = 7 } = req.query;
    
    const analytics = await dashboardService.getFocusTimeAnalytics(userId, parseInt(days));
    
    res.json({
      success: true,
      data: analytics,
      message: 'Focus time analytics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching focus time analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getDashboardData,
  getProductivityAnalytics,
  getTaskInsights,
  getFocusTimeAnalytics
};
