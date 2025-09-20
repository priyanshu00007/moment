const { User, Task, PomodoroSession } = require('../models');
const logger = require('../utils/logger');

class DashboardService {
  // Get complete dashboard data
  async getDashboardData(userId) {
    try {
      const user = await User.findOne({ userId }).select('stats quickStats dailyStats progress recentActivity preferences');
      
      if (!user) {
        throw new Error('User not found');
      }

      // Get today's tasks
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayTasks = await Task.find({
        userId,
        $or: [
          { dueDate: { $gte: today, $lt: tomorrow } },
          { createdAt: { $gte: today, $lt: tomorrow } }
        ]
      }).sort({ order: 1 });

      // Get overdue tasks
      const overdueTasks = await Task.find({
        userId,
        dueDate: { $lt: today },
        status: { $ne: 'completed' }
      }).sort({ dueDate: 1 });

      // Get active pomodoro session
      const activeSession = await PomodoroSession.findOne({
        userId,
        completed: false
      }).populate('taskId');

      // Prepare dashboard data
      const dashboardData = {
        user: {
          name: user.name,
          level: user.progress.level,
          xp: user.progress.xp,
          nextLevelXP: user.progress.nextLevelXP,
          levelProgress: user.progress.levelProgress
        },
        todayOverview: {
          tasks: {
            total: todayTasks.length,
            completed: todayTasks.filter(task => task.status === 'completed').length,
            inProgress: todayTasks.filter(task => task.status === 'in-progress').length,
            pending: todayTasks.filter(task => task.status === 'pending').length
          },
          overdue: overdueTasks.length,
          focusTime: user.quickStats.thisWeekFocus
        },
        stats: {
          currentStreak: user.stats.currentStreak,
          longestStreak: user.stats.longestStreak,
          totalTasksCompleted: user.stats.totalTasksCompleted,
          totalFocusTime: user.stats.totalFocusTime,
          totalPomodoroSessions: user.stats.totalPomodoroSessions,
          completionRate: user.stats.completionRate
        },
        recentActivity: user.recentActivity.slice(0, 5),
        activeSession,
        todayTasks: todayTasks.slice(0, 10), // Top 10 tasks
        overdueTasks: overdueTasks.slice(0, 5), // Top 5 overdue
        weeklyChart: user.dailyStats.slice(-7),
        preferences: user.preferences
      };

      logger.info(`Dashboard service: Retrieved dashboard data for user ${userId}`);
      return dashboardData;
    } catch (error) {
      logger.error('Dashboard service: Error fetching dashboard data:', error);
      throw error;
    }
  }

  // Get productivity analytics
  async getProductivityAnalytics(userId, period = 'week') {
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
      }

      // Get tasks analytics
      const tasks = await Task.find({
        userId,
        createdAt: { $gte: startDate }
      });

      const completedTasks = tasks.filter(task => task.status === 'completed');

      // Get pomodoro analytics
      const sessions = await PomodoroSession.find({
        userId,
        startTime: { $gte: startDate },
        completed: true
      });

      const analytics = {
        period,
        tasks: {
          total: tasks.length,
          completed: completedTasks.length,
          completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
          byCategory: this.groupTasksByCategory(tasks),
          byPriority: this.groupTasksByPriority(tasks)
        },
        focus: {
          totalSessions: sessions.length,
          totalTime: sessions.reduce((sum, session) => sum + session.actualDuration, 0),
          averageSessionTime: sessions.length > 0 
            ? Math.round(sessions.reduce((sum, session) => sum + session.actualDuration, 0) / sessions.length)
            : 0,
          averageProductivity: sessions.length > 0
            ? Math.round(sessions.reduce((sum, session) => sum + session.productivity, 0) / sessions.length * 10) / 10
            : 0
        },
        trends: {
          dailyTaskCompletion: this.getDailyTaskCompletion(completedTasks, period),
          dailyFocusTime: this.getDailyFocusTime(sessions, period)
        }
      };

      return analytics;
    } catch (error) {
      logger.error('Dashboard service: Error fetching productivity analytics:', error);
      throw error;
    }
  }

  // Get task insights
  async getTaskInsights(userId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const tasks = await Task.find({
        userId,
        createdAt: { $gte: thirtyDaysAgo }
      });

      const completedTasks = tasks.filter(task => task.status === 'completed');
      
      const insights = {
        mostProductiveDay: this.getMostProductiveDay(completedTasks),
        averageCompletionTime: this.getAverageCompletionTime(completedTasks),
        categoryPerformance: this.getCategoryPerformance(tasks),
        timeEstimationAccuracy: this.getTimeEstimationAccuracy(completedTasks),
        recommendations: this.generateRecommendations(tasks, completedTasks)
      };

      return insights;
    } catch (error) {
      logger.error('Dashboard service: Error fetching task insights:', error);
      throw error;
    }
  }

  // Get focus time analytics
  async getFocusTimeAnalytics(userId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const sessions = await PomodoroSession.find({
        userId,
        startTime: { $gte: startDate },
        completed: true
      });

      const analytics = {
        totalFocusTime: sessions.reduce((sum, session) => sum + session.actualDuration, 0),
        averageDailyFocus: Math.round(sessions.reduce((sum, session) => sum + session.actualDuration, 0) / days),
        focusTimeByHour: this.getFocusTimeByHour(sessions),
        productivityTrend: this.getProductivityTrend(sessions),
        bestFocusHours: this.getBestFocusHours(sessions)
      };

      return analytics;
    } catch (error) {
      logger.error('Dashboard service: Error fetching focus time analytics:', error);
      throw error;
    }
  }

  // Helper methods
  groupTasksByCategory(tasks) {
    const categories = { work: 0, study: 0, personal: 0 };
    tasks.forEach(task => {
      categories[task.category] = (categories[task.category] || 0) + 1;
    });
    return categories;
  }

  groupTasksByPriority(tasks) {
    const priorities = { low: 0, medium: 0, high: 0, urgent: 0 };
    tasks.forEach(task => {
      priorities[task.priority] = (priorities[task.priority] || 0) + 1;
    });
    return priorities;
  }

  getDailyTaskCompletion(tasks, period) {
    const dailyMap = {};
    tasks.forEach(task => {
      const day = task.completedAt.toISOString().split('T')[0];
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    });
    return dailyMap;
  }

  getDailyFocusTime(sessions, period) {
    const dailyMap = {};
    sessions.forEach(session => {
      const day = session.startTime.toISOString().split('T')[0];
      dailyMap[day] = (dailyMap[day] || 0) + session.actualDuration;
    });
    return dailyMap;
  }

  getMostProductiveDay(tasks) {
    const dayCount = {};
    tasks.forEach(task => {
      const day = task.completedAt.getDay();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
      dayCount[dayName] = (dayCount[dayName] || 0) + 1;
    });
    
    return Object.keys(dayCount).reduce((a, b) => dayCount[a] > dayCount[b] ? a : b, 'Monday');
  }

  getAverageCompletionTime(tasks) {
    const tasksWithTime = tasks.filter(task => task.estimatedTime && task.actualTime);
    if (tasksWithTime.length === 0) return 0;
    
    return Math.round(tasksWithTime.reduce((sum, task) => sum + task.actualTime, 0) / tasksWithTime.length);
  }

  getCategoryPerformance(tasks) {
    const performance = {};
    ['work', 'study', 'personal'].forEach(category => {
      const categoryTasks = tasks.filter(task => task.category === category);
      const completed = categoryTasks.filter(task => task.status === 'completed').length;
      performance[category] = {
        total: categoryTasks.length,
        completed,
        rate: categoryTasks.length > 0 ? Math.round((completed / categoryTasks.length) * 100) : 0
      };
    });
    return performance;
  }

  getTimeEstimationAccuracy(tasks) {
    const tasksWithBothTimes = tasks.filter(task => task.estimatedTime && task.actualTime);
    if (tasksWithBothTimes.length === 0) return 0;
    
    const accuracySum = tasksWithBothTimes.reduce((sum, task) => {
      const accuracy = Math.min(task.estimatedTime, task.actualTime) / Math.max(task.estimatedTime, task.actualTime);
      return sum + accuracy;
    }, 0);
    
    return Math.round((accuracySum / tasksWithBothTimes.length) * 100);
  }

  generateRecommendations(allTasks, completedTasks) {
    const recommendations = [];
    
    // Completion rate recommendation
    const completionRate = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0;
    if (completionRate < 70) {
      recommendations.push({
        type: 'completion_rate',
        message: 'Try breaking down larger tasks into smaller, manageable subtasks',
        priority: 'high'
      });
    }
    
    // Category balance recommendation
    const categoryStats = this.getCategoryPerformance(allTasks);
    const totalTasks = Object.values(categoryStats).reduce((sum, cat) => sum + cat.total, 0);
    const workPercentage = totalTasks > 0 ? (categoryStats.work.total / totalTasks) * 100 : 0;
    
    if (workPercentage > 80) {
      recommendations.push({
        type: 'work_life_balance',
        message: 'Consider adding more personal tasks to maintain work-life balance',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  getFocusTimeByHour(sessions) {
    const hourlyFocus = {};
    for (let hour = 0; hour < 24; hour++) {
      hourlyFocus[hour] = 0;
    }
    
    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      hourlyFocus[hour] += session.actualDuration;
    });
    
    return hourlyFocus;
  }

  getProductivityTrend(sessions) {
    const dailyProductivity = {};
    sessions.forEach(session => {
      const day = session.startTime.toISOString().split('T')[0];
      if (!dailyProductivity[day]) {
        dailyProductivity[day] = { total: 0, count: 0 };
      }
      dailyProductivity[day].total += session.productivity;
      dailyProductivity[day].count += 1;
    });
    
    Object.keys(dailyProductivity).forEach(day => {
      dailyProductivity[day] = Math.round(dailyProductivity[day].total / dailyProductivity[day].count * 10) / 10;
    });
    
    return dailyProductivity;
  }

  getBestFocusHours(sessions) {
    const hourlyProductivity = {};
    for (let hour = 0; hour < 24; hour++) {
      hourlyProductivity[hour] = { total: 0, count: 0 };
    }
    
    sessions.forEach(session => {
      const hour = session.startTime.getHours();
      hourlyProductivity[hour].total += session.productivity;
      hourlyProductivity[hour].count += 1;
    });
    
    const avgProductivityByHour = {};
    Object.keys(hourlyProductivity).forEach(hour => {
      const data = hourlyProductivity[hour];
      avgProductivityByHour[hour] = data.count > 0 ? data.total / data.count : 0;
    });
    
    // Return top 3 hours
    return Object.entries(avgProductivityByHour)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour, productivity]) => ({
        hour: parseInt(hour),
        productivity: Math.round(productivity * 10) / 10
      }));
  }
}

module.exports = new DashboardService();
