const express = require('express');
const router = express.Router();

const pomodoroController = require('../controllers/pomodoroController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All pomodoro routes require authentication
router.use(authenticate);

// Session management
router.post('/sessions', 
  validate(schemas.createPomodoroSession),
  pomodoroController.startSession
);
router.get('/sessions/active', pomodoroController.getActiveSession);
router.get('/sessions/history', pomodoroController.getSessionHistory);
router.get('/sessions/stats', pomodoroController.getSessionStats);

router.put('/sessions/:sessionId/complete', 
  validate(schemas.completePomodoroSession),
  pomodoroController.completeSession
);
router.put('/sessions/:sessionId/pause', pomodoroController.pauseSession);

module.exports = router;
