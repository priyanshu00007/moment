const taskService = require('../services/taskService');
const logger = require('../utils/logger');


const getAllTasks = async (req, res) => {
  try {
  const userId = req.user?.userId || 'demoUser';
    const { status, category, priority, limit = 50, page = 1 } = req.query;
    
    const filters = { userId };
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (priority) filters.priority = priority;
    
    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort: { order: 1, createdAt: -1 }
    };
    
   const result = await taskService.getTasks(filters, options);
    console.log('Tasks found:', result.tasks);
    console.log('req.user:', req.user, 'req.body:', req.body);


    res.json({
      success: true,
      data: result.tasks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(result.total / parseInt(limit)),
        totalTasks: result.total,
        hasNextPage: parseInt(page) < Math.ceil(result.total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      },
      message: 'Tasks retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get today's tasks
const getTodayTasks = async (req, res) => {
  try {
    const userId = req.user?.userId || 'demoUser'; // safe fallback
    const tasks = await taskService.getTodayTasks(userId);

    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
      message: "Today's tasks retrieved successfully"
    });
  } catch (error) {
    logger.error("Error fetching today's tasks:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// Get overdue tasks
const getOverdueTasks = async (req, res) => {
  try {
    const { userId } = req.user;
    const tasks = await taskService.getOverdueTasks(userId);
    
    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
      message: 'Overdue tasks retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching overdue tasks:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new task [web:213]
const createTask = async (req, res) => {
  try {
    const { userId } = req.user;
    const taskData = { ...req.body, userId };
    
    const task = await taskService.createTask(taskData);
    
    logger.info(`New task created: ${task.title} by user ${userId}`);
    
    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });
  } catch (error) {
    logger.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const updateData = req.body;
    
    const task = await taskService.updateTask(id, userId, updateData);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    logger.info(`Task updated: ${task.title} by user ${userId}`);
    
    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully'
    });
  } catch (error) {
    logger.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Complete task
const completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { completionNotes } = req.body;
    
    const result = await taskService.completeTask(id, userId, completionNotes);
    
    if (!result.task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    logger.info(`Task completed: ${result.task.title} by user ${userId}`);
    
    res.json({
      success: true,
      data: result.task,
      stats: result.userStats,
      message: 'Task completed successfully'
    });
  } catch (error) {
    logger.error('Error completing task:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    const task = await taskService.deleteTask(id, userId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    logger.info(`Task deleted: ${task.title} by user ${userId}`);
    
    res.json({
      success: true,
      data: task,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Reorder tasks
const reorderTasks = async (req, res) => {
  try {
    const { userId } = req.user;
    const { tasks } = req.body; // Array of {id, order}
    
    await taskService.reorderTasks(userId, tasks);
    
    logger.info(`Tasks reordered by user ${userId}`);
    
    res.json({
      success: true,
      message: 'Tasks reordered successfully'
    });
  } catch (error) {
    logger.error('Error reordering tasks:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get tasks by category
const getTasksByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { userId } = req.user;
    
    const tasks = await taskService.getTasks(
      { userId, category },
      { sort: { order: 1, createdAt: -1 } }
    );
    
    res.json({
      success: true,
      data: tasks.tasks,
      count: tasks.total,
      message: `${category} tasks retrieved successfully`
    });
  } catch (error) {
    logger.error('Error fetching tasks by category:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Search tasks
const searchTasks = async (req, res) => {
  try {
    const { query } = req.params;
    const { userId } = req.user;
    
    const tasks = await taskService.searchTasks(userId, query);
    
    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
      query,
      message: 'Search completed successfully'
    });
  } catch (error) {
    logger.error('Error searching tasks:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllTasks,
  getTodayTasks,
  getOverdueTasks,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  reorderTasks,
  getTasksByCategory,
  searchTasks
};
