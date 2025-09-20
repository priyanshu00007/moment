const mongoose = require('mongoose');

const PomodoroSessionSchema = new mongoose.Schema(
  {
    userId:     { type: String, required: true, index: true },
    taskId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    duration:   { type: Number, required: true },      // seconds
    startedAt:  { type: Date,  required: true },
    endedAt:    { type: Date,  required: true },
  },
  { timestamps: true, collection: 'pomodoro_sessions' }
);

module.exports = mongoose.model('PomodoroSession', PomodoroSessionSchema);
