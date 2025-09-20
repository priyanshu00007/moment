const { PomodoroSession, User } = require('../models');
const logger = require('../utils/logger');

class PomodoroService {
  // Start new session
  async startSession(sessionData) {
    try {
      // Check for active session
      const activeSession = await PomodoroSession.findOne({
        userId: sessionData.userId,
        completed: false
      });

      if (activeSession) {
        throw new Error('Active session exists');
      }

      const session = new PomodoroSession({
        ...sessionData,
        startTime: new Date()
      });

      await session.save();

      // Update user's current session
      await User.findOneAndUpdate(
        { userId: sessionData.userId },
        {
          'quickStats.currentPomodoroSession': {
            isActive: true,
            taskId: sessionData.taskId,
            startTime: new Date(),
            duration: sessionData.plannedDuration,
            type: sessionData.sessionType
          }
        }
      );

      logger.info(`Pomodoro service: Started session for user ${sessionData.userId}`);
      return session;
    } catch (error) {
      logger.error('Pomodoro service: Error starting session:', error);
      throw error;
    }
  }

  // Complete session
  async completeSession(sessionId, userId, completionData) {
    try {
      const session = await PomodoroSession.findOneAndUpdate(
        { _id: sessionId, userId },
        {
          completed: true,
          endTime: new Date(),
          actualDuration: completionData.actualDuration,
          productivity: completionData.productivity,
          notes: completionData.notes
        },
        { new: true }
      );

      if (!session) {
        return { session: null, userStats: null };
      }

      // Update user stats
      const user = await User.findOne({ userId });
      if (user) {
        user.stats.totalFocusTime += completionData.actualDuration;
        user.stats.totalPomodoroSessions += 1;
        user.quickStats.currentPomodoroSession.isActive = false;

        user.updateDailyStats(new Date(), {
          focusTime: completionData.actualDuration,
          pomodoroSessions: 1
        });

        user.addRecentActivity({
          type: 'pomodoro_session',
          description: `Completed ${session.sessionType} session (${completionData.actualDuration}min)`,
          taskId: session.taskId
        });

        await user.save();

        logger.info(`Pomodoro service: Completed session for user ${userId}`);
        return { session, userStats: user.stats };
      }

      return { session, userStats: null };
    } catch (error) {
      logger.error('Pomodoro service: Error completing session:', error);
      throw error;
    }
  }

  // Get active session
  async getActiveSession(userId) {
    try {
      const session = await PomodoroSession.findOne({
        userId,
        completed: false
      }).populate('taskId');

      return session;
    } catch (error) {
      logger.error('Pomodoro service: Error fetching active session:', error);
      throw error;
    }
  }

  // Get session history
  async getSessionHistory(userId, options = {}) {
    try {
      const { limit = 20, skip = 0 } = options;

      const sessions = await PomodoroSession.find({ userId })
        .sort({ startTime: -1 })
        .limit(limit)
        .skip(skip)
        .populate('taskId');

      const total = await PomodoroSession.countDocuments({ userId });

      return { sessions, total };
    } catch (error) {
      logger.error('Pomodoro service: Error fetching session history:', error);
      throw error;
    }
  }

  // Get session statistics
  async getSessionStats(userId, period = 'week') {
    try {
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const sessions = await PomodoroSession.find({
        userId,
        startTime: { $gte: startDate },
        completed: true
      });

      const stats = {
        totalSessions: sessions.length,
        totalFocusTime: sessions.reduce((sum, session) => sum + session.actualDuration, 0),
        averageSessionTime: sessions.length > 0 
          ? Math.round(sessions.reduce((sum, session) => sum + session.actualDuration, 0) / sessions.length)
          : 0,
        averageProductivity: sessions.length > 0
          ? Math.round(sessions.reduce((sum, session) => sum + session.productivity, 0) / sessions.length)
          : 0,
        sessionsByType: {
          work: sessions.filter(s => s.sessionType === 'work').length,
          shortBreak: sessions.filter(s => s.sessionType === 'short-break').length,
          longBreak: sessions.filter(s => s.sessionType === 'long-break').length
        },
        dailyBreakdown: this.groupSessionsByDay(sessions)
      };

      return stats;
    } catch (error) {
      logger.error('Pomodoro service: Error fetching session stats:', error);
      throw error;
    }
  }

  // Helper method to group sessions by day
  groupSessionsByDay(sessions) {
    const dayMap = {};
    
    sessions.forEach(session => {
      const day = session.startTime.toISOString().split('T')[0];
      if (!dayMap[day]) {
        dayMap[day] = {
          date: day,
          sessions: 0,
          focusTime: 0
        };
      }
      dayMap[day].sessions += 1;
      dayMap[day].focusTime += session.actualDuration;
    });

    return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  }

  // Pause session
  async pauseSession(sessionId, userId) {
    try {
      const session = await PomodoroSession.findOne({ _id: sessionId, userId });
      
      if (!session) {
        return null;
      }

      // Calculate time spent so far
      const timeSpent = Math.floor((new Date() - session.startTime) / 60000); // in minutes
      
      const updatedSession = await PomodoroSession.findByIdAndUpdate(
        sessionId,
        { 
          actualDuration: timeSpent,
          endTime: new Date()
        },
        { new: true }
      );

      // Update user's current session status
      await User.findOneAndUpdate(
        { userId },
        { 'quickStats.currentPomodoroSession.isActive': false }
      );

      logger.info(`Pomodoro service: Paused session for user ${userId}`);
      return updatedSession;
    } catch (error) {
      logger.error('Pomodoro service: Error pausing session:', error);
      throw error;
    }
  }
}

module.exports = new PomodoroService();
