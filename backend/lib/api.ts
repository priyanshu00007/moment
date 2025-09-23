// lib/api.js
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const BACKEND_BASE_URL = API_BASE_URL.replace('/api/v1', '');

console.log('API Configuration:');
console.log('API Base URL:', API_BASE_URL);
console.log('Backend Base URL:', BACKEND_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(` API Request: ${config.method?.toUpperCase()} ${fullUrl}`);
    console.log(' Request config:', {
      baseURL: config.baseURL,
      url: config.url,
      method: config.method,
      timeout: config.timeout
    });
    return config;
  },
  (error) => {
    console.error('Request Setup Error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(` API Response: ${response.status} ${response.config?.url}`);
    console.log(' Response data preview:', {
      success: response.data?.success,
      dataLength: Array.isArray(response.data?.data) ? response.data.data.length : 'N/A',
      message: response.data?.message
    });
    return response;
  },
  (error) => {
    // More robust error details extraction
    const errorDetails = {
      message: error.message || 'Unknown error',
      code: error.code || 'NO_CODE',
      status: error.response?.status || 'NO_STATUS',
      statusText: error.response?.statusText || 'NO_STATUS_TEXT',
      url: error.config?.url || 'NO_URL',
      method: error.config?.method?.toUpperCase() || 'NO_METHOD',
      baseURL: error.config?.baseURL || 'NO_BASE_URL',
      fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'NO_FULL_URL',
      timeout: error.config?.timeout || 'NO_TIMEOUT',
      responseData: error.response?.data || 'NO_RESPONSE_DATA'
    };
    
    console.error(' API Error Details:', errorDetails);
    console.error(' Raw Error:', error);
    console.error(' Error Stack:', error.stack);
    
    // Create enhanced error message
    let enhancedMessage = '';
    
    if (error.code === 'ECONNREFUSED') {
      enhancedMessage = ` Connection refused to ${errorDetails.fullURL}. Backend server is not running.`;
      console.error(' SOLUTION: Start backend server with: cd backend && node server.js');
    } else if (error.code === 'ERR_NETWORK') {
      enhancedMessage = ` Network error connecting to ${errorDetails.fullURL}. Check if backend is accessible.`;
    } else if (error.code === 'ENOTFOUND') {
      enhancedMessage = ` DNS resolution failed for ${errorDetails.baseURL}. Invalid server URL.`;
    } else if (error.code === 'ECONNABORTED' || error.code === 'TIMEOUT') {
      enhancedMessage = ` Request timeout after ${errorDetails.timeout}ms to ${errorDetails.fullURL}.`;
    } else if (error.response?.status === 404) {
      enhancedMessage = ` Endpoint not found: ${errorDetails.method} ${errorDetails.fullURL}`;
    } else if (error.response?.status === 500) {
      enhancedMessage = ` Backend server error at ${errorDetails.fullURL}: ${error.response?.data?.message || 'Internal server error'}`;
    } else if (error.response?.status >= 400) {
      enhancedMessage = ` API error ${errorDetails.status}: ${error.response?.data?.message || error.message}`;
    } else {
      enhancedMessage = ` Unexpected error: ${error.message} (${errorDetails.fullURL})`;
    }
    
    // Replace error message with enhanced version
    error.message = enhancedMessage;
    
    return Promise.reject(error);
  }
);

export const taskApi = {
  // Test backend connection
  testConnection: async () => {
    try {
      console.log(' Testing backend connection...');
      console.log(' Testing URL:', `${BACKEND_BASE_URL}/health`);
      
      const response = await axios.get(`${BACKEND_BASE_URL}/health`, { 
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(' Backend connection successful:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(' Backend connection test failed:');
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error status:', error.response?.status);
      
      return { 
        success: false, 
        error: error.message,
        details: {
          code: error.code,
          status: error.response?.status,
          url: `${BACKEND_BASE_URL}/health`
        }
      };
    }
  },

  // Get all tasks with enhanced error handling
  getTasks: async (params = {}) => {
    try {
      console.log(' Fetching tasks...');
      console.log(' Request params:', params);
      console.log(' Full URL will be:', `${API_BASE_URL}/tasks`);
      
      const response = await api.get('/tasks', { params });
      
      const result = response.data;
      console.log(' Tasks fetched successfully:');
      console.log('   - Success:', result.success);
      console.log('   - Count:', result.count || result.data?.length || 0);
      console.log('   - Message:', result.message);
      
      return result;
    } catch (error) {
      console.error(' getTasks failed:', error.message);
      
      // Return structured error response
      return {
        success: false,
        error: error.message,
        data: [],
        count: 0,
        message: 'Failed to fetch tasks from backend',
        details: {
          code: error.code,
          status: error.response?.status,
          originalMessage: error.message
        }
      };
    }
  },

  // Get task by ID
  getTaskById: async (id) => {
    try {
      console.log(' Fetching task by ID:', id);
      const response = await api.get(`/tasks/${id}`);
      
      console.log(' Task fetched successfully:', response.data.data?.title);
      return response.data;
    } catch (error) {
      console.error(' getTaskById failed:', error.message);
      throw error;
    }
  },

  // Create task
  createTask: async (task) => {
    try {
      console.log(' Creating task:', task.title);
      const response = await api.post('/tasks', task);
      
      console.log(' Task created successfully:', response.data.data?.title);
      return response.data;
    } catch (error) {
      console.error(' createTask failed:', error.message);
      throw error;
    }
  },

  // Update task
  updateTask: async (id, updates) => {
    try {
      console.log(' Updating task:', id);
      const response = await api.put(`/tasks/${id}`, updates);
      
      console.log(' Task updated successfully:', response.data.data?.title);
      return response.data;
    } catch (error) {
      console.error(' updateTask failed:', error.message);
      throw error;
    }
  },

  // Delete task
  deleteTask: async (id) => {
    try {
      console.log(' Deleting task:', id);
      const response = await api.delete(`/tasks/${id}`);
      
      console.log(' Task deleted successfully');
      return response.data;
    } catch (error) {
      console.error(' deleteTask failed:', error.message);
      throw error;
    }
  },

  // Complete task (using PATCH endpoint)
  completeTask: async (id) => {
    try {
      console.log(' Completing task:', id);
      const response = await api.patch(`/tasks/${id}/complete`);
      
      console.log(' Task completed successfully');
      return response.data;
    } catch (error) {
      console.error(' completeTask failed:', error.message);
      throw error;
    }
  },

  // Update task progress
  updateTaskProgress: async (id, workedSeconds) => {
    try {
      console.log(' Updating task progress:', id, 'worked seconds:', workedSeconds);
      
      // First get the task to calculate progress percentage
      const taskResponse = await api.get(`/tasks/${id}`);
      const task = taskResponse.data.data;
      
      // Calculate progress percentage based on estimated time
      const estimatedSeconds = (task.estimatedMinutes || 25) * 60;
      const progressPercentage = Math.min(100, Math.round((workedSeconds / estimatedSeconds) * 100));
      
      // Update the task with new progress
      const response = await api.put(`/tasks/${id}`, {
        workedSeconds: workedSeconds,
        progress: { percentage: progressPercentage },
        lastWorkedAt: new Date().toISOString(),
        status: task.status === 'pending' ? 'in-progress' : task.status
      });
      
      console.log(' Task progress updated successfully');
      return response.data;
    } catch (error) {
      console.error(' updateTaskProgress failed:', error.message);
      throw error;
    }
  },

  // Get task statistics
  getTaskStats: async (userId) => {
    try {
      console.log(' Fetching task statistics for user:', userId);
      const response = await api.get(`/debug/all-data/${userId}`);
      
      console.log(' Task statistics fetched successfully');
      return response.data;
    } catch (error) {
      console.error(' getTaskStats failed:', error.message);
      throw error;
    }
  },

  // Batch update tasks (useful for bulk operations)
  batchUpdateTasks: async (taskIds, updates) => {
    try {
      console.log(' Batch updating tasks:', taskIds.length, 'tasks');
      
      const promises = taskIds.map(id => api.put(`/tasks/${id}`, updates));
      const responses = await Promise.all(promises);
      
      console.log(' Batch update completed successfully');
      return {
        success: true,
        data: responses.map(r => r.data.data),
        count: responses.length
      };
    } catch (error) {
      console.error(' batchUpdateTasks failed:', error.message);
      throw error;
    }
  }
};

export const sessionApi = {
  // Create session
  create: async (payload) => {
    try {
      console.log(' Creating session:', payload);
      const response = await api.post('/sessions', payload);
      console.log(' Session created successfully');
      return response.data;
    } catch (error) {
      console.error(' createSession failed:', error.message);
      throw error;
    }
  },

  // Get sessions
  getSessions: async (params = {}) => {
    try {
      console.log(' Fetching sessions...');
      const response = await api.get('/sessions', { params });
      
      console.log(' Sessions fetched successfully:', response.data.count);
      return response.data;
    } catch (error) {
      console.error(' getSessions failed:', error.message);
      throw error;
    }
  },

  // Get sessions for a specific task
  getTaskSessions: async (taskId) => {
    try {
      console.log(' Fetching sessions for task:', taskId);
      const response = await api.get('/sessions', { 
        params: { taskId } 
      });
      
      console.log(' Task sessions fetched successfully:', response.data.count);
      return response.data;
    } catch (error) {
      console.error(' getTaskSessions failed:', error.message);
      throw error;
    }
  }
};

// Enhanced helper functions
export const generateUserDataFromTasks = (tasks, userId, userName) => {
  console.log(` Generating user data from ${tasks?.length || 0} tasks`);
  
  if (!tasks || !Array.isArray(tasks)) {
    console.warn(' Invalid tasks data, using empty array');
    tasks = [];
  }
  
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  
  // Calculate total focus time from worked seconds
  const totalFocusTime = tasks.reduce((total, task) => 
    total + (task.workedSeconds || 0), 0
  );
  
  // Generate daily stats for last 7 days
  const today = new Date();
  const dailyStats = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    
    const dayTasks = completedTasks.filter(task => {
      const completedDate = new Date(task.completedAt || task.updatedAt);
      return completedDate >= date && completedDate < nextDay;
    });
    
    const dayFocusTime = dayTasks.reduce((total, task) => 
      total + (task.workedSeconds || 0), 0
    );
    
    dailyStats.push({
      date: date.toISOString().split('T')[0],
      tasksCompleted: dayTasks.length,
      focusTime: Math.round(dayFocusTime / 60) // Convert to minutes
    });
  }
  
  const userData = {
    name: userName || 'User',
    userId: userId,
    totalTasks: tasks.length,
    totalTasksCompleted: completedTasks.length,
    totalTasksInProgress: inProgressTasks.length,
    totalTasksPending: pendingTasks.length,
    totalFocusTime: Math.round(totalFocusTime / 60), // Convert to minutes
    totalPomodoroSessions: completedTasks.length,
    currentStreak: calculateStreak(completedTasks),
        xp: completedTasks.length * 10 + Math.floor(totalFocusTime / 3600) * 5, // XP from tasks + focus hours
    level: Math.floor((completedTasks.length * 10 + Math.floor(totalFocusTime / 3600) * 5) / 100) + 1,
    dailyStats: dailyStats,
    categoryBreakdown: getCategoryBreakdown(tasks),
    priorityBreakdown: getPriorityBreakdown(tasks),
    averageTaskCompletionTime: calculateAverageCompletionTime(completedTasks),
    productivityScore: calculateProductivityScore(tasks, totalFocusTime),
    history: completedTasks.slice(-10).map(task => ({
      _id: task._id,
      title: task.title,
      type: 'Task Completed',
      completedAt: task.completedAt || task.updatedAt,
      workedMinutes: Math.round((task.workedSeconds || 0) / 60)
    }))
  };
  
  console.log(' Generated user data:', {
    level: userData.level,
    xp: userData.xp,
    completed: userData.totalTasksCompleted,
    streak: userData.currentStreak,
    productivityScore: userData.productivityScore
  });
  
  return userData;
};

const calculateStreak = (completedTasks) => {
  if (!completedTasks || completedTasks.length === 0) return 0;
  
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  while (streak < 365) {
    currentDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1);
    
    const hasTaskOnDate = completedTasks.some(task => {
      if (!task.completedAt && !task.updatedAt) return false;
      const completedDate = new Date(task.completedAt || task.updatedAt);
      return completedDate >= currentDate && completedDate < nextDay;
    });
    
    if (hasTaskOnDate) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

const getCategoryBreakdown = (tasks) => {
  const breakdown = {
    work: 0,
    personal: 0,
    study: 0,
    health: 0
  };
  
  tasks.forEach(task => {
    if (breakdown.hasOwnProperty(task.category)) {
      breakdown[task.category]++;
    }
  });
  
  return breakdown;
};

const getPriorityBreakdown = (tasks) => {
  const breakdown = {
    high: 0,
    medium: 0,
    low: 0
  };
  
  tasks.forEach(task => {
    if (breakdown.hasOwnProperty(task.priority)) {
      breakdown[task.priority]++;
    }
  });
  
  return breakdown;
};

const calculateAverageCompletionTime = (completedTasks) => {
  if (completedTasks.length === 0) return 0;
  
  const totalTime = completedTasks.reduce((sum, task) => 
    sum + (task.workedSeconds || 0), 0
  );
  
  return Math.round(totalTime / completedTasks.length / 60); // Average in minutes
};

const calculateProductivityScore = (tasks, totalFocusTime) => {
  if (tasks.length === 0) return 0;
  
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const completionRate = completedTasks.length / tasks.length;
  const focusHours = totalFocusTime / 3600;
  const avgFocusPerTask = tasks.length > 0 ? focusHours / tasks.length : 0;
  
  // Productivity score based on completion rate, focus time, and efficiency
  const score = Math.round(
    (completionRate * 40) + // 40% weight on completion
    (Math.min(focusHours / 10, 1) * 30) + // 30% weight on focus hours (max at 10 hours)
    (Math.min(avgFocusPerTask * 2, 1) * 30) // 30% weight on efficiency
  );
  
  return Math.min(score, 100); // Cap at 100
};

// Utility functions for task management
export const taskUtils = {
  // Sort tasks by various criteria
  sortTasks: (tasks, sortBy = 'createdAt', order = 'desc') => {
    const sorted = [...tasks].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'dueDate':
          aVal = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          bVal = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aVal = priorityOrder[a.priority] || 0;
          bVal = priorityOrder[b.priority] || 0;
          break;
        case 'progress':
          aVal = a.progress?.percentage || 0;
          bVal = b.progress?.percentage || 0;
          break;
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        default:
          aVal = new Date(a[sortBy] || 0).getTime();
          bVal = new Date(b[sortBy] || 0).getTime();
      }
      
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return sorted;
  },

  // Filter overdue tasks
  getOverdueTasks: (tasks) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    });
  },

  // Get tasks due today
  getTodaysTasks: (tasks) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });
  },

  // Get upcoming tasks (next 7 days)
  getUpcomingTasks: (tasks) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return tasks.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate <= nextWeek;
    });
  },

  // Calculate task statistics
  getTaskStatistics: (tasks) => {
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      overdue: taskUtils.getOverdueTasks(tasks).length,
      dueToday: taskUtils.getTodaysTasks(tasks).length,
      highPriority: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
      totalFocusTime: tasks.reduce((sum, t) => sum + (t.workedSeconds || 0), 0) / 60, // in minutes
      averageProgress: tasks.reduce((sum, t) => sum + (t.progress?.percentage || 0), 0) / (tasks.length || 1)
    };
    
    stats.completionRate = stats.total > 0 ? (stats.completed / stats.total * 100).toFixed(1) : 0;
    
    return stats;
  },

  // Format time display
  formatTime: (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  },

  // Format time for display in minutes
  formatMinutes: (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  },

  // Check if task should show reminder
  shouldShowReminder: (task) => {
    if (!task.dueDate || task.status === 'completed') return false;
    
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
    
    // Show reminder if due within 24 hours
    return hoursUntilDue <= 24 && hoursUntilDue > 0;
  },

  // Generate task summary
  generateTaskSummary: (task) => {
    const parts = [];
    
    if (task.category) parts.push(task.category);
    if (task.priority) parts.push(`${task.priority} priority`);
    if (task.estimatedMinutes) parts.push(`${task.estimatedMinutes} min`);
    if (task.dueDate) {
      const daysUntil = taskUtils.getDaysUntilDue(task);
      if (daysUntil === 0) parts.push('Due today');
      else if (daysUntil === 1) parts.push('Due tomorrow');
      else if (daysUntil > 0) parts.push(`Due in ${daysUntil} days`);
      else parts.push(`Overdue by ${Math.abs(daysUntil)} days`);
    }
    
    return parts.join(' • ');
  },

  // Get days until due date
  getDaysUntilDue: (task) => {
    if (!task.dueDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
};

export const goalApi = {
  createGoal: async (goal) => api.post('/goals', goal),
  getGoals: async (params) => api.get('/goals', { params }),
  updateGoal: async (id, updates) => api.put(`/goals/${id}`, updates),
  deleteGoal: async (id) => api.delete(`/goals/${id}`)
};


// // lib/api.js
// import axios from 'axios';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
// const BACKEND_BASE_URL = API_BASE_URL.replace('/api/v1', '');

// console.log('🔗 API Configuration:');
// console.log('📡 API Base URL:', API_BASE_URL);
// console.log('🖥️ Backend Base URL:', BACKEND_BASE_URL);

// // Create axios instance
// const api = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 15000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Request interceptor
// api.interceptors.request.use(
//   (config) => {
//     const fullUrl = `${config.baseURL}${config.url}`;
//     console.log(`📤 API Request: ${config.method?.toUpperCase()} ${fullUrl}`);
//     console.log('📤 Request config:', {
//       baseURL: config.baseURL,
//       url: config.url,
//       method: config.method,
//       timeout: config.timeout
//     });
//     return config;
//   },
//   (error) => {
//     console.error('📤❌ Request Setup Error:', error);
//     return Promise.reject(error);
//   }
// );

// // Enhanced response interceptor
// api.interceptors.response.use(
//   (response) => {
//     console.log(`📥✅ API Response: ${response.status} ${response.config?.url}`);
//     console.log('📥 Response data preview:', {
//       success: response.data?.success,
//       dataLength: Array.isArray(response.data?.data) ? response.data.data.length : 'N/A',
//       message: response.data?.message
//     });
//     return response;
//   },
//   (error) => {
//     // More robust error details extraction
//     const errorDetails = {
//       message: error.message || 'Unknown error',
//       code: error.code || 'NO_CODE',
//       status: error.response?.status || 'NO_STATUS',
//       statusText: error.response?.statusText || 'NO_STATUS_TEXT',
//       url: error.config?.url || 'NO_URL',
//       method: error.config?.method?.toUpperCase() || 'NO_METHOD',
//       baseURL: error.config?.baseURL || 'NO_BASE_URL',
//       fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'NO_FULL_URL',
//       timeout: error.config?.timeout || 'NO_TIMEOUT',
//       responseData: error.response?.data || 'NO_RESPONSE_DATA'
//     };
    
//     console.error('📥❌ API Error Details:', errorDetails);
//     console.error('📥❌ Raw Error:', error);
//     console.error('📥❌ Error Stack:', error.stack);
    
//     // Create enhanced error message
//     let enhancedMessage = '';
    
//     if (error.code === 'ECONNREFUSED') {
//       enhancedMessage = `❌ Connection refused to ${errorDetails.fullURL}. Backend server is not running.`;
//       console.error('🚨 SOLUTION: Start backend server with: cd backend && node server.js');
//     } else if (error.code === 'ERR_NETWORK') {
//       enhancedMessage = `❌ Network error connecting to ${errorDetails.fullURL}. Check if backend is accessible.`;
//     } else if (error.code === 'ENOTFOUND') {
//       enhancedMessage = `❌ DNS resolution failed for ${errorDetails.baseURL}. Invalid server URL.`;
//     } else if (error.code === 'ECONNABORTED' || error.code === 'TIMEOUT') {
//       enhancedMessage = `❌ Request timeout after ${errorDetails.timeout}ms to ${errorDetails.fullURL}.`;
//     } else if (error.response?.status === 404) {
//       enhancedMessage = `❌ Endpoint not found: ${errorDetails.method} ${errorDetails.fullURL}`;
//     } else if (error.response?.status === 500) {
//       enhancedMessage = `❌ Backend server error at ${errorDetails.fullURL}: ${error.response?.data?.message || 'Internal server error'}`;
//     } else if (error.response?.status >= 400) {
//       enhancedMessage = `❌ API error ${errorDetails.status}: ${error.response?.data?.message || error.message}`;
//     } else {
//       enhancedMessage = `❌ Unexpected error: ${error.message} (${errorDetails.fullURL})`;
//     }
    
//     // Replace error message with enhanced version
//     error.message = enhancedMessage;
    
//     return Promise.reject(error);
//   }
// );

// export const taskApi = {
//   // Test backend connection
//   testConnection: async () => {
//     try {
//       console.log('🔍 Testing backend connection...');
//       console.log('🔍 Testing URL:', `${BACKEND_BASE_URL}/health`);
      
//       const response = await axios.get(`${BACKEND_BASE_URL}/health`, { 
//         timeout: 5000,
//         headers: {
//           'Accept': 'application/json',
//           'Content-Type': 'application/json'
//         }
//       });
      
//       console.log('✅ Backend connection successful:', response.data);
//       return { success: true, data: response.data };
//     } catch (error) {
//       console.error('❌ Backend connection test failed:');
//       console.error('Error message:', error.message);
//       console.error('Error code:', error.code);
//       console.error('Error status:', error.response?.status);
      
//       return { 
//         success: false, 
//         error: error.message,
//         details: {
//           code: error.code,
//           status: error.response?.status,
//           url: `${BACKEND_BASE_URL}/health`
//         }
//       };
//     }
//   },

  
//   // Get all tasks with enhanced error handling
//   getTasks: async (params = {}) => {
//     try {
//       console.log('📋 Fetching tasks...');
//       console.log('📋 Request params:', params);
//       console.log('📋 Full URL will be:', `${API_BASE_URL}/tasks`);
      
//       const response = await api.get('/tasks', { params });
      
//       const result = response.data;
//       console.log('✅ Tasks fetched successfully:');
//       console.log('   - Success:', result.success);
//       console.log('   - Count:', result.count || result.data?.length || 0);
//       console.log('   - Message:', result.message);
      
//       return result;
//     } catch (error) {
//       console.error('❌ getTasks failed:', error.message);
      
//       // Return structured error response
//       return {
//         success: false,
//         error: error.message,
//         data: [],
//         count: 0,
//         message: 'Failed to fetch tasks from backend',
//         details: {
//           code: error.code,
//           status: error.response?.status,
//           originalMessage: error.message
//         }
//       };
//     }
//   },

  
//   // Create task
//   createTask: async (task) => {
//     try {
//       console.log('📝 Creating task:', task.title);
//       const response = await api.post('/tasks', task);
      
//       console.log('✅ Task created successfully:', response.data.data?.title);
//       return response.data;
//     } catch (error) {
//       console.error('❌ createTask failed:', error.message);
//       throw error;
//     }
//   },

//   // Update task
//   updateTask: async (id, updates) => {
//     try {
//       console.log('🔄 Updating task:', id);
//       const response = await api.put(`/tasks/${id}`, updates);
      
//       console.log('✅ Task updated successfully:', response.data.data?.title);
//       return response.data;
//     } catch (error) {
//       console.error('❌ updateTask failed:', error.message);
//       throw error;
//     }
//   },

//   // Delete task
//   deleteTask: async (id) => {
//     try {
//       console.log('🗑️ Deleting task:', id);
//       const response = await api.delete(`/tasks/${id}`);
      
//       console.log('✅ Task deleted successfully');
//       return response.data;
//     } catch (error) {
//       console.error('❌ deleteTask failed:', error.message);
//       throw error;
//     }
//   },

//   // Complete task
//   completeTask: async (id) => {
//     try {
//       console.log('✅ Completing task:', id);
//       const response = await api.put(`/tasks/${id}/complete`);
      
//       console.log('✅ Task completed successfully');
//       return response.data;
//     } catch (error) {
//       console.error('❌ completeTask failed:', error.message);
//       throw error;
//     }
//   },
// };



// export const sessionApi = {
//   create: async (payload) => {
//     const r = await api.post('/sessions', payload);
//     return r.data;
//   },
// };


// // Your existing helper functions...
// export const generateUserDataFromTasks = (tasks, userId, userName) => {
//   console.log(`📊 Generating user data from ${tasks?.length || 0} tasks`);
  
//   if (!tasks || !Array.isArray(tasks)) {
//     console.warn('⚠️ Invalid tasks data, using empty array');
//     tasks = [];
//   }
  
//   const completedTasks = tasks.filter(task => task.status === 'completed');
//   const totalFocusTime = completedTasks.reduce((total, task) => 
//     total + (task.actualTime || task.estimatedTime || 0), 0
//   );
  
//   // Generate daily stats for last 7 days
//   const today = new Date();
//   const dailyStats = [];
  
//   for (let i = 6; i >= 0; i--) {
//     const date = new Date();
//     date.setDate(today.getDate() - i);
//     date.setHours(0, 0, 0, 0);
    
//     const nextDay = new Date(date);
//     nextDay.setDate(date.getDate() + 1);
    
//     const dayTasks = completedTasks.filter(task => {
//       const completedDate = new Date(task.completedAt || task.updatedAt);
//       return completedDate >= date && completedDate < nextDay;
//     });
    
//     const dayFocusTime = dayTasks.reduce((total, task) => 
//       total + (task.actualTime || task.estimatedTime || 0), 0
//     );
    
//     dailyStats.push({
//       date: date.toISOString().split('T')[0],
//       tasksCompleted: dayTasks.length,
//       focusTime: dayFocusTime
//     });
//   }
  
//   const userData = {
//     name: userName || 'User',
//     userId: userId,
//     totalTasksCompleted: completedTasks.length,
//     totalFocusTime: totalFocusTime,
//     totalPomodoroSessions: completedTasks.length,
//     currentStreak: calculateStreak(completedTasks),
//     xp: completedTasks.length * 10,
//     level: Math.floor(completedTasks.length / 5) + 1,
//     dailyStats: dailyStats,
//     history: completedTasks.slice(-10).map(task => ({
//       _id: task._id,
//       title: task.title,
//       type: 'Task Completed',
//       completedAt: task.completedAt || task.updatedAt
//     }))
//   };
  
//   console.log('📊 Generated user data:', {
//     level: userData.level,
//     xp: userData.xp,
//     completed: userData.totalTasksCompleted,
//     streak: userData.currentStreak
//   });
  
//   return userData;
// };

// const calculateStreak = (completedTasks) => {
//   if (!completedTasks || completedTasks.length === 0) return 0;
  
//   const today = new Date();
//   today.setHours(23, 59, 59, 999);
  
//   let streak = 0;
//   let currentDate = new Date(today);
  
//   while (streak < 365) {
//     currentDate.setHours(0, 0, 0, 0);
//     const nextDay = new Date(currentDate);
//     nextDay.setDate(currentDate.getDate() + 1);
    
//     const hasTaskOnDate = completedTasks.some(task => {
//       if (!task.completedAt && !task.updatedAt) return false;
//       const completedDate = new Date(task.completedAt || task.updatedAt);
//       return completedDate >= currentDate && completedDate < nextDay;
//     });
    
//     if (hasTaskOnDate) {
//       streak++;
//       currentDate.setDate(currentDate.getDate() - 1);
//     } else {
//       break;
//     }
//   }
  
//   return streak;
// };
