const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Destructure the controllers
const {
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
} = require('../controllers/taskController');

// Example routes
router.get('/', getAllTasks);
router.get('/today', getTodayTasks);
router.get('/overdue', getOverdueTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.put('/:id/complete', completeTask);
router.put('/reorder', reorderTasks);
router.get('/category/:category', getTasksByCategory);
router.get('/search/:query', searchTasks);
router.post('/', taskController.createTask);
module.exports = router;

// const express = require('express');
// const router = express.Router();

// const taskController = require('../controllers/taskController');
// const { authenticate } = require('../middleware/auth');
// const { validate, schemas } = require('../middleware/validation');

// // All task routes require authentication
// router.use(authenticate);

// // Core task operations
// router.get('/', taskController.getAllTasks);
// router.get('/today', taskController.getTodayTasks);
// router.get('/overdue', taskController.getOverdueTasks);
// router.post('/', 
//   validate(schemas.createTask),
//   taskController.createTask
// );

// router.get('/:id', taskController.getTaskById);
// router.put('/:id', 
//   validate(schemas.updateTask),
//   taskController.updateTask
// );
// router.delete('/:id', taskController.deleteTask);

// // Task status operations
// router.put('/:id/complete', taskController.completeTask);

// // Task organization
// router.put('/reorder', taskController.reorderTasks);
// router.get('/category/:category', taskController.getTasksByCategory);

// // Search
// router.get('/search/:query', taskController.searchTasks);

// module.exports = router;
