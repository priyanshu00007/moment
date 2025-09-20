const pomodoroService = require('../services/pomodoroService');
const logger = require('../utils/logger');

// Start pomodoro session
const startSession = async (req, res) => {
  try {
    const { userId } = req.user;
    const sessionData = { ...req.body, userId };
    
    const session = await pomodoroService.startSession(sessionData);
    
    logger.info(`Pomodoro session started by user ${userId}`);
    
    res.status(201).json({
      success: true,
      data: session,
      message: `${session.sessionType} session started successfully`
    });
  } catch (error) {
    logger.error('Error starting pomodoro session:', error);
    
    if (error.message === 'Active session exists') {
      return res.status(400).json({
        success: false,
        message: 'You have an active session running. Please complete or pause it first.',
        code: 'ACTIVE_SESSION_EXISTS'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Complete session
const completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.user;
    const completionData = req.body;
    
    const result = await pomodoroService.completeSession(sessionId, userId, completionData);
    
    if (!result.session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    logger.info(`Pomodoro session completed by user ${userId}`);
    
    res.json({
      success: true,
      data: result.session,
      stats: result.userStats,
      message: 'Session completed successfully'
    });
  } catch (error) {
    logger.error('Error completing session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get active session
const getActiveSession = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const session = await pomodoroService.getActiveSession(userId);
    
    res.json({
      success: true,
      data: session,
      message: session ? 'Active session found' : 'No active session'
    });
  } catch (error) {
    logger.error('Error fetching active session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get session history
const getSessionHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 20, page = 1 } = req.query;
    
    const result = await pomodoroService.getSessionHistory(userId, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });
    
    res.json({
      success: true,
      data: result.sessions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(result.total / parseInt(limit)),
        totalSessions: result.total
      },
      message: 'Session history retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching session history:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get session statistics
const getSessionStats = async (req, res) => {
  try {
    const { userId } = req.user;
    const { period = 'week' } = req.query; // week, month, year
    
    const stats = await pomodoroService.getSessionStats(userId, period);
    
    res.json({
      success: true,
      data: stats,
      period,
      message: 'Session statistics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching session stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Pause session
const pauseSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.user;
    
    const session = await pomodoroService.pauseSession(sessionId, userId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    logger.info(`Session paused by user ${userId}`);
    
    res.json({
      success: true,
      data: session,
      message: 'Session paused successfully'
    });
  } catch (error) {
    logger.error('Error pausing session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  startSession,
  completeSession,
  getActiveSession,
  getSessionHistory,
  getSessionStats,
  pauseSession
};
