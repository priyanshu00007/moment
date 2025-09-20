const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // User Reference [web:2]
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Task Organization
  category: {
    type: String,
    enum: ['work', 'study', 'personal'],
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Time Management
  dueDate: {
    type: Date,
    index: true
  },
  estimatedTime: {
    type: Number,
    min: 0
  },
  actualTime: {
    type: Number,
    default: 0
  },
  
  // Task Progress
  progress: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    subtasks: [{
      title: {
        type: String,
        required: true,
        maxlength: 100
      },
      completed: {
        type: Boolean,
        default: false
      },
      order: {
        type: Number,
        default: 0
      }
    }]
  },
  
  // Pomodoro Integration
  pomodoroSessions: [{
    startTime: Date,
    endTime: Date,
    duration: Number,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  
  // Task Metadata
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  
  // Task Organization
  order: {
    type: Number,
    default: 0,
    index: true
  },
  
  // Rollover & Recurring
  isRollover: {
    type: Boolean,
    default: false
  },
  originalTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly']
  },
  
  // Completion Details
  completedAt: Date,
  completionNotes: {
    type: String,
    maxlength: 500
  }

}, {
  timestamps: true,
  collection: 'tasks',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes [web:72]
TaskSchema.index({ userId: 1, status: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, category: 1, createdAt: -1 });
TaskSchema.index({ userId: 1, priority: 1, status: 1 });

// Virtual fields
TaskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'completed';
});

TaskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const today = new Date();
  const due = new Date(this.dueDate);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Task', TaskSchema);
