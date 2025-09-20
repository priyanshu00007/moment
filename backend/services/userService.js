const { User } = require('../models');
const logger = require('../utils/logger');

class UserService {
    // Create new user [12]
    async createUser(userData) {
        try {
            const user = new User(userData);
            
            // Initialize default dashboard widgets
            user.preferences.dashboard.widgets = [
                { type: 'tasks-today', position: { row: 0, col: 0 }, visible: true },
                { type: 'focus-timer', position: { row: 0, col: 1 }, visible: true },
                { type: 'streak-counter', position: { row: 1, col: 0 }, visible: true },
                { type: 'productivity-chart', position: { row: 1, col: 1 }, visible: true }
            ];
            
            await user.save();
            
            logger.info(`User service: Created user ${user.email}`);
            
            // Remove sensitive data before returning
            const userResponse = user.toObject();
            delete userResponse.__v;
            
            return userResponse;
        } catch (error) {
            logger.error('User service: Error creating user:', error);
            throw error;
        }
    }

    // Get user by ID
    async getUserById(userId) {
        try {
            const user = await User.findOne({ userId }).select('-__v');
            
            if (!user) {
                logger.warn(`User service: User not found: ${userId}`);
                return null;
            }
            
            return user;
        } catch (error) {
            logger.error('User service: Error fetching user:', error);
            throw error;
        }
    }

    // Update user
    async updateUser(userId, updateData) {
        try {
            const user = await User.findOneAndUpdate(
                { userId },
                { 
                    ...updateData,
                    'account.lastLogin': new Date()
                },
                { 
                    new: true,
                    select: '-__v'
                }
            );

            if (user) {
                logger.info(`User service: Updated user ${userId}`);
            }

            return user;
        } catch (error) {
            logger.error('User service: Error updating user:', error);
            throw error;
        }
    }

    // Complete onboarding
    async completeOnboarding(userId, onboardingData) {
        try {
            const user = await User.findOneAndUpdate(
                { userId },
                {
                    onboarding: { ...onboardingData, isCompleted: true }
                },
                { new: true, select: '-__v' }
            );

            if (user) {
                logger.info(`User service: Completed onboarding for ${userId}`);
            }

            return user;
        } catch (error) {
            logger.error('User service: Error completing onboarding:', error);
            throw error;
        }
    }

    // Get dashboard statistics
    async getDashboardStats(userId) {
        try {
            const user = await User.findOne({ userId }).select('stats quickStats dailyStats progress');
            
            if (!user) {
                throw new Error('User not found');
            }

            // Calculate additional metrics
            const stats = {
                overview: {
                    totalXP: user.progress.xp,
                    currentLevel: user.progress.level,
                    currentStreak: user.stats.currentStreak,
                    longestStreak: user.stats.longestStreak
                },
                today: user.quickStats.todayTasks,
                thisWeek: {
                    focusTime: user.quickStats.thisWeekFocus,
                    tasksCompleted: user.stats.weeklyGoals.tasksCompleted,
                    tasksTarget: user.stats.weeklyGoals.tasksTarget
                },
                recentActivity: user.recentActivity || [],
                dailyChart: user.dailyStats.slice(-7) // Last 7 days
            };

            logger.info(`User service: Retrieved dashboard stats for ${userId}`);

            return stats;
        } catch (error) {
            logger.error('User service: Error fetching dashboard stats:', error);
            throw error;
        }
    }

    // Update user statistics
    async updateUserStats(userId, statsUpdate) {
        try {
            const user = await User.findOne({ userId });
            
            if (!user) {
                throw new Error('User not found');
            }

            // Update daily stats
            if (statsUpdate.dailyStats) {
                user.updateDailyStats(new Date(), statsUpdate.dailyStats);
            }

            // Update overall stats
            if (statsUpdate.focusTime) {
                user.stats.totalFocusTime += statsUpdate.focusTime;
            }

            if (statsUpdate.taskCompleted) {
                user.stats.totalTasksCompleted += 1;
                user.updateStreak();
            }

            if (statsUpdate.pomodoroSession) {
                user.stats.totalPomodoroSessions += 1;
            }

            await user.save();

            logger.info(`User service: Updated stats for ${userId}`);

            return user;
        } catch (error) {
            logger.error('User service: Error updating stats:', error);
            throw error;
        }
    }
}

module.exports = new UserService();
