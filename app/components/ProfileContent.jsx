'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, CheckSquare, Edit, Flame, Target, Calendar, Trophy, Activity,
  Palette, Brain, MessageCircle, FileText, Star, TrendingUp, MapPin, 
  Briefcase, Globe, Heart, Sparkles, Clock, Zap, Play, Trash2, Loader2, X, Focus, Timer, Check, Filter, Search, Award, Users, TrendingDown, ChevronDown, CircleCheck, Plus
} from "lucide-react";
import { format } from 'date-fns';
import EditProfileModal from './EditProfileModal';
import { taskApi } from '@/backend/lib/api';

// ------ Enhanced StartTaskModal Component ------
function StartTaskModal({ isOpen, onClose, onSelectMode, task }) {
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm" 
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 50, opacity: 0 }} 
            animate={{ scale: 1, y: 0, opacity: 1 }} 
            exit={{ scale: 0.9, y: 50, opacity: 0 }} 
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative border border-gray-100" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Focus Mode</h2>
              {task && (
                <p className="text-gray-600">
                  Ready to start: <span className="font-semibold text-blue-600">{task.title}</span>
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => onSelectMode('focus')} 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-3"
              >
                <Focus className="w-5 h-5" />
                <div className="text-left">
                  <div>Focus Mode</div>
                  <div className="text-xs opacity-90">Deep work session</div>
                </div>
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => onSelectMode('pomodoro')} 
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-3"
              >
                <Timer className="w-5 h-5" />
                <div className="text-left">
                  <div>Pomodoro Technique</div>
                  <div className="text-xs opacity-90">25 min focused bursts</div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ------ Enhanced Animation Variants ------
const containerVariants = { 
  hidden: { opacity: 0, y: 20 }, 
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      staggerChildren: 0.1,
      ease: "easeOut"
    } 
  } 
};

const itemVariants = { 
  hidden: { y: 30, opacity: 0 }, 
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  } 
};

// ------ User Data Hook ------
function useUserData() {
  const [data, setData] = useState({ 
    tasksCompleted: 0, 
    habitStreak: { count: 0 }, 
    coursesFinished: 0 
  });
  
  useEffect(() => {
    try {
      const storedData = JSON.parse(localStorage.getItem('user_data') || '{}');
      setData({ 
        tasksCompleted: storedData.tasksCompleted || 0, 
        habitStreak: storedData.habitStreak || { count: 0 }, 
        coursesFinished: storedData.coursesFinished || 0 
      });
    } catch (error) { 
      console.error('Failed to load user data:', error); 
    }
  }, []);
  
  return data;
}

// ------ Main Profile Page Component ------
export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { tasksCompleted, habitStreak, coursesFinished } = useUserData();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userStats, setUserStats] = useState({ 
    totalPoints: 0, 
    rank: 'Beginner', 
    joinDate: null, 
    lastActive: null 
  });
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskFilter, setTaskFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for the StartTaskModal
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [taskToStart, setTaskToStart] = useState(null);

  useEffect(() => {
    if (user) {
      loadUserStats();
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user?.id) return;
    setLoadingTasks(true);
    try {
      const response = await taskApi.getTasks({ userId: "user123" }); // Using same userId as your other components
      if (response.success && response.data) {
        const sortedTasks = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setTasks(sortedTasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };
  
  const handleShowStartModal = (task) => {
    setTaskToStart(task);
    setIsStartModalOpen(true);
  };
  
  const handleGainXP = (amount) => {
    setUserStats(prevStats => ({
      ...prevStats, 
      totalPoints: prevStats.totalPoints + amount 
    }));
    console.log(`User gained ${amount} XP. New total: ${userStats.totalPoints + amount}`);
  };

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    try {
      await taskApi.updateTask(task._id, { 
        status: newStatus,
        progress: { percentage: newStatus === 'completed' ? 100 : task.progress?.percentage || 0 },
        completedAt: newStatus === 'completed' ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error("Failed to update task:", error);
      setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? { ...t, status: task.status } : t));
    }
  };
  
  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    const originalTasks = tasks;
    setTasks(prevTasks => prevTasks.filter(t => t._id !== taskId));
    try {
      await taskApi.deleteTask(taskId);
    } catch (error) {
      console.error("Failed to delete task:", error);
      setTasks(originalTasks);
    }
  };
  
  const handleEditTask = (task) => {
    alert(`Editing task: ${task.title}`);
  };

  const loadUserStats = () => {
    try {
      const stats = JSON.parse(localStorage.getItem('user_stats') || '{}');
      const userStatsData = stats[user.id] || { 
        totalPoints: 0, 
        rank: 'Beginner', 
        joinDate: user.createdAt, 
        lastActive: new Date().toISOString() 
      };
      setUserStats(userStatsData);
    } catch (error) { 
      console.error('Failed to load stats:', error); 
    }
  };
  
  const getRankInfo = (rank) => {
    const rankData = { 
      'Beginner': { color: 'bg-gray-500', gradient: 'from-gray-400 to-gray-600' },
      'Intermediate': { color: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600' },
      'Advanced': { color: 'bg-purple-500', gradient: 'from-purple-400 to-purple-600' },
      'Expert': { color: 'bg-yellow-500', gradient: 'from-yellow-400 to-yellow-600' },
      'Master': { color: 'bg-red-500', gradient: 'from-red-400 to-red-600' }
    };
    return rankData[rank] || rankData['Beginner'];
  };
  
  const getNextRankProgress = (points) => {
    if (points < 100) return (points / 100) * 100;
    if (points < 500) return ((points - 100) / 400) * 100;
    if (points < 1000) return ((points - 500) / 500) * 100;
    if (points < 2000) return ((points - 1000) / 1000) * 100;
    return 100;
  };

  // Filter and search tasks
  const filteredTasks = tasks.filter(task => {
    const matchesFilter = taskFilter === 'all' || task.status === taskFilter;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    pending: tasks.filter(t => t.status === 'pending').length
  };

  // Separate tasks by status for different sections
  const completedTasks = filteredTasks.filter(task => task.status === 'completed');
  const activeTasks = filteredTasks.filter(task => task.status !== 'completed');

  if (!isLoaded) { 
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          </motion.div>
          <p className="text-blue-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    ); 
  }
  
  if (!isSignedIn) { 
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Spark!</h2>
          <p className="text-gray-600">Please sign in to view your profile and manage your tasks.</p>
        </div>
      </div>
    ); 
  }

  const rankInfo = getRankInfo(userStats.rank);

  return (
    <>
      <EditProfileModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
      <StartTaskModal 
        isOpen={isStartModalOpen} 
        onClose={() => setIsStartModalOpen(false)} 
        task={taskToStart} 
        onSelectMode={(mode) => { 
          setIsStartModalOpen(false); 
          console.log(`Selected ${mode} for task: ${taskToStart?.title}`);
        }} 
      />

      <motion.div 
        className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6" 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
      >
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Enhanced Header */}
          <motion.div variants={itemVariants} className="text-center py-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent flex items-center justify-center gap-3">
                <Sparkles className="w-10 h-10 text-blue-500" />
                My Profile
              </h1>
              <p className="text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
                Track your journey, showcase your achievements, and level up your productivity!
              </p>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Enhanced Profile Card */}
            <motion.div className="xl:col-span-1" variants={itemVariants}>
              <Card className="bg-white/95 backdrop-blur shadow-2xl rounded-3xl overflow-hidden h-full border-0">
                <div className={`bg-gradient-to-br ${rankInfo.gradient} p-8 text-white relative overflow-hidden`}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white"></div>
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white"></div>
                  </div>
                  
                  <div className="relative z-10">
                    <motion.div 
                      className="flex justify-between items-start mb-6"
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Trophy className="w-8 h-8 text-yellow-300" />
                      <Badge className="bg-white/20 text-white border-white/30">
                        Level {Math.floor(userStats.totalPoints / 100) + 1}
                      </Badge>
                    </motion.div>
                    
                    <div className="text-center">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Avatar className="h-32 w-32 mb-4 ring-4 ring-white/50 ring-offset-4 ring-offset-transparent mx-auto shadow-2xl">
                          <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
                          <AvatarFallback className="text-3xl bg-white/20 backdrop-blur text-white border-2 border-white/30">
                            {user.fullName?.charAt(0) || user.primaryEmailAddress?.emailAddress?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                      
                      <Badge className="bg-white/20 text-white border-white/30 px-4 py-1 rounded-full shadow-md mb-4">
                        {userStats.rank}
                      </Badge>
                      
                      <h2 className="text-3xl font-bold mb-2">
                        {user.fullName || 'New User'}
                      </h2>
                      <p className="text-white/80 text-sm">
                        {user.primaryEmailAddress?.emailAddress}
                      </p>
                      
                      <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-white/80">Next Rank Progress</span>
                          <span className="text-sm font-bold">{Math.round(getNextRankProgress(userStats.totalPoints))}%</span>
                        </div>
                        <Progress value={getNextRankProgress(userStats.totalPoints)} className="h-2 bg-white/20" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20">
                        <div className="text-center">
                          <Star className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
                          <div className="text-2xl font-bold">{userStats.totalPoints}</div>
                          <div className="text-xs text-white/80">Total XP</div>
                        </div>
                        <div className="text-center">
                          <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-200" />
                          <div className="text-sm font-semibold">
                            {userStats.joinDate ? new Date(userStats.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                          </div>
                          <div className="text-xs text-white/80">Joined</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <Button 
                    onClick={() => setIsEditModalOpen(true)} 
                    className="w-full mb-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all rounded-xl h-12"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  
                  <Separator className="my-6" />
                  
                  <div className="space-y-4">
                    {/* Profile Information Cards */}
                    {[
                      { key: 'primaryGoal', icon: Target, label: 'Primary Goal', color: 'text-blue-600' },
                      { key: 'bio', icon: FileText, label: 'Bio', color: 'text-purple-600' },
                      { key: 'jobTitle', icon: Briefcase, label: 'Job Title', color: 'text-green-600' },
                      { key: 'location', icon: MapPin, label: 'Location', color: 'text-red-600' },
                      { key: 'skills', icon: Star, label: 'Skills', color: 'text-yellow-600' },
                      { key: 'interests', icon: Heart, label: 'Interests', color: 'text-pink-600' }
                    ].map(({ key, icon: Icon, label, color }) => {
                      const value = user.unsafeMetadata?.[key];
                      return value ? (
                        <motion.div 
                          key={key}
                          whileHover={{ scale: 1.02, x: 4 }}
                          className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
                        >
                          <Icon className={`w-5 h-5 ${color} mt-0.5 flex-shrink-0`} />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-800 text-sm">{label}</p>
                            <p className="text-gray-600 text-sm break-words">{value}</p>
                          </div>
                        </motion.div>
                      ) : null;
                    })}
                    
                    {!user.unsafeMetadata?.primaryGoal && (
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="text-center p-4 border-2 border-dashed border-gray-300 rounded-xl"
                      >
                        <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <Button 
                          variant="ghost" 
                          onClick={() => setIsEditModalOpen(true)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          Set Your Goals & Info
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="xl:col-span-3 space-y-8">
              {/* Enhanced Statistics Card */}
              <motion.div variants={itemVariants}>
                <Card className="bg-white shadow-xl rounded-3xl overflow-hidden border-0">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                    <CardTitle className="flex items-center gap-3 text-blue-900 text-2xl">
                      <TrendingUp className="w-7 h-7 text-blue-600" />
                      Your Statistics
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base">
                      Track your progress and celebrate your achievements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {[
                        { 
                          icon: CheckSquare, 
                          value: taskStats.completed, 
                          label: 'Tasks Completed', 
                          color: 'text-emerald-500', 
                          bg: 'from-emerald-50 to-emerald-100',
                          border: 'border-emerald-200'
                        },
                        { 
                          icon: Flame, 
                          value: `${habitStreak.count} Days`, 
                          label: 'Current Streak', 
                          color: 'text-orange-500', 
                          bg: 'from-orange-50 to-orange-100',
                          border: 'border-orange-200'
                        },
                        { 
                          icon: Activity, 
                          value: taskStats.inProgress, 
                          label: 'In Progress', 
                          color: 'text-blue-500', 
                          bg: 'from-blue-50 to-blue-100',
                          border: 'border-blue-200'
                        },
                        { 
                          icon: BookOpen, 
                          value: coursesFinished, 
                          label: 'Courses Finished', 
                          color: 'text-purple-500', 
                          bg: 'from-purple-50 to-purple-100',
                          border: 'border-purple-200'
                        }
                      ].map((stat, index) => (
                        <motion.div 
                          key={stat.label}
                          className={`p-6 rounded-2xl bg-gradient-to-br ${stat.bg} border-2 ${stat.border} text-center group hover:scale-105 transition-all duration-300 cursor-pointer`}
                          whileHover={{ y: -4 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <stat.icon className={`w-10 h-10 mx-auto mb-3 ${stat.color} group-hover:scale-110 transition-transform`} />
                          <p className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</p>
                          <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Tasks Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Tasks */}
                <motion.div variants={itemVariants}>
                  <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-800">Active Tasks</h2>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {activeTasks.length} tasks
                      </Badge>
                    </div>
                    
                    {loadingTasks ? (
                      <div className="flex justify-center items-center h-32">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      </div>
                    ) : activeTasks.length > 0 ? (
                      <ul className="space-y-4">
                        {activeTasks.slice(0, 5).map((task, index) => (
                          <li key={task._id || index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                            <button
                              onClick={() => handleToggleComplete(task)}
                              className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 flex-shrink-0 transition-all"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-700 truncate">{task.title}</p>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {task.priority}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span>{task.category}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleShowStartModal(task)}
                                className="p-1 text-blue-500 hover:text-blue-600"
                                title="Start Task"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditTask(task)}
                                className="p-1 text-gray-500 hover:text-blue-600"
                                title="Edit Task"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task._id)}
                                className="p-1 text-gray-500 hover:text-red-600"
                                title="Delete Task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No active tasks.</p>
                        <p className="text-sm mt-1">Create a new task to get started!</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Recently Completed Tasks */}
                <motion.div variants={itemVariants}>
                  <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Recently Completed Tasks</h2>
                    {completedTasks.length > 0 ? (
                      <ul className="space-y-4">
                        {completedTasks.slice(0, 5).map((task, index) => (
                          <li key={task._id || index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                            <CircleCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-700 truncate">{task.title}</p>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {task.priority}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span>{task.category}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-400 flex-shrink-0">
                              {task.completedAt 
                                ? format(new Date(task.completedAt), 'MMM d, h:mm a')
                                : format(new Date(task.updatedAt), 'MMM d, h:mm a')
                              }
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CircleCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No completed tasks yet.</p>
                        <p className="text-sm mt-1">Complete a task in focus or pomodoro mode to see it here!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// 'use client';

// import { useState, useEffect } from 'react';
// import { useUser } from '@clerk/nextjs';
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   BookOpen, CheckSquare, Edit, Flame, Target, Calendar, Trophy, Activity,
//   Palette, Brain, MessageCircle, FileText, Star, TrendingUp, MapPin, 
//   Briefcase, Globe, Heart, Sparkles, Clock, Zap, Play, Trash2, Loader2, X, Focus, Timer, Check, Filter, Search, Award, Users, TrendingDown, ChevronDown
// } from "lucide-react";
// import EditProfileModal from './EditProfileModal';
// import { taskApi } from '@/backend/lib/api';

// // ------ Enhanced StartTaskModal Component ------
// function StartTaskModal({ isOpen, onClose, onSelectMode, task }) {
//   if (!isOpen) return null;
  
//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <motion.div 
//           initial={{ opacity: 0 }} 
//           animate={{ opacity: 1 }} 
//           exit={{ opacity: 0 }} 
//           className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm" 
//           onClick={onClose}
//         >
//           <motion.div 
//             initial={{ scale: 0.9, y: 50, opacity: 0 }} 
//             animate={{ scale: 1, y: 0, opacity: 1 }} 
//             exit={{ scale: 0.9, y: 50, opacity: 0 }} 
//             className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative border border-gray-100" 
//             onClick={(e) => e.stopPropagation()}
//           >
//             <button 
//               onClick={onClose} 
//               className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
//             >
//               <X className="w-5 h-5" />
//             </button>
            
//             <div className="text-center mb-8">
//               <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <Play className="w-8 h-8 text-white" />
//               </div>
//               <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Focus Mode</h2>
//               {task && (
//                 <p className="text-gray-600">
//                   Ready to start: <span className="font-semibold text-blue-600">{task.title}</span>
//                 </p>
//               )}
//             </div>
            
//             <div className="space-y-3">
//               <motion.button 
//                 whileHover={{ scale: 1.02, y: -2 }} 
//                 whileTap={{ scale: 0.98 }} 
//                 onClick={() => onSelectMode('focus')} 
//                 className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-3"
//               >
//                 <Focus className="w-5 h-5" />
//                 <div className="text-left">
//                   <div>Focus Mode</div>
//                   <div className="text-xs opacity-90">Deep work session</div>
//                 </div>
//               </motion.button>
              
//               <motion.button 
//                 whileHover={{ scale: 1.02, y: -2 }} 
//                 whileTap={{ scale: 0.98 }} 
//                 onClick={() => onSelectMode('pomodoro')} 
//                 className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-3"
//               >
//                 <Timer className="w-5 h-5" />
//                 <div className="text-left">
//                   <div>Pomodoro Technique</div>
//                   <div className="text-xs opacity-90">25 min focused bursts</div>
//                 </div>
//               </motion.button>
//             </div>
//           </motion.div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }

// // ------ New Task List Item Component (Dashboard Style) ------
// function TaskListItem({ task, index, onToggleComplete, onDelete, onEdit, onShowStartModal, onGainXP }) {
//   const [isFadingOut, setIsFadingOut] = useState(false);
  
//   const priorityConfig = { 
//     urgent: { color: "text-red-700", bg: "bg-red-100" },
//     high: { color: "text-red-700", bg: "bg-red-100" },
//     medium: { color: "text-yellow-700", bg: "bg-yellow-100" },
//     low: { color: "text-green-700", bg: "bg-green-100" }
//   };
  
//   const isCompleted = task.status === 'completed';
//   const priority = priorityConfig[task.priority] || priorityConfig.medium;

//   const handleToggle = async (e) => {
//     e.stopPropagation();
//     if (isCompleted) {
//       await onToggleComplete(task);
//       return;
//     }
//     setIsFadingOut(true);
//     await new Promise(resolve => setTimeout(resolve, 600));
//     await onToggleComplete(task);
//     if (onGainXP) onGainXP(15);
//     setIsFadingOut(false);
//   };

//   const handleDelete = (e) => { e.stopPropagation(); onDelete(task._id); };
//   const handleEdit = (e) => { e.stopPropagation(); onEdit(task); };
//   const handleStart = (e) => { e.stopPropagation(); onShowStartModal(task); };

//   return (
//     <motion.li 
//       initial={{ opacity: 0, x: -20 }} 
//       animate={{ opacity: 1, x: 0 }} 
//       exit={{ opacity: 0, x: 20 }} 
//       transition={{ duration: 0.3, delay: index * 0.05 }}
//       className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group relative"
//     >
//       {/* Completion Animation Overlay */}
//       <AnimatePresence>
//         {isFadingOut && (
//           <motion.div 
//             initial={{ opacity: 0, scale: 0.8 }} 
//             animate={{ opacity: 1, scale: 1 }} 
//             exit={{ opacity: 0, scale: 1.2 }} 
//             transition={{ duration: 0.5 }} 
//             className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center z-10"
//           >
//             <div className="text-white text-center">
//               <Check className="w-8 h-8 mx-auto mb-1" />
//               <p className="text-sm font-semibold">+15 XP</p>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Completion Status Icon */}
//       <motion.button
//         whileHover={{ scale: 1.1 }}
//         whileTap={{ scale: 0.9 }}
//         onClick={handleToggle}
//         className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
//           isCompleted 
//             ? "bg-green-500 border-green-500" 
//             : "border-gray-300 hover:border-green-400 hover:bg-green-50"
//         }`}
//       >
//         {isCompleted && <Check className="w-4 h-4 text-white" />}
//       </motion.button>

//       {/* Task Content */}
//       <div className="flex-1 min-w-0">
//         <div className="flex items-start justify-between">
//           <div className="flex-1">
//             <p className={`font-semibold text-gray-800 truncate ${isCompleted ? "line-through text-gray-500" : ""}`}>
//               {task.title}
//             </p>
//             <div className="flex items-center space-x-3 mt-1">
//               {/* Priority Badge */}
//               <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.bg} ${priority.color}`}>
//                 {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1) || 'Medium'}
//               </span>
              
//               {/* Category */}
//               <span className="text-gray-400">•</span>
//               <span className="text-sm text-gray-600">{task.category || 'General'}</span>
              
//               {/* Estimated Time */}
//               {task.estimatedTime && (
//                 <>
//                   <span className="text-gray-400">•</span>
//                   <div className="flex items-center text-sm text-gray-600">
//                     <Clock className="w-3 h-3 mr-1" />
//                     {task.estimatedTime} min
//                   </div>
//                 </>
//               )}

//               {/* Due Date */}
//               {task.dueDate && (
//                 <>
//                   <span className="text-gray-400">•</span>
//                   <div className="flex items-center text-sm text-gray-600">
//                     <Calendar className="w-3 h-3 mr-1" />
//                     {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>

//           {/* Completion Time */}
//           <p className="text-sm text-gray-400 flex-shrink-0 ml-4">
//             {isCompleted && task.completedAt 
//               ? new Date(task.completedAt).toLocaleDateString('en-US', { 
//                   month: 'short', 
//                   day: 'numeric',
//                   hour: 'numeric',
//                   minute: '2-digit'
//                 })
//               : task.createdAt
//               ? new Date(task.createdAt).toLocaleDateString('en-US', { 
//                   month: 'short', 
//                   day: 'numeric'
//                 })
//               : 'Recently'
//             }
//           </p>
//         </div>

//         {/* Task Description */}
//         {task.description && (
//           <p className={`text-sm text-gray-500 mt-2 line-clamp-1 ${isCompleted ? "line-through" : ""}`}>
//             {task.description}
//           </p>
//         )}
//       </div>

//       {/* Action Buttons */}
//       <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
//         {!isCompleted && (
//           <motion.button
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.9 }}
//             onClick={handleStart}
//             className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
//             title="Start Task"
//           >
//             <Play className="w-4 h-4" />
//           </motion.button>
//         )}
//         <motion.button
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//           onClick={handleEdit}
//           className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
//           title="Edit Task"
//         >
//           <Edit className="w-4 h-4" />
//         </motion.button>
//         <motion.button
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//           onClick={handleDelete}
//           className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
//           title="Delete Task"
//         >
//           <Trash2 className="w-4 h-4" />
//         </motion.button>
//       </div>
//     </motion.li>
//   );
// }

// // ------ Enhanced Animation Variants ------
// const containerVariants = { 
//   hidden: { opacity: 0, y: 20 }, 
//   visible: { 
//     opacity: 1, 
//     y: 0,
//     transition: { 
//       duration: 0.6,
//       staggerChildren: 0.1,
//       ease: "easeOut"
//     } 
//   } 
// };

// const itemVariants = { 
//   hidden: { y: 30, opacity: 0 }, 
//   visible: { 
//     y: 0, 
//     opacity: 1,
//     transition: {
//       duration: 0.5,
//       ease: "easeOut"
//     }
//   } 
// };

// // ------ User Data Hook ------
// function useUserData() {
//   const [data, setData] = useState({ 
//     tasksCompleted: 0, 
//     habitStreak: { count: 0 }, 
//     coursesFinished: 0 
//   });
  
//   useEffect(() => {
//     try {
//       const storedData = JSON.parse(localStorage.getItem('user_data') || '{}');
//       setData({ 
//         tasksCompleted: storedData.tasksCompleted || 0, 
//         habitStreak: storedData.habitStreak || { count: 0 }, 
//         coursesFinished: storedData.coursesFinished || 0 
//       });
//     } catch (error) { 
//       console.error('Failed to load user data:', error); 
//     }
//   }, []);
  
//   return data;
// }

// // ------ Main Profile Page Component ------
// export default function ProfilePage() {
//   const { user, isLoaded, isSignedIn } = useUser();
//   const { tasksCompleted, habitStreak, coursesFinished } = useUserData();
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [userStats, setUserStats] = useState({ 
//     totalPoints: 0, 
//     rank: 'Beginner', 
//     joinDate: null, 
//     lastActive: null 
//   });
//   const [tasks, setTasks] = useState([]);
//   const [loadingTasks, setLoadingTasks] = useState(true);
//   const [taskFilter, setTaskFilter] = useState('all');
//   const [searchQuery, setSearchQuery] = useState('');
  
//   // State for the StartTaskModal
//   const [isStartModalOpen, setIsStartModalOpen] = useState(false);
//   const [taskToStart, setTaskToStart] = useState(null);

//   useEffect(() => {
//     if (user) {
//       loadUserStats();
//       loadTasks();
//     }
//   }, [user]);

//   const loadTasks = async () => {
//     if (!user?.id) return;
//     setLoadingTasks(true);
//     try {
//       const response = await taskApi.getTasks({ userId: user.id });
//       if (response.success && response.data) {
//         const sortedTasks = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//         setTasks(sortedTasks);
//       }
//     } catch (error) {
//       console.error('Failed to load tasks:', error);
//     } finally {
//       setLoadingTasks(false);
//     }
//   };
  
//   const handleShowStartModal = (task) => {
//     setTaskToStart(task);
//     setIsStartModalOpen(true);
//   };
  
//   const handleGainXP = (amount) => {
//     setUserStats(prevStats => ({
//       ...prevStats, 
//       totalPoints: prevStats.totalPoints + amount 
//     }));
//     console.log(`User gained ${amount} XP. New total: ${userStats.totalPoints + amount}`);
//   };

//   const handleToggleComplete = async (task) => {
//     const newStatus = task.status === 'completed' ? 'pending' : 'completed';
//     setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
//     try {
//       await taskApi.updateTask(task._id, { 
//         status: newStatus,
//         progress: { percentage: newStatus === 'completed' ? 100 : task.progress?.percentage || 0 },
//         completedAt: newStatus === 'completed' ? new Date().toISOString() : null
//       });
//     } catch (error) {
//       console.error("Failed to update task:", error);
//       setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? { ...t, status: task.status } : t));
//     }
//   };
  
//   const handleDeleteTask = async (taskId) => {
//     if (!confirm('Are you sure you want to delete this task?')) return;
    
//     const originalTasks = tasks;
//     setTasks(prevTasks => prevTasks.filter(t => t._id !== taskId));
//     try {
//       await taskApi.deleteTask(taskId);
//     } catch (error) {
//       console.error("Failed to delete task:", error);
//       setTasks(originalTasks);
//     }
//   };
  
//   const handleEditTask = (task) => {
//     alert(`Editing task: ${task.title}`);
//   };

//   const loadUserStats = () => {
//     try {
//       const stats = JSON.parse(localStorage.getItem('user_stats') || '{}');
//       const userStatsData = stats[user.id] || { 
//         totalPoints: 0, 
//         rank: 'Beginner', 
//         joinDate: user.createdAt, 
//         lastActive: new Date().toISOString() 
//       };
//       setUserStats(userStatsData);
//     } catch (error) { 
//       console.error('Failed to load stats:', error); 
//     }
//   };
  
//   const getRankInfo = (rank) => {
//     const rankData = { 
//       'Beginner': { color: 'bg-gray-500', gradient: 'from-gray-400 to-gray-600' },
//       'Intermediate': { color: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600' },
//       'Advanced': { color: 'bg-purple-500', gradient: 'from-purple-400 to-purple-600' },
//       'Expert': { color: 'bg-yellow-500', gradient: 'from-yellow-400 to-yellow-600' },
//       'Master': { color: 'bg-red-500', gradient: 'from-red-400 to-red-600' }
//     };
//     return rankData[rank] || rankData['Beginner'];
//   };
  
//   const getNextRankProgress = (points) => {
//     if (points < 100) return (points / 100) * 100;
//     if (points < 500) return ((points - 100) / 400) * 100;
//     if (points < 1000) return ((points - 500) / 500) * 100;
//     if (points < 2000) return ((points - 1000) / 1000) * 100;
//     return 100;
//   };

//   // Filter and search tasks
//   const filteredTasks = tasks.filter(task => {
//     const matchesFilter = taskFilter === 'all' || task.status === taskFilter;
//     const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                          task.description?.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchesFilter && matchesSearch;
//   });

//   const taskStats = {
//     total: tasks.length,
//     completed: tasks.filter(t => t.status === 'completed').length,
//     inProgress: tasks.filter(t => t.status === 'in-progress').length,
//     pending: tasks.filter(t => t.status === 'pending').length
//   };

//   if (!isLoaded) { 
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="text-center">
//           <motion.div
//             animate={{ rotate: 360 }}
//             transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//           >
//             <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
//           </motion.div>
//           <p className="text-blue-600 font-medium">Loading your profile...</p>
//         </div>
//       </div>
//     ); 
//   }
  
//   if (!isSignedIn) { 
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="text-center">
//           <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//           <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Spark!</h2>
//           <p className="text-gray-600">Please sign in to view your profile and manage your tasks.</p>
//         </div>
//       </div>
//     ); 
//   }

//   const rankInfo = getRankInfo(userStats.rank);

//   return (
//     <>
//       <EditProfileModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
//       <StartTaskModal 
//         isOpen={isStartModalOpen} 
//         onClose={() => setIsStartModalOpen(false)} 
//         task={taskToStart} 
//         onSelectMode={(mode) => { 
//           setIsStartModalOpen(false); 
//           console.log(`Selected ${mode} for task: ${taskToStart?.title}`);
//         }} 
//       />

//       <motion.div 
//         className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6" 
//         variants={containerVariants} 
//         initial="hidden" 
//         animate="visible"
//       >
//         <div className="max-w-7xl mx-auto space-y-8">
//           {/* Enhanced Header */}
//           <motion.div variants={itemVariants} className="text-center py-8">
//             <motion.div
//               initial={{ scale: 0.8, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               transition={{ duration: 0.6 }}
//             >
//               <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent flex items-center justify-center gap-3">
//                 <Sparkles className="w-10 h-10 text-blue-500" />
//                 My Profile
//               </h1>
//               <p className="text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
//                 Track your journey, showcase your achievements, and level up your productivity!
//               </p>
//             </motion.div>
//           </motion.div>

//           <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
//             {/* Enhanced Profile Card */}
//             <motion.div className="xl:col-span-1" variants={itemVariants}>
//               <Card className="bg-white/95 backdrop-blur shadow-2xl rounded-3xl overflow-hidden h-full border-0">
//                 <div className={`bg-gradient-to-br ${rankInfo.gradient} p-8 text-white relative overflow-hidden`}>
//                   {/* Background Pattern */}
//                   <div className="absolute inset-0 opacity-10">
//                     <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white"></div>
//                     <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white"></div>
//                   </div>
                  
//                   <div className="relative z-10">
//                     <motion.div 
//                       className="flex justify-between items-start mb-6"
//                       initial={{ y: -20, opacity: 0 }}
//                       animate={{ y: 0, opacity: 1 }}
//                       transition={{ delay: 0.3 }}
//                     >
//                       <Trophy className="w-8 h-8 text-yellow-300" />
//                       <Badge className="bg-white/20 text-white border-white/30">
//                         Level {Math.floor(userStats.totalPoints / 100) + 1}
//                       </Badge>
//                     </motion.div>
                    
//                     <div className="text-center">
//                       <motion.div
//                         whileHover={{ scale: 1.05 }}
//                         transition={{ type: "spring", stiffness: 300 }}
//                       >
//                         <Avatar className="h-32 w-32 mb-4 ring-4 ring-white/50 ring-offset-4 ring-offset-transparent mx-auto shadow-2xl">
//                           <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
//                           <AvatarFallback className="text-3xl bg-white/20 backdrop-blur text-white border-2 border-white/30">
//                             {user.fullName?.charAt(0) || user.primaryEmailAddress?.emailAddress?.charAt(0)}
//                           </AvatarFallback>
//                         </Avatar>
//                       </motion.div>
                      
//                       <Badge className="bg-white/20 text-white border-white/30 px-4 py-1 rounded-full shadow-md mb-4">
//                         {userStats.rank}
//                       </Badge>
                      
//                       <h2 className="text-3xl font-bold mb-2">
//                         {user.fullName || 'New User'}
//                       </h2>
//                       <p className="text-white/80 text-sm">
//                         {user.primaryEmailAddress?.emailAddress}
//                       </p>
                      
//                       <div className="mt-6">
//                         <div className="flex justify-between items-center mb-2">
//                           <span className="text-sm text-white/80">Next Rank Progress</span>
//                           <span className="text-sm font-bold">{Math.round(getNextRankProgress(userStats.totalPoints))}%</span>
//                         </div>
//                         <Progress value={getNextRankProgress(userStats.totalPoints)} className="h-2 bg-white/20" />
//                       </div>
                      
//                       <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20">
//                         <div className="text-center">
//                           <Star className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
//                           <div className="text-2xl font-bold">{userStats.totalPoints}</div>
//                           <div className="text-xs text-white/80">Total XP</div>
//                         </div>
//                         <div className="text-center">
//                           <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-200" />
//                           <div className="text-sm font-semibold">
//                             {userStats.joinDate ? new Date(userStats.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
//                           </div>
//                           <div className="text-xs text-white/80">Joined</div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
                
//                 <CardContent className="p-6">
//                   <Button 
//                     onClick={() => setIsEditModalOpen(true)} 
//                     className="w-full mb-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all rounded-xl h-12"
//                   >
//                     <Edit className="w-4 h-4 mr-2" />
//                     Edit Profile
//                   </Button>
                  
//                   <Separator className="my-6" />
                  
//                   <div className="space-y-4">
//                     {/* Profile Information Cards */}
//                     {[
//                       { key: 'primaryGoal', icon: Target, label: 'Primary Goal', color: 'text-blue-600' },
//                       { key: 'bio', icon: FileText, label: 'Bio', color: 'text-purple-600' },
//                       { key: 'jobTitle', icon: Briefcase, label: 'Job Title', color: 'text-green-600' },
//                       { key: 'location', icon: MapPin, label: 'Location', color: 'text-red-600' },
//                       { key: 'skills', icon: Star, label: 'Skills', color: 'text-yellow-600' },
//                       { key: 'interests', icon: Heart, label: 'Interests', color: 'text-pink-600' }
//                     ].map(({ key, icon: Icon, label, color }) => {
//                       const value = user.unsafeMetadata?.[key];
//                       return value ? (
//                         <motion.div 
//                           key={key}
//                           whileHover={{ scale: 1.02, x: 4 }}
//                           className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
//                         >
//                           <Icon className={`w-5 h-5 ${color} mt-0.5 flex-shrink-0`} />
//                           <div className="min-w-0 flex-1">
//                             <p className="font-semibold text-gray-800 text-sm">{label}</p>
//                             <p className="text-gray-600 text-sm break-words">{value}</p>
//                           </div>
//                         </motion.div>
//                       ) : null;
//                     })}
                    
//                     {!user.unsafeMetadata?.primaryGoal && (
//                       <motion.div 
//                         whileHover={{ scale: 1.02 }}
//                         className="text-center p-4 border-2 border-dashed border-gray-300 rounded-xl"
//                       >
//                         <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
//                         <Button 
//                           variant="ghost" 
//                           onClick={() => setIsEditModalOpen(true)}
//                           className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
//                         >
//                           Set Your Goals & Info
//                         </Button>
//                       </motion.div>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
//             </motion.div>

//             <div className="xl:col-span-3 space-y-8">
//               {/* Enhanced Statistics Card */}
//               <motion.div variants={itemVariants}>
//                 <Card className="bg-white shadow-xl rounded-3xl overflow-hidden border-0">
//                   <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
//                     <CardTitle className="flex items-center gap-3 text-blue-900 text-2xl">
//                       <TrendingUp className="w-7 h-7 text-blue-600" />
//                       Your Statistics
//                     </CardTitle>
//                     <CardDescription className="text-gray-600 text-base">
//                       Track your progress and celebrate your achievements
//                     </CardDescription>
//                   </CardHeader>
//                   <CardContent className="p-8">
//                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//                       {[
//                         { 
//                           icon: CheckSquare, 
//                           value: taskStats.completed, 
//                           label: 'Tasks Completed', 
//                           color: 'text-emerald-500', 
//                           bg: 'from-emerald-50 to-emerald-100',
//                           border: 'border-emerald-200'
//                         },
//                         { 
//                           icon: Flame, 
//                           value: `${habitStreak.count} Days`, 
//                           label: 'Current Streak', 
//                           color: 'text-orange-500', 
//                           bg: 'from-orange-50 to-orange-100',
//                           border: 'border-orange-200'
//                         },
//                         { 
//                           icon: Activity, 
//                           value: taskStats.inProgress, 
//                           label: 'In Progress', 
//                           color: 'text-blue-500', 
//                           bg: 'from-blue-50 to-blue-100',
//                           border: 'border-blue-200'
//                         },
//                         { 
//                           icon: BookOpen, 
//                           value: coursesFinished, 
//                           label: 'Courses Finished', 
//                           color: 'text-purple-500', 
//                           bg: 'from-purple-50 to-purple-100',
//                           border: 'border-purple-200'
//                         }
//                       ].map((stat, index) => (
//                         <motion.div 
//                           key={stat.label}
//                           className={`p-6 rounded-2xl bg-gradient-to-br ${stat.bg} border-2 ${stat.border} text-center group hover:scale-105 transition-all duration-300 cursor-pointer`}
//                           whileHover={{ y: -4 }}
//                           initial={{ opacity: 0, y: 20 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           transition={{ delay: index * 0.1 }}
//                         >
//                           <stat.icon className={`w-10 h-10 mx-auto mb-3 ${stat.color} group-hover:scale-110 transition-transform`} />
//                           <p className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</p>
//                           <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
//                         </motion.div>
//                       ))}
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>

//               {/* Enhanced Tasks Card with List Format */}
//               <motion.div variants={itemVariants}>
//                 <Card className="bg-white shadow-xl rounded-3xl overflow-hidden border-0">
//                   <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <CardTitle className="flex items-center gap-3 text-indigo-900 text-2xl">
//                           <CheckSquare className="w-7 h-7 text-indigo-600" />
//                           My Tasks ({filteredTasks.length})
//                         </CardTitle>
//                         <CardDescription className="text-gray-600 text-base mt-1">
//                           Manage and track all your tasks in one place
//                         </CardDescription>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
//                           {taskStats.completed} completed
//                         </Badge>
//                         <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
//                           {taskStats.inProgress} active
//                         </Badge>
//                       </div>
//                     </div>
//                   </CardHeader>
//                   <CardContent className="p-6">
//                     {/* Task Filters and Search */}
//                     <div className="flex flex-col sm:flex-row gap-4 mb-6">
//                       <div className="flex-1 relative">
//                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                         <input
//                           type="text"
//                           placeholder="Search tasks..."
//                           value={searchQuery}
//                           onChange={(e) => setSearchQuery(e.target.value)}
//                           className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                         />
//                       </div>
//                       <select
//                         value={taskFilter}
//                         onChange={(e) => setTaskFilter(e.target.value)}
//                         className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[150px]"
//                       >
//                         <option value="all">All Tasks</option>
//                         <option value="pending">Pending</option>
//                         <option value="in-progress">In Progress</option>
//                         <option value="completed">Completed</option>
//                       </select>
//                     </div>

//                     {/* Tasks List */}
//                     {loadingTasks ? (
//                       <div className="flex justify-center items-center h-48">
//                         <div className="text-center">
//                           <motion.div
//                             animate={{ rotate: 360 }}
//                             transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//                           >
//                             <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-4" />
//                           </motion.div>
//                           <p className="text-gray-600">Loading your tasks...</p>
//                         </div>
//                       </div>
//                     ) : filteredTasks.length > 0 ? (
//                       <ul className="space-y-2">
//                         <AnimatePresence mode="popLayout">
//                           {filteredTasks.map((task, index) => (
//                             <TaskListItem
//                               key={task._id}
//                               task={task}
//                               index={index}
//                               onToggleComplete={handleToggleComplete}
//                               onDelete={handleDeleteTask}
//                               onEdit={handleEditTask}
//                               onShowStartModal={handleShowStartModal}
//                               onGainXP={handleGainXP}
//                             />
//                           ))}
//                         </AnimatePresence>
//                       </ul>
//                     ) : (
//                       <motion.div 
//                         className="text-center py-16"
//                         initial={{ opacity: 0, y: 20 }}
//                         animate={{ opacity: 1, y: 0 }}
//                       >
//                         <motion.div
//                           animate={{ 
//                             y: [0, -10, 0],
//                           }}
//                           transition={{ 
//                             duration: 2, 
//                             repeat: Infinity,
//                             ease: "easeInOut"
//                           }}
//                         >
//                           <CheckSquare className="w-20 h-20 mx-auto mb-6 text-gray-300" />
//                         </motion.div>
//                         <h3 className="text-xl font-bold text-gray-800 mb-2">
//                           {searchQuery || taskFilter !== 'all' ? 'No matching tasks found' : 'No tasks yet'}
//                         </h3>
//                         <p className="text-gray-600 mb-6 max-w-md mx-auto">
//                           {searchQuery || taskFilter !== 'all' 
//                             ? 'Try adjusting your search or filter criteria'
//                             : 'Start your productivity journey by creating your first task!'
//                           }
//                         </p>
//                         {(!searchQuery && taskFilter === 'all') && (
//                           <Button 
//                             className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all rounded-xl"
//                             onClick={() => console.log('Navigate to task creation')}
//                           >
//                             <CheckSquare className="w-4 h-4 mr-2" />
//                             Create Your First Task
//                           </Button>
//                         )}
//                       </motion.div>
//                     )}
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             </div>
//           </div>
//         </div>
//       </motion.div>
//     </>
//   );
// }

// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { useUser } from '@clerk/nextjs';
// // import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// // import { Button } from "@/components/ui/button";
// // import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Separator } from "@/components/ui/separator";
// // import { Badge } from "@/components/ui/badge";
// // import { Progress } from "@/components/ui/progress";
// // import { motion, AnimatePresence } from "framer-motion";
// // import { 
// //   BookOpen, CheckSquare, Edit, Flame, Target, Calendar, Trophy, Activity,
// //   Palette, Brain, MessageCircle, FileText, Star, TrendingUp, MapPin, 
// //   Briefcase, Globe, Heart, Sparkles, Clock, Zap, Play, Trash2, Loader2, X, Focus, Timer, Check
// // } from "lucide-react";
// // import EditProfileModal from './EditProfileModal';
// // import { taskApi } from '@/backend/lib/api'; // Assuming you have this API helper

// // // ------ StartTaskModal Component ------
// // function StartTaskModal({ isOpen, onClose, onSelectMode, task }) {
// //   if (!isOpen) return null;
// //   return (
// //     <AnimatePresence>
// //       {isOpen && (
// //         <motion.div 
// //           initial={{ opacity: 0 }} 
// //           animate={{ opacity: 1 }} 
// //           exit={{ opacity: 0 }} 
// //           className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50" 
// //           onClick={onClose}
// //         >
// //           <motion.div 
// //             initial={{ scale: 0.9, y: 50 }} 
// //             animate={{ scale: 1, y: 0 }} 
// //             exit={{ scale: 0.9, y: 50 }} 
// //             className="bg-white rounded-2xl p-8 w-full max-w-sm sm:max-w-md shadow-2xl relative" 
// //             onClick={(e) => e.stopPropagation()}
// //           >
// //             <button 
// //               onClick={onClose} 
// //               className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
// //             >
// //               <X className="w-6 h-6" />
// //             </button>
// //             <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
// //               Choose Your Focus Mode
// //             </h2>
// //             {task && (
// //               <p className="text-gray-600 text-center mb-6">
// //                 Starting: <span className="font-semibold">{task.title}</span>
// //               </p>
// //             )}
// //             <div className="flex flex-col space-y-4">
// //               <motion.button 
// //                 whileHover={{ scale: 1.02 }} 
// //                 whileTap={{ scale: 0.98 }} 
// //                 onClick={() => onSelectMode('focus')} 
// //                 className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
// //               >
// //                 <Focus className="w-6 h-6" />
// //                 <span>Focus Mode</span>
// //               </motion.button>
// //               <motion.button 
// //                 whileHover={{ scale: 1.02 }} 
// //                 whileTap={{ scale: 0.98 }} 
// //                 onClick={() => onSelectMode('pomodoro')} 
// //                 className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
// //               >
// //                 <Timer className="w-6 h-6" />
// //                 <span>Pomodoro Technique</span>
// //               </motion.button>
// //             </div>
// //           </motion.div>
// //         </motion.div>
// //       )}
// //     </AnimatePresence>
// //   );
// // }

// // // ------ Updated TaskCard Component ------
// // function TaskCard({ task, index, onToggleComplete, onDelete, onEdit, onShowStartModal, onGainXP }) {
// //   const [isFadingOut, setIsFadingOut] = useState(false);
  
// //   const priorityColors = { 
// //     urgent: "bg-red-500", 
// //     high: "bg-red-500", 
// //     medium: "bg-yellow-500", 
// //     low: "bg-green-500" 
// //   };
  
// //   const energyColors = { 
// //     High: "text-blue-500", 
// //     Medium: "text-orange-500", 
// //     Low: "text-teal-500" 
// //   };
  
// //   const isCompleted = task.status === 'completed';

// //   const handleToggle = async (e) => {
// //     e.stopPropagation();
// //     if (isCompleted) {
// //       await onToggleComplete(task);
// //       return;
// //     }
// //     setIsFadingOut(true);
// //     await new Promise(resolve => setTimeout(resolve, 600));
// //     await onToggleComplete(task);
// //     if (onGainXP) onGainXP(10);
// //     setIsFadingOut(false);
// //   };

// //   const handleDelete = (e) => { e.stopPropagation(); onDelete(task._id); };
// //   const handleEdit = (e) => { e.stopPropagation(); onEdit(task); };
// //   const handleStart = (e) => { e.stopPropagation(); onShowStartModal(task); };

// //   return (
// //     <motion.div 
// //       layout 
// //       initial={{ opacity: 0, y: 50 }} 
// //       animate={{ opacity: 1, y: 0 }} 
// //       exit={{ opacity: 0, scale: 0.8 }} 
// //       transition={{ duration: 0.3, delay: index * 0.05 }} 
// //       className={`relative bg-white rounded-2xl shadow-lg p-6 border ${isCompleted ? "border-green-300 opacity-60" : "border-gray-200"} hover:shadow-xl transition-all duration-300`}
// //     >
// //       <AnimatePresence>
// //         {isFadingOut && (
// //           <motion.div 
// //             initial={{ opacity: 0, scale: 0.5 }} 
// //             animate={{ opacity: 1, scale: 1 }} 
// //             exit={{ opacity: 0, scale: 1.5 }} 
// //             transition={{ duration: 0.4 }} 
// //             className="absolute inset-0 bg-green-500/80 rounded-2xl flex items-center justify-center z-10"
// //           >
// //             <Check className="w-16 h-16 text-white" />
// //           </motion.div>
// //         )}
// //       </AnimatePresence>
      
// //       <div className="flex justify-between items-start mb-4">
// //         <h3 className={`text-lg font-semibold pr-4 ${isCompleted ? "text-gray-400 line-through" : "text-gray-800"}`}>
// //           {task.title}
// //         </h3>
// //         <motion.button 
// //           whileHover={{ scale: 1.1 }} 
// //           whileTap={{ scale: 0.9 }} 
// //           onClick={handleToggle} 
// //           className={`flex-shrink-0 w-6 h-6 rounded-full border-2 ${isCompleted ? "bg-green-500 border-green-500" : "border-gray-300"} flex items-center justify-center transition-all`}
// //         >
// //           {isCompleted && <Check className="w-4 h-4 text-white" />}
// //         </motion.button>
// //       </div>
      
// //       <p className={`text-sm text-gray-500 mb-6 ${isCompleted ? "line-through" : ""}`}>
// //         {task.description || 'No description provided'}
// //       </p>
      
// //       <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mb-6">
// //         <div className="flex items-center text-gray-600">
// //           <Clock className="w-4 h-4 mr-2" />
// //           {task.estimatedTime || 25} min
// //         </div>
// //         {task.energy && (
// //           <div className="flex items-center text-gray-600">
// //             <Zap className={`w-4 h-4 mr-2 ${energyColors[task.energy]}`} />
// //             {task.energy}
// //           </div>
// //         )}
// //         {task.dueDate && (
// //           <div className="flex items-center text-gray-600">
// //             <Calendar className="w-4 h-4 mr-2" />
// //             {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
// //           </div>
// //         )}
// //         <div className="flex items-center text-gray-600">
// //           <span className={`w-2.5 h-2.5 rounded-full mr-2 ${priorityColors[task.priority] || priorityColors.medium}`}></span>
// //           {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1) || 'Medium'}
// //         </div>
// //       </div>
      
// //       <div className="flex justify-end space-x-2 border-t pt-4 -mx-6 px-6">
// //         {!isCompleted && (
// //           <motion.button 
// //             whileHover={{ scale: 1.05 }} 
// //             whileTap={{ scale: 0.95 }} 
// //             onClick={handleStart} 
// //             className="p-2 text-gray-500 hover:text-blue-500" 
// //             title="Start Task"
// //           >
// //             <Play className="w-5 h-5" />
// //           </motion.button>
// //         )}
// //         <motion.button 
// //           whileHover={{ scale: 1.05 }} 
// //           whileTap={{ scale: 0.95 }} 
// //           onClick={handleEdit} 
// //           className="p-2 text-gray-500 hover:text-yellow-500" 
// //           title="Edit Task"
// //         >
// //           <Edit className="w-5 h-5" />
// //         </motion.button>
// //         <motion.button 
// //           whileHover={{ scale: 1.05 }} 
// //           whileTap={{ scale: 0.95 }} 
// //           onClick={handleDelete} 
// //           className="p-2 text-gray-500 hover:text-red-500" 
// //           title="Delete Task"
// //         >
// //           <Trash2 className="w-5 h-5" />
// //         </motion.button>
// //       </div>
// //     </motion.div>
// //   );
// // }

// // // ------ Animation Variants ------
// // const containerVariants = { 
// //   hidden: { opacity: 0 }, 
// //   visible: { opacity: 1, transition: { staggerChildren: 0.1 } } 
// // };
// // const itemVariants = { 
// //   hidden: { y: 20, opacity: 0 }, 
// //   visible: { y: 0, opacity: 1 } 
// // };

// // // ------ User Data Hook ------
// // function useUserData() {
// //   const [data, setData] = useState({ 
// //     tasksCompleted: 0, 
// //     habitStreak: { count: 0 }, 
// //     coursesFinished: 0 
// //   });
  
// //   useEffect(() => {
// //     try {
// //       const storedData = JSON.parse(localStorage.getItem('user_data') || '{}');
// //       setData({ 
// //         tasksCompleted: storedData.tasksCompleted || 0, 
// //         habitStreak: storedData.habitStreak || { count: 0 }, 
// //         coursesFinished: storedData.coursesFinished || 0 
// //       });
// //     } catch (error) { 
// //       console.error('Failed to load user data:', error); 
// //     }
// //   }, []);
  
// //   return data;
// // }

// // // ------ Main Profile Page Component ------
// // export default function ProfilePage() {
// //   const { user, isLoaded, isSignedIn } = useUser();
// //   const { tasksCompleted, habitStreak, coursesFinished } = useUserData();
// //   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
// //   const [userStats, setUserStats] = useState({ 
// //     totalPoints: 0, 
// //     rank: 'Beginner', 
// //     joinDate: null, 
// //     lastActive: null 
// //   });
// //   const [tasks, setTasks] = useState([]);
// //   const [loadingTasks, setLoadingTasks] = useState(true);
  
// //   // State for the StartTaskModal
// //   const [isStartModalOpen, setIsStartModalOpen] = useState(false);
// //   const [taskToStart, setTaskToStart] = useState(null);

// //   useEffect(() => {
// //     if (user) {
// //       loadUserStats();
// //       loadTasks();
// //     }
// //   }, [user]);

// //   const loadTasks = async () => {
// //     if (!user?.id) return;
// //     setLoadingTasks(true);
// //     try {
// //       const response = await taskApi.getTasks({ userId: user.id });
// //       if (response.success && response.data) {
// //         const sortedTasks = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
// //         setTasks(sortedTasks);
// //       }
// //     } catch (error) {
// //       console.error('Failed to load tasks:', error);
// //     } finally {
// //       setLoadingTasks(false);
// //     }
// //   };
  
// //   const handleShowStartModal = (task) => {
// //     setTaskToStart(task);
// //     setIsStartModalOpen(true);
// //   };
  
// //   const handleGainXP = (amount) => {
// //     setUserStats(prevStats => ({
// //       ...prevStats, 
// //       totalPoints: prevStats.totalPoints + amount 
// //     }));
// //     // Here you would also call an API to save the new XP value to your database
// //     console.log(`User gained ${amount} XP. New total: ${userStats.totalPoints + amount}`);
// //   };

// //   const handleToggleComplete = async (task) => {
// //     const newStatus = task.status === 'completed' ? 'pending' : 'completed';
// //     // Optimistically update UI
// //     setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
// //     try {
// //       // Update in the database
// //       await taskApi.updateTask(task._id, { status: newStatus });
// //     } catch (error) {
// //       console.error("Failed to update task:", error);
// //       // Revert UI on failure
// //       setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? { ...t, status: task.status } : t));
// //     }
// //   };
  
// //   const handleDeleteTask = async (taskId) => {
// //     if (!confirm('Are you sure you want to delete this task?')) return;
    
// //     // Optimistically update UI
// //     const originalTasks = tasks;
// //     setTasks(prevTasks => prevTasks.filter(t => t._id !== taskId));
// //     try {
// //       await taskApi.deleteTask(taskId);
// //     } catch (error) {
// //       console.error("Failed to delete task:", error);
// //       setTasks(originalTasks); // Revert on failure
// //     }
// //   };
  
// //   const handleEditTask = (task) => {
// //     // Logic to open an edit modal for the task
// //     alert(`Editing task: ${task.title}`);
// //   };

// //   const loadUserStats = () => {
// //     try {
// //       const stats = JSON.parse(localStorage.getItem('user_stats') || '{}');
// //       const userStatsData = stats[user.id] || { 
// //         totalPoints: 0, 
// //         rank: 'Beginner', 
// //         joinDate: user.createdAt, 
// //         lastActive: new Date().toISOString() 
// //       };
// //       setUserStats(userStatsData);
// //     } catch (error) { 
// //       console.error('Failed to load stats:', error); 
// //     }
// //   };
  
// //   const getRankColor = (rank) => {
// //     const rankColors = { 
// //       'Beginner': 'bg-gray-500', 
// //       'Intermediate': 'bg-blue-500', 
// //       'Advanced': 'bg-purple-500', 
// //       'Expert': 'bg-yellow-500', 
// //       'Master': 'bg-red-500' 
// //     };
// //     return rankColors[rank] || 'bg-gray-500';
// //   };
  
// //   const getNextRankProgress = (points) => {
// //     if (points < 50) return (points / 50) * 100;
// //     if (points < 200) return (points / 200) * 100;
// //     if (points < 500) return (points / 500) * 100;
// //     if (points < 1000) return (points / 1000) * 100;
// //     return 100;
// //   };

// //   if (!isLoaded) { 
// //     return (
// //       <div className="flex items-center justify-center h-64">
// //         <div className="text-center">
// //           <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
// //           <p className="text-blue-600">Loading profile...</p>
// //         </div>
// //       </div>
// //     ); 
// //   }
  
// //   if (!isSignedIn) { 
// //     return (
// //       <div className="flex items-center justify-center h-64">
// //         <div className="text-center">
// //           <p className="text-gray-600">Please sign in to view your profile.</p>
// //         </div>
// //       </div>
// //     ); 
// //   }

// //   return (
// //     <>
// //       <EditProfileModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
// //       <StartTaskModal 
// //         isOpen={isStartModalOpen} 
// //         onClose={() => setIsStartModalOpen(false)} 
// //         task={taskToStart} 
// //         onSelectMode={(mode) => { 
// //           setIsStartModalOpen(false); 
// //           console.log(`Selected ${mode} for task: ${taskToStart?.title}`);
// //           // Here you would navigate to your apomodoro page
// //         }} 
// //       />

// //       <motion.div 
// //         className="space-y-8" 
// //         variants={containerVariants} 
// //         initial="hidden" 
// //         animate="visible"
// //       >
// //         {/* Profile Header */}
// //         <motion.div variants={itemVariants} className="text-center">
// //           <h1 className="text-4xl font-extrabold text-blue-800 flex items-center justify-center gap-2">
// //             <Sparkles className="w-8 h-8 text-blue-500" />
// //             My Profile
// //           </h1>
// //           <p className="text-lg text-slate-600 mt-2">
// //             Track your journey, showcase your achievements, and level up in Spark!
// //           </p>
// //         </motion.div>

// //         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
// //           {/* Profile Card */}
// //           <motion.div className="lg:col-span-1" variants={itemVariants}>
// //             <Card className="bg-white/95 shadow-xl rounded-2xl overflow-hidden h-full border border-blue-100">
// //               <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 flex flex-col items-center text-center relative">
// //                 <motion.div 
// //                   className="absolute top-0 right-0 p-2" 
// //                   initial={{ scale: 0 }} 
// //                   animate={{ scale: 1 }} 
// //                   transition={{ delay: 0.2 }}
// //                 >
// //                   <Trophy className="w-8 h-8 text-yellow-400" />
// //                 </motion.div>
// //                 <div className="relative">
// //                   <Avatar className="h-32 w-32 mb-4 ring-4 ring-blue-300 ring-offset-4 ring-offset-transparent transition-all hover:scale-105">
// //                     <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
// //                     <AvatarFallback className="text-3xl bg-blue-200 text-blue-800">
// //                       {user.fullName?.charAt(0) || user.primaryEmailAddress?.emailAddress?.charAt(0)}
// //                     </AvatarFallback>
// //                   </Avatar>
// //                   <Badge className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 ${getRankColor(userStats.rank)} text-white px-4 py-1 rounded-full shadow-md`}>
// //                     {userStats.rank}
// //                   </Badge>
// //                 </div>
// //                 <h2 className="text-3xl font-extrabold mt-4 text-blue-900">
// //                   {user.fullName || 'New User'}
// //                 </h2>
// //                 <p className="text-slate-600 text-sm italic">
// //                   {user.primaryEmailAddress?.emailAddress}
// //                 </p>
// //                 <div className="w-full mt-4">
// //                   <Progress value={getNextRankProgress(userStats.totalPoints)} className="h-2 bg-blue-100" />
// //                   <p className="text-sm text-blue-700 mt-1">
// //                     Progress to next rank: {Math.round(getNextRankProgress(userStats.totalPoints))}%
// //                   </p>
// //                 </div>
// //                 <div className="flex items-center justify-around w-full mt-4 text-sm">
// //                   <div className="flex flex-col items-center">
// //                     <Star className="w-5 h-5 text-amber-500" />
// //                     <span className="font-bold text-blue-800">{userStats.totalPoints} pts</span>
// //                   </div>
// //                   <div className="flex flex-col items-center">
// //                     <Calendar className="w-5 h-5 text-sky-500" />
// //                     <span className="text-blue-800">
// //                       Joined {new Date(userStats.joinDate).toLocaleDateString()}
// //                     </span>
// //                   </div>
// //                 </div>
// //               </div>
              
// //               <CardContent className="p-6 bg-gradient-to-b from-white to-blue-50">
// //                 <Button 
// //                   onClick={() => setIsEditModalOpen(true)} 
// //                   variant="default" 
// //                   className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-shadow"
// //                 >
// //                   <Edit className="w-4 h-4 mr-2" />
// //                   Edit Profile
// //                 </Button>
// //                 <Separator className="my-4 bg-blue-200" />
// //                 <div className="space-y-6">
// //                   <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// //                     <Target className="w-6 h-6 text-blue-600" />
// //                     <p className="font-semibold text-blue-800">Primary Goal:</p>
// //                     <p className="text-slate-700 text-center">
// //                       {user.unsafeMetadata?.primaryGoal || (
// //                         <Button 
// //                           variant="link" 
// //                           className="p-0 text-blue-600 hover:text-blue-800" 
// //                           onClick={() => setIsEditModalOpen(true)}
// //                         >
// //                           Set Your Goal Now
// //                         </Button>
// //                       )}
// //                     </p>
// //                   </div>
                  
// //                   {/* Bio */}
// //                   {user.unsafeMetadata?.bio && (
// //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// //                       <FileText className="w-6 h-6 text-sky-500" />
// //                       <p className="font-semibold text-blue-800">Bio:</p>
// //                       <p className="text-slate-700 text-center text-sm">
// //                         {user.unsafeMetadata.bio}
// //                       </p>
// //                     </div>
// //                   )}
                  
// //                   {/* Job Title */}
// //                   {user.unsafeMetadata?.jobTitle && (
// //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// //                       <Briefcase className="w-6 h-6 text-emerald-500" />
// //                       <p className="font-semibold text-blue-800">Job Title:</p>
// //                       <p className="text-slate-700 text-center">
// //                         {user.unsafeMetadata.jobTitle}
// //                         {user.unsafeMetadata.company && ` at ${user.unsafeMetadata.company}`}
// //                       </p>
// //                     </div>
// //                   )}
                  
// //                   {/* Location */}
// //                   {user.unsafeMetadata?.location && (
// //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// //                       <MapPin className="w-6 h-6 text-red-500" />
// //                       <p className="font-semibold text-blue-800">Location:</p>
// //                       <p className="text-slate-700 text-center">
// //                         {user.unsafeMetadata.location}
// //                       </p>
// //                     </div>
// //                   )}
                  
// //                   {/* Website */}
// //                   {user.unsafeMetadata?.website && (
// //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// //                       <Globe className="w-6 h-6 text-cyan-500" />
// //                       <p className="font-semibold text-blue-800">Website:</p>
// //                       <a 
// //                         href={user.unsafeMetadata.website} 
// //                         target="_blank" 
// //                         rel="noopener noreferrer"
// //                         className="text-blue-600 hover:text-blue-800 text-center text-sm underline"
// //                       >
// //                         {user.unsafeMetadata.website}
// //                       </a>
// //                     </div>
// //                   )}
                  
// //                   {/* Skills */}
// //                   {user.unsafeMetadata?.skills && (
// //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// //                       <Star className="w-6 h-6 text-amber-500" />
// //                       <p className="font-semibold text-blue-800">Skills:</p>
// //                       <p className="text-slate-700 text-center text-sm">
// //                         {user.unsafeMetadata.skills}
// //                       </p>
// //                     </div>
// //                   )}
                  
// //                   {/* Interests */}
// //                   {user.unsafeMetadata?.interests && (
// //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// //                       <Heart className="w-6 h-6 text-pink-500" />
// //                       <p className="font-semibold text-blue-800">Interests:</p>
// //                       <p className="text-slate-700 text-center text-sm">
// //                         {user.unsafeMetadata.interests}
// //                       </p>
// //                     </div>
// //                   )}
// //                 </div>
// //               </CardContent>
// //             </Card>
// //           </motion.div>

// //           <div className="lg:col-span-3 space-y-8">
// //             {/* Statistics Card */}
// //             <motion.div variants={itemVariants}>
// //               <Card className="bg-white shadow-xl rounded-2xl overflow-hidden border-t-4 border-blue-500">
// //                 <CardHeader className="bg-blue-50">
// //                   <CardTitle className="flex items-center gap-2 text-blue-900 text-2xl">
// //                     <TrendingUp className="w-7 h-7 text-blue-600" />
// //                     Statistics
// //                   </CardTitle>
// //                   <CardDescription className="text-slate-600 text-lg">
// //                     Your all-time progress and achievements.
// //                   </CardDescription>
// //                 </CardHeader>
// //                 <CardContent className="p-6">
// //                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
// //                     <motion.div 
// //                       className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg text-center" 
// //                       whileHover={{ scale: 1.05 }}
// //                     >
// //                       <CheckSquare className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
// //                       <p className="text-4xl font-bold text-emerald-700">{tasksCompleted}</p>
// //                       <p className="text-base text-slate-600 mt-1">Tasks Completed</p>
// //                     </motion.div>
// //                     <motion.div 
// //                       className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg text-center" 
// //                       whileHover={{ scale: 1.05 }}
// //                     >
// //                       <Flame className="w-12 h-12 mx-auto mb-3 text-amber-500" />
// //                       <p className="text-4xl font-bold text-amber-700">{habitStreak.count} Days</p>
// //                       <p className="text-base text-slate-600 mt-1">Habit Streak</p>
// //                     </motion.div>
// //                     <motion.div 
// //                       className="p-6 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 shadow-lg text-center" 
// //                       whileHover={{ scale: 1.05 }}
// //                     >
// //                       <BookOpen className="w-12 h-12 mx-auto mb-3 text-sky-500" />
// //                       <p className="text-4xl font-bold text-sky-700">{coursesFinished}</p>
// //                       <p className="text-base text-slate-600 mt-1">Courses Finished</p>
// //                     </motion.div>
// //                   </div>
// //                 </CardContent>
// //               </Card>
// //             </motion.div>

// //             {/* All Tasks Card */}
// //             <motion.div variants={itemVariants}>
// //               <Card className="bg-white shadow-xl rounded-2xl overflow-hidden border-t-4 border-blue-500">
// //                 <CardHeader className="bg-blue-50">
// //                   <CardTitle className="flex items-center gap-2 text-blue-900 text-2xl">
// //                     <CheckSquare className="w-7 h-7 text-blue-600" />
// //                     All My Tasks
// //                   </CardTitle>
// //                   <CardDescription className="text-slate-600 text-lg">
// //                     A complete list of all your tasks.
// //                   </CardDescription>
// //                 </CardHeader>
// //                 <CardContent className="p-6">
// //                   {loadingTasks ? (
// //                     <div className="flex justify-center items-center h-24">
// //                       <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
// //                     </div>
// //                   ) : tasks.length > 0 ? (
// //                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
// //                       <AnimatePresence>
// //                         {tasks.map((task, index) => (
// //                           <TaskCard
// //                             key={task._id}
// //                             task={task}
// //                             index={index}
// //                             onToggleComplete={handleToggleComplete}
// //                             onDelete={handleDeleteTask}
// //                             onEdit={handleEditTask}
// //                             onShowStartModal={handleShowStartModal}
// //                             onGainXP={handleGainXP}
// //                           />
// //                         ))}
// //                       </AnimatePresence>
// //                     </div>
// //                   ) : (
// //                     <div className="text-center py-12">
// //                       <motion.div 
// //                         initial={{ scale: 0.8, opacity: 0 }} 
// //                         animate={{ scale: 1, opacity: 1 }} 
// //                         transition={{ duration: 0.5 }}
// //                       >
// //                         <CheckSquare className="w-20 h-20 mx-auto mb-4 text-blue-300" />
// //                       </motion.div>
// //                       <p className="text-blue-900 font-medium text-lg">No tasks found.</p>
// //                       <p className="text-sm text-slate-600 mt-2">
// //                         Go to the Task Manager to add your first task!
// //                       </p>
// //                     </div>
// //                   )}
// //                 </CardContent>
// //               </Card>
// //             </motion.div>
// //           </div>
// //         </div>
// //       </motion.div>
// //     </>
// //   );
// // }

// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { useUser } from '@clerk/nextjs';
// // import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// // import { Button } from "@/components/ui/button";
// // import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Separator } from "@/components/ui/separator";
// // import { Badge } from "@/components/ui/badge";
// // import { Progress } from "@/components/ui/progress";
// // import { motion, AnimatePresence } from "framer-motion";
// // import { 
// //   BookOpen, 
// //   CheckSquare, 
// //   Edit, 
// //   Flame, 
// //   Target, 
// //   Calendar,
// //   Trophy,
// //   Activity,
// //   Palette,
// //   Brain,
// //   MessageCircle,
// //   FileText,
// //   Star,
// //   TrendingUp,
// //   MapPin,
// //   Briefcase,
// //   Globe,
// //   Phone,
// //   Heart,
// //   Sparkles
// // } from "lucide-react";
// // import EditProfileModal from './EditProfileModal';

// // const containerVariants = { 
// //   hidden: { opacity: 0 }, 
// //   visible: { opacity: 1, transition: { staggerChildren: 0.1 } } 
// // };
// // const itemVariants = { 
// //   hidden: { y: 20, opacity: 0 }, 
// //   visible: { y: 0, opacity: 1 } 
// // };

// // // Activity icons mapping
// // const activityIcons = {
// //   'task_completed': CheckSquare,
// //   'habit_streak': Flame,
// //   'course_finished': BookOpen,
// //   'chat_message': MessageCircle,
// //   'whiteboard_created': Palette,
// //   'mindmap_created': Brain,
// //   'goal_achieved': Trophy,
// //   'profile_updated': Edit,
// //   'daily_login': Calendar,
// //   'milestone_reached': Star
// // };

// // const activityColors = {
// //   'task_completed': 'text-emerald-400',
// //   'habit_streak': 'text-amber-400',
// //   'course_finished': 'text-sky-400',
// //   'chat_message': 'text-purple-400',
// //   'whiteboard_created': 'text-pink-400',
// //   'mindmap_created': 'text-cyan-400',
// //   'goal_achieved': 'text-yellow-400',
// //   'profile_updated': 'text-gray-400',
// //   'daily_login': 'text-indigo-400',
// //   'milestone_reached': 'text-blue-400'
// // };

// // // Mock user data hook for stats like tasks, habits, etc. (using localStorage)
// // function useUserData() {
// //   const [data, setData] = useState({
// //     tasksCompleted: 0,
// //     habitStreak: { count: 0 },
// //     coursesFinished: 0
// //   });

// //   useEffect(() => {
// //     const loadData = () => {
// //       try {
// //         const storedData = JSON.parse(localStorage.getItem('user_data') || '{}');
// //         setData({
// //           tasksCompleted: storedData.tasksCompleted || 0,
// //           habitStreak: storedData.habitStreak || { count: 0 },
// //           coursesFinished: storedData.coursesFinished || 0
// //         });
// //       } catch (error) {
// //         console.error('Failed to load user data:', error);
// //       }
// //     };
// //     loadData();
// //   }, []);

// //   return data;
// // }

// // export default function ProfilePage() {
// //   const { user, isLoaded, isSignedIn } = useUser();
// //   const { tasksCompleted, habitStreak, coursesFinished } = useUserData();
// //   const [isModalOpen, setIsModalOpen] = useState(false);
// //   const [recentActivities, setRecentActivities] = useState([]);
// //   const [userStats, setUserStats] = useState({
// //     totalPoints: 0,
// //     rank: 'Beginner',
// //     joinDate: null,
// //     lastActive: null
// //   });

// //   // Load user activities and stats
// //   useEffect(() => {
// //     if (user) {
// //       loadUserActivities();
// //       loadUserStats();
// //     }
// //   }, [user]);

// //   const loadUserActivities = () => {
// //     try {
// //       const activities = JSON.parse(localStorage.getItem('user_activities') || '[]');
// //       const userActivities = activities
// //         .filter(activity => activity.userId === user.id)
// //         .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
// //         .slice(0, 10);
      
// //       setRecentActivities(userActivities);
// //     } catch (error) {
// //       console.error('Failed to load activities:', error);
// //     }
// //   };

// //   const loadUserStats = () => {
// //     try {
// //       const stats = JSON.parse(localStorage.getItem('user_stats') || '{}');
// //       const userStatsData = stats[user.id] || {
// //         totalPoints: 0,
// //         rank: 'Beginner',
// //         joinDate: user.createdAt,
// //         lastActive: new Date().toISOString()
// //       };
      
// //       setUserStats(userStatsData);
// //     } catch (error) {
// //       console.error('Failed to load stats:', error);
// //     }
// //   };

// //   const getRankColor = (rank) => {
// //     const rankColors = {
// //       'Beginner': 'bg-gray-500',
// //       'Intermediate': 'bg-blue-500',
// //       'Advanced': 'bg-purple-500',
// //       'Expert': 'bg-yellow-500',
// //       'Master': 'bg-red-500'
// //     };
// //     return rankColors[rank] || 'bg-gray-500';
// //   };

// //   const getNextRankProgress = (points) => {
// //     if (points < 50) return (points / 50) * 100;
// //     if (points < 200) return (points / 200) * 100;
// //     if (points < 500) return (points / 500) * 100;
// //     if (points < 1000) return (points / 1000) * 100;
// //     return 100;
// //   };

// //   const formatTimeAgo = (timestamp) => {
// //     const now = new Date();
// //     const time = new Date(timestamp);
// //     const diffInSeconds = Math.floor((now - time) / 1000);
    
// //     if (diffInSeconds < 60) return 'Just now';
// //     if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
// //     if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
// //     if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
// //     return time.toLocaleDateString();
// //   };

// //   if (!isLoaded) {
// //     return (
// //       <div className="flex items-center justify-center h-64">
// //         <div className="text-center">
// //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
// //           <p className="text-white">Loading profile...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   if (!isSignedIn) {
// //     return (
// //       <div className="flex items-center justify-center h-64">
// //         <div className="text-center">
// //           <p className="text-white">Please sign in to view your profile.</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <>
// //       <EditProfileModal open={isModalOpen} onOpenChange={setIsModalOpen} />

// //       <motion.div 
// //         className="space-y-8" 
// //         variants={containerVariants} 
// //         initial="hidden" 
// //         animate="visible"
// //       >
// //         {/* Header */}
// //         <motion.div variants={itemVariants} className="text-center">
// //           <h1 className="text-4xl font-extrabold text-blue-800 flex items-center justify-center gap-2">
// //             <Sparkles className="w-8 h-8 text-blue-500" />
// //             My Profile
// //           </h1>
// //           <p className="text-lg text-slate-600 mt-2">
// //             Track your journey, showcase your achievements, and level up in Spark!
// //           </p>
// //         </motion.div>

// //         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
// //           {/* Profile Card (Spans 1 column) */}
// //           <motion.div className="lg:col-span-1" variants={itemVariants}>
// //             <Card className="bg-white/95 shadow-xl rounded-2xl overflow-hidden h-full border border-blue-100">
// //               <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 flex flex-col items-center text-center relative">
// //                 <motion.div 
// //                   className="absolute top-0 right-0 p-2"
// //                   initial={{ scale: 0 }}
// //                   animate={{ scale: 1 }}
// //                   transition={{ delay: 0.2 }}
// //                 >
// //                   <Trophy className="w-8 h-8 text-yellow-400" />
// //                 </motion.div>
// //                 <div className="relative">
// //                   <Avatar className="h-32 w-32 mb-4 ring-4 ring-blue-300 ring-offset-4 ring-offset-transparent transition-all hover:scale-105">
// //                     <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
// //                     <AvatarFallback className="text-3xl bg-blue-200 text-blue-800">
// //                       {user.fullName?.charAt(0) || user.primaryEmailAddress?.emailAddress?.charAt(0)}
// //                     </AvatarFallback>
// //                   </Avatar>
// //                   <Badge 
// //                     className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 ${getRankColor(userStats.rank)} text-white px-4 py-1 rounded-full shadow-md`}
// //                   >
// //                     {userStats.rank}
// //                   </Badge>
// //                 </div>
                
// //                 <h2 className="text-3xl font-extrabold mt-4 text-blue-900">{user.fullName || 'New User'}</h2>
// //                 <p className="text-slate-600 text-sm italic">{user.primaryEmailAddress?.emailAddress}</p>
                
// //                 <div className="w-full mt-4">
// //                   <Progress value={getNextRankProgress(userStats.totalPoints)} className="h-2 bg-blue-100" />
// //                   <p className="text-sm text-blue-700 mt-1">Progress to next rank: {Math.round(getNextRankProgress(userStats.totalPoints))}%</p>
// //                 </div>

// //                 <div className="flex items-center justify-around w-full mt-4 text-sm">
// //                   <div className="flex flex-col items-center">
// //                     <Star className="w-5 h-5 text-amber-500" />
// //                     <span className="font-bold text-blue-800">{userStats.totalPoints} pts</span>
// //                   </div>
// //                   <div className="flex flex-col items-center">
// //                     <Calendar className="w-5 h-5 text-sky-500" />
// //                     <span className="text-blue-800">Joined {new Date(userStats.joinDate).toLocaleDateString()}</span>
// //                   </div>
// //                 </div>
// //               </div>

// //               <CardContent className="p-6 bg-gradient-to-b from-white to-blue-50">
// //                 <Button 
// //                   onClick={() => setIsModalOpen(true)} 
// //                   variant="default" 
// //                   className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-shadow"
// //                 >
// //                   <Edit className="w-4 h-4 mr-2" />
// //                   Edit Profile
// //                 </Button>

// //                 <Separator className="my-4 bg-blue-200" />
                
// //                 {/* Profile Information */}
// //                 <div className="space-y-6">
// //                   {/* Primary Goal */}
// //                   <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// //                     <Target className="w-6 h-6 text-blue-600" />
// //                     <p className="font-semibold text-blue-800">Primary Goal:</p>
// //                     <p className="text-slate-700 text-center">
// //                       {user.unsafeMetadata?.primaryGoal || (
// //                         <Button variant="link" className="p-0 text-blue-600 hover:text-blue-800" onClick={() => setIsModalOpen(true)}>
// //                           Set Your Goal Now
// //                         </Button>
// //                       )}
// //                     </p>
// //                   </div>

// //                   {/* Bio */}
// //                   {user.unsafeMetadata?.bio && (
// //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// //                       <FileText className="w-6 h-6 text-sky-500" />
// //                       <p className="font-semibold text-blue-800">Bio:</p>
// //                       <p className="text-slate-700 text-center text-sm">
// //                         {user.unsafeMetadata.bio}
// //                       </p>
// //                     </div>
// //                   )}

// //                   {/* Job Title */}
// //                   {user.unsafeMetadata?.jobTitle && (
// //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// //                       <Briefcase className="w-6 h-6 text-emerald-500" />
// //                       <p className="font-semibold text-blue-800">Job Title:</p>
// //                       <p className="text-slate-700 text-center">
// //                         {user.unsafeMetadata.jobTitle}
// //                         {user.unsafeMetadata.company && ` at ${user.unsafeMetadata.company}`}
// //                       </p>
// //                     </div>
// //                   )}

// //                   {/* Location */}
// //                   {user.unsafeMetadata?.location && (
// //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// //                       <MapPin className="w-6 h-6 text-red-500" />
// //                       <p className="font-semibold text-blue-800">Location:</p>
// //                       <p className="text-slate-700 text-center">
// //                         {user.unsafeMetadata.location}
// //                       </p>
// //                     </div>
// //                   )}

// //                   {/* Website */}
// //                   {user.unsafeMetadata?.website && (
// //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// //                       <Globe className="w-6 h-6 text-cyan-500" />
// //                       <p className="font-semibold text-blue-800">Website:</p>
// //                       <a 
// //                         href={user.unsafeMetadata.website} 
// //                         target="_blank" 
// //                         rel="noopener noreferrer"
// //                         className="text-blue-600 hover:text-blue-800 text-center text-sm underline"
// //                       >
// //                         {user.unsafeMetadata.website}
// //                       </a>
// //                     </div>
// //                   )}

// //                   {/* Skills */}
// //                   {user.unsafeMetadata?.skills && (
// //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// //                       <Star className="w-6 h-6 text-amber-500" />
// //                       <p className="font-semibold text-blue-800">Skills:</p>
// //                       <p className="text-slate-700 text-center text-sm">
// //                         {user.unsafeMetadata.skills}
// //                       </p>
// //                     </div>
// //                   )}

// //                   {/* Interests */}
// //                   {user.unsafeMetadata?.interests && (
// //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// //                       <Heart className="w-6 h-6 text-pink-500" />
// //                       <p className="font-semibold text-blue-800">Interests:</p>
// //                       <p className="text-slate-700 text-center text-sm">
// //                         {user.unsafeMetadata.interests}
// //                       </p>
// //                     </div>
// //                   )}
// //                 </div>
// //               </CardContent>
// //             </Card>
// //           </motion.div>

// //           <div className="lg:col-span-3 space-y-8">
// //             {/* Statistics */}
// //             <motion.div variants={itemVariants}>
// //               <Card className="bg-white shadow-xl rounded-2xl overflow-hidden border-t-4 border-blue-500">
// //                 <CardHeader className="bg-blue-50">
// //                   <CardTitle className="flex items-center gap-2 text-blue-900 text-2xl">
// //                     <TrendingUp className="w-7 h-7 text-blue-600" />
// //                     Statistics
// //                   </CardTitle>
// //                   <CardDescription className="text-slate-600 text-lg">Your all-time progress and achievements.</CardDescription>
// //                 </CardHeader>
// //                 <CardContent className="p-6">
// //                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
// //                     <motion.div 
// //                       className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg text-center hover:scale-105 transition-transform"
// //                       whileHover={{ scale: 1.05 }}
// //                     >
// //                       <CheckSquare className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
// //                       <p className="text-4xl font-bold text-emerald-700">{tasksCompleted}</p>
// //                       <p className="text-base text-slate-600 mt-1">Tasks Completed</p>
// //                     </motion.div>
// //                     <motion.div 
// //                       className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg text-center hover:scale-105 transition-transform"
// //                       whileHover={{ scale: 1.05 }}
// //                     >
// //                       <Flame className="w-12 h-12 mx-auto mb-3 text-amber-500" />
// //                       <p className="text-4xl font-bold text-amber-700">{habitStreak.count} Days</p>
// //                       <p className="text-base text-slate-600 mt-1">Habit Streak</p>
// //                     </motion.div>
// //                     <motion.div 
// //                       className="p-6 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 shadow-lg text-center hover:scale-105 transition-transform"
// //                       whileHover={{ scale: 1.05 }}
// //                     >
// //                       <BookOpen className="w-12 h-12 mx-auto mb-3 text-sky-500" />
// //                       <p className="text-4xl font-bold text-sky-700">{coursesFinished}</p>
// //                       <p className="text-base text-slate-600 mt-1">Courses Finished</p>
// //                     </motion.div>
// //                   </div>
// //                 </CardContent>
// //               </Card>
// //             </motion.div>

// //             {/* Recent Activity */}
// //             <motion.div variants={itemVariants}>
// //               <Card className="bg-white shadow-xl rounded-2xl overflow-hidden border-t-4 border-blue-500">
// //                 <CardHeader className="bg-blue-50">
// //                   <CardTitle className="flex items-center gap-2 text-blue-900 text-2xl">
// //                     <Activity className="w-7 h-7 text-blue-600" />
// //                     Recent Activity
// //                   </CardTitle>
// //                   <CardDescription className="text-slate-600 text-lg">Your latest accomplishments and interactions.</CardDescription>
// //                 </CardHeader>
// //                 <CardContent className="p-6">
// //                   {recentActivities.length > 0 ? (
// //                     <div className="space-y-4">
// //                       <AnimatePresence>
// //                         {recentActivities.map((activity, index) => {
// //                           const Icon = activityIcons[activity.type] || Activity;
// //                           const color = activityColors[activity.type] || 'text-gray-400';
                          
// //                           return (
// //                             <motion.div
// //                               key={activity.id}
// //                               initial={{ opacity: 0, x: -20 }}
// //                               animate={{ opacity: 1, x: 0 }}
// //                               exit={{ opacity: 0, x: 20 }}
// //                               transition={{ delay: index * 0.1 }}
// //                               className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
// //                             >
// //                               <div className={`p-3 rounded-full bg-white shadow-md ${color}`}>
// //                                 <Icon className="w-6 h-6" />
// //                               </div>
// //                               <div className="flex-1">
// //                                 <p className="text-base font-medium text-blue-900">{activity.description}</p>
// //                                 <p className="text-sm text-slate-600">
// //                                   {formatTimeAgo(activity.timestamp)}
// //                                 </p>
// //                               </div>
// //                               {activity.points && (
// //                                 <Badge variant="secondary" className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
// //                                   +{activity.points} pts
// //                                 </Badge>
// //                               )}
// //                             </motion.div>
// //                           );
// //                         })}
// //                       </AnimatePresence>
// //                     </div>
// //                   ) : (
// //                     <div className="text-center py-12">
// //                       <motion.div
// //                         initial={{ scale: 0.8, opacity: 0 }}
// //                         animate={{ scale: 1, opacity: 1 }}
// //                         transition={{ duration: 0.5 }}
// //                       >
// //                         <Activity className="w-20 h-20 mx-auto mb-4 text-blue-300 animate-bounce" />
// //                       </motion.div>
// //                       <p className="text-blue-900 font-medium text-lg">No recent activity yet.</p>
// //                       <p className="text-sm text-slate-600 mt-2">
// //                         Dive into Spark and start building your streak today!
// //                       </p>
// //                     </div>
// //                   )}
// //                 </CardContent>
// //               </Card>
// //             </motion.div>
// //           </div>
// //         </div>
// //       </motion.div>
// //     </>
// //   );
// // }

// // // 'use client';

// // // import { useState, useEffect } from 'react';
// // // import { useUser } from '@clerk/nextjs';
// // // import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// // // import { Button } from "@/components/ui/button";
// // // import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// // // import { Separator } from "@/components/ui/separator";
// // // import { Badge } from "@/components/ui/badge";
// // // import { Progress } from "@/components/ui/progress";
// // // import { motion, AnimatePresence } from "framer-motion";
// // // import { 
// // //   BookOpen, 
// // //   CheckSquare, 
// // //   Edit, 
// // //   Flame, 
// // //   Target, 
// // //   Calendar,
// // //   Trophy,
// // //   Activity,
// // //   Palette,
// // //   Brain,
// // //   MessageCircle,
// // //   FileText,
// // //   Star,
// // //   TrendingUp,
// // //   MapPin,
// // //   Briefcase,
// // //   Globe,
// // //   Phone,
// // //   Heart,
// // //   Sparkles
// // // } from "lucide-react";
// // // import EditProfileModal from './EditProfileModal';
// // // import { taskApi } from "@/backend/lib/api"; // Your backend/api helper

// // // // Animation variants
// // // const containerVariants = {hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } }};
// // // const itemVariants = {hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 }};

// // // const activityIcons = {
// // //   'task_completed': CheckSquare,
// // //   'habit_streak': Flame,
// // //   'course_finished': BookOpen,
// // //   'chat_message': MessageCircle,
// // //   'whiteboard_created': Palette,
// // //   'mindmap_created': Brain,
// // //   'goal_achieved': Trophy,
// // //   'profile_updated': Edit,
// // //   'daily_login': Calendar,
// // //   'milestone_reached': Star
// // // };
// // // const activityColors = {
// // //   'task_completed': 'text-emerald-400',
// // //   'habit_streak': 'text-amber-400',
// // //   'course_finished': 'text-sky-400',
// // //   'chat_message': 'text-purple-400',
// // //   'whiteboard_created': 'text-pink-400',
// // //   'mindmap_created': 'text-cyan-400',
// // //   'goal_achieved': 'text-yellow-400',
// // //   'profile_updated': 'text-gray-400',
// // //   'daily_login': 'text-indigo-400',
// // //   'milestone_reached': 'text-blue-400'
// // // };

// // // function useUserData() {
// // //   const [data, setData] = useState({ tasksCompleted: 0, habitStreak: { count: 0 }, coursesFinished: 0 });
// // //   useEffect(() => {
// // //     const storedData = JSON.parse(localStorage.getItem('user_data') || '{}');
// // //     setData({
// // //       tasksCompleted: storedData.tasksCompleted || 0,
// // //       habitStreak: storedData.habitStreak || { count: 0 },
// // //       coursesFinished: storedData.coursesFinished || 0
// // //     });
// // //   }, []);
// // //   return data;
// // // }

// // // export default function ProfilePage() {
// // //   const { user, isLoaded, isSignedIn } = useUser();
// // //   const { tasksCompleted, habitStreak, coursesFinished } = useUserData();
// // //   const [isModalOpen, setIsModalOpen] = useState(false);
// // //   const [recentActivities, setRecentActivities] = useState([]);
// // //   const [userStats, setUserStats] = useState({
// // //     totalPoints: 0,
// // //     rank: 'Beginner',
// // //     joinDate: null,
// // //     lastActive: null
// // //   });
// // //   const [tasks, setTasks] = useState([]);

// // //   useEffect(() => {
// // //     if (user) {
// // //       fetchUserTasks();
// // //       loadUserStats();
// // //     }
// // //   }, [user]);

// // //   useEffect(() => {
// // //     if (user && (isLoaded || tasks.length > 0)) {
// // //       loadUserActivities();
// // //     }
// // //   }, [user, isLoaded, tasks]);

// // //   useEffect(() => {
// // //     if (isLoaded && user && isSignedIn) {
// // //       if (!user.unsafeMetadata?.primaryGoal || !user.unsafeMetadata?.bio || !user.unsafeMetadata?.skills) {
// // //         setIsModalOpen(true);
// // //       }
// // //     }
// // //   }, [user, isLoaded, isSignedIn]);

// // //   const fetchUserTasks = async () => {
// // //     if (!user?.id) return;
// // //     try {
// // //       const res = await taskApi.getTasks({ userId: user.id });
// // //       if (res.success && Array.isArray(res.data)) setTasks(res.data);
// // //     } catch { setTasks([]); }
// // //   };

// // //   // Combine local activities with completed tasks as activities
// // //   const loadUserActivities = () => {
// // //     try {
// // //       const activities = JSON.parse(localStorage.getItem('user_activities') || '[]')
// // //         .filter(activity => activity.userId === user.id);
// // //       const taskCompletions = tasks
// // //         .filter(t => t.status === 'completed')
// // //         .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
// // //         .slice(0, 10)
// // //         .map(task => ({
// // //           id: `task-${task._id}`,
// // //           userId: user.id,
// // //           timestamp: task.completedAt || task.updatedAt || new Date().toISOString(),
// // //           type: 'task_completed',
// // //           description: `Completed task: ${task.title}`,
// // //           points: 5
// // //         }));
// // //       const all = [...activities, ...taskCompletions]
// // //         .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
// // //         .slice(0, 10);
// // //       setRecentActivities(all);
// // //     } catch {
// // //       setRecentActivities([]);
// // //     }
// // //   };

// // //   const loadUserStats = () => {
// // //     try {
// // //       const stats = JSON.parse(localStorage.getItem('user_stats') || '{}');
// // //       const userStatsData = stats[user.id] || {
// // //         totalPoints: 0,
// // //         rank: 'Beginner',
// // //         joinDate: user.createdAt,
// // //         lastActive: new Date().toISOString()
// // //       };
// // //       setUserStats(userStatsData);
// // //     } catch { }
// // //   };

// // //   const getRankColor = (rank) => {
// // //     const colors = {
// // //       'Beginner': 'bg-gray-500',
// // //       'Intermediate': 'bg-blue-500',
// // //       'Advanced': 'bg-purple-500',
// // //       'Expert': 'bg-yellow-500',
// // //       'Master': 'bg-red-500'
// // //     };
// // //     return colors[rank] || 'bg-gray-500';
// // //   };
// // //   const getNextRankProgress = (points) => {
// // //     if (points < 50) return (points / 50) * 100;
// // //     if (points < 200) return (points / 200) * 100;
// // //     if (points < 500) return (points / 500) * 100;
// // //     if (points < 1000) return (points / 1000) * 100;
// // //     return 100;
// // //   };
// // //   const formatTimeAgo = (timestamp) => {
// // //     const now = new Date();
// // //     const time = new Date(timestamp);
// // //     const diffInSeconds = Math.floor((now - time) / 1000);
// // //     if (diffInSeconds < 60) return 'Just now';
// // //     if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
// // //     if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
// // //     if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
// // //     return time.toLocaleDateString();
// // //   };

// // //   if (!isLoaded) return (
// // //     <div className="flex items-center justify-center h-64">
// // //       <div className="text-center">
// // //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
// // //         <p className="text-white">Loading profile...</p>
// // //       </div>
// // //     </div>
// // //   );
// // //   if (!isSignedIn) return (
// // //     <div className="flex items-center justify-center h-64">
// // //       <div className="text-center">
// // //         <p className="text-white">Please sign in to view your profile.</p>
// // //       </div>
// // //     </div>
// // //   );

// // //   return (
// // //     <>
// // //       <EditProfileModal open={isModalOpen} onOpenChange={setIsModalOpen} />
// // //       {/* The rest of your ProfilePage JSX from your first code block...
// // //           Use recentActivities as activity source for the recent activity section.
// // //           All UI remains as in your original post! */}
       

// // //       {/* --- SNIPPED for brevity (insert your detailed profile JSX here as in your initial component) --- */}
// // //     </>
// // //   );
// // // }
