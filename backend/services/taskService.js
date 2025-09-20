const { Task, User } = require('../models');
const logger = require('../utils/logger');

class TaskService {
    // Get tasks with filters and pagination
    async getTasks(filters = {}, options = {}) {
        try {
            const {
                limit = 50,
                skip = 0,
                sort = { order: 1, createdAt: -1 }
            } = options;

            const tasks = await Task.find(filters)
                .sort(sort)
                .limit(limit)
                .skip(skip);

            const total = await Task.countDocuments(filters);

            logger.info(`Task service: Retrieved ${tasks.length} tasks with filters:`, filters);

            return { tasks, total };
        } catch (error) {
            logger.error('Task service: Error fetching tasks:', error);
            throw error;
        }
    }

    // Get today's tasks
    async getTodayTasks(userId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const tasks = await Task.find({
                userId,
                $or: [
                    { dueDate: { $gte: today, $lt: tomorrow } },
                    { 
                        createdAt: { $gte: today, $lt: tomorrow },
                        status: { $ne: 'completed' }
                    }
                ]
            }).sort({ order: 1, priority: -1 });

            logger.info(`Task service: Retrieved ${tasks.length} tasks for today for user ${userId}`);
            return tasks;
        } catch (error) {
            logger.error('Task service: Error fetching today tasks:', error);
            throw error;
        }
    }

    // Get overdue tasks
    async getOverdueTasks(userId) {
        try {
            const now = new Date();
            
            const tasks = await Task.find({
                userId,
                dueDate: { $lt: now },
                status: { $ne: 'completed' }
            }).sort({ dueDate: 1 });

            logger.info(`Task service: Retrieved ${tasks.length} overdue tasks for user ${userId}`);
            return tasks;
        } catch (error) {
            logger.error('Task service: Error fetching overdue tasks:', error);
            throw error;
        }
    }

    // Create new task
    async createTask(taskData) {
        try {
            const task = new Task(taskData);
            await task.save();

            // Update user stats if User model exists
            try {
                await User.findOneAndUpdate(
                    { userId: taskData.userId },
                    { 
                        $inc: { 
                            'stats.totalTasksCreated': 1,
                            'quickStats.todayTasks.total': 1
                        }
                    }
                );
            } catch (userError) {
                logger.warn('Task service: Could not update user stats:', userError.message);
                // Continue even if user update fails
            }

            logger.info(`Task service: Created task "${task.title}" for user ${taskData.userId}`);
            return task;
        } catch (error) {
            logger.error('Task service: Error creating task:', error);
            throw error;
        }
    }

    // Update task
    async updateTask(taskId, userId, updateData) {
        try {
            const task = await Task.findOneAndUpdate(
                { _id: taskId, userId },
                updateData,
                { new: true }
            );

            if (task) {
                logger.info(`Task service: Updated task "${task.title}" for user ${userId}`);
            } else {
                logger.warn(`Task service: Task ${taskId} not found for user ${userId}`);
            }

            return task;
        } catch (error) {
            logger.error('Task service: Error updating task:', error);
            throw error;
        }
    }

    // Complete task
    async completeTask(taskId, userId, completionNotes = '') {
        try {
            const task = await Task.findOneAndUpdate(
                { _id: taskId, userId },
                {
                    status: 'completed',
                    completedAt: new Date(),
                    completionNotes,
                    'progress.percentage': 100
                },
                { new: true }
            );

            if (!task) {
                return { task: null, userStats: null };
            }

            // Update user stats if User model exists
            let userStats = null;
            try {
                const user = await User.findOne({ userId });
                if (user) {
                    user.stats.totalTasksCompleted += 1;
                    user.stats.categoryStats[task.category].completed += 1;
                    
                    // Update streak if method exists
                    if (typeof user.updateStreak === 'function') {
                        user.updateStreak();
                    }
                    
                    // Add recent activity if method exists
                    if (typeof user.addRecentActivity === 'function') {
                        user.addRecentActivity({
                            type: 'task_completed',
                            description: `Completed task: ${task.title}`,
                            taskId: task._id
                        });
                    }

                    // Update daily stats if method exists
                    if (typeof user.updateDailyStats === 'function') {
                        user.updateDailyStats(new Date(), {
                            tasksCompleted: 1,
                            categoryBreakdown: {
                                [task.category]: 1
                            }
                        });
                    }

                    await user.save();
                    userStats = user.stats;
                }
            } catch (userError) {
                logger.warn('Task service: Could not update user stats:', userError.message);
                // Continue even if user update fails
            }

            logger.info(`Task service: Completed task "${task.title}" for user ${userId}`);
            return { task, userStats };
        } catch (error) {
            logger.error('Task service: Error completing task:', error);
            throw error;
        }
    }

    // Delete task
    async deleteTask(taskId, userId) {
        try {
            const task = await Task.findOneAndDelete({ _id: taskId, userId });

            if (task) {
                logger.info(`Task service: Deleted task "${task.title}" for user ${userId}`);
            } else {
                logger.warn(`Task service: Task ${taskId} not found for user ${userId}`);
            }

            return task;
        } catch (error) {
            logger.error('Task service: Error deleting task:', error);
            throw error;
        }
    }

    // Search tasks
    async searchTasks(userId, query) {
        try {
            const searchRegex = new RegExp(query, 'i');
            
            const tasks = await Task.find({
                userId,
                $or: [
                    { title: searchRegex },
                    { description: searchRegex },
                    { tags: { $in: [searchRegex] } }
                ]
            }).sort({ createdAt: -1 });

            logger.info(`Task service: Found ${tasks.length} tasks matching "${query}" for user ${userId}`);
            return tasks;
        } catch (error) {
            logger.error('Task service: Error searching tasks:', error);
            throw error;
        }
    }

    // Reorder tasks
    async reorderTasks(userId, taskUpdates) {
        try {
            const updatePromises = taskUpdates.map(update =>
                Task.findOneAndUpdate(
                    { _id: update.id, userId },
                    { order: update.order }
                )
            );

            await Promise.all(updatePromises);
            
            logger.info(`Task service: Reordered ${taskUpdates.length} tasks for user ${userId}`);
        } catch (error) {
            logger.error('Task service: Error reordering tasks:', error);
            throw error;
        }
    }
}

module.exports = new TaskService();
