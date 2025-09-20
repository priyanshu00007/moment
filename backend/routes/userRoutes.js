const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');

// All task routes now require authentication
router.use(authenticate);

router.post('/', taskController.createTask);
router.get('/', taskController.getAllTasks);
router.put('/:id', taskController.updateTask);
// ...other task routes

module.exports = router;

// const express = require('express');
// const router = express.Router();

// // Import controllers and middleware
// const userController = require('../controllers/userController');
// const { authenticate } = require('../middleware/auth');
// const { validate, schemas } = require('../middleware/validation');

// // Public routes
// router.post('/register', 
//     validate(schemas.createUser),
//     userController.createUser
// );

// // Protected routes (require authentication) [17]
// router.use(authenticate); // All routes below this require authentication

// router.get('/profile', userController.getUserProfile);
// router.put('/profile', 
//     validate(schemas.updateUser),
//     userController.updateUserProfile
// );
// router.put('/onboarding', userController.completeOnboarding);
// router.get('/dashboard-stats', userController.getDashboardStats);

// module.exports = router;
