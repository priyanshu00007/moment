'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { CircleCheck, Clock, ListTodo, TrendingUp, Star, Loader2, AlertCircle, RefreshCw, Target, Activity, Timer, Calendar, BarChart3 } from 'lucide-react';
import { format, subDays, isSameDay, startOfDay, isToday } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { taskApi, generateUserDataFromTasks } from '@/backend/lib/api';

// Enhanced Data Manager for comprehensive tracking
class DashboardDataManager {
  static storageKeys = {
    focusStats: 'focus-sessions-data',
    pomodoroStats: 'pomodoro-sessions-data', 
    taskAnalytics: 'tasks-analytics-data',
    dailyProgress: 'daily-progress-data'
  };

  // Get all focus session data
  static getFocusData() {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.storageKeys.focusStats);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading focus data:', error);
      return [];
    }
  }

  // Get all pomodoro session data
  static getPomodoroData() {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.storageKeys.pomodoroStats);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading pomodoro data:', error);
      return [];
    }
  }

  // Get all task analytics data
  static getTaskAnalytics() {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.storageKeys.taskAnalytics);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading task analytics:', error);
      return [];
    }
  }

  // Get consolidated daily statistics
  static getDailyStats() {
    const focusData = this.getFocusData();
    const pomodoroData = this.getPomodoroData();
    const taskData = this.getTaskAnalytics();

    const dailyStats = {};

    // Process focus sessions
    focusData.forEach(session => {
      const date = session.date || new Date(session.timestamp).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          focusTime: 0,
          focusSessions: 0,
          pomodoroTime: 0,
          pomodoroSessions: 0,
          tasksCreated: 0,
          tasksCompleted: 0,
          tasksStarted: 0,
          totalActiveTime: 0
        };
      }

      if (session.duration) {
        dailyStats[date].focusTime += Math.floor(session.duration / 60); // Convert to minutes
        dailyStats[date].totalActiveTime += Math.floor(session.duration / 60);
      }
      if (session.completed !== false) {
        dailyStats[date].focusSessions += 1;
      }
    });

    // Process pomodoro sessions
    pomodoroData.forEach(session => {
      const date = session.date || new Date(session.timestamp).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          focusTime: 0,
          focusSessions: 0,
          pomodoroTime: 0,
          pomodoroSessions: 0,
          tasksCreated: 0,
          tasksCompleted: 0,
          tasksStarted: 0,
          totalActiveTime: 0
        };
      }

      if (session.duration) {
        dailyStats[date].pomodoroTime += Math.floor(session.duration / 60); // Convert to minutes
        dailyStats[date].totalActiveTime += Math.floor(session.duration / 60);
      }
      if (session.completed !== false && session.type === 'work') {
        dailyStats[date].pomodoroSessions += 1;
      }
    });

    // Process task activities
    taskData.forEach(activity => {
      const date = activity.date || new Date(activity.timestamp).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          focusTime: 0,
          focusSessions: 0,
          pomodoroTime: 0,
          pomodoroSessions: 0,
          tasksCreated: 0,
          tasksCompleted: 0,
          tasksStarted: 0,
          totalActiveTime: 0
        };
      }

      switch (activity.type) {
        case 'task_created':
          dailyStats[date].tasksCreated += 1;
          break;
        case 'task_completed':
          dailyStats[date].tasksCompleted += 1;
          break;
        case 'session_started':
          dailyStats[date].tasksStarted += 1;
          break;
      }
    });

    return dailyStats;
  }

  // Get weekly data for charts
  static getWeeklyData() {
    const dailyStats = this.getDailyStats();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const targetDate = subDays(new Date(), i);
      const dateStr = targetDate.toISOString().split('T')[0];
      const dayStats = dailyStats[dateStr] || {
        date: dateStr,
        focusTime: 0,
        focusSessions: 0,
        pomodoroTime: 0,
        pomodoroSessions: 0,
        tasksCreated: 0,
        tasksCompleted: 0,
        tasksStarted: 0,
        totalActiveTime: 0
      };

      weekData.push({
        ...dayStats,
        name: format(targetDate, 'EEE'),
        fullDate: format(targetDate, 'MMM dd'),
        isToday: isToday(targetDate),
        totalSessions: dayStats.focusSessions + dayStats.pomodoroSessions,
        productivity: dayStats.tasksCompleted > 0 ? 
          Math.round((dayStats.tasksCompleted / Math.max(dayStats.tasksCreated, 1)) * 100) : 0
      });
    }

    return weekData;
  }

  // Get current streak
  static getCurrentStreak() {
    const dailyStats = this.getDailyStats();
    const sortedDates = Object.keys(dailyStats)
      .sort((a, b) => new Date(b) - new Date(a)); // Most recent first

    let streak = 0;
    const today = new Date();

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      const daysSinceToday = Math.floor((today - date) / (1000 * 60 * 60 * 24));
      
      if (daysSinceToday === streak) {
        const dayData = dailyStats[dateStr];
        if (dayData.totalActiveTime > 0 || dayData.tasksCompleted > 0) {
          streak++;
        } else {
          break;
        }
      } else if (daysSinceToday > streak) {
        break;
      }
    }

    return streak;
  }

  // Get total statistics
  static getTotalStats() {
    const dailyStats = this.getDailyStats();
    const totals = {
      totalFocusTime: 0,
      totalPomodoroTime: 0,
      totalFocusSessions: 0,
      totalPomodoroSessions: 0,
      totalTasksCreated: 0,
      totalTasksCompleted: 0,
      totalActiveTime: 0,
      averageDailyFocus: 0,
      mostProductiveDay: null,
      currentStreak: this.getCurrentStreak()
    };

    const days = Object.values(dailyStats);
    let mostProductiveScore = 0;

    days.forEach(day => {
      totals.totalFocusTime += day.focusTime;
      totals.totalPomodoroTime += day.pomodoroTime;
      totals.totalFocusSessions += day.focusSessions;
      totals.totalPomodoroSessions += day.pomodoroSessions;
      totals.totalTasksCreated += day.tasksCreated;
      totals.totalTasksCompleted += day.tasksCompleted;
      totals.totalActiveTime += day.totalActiveTime;

      // Calculate productivity score for the day
      const dayScore = day.totalActiveTime + (day.tasksCompleted * 30);
      if (dayScore > mostProductiveScore) {
        mostProductiveScore = dayScore;
        totals.mostProductiveDay = day.date;
      }
    });

    totals.averageDailyFocus = days.length > 0 ? 
      Math.round(totals.totalActiveTime / days.length) : 0;

    return totals;
  }

  // Get priority distribution from task analytics
  static getPriorityDistribution() {
    const taskData = this.getTaskAnalytics();
    const distribution = { high: 0, medium: 0, low: 0 };

    taskData
      .filter(activity => activity.type === 'task_completed')
      .forEach(activity => {
        if (activity.priority) {
          distribution[activity.priority] = (distribution[activity.priority] || 0) + 1;
        }
      });

    return distribution;
  }

  // Get session efficiency data
  static getSessionEfficiency() {
    const focusData = this.getFocusData();
    const pomodoroData = this.getPomodoroData();
    
    const efficiency = {
      focusCompletionRate: 0,
      pomodoroCompletionRate: 0,
      averageFocusSession: 0,
      averagePomodoroSession: 0
    };

    // Focus session efficiency
    const focusSessions = focusData.length;
    const completedFocusSessions = focusData.filter(s => s.completed !== false).length;
    efficiency.focusCompletionRate = focusSessions > 0 ? 
      Math.round((completedFocusSessions / focusSessions) * 100) : 0;

    const totalFocusDuration = focusData.reduce((acc, s) => acc + (s.duration || 0), 0);
    efficiency.averageFocusSession = focusSessions > 0 ? 
      Math.round(totalFocusDuration / focusSessions / 60) : 0; // in minutes

    // Pomodoro session efficiency
    const pomodoroSessions = pomodoroData.filter(s => s.type === 'work').length;
    const completedPomodoroSessions = pomodoroData.filter(s => s.type === 'work' && s.completed !== false).length;
    efficiency.pomodoroCompletionRate = pomodoroSessions > 0 ? 
      Math.round((completedPomodoroSessions / pomodoroSessions) * 100) : 0;

    const totalPomodoroDuration = pomodoroData
      .filter(s => s.type === 'work')
      .reduce((acc, s) => acc + (s.duration || 0), 0);
    efficiency.averagePomodoroSession = pomodoroSessions > 0 ? 
      Math.round(totalPomodoroDuration / pomodoroSessions / 60) : 0; // in minutes

    return efficiency;
  }
}

// Enhanced Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <div className={`text-xs px-2 py-1 rounded-full ${
          trend > 0 ? 'bg-green-100 text-green-700' : 
          trend < 0 ? 'bg-red-100 text-red-700' : 
          'bg-gray-100 text-gray-700'
        }`}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
    <div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  </div>
);

// Loading skeleton component
const StatCardSkeleton = () => (
  <div className="bg-gray-200 p-6 rounded-2xl animate-pulse">
    <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
    <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-300 rounded w-1/3"></div>
  </div>
);

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-800">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
            {entry.name.includes('Time') ? ' min' : 
             entry.name.includes('Rate') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardContent() {
  const { user, isLoaded } = useUser();
  
  const [userData, setUserData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Auto-refresh interval
  const refreshInterval = useRef(null);

  // Default user data
  const defaultUserData = {
    name: user?.firstName || user?.fullName || 'User',
    userId: user?.id || '',
    xp: 0,
    level: 1,
  };

  // Load and refresh dashboard data
  const loadDashboardData = () => {
    try {
      const totalStats = DashboardDataManager.getTotalStats();
      const weeklyData = DashboardDataManager.getWeeklyData();
      const priorityDistribution = DashboardDataManager.getPriorityDistribution();
      const sessionEfficiency = DashboardDataManager.getSessionEfficiency();
      
      setDashboardStats({
        ...totalStats,
        weeklyData,
        priorityDistribution,
        sessionEfficiency
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  // Fetch tasks from backend
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await taskApi.getTasks({ userId: "user123" });
      
      if (response.success && response.data) {
        const backendTasks = Array.isArray(response.data) ? response.data : [];
        setTasks(backendTasks);

        // Generate user data from tasks
        const generatedUserData = generateUserDataFromTasks(
          backendTasks,
          "user123",
          user?.firstName || user?.fullName || "User"
        );

        setUserData(generatedUserData);
        
      } else {
        throw new Error(response.error || 'API request failed');
      }
      
    } catch (err) {
      console.error('❌ Error in fetchTasks:', err);
      setError(`Failed to load data: ${err.message}`);
      
      // Set fallback data
      setTasks([]);
      setUserData(defaultUserData);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data when component mounts
  useEffect(() => {
    const initializeData = async () => {
      if (!isLoaded) return;
      
      // Load dashboard data from localStorage immediately
      loadDashboardData();
      
      // Fetch tasks from backend
      await fetchTasks();
    };

    initializeData();
  }, [isLoaded]);

  // Set up auto-refresh for localStorage data
  useEffect(() => {
    // Refresh dashboard data every 30 seconds
    refreshInterval.current = setInterval(() => {
      loadDashboardData();
    }, 30000);

    // Also refresh on window focus
    const handleFocus = () => {
      loadDashboardData();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Retry function
  const handleRetry = () => {
    setError(null);
    fetchTasks();
    loadDashboardData();
  };

  // Format time helper
  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-4">Unable to Load Dashboard</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={handleRetry}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const {
    name = defaultUserData.name,
    xp = 0,
    level = 1,
  } = userData || defaultUserData;

  const stats = dashboardStats || {
    totalFocusTime: 0,
    totalPomodoroTime: 0,
    totalFocusSessions: 0,
    totalPomodoroSessions: 0,
    totalTasksCompleted: 0,
    currentStreak: 0,
    weeklyData: [],
    priorityDistribution: { high: 0, medium: 0, low: 0 },
    sessionEfficiency: { focusCompletionRate: 0, pomodoroCompletionRate: 0 }
  };

  // Get completed tasks for recent activity
  const completedTasks = tasks
    .filter(task => task.status === 'completed')
    .sort((a, b) => new Date(b.completedAt || b.updatedAt) - new Date(a.completedAt || a.updatedAt))
    .slice(0, 10);

  const totalCompletedTasks = tasks.filter(task => task.status === 'completed').length;
  const pendingTasks = tasks.filter(task => task.status !== 'completed').length;

  // Priority distribution data for pie chart
  const priorityData = [
    { name: 'High', value: stats.priorityDistribution.high, color: '#ef4444' },
    { name: 'Medium', value: stats.priorityDistribution.medium, color: '#f59e0b' },
    { name: 'Low', value: stats.priorityDistribution.low, color: '#10b981' }
  ].filter(item => item.value > 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {name}! Here's your productivity overview.</p>
        </div>
        <div className="text-right mt-4 md:mt-0">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500">Current Level</p>
            <p className="text-2xl font-bold text-indigo-600">{level}</p>
            <p className="text-xs text-gray-400">{xp} XP</p>
          </div>
        </div>
      </div>
      
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Focus Time"
          value={formatTime(stats.totalActiveTime || 0)}
          subtitle={`${stats.totalFocusSessions + stats.totalPomodoroSessions} sessions completed`}
          icon={Clock}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        
        <StatCard
          title="Tasks Completed"
          value={totalCompletedTasks}
          subtitle={`${pendingTasks} tasks remaining`}
          icon={CircleCheck}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        
        <StatCard
          title="Current Streak"
          value={`${stats.currentStreak} days`}
          subtitle={stats.currentStreak > 0 ? "Keep it up!" : "Start your streak today"}
          icon={TrendingUp}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        
        <StatCard
          title="Focus Sessions"
          value={stats.totalFocusSessions}
          subtitle={`${stats.sessionEfficiency.focusCompletionRate}% completion rate`}
          icon={Target}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Pomodoro Sessions"
          value={stats.totalPomodoroSessions}
          subtitle={`${stats.sessionEfficiency.pomodoroCompletionRate}% completion rate`}
          icon={Timer}
          color="bg-gradient-to-br from-red-500 to-red-600"
        />
        
        <StatCard
          title="Average Daily Focus"
          value={formatTime(stats.averageDailyFocus || 0)}
          subtitle="Per day this week"
          icon={BarChart3}
          color="bg-gradient-to-br from-teal-500 to-teal-600"
        />
        
        <StatCard
          title="Most Productive"
          value={stats.mostProductiveDay ? format(new Date(stats.mostProductiveDay), 'MMM dd') : 'N/A'}
          subtitle="Best day so far"
          icon={Star}
          color="bg-gradient-to-br from-yellow-500 to-yellow-600"
        />
      </div>
      {/* Priority Distribution and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Priority Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Task Priorities</h2>
            <ListTodo className="w-5 h-5 text-gray-400" />
          </div>
          {priorityData.length > 0 ? (
            <>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                {priorityData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-600">{item.name} Priority</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ListTodo className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No completed tasks yet</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Completions</h2>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          {completedTasks.length > 0 ? (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {completedTasks.map((task, index) => (
                <div key={task._id || index} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CircleCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{task.title}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span>{task.category}</span>
                      {task.actualTime && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span>{formatTime(Math.floor(task.actualTime / 60))} spent</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-gray-400">
                      {task.completedAt 
                        ? format(new Date(task.completedAt), 'MMM dd')
                        : format(new Date(task.updatedAt), 'MMM dd')
                      }
                    </p>
                    <p className="text-xs text-gray-400">
                      {task.completedAt 
                        ? format(new Date(task.completedAt), 'h:mm a')
                        : format(new Date(task.updatedAt), 'h:mm a')
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CircleCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No completed tasks yet</p>
              <p className="text-sm">Complete tasks in focus or pomodoro mode to see them here!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 'use client';
// import React, { useState, useEffect } from 'react';
// import { useUser } from '@clerk/nextjs';
// import { CircleCheck, Clock, ListTodo, TrendingUp, Star, Loader2, AlertCircle, RefreshCw, Target } from 'lucide-react';
// import { format, subDays, isSameDay } from 'date-fns';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
// import { taskApi, generateUserDataFromTasks } from '@/backend/lib/api';

// // Helper function to get focus stats from localStorage
// const getFocusStats = () => {
//   if (typeof window === 'undefined') return {};
//   try {
//     return JSON.parse(localStorage.getItem('focusStats') || '{}');
//   } catch {
//     return {};
//   }
// };

// // Helper function to get pomodoro stats from localStorage
// const getPomodoroStats = () => {
//   if (typeof window === 'undefined') return {};
//   try {
//     return JSON.parse(localStorage.getItem('pomodoroStats') || '{}');
//   } catch {
//     return {};
//   }
// };

// // Helper function to combine focus and pomodoro stats
// const getCombinedStats = () => {
//   const focusStats = getFocusStats();
//   const pomodoroStats = getPomodoroStats();
//   const combined = {};

//   // Get all unique dates
//   const allDates = new Set([
//     ...Object.keys(focusStats),
//     ...Object.keys(pomodoroStats)
//   ]);

//   // Combine stats for each date
//   allDates.forEach(date => {
//     const focus = focusStats[date] || { totalFocusTime: 0, sessionsCompleted: 0, tasksWorkedOn: [] };
//     const pomodoro = pomodoroStats[date] || { totalFocusTime: 0, sessionsCompleted: 0, tasksWorkedOn: [] };

//     combined[date] = {
//       totalFocusTime: (focus.totalFocusTime || 0) + (pomodoro.totalFocusTime || 0),
//       focusSessions: focus.sessionsCompleted || 0,
//       pomodoroSessions: pomodoro.sessionsCompleted || 0,
//       totalSessions: (focus.sessionsCompleted || 0) + (pomodoro.sessionsCompleted || 0),
//       tasksWorkedOn: [
//         ...(Array.isArray(focus.tasksWorkedOn) ? focus.tasksWorkedOn : []),
//         ...(Array.isArray(pomodoro.tasksWorkedOn) ? pomodoro.tasksWorkedOn : [])
//       ]
//     };
//   });

//   return combined;
// };

// // Helper function to calculate total focus time
// const getTotalFocusTime = (combinedStats) => {
//   return Object.values(combinedStats).reduce((total, dayStats) => {
//     return total + (dayStats.totalFocusTime || 0);
//   }, 0);
// };

// // Helper function to calculate total focus sessions
// const getTotalFocusSessions = (combinedStats) => {
//   return Object.values(combinedStats).reduce((total, dayStats) => {
//     return total + (dayStats.focusSessions || 0);
//   }, 0);
// };

// // Helper function to calculate total pomodoro sessions
// const getTotalPomodoroSessions = (combinedStats) => {
//   return Object.values(combinedStats).reduce((total, dayStats) => {
//     return total + (dayStats.pomodoroSessions || 0);
//   }, 0);
// };

// // Helper function to get current streak
// const getCurrentStreak = (combinedStats) => {
//   const sortedDates = Object.keys(combinedStats).sort().reverse();
//   let streak = 0;
//   const today = new Date().toDateString();
  
//   for (const dateStr of sortedDates) {
//     const date = new Date(dateStr);
//     const daysSinceToday = Math.floor((new Date(today) - date) / (1000 * 60 * 60 * 24));
    
//     if (daysSinceToday === streak && combinedStats[dateStr].totalFocusTime > 0) {
//       streak++;
//     } else if (daysSinceToday > streak) {
//       break;
//     }
//   }
  
//   return streak;
// };

// // Loading skeleton component
// const StatCardSkeleton = () => (
//   <div className="bg-gray-200 p-6 rounded-2xl animate-pulse">
//     <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
//     <div className="h-8 bg-gray-300 rounded w-1/2"></div>
//   </div>
// );

// export default function DashboardContent() {
//   const { user, isLoaded } = useUser();
  
//   const [userData, setUserData] = useState(null);
//   const [tasks, setTasks] = useState([]);
//   const [combinedStats, setCombinedStats] = useState({});
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Default user data
//   const defaultUserData = {
//     name: user?.firstName || user?.fullName || 'User',
//     userId: user?.id || '',
//     xp: 0,
//     level: 1,
//     totalFocusTime: 0,
//     totalPomodoroSessions: 0,
//     currentStreak: 0,
//     history: [],
//     dailyStats: []
//   };

//   // Load combined stats from localStorage
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const stats = getCombinedStats();
//       setCombinedStats(stats);
//     }
//   }, []);

//   // Refresh stats and tasks periodically (every 30 seconds)
//   useEffect(() => {
//     const interval = setInterval(() => {
//       if (typeof window !== 'undefined') {
//         const stats = getCombinedStats();
//         setCombinedStats(stats);
//         // Also refresh tasks to get latest completed tasks
//         fetchTasks();
//       }
//     }, 30000);

//     return () => clearInterval(interval);
//   }, []);

//   // Fetch tasks from backend
//   const fetchTasks = async () => {
//     try {
//       setIsLoading(true);
//       setError(null);

//       // Use the same userId as TasksPage
//       const response = await taskApi.getTasks({ userId: "user123" });
      
//       if (response.success && response.data) {
//         const backendTasks = Array.isArray(response.data) ? response.data : [];
//         setTasks(backendTasks);

//         // Get combined stats from localStorage
//         const stats = getCombinedStats();
        
//         // Generate user data from tasks + combined stats
//         const generatedUserData = generateUserDataFromTasks(
//           backendTasks,
//           "user123",
//           "User"
//         );

//         // Enhance with combined stats
//         const enhancedUserData = {
//           ...generatedUserData,
//           totalFocusTime: Math.max(generatedUserData.totalFocusTime, getTotalFocusTime(stats)),
//           totalFocusSessions: getTotalFocusSessions(stats),
//           totalPomodoroSessions: Math.max(generatedUserData.totalPomodoroSessions, getTotalPomodoroSessions(stats)),
//           currentStreak: Math.max(generatedUserData.currentStreak, getCurrentStreak(stats))
//         };

//         setUserData(enhancedUserData);
        
//       } else {
//         throw new Error(response.error || 'API request failed');
//       }
      
//     } catch (err) {
//       console.error('❌ Error in fetchTasks:', err);
//       setError(`Failed to load data: ${err.message}`);
      
//       // Set fallback data with combined stats
//       const stats = getCombinedStats();
//       setTasks([]);
//       setUserData({
//         ...defaultUserData,
//         totalFocusTime: getTotalFocusTime(stats),
//         totalFocusSessions: getTotalFocusSessions(stats),
//         totalPomodoroSessions: getTotalPomodoroSessions(stats),
//         currentStreak: getCurrentStreak(stats)
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Initialize data when component mounts
//   useEffect(() => {
//     const initializeData = async () => {
//       if (!isLoaded) return;
//       await fetchTasks();
//     };

//     initializeData();
//   }, [isLoaded]);

//   // Retry function
//   const handleRetry = () => {
//     setError(null);
//     fetchTasks();
//   };

//   // Loading state
//   if (!isLoaded || isLoading) {
//     return (
//       <div className="p-4 sm:p-6 lg:p-8">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
//           <div className="flex items-center space-x-2">
//             <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
//             <span className="text-sm text-gray-500">Loading...</span>
//           </div>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
//           <StatCardSkeleton />
//           <StatCardSkeleton />
//           <StatCardSkeleton />
//           <StatCardSkeleton />
//           <StatCardSkeleton />
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <div className="p-4 sm:p-6 lg:p-8">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
//         </div>
        
//         <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
//           <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
//           <h2 className="text-xl font-semibold text-red-800 mb-4">Unable to Load Dashboard</h2>
//           <p className="text-red-600 mb-6">{error}</p>
//           <button 
//             onClick={handleRetry}
//             className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2 mx-auto"
//           >
//             <RefreshCw className="w-4 h-4" />
//             <span>Retry Connection</span>
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const {
//     name,
//     xp = 0,
//     level = 1,
//     totalFocusTime = 0,
//     totalFocusSessions = 0,
//     totalPomodoroSessions = 0,
//     currentStreak = 0,
//     dailyStats = []
//   } = userData || defaultUserData;

//   // Get completed tasks from the tasks array (same as TasksPage)
//   const completedTasks = tasks
//     .filter(task => task.status === 'completed')
//     .sort((a, b) => new Date(b.completedAt || b.updatedAt) - new Date(a.completedAt || a.updatedAt))
//     .slice(0, 10); // Show last 10 completed tasks

//   // Calculate total completed tasks count
//   const totalCompletedTasks = tasks.filter(task => task.status === 'completed').length;

//   // Prepare data for charts with combined stats
//   const weeklyFocusData = Array.from({ length: 7 }).map((_, index) => {
//     const targetDate = subDays(new Date(), 6 - index);
//     const dateStr = targetDate.toDateString();
//     const dayStats = combinedStats[dateStr];
//     const taskData = dailyStats.find(stat => isSameDay(new Date(stat.date), targetDate));
    
//     return {
//       name: format(targetDate, 'E'),
//       focusTime: dayStats?.totalFocusTime || 0,
//       focusSessions: dayStats?.focusSessions || 0,
//       pomodoroSessions: dayStats?.pomodoroSessions || 0,
//       totalSessions: dayStats?.totalSessions || 0,
//       tasksCompleted: taskData?.tasksCompleted || 0,
//     };
//   });

//   return (
//     <div className="p-4 sm:p-6 lg:p-8">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
//         <div className="text-right">
//           <p className="text-sm text-gray-500">Welcome back, {name}!</p>
//           <p className="text-xs text-gray-400">
//             {tasks.length === 0 
//               ? 'Create your first task to get started'
//               : `You have ${tasks.filter(t => t.status !== 'completed').length} active tasks`
//             }
//           </p>
//         </div>
//       </div>
      
//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
//         <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between hover:shadow-xl transition-shadow">
//           <div>
//             <p className="text-gray-500 text-sm mb-1">Level</p>
//             <h2 className="text-3xl font-bold text-gray-800">{level}</h2>
//             <p className="text-sm text-gray-500">{xp} XP</p>
//           </div>
//           <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white">
//             <Star size={24} fill="white" />
//           </div>
//         </div>
        
//         <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between hover:shadow-xl transition-shadow">
//           <div>
//             <p className="text-gray-500 text-sm mb-1">Focus Time</p>
//             <h2 className="text-3xl font-bold text-gray-800">{totalFocusTime}<span className="text-base text-gray-500">m</span></h2>
//             <p className="text-sm text-gray-500">
//               {Math.round(totalFocusTime / 60 * 10) / 10}h total
//             </p>
//           </div>
//           <Clock className="w-10 h-10 text-blue-500" />
//         </div>

//         <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between hover:shadow-xl transition-shadow">
//           <div>
//             <p className="text-gray-500 text-sm mb-1">Focus Sessions</p>
//             <h2 className="text-3xl font-bold text-gray-800">{totalFocusSessions || 0}</h2>
//             <p className="text-sm text-gray-500">
//               Deep work
//             </p>
//           </div>
//           <Target className="w-10 h-10 text-purple-500" />
//         </div>

//         <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between hover:shadow-xl transition-shadow">
//           <div>
//             <p className="text-gray-500 text-sm mb-1">Pomodoros</p>
//             <h2 className="text-3xl font-bold text-gray-800">{totalPomodoroSessions}</h2>
//             <p className="text-sm text-gray-500">
//               Completed
//             </p>
//           </div>
//           <ListTodo className="w-10 h-10 text-green-500" />
//         </div>

//         <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between hover:shadow-xl transition-shadow">
//           <div>
//             <p className="text-gray-500 text-sm mb-1">Tasks Done</p>
//             <h2 className="text-3xl font-bold text-gray-800">{totalCompletedTasks}</h2>
//             <p className="text-sm text-gray-500">
//               {tasks.filter(t => t.status === 'pending').length} pending
//             </p>
//           </div>
//           <CircleCheck className="w-10 h-10 text-emerald-500" />
//         </div>
//       </div>

//       {/* Weekly Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//         {/* Focus Time Chart */}
//         <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
//           <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Focus Time</h2>
//           {weeklyFocusData.some(d => d.focusTime > 0) ? (
//             <div style={{ width: '100%', height: 250 }}>
//               <ResponsiveContainer>
//                 <AreaChart data={weeklyFocusData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="name" />
//                   <YAxis />
//                   <Tooltip 
//                     formatter={(value, name) => [
//                       name === 'focusTime' ? `${value} min` : value,
//                       name === 'focusTime' ? 'Focus Time' : name
//                     ]} 
//                   />
//                   <Area type="monotone" dataKey="focusTime" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
//                 </AreaChart>
//               </ResponsiveContainer>
//             </div>
//           ) : (
//             <div className="text-center py-12 text-gray-500">
//               <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
//               <p>Start a focus session to see your progress!</p>
//             </div>
//           )}
//         </div>

//         {/* Sessions Chart */}
//         <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
//           <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Sessions</h2>
//           {weeklyFocusData.some(d => d.totalSessions > 0) ? (
//             <div style={{ width: '100%', height: 250 }}>
//               <ResponsiveContainer>
//                 <LineChart data={weeklyFocusData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="name" />
//                   <YAxis allowDecimals={false} />
//                   <Tooltip 
//                     formatter={(value, name) => [
//                       value,
//                       name === 'focusSessions' ? 'Focus Sessions' :
//                       name === 'pomodoroSessions' ? 'Pomodoro Sessions' : name
//                     ]} 
//                   />
//                   <Line 
//                     type="monotone" 
//                     dataKey="focusSessions" 
//                     stroke="#8b5cf6" 
//                     strokeWidth={2}
//                     dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
//                     name="focusSessions"
//                   />
//                   <Line 
//                     type="monotone" 
//                     dataKey="pomodoroSessions" 
//                     stroke="#10b981" 
//                     strokeWidth={2}
//                     dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
//                     name="pomodoroSessions"
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           ) : (
//             <div className="text-center py-12 text-gray-500">
//               <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
//               <p>Complete sessions to see your progress chart!</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Recent Activity - Now showing completed tasks from TasksPage */}
//       <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
//         <h2 className="text-xl font-bold text-gray-800 mb-4">Recently Completed Tasks</h2>
//         {completedTasks.length > 0 ? (
//           <ul className="space-y-4">
//             {completedTasks.map((task, index) => (
//               <li key={task._id || index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
//                 <CircleCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
//                 <div className="flex-1 min-w-0">
//                   <p className="font-semibold text-gray-700 truncate">{task.title}</p>
//                   <div className="flex items-center space-x-2 text-sm text-gray-500">
//                     <span className={`px-2 py-1 rounded-full text-xs ${
//                       task.priority === 'high' ? 'bg-red-100 text-red-700' :
//                       task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
//                       'bg-blue-100 text-blue-700'
//                     }`}>
//                       {task.priority}
//                     </span>
//                     <span className="text-gray-400">•</span>
//                     <span>{task.category}</span>
//                   </div>
//                 </div>
//                 <p className="text-sm text-gray-400 flex-shrink-0">
//                   {task.completedAt 
//                     ? format(new Date(task.completedAt), 'MMM d, h:mm a')
//                     : format(new Date(task.updatedAt), 'MMM d, h:mm a')
//                   }
//                 </p>
//               </li>
//             ))}
//           </ul>
//         ) : (
//           <div className="text-center py-8 text-gray-500">
//             <CircleCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
//             <p>No completed tasks yet.</p>
//             <p className="text-sm mt-1">Complete a task in focus or pomodoro mode to see it here!</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// 'use client';
// import React, { useState, useEffect } from 'react';
// import { useUser } from '@clerk/nextjs';
// import { CircleCheck, Clock, ListTodo, TrendingUp, Star, Loader2, AlertCircle, RefreshCw, Target } from 'lucide-react';
// import { format, subDays, isSameDay } from 'date-fns';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
// import { taskApi, generateUserDataFromTasks } from '@/backend/lib/api';

// // Helper function to get focus stats from localStorage
// const getFocusStats = () => {
//   if (typeof window === 'undefined') return {};
//   try {
//     return JSON.parse(localStorage.getItem('focusStats') || '{}');
//   } catch {
//     return {};
//   }
// };

// // Helper function to calculate total focus time
// const getTotalFocusTime = (focusStats) => {
//   return Object.values(focusStats).reduce((total, dayStats) => {
//     return total + (dayStats.totalFocusTime || 0);
//   }, 0);
// };

// // Helper function to calculate total focus sessions
// const getTotalFocusSessions = (focusStats) => {
//   return Object.values(focusStats).reduce((total, dayStats) => {
//     return total + (dayStats.sessionsCompleted || 0);
//   }, 0);
// };

// // Helper function to get current streak
// const getCurrentStreak = (focusStats) => {
//   const sortedDates = Object.keys(focusStats).sort().reverse();
//   let streak = 0;
//   const today = new Date().toDateString();
  
//   for (const dateStr of sortedDates) {
//     const date = new Date(dateStr);
//     const daysSinceToday = Math.floor((new Date(today) - date) / (1000 * 60 * 60 * 24));
    
//     if (daysSinceToday === streak && focusStats[dateStr].totalFocusTime > 0) {
//       streak++;
//     } else if (daysSinceToday > streak) {
//       break;
//     }
//   }
  
//   return streak;
// };

// // Loading skeleton component
// const StatCardSkeleton = () => (
//   <div className="bg-gray-200 p-6 rounded-2xl animate-pulse">
//     <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
//     <div className="h-8 bg-gray-300 rounded w-1/2"></div>
//   </div>
// );

// export default function DashboardContent() {
//   const { user, isLoaded } = useUser();
  
//   const [userData, setUserData] = useState(null);
//   const [tasks, setTasks] = useState([]);
//   const [focusStats, setFocusStats] = useState({});
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Default user data
//   const defaultUserData = {
//     name: user?.firstName || user?.fullName || 'User',
//     userId: user?.id || '',
//     xp: 0,
//     level: 1,
//     totalFocusTime: 0,
//     totalPomodoroSessions: 0,
//     currentStreak: 0,
//     history: [],
//     dailyStats: []
//   };

//   // Load focus stats from localStorage
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const stats = getFocusStats();
//       setFocusStats(stats);
//     }
//   }, []);

//   // Fetch tasks from backend
//   const fetchTasks = async () => {
//     if (!user?.id) {
//       console.warn('⚠️ No user ID available');
//       setIsLoading(false);
//       return;
//     }

//     try {
//       setIsLoading(true);
//       setError(null);

//       console.log('🔍 Starting data fetch process...');
//       console.log('👤 User ID:', user.id);

//       // Test connection first
//       const connectionTest = await taskApi.testConnection();
      
//       if (!connectionTest.success) {
//         console.error('❌ Backend connection failed:', connectionTest.error);
//         setError(`Backend not available: ${connectionTest.error}`);
        
//         // Set fallback data with focus stats
//         const stats = getFocusStats();
//         setTasks([]);
//         setUserData({
//           ...defaultUserData,
//           name: user.firstName || user.fullName || 'User',
//           totalFocusTime: getTotalFocusTime(stats),
//           currentStreak: getCurrentStreak(stats)
//         });
//         return;
//       }

//       // Fetch tasks
//       const response = await taskApi.getTasks({ userId: user.id });
      
//       if (response.success && response.data) {
//         const backendTasks = Array.isArray(response.data) ? response.data : [];
//         setTasks(backendTasks);

//         // Get focus stats from localStorage
//         const stats = getFocusStats();
        
//         // Generate user data from tasks + focus stats
//         const generatedUserData = generateUserDataFromTasks(
//           backendTasks,
//           user.id,
//           user.firstName || user.fullName || 'User'
//         );

//         // Enhance with focus stats
//         const enhancedUserData = {
//           ...generatedUserData,
//           totalFocusTime: Math.max(generatedUserData.totalFocusTime, getTotalFocusTime(stats)),
//           totalFocusSessions: getTotalFocusSessions(stats),
//           currentStreak: Math.max(generatedUserData.currentStreak, getCurrentStreak(stats))
//         };

//         setUserData(enhancedUserData);
        
//       } else {
//         throw new Error(response.error || 'API request failed');
//       }
      
//     } catch (err) {
//       console.error('❌ Error in fetchTasks:', err);
//       setError(`Failed to load data: ${err.message}`);
      
//       // Set fallback data with focus stats
//       const stats = getFocusStats();
//       setTasks([]);
//       setUserData({
//         ...defaultUserData,
//         name: user.firstName || user.fullName || 'User',
//         totalFocusTime: getTotalFocusTime(stats),
//         currentStreak: getCurrentStreak(stats)
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Initialize data when component mounts
//   useEffect(() => {
//     const initializeData = async () => {
//       if (!isLoaded) return;
      
//       if (!user?.id) {
//         const stats = getFocusStats();
//         setUserData({
//           ...defaultUserData,
//           totalFocusTime: getTotalFocusTime(stats),
//           currentStreak: getCurrentStreak(stats)
//         });
//         setIsLoading(false);
//         return;
//       }

//       await fetchTasks();
//     };

//     initializeData();
//   }, [isLoaded, user?.id]);

//   // Retry function
//   const handleRetry = () => {
//     setError(null);
//     fetchTasks();
//   };

//   // Loading state
//   if (!isLoaded || isLoading) {
//     return (
//       <div className="p-4 sm:p-6 lg:p-8">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
//           <div className="flex items-center space-x-2">
//             <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
//             <span className="text-sm text-gray-500">Loading...</span>
//           </div>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
//           <StatCardSkeleton />
//           <StatCardSkeleton />
//           <StatCardSkeleton />
//           <StatCardSkeleton />
//           <StatCardSkeleton />
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <div className="p-4 sm:p-6 lg:p-8">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
//         </div>
        
//         <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
//           <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
//           <h2 className="text-xl font-semibold text-red-800 mb-4">Unable to Load Dashboard</h2>
//           <p className="text-red-600 mb-6">{error}</p>
//           <button 
//             onClick={handleRetry}
//             className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2 mx-auto"
//           >
//             <RefreshCw className="w-4 h-4" />
//             <span>Retry Connection</span>
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // No user state
//   if (!user) {
//     return (
//       <div className="p-4 sm:p-6 lg:p-8">
//         <div className="text-center py-12">
//           <h1 className="text-2xl font-bold text-gray-800 mb-4">Please Sign In</h1>
//           <p className="text-gray-600">You need to be signed in to view your dashboard.</p>
//         </div>
//       </div>
//     );
//   }

//   const {
//     name,
//     xp = 0,
//     level = 1,
//     totalFocusTime = 0,
//     totalFocusSessions = 0,
//     totalPomodoroSessions = 0,
//     currentStreak = 0,
//     history = [],
//     dailyStats = []
//   } = userData || defaultUserData;

//   // Prepare data for charts
//   const weeklyFocusData = Array.from({ length: 7 }).map((_, index) => {
//     const targetDate = subDays(new Date(), 6 - index);
//     const dateStr = targetDate.toDateString();
//     const focusData = focusStats[dateStr];
//     const taskData = dailyStats.find(stat => isSameDay(new Date(stat.date), targetDate));
    
//     return {
//       name: format(targetDate, 'E'),
//       focusTime: focusData?.totalFocusTime || 0,
//       tasksCompleted: taskData?.tasksCompleted || 0,
//     };
//   });

//   return (
//     <div className="p-4 sm:p-6 lg:p-8">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
//         <div className="text-right">
//           <p className="text-sm text-gray-500">Welcome back, {name}!</p>
//           <p className="text-xs text-gray-400">
//             {tasks.length === 0 
//               ? 'Create your first task to get started'
//               : `You have ${tasks.filter(t => t.status !== 'completed').length} active tasks`
//             }
//           </p>
//         </div>
//       </div>
      
//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
//         <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between hover:shadow-xl transition-shadow">
//           <div>
//             <p className="text-gray-500 text-sm mb-1">Level</p>
//             <h2 className="text-3xl font-bold text-gray-800">{level}</h2>
//             <p className="text-sm text-gray-500">{xp} XP</p>
//           </div>
//           <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white">
//             <Star size={24} fill="white" />
//           </div>
//         </div>
        
//         <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between hover:shadow-xl transition-shadow">
//           <div>
//             <p className="text-gray-500 text-sm mb-1">Focus Time</p>
//             <h2 className="text-3xl font-bold text-gray-800">{totalFocusTime}<span className="text-base text-gray-500">m</span></h2>
//             <p className="text-sm text-gray-500">
//               {Math.round(totalFocusTime / 60 * 10) / 10}h total
//             </p>
//           </div>
//           <Clock className="w-10 h-10 text-blue-500" />
//         </div>

//         <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between hover:shadow-xl transition-shadow">
//           <div>
//             <p className="text-gray-500 text-sm mb-1">Focus Sessions</p>
//             <h2 className="text-3xl font-bold text-gray-800">{totalFocusSessions || 0}</h2>
//             <p className="text-sm text-gray-500">
//               Completed
//             </p>
//           </div>
//           <Target className="w-10 h-10 text-purple-500" />
//         </div>

//         <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between hover:shadow-xl transition-shadow">
//           <div>
//             <p className="text-gray-500 text-sm mb-1">Tasks Done</p>
//             <h2 className="text-3xl font-bold text-gray-800">{totalPomodoroSessions}</h2>
//             <p className="text-sm text-gray-500">
//               {tasks.filter(t => t.status === 'pending').length} pending
//             </p>
//           </div>
//           <ListTodo className="w-10 h-10 text-green-500" />
//         </div>

//         <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between hover:shadow-xl transition-shadow">
//           <div>
//             <p className="text-gray-500 text-sm mb-1">Streak</p>
//             <h2 className="text-3xl font-bold text-gray-800">{currentStreak}<span className="text-base text-gray-500">d</span></h2>
//             <p className="text-sm text-gray-500">
//               {currentStreak > 0 ? 'Keep it up!' : 'Start today!'}
//             </p>
//           </div>
//           <TrendingUp className="w-10 h-10 text-indigo-500" />
//         </div>
//       </div>

//       {/* Weekly Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//         {/* Focus Time Chart */}
//         <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
//           <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Focus Time</h2>
//           {weeklyFocusData.some(d => d.focusTime > 0) ? (
//             <div style={{ width: '100%', height: 250 }}>
//               <ResponsiveContainer>
//                 <AreaChart data={weeklyFocusData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="name" />
//                   <YAxis />
//                   <Tooltip formatter={(value) => [`${value} min`, 'Focus Time']} />
//                   <Area type="monotone" dataKey="focusTime" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
//                 </AreaChart>
//               </ResponsiveContainer>
//             </div>
//           ) : (
//             <div className="text-center py-12 text-gray-500">
//               <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
//               <p>Start a focus session to see your progress!</p>
//             </div>
//           )}
//         </div>

//         {/* Task Completion Chart */}
//         <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
//           <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Task Completion</h2>
//           {weeklyFocusData.some(d => d.tasksCompleted > 0) ? (
//             <div style={{ width: '100%', height: 250 }}>
//               <ResponsiveContainer>
//                 <LineChart data={weeklyFocusData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="name" />
//                   <YAxis allowDecimals={false} />
//                   <Tooltip formatter={(value) => [value, 'Tasks Completed']} />
//                   <Line 
//                     type="monotone" 
//                     dataKey="tasksCompleted" 
//                     stroke="#10b981" 
//                     strokeWidth={3}
//                     dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           ) : (
//             <div className="text-center py-12 text-gray-500">
//               <ListTodo className="w-12 h-12 mx-auto mb-4 opacity-50" />
//               <p>Complete tasks to see your progress chart!</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Recent Activity */}
//       <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
//         <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
//         {history && history.length > 0 ? (
//           <ul className="space-y-4">
//             {history.slice(0, 5).map((activity, index) => (
//               <li key={activity._id || index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
//                 <CircleCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
//                 <div className="flex-1 min-w-0">
//                   <p className="font-semibold text-gray-700 truncate">{activity.title}</p>
//                   <p className="text-sm text-gray-500">{activity.type}</p>
//                 </div>
//                 <p className="text-sm text-gray-400 flex-shrink-0">
//                   {format(new Date(activity.completedAt), 'MMM d')}
//                 </p>
//               </li>
//             ))}
//           </ul>
//         ) : (
//           <div className="text-center py-8 text-gray-500">
//             <CircleCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
//             <p>No completed tasks yet.</p>
//             <p className="text-sm mt-1">Finish a task to see it here!</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// //   'use client';
// //   import React, { useState, useEffect } from 'react';
// //   import { useUser } from '@clerk/nextjs';
// //   import { CircleCheck, Clock, ListTodo, TrendingUp, Star, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
// //   import { format, subDays, isSameDay } from 'date-fns';
// //   import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// //   import { taskApi, generateUserDataFromTasks } from '@/backend/lib/api';

// //   // Loading skeleton component
// //   const StatCardSkeleton = () => (
// //     <div className="bg-gray-200 p-6 rounded-2xl animate-pulse">
// //       <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
// //       <div className="h-8 bg-gray-300 rounded w-1/2"></div>
// //     </div>
// //   );

// //   export default function DashboardContent() {
// //     // Clerk user
// //     const { user, isLoaded } = useUser();
    
// //     // State management
// //     const [userData, setUserData] = useState(null);
// //     const [tasks, setTasks] = useState([]);
// //     const [isLoading, setIsLoading] = useState(true);
// //     const [error, setError] = useState(null);

// //     // Default user data
// //     const defaultUserData = {
// //       name: user?.firstName || user?.fullName || 'User',
// //       userId: user?.id || '',
// //       xp: 0,
// //       level: 1,
// //       totalFocusTime: 0,
// //       totalPomodoroSessions: 0,
// //       currentStreak: 0,
// //       history: [],
// //       dailyStats: []
// //     };

// //     // Fetch tasks from backend
// //     const fetchTasks = async () => {
// //       if (!user?.id) {
// //         console.warn('⚠️ No user ID available');
// //         setIsLoading(false);
// //         return;
// //       }

// //       try {
// //         setIsLoading(true);
// //         setError(null);

// //         console.log('🔍 Starting data fetch process...');
// //         console.log('👤 User ID:', user.id);
// //         console.log('👤 User name:', user.firstName || user.fullName);

// //         // Test connection first
// //         console.log('🧪 Testing backend connection...');
// //         const connectionTest = await taskApi.testConnection();
        
// //         if (!connectionTest.success) {
// //           console.error('❌ Backend connection failed:', connectionTest.error);
// //           setError(`Backend not available: ${connectionTest.error}`);
          
// //           // Set fallback data
// //           setTasks([]);
// //           setUserData({
// //             ...defaultUserData,
// //             name: user.firstName || user.fullName || 'User'
// //           });
// //           return;
// //         }

// //         console.log('✅ Backend connection successful');

// //         // Fetch tasks
// //         console.log('📡 Fetching tasks from backend...');
// //         const response = await taskApi.getTasks({ userId: user.id });
        
// //         console.log('📡 API Response:', {
// //           success: response.success,
// //           dataType: typeof response.data,
// //           dataLength: Array.isArray(response.data) ? response.data.length : 'Not array',
// //           error: response.error
// //         });
        
// //         if (response.success && response.data) {
// //           const backendTasks = Array.isArray(response.data) ? response.data : [];
// //           console.log(`✅ Successfully loaded ${backendTasks.length} tasks`);
          
// //           setTasks(backendTasks);

// //           // Generate user data from tasks
// //           const generatedUserData = generateUserDataFromTasks(
// //             backendTasks,
// //             user.id,
// //             user.firstName || user.fullName || 'User'
// //           );

// //           setUserData(generatedUserData);
          
// //           console.log('✅ Data fetch completed successfully');
          
// //         } else {
// //           console.error('❌ API returned unsuccessful response:', response);
// //           throw new Error(response.error || response.message || 'API request failed');
// //         }
        
// //       } catch (err) {
// //         console.error('❌ Error in fetchTasks:', err);
// //         console.error('❌ Error stack:', err.stack);
        
// //         setError(`Failed to load data: ${err.message}`);
        
// //         // Set fallback data
// //         setTasks([]);
// //         setUserData({
// //           ...defaultUserData,
// //           name: user.firstName || user.fullName || 'User'
// //         });
// //       } finally {
// //         setIsLoading(false);
// //       }
// //     };

// //     // Initialize data when component mounts
// //     useEffect(() => {
// //       const initializeData = async () => {
// //         if (!isLoaded) return;
        
// //         if (!user?.id) {
// //           console.log('👤 No user available, setting default data');
// //           setUserData(defaultUserData);
// //           setIsLoading(false);
// //           return;
// //         }

// //         await fetchTasks();
// //       };

// //       initializeData();
// //     }, [isLoaded, user?.id]);

// //     // Retry function
// //     const handleRetry = () => {
// //       setError(null);
// //       fetchTasks();
// //     };

// //     // Loading state
// //     if (!isLoaded || isLoading) {
// //       return (
// //         <div className="p-4 sm:p-6 lg:p-8">
// //           <div className="flex justify-between items-center mb-6">
// //             <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
// //             <div className="flex items-center space-x-2">
// //               <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
// //               <span className="text-sm text-gray-500">Loading...</span>
// //             </div>
// //           </div>
// //           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
// //             <StatCardSkeleton />
// //             <StatCardSkeleton />
// //             <StatCardSkeleton />
// //             <StatCardSkeleton />
// //           </div>
// //           <div className="bg-gray-200 p-6 rounded-2xl shadow-lg h-80 animate-pulse"></div>
// //         </div>
// //       );
// //     }

// //     // Error state
// //     if (error) {
// //       return (
// //         <div className="p-4 sm:p-6 lg:p-8">
// //           <div className="flex justify-between items-center mb-6">
// //             <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
// //           </div>
          
// //           <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
// //             <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
// //             <h2 className="text-xl font-semibold text-red-800 mb-4">Unable to Load Dashboard</h2>
// //             <p className="text-red-600 mb-6 leading-relaxed">{error}</p>
            
// //             <div className="space-y-4">
// //               <button 
// //                 onClick={handleRetry}
// //                 className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2 mx-auto"
// //               >
// //                 <RefreshCw className="w-4 h-4" />
// //                 <span>Retry Connection</span>
// //               </button>
              
// //               <div className="text-sm text-red-700 bg-red-100 p-4 rounded-lg">
// //                 <strong>Troubleshooting:</strong>
// //                 <ul className="mt-2 space-y-1 text-left">
// //                   <li>• Make sure your backend server is running on port 5000</li>
// //                   <li>• Check that MongoDB is connected</li>
// //                   <li>• Verify your environment variables are correct</li>
// //                 </ul>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       );
// //     }

// //     // No user state
// //     if (!user) {
// //       return (
// //         <div className="p-4 sm:p-6 lg:p-8">
// //           <div className="text-center py-12">
// //             <h1 className="text-2xl font-bold text-gray-800 mb-4">Please Sign In</h1>
// //             <p className="text-gray-600">You need to be signed in to view your dashboard.</p>
// //           </div>
// //         </div>
// //       );
// //     }

// //     // Use props directly or fallback to default
// //     const {
// //       name,
// //       xp = 0,
// //       level = 1,
// //       totalFocusTime = 0,
// //       totalPomodoroSessions = 0,
// //       currentStreak = 0,
// //       history = [],
// //       dailyStats = []
// //     } = userData || defaultUserData;

// //     // Prepare data for the weekly chart
// //     const weeklyData = Array.from({ length: 7 }).map((_, index) => {
// //       const targetDate = subDays(new Date(), 6 - index);
// //       const dayStat = dailyStats.find(stat => isSameDay(new Date(stat.date), targetDate));
// //       return {
// //         name: format(targetDate, 'E'), // e.g., 'Mon'
// //         tasksCompleted: dayStat ? dayStat.tasksCompleted : 0,
// //       };
// //     });

// //     return (
// //       <div className="p-4 sm:p-6 lg:p-8">
// //         {/* Header */}
// //         <div className="flex justify-between items-center mb-6">
// //           <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
// //           <div className="text-right">
// //             <p className="text-sm text-gray-500">Welcome back, {name}!</p>
// //             <p className="text-xs text-gray-400">
// //               {tasks.length === 0 
// //                 ? 'Create your first task to get started'
// //                 : `You have ${tasks.filter(t => t.status !== 'completed').length} active tasks`
// //               }
// //             </p>
// //           </div>
// //         </div>
        
// //         {/* Stats Cards */}
// //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
// //           <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between hover:shadow-xl transition-shadow">
// //             <div>
// //               <p className="text-gray-500 text-sm mb-1">Level</p>
// //               <h2 className="text-3xl font-bold text-gray-800">{level}</h2>
// //               <p className="text-sm text-gray-500">{xp} XP</p>
// //             </div>
// //             <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white">
// //               <Star size={24} fill="white" />
// //             </div>
// //           </div>
          
// //           <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between hover:shadow-xl transition-shadow">
// //             <div>
// //               <p className="text-gray-500 text-sm mb-1">Total Focus Time</p>
// //               <h2 className="text-3xl font-bold text-gray-800">{totalFocusTime} <span className="text-base text-gray-500">min</span></h2>
// //               <p className="text-sm text-gray-500">
// //                 {Math.round(totalFocusTime / 60 * 10) / 10} hours
// //               </p>
// //             </div>
// //             <Clock className="w-10 h-10 text-blue-500" />
// //           </div>

// //           <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between hover:shadow-xl transition-shadow">
// //             <div>
// //               <p className="text-gray-500 text-sm mb-1">Completed Tasks</p>
// //               <h2 className="text-3xl font-bold text-gray-800">{totalPomodoroSessions}</h2>
// //               <p className="text-sm text-gray-500">
// //                 {tasks.filter(t => t.status === 'pending').length} pending
// //               </p>
// //             </div>
// //             <ListTodo className="w-10 h-10 text-green-500" />
// //           </div>

// //           <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between hover:shadow-xl transition-shadow">
// //             <div>
// //               <p className="text-gray-500 text-sm mb-1">Current Streak</p>
// //               <h2 className="text-3xl font-bold text-gray-800">{currentStreak} <span className="text-base text-gray-500">days</span></h2>
// //               <p className="text-sm text-gray-500">
// //                 {currentStreak > 0 ? 'Keep it up!' : 'Start today!'}
// //               </p>
// //             </div>
// //             <TrendingUp className="w-10 h-10 text-indigo-500" />
// //           </div>
// //         </div>

// //         {/* Weekly Chart */}
// //         <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 hover:shadow-xl transition-shadow">
// //           <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Task Completion</h2>
// //           {weeklyData.some(d => d.tasksCompleted > 0) ? (
// //             <div style={{ width: '100%', height: 300 }}>
// //               <ResponsiveContainer>
// //                 <LineChart data={weeklyData}>
// //                   <CartesianGrid strokeDasharray="3 3" />
// //                   <XAxis dataKey="name" />
// //                   <YAxis allowDecimals={false} />
// //                   <Tooltip 
// //                     formatter={(value) => [value, 'Tasks Completed']}
// //                     labelFormatter={(label) => `Day: ${label}`}
// //                   />
// //                   <Line 
// //                     type="monotone" 
// //                     dataKey="tasksCompleted" 
// //                     name="Tasks Completed" 
// //                     stroke="#6366f1" 
// //                     strokeWidth={3}
// //                     dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
// //                     activeDot={{ r: 6 }}
// //                   />
// //                 </LineChart>
// //               </ResponsiveContainer>
// //             </div>
// //           ) : (
// //             <div className="text-center py-12 text-gray-500">
// //               <ListTodo className="w-12 h-12 mx-auto mb-4 opacity-50" />
// //               <p>Complete some tasks to see your progress chart!</p>
// //             </div>
// //           )}
// //         </div>

// //         {/* Recent Activity */}
// //         <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
// //           <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
// //           {history && history.length > 0 ? (
// //             <ul className="space-y-4">
// //               {history.slice(0, 5).map((activity, index) => (
// //                 <li key={activity._id || index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
// //                   <CircleCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
// //                   <div className="flex-1 min-w-0">
// //                     <p className="font-semibold text-gray-700 truncate">{activity.title}</p>
// //                     <p className="text-sm text-gray-500">{activity.type}</p>
// //                   </div>
// //                   <p className="text-sm text-gray-400 flex-shrink-0">
// //                     {format(new Date(activity.completedAt), 'MMM d')}
// //                   </p>
// //                 </li>
// //               ))}
// //             </ul>
// //           ) : (
// //             <div className="text-center py-8 text-gray-500">
// //               <CircleCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
// //               <p>No completed tasks yet.</p>
// //               <p className="text-sm mt-1">Finish a task to see it here!</p>
// //             </div>
// //           )}
// //         </div>
// //       </div>
// //     );
// //   }

// // // 'use client';
// // // import React, { useState, useEffect } from 'react';
// // // import { useUser } from '@clerk/nextjs';
// // // import { Menu, X, Loader2 } from 'lucide-react';
// // // import { format } from 'date-fns';
// // // import { taskApi, generateUserDataFromTasks } from '@/backend/lib/api';

// // // // Import all the components
// // // import Sidebar from '@/app/components/Sidebar';
// // // import DashboardContent from '@/app/components/DashboardContent';
// // // import FocusModeContent from '@/app/components/FocusModeContent';
// // // import PomodoroContent from '@/app/components/PomodoroContent';
// // // import TasksPage from '@/app/components/TasksPage';
// // // import SettingsContent from '@/app/components/SettingsContent';
// // // import ProfileContent from '@/app/components/ProfileContent';
// // // import AIAssistantContent from '@/app/components/AIAssistantContent';
// // // import ProductivityModal from '@/app/components/ProductivityModal';
// // // import WelcomeModal from '@/app/components/WelcomeModal';

// // // export default function Home() {
// // //   // Clerk user
// // //   const { user, isLoaded } = useUser();
  
// // //   // UI State
// // //   const [activeSection, setActiveSection] = useState('tasks');
// // //   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
// // //   const [activeTask, setActiveTask] = useState(null);
  
// // //   // Data State
// // //   const [tasks, setTasks] = useState([]);
// // //   const [userData, setUserData] = useState(null);
// // //   const [productivityLevel, setProductivityLevel] = useState(null);
  
// // //   // Modal State
// // //   const [showProductivityModal, setShowProductivityModal] = useState(false);
// // //   const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
// // //   // Loading State
// // //   const [isLoading, setIsLoading] = useState(true);
// // //   const [isInitialized, setIsInitialized] = useState(false);

// // //   // Default user data
// // //   const defaultUserData = {
// // //     name: user?.firstName || user?.fullName || 'User',
// // //     userId: user?.id || '',
// // //     totalTasksCompleted: 0,
// // //     totalFocusTime: 0,
// // //     totalPomodoroSessions: 0,
// // //     currentStreak: 0,
// // //     xp: 0,
// // //     level: 1,
// // //     dailyStats: [],
// // //     history: [],
// // //     stats: { pending: 0, inProgress: 0, completed: 0, total: 0 }
// // //   };

// // //   // Initialize data when user loads
// // //   useEffect(() => {
// // //     const initializeData = async () => {
// // //       if (!isLoaded) return;
      
// // //       if (!user?.id) {
// // //         setIsLoading(false);
// // //         return;
// // //       }

// // //       try {
// // //         setIsLoading(true);

// // //         // Check if user is new (first time)
// // //         const isNewUser = !localStorage.getItem(`user-initialized-${user.id}`);
        
// // //         // Load productivity level from localStorage
// // //         const storedProductivity = localStorage.getItem(`productivity-level-${user.id}`);
// // //         if (storedProductivity) {
// // //           setProductivityLevel(storedProductivity);
// // //         }

// // //         // Fetch tasks from backend
// // //         await fetchTasks();

// // //         // Show modals for new users
// // //         if (isNewUser) {
// // //           setShowWelcomeModal(true);
// // //         } else if (!storedProductivity) {
// // //           setShowProductivityModal(true);
// // //         }

// // //         // Mark user as initialized
// // //         localStorage.setItem(`user-initialized-${user.id}`, 'true');
// // //         setIsInitialized(true);

// // //       } catch (error) {
// // //         console.error('Error initializing data:', error);
// // //         setUserData(defaultUserData);
// // //       } finally {
// // //         setIsLoading(false);
// // //       }
// // //     };

// // //     initializeData();
// // //   }, [isLoaded, user?.id]);

// // //   // Fetch tasks from backend
// // //  // Update your fetchTasks function in DashboardContent.jsx
// // // const fetchTasks = async () => {
// // //   if (!user?.id) {
// // //     console.warn('⚠️ No user ID available');
// // //     return;
// // //   }

// // //   try {
// // //     setLoading(true);
// // //     setError(null);

// // //     console.log('🔍 Starting data fetch process...');
// // //     console.log('👤 User ID:', user.id);
// // //     console.log('👤 User name:', user.firstName || user.fullName);

// // //     // Test connection first
// // //     console.log('🧪 Testing backend connection...');
// // //     const connectionTest = await taskApi.testConnection();
    
// // //     if (!connectionTest.success) {
// // //       console.error('❌ Backend connection failed:', connectionTest.error);
// // //       setError(`Backend not available: ${connectionTest.error}`);
      
// // //       // Set fallback data
// // //       setTasks([]);
// // //       setUserData({
// // //         ...defaultUserData,
// // //         name: user.firstName || user.fullName || 'User'
// // //       });
// // //       return;
// // //     }

// // //     console.log('✅ Backend connection successful');

// // //     // Fetch tasks
// // //     console.log('📡 Fetching tasks from backend...');
// // //     const response = await taskApi.getTasks({ userId: user.id });
    
// // //     console.log('📡 API Response:', {
// // //       success: response.success,
// // //       dataType: typeof response.data,
// // //       dataLength: Array.isArray(response.data) ? response.data.length : 'Not array',
// // //       error: response.error
// // //     });
    
// // //     if (response.success && response.data) {
// // //       const backendTasks = Array.isArray(response.data) ? response.data : [];
// // //       console.log(`✅ Successfully loaded ${backendTasks.length} tasks`);
      
// // //       // Convert backend tasks to local format
// // //       const convertedTasks = backendTasks.map(task => ({
// // //         id: task._id,
// // //         _id: task._id,
// // //         title: task.title,
// // //         description: task.description,
// // //         category: task.category,
// // //         priority: task.priority,
// // //         status: task.status,
// // //         dueDate: task.dueDate,
// // //         estimatedTime: task.estimatedTime,
// // //         actualTime: task.actualTime,
// // //         progress: task.progress,
// // //         tags: task.tags,
// // //         completed: task.status === 'completed',
// // //         completedAt: task.completedAt,
// // //         createdAt: task.createdAt,
// // //         updatedAt: task.updatedAt,
// // //         userId: task.userId
// // //       }));

// // //       setTasks(convertedTasks);

// // //       // Generate user data
// // //       const generatedUserData = generateUserDataFromTasks(
// // //         backendTasks,
// // //         user.id,
// // //         user.firstName || user.fullName || 'User'
// // //       );

// // //       setUserData(generatedUserData);
      
// // //       console.log('✅ Data fetch completed successfully');
      
// // //     } else {
// // //       console.error('❌ API returned unsuccessful response:', response);
// // //       throw new Error(response.error || response.message || 'API request failed');
// // //     }
    
// // //   } catch (err) {
// // //     console.error('❌ Error in fetchTasks:', err);
// // //     console.error('❌ Error stack:', err.stack);
    
// // //     setError(`Failed to load data: ${err.message}`);
    
// // //     // Set fallback data
// // //     setTasks([]);
// // //     setUserData({
// // //       ...defaultUserData,
// // //       name: user.firstName || user.fullName || 'User'
// // //     });
// // //   } finally {
// // //     setLoading(false);
// // //   }
// // // };


// // //   // Handle section navigation
// // //   const handleSectionChange = (section, task = null) => {
// // //     setActiveSection(section);
// // //     setActiveTask(task);
// // //     setIsSidebarOpen(false);
// // //   };

// // //   // Handle productivity level setting
// // //   const handleSetProductivity = (level) => {
// // //     setProductivityLevel(level);
// // //     setShowProductivityModal(false);
    
// // //     // Save to localStorage
// // //     if (user?.id) {
// // //       localStorage.setItem(`productivity-level-${user.id}`, level);
// // //     }
// // //   };

// // //   // Handle welcome modal completion
// // //   const handleSetUserInfo = (info) => {
// // //     setShowWelcomeModal(false);
// // //     setShowProductivityModal(true);
// // //   };

// // //   // Handle task completion (for Pomodoro/Focus mode)
// // //   const handleTaskCompletion = async (taskId, duration) => {
// // //     try {
// // //       // Complete task in backend
// // //       const response = await taskApi.completeTask(taskId);
      
// // //       if (response.success) {
// // //         // Update local tasks
// // //         setTasks(prevTasks =>
// // //           prevTasks.map(task =>
// // //             task._id === taskId ? { ...task, status: 'completed', completedAt: new Date().toISOString() } : task
// // //           )
// // //         );

// // //         // Refresh user data
// // //         await fetchTasks();
// // //       }
// // //     } catch (error) {
// // //       console.error('Error completing task:', error);
// // //     }
// // //   };

// // //   // CRUD Operations for tasks
// // //   const createTask = async (newTaskData) => {
// // //     if (!user?.id) return;

// // //     try {
// // //       const taskToCreate = {
// // //         ...newTaskData,
// // //         userId: user.id,
// // //         status: 'pending'
// // //       };

// // //       const response = await taskApi.createTask(taskToCreate);
      
// // //       if (response.success && response.data) {
// // //         setTasks(prevTasks => [response.data, ...prevTasks]);
// // //         await fetchTasks(); // Refresh to update stats
// // //         return response.data;
// // //       }
// // //     } catch (error) {
// // //       console.error('Error creating task:', error);
// // //       throw error;
// // //     }
// // //   };

// // //   const updateTask = async (taskId, updates) => {
// // //     try {
// // //       const response = await taskApi.updateTask(taskId, updates);
      
// // //       if (response.success && response.data) {
// // //         setTasks(prevTasks =>
// // //           prevTasks.map(task =>
// // //             task._id === taskId ? response.data : task
// // //           )
// // //         );
// // //         await fetchTasks(); // Refresh to update stats
// // //         return response.data;
// // //       }
// // //     } catch (error) {
// // //       console.error('Error updating task:', error);
// // //       throw error;
// // //     }
// // //   };

// // //   const deleteTask = async (taskId) => {
// // //     try {
// // //       const response = await taskApi.deleteTask(taskId);
      
// // //       if (response.success) {
// // //         setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
// // //         await fetchTasks(); // Refresh to update stats
// // //       }
// // //     } catch (error) {
// // //       console.error('Error deleting task:', error);
// // //       throw error;
// // //     }
// // //   };

// // //   // Render content based on active section
// // //   const renderContent = () => {
// // //     const commonProps = {
// // //       tasks,
// // //       userData,
// // //       user,
// // //       refreshData: fetchTasks
// // //     };

// // //     switch (activeSection) {
// // //       case 'dashboard':
// // //         return <DashboardContent {...commonProps} />;
        
// // //       case 'focus':
// // //         return (
// // //           <FocusModeContent
// // //             {...commonProps}
// // //             activeTask={activeTask}
// // //             onTaskComplete={handleTaskCompletion}
// // //           />
// // //         );
        
// // //       case 'pomodoro':
// // //         return (
// // //           <PomodoroContent
// // //             {...commonProps}
// // //             activeTask={activeTask}
// // //             onTaskComplete={handleTaskCompletion}
// // //           />
// // //         );
        
// // //       case 'tasks':
// // //         return (
// // //           <TasksPage
// // //             {...commonProps}
// // //             onPlayTask={handleSectionChange}
// // //             productivityLevel={productivityLevel}
// // //             createTask={createTask}
// // //             updateTask={updateTask}
// // //             deleteTask={deleteTask}
// // //             onTaskComplete={handleTaskCompletion}
// // //           />
// // //         );
        
// // //       case 'settings':
// // //         return (
// // //           <SettingsContent
// // //             {...commonProps}
// // //             productivityLevel={productivityLevel}
// // //             setProductivityLevel={setProductivityLevel}
// // //           />
// // //         );
        
// // //       case 'profile':
// // //         return (
// // //           <ProfileContent
// // //             {...commonProps}
// // //             productivityLevel={productivityLevel}
// // //             setProductivityLevel={setProductivityLevel}
// // //             setShowProductivityModal={setShowProductivityModal}
// // //           />
// // //         );
        
// // //       case 'ai':
// // //         return <AIAssistantContent {...commonProps} />;
        
// // //       default:
// // //         return <DashboardContent {...commonProps} />;
// // //     }
// // //   };

// // //   // Loading state
// // //   if (!isLoaded || isLoading) {
// // //     return (
// // //       <div className="flex items-center justify-center min-h-screen bg-gray-100">
// // //         <div className="text-center">
// // //           <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
// // //           <p className="text-gray-600">Loading your workspace...</p>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   // Not authenticated
// // //   if (!user) {
// // //     return (
// // //       <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700">
// // //         <div className="text-center text-white">
// // //           <h1 className="text-4xl font-bold mb-4">Welcome to Focus App</h1>
// // //           <p className="text-xl mb-8">Please sign in to continue</p>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div className="flex flex-col md:flex-row h-screen bg-gray-100">
// // //       {/* Mobile Header */}
// // //       <div className="md:hidden p-4 flex justify-between items-center bg-white shadow-md">
// // //         <h1 className="text-xl font-bold text-gray-800">Focus App</h1>
// // //         <button
// // //           onClick={() => setIsSidebarOpen(!isSidebarOpen)}
// // //           className="p-2 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
// // //         >
// // //           {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
// // //         </button>
// // //       </div>

// // //       {/* Mobile Overlay */}
// // //       {isSidebarOpen && (
// // //         <div
// // //           className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 md:hidden"
// // //           onClick={() => setIsSidebarOpen(false)}
// // //         ></div>
// // //       )}

// // //       {/* Sidebar */}
// // //       <Sidebar
// // //         activeSection={activeSection}
// // //         handleSectionChange={handleSectionChange}
// // //         isSidebarOpen={isSidebarOpen}
// // //         setIsSidebarOpen={setIsSidebarOpen}
// // //         userData={userData}
// // //       />

// // //       {/* Main Content */}
// // //       <main className="flex-1 flex flex-col overflow-y-auto">
// // //         <div className="flex-1">
// // //           {renderContent()}
// // //         </div>
// // //       </main>

// // //       {/* Modals */}
// // //       {showProductivityModal && (
// // //         <ProductivityModal
// // //           isOpen={showProductivityModal}
// // //           onSubmit={handleSetProductivity}
// // //         />
// // //       )}

// // //       {showWelcomeModal && (
// // //         <WelcomeModal
// // //           isOpen={showWelcomeModal}
// // //           onSubmit={handleSetUserInfo}
// // //           userName={user?.firstName || user?.fullName || 'User'}
// // //         />
// // //       )}
// // //     </div>
// // //   );
// // // }
