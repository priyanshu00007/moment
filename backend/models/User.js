const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Authentication & Basic Info
  userId: { 
    type: String, 
    unique: true, 
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: { 
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },

  // Onboarding Information [web:23]
  onboarding: {
    designation: {
      type: String,
      required: true
    },
    source: {
      type: String,
      enum: ['student', 'professional', 'freelancer', 'entrepreneur'],
      required: true
    },
    reasonForUsing: {
      type: String,
      required: true
    },
    dailyRoutine: {
      type: String,
      enum: ['early-bird', 'regular', 'night-owl']
    },
    productivityStyle: {
      type: String,
      enum: ['focused-sprints', 'steady-pace', 'flexible']
    },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' }
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  },

  // Gamification & Progress
  progress: {
    xp: { 
      type: Number, 
      default: 0,
      min: 0
    },
    level: {
      type: Number,
      default: 1,
      min: 1
    },
    badges: [{
      name: String,
      description: String,
      earnedAt: { type: Date, default: Date.now },
      icon: String
    }],
    achievements: [{
      type: String,
      enum: [
        'first-task', 'week-streak', 'month-streak', 'pomodoro-master',
        'early-bird', 'night-owl', 'focused-warrior', 'task-destroyer'
      ]
    }]
  },

  // Dashboard Statistics
  stats: {
    totalFocusTime: { 
      type: Number, 
      default: 0
    },
    totalPomodoroSessions: { 
      type: Number, 
      default: 0 
    },
    totalTasksCompleted: { 
      type: Number, 
      default: 0 
    },
    totalTasksCreated: {
      type: Number,
      default: 0
    },
    currentStreak: { 
      type: Number, 
      default: 0 
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastCompletionDate: Date,
    lastActiveDate: {
      type: Date,
      default: Date.now
    },
    categoryStats: {
      work: {
        completed: { type: Number, default: 0 },
        totalTime: { type: Number, default: 0 }
      },
      study: {
        completed: { type: Number, default: 0 },
        totalTime: { type: Number, default: 0 }
      },
      personal: {
        completed: { type: Number, default: 0 },
        totalTime: { type: Number, default: 0 }
      }
    },
    weeklyGoals: {
      tasksTarget: { type: Number, default: 20 },
      focusTimeTarget: { type: Number, default: 300 },
      tasksCompleted: { type: Number, default: 0 },
      focusTimeAchieved: { type: Number, default: 0 }
    }
  },

  // Daily Statistics [web:72]
  dailyStats: [{
    date: {
      type: Date,
      required: true
    },
    tasksCompleted: { 
      type: Number, 
      default: 0 
    },
    focusTime: { 
      type: Number, 
      default: 0
    },
    pomodoroSessions: {
      type: Number,
      default: 0
    },
    categoryBreakdown: {
      work: { type: Number, default: 0 },
      study: { type: Number, default: 0 },
      personal: { type: Number, default: 0 }
    },
    mood: {
      type: String,
      enum: ['excellent', 'good', 'okay', 'poor'],
      default: 'okay'
    },
    productivity: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    }
  }],

  // Recent Activity
  recentActivity: [{
    type: {
      type: String,
      enum: ['task_completed', 'task_created', 'pomodoro_session', 'streak_milestone', 'badge_earned'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  }],

  // User Preferences
  preferences: {
    theme: {
      type: String,
      enum: ['black-yellow', 'dark', 'light', 'blue-accent'],
      default: 'black-yellow'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    pomodoro: {
      workDuration: { type: Number, default: 25 },
      shortBreak: { type: Number, default: 5 },
      longBreak: { type: Number, default: 15 },
      sessionsUntilLongBreak: { type: Number, default: 4 },
      autoStartBreaks: { type: Boolean, default: false },
      autoStartPomodoros: { type: Boolean, default: false }
    },
    notifications: {
      email: {
        dailySummary: { type: Boolean, default: true },
        weeklyReport: { type: Boolean, default: true },
        taskReminders: { type: Boolean, default: true },
        streakReminders: { type: Boolean, default: true }
      },
      push: {
        pomodoroEnd: { type: Boolean, default: true },
        taskDeadlines: { type: Boolean, default: true },
        dailyGoals: { type: Boolean, default: true }
      }
    },
    dashboard: {
      widgets: [{
        type: {
          type: String,
          enum: ['tasks-today', 'focus-timer', 'streak-counter', 'productivity-chart', 'recent-activity', 'motivational-quote'],
          required: true
        },
        position: {
          row: Number,
          col: Number
        },
        size: {
          width: { type: Number, default: 1 },
          height: { type: Number, default: 1 }
        },
        visible: { type: Boolean, default: true }
      }],
      layout: {
        type: String,
        enum: ['grid', 'list', 'compact'],
        default: 'grid'
      }
    }
  },

  // Quick Access Data
  quickStats: {
    todayTasks: {
      total: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      inProgress: { type: Number, default: 0 },
      pending: { type: Number, default: 0 }
    },
    thisWeekFocus: {
      type: Number,
      default: 0
    },
    currentPomodoroSession: {
      isActive: { type: Boolean, default: false },
      taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
      },
      startTime: Date,
      duration: Number,
      type: {
        type: String,
        enum: ['work', 'short-break', 'long-break']
      }
    }
  },

  // Account Status
  account: {
    isActive: {
      type: Boolean,
      default: true
    },
    plan: {
      type: String,
      enum: ['free', 'premium', 'pro'],
      default: 'free'
    },
    subscriptionExpiry: Date,
    lastLogin: {
      type: Date,
      default: Date.now
    },
    loginStreak: {
      type: Number,
      default: 0
    }
  }

}, { 
  timestamps: true,
  collection: 'users',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance [web:23]
UserSchema.index({ userId: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ 'account.lastLogin': -1 });
UserSchema.index({ 'stats.currentStreak': -1 });
UserSchema.index({ 'dailyStats.date': -1 });

// Virtual fields
UserSchema.virtual('stats.completionRate').get(function() {
  if (this.stats.totalTasksCreated === 0) return 0;
  return Math.round((this.stats.totalTasksCompleted / this.stats.totalTasksCreated) * 100);
});

UserSchema.virtual('progress.nextLevelXP').get(function() {
  return this.progress.level * 1000;
});

UserSchema.virtual('progress.levelProgress').get(function() {
  const currentLevelXP = (this.progress.level - 1) * 1000;
  const nextLevelXP = this.progress.level * 1000;
  const progressInLevel = this.progress.xp - currentLevelXP;
  return Math.round((progressInLevel / (nextLevelXP - currentLevelXP)) * 100);
});

// Instance methods
UserSchema.methods.updateDailyStats = function(date, updates) {
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);
  
  let dailyStat = this.dailyStats.find(stat => 
    stat.date.getTime() === today.getTime()
  );
  
  if (!dailyStat) {
    dailyStat = {
      date: today,
      tasksCompleted: 0,
      focusTime: 0,
      pomodoroSessions: 0,
      categoryBreakdown: { work: 0, study: 0, personal: 0 }
    };
    this.dailyStats.push(dailyStat);
  }
  
  Object.assign(dailyStat, updates);
  
  this.dailyStats = this.dailyStats
    .sort((a, b) => b.date - a.date)
    .slice(0, 30);
};

UserSchema.methods.addRecentActivity = function(activity) {
  this.recentActivity.unshift({
    ...activity,
    timestamp: new Date()
  });
  
  this.recentActivity = this.recentActivity.slice(0, 20);
};

UserSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastCompletion = this.stats.lastCompletionDate;
  
  if (!lastCompletion) {
    this.stats.currentStreak = 1;
  } else {
    const lastCompletionDate = new Date(lastCompletion);
    lastCompletionDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today - lastCompletionDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      this.stats.currentStreak += 1;
    } else if (daysDiff === 0) {
      return;
    } else {
      this.stats.currentStreak = 1;
    }
  }
  
  this.stats.lastCompletionDate = today;
  
  if (this.stats.currentStreak > this.stats.longestStreak) {
    this.stats.longestStreak = this.stats.currentStreak;
  }
};

UserSchema.pre('save', function(next) {
  if (this.dailyStats.length > 30) {
    this.dailyStats = this.dailyStats
      .sort((a, b) => b.date - a.date)
      .slice(0, 30);
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
