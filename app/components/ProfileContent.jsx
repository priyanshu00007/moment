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
import { BookOpen, CheckSquare, Edit, Flame, Target, Calendar, Trophy, Activity, Shield, Star, TrendingUp, MapPin, Briefcase, Heart, Clock, Zap, Play, Trash2, X, Focus, Timer, Check, Award, CircleCheck } from "lucide-react";
import { format } from 'date-fns';
import EditProfileModal from './EditProfileModal';
import { taskApi } from '@/backend/lib/api';

class RankingSystem {
  static ranks = [
    { tier: 'Bronze', level: 1, name: 'Bronze I', minXP: 0, maxXP: 99, xpPerLevel: 100, color: '#CD7F32', gradient: 'from-amber-700 via-orange-600 to-yellow-600', glowColor: 'shadow-amber-500/30', icon: Shield, iconColor: 'text-amber-600', description: 'Starting your journey' },
    { tier: 'Silver', level: 1, name: 'Silver I', minXP: 300, maxXP: 499, xpPerLevel: 200, color: '#C0C0C0', gradient: 'from-slate-600 via-blue-600 to-indigo-600', glowColor: 'shadow-blue-500/30', icon: Star, iconColor: 'text-blue-600', description: 'Steady progression' },
    { tier: 'Gold', level: 1, name: 'Gold I', minXP: 900, maxXP: 1199, xpPerLevel: 300, color: '#FFD700', gradient: 'from-yellow-600 via-amber-500 to-orange-500', glowColor: 'shadow-yellow-500/30', icon: Trophy, iconColor: 'text-yellow-600', description: 'Golden achievement' },
    { tier: 'Platinum', level: 1, name: 'Platinum I', minXP: 1800, maxXP: 2199, xpPerLevel: 400, color: '#E5E4E2', gradient: 'from-gray-600 via-slate-500 to-zinc-500', glowColor: 'shadow-gray-500/30', icon: Trophy, iconColor: 'text-gray-600', description: 'Premium tier' },
    { tier: 'Diamond', level: 1, name: 'Diamond I', minXP: 3000, maxXP: 3599, xpPerLevel: 600, color: '#B9F2FF', gradient: 'from-cyan-600 via-blue-500 to-indigo-500', glowColor: 'shadow-cyan-500/30', icon: Trophy, iconColor: 'text-cyan-600', description: 'Brilliant performer' },
    { tier: 'Master', level: 1, name: 'Master I', minXP: 4800, maxXP: 5799, xpPerLevel: 1000, color: '#8A2BE2', gradient: 'from-purple-700 via-violet-600 to-fuchsia-600', glowColor: 'shadow-purple-500/30', icon: Trophy, iconColor: 'text-purple-700', description: 'True mastery' },
    { tier: 'Legend', level: 1, name: 'Legend', minXP: 7800, maxXP: 999999, xpPerLevel: 2000, color: '#FF4500', gradient: 'from-red-600 via-orange-500 via-yellow-400 via-green-400 via-blue-500 via-indigo-500 to-purple-600', glowColor: 'shadow-rainbow', icon: Trophy, iconColor: 'text-transparent bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text', description: 'Beyond legendary' }
  ];

  static getRankByXP(xp) {
    return this.ranks.reduce((prev, curr) => xp >= curr.minXP ? curr : prev, this.ranks[0]);
  }

  static getNextRank(currentRank) {
    const currentIndex = this.ranks.findIndex(rank => rank.name === currentRank.name);
    return currentIndex < this.ranks.length - 1 ? this.ranks[currentIndex + 1] : null;
  }

  static getXPRewards(tier, action) {
    const baseRewards = { task_completed_high: 15, task_completed_medium: 10, task_completed_low: 8, focus_session_completed: 20, pomodoro_session_completed: 12, session_started: 3, daily_streak: 5, profile_updated: 5 };
    const tierMultipliers = { Bronze: 1.0, Silver: 0.8, Gold: 0.7, Platinum: 0.6, Diamond: 0.5, Master: 0.4, Legend: 0.3 };
    return Math.max(1, Math.floor((baseRewards[action] || 5) * (tierMultipliers[tier] || 1.0)));
  }

  static getProgressToNextRank(xp) {
    const currentRank = this.getRankByXP(xp);
    const nextRank = this.getNextRank(currentRank);
    if (!nextRank) return { progress: 100, xpNeeded: 0, nextRank: null };
    const progressInCurrentRank = xp - currentRank.minXP;
    const xpNeededForNextRank = nextRank.minXP - currentRank.minXP;
    return { progress: Math.min((progressInCurrentRank / xpNeededForNextRank) * 100, 100), xpNeeded: nextRank.minXP - xp, nextRank };
  }
}

class ProfileDataManager {
  static storageKeys = { userStats: 'user_stats', focusStats: 'focus-sessions-data', pomodoroStats: 'pomodoro-sessions-data', taskAnalytics: 'tasks-analytics-data', userActivities: 'user-activities-data' };

  static getUserStats(userId) {
    try {
      const stats = JSON.parse(localStorage.getItem(this.storageKeys.userStats) || '{}');
      const dashboardData = this.getDashboardData();
      const userStats = stats[userId] || { totalPoints: 0, joinDate: new Date().toISOString(), lastActive: new Date().toISOString(), achievements: [], badges: [], streakCount: 0, totalFocusTime: 0, totalSessions: 0, tasksCompleted: 0 };
      userStats.totalFocusTime = dashboardData.totalActiveTime || 0;
      userStats.totalSessions = (dashboardData.totalFocusSessions || 0) + (dashboardData.totalPomodoroSessions || 0);
      userStats.streakCount = dashboardData.currentStreak || 0;
      userStats.tasksCompleted = dashboardData.totalTasksCompleted || 0;
      const currentRank = RankingSystem.getRankByXP(userStats.totalPoints);
      userStats.rank = currentRank.name;
      userStats.tier = currentRank.tier;
      userStats.level = currentRank.level;
      return userStats;
    } catch (error) {
      console.error('Error loading user stats:', error);
      return { totalPoints: 0, rank: 'Bronze I', tier: 'Bronze', level: 1, joinDate: new Date().toISOString(), lastActive: new Date().toISOString(), achievements: [], badges: [], streakCount: 0, totalFocusTime: 0, totalSessions: 0, tasksCompleted: 0 };
    }
  }

  static updateUserStats(userId, updates) {
    try {
      const allStats = JSON.parse(localStorage.getItem(this.storageKeys.userStats) || '{}');
      const currentStats = allStats[userId] || this.getUserStats(userId);
      const updatedStats = { ...currentStats, ...updates, lastActive: new Date().toISOString() };
      const newRank = RankingSystem.getRankByXP(updatedStats.totalPoints);
      updatedStats.rank = newRank.name;
      updatedStats.tier = newRank.tier;
      updatedStats.level = newRank.level;
      allStats[userId] = updatedStats;
      localStorage.setItem(this.storageKeys.userStats, JSON.stringify(allStats));
      return updatedStats;
    } catch (error) {
      console.error('Error updating user stats:', error);
      return this.getUserStats(userId);
    }
  }

  static logActivity(userId, activity) {
    try {
      const currentStats = this.getUserStats(userId);
      const currentRank = RankingSystem.getRankByXP(currentStats.totalPoints);
      const xpReward = RankingSystem.getXPRewards(currentRank.tier, activity.type);
      const updatedStats = this.updateUserStats(userId, { totalPoints: currentStats.totalPoints + xpReward });
      const newRank = RankingSystem.getRankByXP(updatedStats.totalPoints);
      const rankUp = newRank.name !== currentRank.name;
      if (rankUp) {
        const rankUpBonus = Math.floor(newRank.minXP * 0.1);
        this.updateUserStats(userId, { totalPoints: updatedStats.totalPoints + rankUpBonus });
      }
      const activities = JSON.parse(localStorage.getItem(this.storageKeys.userActivities) || '[]');
      const newActivity = { id: Date.now().toString(), userId, timestamp: new Date().toISOString(), date: new Date().toISOString().split('T')[0], points: xpReward, ...activity };
      activities.unshift(newActivity);
      localStorage.setItem(this.storageKeys.userActivities, JSON.stringify(activities.slice(0, 100)));
      return { activity: newActivity, xpReward, rankUp };
    } catch (error) {
      console.error('Error logging activity:', error);
      return { xpReward: 0, rankUp: false };
    }
  }

  static getDashboardData() {
    try {
      const focusData = JSON.parse(localStorage.getItem(this.storageKeys.focusStats) || '[]');
      const pomodoroData = JSON.parse(localStorage.getItem(this.storageKeys.pomodoroStats) || '[]');
      const taskData = JSON.parse(localStorage.getItem(this.storageKeys.taskAnalytics) || '[]');
      let totalActiveTime = 0, totalFocusSessions = 0, totalPomodoroSessions = 0, totalTasksCompleted = 0;
      focusData.forEach(session => { if (session.duration) totalActiveTime += Math.floor(session.duration / 60); if (session.completed !== false) totalFocusSessions += 1; });
      pomodoroData.forEach(session => { if (session.duration && session.type === 'work') totalActiveTime += Math.floor(session.duration / 60); if (session.completed !== false && session.type === 'work') totalPomodoroSessions += 1; });
      taskData.forEach(activity => { if (activity.type === 'task_completed') totalTasksCompleted += 1; });
      return { totalActiveTime, totalFocusSessions, totalPomodoroSessions, totalTasksCompleted, currentStreak: 0 };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return { totalActiveTime: 0, totalFocusSessions: 0, totalPomodoroSessions: 0, totalTasksCompleted: 0, currentStreak: 0 };
    }
  }
}

function StartTaskModal({ isOpen, onClose, onSelectMode, task, userStats }) {
  if (!isOpen) return null;
  const handleSelectMode = (mode) => {
    if (task && userStats) ProfileDataManager.logActivity(userStats.userId || "user123", { type: 'session_started', sessionType: mode, taskId: task._id, taskTitle: task.title, description: `Started ${mode} session for "${task.title}"` });
    onSelectMode(mode, task);
  };
  const currentRank = userStats ? RankingSystem.getRankByXP(userStats.totalPoints) : RankingSystem.ranks[0];
  const focusXP = RankingSystem.getXPRewards(currentRank.tier, 'focus_session_completed');
  const pomodoroXP = RankingSystem.getXPRewards(currentRank.tier, 'pomodoro_session_completed');
  const startXP = RankingSystem.getXPRewards(currentRank.tier, 'session_started');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div initial={{ scale: 0.8, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.8, y: 50, opacity: 0 }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100">
            <button onClick={onClose} className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 p-2"><X className="w-5 h-5" /></button>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Choose Focus Mode</h2>
              {task && <p className="text-gray-600">Ready to start: <span className="font-semibold text-blue-600">{task.title}</span></p>}
            </div>
            <div className="space-y-4">
              <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => handleSelectMode('focus')} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-5 px-6 rounded-2xl shadow-lg flex items-center justify-between">
                <div className="flex items-center space-x-3"><Focus className="w-6 h-6" /><div className="text-left"><div className="text-lg">Focus Mode</div><div className="text-sm opacity-90">Deep work session</div></div></div>
                <div className="text-right"><div className="text-lg font-bold">+{focusXP} XP</div><div className="text-xs opacity-90">on completion</div></div>
              </motion.button>
              <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => handleSelectMode('pomodoro')} className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold py-5 px-6 rounded-2xl shadow-lg flex items-center justify-between">
                <div className="flex items-center space-x-3"><Timer className="w-6 h-6" /><div className="text-left"><div className="text-lg">Pomodoro Technique</div><div className="text-sm opacity-90">25 min focused bursts</div></div></div>
                <div className="text-right"><div className="text-lg font-bold">+{pomodoroXP} XP</div><div className="text-xs opacity-90">per session</div></div>
              </motion.button>
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200/50">
              <div className="flex items-center justify-center gap-2 text-blue-700"><Award className="w-5 h-5" /><span className="font-medium">Instant Reward: +{startXP} XP for starting!</span></div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const containerVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1, ease: "easeOut" } } };
const itemVariants = { hidden: { y: 30, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } } };

function useUserData() {
  const [data, setData] = useState({ tasksCompleted: 0, habitStreak: { count: 0 }, coursesFinished: 0 });
  useEffect(() => {
    try {
      const storedData = JSON.parse(localStorage.getItem('user_data') || '{}');
      setData({ tasksCompleted: storedData.tasksCompleted || 0, habitStreak: storedData.habitStreak || { count: 0 }, coursesFinished: storedData.coursesFinished || 0 });
    } catch (error) { console.error('Failed to load user data:', error); }
  }, []);
  return data;
}

export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { tasksCompleted, habitStreak } = useUserData();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [taskToStart, setTaskToStart] = useState(null);

  useEffect(() => {
    if (user) {
      loadUserStats();
      loadTasks();
      const interval = setInterval(loadUserStats, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUserStats = () => {
    if (!user?.id) return;
    setUserStats(ProfileDataManager.getUserStats(user.id));
  };

  const loadTasks = async () => {
    if (!user?.id) return;
    setLoadingTasks(true);
    try {
      const response = await taskApi.getTasks({ userId: "user123" });
      if (response.success && response.data) setTasks(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) { console.error('Failed to load tasks:', error); }
    finally { setLoadingTasks(false); }
  };

  const handleShowStartModal = (task) => {
    setTaskToStart(task);
    setIsStartModalOpen(true);
  };

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const originalStatus = task.status;
    setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    try {
      await taskApi.updateTask(task._id, { status: newStatus, progress: { percentage: newStatus === 'completed' ? 100 : task.progress?.percentage || 0 }, completedAt: newStatus === 'completed' ? new Date().toISOString() : null });
      if (newStatus === 'completed') {
        ProfileDataManager.logActivity(user.id, { type: `task_completed_${task.priority}`, taskId: task._id, taskTitle: task.title, priority: task.priority, description: `Completed ${task.priority} priority task: ${task.title}` });
        setTimeout(loadUserStats, 500);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? { ...t, status: originalStatus } : t));
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const originalTasks = tasks;
    setTasks(prevTasks => prevTasks.filter(t => t._id !== taskId));
    try { await taskApi.deleteTask(taskId); } catch (error) { console.error("Failed to delete task:", error); setTasks(originalTasks); }
  };

  const taskStats = { total: tasks.length, completed: tasks.filter(t => t.status === 'completed').length, inProgress: tasks.filter(t => t.status === 'in-progress').length, pending: tasks.filter(t => t.status === 'pending').length };
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const activeTasks = tasks.filter(task => task.status !== 'completed');
  const currentRank = userStats ? RankingSystem.getRankByXP(userStats.totalPoints) : RankingSystem.ranks[0];
  const rankProgress = userStats ? RankingSystem.getProgressToNextRank(userStats.totalPoints) : { progress: 0, xpNeeded: 100, nextRank: RankingSystem.ranks[1] };
  const RankIcon = currentRank.icon;

  const formatTime = (minutes) => minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60 > 0 ? `${minutes % 60}m` : ''}`;

  if (!isLoaded) return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  if (!isSignedIn) return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center text-center p-8"><h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Welcome to Focus App!</h2><p className="text-gray-600 text-lg">Please sign in to view your profile and manage your tasks.</p></div>;

  return (
    <>
      <EditProfileModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
      <StartTaskModal isOpen={isStartModalOpen} onClose={() => setIsStartModalOpen(false)} task={taskToStart} userStats={userStats} onSelectMode={(mode) => { setIsStartModalOpen(false); console.log(`Selected ${mode} for task: ${taskToStart?.title}`); }} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative">
        <motion.div className="p-6" variants={containerVariants} initial="hidden" animate="visible">
          <div className="max-w-7xl mx-auto space-y-8">
            <motion.div variants={itemVariants} className="text-center py-12">
              <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">My Profile</h1>
              <p className="text-2xl text-gray-600 max-w-3xl mx-auto">Track your journey, showcase your achievements, and level up your productivity!</p>
            </motion.div>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              <motion.div className="xl:col-span-1" variants={itemVariants}>
                <Card className={`bg-white/90 shadow-2xl rounded-3xl border-0 ${currentRank.glowColor}`}>
                  <div className={`bg-gradient-to-br ${currentRank.gradient} p-8 text-white`}>
                    <div className="flex justify-between mb-8"><RankIcon className={`w-10 h-10 ${currentRank.iconColor}`} /><Badge className="bg-white/20 text-white border-white/30 px-4 py-2">{currentRank.tier} {currentRank.level}</Badge></div>
                    <div className="text-center">
                      <Avatar className="h-36 w-36 mb-4 ring-4 ring-white/50 mx-auto"><AvatarImage src={user.imageUrl} /><AvatarFallback>{user.fullName?.charAt(0) || user.primaryEmailAddress?.emailAddress?.charAt(0)}</AvatarFallback></Avatar>
                      <Badge className="bg-white/20 text-white px-6 py-2 rounded-full">{currentRank.name}</Badge>
                      <h2 className="text-4xl font-bold mt-4">{user.fullName || 'New User'}</h2>
                      <p className="text-white/90">{user.primaryEmailAddress?.emailAddress}</p>
                      <p className="text-white/80 text-sm italic">{currentRank.description}</p>
                      <div className="mt-8">
                        <div className="flex justify-between mb-3"><span className="text-sm text-white/90">{rankProgress.nextRank ? `Progress to ${rankProgress.nextRank.name}` : 'Maximum Rank!'}</span><span className="text-lg font-bold">{Math.round(rankProgress.progress)}%</span></div>
                        <Progress value={rankProgress.progress} className="h-3 bg-white/20 rounded-full" />
                        {rankProgress.nextRank && <p className="text-sm text-white/80 mt-2">{rankProgress.xpNeeded} XP needed</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-6 mt-8 pt-8 border-t border-white/30">
                        <div className="text-center"><Star className="w-6 h-6 mx-auto mb-2 text-yellow-300" /><div className="text-3xl font-bold">{userStats?.totalPoints || 0}</div><div className="text-sm text-white/90">Total XP</div></div>
                        <div className="text-center"><Calendar className="w-6 h-6 mx-auto mb-2 text-blue-200" /><div className="text-lg font-semibold">{userStats?.joinDate ? new Date(userStats.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}</div><div className="text-sm text-white/90">Joined</div></div>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-8">
                    <Button onClick={() => setIsEditModalOpen(true)} className="w-full mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl h-14"><Edit className="w-5 h-5 mr-3" />Edit Profile</Button>
                    <Separator className="my-8" />
                    <div className="space-y-4">
                      {[{ key: 'primaryGoal', icon: Target, label: 'Primary Goal', color: 'text-blue-600', bg: 'bg-blue-50' }, { key: 'bio', icon: BookOpen, label: 'Bio', color: 'text-purple-600', bg: 'bg-purple-50' }, { key: 'jobTitle', icon: Briefcase, label: 'Job Title', color: 'text-green-600', bg: 'bg-green-50' }, { key: 'location', icon: MapPin, label: 'Location', color: 'text-red-600', bg: 'bg-red-50' }].map(({ key, icon: Icon, label, color, bg }) => {
                        const value = user.unsafeMetadata?.[key];
                        return value ? <motion.div key={key} whileHover={{ scale: 1.02 }} className={`flex items-start gap-4 p-4 rounded-xl ${bg} border border-gray-100`}><Icon className={`w-6 h-6 ${color}`} /><div><p className="font-semibold text-gray-800 text-sm">{label}</p><p className="text-gray-600 text-sm">{value}</p></div></motion.div> : null;
                      })}
                      {!user.unsafeMetadata?.primaryGoal && <motion.div whileHover={{ scale: 1.02 }} className="text-center p-6 border-2 border-dashed border-gray-300 rounded-2xl"><Target className="w-12 h-12 text-gray-400 mx-auto mb-4" /><Button variant="ghost" onClick={() => setIsEditModalOpen(true)} className="text-blue-600 font-semibold">Set Your Goals & Info</Button></motion.div>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <div className="xl:col-span-3 space-y-8">
                <motion.div variants={itemVariants}>
                  <Card className="bg-white/90 shadow-2xl rounded-3xl border-0">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 p-8">
                      <CardTitle className="flex items-center gap-4 text-gray-800 text-3xl"><TrendingUp className="w-8 h-8 text-blue-600" />Your Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[{ icon: CheckSquare, value: userStats?.tasksCompleted || taskStats.completed, label: 'Tasks Completed', color: 'text-emerald-500', bg: 'from-emerald-50 to-emerald-100' }, { icon: Flame, value: `${userStats?.streakCount || habitStreak.count} Days`, label: 'Current Streak', color: 'text-orange-500', bg: 'from-orange-50 to-orange-100' }, { icon: Activity, value: taskStats.inProgress, label: 'In Progress', color: 'text-blue-500', bg: 'from-blue-50 to-blue-100' }, { icon: Clock, value: formatTime(userStats?.totalFocusTime || 0), label: 'Focus Time', color: 'text-purple-500', bg: 'from-purple-50 to-purple-100' }].map((stat, index) => (
                          <motion.div key={stat.label} className={`p-6 rounded-2xl bg-gradient-to-br ${stat.bg} text-center`} whileHover={{ y: -8 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                            <stat.icon className={`w-12 h-12 mx-auto mb-4 ${stat.color}`} /><p className="text-4xl font-bold text-gray-800 mb-2">{stat.value}</p><p className="text-sm text-gray-600 font-semibold">{stat.label}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <motion.div variants={itemVariants}>
                    <Card className="bg-white/90 shadow-xl rounded-3xl border-0 h-full">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                        <div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3"><Play className="w-6 h-6 text-blue-600" />Active Tasks</h2><Badge variant="outline" className="bg-blue-50 text-blue-700">{activeTasks.length} tasks</Badge></div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {loadingTasks ? <div className="flex justify-center items-center h-40"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div> : activeTasks.length > 0 ? (
                          <ul className="space-y-4">
                            {activeTasks.slice(0, 5).map((task, index) => {
                              const xpReward = RankingSystem.getXPRewards(currentRank.tier, `task_completed_${task.priority}`);
                              return (
                                <motion.li key={task._id || index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border border-gray-100">
                                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => handleToggleComplete(task)} className="w-8 h-8 rounded-full border-2 border-gray-300" />
                                  <div className="flex-1 min-w-0"><p className="font-semibold text-gray-800 truncate text-lg">{task.title}</p><div className="flex items-center space-x-2 text-sm text-gray-500 mt-1"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${task.priority === 'high' ? 'bg-red-100 text-red-700' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{task.priority}</span><span className="text-gray-400">•</span><span className="font-medium">{task.category}</span><span className="text-gray-400">•</span><span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded-full text-xs">+{xpReward} XP</span></div></div>
                                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity"><motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => handleShowStartModal(task)} className="p-2 text-blue-500"><Play className="w-5 h-5" /></motion.button><motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => handleDeleteTask(task._id)} className="p-2 text-gray-500"><Trash2 className="w-5 h-5" /></motion.button></div>
                                </motion.li>
                              );
                            })}
                          </ul>
                        ) : <div className="text-center py-12 text-gray-500"><CheckSquare className="w-16 h-16 mx-auto mb-4 opacity-50" /><p className="text-xl font-medium mb-2">No active tasks</p><p className="text-sm">Create a new task to get started!</p></div>}
                      </CardContent>
                    </Card>
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <Card className="bg-white/90 shadow-xl rounded-3xl border-0 h-full">
                      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3"><CircleCheck className="w-6 h-6 text-green-600" />Recently Completed</h2>
                      </CardHeader>
                      <CardContent className="p-6">
                        {completedTasks.length > 0 ? (
                          <ul className="space-y-4">
                            {completedTasks.slice(0, 5).map((task, index) => {
                              const xpEarned = RankingSystem.getXPRewards(currentRank.tier, `task_completed_${task.priority}`);
                              return (
                                <motion.li key={task._id || index} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 border border-gray-100">
                                  <CircleCheck className="w-8 h-8 text-green-500" /><div className="flex-1 min-w-0"><p className="font-semibold text-gray-800 truncate text-lg">{task.title}</p><div className="flex items-center space-x-2 text-sm text-gray-500 mt-1"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${task.priority === 'high' ? 'bg-red-100 text-red-700' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{task.priority}</span><span className="text-gray-400">•</span><span className="font-medium">{task.category}</span><span className="text-gray-400">•</span><span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded-full text-xs">+{xpEarned} XP earned</span></div></div>
                                  <p className="text-sm text-gray-400 text-right"><span className="block font-medium">{task.completedAt ? format(new Date(task.completedAt), 'MMM dd') : format(new Date(task.updatedAt), 'MMM dd')}</span><span className="block text-xs">{task.completedAt ? format(new Date(task.completedAt), 'h:mm a') : format(new Date(task.updatedAt), 'h:mm a')}</span></p>
                                </motion.li>
                              );
                            })}
                          </ul>
                        ) : <div className="text-center py-12 text-gray-500"><CircleCheck className="w-16 h-16 mx-auto mb-4 opacity-50" /><p className="text-xl font-medium mb-2">No completed tasks yet</p><p className="text-sm">Complete tasks to see your achievements!</p></div>}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
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
//   Briefcase, Globe, Heart, Sparkles, Clock, Zap, Play, Trash2, Loader2, 
//   X, Focus, Timer, Check, Filter, Search, Award, Users, TrendingDown, 
//   ChevronDown, CircleCheck, Plus, Crown, Shield, Gem, Diamond, Hexagon
// } from "lucide-react";
// import { format } from 'date-fns';
// import EditProfileModal from './EditProfileModal';
// import { taskApi } from '@/backend/lib/api';

// // Enhanced Ranking System with Beautiful Colors and Gradients
// class RankingSystem {
//   static ranks = [
//     // Bronze Tier - Warm Copper/Bronze tones
//     { 
//       tier: 'Bronze', level: 1, name: 'Bronze I', minXP: 0, maxXP: 99, xpPerLevel: 100, 
//       color: '#CD7F32', 
//       gradient: 'from-amber-700 via-orange-600 to-yellow-600', 
//       glowColor: 'shadow-amber-500/30',
//       bgGradient: 'from-amber-50 via-orange-50 to-yellow-50',
//       icon: Shield, 
//       iconColor: 'text-amber-600',
//       description: 'Starting your journey'
//     },
//     { 
//       tier: 'Bronze', level: 2, name: 'Bronze II', minXP: 100, maxXP: 199, xpPerLevel: 100, 
//       color: '#CD7F32', 
//       gradient: 'from-amber-600 via-orange-500 to-yellow-500', 
//       glowColor: 'shadow-amber-500/40',
//       bgGradient: 'from-amber-50 via-orange-50 to-yellow-50',
//       icon: Shield, 
//       iconColor: 'text-amber-500',
//       description: 'Building momentum'
//     },
//     { 
//       tier: 'Bronze', level: 3, name: 'Bronze III', minXP: 200, maxXP: 299, xpPerLevel: 100, 
//       color: '#CD7F32', 
//       gradient: 'from-amber-500 via-orange-400 to-yellow-400', 
//       glowColor: 'shadow-amber-500/50',
//       bgGradient: 'from-amber-50 via-orange-50 to-yellow-50',
//       icon: Shield, 
//       iconColor: 'text-amber-400',
//       description: 'Almost to Silver!'
//     },
    
//     // Silver Tier - Cool Silver/Blue tones
//     { 
//       tier: 'Silver', level: 1, name: 'Silver I', minXP: 300, maxXP: 499, xpPerLevel: 200, 
//       color: '#C0C0C0', 
//       gradient: 'from-slate-600 via-blue-600 to-indigo-600', 
//       glowColor: 'shadow-blue-500/30',
//       bgGradient: 'from-slate-50 via-blue-50 to-indigo-50',
//       icon: Star, 
//       iconColor: 'text-blue-600',
//       description: 'Steady progression'
//     },
//     { 
//       tier: 'Silver', level: 2, name: 'Silver II', minXP: 500, maxXP: 699, xpPerLevel: 200, 
//       color: '#C0C0C0', 
//       gradient: 'from-slate-500 via-blue-500 to-indigo-500', 
//       glowColor: 'shadow-blue-500/40',
//       bgGradient: 'from-slate-50 via-blue-50 to-indigo-50',
//       icon: Star, 
//       iconColor: 'text-blue-500',
//       description: 'Getting stronger'
//     },
//     { 
//       tier: 'Silver', level: 3, name: 'Silver III', minXP: 700, maxXP: 899, xpPerLevel: 200, 
//       color: '#C0C0C0', 
//       gradient: 'from-blue-600 via-indigo-500 to-violet-500', 
//       glowColor: 'shadow-blue-500/50',
//       bgGradient: 'from-slate-50 via-blue-50 to-indigo-50',
//       icon: Star, 
//       iconColor: 'text-indigo-500',
//       description: 'Ready for Gold!'
//     },
    
//     // Gold Tier - Rich Gold/Amber tones
//     { 
//       tier: 'Gold', level: 1, name: 'Gold I', minXP: 900, maxXP: 1199, xpPerLevel: 300, 
//       color: '#FFD700', 
//       gradient: 'from-yellow-600 via-amber-500 to-orange-500', 
//       glowColor: 'shadow-yellow-500/30',
//       bgGradient: 'from-yellow-50 via-amber-50 to-orange-50',
//       icon: Trophy, 
//       iconColor: 'text-yellow-600',
//       description: 'Golden achievement'
//     },
//     { 
//       tier: 'Gold', level: 2, name: 'Gold II', minXP: 1200, maxXP: 1499, xpPerLevel: 300, 
//       color: '#FFD700', 
//       gradient: 'from-yellow-500 via-amber-400 to-orange-400', 
//       glowColor: 'shadow-yellow-500/40',
//       bgGradient: 'from-yellow-50 via-amber-50 to-orange-50',
//       icon: Trophy, 
//       iconColor: 'text-yellow-500',
//       description: 'Shining bright'
//     },
//     { 
//       tier: 'Gold', level: 3, name: 'Gold III', minXP: 1500, maxXP: 1799, xpPerLevel: 300, 
//       color: '#FFD700', 
//       gradient: 'from-amber-500 via-orange-400 to-red-400', 
//       glowColor: 'shadow-yellow-500/50',
//       bgGradient: 'from-yellow-50 via-amber-50 to-orange-50',
//       icon: Trophy, 
//       iconColor: 'text-amber-500',
//       description: 'Elite status'
//     },
    
//     // Platinum Tier - Elegant Platinum/White tones
//     { 
//       tier: 'Platinum', level: 1, name: 'Platinum I', minXP: 1800, maxXP: 2199, xpPerLevel: 400, 
//       color: '#E5E4E2', 
//       gradient: 'from-gray-600 via-slate-500 to-zinc-500', 
//       glowColor: 'shadow-gray-500/30',
//       bgGradient: 'from-gray-50 via-slate-50 to-zinc-50',
//       icon: Crown, 
//       iconColor: 'text-gray-600',
//       description: 'Premium tier'
//     },
//     { 
//       tier: 'Platinum', level: 2, name: 'Platinum II', minXP: 2200, maxXP: 2599, xpPerLevel: 400, 
//       color: '#E5E4E2', 
//       gradient: 'from-slate-600 via-zinc-500 to-stone-500', 
//       glowColor: 'shadow-gray-500/40',
//       bgGradient: 'from-gray-50 via-slate-50 to-zinc-50',
//       icon: Crown, 
//       iconColor: 'text-slate-600',
//       description: 'Distinguished'
//     },
//     { 
//       tier: 'Platinum', level: 3, name: 'Platinum III', minXP: 2600, maxXP: 2999, xpPerLevel: 400, 
//       color: '#E5E4E2', 
//       gradient: 'from-zinc-600 via-stone-500 to-neutral-500', 
//       glowColor: 'shadow-gray-500/50',
//       bgGradient: 'from-gray-50 via-slate-50 to-zinc-50',
//       icon: Crown, 
//       iconColor: 'text-zinc-600',
//       description: 'Near legendary'
//     },
    
//     // Diamond Tier - Brilliant Crystal tones
//     { 
//       tier: 'Diamond', level: 1, name: 'Diamond I', minXP: 3000, maxXP: 3599, xpPerLevel: 600, 
//       color: '#B9F2FF', 
//       gradient: 'from-cyan-600 via-blue-500 to-indigo-500', 
//       glowColor: 'shadow-cyan-500/30',
//       bgGradient: 'from-cyan-50 via-blue-50 to-indigo-50',
//       icon: Gem, 
//       iconColor: 'text-cyan-600',
//       description: 'Brilliant performer'
//     },
//     { 
//       tier: 'Diamond', level: 2, name: 'Diamond II', minXP: 3600, maxXP: 4199, xpPerLevel: 600, 
//       color: '#B9F2FF', 
//       gradient: 'from-blue-600 via-indigo-500 to-purple-500', 
//       glowColor: 'shadow-blue-500/40',
//       bgGradient: 'from-cyan-50 via-blue-50 to-indigo-50',
//       icon: Gem, 
//       iconColor: 'text-blue-600',
//       description: 'Sparkling excellence'
//     },
//     { 
//       tier: 'Diamond', level: 3, name: 'Diamond III', minXP: 4200, maxXP: 4799, xpPerLevel: 600, 
//       color: '#B9F2FF', 
//       gradient: 'from-indigo-600 via-purple-500 to-violet-500', 
//       glowColor: 'shadow-indigo-500/50',
//       bgGradient: 'from-cyan-50 via-blue-50 to-indigo-50',
//       icon: Gem, 
//       iconColor: 'text-indigo-600',
//       description: 'Masterful dedication'
//     },
    
//     // Master Tier - Royal Purple/Magenta
//     { 
//       tier: 'Master', level: 1, name: 'Master I', minXP: 4800, maxXP: 5799, xpPerLevel: 1000, 
//       color: '#8A2BE2', 
//       gradient: 'from-purple-700 via-violet-600 to-fuchsia-600', 
//       glowColor: 'shadow-purple-500/30',
//       bgGradient: 'from-purple-50 via-violet-50 to-fuchsia-50',
//       icon: Crown, 
//       iconColor: 'text-purple-700',
//       description: 'True mastery'
//     },
//     { 
//       tier: 'Master', level: 2, name: 'Master II', minXP: 5800, maxXP: 6799, xpPerLevel: 1000, 
//       color: '#8A2BE2', 
//       gradient: 'from-violet-700 via-fuchsia-600 to-pink-600', 
//       glowColor: 'shadow-violet-500/40',
//       bgGradient: 'from-purple-50 via-violet-50 to-fuchsia-50',
//       icon: Crown, 
//       iconColor: 'text-violet-700',
//       description: 'Legendary status'
//     },
//     { 
//       tier: 'Master', level: 3, name: 'Master III', minXP: 6800, maxXP: 7799, xpPerLevel: 1000, 
//       color: '#8A2BE2', 
//       gradient: 'from-fuchsia-700 via-pink-600 to-rose-600', 
//       glowColor: 'shadow-fuchsia-500/50',
//       bgGradient: 'from-purple-50 via-violet-50 to-fuchsia-50',
//       icon: Crown, 
//       iconColor: 'text-fuchsia-700',
//       description: 'Ultimate achievement'
//     },
    
//     // Legend Tier - Rainbow/Prismatic
//     { 
//       tier: 'Legend', level: 1, name: 'Legend', minXP: 7800, maxXP: 999999, xpPerLevel: 2000, 
//       color: '#FF4500', 
//       gradient: 'from-red-600 via-orange-500 via-yellow-400 via-green-400 via-blue-500 via-indigo-500 to-purple-600', 
//       glowColor: 'shadow-rainbow',
//       bgGradient: 'from-red-50 via-orange-50 via-yellow-50 via-green-50 via-blue-50 via-indigo-50 to-purple-50',
//       icon: Crown, 
//       iconColor: 'text-transparent bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text',
//       description: 'Beyond legendary'
//     }
//   ];

//   static getRankByXP(xp) {
//     for (let i = this.ranks.length - 1; i >= 0; i--) {
//       if (xp >= this.ranks[i].minXP) {
//         return this.ranks[i];
//       }
//     }
//     return this.ranks[0];
//   }

//   static getNextRank(currentRank) {
//     const currentIndex = this.ranks.findIndex(rank => rank.name === currentRank.name);
//     if (currentIndex < this.ranks.length - 1) {
//       return this.ranks[currentIndex + 1];
//     }
//     return null;
//   }

//   static getXPRewards(tier, action) {
//     const baseRewards = {
//       'task_completed_high': 15,
//       'task_completed_medium': 10,
//       'task_completed_low': 8,
//       'focus_session_completed': 20,
//       'pomodoro_session_completed': 12,
//       'session_started': 3,
//       'daily_streak': 5,
//       'profile_updated': 5
//     };

//     const tierMultipliers = {
//       'Bronze': 1.0,
//       'Silver': 0.8,
//       'Gold': 0.7,
//       'Platinum': 0.6,
//       'Diamond': 0.5,
//       'Master': 0.4,
//       'Legend': 0.3
//     };

//     const baseReward = baseRewards[action] || 5;
//     const multiplier = tierMultipliers[tier] || 1.0;
    
//     return Math.max(1, Math.floor(baseReward * multiplier));
//   }

//   static getProgressToNextRank(xp) {
//     const currentRank = this.getRankByXP(xp);
//     const nextRank = this.getNextRank(currentRank);
    
//     if (!nextRank) {
//       return { progress: 100, xpNeeded: 0, nextRank: null };
//     }

//     const progressInCurrentRank = xp - currentRank.minXP;
//     const xpNeededForNextRank = nextRank.minXP - currentRank.minXP;
//     const progress = (progressInCurrentRank / xpNeededForNextRank) * 100;
//     const xpNeeded = nextRank.minXP - xp;

//     return { progress: Math.min(progress, 100), xpNeeded, nextRank };
//   }
// }

// // Enhanced Data Manager
// class ProfileDataManager {
//   static storageKeys = {
//     userStats: 'user_stats',
//     focusStats: 'focus-sessions-data',
//     pomodoroStats: 'pomodoro-sessions-data',
//     taskAnalytics: 'tasks-analytics-data',
//     userActivities: 'user-activities-data'
//   };

//   static getUserStats(userId) {
//     try {
//       const stats = JSON.parse(localStorage.getItem(this.storageKeys.userStats) || '{}');
//       const dashboardData = this.getDashboardData();
      
//       const userStats = stats[userId] || {
//         totalPoints: 0,
//         joinDate: new Date().toISOString(),
//         lastActive: new Date().toISOString(),
//         achievements: [],
//         badges: [],
//         streakCount: 0,
//         totalFocusTime: 0,
//         totalSessions: 0,
//         tasksCompleted: 0
//       };

//       userStats.totalFocusTime = dashboardData.totalActiveTime || 0;
//       userStats.totalSessions = (dashboardData.totalFocusSessions || 0) + (dashboardData.totalPomodoroSessions || 0);
//       userStats.streakCount = dashboardData.currentStreak || 0;
//       userStats.tasksCompleted = dashboardData.totalTasksCompleted || 0;

//       const currentRank = RankingSystem.getRankByXP(userStats.totalPoints);
//       userStats.rank = currentRank.name;
//       userStats.tier = currentRank.tier;
//       userStats.level = currentRank.level;

//       return userStats;
//     } catch (error) {
//       console.error('Error loading user stats:', error);
//       return {
//         totalPoints: 0,
//         rank: 'Bronze I',
//         tier: 'Bronze',
//         level: 1,
//         joinDate: new Date().toISOString(),
//         lastActive: new Date().toISOString(),
//         achievements: [],
//         badges: [],
//         streakCount: 0,
//         totalFocusTime: 0,
//         totalSessions: 0,
//         tasksCompleted: 0
//       };
//     }
//   }

//   static updateUserStats(userId, updates) {
//     try {
//       const allStats = JSON.parse(localStorage.getItem(this.storageKeys.userStats) || '{}');
//       const currentStats = allStats[userId] || this.getUserStats(userId);
      
//       const updatedStats = {
//         ...currentStats,
//         ...updates,
//         lastActive: new Date().toISOString()
//       };

//       const newRank = RankingSystem.getRankByXP(updatedStats.totalPoints);
//       updatedStats.rank = newRank.name;
//       updatedStats.tier = newRank.tier;
//       updatedStats.level = newRank.level;

//       allStats[userId] = updatedStats;
//       localStorage.setItem(this.storageKeys.userStats, JSON.stringify(allStats));
      
//       return updatedStats;
//     } catch (error) {
//       console.error('Error updating user stats:', error);
//       return this.getUserStats(userId);
//     }
//   }

//   static logActivity(userId, activity) {
//     try {
//       const currentStats = this.getUserStats(userId);
//       const currentRank = RankingSystem.getRankByXP(currentStats.totalPoints);
      
//       const xpReward = RankingSystem.getXPRewards(currentRank.tier, activity.type);
      
//       const updatedStats = this.updateUserStats(userId, {
//         totalPoints: currentStats.totalPoints + xpReward
//       });

//       const newRank = RankingSystem.getRankByXP(updatedStats.totalPoints);
//       const rankUp = newRank.name !== currentRank.name;

//       if (rankUp) {
//         const rankUpBonus = Math.floor(newRank.minXP * 0.1);
//         this.updateUserStats(userId, {
//           totalPoints: updatedStats.totalPoints + rankUpBonus
//         });

//         if (typeof window !== 'undefined') {
//           setTimeout(() => {
//             const notification = document.createElement('div');
//             notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg shadow-lg z-50 animate-bounce';
//             notification.innerHTML = `
//               <div class="flex items-center space-x-2">
//                 <span class="text-2xl">🎉</span>
//                 <div>
//                   <div class="font-bold">Rank Up!</div>
//                   <div class="text-sm">Welcome to ${newRank.name}!</div>
//                   <div class="text-xs">+${rankUpBonus} Bonus XP</div>
//                 </div>
//               </div>
//             `;
//             document.body.appendChild(notification);
//             setTimeout(() => notification.remove(), 5000);
//           }, 500);
//         }
//       }

//       const activities = JSON.parse(localStorage.getItem(this.storageKeys.userActivities) || '[]');
//       const newActivity = {
//         id: Date.now().toString(),
//         userId,
//         timestamp: new Date().toISOString(),
//         date: new Date().toISOString().split('T')[0],
//         points: xpReward,
//         ...activity
//       };

//       activities.unshift(newActivity);
//       localStorage.setItem(this.storageKeys.userActivities, JSON.stringify(activities.slice(0, 100)));

//       return { activity: newActivity, xpReward, rankUp };
//     } catch (error) {
//       console.error('Error logging activity:', error);
//       return { xpReward: 0, rankUp: false };
//     }
//   }

//   static getDashboardData() {
//     try {
//       const focusData = JSON.parse(localStorage.getItem(this.storageKeys.focusStats) || '[]');
//       const pomodoroData = JSON.parse(localStorage.getItem(this.storageKeys.pomodoroStats) || '[]');
//       const taskData = JSON.parse(localStorage.getItem(this.storageKeys.taskAnalytics) || '[]');

//       let totalActiveTime = 0;
//       let totalFocusSessions = 0;
//       let totalPomodoroSessions = 0;
//       let totalTasksCompleted = 0;

//       focusData.forEach(session => {
//         if (session.duration) {
//           totalActiveTime += Math.floor(session.duration / 60);
//         }
//         if (session.completed !== false) {
//           totalFocusSessions += 1;
//         }
//       });

//       pomodoroData.forEach(session => {
//         if (session.duration && session.type === 'work') {
//           totalActiveTime += Math.floor(session.duration / 60);
//         }
//         if (session.completed !== false && session.type === 'work') {
//           totalPomodoroSessions += 1;
//         }
//       });

//       taskData.forEach(activity => {
//         if (activity.type === 'task_completed') {
//           totalTasksCompleted += 1;
//         }
//       });

//       return {
//         totalActiveTime,
//         totalFocusSessions,
//         totalPomodoroSessions,
//         totalTasksCompleted,
//         currentStreak: 0
//       };
//     } catch (error) {
//       console.error('Error getting dashboard data:', error);
//       return {
//         totalActiveTime: 0,
//         totalFocusSessions: 0,
//         totalPomodoroSessions: 0,
//         totalTasksCompleted: 0,
//         currentStreak: 0
//       };
//     }
//   }
// }

// // Enhanced StartTaskModal with Beautiful Design
// function StartTaskModal({ isOpen, onClose, onSelectMode, task, userStats }) {
//   if (!isOpen) return null;
  
//   const handleSelectMode = (mode) => {
//     if (task && userStats) {
//       ProfileDataManager.logActivity(userStats.userId || "user123", {
//         type: 'session_started',
//         sessionType: mode,
//         taskId: task._id,
//         taskTitle: task.title,
//         description: `Started ${mode} session for "${task.title}"`
//       });
//     }
//     onSelectMode(mode, task);
//   };

//   const currentRank = userStats ? RankingSystem.getRankByXP(userStats.totalPoints) : RankingSystem.ranks[0];
//   const focusXP = RankingSystem.getXPRewards(currentRank.tier, 'focus_session_completed');
//   const pomodoroXP = RankingSystem.getXPRewards(currentRank.tier, 'pomodoro_session_completed');
//   const startXP = RankingSystem.getXPRewards(currentRank.tier, 'session_started');

//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <motion.div 
//           initial={{ opacity: 0 }} 
//           animate={{ opacity: 1 }} 
//           exit={{ opacity: 0 }} 
//           className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" 
//           onClick={(e) => e.target === e.currentTarget && onClose()}
//         >
//           <motion.div 
//             initial={{ scale: 0.8, y: 50, opacity: 0 }} 
//             animate={{ scale: 1, y: 0, opacity: 1 }} 
//             exit={{ scale: 0.8, y: 50, opacity: 0 }} 
//             className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative border border-gray-100 overflow-hidden" 
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* Animated Background */}
//             <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-50" />
//             <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10 animate-pulse" />
//             <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-pink-400 to-orange-500 rounded-full opacity-10 animate-pulse delay-1000" />
            
//             <div className="relative z-10">
//               <button 
//                 onClick={onClose} 
//                 className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
//               >
//                 <X className="w-5 h-5" />
//               </button>
              
//               <div className="text-center mb-8">
//                 <motion.div 
//                   className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
//                   animate={{ rotate: [0, 360] }}
//                   transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
//                 >
//                   <Play className="w-10 h-10 text-white" />
//                 </motion.div>
//                 <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
//                   Choose Focus Mode
//                 </h2>
//                 {task && (
//                   <p className="text-gray-600">
//                     Ready to start: <span className="font-semibold text-blue-600">{task.title}</span>
//                   </p>
//                 )}
//               </div>
              
//               <div className="space-y-4">
//                 <motion.button 
//                   whileHover={{ scale: 1.03, y: -2 }} 
//                   whileTap={{ scale: 0.97 }} 
//                   onClick={() => handleSelectMode('focus')} 
//                   className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 text-white font-semibold py-5 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-between relative overflow-hidden group"
//                 >
//                   <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity" />
//                   <div className="flex items-center space-x-3 relative z-10">
//                     <Focus className="w-6 h-6" />
//                     <div className="text-left">
//                       <div className="text-lg">Focus Mode</div>
//                       <div className="text-sm opacity-90">Deep work session</div>
//                     </div>
//                   </div>
//                   <div className="text-right relative z-10">
//                     <div className="text-lg font-bold">+{focusXP} XP</div>
//                     <div className="text-xs opacity-90">on completion</div>
//                   </div>
//                 </motion.button>
                
//                 <motion.button 
//                   whileHover={{ scale: 1.03, y: -2 }} 
//                   whileTap={{ scale: 0.97 }} 
//                   onClick={() => handleSelectMode('pomodoro')} 
//                   className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-semibold py-5 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-between relative overflow-hidden group"
//                 >
//                   <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity" />
//                   <div className="flex items-center space-x-3 relative z-10">
//                     <Timer className="w-6 h-6" />
//                     <div className="text-left">
//                       <div className="text-lg">Pomodoro Technique</div>
//                       <div className="text-sm opacity-90">25 min focused bursts</div>
//                     </div>
//                   </div>
//                   <div className="text-right relative z-10">
//                     <div className="text-lg font-bold">+{pomodoroXP} XP</div>
//                     <div className="text-xs opacity-90">per session</div>
//                   </div>
//                 </motion.button>
//               </div>

//               <motion.div 
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.3 }}
//                 className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200/50"
//               >
//                 <div className="flex items-center justify-center gap-2 text-blue-700">
//                   <Award className="w-5 h-5" />
//                   <span className="font-medium">Instant Reward: +{startXP} XP for starting!</span>
//                 </div>
//                 <div className="text-center text-sm text-blue-600 mt-1">
//                   Current tier: <span className="font-semibold">{currentRank.tier}</span>
//                 </div>
//               </motion.div>
//             </div>
//           </motion.div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }

// // Animation variants
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

// // User Data Hook
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

// // Main Profile Page Component
// export default function ProfilePage() {
//   const { user, isLoaded, isSignedIn } = useUser();
//   const { tasksCompleted, habitStreak, coursesFinished } = useUserData();
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [userStats, setUserStats] = useState(null);
//   const [tasks, setTasks] = useState([]);
//   const [loadingTasks, setLoadingTasks] = useState(true);
//   const [taskFilter, setTaskFilter] = useState('all');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isStartModalOpen, setIsStartModalOpen] = useState(false);
//   const [taskToStart, setTaskToStart] = useState(null);

//   useEffect(() => {
//     if (user) {
//       loadUserStats();
//       loadTasks();
      
//       const interval = setInterval(loadUserStats, 10000);
//       return () => clearInterval(interval);
//     }
//   }, [user]);

//   const loadUserStats = () => {
//     if (!user?.id) return;
//     const stats = ProfileDataManager.getUserStats(user.id);
//     setUserStats(stats);
//   };

//   const loadTasks = async () => {
//     if (!user?.id) return;
//     setLoadingTasks(true);
//     try {
//       const response = await taskApi.getTasks({ userId: "user123" });
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

//   const handleToggleComplete = async (task) => {
//     const newStatus = task.status === 'completed' ? 'pending' : 'completed';
//     const originalStatus = task.status;
    
//     setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    
//     try {
//       await taskApi.updateTask(task._id, { 
//         status: newStatus,
//         progress: { percentage: newStatus === 'completed' ? 100 : task.progress?.percentage || 0 },
//         completedAt: newStatus === 'completed' ? new Date().toISOString() : null
//       });

//       if (newStatus === 'completed') {
//         const actionType = `task_completed_${task.priority}`;
//         const result = ProfileDataManager.logActivity(user.id, {
//           type: actionType,
//           taskId: task._id,
//           taskTitle: task.title,
//           priority: task.priority,
//           description: `Completed ${task.priority} priority task: ${task.title}`
//         });

//         setTimeout(loadUserStats, 500);
//       }
//     } catch (error) {
//       console.error("Failed to update task:", error);
//       setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? { ...t, status: originalStatus } : t));
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

//   const completedTasks = filteredTasks.filter(task => task.status === 'completed');
//   const activeTasks = filteredTasks.filter(task => task.status !== 'completed');

//   if (!isLoaded) { 
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
//         <div className="text-center">
//           <motion.div 
//             animate={{ rotate: 360 }} 
//             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
//             className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
//           />
//           <p className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//             Loading your profile...
//           </p>
//         </div>
//       </div>
//     ); 
//   }
  
//   if (!isSignedIn) { 
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
//         <div className="text-center p-8">
//           <Users className="w-20 h-20 text-gray-400 mx-auto mb-6" />
//           <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
//             Welcome to Focus App!
//           </h2>
//           <p className="text-gray-600 text-lg">Please sign in to view your profile and manage your tasks.</p>
//         </div>
//       </div>
//     ); 
//   }

//   const currentRank = userStats ? RankingSystem.getRankByXP(userStats.totalPoints) : RankingSystem.ranks[0];
//   const rankProgress = userStats ? RankingSystem.getProgressToNextRank(userStats.totalPoints) : { progress: 0, xpNeeded: 100, nextRank: RankingSystem.ranks[1] };
//   const RankIcon = currentRank.icon;

//   const formatTime = (minutes) => {
//     if (minutes < 60) return `${minutes}m`;
//     const hours = Math.floor(minutes / 60);
//     const mins = minutes % 60;
//     return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
//   };

//   return (
//     <>
//       <EditProfileModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
//       <StartTaskModal 
//         isOpen={isStartModalOpen} 
//         onClose={() => setIsStartModalOpen(false)} 
//         task={taskToStart} 
//         userStats={userStats}
//         onSelectMode={(mode) => { 
//           setIsStartModalOpen(false); 
//           console.log(`Selected ${mode} for task: ${taskToStart?.title}`);
//         }} 
//       />

//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
//         {/* Animated Background Elements */}
//         <div className="absolute inset-0 overflow-hidden pointer-events-none">
//           <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10 animate-pulse" />
//           <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-pink-400 to-orange-500 rounded-full opacity-10 animate-pulse delay-1000" />
//           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-5 animate-pulse delay-2000" />
//         </div>

//         <motion.div 
//           className="relative z-10 p-6" 
//           variants={containerVariants} 
//           initial="hidden" 
//           animate="visible"
//         >
//           <div className="max-w-7xl mx-auto space-y-8">
//             {/* Enhanced Header */}
//             <motion.div variants={itemVariants} className="text-center py-12">
//               <motion.div
//                 initial={{ scale: 0.8, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 transition={{ duration: 0.8 }}
//                 className="relative"
//               >
//                 <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent flex items-center justify-center gap-4 mb-6">
//                   <motion.div
//                     animate={{ rotate: [0, 360] }}
//                     transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
//                   >
//                     <Sparkles className="w-12 h-12 text-blue-500" />
//                   </motion.div>
//                   My Profile
//                   <motion.div
//                     animate={{ rotate: [360, 0] }}
//                     transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
//                   >
//                     <Star className="w-12 h-12 text-purple-500" />
//                   </motion.div>
//                 </h1>
//                 <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
//                   Track your journey, showcase your achievements, and level up your productivity in style!
//                 </p>
//               </motion.div>
//             </motion.div>

//             <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
//               {/* Enhanced Profile Card with Beautiful Rank Display */}
//               <motion.div className="xl:col-span-1" variants={itemVariants}>
//                 <Card className={`bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden h-full border-0 ${currentRank.glowColor} hover:shadow-3xl transition-all duration-500`}>
//                   <div className={`bg-gradient-to-br ${currentRank.gradient} p-8 text-white relative overflow-hidden`}>
//                     {/* Animated Background Pattern */}
//                     <div className="absolute inset-0 opacity-20">
//                       <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full bg-white animate-pulse" />
//                       <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white animate-pulse delay-1000" />
//                       <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-white animate-pulse delay-2000" />
//                     </div>
                    
//                     <div className="relative z-10">
//                       <motion.div 
//                         className="flex justify-between items-start mb-8"
//                         initial={{ y: -20, opacity: 0 }}
//                         animate={{ y: 0, opacity: 1 }}
//                         transition={{ delay: 0.3 }}
//                       >
//                         <motion.div
//                           whileHover={{ scale: 1.1, rotate: 15 }}
//                           transition={{ type: "spring", stiffness: 300 }}
//                         >
//                           <RankIcon className={`w-10 h-10 ${currentRank.iconColor} drop-shadow-lg`} />
//                         </motion.div>
//                         <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm font-bold backdrop-blur-sm">
//                           {currentRank.tier} {currentRank.level}
//                         </Badge>
//                       </motion.div>
                      
//                       <div className="text-center">
//                         <motion.div
//                           whileHover={{ scale: 1.05 }}
//                           transition={{ type: "spring", stiffness: 300 }}
//                           className="mb-6"
//                         >
//                           <Avatar className="h-36 w-36 mb-4 ring-4 ring-white/50 ring-offset-4 ring-offset-transparent mx-auto shadow-2xl">
//                             <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
//                             <AvatarFallback className="text-4xl bg-white/20 backdrop-blur text-white border-2 border-white/30">
//                               {user.fullName?.charAt(0) || user.primaryEmailAddress?.emailAddress?.charAt(0)}
//                             </AvatarFallback>
//                           </Avatar>
//                         </motion.div>
                        
//                         <motion.div
//                           initial={{ scale: 0 }}
//                           animate={{ scale: 1 }}
//                           transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
//                         >
//                           <Badge 
//                             className="bg-white/20 text-white border-white/30 px-6 py-2 rounded-full shadow-lg mb-4 text-lg font-bold backdrop-blur-sm"
//                             style={{ backgroundColor: `${currentRank.color}40` }}
//                           >
//                             {currentRank.name}
//                           </Badge>
//                         </motion.div>
                        
//                         <h2 className="text-4xl font-bold mb-2 drop-shadow-sm">
//                           {user.fullName || 'New User'}
//                         </h2>
//                         <p className="text-white/90 text-base mb-6">
//                           {user.primaryEmailAddress?.emailAddress}
//                         </p>
//                         <p className="text-white/80 text-sm italic mb-6">
//                           {currentRank.description}
//                         </p>
                        
//                         <div className="mt-8">
//                           <div className="flex justify-between items-center mb-3">
//                             <span className="text-sm text-white/90 font-medium">
//                               {rankProgress.nextRank ? `Progress to ${rankProgress.nextRank.name}` : 'Maximum Rank Achieved! 🏆'}
//                             </span>
//                             <span className="text-lg font-bold text-white drop-shadow-sm">
//                               {Math.round(rankProgress.progress)}%
//                             </span>
//                           </div>
//                           <Progress 
//                             value={rankProgress.progress} 
//                             className="h-3 bg-white/20 rounded-full overflow-hidden" 
//                           />
//                           {rankProgress.nextRank && (
//                             <p className="text-sm text-white/80 mt-2 font-medium">
//                               {rankProgress.xpNeeded} XP needed for promotion
//                             </p>
//                           )}
//                         </div>
                        
//                         <div className="grid grid-cols-2 gap-6 mt-8 pt-8 border-t border-white/30">
//                           <motion.div 
//                             className="text-center"
//                             whileHover={{ scale: 1.05 }}
//                           >
//                             <Star className="w-6 h-6 mx-auto mb-2 text-yellow-300 drop-shadow-sm" />
//                             <div className="text-3xl font-bold drop-shadow-sm">{userStats?.totalPoints || 0}</div>
//                             <div className="text-sm text-white/90 font-medium">Total XP</div>
//                           </motion.div>
//                           <motion.div 
//                             className="text-center"
//                             whileHover={{ scale: 1.05 }}
//                           >
//                             <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-200 drop-shadow-sm" />
//                             <div className="text-lg font-semibold drop-shadow-sm">
//                               {userStats?.joinDate ? new Date(userStats.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
//                             </div>
//                             <div className="text-sm text-white/90 font-medium">Joined</div>
//                           </motion.div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
                  
//                   <CardContent className="p-8 bg-gradient-to-b from-white to-gray-50">
//                     <Button 
//                       onClick={() => setIsEditModalOpen(true)} 
//                       className="w-full mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all rounded-2xl h-14 text-lg font-semibold"
//                     >
//                       <Edit className="w-5 h-5 mr-3" />
//                       Edit Profile
//                     </Button>
                    
//                     <Separator className="my-8" />

//                     {/* Enhanced XP Earning Guide */}
//                     <div className="space-y-6">
//                       <h4 className="font-bold text-gray-800 flex items-center gap-3 text-lg">
//                         <Award className="w-6 h-6 text-yellow-500" />
//                         XP Rewards ({currentRank.tier} Tier)
//                       </h4>
//                       <div className="space-y-3">
//                         {[
//                           { action: 'Complete high priority task', xp: RankingSystem.getXPRewards(currentRank.tier, 'task_completed_high'), icon: Target, color: 'text-red-500', bg: 'bg-red-50' },
//                           { action: 'Complete medium priority task', xp: RankingSystem.getXPRewards(currentRank.tier, 'task_completed_medium'), icon: CheckSquare, color: 'text-yellow-500', bg: 'bg-yellow-50' },
//                           { action: 'Complete low priority task', xp: RankingSystem.getXPRewards(currentRank.tier, 'task_completed_low'), icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
//                           { action: 'Finish focus session', xp: RankingSystem.getXPRewards(currentRank.tier, 'focus_session_completed'), icon: Focus, color: 'text-purple-500', bg: 'bg-purple-50' },
//                           { action: 'Complete pomodoro', xp: RankingSystem.getXPRewards(currentRank.tier, 'pomodoro_session_completed'), icon: Timer, color: 'text-green-500', bg: 'bg-green-50' }
//                         ].map((item, index) => (
//                           <motion.div 
//                             key={index}
//                             whileHover={{ scale: 1.02, x: 8 }}
//                             className={`flex items-center justify-between p-4 rounded-xl ${item.bg} hover:shadow-md transition-all duration-200 border border-gray-100`}
//                           >
//                             <div className="flex items-center gap-3">
//                               <item.icon className={`w-5 h-5 ${item.color}`} />
//                               <span className="text-sm font-medium text-gray-700">{item.action}</span>
//                             </div>
//                             <span className="text-sm font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
//                               +{item.xp} XP
//                             </span>
//                           </motion.div>
//                         ))}
//                       </div>

//                       {/* Tier Progression Info */}
//                       <motion.div 
//                         initial={{ opacity: 0, y: 20 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ delay: 0.8 }}
//                         className={`mt-6 p-4 ${currentRank.bgGradient} rounded-2xl border-2 border-opacity-20`}
//                         style={{ borderColor: currentRank.color }}
//                       >
//                         <div className="text-center">
//                           <h5 className="font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
//                             <Hexagon className="w-5 h-5" style={{ color: currentRank.color }} />
//                             Tier Progression System
//                           </h5>
//                           <div className="text-sm text-gray-700 space-y-1">
//                             <p><span className="font-semibold">Bronze:</span> 100 XP per level (Full rewards)</p>
//                             <p><span className="font-semibold">Silver:</span> 200 XP per level (80% rewards)</p>
//                             <p><span className="font-semibold">Gold:</span> 300 XP per level (70% rewards)</p>
//                             <p className="text-xs text-gray-600 mt-2 italic">
//                               Higher tiers = Greater challenges = Epic rewards! 🚀
//                             </p>
//                           </div>
//                         </div>
//                       </motion.div>
//                     </div>
                    
//                     <Separator className="my-8" />
                    
//                     <div className="space-y-4">
//                       {/* Profile Information Cards */}
//                       {[
//                         { key: 'primaryGoal', icon: Target, label: 'Primary Goal', color: 'text-blue-600', bg: 'bg-blue-50' },
//                         { key: 'bio', icon: FileText, label: 'Bio', color: 'text-purple-600', bg: 'bg-purple-50' },
//                         { key: 'jobTitle', icon: Briefcase, label: 'Job Title', color: 'text-green-600', bg: 'bg-green-50' },
//                         { key: 'location', icon: MapPin, label: 'Location', color: 'text-red-600', bg: 'bg-red-50' },
//                         { key: 'skills', icon: Star, label: 'Skills', color: 'text-yellow-600', bg: 'bg-yellow-50' },
//                         { key: 'interests', icon: Heart, label: 'Interests', color: 'text-pink-600', bg: 'bg-pink-50' }
//                       ].map(({ key, icon: Icon, label, color, bg }) => {
//                         const value = user.unsafeMetadata?.[key];
//                         return value ? (
//                           <motion.div 
//                             key={key}
//                             whileHover={{ scale: 1.02, x: 6 }}
//                             className={`flex items-start gap-4 p-4 rounded-xl ${bg} hover:shadow-md transition-all duration-200 border border-gray-100`}
//                           >
//                             <Icon className={`w-6 h-6 ${color} mt-0.5 flex-shrink-0`} />
//                             <div className="min-w-0 flex-1">
//                               <p className="font-semibold text-gray-800 text-sm mb-1">{label}</p>
//                               <p className="text-gray-600 text-sm break-words leading-relaxed">{value}</p>
//                             </div>
//                           </motion.div>
//                         ) : null;
//                       })}
                      
//                       {!user.unsafeMetadata?.primaryGoal && (
//                         <motion.div 
//                           whileHover={{ scale: 1.02 }}
//                           className="text-center p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-gradient-to-br from-gray-50 to-white hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
//                         >
//                           <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                           <Button 
//                             variant="ghost" 
//                             onClick={() => setIsEditModalOpen(true)}
//                             className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold text-base px-6 py-3 rounded-xl"
//                           >
//                             Set Your Goals & Info
//                           </Button>
//                         </motion.div>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>

//               <div className="xl:col-span-3 space-y-8">
//                 {/* Enhanced Statistics Card */}
//                 <motion.div variants={itemVariants}>
//                   <Card className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border-0 hover:shadow-3xl transition-all duration-500">
//                     <CardHeader className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b border-gray-100 p-8">
//                       <CardTitle className="flex items-center gap-4 text-gray-800 text-3xl font-bold">
//                         <TrendingUp className="w-8 h-8 text-blue-600" />
//                         Your Statistics
//                       </CardTitle>
//                       <CardDescription className="text-gray-600 text-lg">
//                         Track your progress and celebrate your achievements in real-time
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent className="p-8">
//                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//                         {[
//                           { 
//                             icon: CheckSquare, 
//                             value: userStats?.tasksCompleted || taskStats.completed, 
//                             label: 'Tasks Completed', 
//                             color: 'text-emerald-500', 
//                             bg: 'from-emerald-50 to-emerald-100',
//                             border: 'border-emerald-200',
//                             shadow: 'shadow-emerald-500/20'
//                           },
//                           { 
//                             icon: Flame, 
//                             value: `${userStats?.streakCount || habitStreak.count} Days`, 
//                             label: 'Current Streak', 
//                             color: 'text-orange-500', 
//                             bg: 'from-orange-50 to-orange-100',
//                             border: 'border-orange-200',
//                             shadow: 'shadow-orange-500/20'
//                           },
//                           { 
//                             icon: Activity, 
//                             value: taskStats.inProgress, 
//                             label: 'In Progress', 
//                             color: 'text-blue-500', 
//                             bg: 'from-blue-50 to-blue-100',
//                             border: 'border-blue-200',
//                             shadow: 'shadow-blue-500/20'
//                           },
//                           { 
//                             icon: Clock, 
//                             value: formatTime(userStats?.totalFocusTime || 0), 
//                             label: 'Focus Time', 
//                             color: 'text-purple-500', 
//                             bg: 'from-purple-50 to-purple-100',
//                             border: 'border-purple-200',
//                             shadow: 'shadow-purple-500/20'
//                           }
//                         ].map((stat, index) => (
//                           <motion.div 
//                             key={stat.label}
//                             className={`p-6 rounded-2xl bg-gradient-to-br ${stat.bg} border-2 ${stat.border} ${stat.shadow} text-center group hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer`}
//                             whileHover={{ y: -8 }}
//                             initial={{ opacity: 0, y: 20 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             transition={{ delay: index * 0.1 }}
//                           >
//                             <stat.icon className={`w-12 h-12 mx-auto mb-4 ${stat.color} group-hover:scale-110 transition-transform duration-300`} />
//                             <p className="text-4xl font-bold text-gray-800 mb-2">{stat.value}</p>
//                             <p className="text-sm text-gray-600 font-semibold">{stat.label}</p>
//                           </motion.div>
//                         ))}
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </motion.div>

//                 {/* Enhanced Tasks Sections */}
//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                   {/* Active Tasks */}
//                   <motion.div variants={itemVariants}>
//                     <Card className="bg-white/90 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden border-0 hover:shadow-2xl transition-all duration-500 h-full">
//                       <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
//                         <div className="flex items-center justify-between">
//                           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
//                             <Play className="w-6 h-6 text-blue-600" />
//                             Active Tasks
//                           </h2>
//                           <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 text-sm font-semibold">
//                             {activeTasks.length} tasks
//                           </Badge>
//                         </div>
//                       </CardHeader>
//                       <CardContent className="p-6">
//                         {loadingTasks ? (
//                           <div className="flex justify-center items-center h-40">
//                             <motion.div 
//                               animate={{ rotate: 360 }} 
//                               transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//                               className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
//                             />
//                           </div>
//                         ) : activeTasks.length > 0 ? (
//                           <ul className="space-y-4">
//                             {activeTasks.slice(0, 5).map((task, index) => {
//                               const xpReward = RankingSystem.getXPRewards(currentRank.tier, `task_completed_${task.priority}`);
//                               return (
//                                 <motion.li 
//                                   key={task._id || index} 
//                                   initial={{ opacity: 0, x: -20 }}
//                                   animate={{ opacity: 1, x: 0 }}
//                                   transition={{ delay: index * 0.1 }}
//                                   className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group border border-gray-100 hover:border-blue-200 hover:shadow-md"
//                                 >
//                                   <motion.button
//                                     whileHover={{ scale: 1.1 }}
//                                     whileTap={{ scale: 0.95 }}
//                                     onClick={() => handleToggleComplete(task)}
//                                     className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 flex-shrink-0 transition-all duration-200"
//                                   />
//                                   <div className="flex-1 min-w-0">
//                                     <p className="font-semibold text-gray-800 truncate text-lg">{task.title}</p>
//                                     <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
//                                       <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                                         task.priority === 'high' ? 'bg-red-100 text-red-700' :
//                                         task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
//                                         'bg-blue-100 text-blue-700'
//                                       }`}>
//                                         {task.priority}
//                                       </span>
//                                       <span className="text-gray-400">•</span>
//                                       <span className="font-medium">{task.category}</span>
//                                       <span className="text-gray-400">•</span>
//                                       <span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded-full text-xs">
//                                         +{xpReward} XP
//                                       </span>
//                                     </div>
//                                   </div>
//                                   <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
//                                     <motion.button
//                                       whileHover={{ scale: 1.1 }}
//                                       whileTap={{ scale: 0.95 }}
//                                       onClick={() => handleShowStartModal(task)}
//                                       className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                                       title="Start Task"
//                                     >
//                                       <Play className="w-5 h-5" />
//                                     </motion.button>
//                                     <motion.button
//                                       whileHover={{ scale: 1.1 }}
//                                       whileTap={{ scale: 0.95 }}
//                                       onClick={() => handleEditTask(task)}
//                                       className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
//                                       title="Edit Task"
//                                     >
//                                       <Edit className="w-5 h-5" />
//                                     </motion.button>
//                                     <motion.button
//                                       whileHover={{ scale: 1.1 }}
//                                       whileTap={{ scale: 0.95 }}
//                                       onClick={() => handleDeleteTask(task._id)}
//                                       className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                                       title="Delete Task"
//                                     >
//                                       <Trash2 className="w-5 h-5" />
//                                     </motion.button>
//                                   </div>
//                                 </motion.li>
//                               );
//                             })}
//                           </ul>
//                         ) : (
//                           <div className="text-center py-12 text-gray-500">
//                             <CheckSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
//                             <p className="text-xl font-medium mb-2">No active tasks</p>
//                             <p className="text-sm">Create a new task to get started on your productivity journey!</p>
//                           </div>
//                         )}
//                       </CardContent>
//                     </Card>
//                   </motion.div>

//                   {/* Recently Completed Tasks */}
//                   <motion.div variants={itemVariants}>
//                     <Card className="bg-white/90 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden border-0 hover:shadow-2xl transition-all duration-500 h-full">
//                       <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 p-6">
//                         <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
//                           <CircleCheck className="w-6 h-6 text-green-600" />
//                           Recently Completed
//                         </h2>
//                       </CardHeader>
//                       <CardContent className="p-6">
//                         {completedTasks.length > 0 ? (
//                           <ul className="space-y-4">
//                             {completedTasks.slice(0, 5).map((task, index) => {
//                               const xpEarned = RankingSystem.getXPRewards(currentRank.tier, `task_completed_${task.priority}`);
//                               return (
//                                 <motion.li 
//                                   key={task._id || index} 
//                                   initial={{ opacity: 0, x: 20 }}
//                                   animate={{ opacity: 1, x: 0 }}
//                                   transition={{ delay: index * 0.1 }}
//                                   className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 border border-gray-100 hover:border-green-200 hover:shadow-md"
//                                 >
//                                   <CircleCheck className="w-8 h-8 text-green-500 flex-shrink-0" />
//                                   <div className="flex-1 min-w-0">
//                                     <p className="font-semibold text-gray-800 truncate text-lg">{task.title}</p>
//                                     <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
//                                       <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                                         task.priority === 'high' ? 'bg-red-100 text-red-700' :
//                                         task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
//                                         'bg-blue-100 text-blue-700'
//                                       }`}>
//                                         {task.priority}
//                                       </span>
//                                       <span className="text-gray-400">•</span>
//                                       <span className="font-medium">{task.category}</span>
//                                       <span className="text-gray-400">•</span>
//                                       <span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded-full text-xs">
//                                         +{xpEarned} XP earned
//                                       </span>
//                                     </div>
//                                   </div>
//                                   <p className="text-sm text-gray-400 flex-shrink-0 text-right">
//                                     <span className="block font-medium">
//                                       {task.completedAt 
//                                         ? format(new Date(task.completedAt), 'MMM dd')
//                                         : format(new Date(task.updatedAt), 'MMM dd')
//                                       }
//                                     </span>
//                                     <span className="block text-xs">
//                                       {task.completedAt 
//                                         ? format(new Date(task.completedAt), 'h:mm a')
//                                         : format(new Date(task.updatedAt), 'h:mm a')
//                                       }
//                                     </span>
//                                   </p>
//                                 </motion.li>
//                               );
//                             })}
//                           </ul>
//                         ) : (
//                           <div className="text-center py-12 text-gray-500">
//                             <CircleCheck className="w-16 h-16 mx-auto mb-4 opacity-50" />
//                             <p className="text-xl font-medium mb-2">No completed tasks yet</p>
//                             <p className="text-sm">Complete tasks to see your achievements and earn XP!</p>
//                           </div>
//                         )}
//                       </CardContent>
//                     </Card>
//                   </motion.div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </motion.div>
//       </div>
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
// //   Briefcase, Globe, Heart, Sparkles, Clock, Zap, Play, Trash2, Loader2, X, Focus, Timer, Check, Filter, Search, Award, Users, TrendingDown, ChevronDown, CircleCheck, Plus
// // } from "lucide-react";
// // import { format } from 'date-fns';
// // import EditProfileModal from './EditProfileModal';
// // import { taskApi } from '@/backend/lib/api';

// // // ------ Enhanced StartTaskModal Component ------
// // function StartTaskModal({ isOpen, onClose, onSelectMode, task }) {
// //   if (!isOpen) return null;
  
// //   return (
// //     <AnimatePresence>
// //       {isOpen && (
// //         <motion.div 
// //           initial={{ opacity: 0 }} 
// //           animate={{ opacity: 1 }} 
// //           exit={{ opacity: 0 }} 
// //           className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm" 
// //           onClick={onClose}
// //         >
// //           <motion.div 
// //             initial={{ scale: 0.9, y: 50, opacity: 0 }} 
// //             animate={{ scale: 1, y: 0, opacity: 1 }} 
// //             exit={{ scale: 0.9, y: 50, opacity: 0 }} 
// //             className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative border border-gray-100" 
// //             onClick={(e) => e.stopPropagation()}
// //           >
// //             <button 
// //               onClick={onClose} 
// //               className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
// //             >
// //               <X className="w-5 h-5" />
// //             </button>
            
// //             <div className="text-center mb-8">
// //               <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
// //                 <Play className="w-8 h-8 text-white" />
// //               </div>
// //               <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Focus Mode</h2>
// //               {task && (
// //                 <p className="text-gray-600">
// //                   Ready to start: <span className="font-semibold text-blue-600">{task.title}</span>
// //                 </p>
// //               )}
// //             </div>
            
// //             <div className="space-y-3">
// //               <motion.button 
// //                 whileHover={{ scale: 1.02, y: -2 }} 
// //                 whileTap={{ scale: 0.98 }} 
// //                 onClick={() => onSelectMode('focus')} 
// //                 className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-3"
// //               >
// //                 <Focus className="w-5 h-5" />
// //                 <div className="text-left">
// //                   <div>Focus Mode</div>
// //                   <div className="text-xs opacity-90">Deep work session</div>
// //                 </div>
// //               </motion.button>
              
// //               <motion.button 
// //                 whileHover={{ scale: 1.02, y: -2 }} 
// //                 whileTap={{ scale: 0.98 }} 
// //                 onClick={() => onSelectMode('pomodoro')} 
// //                 className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-3"
// //               >
// //                 <Timer className="w-5 h-5" />
// //                 <div className="text-left">
// //                   <div>Pomodoro Technique</div>
// //                   <div className="text-xs opacity-90">25 min focused bursts</div>
// //                 </div>
// //               </motion.button>
// //             </div>
// //           </motion.div>
// //         </motion.div>
// //       )}
// //     </AnimatePresence>
// //   );
// // }

// // // ------ Enhanced Animation Variants ------
// // const containerVariants = { 
// //   hidden: { opacity: 0, y: 20 }, 
// //   visible: { 
// //     opacity: 1, 
// //     y: 0,
// //     transition: { 
// //       duration: 0.6,
// //       staggerChildren: 0.1,
// //       ease: "easeOut"
// //     } 
// //   } 
// // };

// // const itemVariants = { 
// //   hidden: { y: 30, opacity: 0 }, 
// //   visible: { 
// //     y: 0, 
// //     opacity: 1,
// //     transition: {
// //       duration: 0.5,
// //       ease: "easeOut"
// //     }
// //   } 
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
// //   const [taskFilter, setTaskFilter] = useState('all');
// //   const [searchQuery, setSearchQuery] = useState('');
  
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
// //       const response = await taskApi.getTasks({ userId: "user123" }); // Using same userId as your other components
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
// //     console.log(`User gained ${amount} XP. New total: ${userStats.totalPoints + amount}`);
// //   };

// //   const handleToggleComplete = async (task) => {
// //     const newStatus = task.status === 'completed' ? 'pending' : 'completed';
// //     setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
// //     try {
// //       await taskApi.updateTask(task._id, { 
// //         status: newStatus,
// //         progress: { percentage: newStatus === 'completed' ? 100 : task.progress?.percentage || 0 },
// //         completedAt: newStatus === 'completed' ? new Date().toISOString() : null
// //       });
// //     } catch (error) {
// //       console.error("Failed to update task:", error);
// //       setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? { ...t, status: task.status } : t));
// //     }
// //   };
  
// //   const handleDeleteTask = async (taskId) => {
// //     if (!confirm('Are you sure you want to delete this task?')) return;
    
// //     const originalTasks = tasks;
// //     setTasks(prevTasks => prevTasks.filter(t => t._id !== taskId));
// //     try {
// //       await taskApi.deleteTask(taskId);
// //     } catch (error) {
// //       console.error("Failed to delete task:", error);
// //       setTasks(originalTasks);
// //     }
// //   };
  
// //   const handleEditTask = (task) => {
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
  
// //   const getRankInfo = (rank) => {
// //     const rankData = { 
// //       'Beginner': { color: 'bg-gray-500', gradient: 'from-gray-400 to-gray-600' },
// //       'Intermediate': { color: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600' },
// //       'Advanced': { color: 'bg-purple-500', gradient: 'from-purple-400 to-purple-600' },
// //       'Expert': { color: 'bg-yellow-500', gradient: 'from-yellow-400 to-yellow-600' },
// //       'Master': { color: 'bg-red-500', gradient: 'from-red-400 to-red-600' }
// //     };
// //     return rankData[rank] || rankData['Beginner'];
// //   };
  
// //   const getNextRankProgress = (points) => {
// //     if (points < 100) return (points / 100) * 100;
// //     if (points < 500) return ((points - 100) / 400) * 100;
// //     if (points < 1000) return ((points - 500) / 500) * 100;
// //     if (points < 2000) return ((points - 1000) / 1000) * 100;
// //     return 100;
// //   };

// //   // Filter and search tasks
// //   const filteredTasks = tasks.filter(task => {
// //     const matchesFilter = taskFilter === 'all' || task.status === taskFilter;
// //     const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //                          task.description?.toLowerCase().includes(searchQuery.toLowerCase());
// //     return matchesFilter && matchesSearch;
// //   });

// //   const taskStats = {
// //     total: tasks.length,
// //     completed: tasks.filter(t => t.status === 'completed').length,
// //     inProgress: tasks.filter(t => t.status === 'in-progress').length,
// //     pending: tasks.filter(t => t.status === 'pending').length
// //   };

// //   // Separate tasks by status for different sections
// //   const completedTasks = filteredTasks.filter(task => task.status === 'completed');
// //   const activeTasks = filteredTasks.filter(task => task.status !== 'completed');

// //   if (!isLoaded) { 
// //     return (
// //       <div className="flex items-center justify-center h-screen">
// //         <div className="text-center">
// //           <motion.div
// //             animate={{ rotate: 360 }}
// //             transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
// //           >
// //             <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
// //           </motion.div>
// //           <p className="text-blue-600 font-medium">Loading your profile...</p>
// //         </div>
// //       </div>
// //     ); 
// //   }
  
// //   if (!isSignedIn) { 
// //     return (
// //       <div className="flex items-center justify-center h-screen">
// //         <div className="text-center">
// //           <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
// //           <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Spark!</h2>
// //           <p className="text-gray-600">Please sign in to view your profile and manage your tasks.</p>
// //         </div>
// //       </div>
// //     ); 
// //   }

// //   const rankInfo = getRankInfo(userStats.rank);

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
// //         }} 
// //       />

// //       <motion.div 
// //         className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6" 
// //         variants={containerVariants} 
// //         initial="hidden" 
// //         animate="visible"
// //       >
// //         <div className="max-w-7xl mx-auto space-y-8">
// //           {/* Enhanced Header */}
// //           <motion.div variants={itemVariants} className="text-center py-8">
// //             <motion.div
// //               initial={{ scale: 0.8, opacity: 0 }}
// //               animate={{ scale: 1, opacity: 1 }}
// //               transition={{ duration: 0.6 }}
// //             >
// //               <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent flex items-center justify-center gap-3">
// //                 <Sparkles className="w-10 h-10 text-blue-500" />
// //                 My Profile
// //               </h1>
// //               <p className="text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
// //                 Track your journey, showcase your achievements, and level up your productivity!
// //               </p>
// //             </motion.div>
// //           </motion.div>

// //           <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
// //             {/* Enhanced Profile Card */}
// //             <motion.div className="xl:col-span-1" variants={itemVariants}>
// //               <Card className="bg-white/95 backdrop-blur shadow-2xl rounded-3xl overflow-hidden h-full border-0">
// //                 <div className={`bg-gradient-to-br ${rankInfo.gradient} p-8 text-white relative overflow-hidden`}>
// //                   {/* Background Pattern */}
// //                   <div className="absolute inset-0 opacity-10">
// //                     <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white"></div>
// //                     <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white"></div>
// //                   </div>
                  
// //                   <div className="relative z-10">
// //                     <motion.div 
// //                       className="flex justify-between items-start mb-6"
// //                       initial={{ y: -20, opacity: 0 }}
// //                       animate={{ y: 0, opacity: 1 }}
// //                       transition={{ delay: 0.3 }}
// //                     >
// //                       <Trophy className="w-8 h-8 text-yellow-300" />
// //                       <Badge className="bg-white/20 text-white border-white/30">
// //                         Level {Math.floor(userStats.totalPoints / 100) + 1}
// //                       </Badge>
// //                     </motion.div>
                    
// //                     <div className="text-center">
// //                       <motion.div
// //                         whileHover={{ scale: 1.05 }}
// //                         transition={{ type: "spring", stiffness: 300 }}
// //                       >
// //                         <Avatar className="h-32 w-32 mb-4 ring-4 ring-white/50 ring-offset-4 ring-offset-transparent mx-auto shadow-2xl">
// //                           <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
// //                           <AvatarFallback className="text-3xl bg-white/20 backdrop-blur text-white border-2 border-white/30">
// //                             {user.fullName?.charAt(0) || user.primaryEmailAddress?.emailAddress?.charAt(0)}
// //                           </AvatarFallback>
// //                         </Avatar>
// //                       </motion.div>
                      
// //                       <Badge className="bg-white/20 text-white border-white/30 px-4 py-1 rounded-full shadow-md mb-4">
// //                         {userStats.rank}
// //                       </Badge>
                      
// //                       <h2 className="text-3xl font-bold mb-2">
// //                         {user.fullName || 'New User'}
// //                       </h2>
// //                       <p className="text-white/80 text-sm">
// //                         {user.primaryEmailAddress?.emailAddress}
// //                       </p>
                      
// //                       <div className="mt-6">
// //                         <div className="flex justify-between items-center mb-2">
// //                           <span className="text-sm text-white/80">Next Rank Progress</span>
// //                           <span className="text-sm font-bold">{Math.round(getNextRankProgress(userStats.totalPoints))}%</span>
// //                         </div>
// //                         <Progress value={getNextRankProgress(userStats.totalPoints)} className="h-2 bg-white/20" />
// //                       </div>
                      
// //                       <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20">
// //                         <div className="text-center">
// //                           <Star className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
// //                           <div className="text-2xl font-bold">{userStats.totalPoints}</div>
// //                           <div className="text-xs text-white/80">Total XP</div>
// //                         </div>
// //                         <div className="text-center">
// //                           <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-200" />
// //                           <div className="text-sm font-semibold">
// //                             {userStats.joinDate ? new Date(userStats.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
// //                           </div>
// //                           <div className="text-xs text-white/80">Joined</div>
// //                         </div>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 </div>
                
// //                 <CardContent className="p-6">
// //                   <Button 
// //                     onClick={() => setIsEditModalOpen(true)} 
// //                     className="w-full mb-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all rounded-xl h-12"
// //                   >
// //                     <Edit className="w-4 h-4 mr-2" />
// //                     Edit Profile
// //                   </Button>
                  
// //                   <Separator className="my-6" />
                  
// //                   <div className="space-y-4">
// //                     {/* Profile Information Cards */}
// //                     {[
// //                       { key: 'primaryGoal', icon: Target, label: 'Primary Goal', color: 'text-blue-600' },
// //                       { key: 'bio', icon: FileText, label: 'Bio', color: 'text-purple-600' },
// //                       { key: 'jobTitle', icon: Briefcase, label: 'Job Title', color: 'text-green-600' },
// //                       { key: 'location', icon: MapPin, label: 'Location', color: 'text-red-600' },
// //                       { key: 'skills', icon: Star, label: 'Skills', color: 'text-yellow-600' },
// //                       { key: 'interests', icon: Heart, label: 'Interests', color: 'text-pink-600' }
// //                     ].map(({ key, icon: Icon, label, color }) => {
// //                       const value = user.unsafeMetadata?.[key];
// //                       return value ? (
// //                         <motion.div 
// //                           key={key}
// //                           whileHover={{ scale: 1.02, x: 4 }}
// //                           className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
// //                         >
// //                           <Icon className={`w-5 h-5 ${color} mt-0.5 flex-shrink-0`} />
// //                           <div className="min-w-0 flex-1">
// //                             <p className="font-semibold text-gray-800 text-sm">{label}</p>
// //                             <p className="text-gray-600 text-sm break-words">{value}</p>
// //                           </div>
// //                         </motion.div>
// //                       ) : null;
// //                     })}
                    
// //                     {!user.unsafeMetadata?.primaryGoal && (
// //                       <motion.div 
// //                         whileHover={{ scale: 1.02 }}
// //                         className="text-center p-4 border-2 border-dashed border-gray-300 rounded-xl"
// //                       >
// //                         <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
// //                         <Button 
// //                           variant="ghost" 
// //                           onClick={() => setIsEditModalOpen(true)}
// //                           className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
// //                         >
// //                           Set Your Goals & Info
// //                         </Button>
// //                       </motion.div>
// //                     )}
// //                   </div>
// //                 </CardContent>
// //               </Card>
// //             </motion.div>

// //             <div className="xl:col-span-3 space-y-8">
// //               {/* Enhanced Statistics Card */}
// //               <motion.div variants={itemVariants}>
// //                 <Card className="bg-white shadow-xl rounded-3xl overflow-hidden border-0">
// //                   <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
// //                     <CardTitle className="flex items-center gap-3 text-blue-900 text-2xl">
// //                       <TrendingUp className="w-7 h-7 text-blue-600" />
// //                       Your Statistics
// //                     </CardTitle>
// //                     <CardDescription className="text-gray-600 text-base">
// //                       Track your progress and celebrate your achievements
// //                     </CardDescription>
// //                   </CardHeader>
// //                   <CardContent className="p-8">
// //                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
// //                       {[
// //                         { 
// //                           icon: CheckSquare, 
// //                           value: taskStats.completed, 
// //                           label: 'Tasks Completed', 
// //                           color: 'text-emerald-500', 
// //                           bg: 'from-emerald-50 to-emerald-100',
// //                           border: 'border-emerald-200'
// //                         },
// //                         { 
// //                           icon: Flame, 
// //                           value: `${habitStreak.count} Days`, 
// //                           label: 'Current Streak', 
// //                           color: 'text-orange-500', 
// //                           bg: 'from-orange-50 to-orange-100',
// //                           border: 'border-orange-200'
// //                         },
// //                         { 
// //                           icon: Activity, 
// //                           value: taskStats.inProgress, 
// //                           label: 'In Progress', 
// //                           color: 'text-blue-500', 
// //                           bg: 'from-blue-50 to-blue-100',
// //                           border: 'border-blue-200'
// //                         },
// //                         { 
// //                           icon: BookOpen, 
// //                           value: coursesFinished, 
// //                           label: 'Courses Finished', 
// //                           color: 'text-purple-500', 
// //                           bg: 'from-purple-50 to-purple-100',
// //                           border: 'border-purple-200'
// //                         }
// //                       ].map((stat, index) => (
// //                         <motion.div 
// //                           key={stat.label}
// //                           className={`p-6 rounded-2xl bg-gradient-to-br ${stat.bg} border-2 ${stat.border} text-center group hover:scale-105 transition-all duration-300 cursor-pointer`}
// //                           whileHover={{ y: -4 }}
// //                           initial={{ opacity: 0, y: 20 }}
// //                           animate={{ opacity: 1, y: 0 }}
// //                           transition={{ delay: index * 0.1 }}
// //                         >
// //                           <stat.icon className={`w-10 h-10 mx-auto mb-3 ${stat.color} group-hover:scale-110 transition-transform`} />
// //                           <p className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</p>
// //                           <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
// //                         </motion.div>
// //                       ))}
// //                     </div>
// //                   </CardContent>
// //                 </Card>
// //               </motion.div>

// //               {/* Tasks Sections */}
// //               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
// //                 {/* Active Tasks */}
// //                 <motion.div variants={itemVariants}>
// //                   <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
// //                     <div className="flex items-center justify-between mb-4">
// //                       <h2 className="text-xl font-bold text-gray-800">Active Tasks</h2>
// //                       <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
// //                         {activeTasks.length} tasks
// //                       </Badge>
// //                     </div>
                    
// //                     {loadingTasks ? (
// //                       <div className="flex justify-center items-center h-32">
// //                         <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
// //                       </div>
// //                     ) : activeTasks.length > 0 ? (
// //                       <ul className="space-y-4">
// //                         {activeTasks.slice(0, 5).map((task, index) => (
// //                           <li key={task._id || index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
// //                             <button
// //                               onClick={() => handleToggleComplete(task)}
// //                               className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 flex-shrink-0 transition-all"
// //                             />
// //                             <div className="flex-1 min-w-0">
// //                               <p className="font-semibold text-gray-700 truncate">{task.title}</p>
// //                               <div className="flex items-center space-x-2 text-sm text-gray-500">
// //                                 <span className={`px-2 py-1 rounded-full text-xs ${
// //                                   task.priority === 'high' ? 'bg-red-100 text-red-700' :
// //                                   task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
// //                                   'bg-blue-100 text-blue-700'
// //                                 }`}>
// //                                   {task.priority}
// //                                 </span>
// //                                 <span className="text-gray-400">•</span>
// //                                 <span>{task.category}</span>
// //                               </div>
// //                             </div>
// //                             <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
// //                               <button
// //                                 onClick={() => handleShowStartModal(task)}
// //                                 className="p-1 text-blue-500 hover:text-blue-600"
// //                                 title="Start Task"
// //                               >
// //                                 <Play className="w-4 h-4" />
// //                               </button>
// //                               <button
// //                                 onClick={() => handleEditTask(task)}
// //                                 className="p-1 text-gray-500 hover:text-blue-600"
// //                                 title="Edit Task"
// //                               >
// //                                 <Edit className="w-4 h-4" />
// //                               </button>
// //                               <button
// //                                 onClick={() => handleDeleteTask(task._id)}
// //                                 className="p-1 text-gray-500 hover:text-red-600"
// //                                 title="Delete Task"
// //                               >
// //                                 <Trash2 className="w-4 h-4" />
// //                               </button>
// //                             </div>
// //                           </li>
// //                         ))}
// //                       </ul>
// //                     ) : (
// //                       <div className="text-center py-8 text-gray-500">
// //                         <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
// //                         <p>No active tasks.</p>
// //                         <p className="text-sm mt-1">Create a new task to get started!</p>
// //                       </div>
// //                     )}
// //                   </div>
// //                 </motion.div>

// //                 {/* Recently Completed Tasks */}
// //                 <motion.div variants={itemVariants}>
// //                   <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
// //                     <h2 className="text-xl font-bold text-gray-800 mb-4">Recently Completed Tasks</h2>
// //                     {completedTasks.length > 0 ? (
// //                       <ul className="space-y-4">
// //                         {completedTasks.slice(0, 5).map((task, index) => (
// //                           <li key={task._id || index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
// //                             <CircleCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
// //                             <div className="flex-1 min-w-0">
// //                               <p className="font-semibold text-gray-700 truncate">{task.title}</p>
// //                               <div className="flex items-center space-x-2 text-sm text-gray-500">
// //                                 <span className={`px-2 py-1 rounded-full text-xs ${
// //                                   task.priority === 'high' ? 'bg-red-100 text-red-700' :
// //                                   task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
// //                                   'bg-blue-100 text-blue-700'
// //                                 }`}>
// //                                   {task.priority}
// //                                 </span>
// //                                 <span className="text-gray-400">•</span>
// //                                 <span>{task.category}</span>
// //                               </div>
// //                             </div>
// //                             <p className="text-sm text-gray-400 flex-shrink-0">
// //                               {task.completedAt 
// //                                 ? format(new Date(task.completedAt), 'MMM d, h:mm a')
// //                                 : format(new Date(task.updatedAt), 'MMM d, h:mm a')
// //                               }
// //                             </p>
// //                           </li>
// //                         ))}
// //                       </ul>
// //                     ) : (
// //                       <div className="text-center py-8 text-gray-500">
// //                         <CircleCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
// //                         <p>No completed tasks yet.</p>
// //                         <p className="text-sm mt-1">Complete a task in focus or pomodoro mode to see it here!</p>
// //                       </div>
// //                     )}
// //                   </div>
// //                 </motion.div>
// //               </div>
// //             </div>
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
// //   BookOpen, CheckSquare, Edit, Flame, Target, Calendar, Trophy, Activity,
// //   Palette, Brain, MessageCircle, FileText, Star, TrendingUp, MapPin, 
// //   Briefcase, Globe, Heart, Sparkles, Clock, Zap, Play, Trash2, Loader2, X, Focus, Timer, Check, Filter, Search, Award, Users, TrendingDown, ChevronDown
// // } from "lucide-react";
// // import EditProfileModal from './EditProfileModal';
// // import { taskApi } from '@/backend/lib/api';

// // // ------ Enhanced StartTaskModal Component ------
// // function StartTaskModal({ isOpen, onClose, onSelectMode, task }) {
// //   if (!isOpen) return null;
  
// //   return (
// //     <AnimatePresence>
// //       {isOpen && (
// //         <motion.div 
// //           initial={{ opacity: 0 }} 
// //           animate={{ opacity: 1 }} 
// //           exit={{ opacity: 0 }} 
// //           className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm" 
// //           onClick={onClose}
// //         >
// //           <motion.div 
// //             initial={{ scale: 0.9, y: 50, opacity: 0 }} 
// //             animate={{ scale: 1, y: 0, opacity: 1 }} 
// //             exit={{ scale: 0.9, y: 50, opacity: 0 }} 
// //             className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative border border-gray-100" 
// //             onClick={(e) => e.stopPropagation()}
// //           >
// //             <button 
// //               onClick={onClose} 
// //               className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
// //             >
// //               <X className="w-5 h-5" />
// //             </button>
            
// //             <div className="text-center mb-8">
// //               <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
// //                 <Play className="w-8 h-8 text-white" />
// //               </div>
// //               <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Focus Mode</h2>
// //               {task && (
// //                 <p className="text-gray-600">
// //                   Ready to start: <span className="font-semibold text-blue-600">{task.title}</span>
// //                 </p>
// //               )}
// //             </div>
            
// //             <div className="space-y-3">
// //               <motion.button 
// //                 whileHover={{ scale: 1.02, y: -2 }} 
// //                 whileTap={{ scale: 0.98 }} 
// //                 onClick={() => onSelectMode('focus')} 
// //                 className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-3"
// //               >
// //                 <Focus className="w-5 h-5" />
// //                 <div className="text-left">
// //                   <div>Focus Mode</div>
// //                   <div className="text-xs opacity-90">Deep work session</div>
// //                 </div>
// //               </motion.button>
              
// //               <motion.button 
// //                 whileHover={{ scale: 1.02, y: -2 }} 
// //                 whileTap={{ scale: 0.98 }} 
// //                 onClick={() => onSelectMode('pomodoro')} 
// //                 className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-3"
// //               >
// //                 <Timer className="w-5 h-5" />
// //                 <div className="text-left">
// //                   <div>Pomodoro Technique</div>
// //                   <div className="text-xs opacity-90">25 min focused bursts</div>
// //                 </div>
// //               </motion.button>
// //             </div>
// //           </motion.div>
// //         </motion.div>
// //       )}
// //     </AnimatePresence>
// //   );
// // }

// // // ------ New Task List Item Component (Dashboard Style) ------
// // function TaskListItem({ task, index, onToggleComplete, onDelete, onEdit, onShowStartModal, onGainXP }) {
// //   const [isFadingOut, setIsFadingOut] = useState(false);
  
// //   const priorityConfig = { 
// //     urgent: { color: "text-red-700", bg: "bg-red-100" },
// //     high: { color: "text-red-700", bg: "bg-red-100" },
// //     medium: { color: "text-yellow-700", bg: "bg-yellow-100" },
// //     low: { color: "text-green-700", bg: "bg-green-100" }
// //   };
  
// //   const isCompleted = task.status === 'completed';
// //   const priority = priorityConfig[task.priority] || priorityConfig.medium;

// //   const handleToggle = async (e) => {
// //     e.stopPropagation();
// //     if (isCompleted) {
// //       await onToggleComplete(task);
// //       return;
// //     }
// //     setIsFadingOut(true);
// //     await new Promise(resolve => setTimeout(resolve, 600));
// //     await onToggleComplete(task);
// //     if (onGainXP) onGainXP(15);
// //     setIsFadingOut(false);
// //   };

// //   const handleDelete = (e) => { e.stopPropagation(); onDelete(task._id); };
// //   const handleEdit = (e) => { e.stopPropagation(); onEdit(task); };
// //   const handleStart = (e) => { e.stopPropagation(); onShowStartModal(task); };

// //   return (
// //     <motion.li 
// //       initial={{ opacity: 0, x: -20 }} 
// //       animate={{ opacity: 1, x: 0 }} 
// //       exit={{ opacity: 0, x: 20 }} 
// //       transition={{ duration: 0.3, delay: index * 0.05 }}
// //       className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group relative"
// //     >
// //       {/* Completion Animation Overlay */}
// //       <AnimatePresence>
// //         {isFadingOut && (
// //           <motion.div 
// //             initial={{ opacity: 0, scale: 0.8 }} 
// //             animate={{ opacity: 1, scale: 1 }} 
// //             exit={{ opacity: 0, scale: 1.2 }} 
// //             transition={{ duration: 0.5 }} 
// //             className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center z-10"
// //           >
// //             <div className="text-white text-center">
// //               <Check className="w-8 h-8 mx-auto mb-1" />
// //               <p className="text-sm font-semibold">+15 XP</p>
// //             </div>
// //           </motion.div>
// //         )}
// //       </AnimatePresence>

// //       {/* Completion Status Icon */}
// //       <motion.button
// //         whileHover={{ scale: 1.1 }}
// //         whileTap={{ scale: 0.9 }}
// //         onClick={handleToggle}
// //         className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
// //           isCompleted 
// //             ? "bg-green-500 border-green-500" 
// //             : "border-gray-300 hover:border-green-400 hover:bg-green-50"
// //         }`}
// //       >
// //         {isCompleted && <Check className="w-4 h-4 text-white" />}
// //       </motion.button>

// //       {/* Task Content */}
// //       <div className="flex-1 min-w-0">
// //         <div className="flex items-start justify-between">
// //           <div className="flex-1">
// //             <p className={`font-semibold text-gray-800 truncate ${isCompleted ? "line-through text-gray-500" : ""}`}>
// //               {task.title}
// //             </p>
// //             <div className="flex items-center space-x-3 mt-1">
// //               {/* Priority Badge */}
// //               <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.bg} ${priority.color}`}>
// //                 {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1) || 'Medium'}
// //               </span>
              
// //               {/* Category */}
// //               <span className="text-gray-400">•</span>
// //               <span className="text-sm text-gray-600">{task.category || 'General'}</span>
              
// //               {/* Estimated Time */}
// //               {task.estimatedTime && (
// //                 <>
// //                   <span className="text-gray-400">•</span>
// //                   <div className="flex items-center text-sm text-gray-600">
// //                     <Clock className="w-3 h-3 mr-1" />
// //                     {task.estimatedTime} min
// //                   </div>
// //                 </>
// //               )}

// //               {/* Due Date */}
// //               {task.dueDate && (
// //                 <>
// //                   <span className="text-gray-400">•</span>
// //                   <div className="flex items-center text-sm text-gray-600">
// //                     <Calendar className="w-3 h-3 mr-1" />
// //                     {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
// //                   </div>
// //                 </>
// //               )}
// //             </div>
// //           </div>

// //           {/* Completion Time */}
// //           <p className="text-sm text-gray-400 flex-shrink-0 ml-4">
// //             {isCompleted && task.completedAt 
// //               ? new Date(task.completedAt).toLocaleDateString('en-US', { 
// //                   month: 'short', 
// //                   day: 'numeric',
// //                   hour: 'numeric',
// //                   minute: '2-digit'
// //                 })
// //               : task.createdAt
// //               ? new Date(task.createdAt).toLocaleDateString('en-US', { 
// //                   month: 'short', 
// //                   day: 'numeric'
// //                 })
// //               : 'Recently'
// //             }
// //           </p>
// //         </div>

// //         {/* Task Description */}
// //         {task.description && (
// //           <p className={`text-sm text-gray-500 mt-2 line-clamp-1 ${isCompleted ? "line-through" : ""}`}>
// //             {task.description}
// //           </p>
// //         )}
// //       </div>

// //       {/* Action Buttons */}
// //       <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
// //         {!isCompleted && (
// //           <motion.button
// //             whileHover={{ scale: 1.1 }}
// //             whileTap={{ scale: 0.9 }}
// //             onClick={handleStart}
// //             className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
// //             title="Start Task"
// //           >
// //             <Play className="w-4 h-4" />
// //           </motion.button>
// //         )}
// //         <motion.button
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //           onClick={handleEdit}
// //           className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
// //           title="Edit Task"
// //         >
// //           <Edit className="w-4 h-4" />
// //         </motion.button>
// //         <motion.button
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //           onClick={handleDelete}
// //           className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
// //           title="Delete Task"
// //         >
// //           <Trash2 className="w-4 h-4" />
// //         </motion.button>
// //       </div>
// //     </motion.li>
// //   );
// // }

// // // ------ Enhanced Animation Variants ------
// // const containerVariants = { 
// //   hidden: { opacity: 0, y: 20 }, 
// //   visible: { 
// //     opacity: 1, 
// //     y: 0,
// //     transition: { 
// //       duration: 0.6,
// //       staggerChildren: 0.1,
// //       ease: "easeOut"
// //     } 
// //   } 
// // };

// // const itemVariants = { 
// //   hidden: { y: 30, opacity: 0 }, 
// //   visible: { 
// //     y: 0, 
// //     opacity: 1,
// //     transition: {
// //       duration: 0.5,
// //       ease: "easeOut"
// //     }
// //   } 
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
// //   const [taskFilter, setTaskFilter] = useState('all');
// //   const [searchQuery, setSearchQuery] = useState('');
  
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
// //     console.log(`User gained ${amount} XP. New total: ${userStats.totalPoints + amount}`);
// //   };

// //   const handleToggleComplete = async (task) => {
// //     const newStatus = task.status === 'completed' ? 'pending' : 'completed';
// //     setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
// //     try {
// //       await taskApi.updateTask(task._id, { 
// //         status: newStatus,
// //         progress: { percentage: newStatus === 'completed' ? 100 : task.progress?.percentage || 0 },
// //         completedAt: newStatus === 'completed' ? new Date().toISOString() : null
// //       });
// //     } catch (error) {
// //       console.error("Failed to update task:", error);
// //       setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? { ...t, status: task.status } : t));
// //     }
// //   };
  
// //   const handleDeleteTask = async (taskId) => {
// //     if (!confirm('Are you sure you want to delete this task?')) return;
    
// //     const originalTasks = tasks;
// //     setTasks(prevTasks => prevTasks.filter(t => t._id !== taskId));
// //     try {
// //       await taskApi.deleteTask(taskId);
// //     } catch (error) {
// //       console.error("Failed to delete task:", error);
// //       setTasks(originalTasks);
// //     }
// //   };
  
// //   const handleEditTask = (task) => {
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
  
// //   const getRankInfo = (rank) => {
// //     const rankData = { 
// //       'Beginner': { color: 'bg-gray-500', gradient: 'from-gray-400 to-gray-600' },
// //       'Intermediate': { color: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600' },
// //       'Advanced': { color: 'bg-purple-500', gradient: 'from-purple-400 to-purple-600' },
// //       'Expert': { color: 'bg-yellow-500', gradient: 'from-yellow-400 to-yellow-600' },
// //       'Master': { color: 'bg-red-500', gradient: 'from-red-400 to-red-600' }
// //     };
// //     return rankData[rank] || rankData['Beginner'];
// //   };
  
// //   const getNextRankProgress = (points) => {
// //     if (points < 100) return (points / 100) * 100;
// //     if (points < 500) return ((points - 100) / 400) * 100;
// //     if (points < 1000) return ((points - 500) / 500) * 100;
// //     if (points < 2000) return ((points - 1000) / 1000) * 100;
// //     return 100;
// //   };

// //   // Filter and search tasks
// //   const filteredTasks = tasks.filter(task => {
// //     const matchesFilter = taskFilter === 'all' || task.status === taskFilter;
// //     const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //                          task.description?.toLowerCase().includes(searchQuery.toLowerCase());
// //     return matchesFilter && matchesSearch;
// //   });

// //   const taskStats = {
// //     total: tasks.length,
// //     completed: tasks.filter(t => t.status === 'completed').length,
// //     inProgress: tasks.filter(t => t.status === 'in-progress').length,
// //     pending: tasks.filter(t => t.status === 'pending').length
// //   };

// //   if (!isLoaded) { 
// //     return (
// //       <div className="flex items-center justify-center h-screen">
// //         <div className="text-center">
// //           <motion.div
// //             animate={{ rotate: 360 }}
// //             transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
// //           >
// //             <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
// //           </motion.div>
// //           <p className="text-blue-600 font-medium">Loading your profile...</p>
// //         </div>
// //       </div>
// //     ); 
// //   }
  
// //   if (!isSignedIn) { 
// //     return (
// //       <div className="flex items-center justify-center h-screen">
// //         <div className="text-center">
// //           <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
// //           <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Spark!</h2>
// //           <p className="text-gray-600">Please sign in to view your profile and manage your tasks.</p>
// //         </div>
// //       </div>
// //     ); 
// //   }

// //   const rankInfo = getRankInfo(userStats.rank);

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
// //         }} 
// //       />

// //       <motion.div 
// //         className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6" 
// //         variants={containerVariants} 
// //         initial="hidden" 
// //         animate="visible"
// //       >
// //         <div className="max-w-7xl mx-auto space-y-8">
// //           {/* Enhanced Header */}
// //           <motion.div variants={itemVariants} className="text-center py-8">
// //             <motion.div
// //               initial={{ scale: 0.8, opacity: 0 }}
// //               animate={{ scale: 1, opacity: 1 }}
// //               transition={{ duration: 0.6 }}
// //             >
// //               <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent flex items-center justify-center gap-3">
// //                 <Sparkles className="w-10 h-10 text-blue-500" />
// //                 My Profile
// //               </h1>
// //               <p className="text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
// //                 Track your journey, showcase your achievements, and level up your productivity!
// //               </p>
// //             </motion.div>
// //           </motion.div>

// //           <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
// //             {/* Enhanced Profile Card */}
// //             <motion.div className="xl:col-span-1" variants={itemVariants}>
// //               <Card className="bg-white/95 backdrop-blur shadow-2xl rounded-3xl overflow-hidden h-full border-0">
// //                 <div className={`bg-gradient-to-br ${rankInfo.gradient} p-8 text-white relative overflow-hidden`}>
// //                   {/* Background Pattern */}
// //                   <div className="absolute inset-0 opacity-10">
// //                     <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white"></div>
// //                     <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white"></div>
// //                   </div>
                  
// //                   <div className="relative z-10">
// //                     <motion.div 
// //                       className="flex justify-between items-start mb-6"
// //                       initial={{ y: -20, opacity: 0 }}
// //                       animate={{ y: 0, opacity: 1 }}
// //                       transition={{ delay: 0.3 }}
// //                     >
// //                       <Trophy className="w-8 h-8 text-yellow-300" />
// //                       <Badge className="bg-white/20 text-white border-white/30">
// //                         Level {Math.floor(userStats.totalPoints / 100) + 1}
// //                       </Badge>
// //                     </motion.div>
                    
// //                     <div className="text-center">
// //                       <motion.div
// //                         whileHover={{ scale: 1.05 }}
// //                         transition={{ type: "spring", stiffness: 300 }}
// //                       >
// //                         <Avatar className="h-32 w-32 mb-4 ring-4 ring-white/50 ring-offset-4 ring-offset-transparent mx-auto shadow-2xl">
// //                           <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
// //                           <AvatarFallback className="text-3xl bg-white/20 backdrop-blur text-white border-2 border-white/30">
// //                             {user.fullName?.charAt(0) || user.primaryEmailAddress?.emailAddress?.charAt(0)}
// //                           </AvatarFallback>
// //                         </Avatar>
// //                       </motion.div>
                      
// //                       <Badge className="bg-white/20 text-white border-white/30 px-4 py-1 rounded-full shadow-md mb-4">
// //                         {userStats.rank}
// //                       </Badge>
                      
// //                       <h2 className="text-3xl font-bold mb-2">
// //                         {user.fullName || 'New User'}
// //                       </h2>
// //                       <p className="text-white/80 text-sm">
// //                         {user.primaryEmailAddress?.emailAddress}
// //                       </p>
                      
// //                       <div className="mt-6">
// //                         <div className="flex justify-between items-center mb-2">
// //                           <span className="text-sm text-white/80">Next Rank Progress</span>
// //                           <span className="text-sm font-bold">{Math.round(getNextRankProgress(userStats.totalPoints))}%</span>
// //                         </div>
// //                         <Progress value={getNextRankProgress(userStats.totalPoints)} className="h-2 bg-white/20" />
// //                       </div>
                      
// //                       <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20">
// //                         <div className="text-center">
// //                           <Star className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
// //                           <div className="text-2xl font-bold">{userStats.totalPoints}</div>
// //                           <div className="text-xs text-white/80">Total XP</div>
// //                         </div>
// //                         <div className="text-center">
// //                           <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-200" />
// //                           <div className="text-sm font-semibold">
// //                             {userStats.joinDate ? new Date(userStats.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
// //                           </div>
// //                           <div className="text-xs text-white/80">Joined</div>
// //                         </div>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 </div>
                
// //                 <CardContent className="p-6">
// //                   <Button 
// //                     onClick={() => setIsEditModalOpen(true)} 
// //                     className="w-full mb-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all rounded-xl h-12"
// //                   >
// //                     <Edit className="w-4 h-4 mr-2" />
// //                     Edit Profile
// //                   </Button>
                  
// //                   <Separator className="my-6" />
                  
// //                   <div className="space-y-4">
// //                     {/* Profile Information Cards */}
// //                     {[
// //                       { key: 'primaryGoal', icon: Target, label: 'Primary Goal', color: 'text-blue-600' },
// //                       { key: 'bio', icon: FileText, label: 'Bio', color: 'text-purple-600' },
// //                       { key: 'jobTitle', icon: Briefcase, label: 'Job Title', color: 'text-green-600' },
// //                       { key: 'location', icon: MapPin, label: 'Location', color: 'text-red-600' },
// //                       { key: 'skills', icon: Star, label: 'Skills', color: 'text-yellow-600' },
// //                       { key: 'interests', icon: Heart, label: 'Interests', color: 'text-pink-600' }
// //                     ].map(({ key, icon: Icon, label, color }) => {
// //                       const value = user.unsafeMetadata?.[key];
// //                       return value ? (
// //                         <motion.div 
// //                           key={key}
// //                           whileHover={{ scale: 1.02, x: 4 }}
// //                           className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
// //                         >
// //                           <Icon className={`w-5 h-5 ${color} mt-0.5 flex-shrink-0`} />
// //                           <div className="min-w-0 flex-1">
// //                             <p className="font-semibold text-gray-800 text-sm">{label}</p>
// //                             <p className="text-gray-600 text-sm break-words">{value}</p>
// //                           </div>
// //                         </motion.div>
// //                       ) : null;
// //                     })}
                    
// //                     {!user.unsafeMetadata?.primaryGoal && (
// //                       <motion.div 
// //                         whileHover={{ scale: 1.02 }}
// //                         className="text-center p-4 border-2 border-dashed border-gray-300 rounded-xl"
// //                       >
// //                         <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
// //                         <Button 
// //                           variant="ghost" 
// //                           onClick={() => setIsEditModalOpen(true)}
// //                           className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
// //                         >
// //                           Set Your Goals & Info
// //                         </Button>
// //                       </motion.div>
// //                     )}
// //                   </div>
// //                 </CardContent>
// //               </Card>
// //             </motion.div>

// //             <div className="xl:col-span-3 space-y-8">
// //               {/* Enhanced Statistics Card */}
// //               <motion.div variants={itemVariants}>
// //                 <Card className="bg-white shadow-xl rounded-3xl overflow-hidden border-0">
// //                   <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
// //                     <CardTitle className="flex items-center gap-3 text-blue-900 text-2xl">
// //                       <TrendingUp className="w-7 h-7 text-blue-600" />
// //                       Your Statistics
// //                     </CardTitle>
// //                     <CardDescription className="text-gray-600 text-base">
// //                       Track your progress and celebrate your achievements
// //                     </CardDescription>
// //                   </CardHeader>
// //                   <CardContent className="p-8">
// //                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
// //                       {[
// //                         { 
// //                           icon: CheckSquare, 
// //                           value: taskStats.completed, 
// //                           label: 'Tasks Completed', 
// //                           color: 'text-emerald-500', 
// //                           bg: 'from-emerald-50 to-emerald-100',
// //                           border: 'border-emerald-200'
// //                         },
// //                         { 
// //                           icon: Flame, 
// //                           value: `${habitStreak.count} Days`, 
// //                           label: 'Current Streak', 
// //                           color: 'text-orange-500', 
// //                           bg: 'from-orange-50 to-orange-100',
// //                           border: 'border-orange-200'
// //                         },
// //                         { 
// //                           icon: Activity, 
// //                           value: taskStats.inProgress, 
// //                           label: 'In Progress', 
// //                           color: 'text-blue-500', 
// //                           bg: 'from-blue-50 to-blue-100',
// //                           border: 'border-blue-200'
// //                         },
// //                         { 
// //                           icon: BookOpen, 
// //                           value: coursesFinished, 
// //                           label: 'Courses Finished', 
// //                           color: 'text-purple-500', 
// //                           bg: 'from-purple-50 to-purple-100',
// //                           border: 'border-purple-200'
// //                         }
// //                       ].map((stat, index) => (
// //                         <motion.div 
// //                           key={stat.label}
// //                           className={`p-6 rounded-2xl bg-gradient-to-br ${stat.bg} border-2 ${stat.border} text-center group hover:scale-105 transition-all duration-300 cursor-pointer`}
// //                           whileHover={{ y: -4 }}
// //                           initial={{ opacity: 0, y: 20 }}
// //                           animate={{ opacity: 1, y: 0 }}
// //                           transition={{ delay: index * 0.1 }}
// //                         >
// //                           <stat.icon className={`w-10 h-10 mx-auto mb-3 ${stat.color} group-hover:scale-110 transition-transform`} />
// //                           <p className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</p>
// //                           <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
// //                         </motion.div>
// //                       ))}
// //                     </div>
// //                   </CardContent>
// //                 </Card>
// //               </motion.div>

// //               {/* Enhanced Tasks Card with List Format */}
// //               <motion.div variants={itemVariants}>
// //                 <Card className="bg-white shadow-xl rounded-3xl overflow-hidden border-0">
// //                   <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
// //                     <div className="flex items-center justify-between">
// //                       <div>
// //                         <CardTitle className="flex items-center gap-3 text-indigo-900 text-2xl">
// //                           <CheckSquare className="w-7 h-7 text-indigo-600" />
// //                           My Tasks ({filteredTasks.length})
// //                         </CardTitle>
// //                         <CardDescription className="text-gray-600 text-base mt-1">
// //                           Manage and track all your tasks in one place
// //                         </CardDescription>
// //                       </div>
// //                       <div className="flex items-center gap-2">
// //                         <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
// //                           {taskStats.completed} completed
// //                         </Badge>
// //                         <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
// //                           {taskStats.inProgress} active
// //                         </Badge>
// //                       </div>
// //                     </div>
// //                   </CardHeader>
// //                   <CardContent className="p-6">
// //                     {/* Task Filters and Search */}
// //                     <div className="flex flex-col sm:flex-row gap-4 mb-6">
// //                       <div className="flex-1 relative">
// //                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
// //                         <input
// //                           type="text"
// //                           placeholder="Search tasks..."
// //                           value={searchQuery}
// //                           onChange={(e) => setSearchQuery(e.target.value)}
// //                           className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
// //                         />
// //                       </div>
// //                       <select
// //                         value={taskFilter}
// //                         onChange={(e) => setTaskFilter(e.target.value)}
// //                         className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[150px]"
// //                       >
// //                         <option value="all">All Tasks</option>
// //                         <option value="pending">Pending</option>
// //                         <option value="in-progress">In Progress</option>
// //                         <option value="completed">Completed</option>
// //                       </select>
// //                     </div>

// //                     {/* Tasks List */}
// //                     {loadingTasks ? (
// //                       <div className="flex justify-center items-center h-48">
// //                         <div className="text-center">
// //                           <motion.div
// //                             animate={{ rotate: 360 }}
// //                             transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
// //                           >
// //                             <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-4" />
// //                           </motion.div>
// //                           <p className="text-gray-600">Loading your tasks...</p>
// //                         </div>
// //                       </div>
// //                     ) : filteredTasks.length > 0 ? (
// //                       <ul className="space-y-2">
// //                         <AnimatePresence mode="popLayout">
// //                           {filteredTasks.map((task, index) => (
// //                             <TaskListItem
// //                               key={task._id}
// //                               task={task}
// //                               index={index}
// //                               onToggleComplete={handleToggleComplete}
// //                               onDelete={handleDeleteTask}
// //                               onEdit={handleEditTask}
// //                               onShowStartModal={handleShowStartModal}
// //                               onGainXP={handleGainXP}
// //                             />
// //                           ))}
// //                         </AnimatePresence>
// //                       </ul>
// //                     ) : (
// //                       <motion.div 
// //                         className="text-center py-16"
// //                         initial={{ opacity: 0, y: 20 }}
// //                         animate={{ opacity: 1, y: 0 }}
// //                       >
// //                         <motion.div
// //                           animate={{ 
// //                             y: [0, -10, 0],
// //                           }}
// //                           transition={{ 
// //                             duration: 2, 
// //                             repeat: Infinity,
// //                             ease: "easeInOut"
// //                           }}
// //                         >
// //                           <CheckSquare className="w-20 h-20 mx-auto mb-6 text-gray-300" />
// //                         </motion.div>
// //                         <h3 className="text-xl font-bold text-gray-800 mb-2">
// //                           {searchQuery || taskFilter !== 'all' ? 'No matching tasks found' : 'No tasks yet'}
// //                         </h3>
// //                         <p className="text-gray-600 mb-6 max-w-md mx-auto">
// //                           {searchQuery || taskFilter !== 'all' 
// //                             ? 'Try adjusting your search or filter criteria'
// //                             : 'Start your productivity journey by creating your first task!'
// //                           }
// //                         </p>
// //                         {(!searchQuery && taskFilter === 'all') && (
// //                           <Button 
// //                             className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all rounded-xl"
// //                             onClick={() => console.log('Navigate to task creation')}
// //                           >
// //                             <CheckSquare className="w-4 h-4 mr-2" />
// //                             Create Your First Task
// //                           </Button>
// //                         )}
// //                       </motion.div>
// //                     )}
// //                   </CardContent>
// //                 </Card>
// //               </motion.div>
// //             </div>
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
// // //   BookOpen, CheckSquare, Edit, Flame, Target, Calendar, Trophy, Activity,
// // //   Palette, Brain, MessageCircle, FileText, Star, TrendingUp, MapPin, 
// // //   Briefcase, Globe, Heart, Sparkles, Clock, Zap, Play, Trash2, Loader2, X, Focus, Timer, Check
// // // } from "lucide-react";
// // // import EditProfileModal from './EditProfileModal';
// // // import { taskApi } from '@/backend/lib/api'; // Assuming you have this API helper

// // // // ------ StartTaskModal Component ------
// // // function StartTaskModal({ isOpen, onClose, onSelectMode, task }) {
// // //   if (!isOpen) return null;
// // //   return (
// // //     <AnimatePresence>
// // //       {isOpen && (
// // //         <motion.div 
// // //           initial={{ opacity: 0 }} 
// // //           animate={{ opacity: 1 }} 
// // //           exit={{ opacity: 0 }} 
// // //           className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50" 
// // //           onClick={onClose}
// // //         >
// // //           <motion.div 
// // //             initial={{ scale: 0.9, y: 50 }} 
// // //             animate={{ scale: 1, y: 0 }} 
// // //             exit={{ scale: 0.9, y: 50 }} 
// // //             className="bg-white rounded-2xl p-8 w-full max-w-sm sm:max-w-md shadow-2xl relative" 
// // //             onClick={(e) => e.stopPropagation()}
// // //           >
// // //             <button 
// // //               onClick={onClose} 
// // //               className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
// // //             >
// // //               <X className="w-6 h-6" />
// // //             </button>
// // //             <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
// // //               Choose Your Focus Mode
// // //             </h2>
// // //             {task && (
// // //               <p className="text-gray-600 text-center mb-6">
// // //                 Starting: <span className="font-semibold">{task.title}</span>
// // //               </p>
// // //             )}
// // //             <div className="flex flex-col space-y-4">
// // //               <motion.button 
// // //                 whileHover={{ scale: 1.02 }} 
// // //                 whileTap={{ scale: 0.98 }} 
// // //                 onClick={() => onSelectMode('focus')} 
// // //                 className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
// // //               >
// // //                 <Focus className="w-6 h-6" />
// // //                 <span>Focus Mode</span>
// // //               </motion.button>
// // //               <motion.button 
// // //                 whileHover={{ scale: 1.02 }} 
// // //                 whileTap={{ scale: 0.98 }} 
// // //                 onClick={() => onSelectMode('pomodoro')} 
// // //                 className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
// // //               >
// // //                 <Timer className="w-6 h-6" />
// // //                 <span>Pomodoro Technique</span>
// // //               </motion.button>
// // //             </div>
// // //           </motion.div>
// // //         </motion.div>
// // //       )}
// // //     </AnimatePresence>
// // //   );
// // // }

// // // // ------ Updated TaskCard Component ------
// // // function TaskCard({ task, index, onToggleComplete, onDelete, onEdit, onShowStartModal, onGainXP }) {
// // //   const [isFadingOut, setIsFadingOut] = useState(false);
  
// // //   const priorityColors = { 
// // //     urgent: "bg-red-500", 
// // //     high: "bg-red-500", 
// // //     medium: "bg-yellow-500", 
// // //     low: "bg-green-500" 
// // //   };
  
// // //   const energyColors = { 
// // //     High: "text-blue-500", 
// // //     Medium: "text-orange-500", 
// // //     Low: "text-teal-500" 
// // //   };
  
// // //   const isCompleted = task.status === 'completed';

// // //   const handleToggle = async (e) => {
// // //     e.stopPropagation();
// // //     if (isCompleted) {
// // //       await onToggleComplete(task);
// // //       return;
// // //     }
// // //     setIsFadingOut(true);
// // //     await new Promise(resolve => setTimeout(resolve, 600));
// // //     await onToggleComplete(task);
// // //     if (onGainXP) onGainXP(10);
// // //     setIsFadingOut(false);
// // //   };

// // //   const handleDelete = (e) => { e.stopPropagation(); onDelete(task._id); };
// // //   const handleEdit = (e) => { e.stopPropagation(); onEdit(task); };
// // //   const handleStart = (e) => { e.stopPropagation(); onShowStartModal(task); };

// // //   return (
// // //     <motion.div 
// // //       layout 
// // //       initial={{ opacity: 0, y: 50 }} 
// // //       animate={{ opacity: 1, y: 0 }} 
// // //       exit={{ opacity: 0, scale: 0.8 }} 
// // //       transition={{ duration: 0.3, delay: index * 0.05 }} 
// // //       className={`relative bg-white rounded-2xl shadow-lg p-6 border ${isCompleted ? "border-green-300 opacity-60" : "border-gray-200"} hover:shadow-xl transition-all duration-300`}
// // //     >
// // //       <AnimatePresence>
// // //         {isFadingOut && (
// // //           <motion.div 
// // //             initial={{ opacity: 0, scale: 0.5 }} 
// // //             animate={{ opacity: 1, scale: 1 }} 
// // //             exit={{ opacity: 0, scale: 1.5 }} 
// // //             transition={{ duration: 0.4 }} 
// // //             className="absolute inset-0 bg-green-500/80 rounded-2xl flex items-center justify-center z-10"
// // //           >
// // //             <Check className="w-16 h-16 text-white" />
// // //           </motion.div>
// // //         )}
// // //       </AnimatePresence>
      
// // //       <div className="flex justify-between items-start mb-4">
// // //         <h3 className={`text-lg font-semibold pr-4 ${isCompleted ? "text-gray-400 line-through" : "text-gray-800"}`}>
// // //           {task.title}
// // //         </h3>
// // //         <motion.button 
// // //           whileHover={{ scale: 1.1 }} 
// // //           whileTap={{ scale: 0.9 }} 
// // //           onClick={handleToggle} 
// // //           className={`flex-shrink-0 w-6 h-6 rounded-full border-2 ${isCompleted ? "bg-green-500 border-green-500" : "border-gray-300"} flex items-center justify-center transition-all`}
// // //         >
// // //           {isCompleted && <Check className="w-4 h-4 text-white" />}
// // //         </motion.button>
// // //       </div>
      
// // //       <p className={`text-sm text-gray-500 mb-6 ${isCompleted ? "line-through" : ""}`}>
// // //         {task.description || 'No description provided'}
// // //       </p>
      
// // //       <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mb-6">
// // //         <div className="flex items-center text-gray-600">
// // //           <Clock className="w-4 h-4 mr-2" />
// // //           {task.estimatedTime || 25} min
// // //         </div>
// // //         {task.energy && (
// // //           <div className="flex items-center text-gray-600">
// // //             <Zap className={`w-4 h-4 mr-2 ${energyColors[task.energy]}`} />
// // //             {task.energy}
// // //           </div>
// // //         )}
// // //         {task.dueDate && (
// // //           <div className="flex items-center text-gray-600">
// // //             <Calendar className="w-4 h-4 mr-2" />
// // //             {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
// // //           </div>
// // //         )}
// // //         <div className="flex items-center text-gray-600">
// // //           <span className={`w-2.5 h-2.5 rounded-full mr-2 ${priorityColors[task.priority] || priorityColors.medium}`}></span>
// // //           {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1) || 'Medium'}
// // //         </div>
// // //       </div>
      
// // //       <div className="flex justify-end space-x-2 border-t pt-4 -mx-6 px-6">
// // //         {!isCompleted && (
// // //           <motion.button 
// // //             whileHover={{ scale: 1.05 }} 
// // //             whileTap={{ scale: 0.95 }} 
// // //             onClick={handleStart} 
// // //             className="p-2 text-gray-500 hover:text-blue-500" 
// // //             title="Start Task"
// // //           >
// // //             <Play className="w-5 h-5" />
// // //           </motion.button>
// // //         )}
// // //         <motion.button 
// // //           whileHover={{ scale: 1.05 }} 
// // //           whileTap={{ scale: 0.95 }} 
// // //           onClick={handleEdit} 
// // //           className="p-2 text-gray-500 hover:text-yellow-500" 
// // //           title="Edit Task"
// // //         >
// // //           <Edit className="w-5 h-5" />
// // //         </motion.button>
// // //         <motion.button 
// // //           whileHover={{ scale: 1.05 }} 
// // //           whileTap={{ scale: 0.95 }} 
// // //           onClick={handleDelete} 
// // //           className="p-2 text-gray-500 hover:text-red-500" 
// // //           title="Delete Task"
// // //         >
// // //           <Trash2 className="w-5 h-5" />
// // //         </motion.button>
// // //       </div>
// // //     </motion.div>
// // //   );
// // // }

// // // // ------ Animation Variants ------
// // // const containerVariants = { 
// // //   hidden: { opacity: 0 }, 
// // //   visible: { opacity: 1, transition: { staggerChildren: 0.1 } } 
// // // };
// // // const itemVariants = { 
// // //   hidden: { y: 20, opacity: 0 }, 
// // //   visible: { y: 0, opacity: 1 } 
// // // };

// // // // ------ User Data Hook ------
// // // function useUserData() {
// // //   const [data, setData] = useState({ 
// // //     tasksCompleted: 0, 
// // //     habitStreak: { count: 0 }, 
// // //     coursesFinished: 0 
// // //   });
  
// // //   useEffect(() => {
// // //     try {
// // //       const storedData = JSON.parse(localStorage.getItem('user_data') || '{}');
// // //       setData({ 
// // //         tasksCompleted: storedData.tasksCompleted || 0, 
// // //         habitStreak: storedData.habitStreak || { count: 0 }, 
// // //         coursesFinished: storedData.coursesFinished || 0 
// // //       });
// // //     } catch (error) { 
// // //       console.error('Failed to load user data:', error); 
// // //     }
// // //   }, []);
  
// // //   return data;
// // // }

// // // // ------ Main Profile Page Component ------
// // // export default function ProfilePage() {
// // //   const { user, isLoaded, isSignedIn } = useUser();
// // //   const { tasksCompleted, habitStreak, coursesFinished } = useUserData();
// // //   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
// // //   const [userStats, setUserStats] = useState({ 
// // //     totalPoints: 0, 
// // //     rank: 'Beginner', 
// // //     joinDate: null, 
// // //     lastActive: null 
// // //   });
// // //   const [tasks, setTasks] = useState([]);
// // //   const [loadingTasks, setLoadingTasks] = useState(true);
  
// // //   // State for the StartTaskModal
// // //   const [isStartModalOpen, setIsStartModalOpen] = useState(false);
// // //   const [taskToStart, setTaskToStart] = useState(null);

// // //   useEffect(() => {
// // //     if (user) {
// // //       loadUserStats();
// // //       loadTasks();
// // //     }
// // //   }, [user]);

// // //   const loadTasks = async () => {
// // //     if (!user?.id) return;
// // //     setLoadingTasks(true);
// // //     try {
// // //       const response = await taskApi.getTasks({ userId: user.id });
// // //       if (response.success && response.data) {
// // //         const sortedTasks = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
// // //         setTasks(sortedTasks);
// // //       }
// // //     } catch (error) {
// // //       console.error('Failed to load tasks:', error);
// // //     } finally {
// // //       setLoadingTasks(false);
// // //     }
// // //   };
  
// // //   const handleShowStartModal = (task) => {
// // //     setTaskToStart(task);
// // //     setIsStartModalOpen(true);
// // //   };
  
// // //   const handleGainXP = (amount) => {
// // //     setUserStats(prevStats => ({
// // //       ...prevStats, 
// // //       totalPoints: prevStats.totalPoints + amount 
// // //     }));
// // //     // Here you would also call an API to save the new XP value to your database
// // //     console.log(`User gained ${amount} XP. New total: ${userStats.totalPoints + amount}`);
// // //   };

// // //   const handleToggleComplete = async (task) => {
// // //     const newStatus = task.status === 'completed' ? 'pending' : 'completed';
// // //     // Optimistically update UI
// // //     setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
// // //     try {
// // //       // Update in the database
// // //       await taskApi.updateTask(task._id, { status: newStatus });
// // //     } catch (error) {
// // //       console.error("Failed to update task:", error);
// // //       // Revert UI on failure
// // //       setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? { ...t, status: task.status } : t));
// // //     }
// // //   };
  
// // //   const handleDeleteTask = async (taskId) => {
// // //     if (!confirm('Are you sure you want to delete this task?')) return;
    
// // //     // Optimistically update UI
// // //     const originalTasks = tasks;
// // //     setTasks(prevTasks => prevTasks.filter(t => t._id !== taskId));
// // //     try {
// // //       await taskApi.deleteTask(taskId);
// // //     } catch (error) {
// // //       console.error("Failed to delete task:", error);
// // //       setTasks(originalTasks); // Revert on failure
// // //     }
// // //   };
  
// // //   const handleEditTask = (task) => {
// // //     // Logic to open an edit modal for the task
// // //     alert(`Editing task: ${task.title}`);
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
// // //     } catch (error) { 
// // //       console.error('Failed to load stats:', error); 
// // //     }
// // //   };
  
// // //   const getRankColor = (rank) => {
// // //     const rankColors = { 
// // //       'Beginner': 'bg-gray-500', 
// // //       'Intermediate': 'bg-blue-500', 
// // //       'Advanced': 'bg-purple-500', 
// // //       'Expert': 'bg-yellow-500', 
// // //       'Master': 'bg-red-500' 
// // //     };
// // //     return rankColors[rank] || 'bg-gray-500';
// // //   };
  
// // //   const getNextRankProgress = (points) => {
// // //     if (points < 50) return (points / 50) * 100;
// // //     if (points < 200) return (points / 200) * 100;
// // //     if (points < 500) return (points / 500) * 100;
// // //     if (points < 1000) return (points / 1000) * 100;
// // //     return 100;
// // //   };

// // //   if (!isLoaded) { 
// // //     return (
// // //       <div className="flex items-center justify-center h-64">
// // //         <div className="text-center">
// // //           <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
// // //           <p className="text-blue-600">Loading profile...</p>
// // //         </div>
// // //       </div>
// // //     ); 
// // //   }
  
// // //   if (!isSignedIn) { 
// // //     return (
// // //       <div className="flex items-center justify-center h-64">
// // //         <div className="text-center">
// // //           <p className="text-gray-600">Please sign in to view your profile.</p>
// // //         </div>
// // //       </div>
// // //     ); 
// // //   }

// // //   return (
// // //     <>
// // //       <EditProfileModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
// // //       <StartTaskModal 
// // //         isOpen={isStartModalOpen} 
// // //         onClose={() => setIsStartModalOpen(false)} 
// // //         task={taskToStart} 
// // //         onSelectMode={(mode) => { 
// // //           setIsStartModalOpen(false); 
// // //           console.log(`Selected ${mode} for task: ${taskToStart?.title}`);
// // //           // Here you would navigate to your apomodoro page
// // //         }} 
// // //       />

// // //       <motion.div 
// // //         className="space-y-8" 
// // //         variants={containerVariants} 
// // //         initial="hidden" 
// // //         animate="visible"
// // //       >
// // //         {/* Profile Header */}
// // //         <motion.div variants={itemVariants} className="text-center">
// // //           <h1 className="text-4xl font-extrabold text-blue-800 flex items-center justify-center gap-2">
// // //             <Sparkles className="w-8 h-8 text-blue-500" />
// // //             My Profile
// // //           </h1>
// // //           <p className="text-lg text-slate-600 mt-2">
// // //             Track your journey, showcase your achievements, and level up in Spark!
// // //           </p>
// // //         </motion.div>

// // //         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
// // //           {/* Profile Card */}
// // //           <motion.div className="lg:col-span-1" variants={itemVariants}>
// // //             <Card className="bg-white/95 shadow-xl rounded-2xl overflow-hidden h-full border border-blue-100">
// // //               <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 flex flex-col items-center text-center relative">
// // //                 <motion.div 
// // //                   className="absolute top-0 right-0 p-2" 
// // //                   initial={{ scale: 0 }} 
// // //                   animate={{ scale: 1 }} 
// // //                   transition={{ delay: 0.2 }}
// // //                 >
// // //                   <Trophy className="w-8 h-8 text-yellow-400" />
// // //                 </motion.div>
// // //                 <div className="relative">
// // //                   <Avatar className="h-32 w-32 mb-4 ring-4 ring-blue-300 ring-offset-4 ring-offset-transparent transition-all hover:scale-105">
// // //                     <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
// // //                     <AvatarFallback className="text-3xl bg-blue-200 text-blue-800">
// // //                       {user.fullName?.charAt(0) || user.primaryEmailAddress?.emailAddress?.charAt(0)}
// // //                     </AvatarFallback>
// // //                   </Avatar>
// // //                   <Badge className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 ${getRankColor(userStats.rank)} text-white px-4 py-1 rounded-full shadow-md`}>
// // //                     {userStats.rank}
// // //                   </Badge>
// // //                 </div>
// // //                 <h2 className="text-3xl font-extrabold mt-4 text-blue-900">
// // //                   {user.fullName || 'New User'}
// // //                 </h2>
// // //                 <p className="text-slate-600 text-sm italic">
// // //                   {user.primaryEmailAddress?.emailAddress}
// // //                 </p>
// // //                 <div className="w-full mt-4">
// // //                   <Progress value={getNextRankProgress(userStats.totalPoints)} className="h-2 bg-blue-100" />
// // //                   <p className="text-sm text-blue-700 mt-1">
// // //                     Progress to next rank: {Math.round(getNextRankProgress(userStats.totalPoints))}%
// // //                   </p>
// // //                 </div>
// // //                 <div className="flex items-center justify-around w-full mt-4 text-sm">
// // //                   <div className="flex flex-col items-center">
// // //                     <Star className="w-5 h-5 text-amber-500" />
// // //                     <span className="font-bold text-blue-800">{userStats.totalPoints} pts</span>
// // //                   </div>
// // //                   <div className="flex flex-col items-center">
// // //                     <Calendar className="w-5 h-5 text-sky-500" />
// // //                     <span className="text-blue-800">
// // //                       Joined {new Date(userStats.joinDate).toLocaleDateString()}
// // //                     </span>
// // //                   </div>
// // //                 </div>
// // //               </div>
              
// // //               <CardContent className="p-6 bg-gradient-to-b from-white to-blue-50">
// // //                 <Button 
// // //                   onClick={() => setIsEditModalOpen(true)} 
// // //                   variant="default" 
// // //                   className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-shadow"
// // //                 >
// // //                   <Edit className="w-4 h-4 mr-2" />
// // //                   Edit Profile
// // //                 </Button>
// // //                 <Separator className="my-4 bg-blue-200" />
// // //                 <div className="space-y-6">
// // //                   <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// // //                     <Target className="w-6 h-6 text-blue-600" />
// // //                     <p className="font-semibold text-blue-800">Primary Goal:</p>
// // //                     <p className="text-slate-700 text-center">
// // //                       {user.unsafeMetadata?.primaryGoal || (
// // //                         <Button 
// // //                           variant="link" 
// // //                           className="p-0 text-blue-600 hover:text-blue-800" 
// // //                           onClick={() => setIsEditModalOpen(true)}
// // //                         >
// // //                           Set Your Goal Now
// // //                         </Button>
// // //                       )}
// // //                     </p>
// // //                   </div>
                  
// // //                   {/* Bio */}
// // //                   {user.unsafeMetadata?.bio && (
// // //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// // //                       <FileText className="w-6 h-6 text-sky-500" />
// // //                       <p className="font-semibold text-blue-800">Bio:</p>
// // //                       <p className="text-slate-700 text-center text-sm">
// // //                         {user.unsafeMetadata.bio}
// // //                       </p>
// // //                     </div>
// // //                   )}
                  
// // //                   {/* Job Title */}
// // //                   {user.unsafeMetadata?.jobTitle && (
// // //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// // //                       <Briefcase className="w-6 h-6 text-emerald-500" />
// // //                       <p className="font-semibold text-blue-800">Job Title:</p>
// // //                       <p className="text-slate-700 text-center">
// // //                         {user.unsafeMetadata.jobTitle}
// // //                         {user.unsafeMetadata.company && ` at ${user.unsafeMetadata.company}`}
// // //                       </p>
// // //                     </div>
// // //                   )}
                  
// // //                   {/* Location */}
// // //                   {user.unsafeMetadata?.location && (
// // //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// // //                       <MapPin className="w-6 h-6 text-red-500" />
// // //                       <p className="font-semibold text-blue-800">Location:</p>
// // //                       <p className="text-slate-700 text-center">
// // //                         {user.unsafeMetadata.location}
// // //                       </p>
// // //                     </div>
// // //                   )}
                  
// // //                   {/* Website */}
// // //                   {user.unsafeMetadata?.website && (
// // //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// // //                       <Globe className="w-6 h-6 text-cyan-500" />
// // //                       <p className="font-semibold text-blue-800">Website:</p>
// // //                       <a 
// // //                         href={user.unsafeMetadata.website} 
// // //                         target="_blank" 
// // //                         rel="noopener noreferrer"
// // //                         className="text-blue-600 hover:text-blue-800 text-center text-sm underline"
// // //                       >
// // //                         {user.unsafeMetadata.website}
// // //                       </a>
// // //                     </div>
// // //                   )}
                  
// // //                   {/* Skills */}
// // //                   {user.unsafeMetadata?.skills && (
// // //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// // //                       <Star className="w-6 h-6 text-amber-500" />
// // //                       <p className="font-semibold text-blue-800">Skills:</p>
// // //                       <p className="text-slate-700 text-center text-sm">
// // //                         {user.unsafeMetadata.skills}
// // //                       </p>
// // //                     </div>
// // //                   )}
                  
// // //                   {/* Interests */}
// // //                   {user.unsafeMetadata?.interests && (
// // //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// // //                       <Heart className="w-6 h-6 text-pink-500" />
// // //                       <p className="font-semibold text-blue-800">Interests:</p>
// // //                       <p className="text-slate-700 text-center text-sm">
// // //                         {user.unsafeMetadata.interests}
// // //                       </p>
// // //                     </div>
// // //                   )}
// // //                 </div>
// // //               </CardContent>
// // //             </Card>
// // //           </motion.div>

// // //           <div className="lg:col-span-3 space-y-8">
// // //             {/* Statistics Card */}
// // //             <motion.div variants={itemVariants}>
// // //               <Card className="bg-white shadow-xl rounded-2xl overflow-hidden border-t-4 border-blue-500">
// // //                 <CardHeader className="bg-blue-50">
// // //                   <CardTitle className="flex items-center gap-2 text-blue-900 text-2xl">
// // //                     <TrendingUp className="w-7 h-7 text-blue-600" />
// // //                     Statistics
// // //                   </CardTitle>
// // //                   <CardDescription className="text-slate-600 text-lg">
// // //                     Your all-time progress and achievements.
// // //                   </CardDescription>
// // //                 </CardHeader>
// // //                 <CardContent className="p-6">
// // //                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
// // //                     <motion.div 
// // //                       className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg text-center" 
// // //                       whileHover={{ scale: 1.05 }}
// // //                     >
// // //                       <CheckSquare className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
// // //                       <p className="text-4xl font-bold text-emerald-700">{tasksCompleted}</p>
// // //                       <p className="text-base text-slate-600 mt-1">Tasks Completed</p>
// // //                     </motion.div>
// // //                     <motion.div 
// // //                       className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg text-center" 
// // //                       whileHover={{ scale: 1.05 }}
// // //                     >
// // //                       <Flame className="w-12 h-12 mx-auto mb-3 text-amber-500" />
// // //                       <p className="text-4xl font-bold text-amber-700">{habitStreak.count} Days</p>
// // //                       <p className="text-base text-slate-600 mt-1">Habit Streak</p>
// // //                     </motion.div>
// // //                     <motion.div 
// // //                       className="p-6 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 shadow-lg text-center" 
// // //                       whileHover={{ scale: 1.05 }}
// // //                     >
// // //                       <BookOpen className="w-12 h-12 mx-auto mb-3 text-sky-500" />
// // //                       <p className="text-4xl font-bold text-sky-700">{coursesFinished}</p>
// // //                       <p className="text-base text-slate-600 mt-1">Courses Finished</p>
// // //                     </motion.div>
// // //                   </div>
// // //                 </CardContent>
// // //               </Card>
// // //             </motion.div>

// // //             {/* All Tasks Card */}
// // //             <motion.div variants={itemVariants}>
// // //               <Card className="bg-white shadow-xl rounded-2xl overflow-hidden border-t-4 border-blue-500">
// // //                 <CardHeader className="bg-blue-50">
// // //                   <CardTitle className="flex items-center gap-2 text-blue-900 text-2xl">
// // //                     <CheckSquare className="w-7 h-7 text-blue-600" />
// // //                     All My Tasks
// // //                   </CardTitle>
// // //                   <CardDescription className="text-slate-600 text-lg">
// // //                     A complete list of all your tasks.
// // //                   </CardDescription>
// // //                 </CardHeader>
// // //                 <CardContent className="p-6">
// // //                   {loadingTasks ? (
// // //                     <div className="flex justify-center items-center h-24">
// // //                       <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
// // //                     </div>
// // //                   ) : tasks.length > 0 ? (
// // //                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
// // //                       <AnimatePresence>
// // //                         {tasks.map((task, index) => (
// // //                           <TaskCard
// // //                             key={task._id}
// // //                             task={task}
// // //                             index={index}
// // //                             onToggleComplete={handleToggleComplete}
// // //                             onDelete={handleDeleteTask}
// // //                             onEdit={handleEditTask}
// // //                             onShowStartModal={handleShowStartModal}
// // //                             onGainXP={handleGainXP}
// // //                           />
// // //                         ))}
// // //                       </AnimatePresence>
// // //                     </div>
// // //                   ) : (
// // //                     <div className="text-center py-12">
// // //                       <motion.div 
// // //                         initial={{ scale: 0.8, opacity: 0 }} 
// // //                         animate={{ scale: 1, opacity: 1 }} 
// // //                         transition={{ duration: 0.5 }}
// // //                       >
// // //                         <CheckSquare className="w-20 h-20 mx-auto mb-4 text-blue-300" />
// // //                       </motion.div>
// // //                       <p className="text-blue-900 font-medium text-lg">No tasks found.</p>
// // //                       <p className="text-sm text-slate-600 mt-2">
// // //                         Go to the Task Manager to add your first task!
// // //                       </p>
// // //                     </div>
// // //                   )}
// // //                 </CardContent>
// // //               </Card>
// // //             </motion.div>
// // //           </div>
// // //         </div>
// // //       </motion.div>
// // //     </>
// // //   );
// // // }

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

// // // const containerVariants = { 
// // //   hidden: { opacity: 0 }, 
// // //   visible: { opacity: 1, transition: { staggerChildren: 0.1 } } 
// // // };
// // // const itemVariants = { 
// // //   hidden: { y: 20, opacity: 0 }, 
// // //   visible: { y: 0, opacity: 1 } 
// // // };

// // // // Activity icons mapping
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

// // // // Mock user data hook for stats like tasks, habits, etc. (using localStorage)
// // // function useUserData() {
// // //   const [data, setData] = useState({
// // //     tasksCompleted: 0,
// // //     habitStreak: { count: 0 },
// // //     coursesFinished: 0
// // //   });

// // //   useEffect(() => {
// // //     const loadData = () => {
// // //       try {
// // //         const storedData = JSON.parse(localStorage.getItem('user_data') || '{}');
// // //         setData({
// // //           tasksCompleted: storedData.tasksCompleted || 0,
// // //           habitStreak: storedData.habitStreak || { count: 0 },
// // //           coursesFinished: storedData.coursesFinished || 0
// // //         });
// // //       } catch (error) {
// // //         console.error('Failed to load user data:', error);
// // //       }
// // //     };
// // //     loadData();
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

// // //   // Load user activities and stats
// // //   useEffect(() => {
// // //     if (user) {
// // //       loadUserActivities();
// // //       loadUserStats();
// // //     }
// // //   }, [user]);

// // //   const loadUserActivities = () => {
// // //     try {
// // //       const activities = JSON.parse(localStorage.getItem('user_activities') || '[]');
// // //       const userActivities = activities
// // //         .filter(activity => activity.userId === user.id)
// // //         .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
// // //         .slice(0, 10);
      
// // //       setRecentActivities(userActivities);
// // //     } catch (error) {
// // //       console.error('Failed to load activities:', error);
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
// // //     } catch (error) {
// // //       console.error('Failed to load stats:', error);
// // //     }
// // //   };

// // //   const getRankColor = (rank) => {
// // //     const rankColors = {
// // //       'Beginner': 'bg-gray-500',
// // //       'Intermediate': 'bg-blue-500',
// // //       'Advanced': 'bg-purple-500',
// // //       'Expert': 'bg-yellow-500',
// // //       'Master': 'bg-red-500'
// // //     };
// // //     return rankColors[rank] || 'bg-gray-500';
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

// // //   if (!isLoaded) {
// // //     return (
// // //       <div className="flex items-center justify-center h-64">
// // //         <div className="text-center">
// // //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
// // //           <p className="text-white">Loading profile...</p>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   if (!isSignedIn) {
// // //     return (
// // //       <div className="flex items-center justify-center h-64">
// // //         <div className="text-center">
// // //           <p className="text-white">Please sign in to view your profile.</p>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <>
// // //       <EditProfileModal open={isModalOpen} onOpenChange={setIsModalOpen} />

// // //       <motion.div 
// // //         className="space-y-8" 
// // //         variants={containerVariants} 
// // //         initial="hidden" 
// // //         animate="visible"
// // //       >
// // //         {/* Header */}
// // //         <motion.div variants={itemVariants} className="text-center">
// // //           <h1 className="text-4xl font-extrabold text-blue-800 flex items-center justify-center gap-2">
// // //             <Sparkles className="w-8 h-8 text-blue-500" />
// // //             My Profile
// // //           </h1>
// // //           <p className="text-lg text-slate-600 mt-2">
// // //             Track your journey, showcase your achievements, and level up in Spark!
// // //           </p>
// // //         </motion.div>

// // //         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
// // //           {/* Profile Card (Spans 1 column) */}
// // //           <motion.div className="lg:col-span-1" variants={itemVariants}>
// // //             <Card className="bg-white/95 shadow-xl rounded-2xl overflow-hidden h-full border border-blue-100">
// // //               <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 flex flex-col items-center text-center relative">
// // //                 <motion.div 
// // //                   className="absolute top-0 right-0 p-2"
// // //                   initial={{ scale: 0 }}
// // //                   animate={{ scale: 1 }}
// // //                   transition={{ delay: 0.2 }}
// // //                 >
// // //                   <Trophy className="w-8 h-8 text-yellow-400" />
// // //                 </motion.div>
// // //                 <div className="relative">
// // //                   <Avatar className="h-32 w-32 mb-4 ring-4 ring-blue-300 ring-offset-4 ring-offset-transparent transition-all hover:scale-105">
// // //                     <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
// // //                     <AvatarFallback className="text-3xl bg-blue-200 text-blue-800">
// // //                       {user.fullName?.charAt(0) || user.primaryEmailAddress?.emailAddress?.charAt(0)}
// // //                     </AvatarFallback>
// // //                   </Avatar>
// // //                   <Badge 
// // //                     className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 ${getRankColor(userStats.rank)} text-white px-4 py-1 rounded-full shadow-md`}
// // //                   >
// // //                     {userStats.rank}
// // //                   </Badge>
// // //                 </div>
                
// // //                 <h2 className="text-3xl font-extrabold mt-4 text-blue-900">{user.fullName || 'New User'}</h2>
// // //                 <p className="text-slate-600 text-sm italic">{user.primaryEmailAddress?.emailAddress}</p>
                
// // //                 <div className="w-full mt-4">
// // //                   <Progress value={getNextRankProgress(userStats.totalPoints)} className="h-2 bg-blue-100" />
// // //                   <p className="text-sm text-blue-700 mt-1">Progress to next rank: {Math.round(getNextRankProgress(userStats.totalPoints))}%</p>
// // //                 </div>

// // //                 <div className="flex items-center justify-around w-full mt-4 text-sm">
// // //                   <div className="flex flex-col items-center">
// // //                     <Star className="w-5 h-5 text-amber-500" />
// // //                     <span className="font-bold text-blue-800">{userStats.totalPoints} pts</span>
// // //                   </div>
// // //                   <div className="flex flex-col items-center">
// // //                     <Calendar className="w-5 h-5 text-sky-500" />
// // //                     <span className="text-blue-800">Joined {new Date(userStats.joinDate).toLocaleDateString()}</span>
// // //                   </div>
// // //                 </div>
// // //               </div>

// // //               <CardContent className="p-6 bg-gradient-to-b from-white to-blue-50">
// // //                 <Button 
// // //                   onClick={() => setIsModalOpen(true)} 
// // //                   variant="default" 
// // //                   className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-shadow"
// // //                 >
// // //                   <Edit className="w-4 h-4 mr-2" />
// // //                   Edit Profile
// // //                 </Button>

// // //                 <Separator className="my-4 bg-blue-200" />
                
// // //                 {/* Profile Information */}
// // //                 <div className="space-y-6">
// // //                   {/* Primary Goal */}
// // //                   <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// // //                     <Target className="w-6 h-6 text-blue-600" />
// // //                     <p className="font-semibold text-blue-800">Primary Goal:</p>
// // //                     <p className="text-slate-700 text-center">
// // //                       {user.unsafeMetadata?.primaryGoal || (
// // //                         <Button variant="link" className="p-0 text-blue-600 hover:text-blue-800" onClick={() => setIsModalOpen(true)}>
// // //                           Set Your Goal Now
// // //                         </Button>
// // //                       )}
// // //                     </p>
// // //                   </div>

// // //                   {/* Bio */}
// // //                   {user.unsafeMetadata?.bio && (
// // //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// // //                       <FileText className="w-6 h-6 text-sky-500" />
// // //                       <p className="font-semibold text-blue-800">Bio:</p>
// // //                       <p className="text-slate-700 text-center text-sm">
// // //                         {user.unsafeMetadata.bio}
// // //                       </p>
// // //                     </div>
// // //                   )}

// // //                   {/* Job Title */}
// // //                   {user.unsafeMetadata?.jobTitle && (
// // //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// // //                       <Briefcase className="w-6 h-6 text-emerald-500" />
// // //                       <p className="font-semibold text-blue-800">Job Title:</p>
// // //                       <p className="text-slate-700 text-center">
// // //                         {user.unsafeMetadata.jobTitle}
// // //                         {user.unsafeMetadata.company && ` at ${user.unsafeMetadata.company}`}
// // //                       </p>
// // //                     </div>
// // //                   )}

// // //                   {/* Location */}
// // //                   {user.unsafeMetadata?.location && (
// // //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// // //                       <MapPin className="w-6 h-6 text-red-500" />
// // //                       <p className="font-semibold text-blue-800">Location:</p>
// // //                       <p className="text-slate-700 text-center">
// // //                         {user.unsafeMetadata.location}
// // //                       </p>
// // //                     </div>
// // //                   )}

// // //                   {/* Website */}
// // //                   {user.unsafeMetadata?.website && (
// // //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// // //                       <Globe className="w-6 h-6 text-cyan-500" />
// // //                       <p className="font-semibold text-blue-800">Website:</p>
// // //                       <a 
// // //                         href={user.unsafeMetadata.website} 
// // //                         target="_blank" 
// // //                         rel="noopener noreferrer"
// // //                         className="text-blue-600 hover:text-blue-800 text-center text-sm underline"
// // //                       >
// // //                         {user.unsafeMetadata.website}
// // //                       </a>
// // //                     </div>
// // //                   )}

// // //                   {/* Skills */}
// // //                   {user.unsafeMetadata?.skills && (
// // //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// // //                       <Star className="w-6 h-6 text-amber-500" />
// // //                       <p className="font-semibold text-blue-800">Skills:</p>
// // //                       <p className="text-slate-700 text-center text-sm">
// // //                         {user.unsafeMetadata.skills}
// // //                       </p>
// // //                     </div>
// // //                   )}

// // //                   {/* Interests */}
// // //                   {user.unsafeMetadata?.interests && (
// // //                     <div className="flex flex-col items-center gap-2 bg-blue-50 p-3 rounded-lg shadow-sm">
// // //                       <Heart className="w-6 h-6 text-pink-500" />
// // //                       <p className="font-semibold text-blue-800">Interests:</p>
// // //                       <p className="text-slate-700 text-center text-sm">
// // //                         {user.unsafeMetadata.interests}
// // //                       </p>
// // //                     </div>
// // //                   )}
// // //                 </div>
// // //               </CardContent>
// // //             </Card>
// // //           </motion.div>

// // //           <div className="lg:col-span-3 space-y-8">
// // //             {/* Statistics */}
// // //             <motion.div variants={itemVariants}>
// // //               <Card className="bg-white shadow-xl rounded-2xl overflow-hidden border-t-4 border-blue-500">
// // //                 <CardHeader className="bg-blue-50">
// // //                   <CardTitle className="flex items-center gap-2 text-blue-900 text-2xl">
// // //                     <TrendingUp className="w-7 h-7 text-blue-600" />
// // //                     Statistics
// // //                   </CardTitle>
// // //                   <CardDescription className="text-slate-600 text-lg">Your all-time progress and achievements.</CardDescription>
// // //                 </CardHeader>
// // //                 <CardContent className="p-6">
// // //                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
// // //                     <motion.div 
// // //                       className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg text-center hover:scale-105 transition-transform"
// // //                       whileHover={{ scale: 1.05 }}
// // //                     >
// // //                       <CheckSquare className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
// // //                       <p className="text-4xl font-bold text-emerald-700">{tasksCompleted}</p>
// // //                       <p className="text-base text-slate-600 mt-1">Tasks Completed</p>
// // //                     </motion.div>
// // //                     <motion.div 
// // //                       className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg text-center hover:scale-105 transition-transform"
// // //                       whileHover={{ scale: 1.05 }}
// // //                     >
// // //                       <Flame className="w-12 h-12 mx-auto mb-3 text-amber-500" />
// // //                       <p className="text-4xl font-bold text-amber-700">{habitStreak.count} Days</p>
// // //                       <p className="text-base text-slate-600 mt-1">Habit Streak</p>
// // //                     </motion.div>
// // //                     <motion.div 
// // //                       className="p-6 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 shadow-lg text-center hover:scale-105 transition-transform"
// // //                       whileHover={{ scale: 1.05 }}
// // //                     >
// // //                       <BookOpen className="w-12 h-12 mx-auto mb-3 text-sky-500" />
// // //                       <p className="text-4xl font-bold text-sky-700">{coursesFinished}</p>
// // //                       <p className="text-base text-slate-600 mt-1">Courses Finished</p>
// // //                     </motion.div>
// // //                   </div>
// // //                 </CardContent>
// // //               </Card>
// // //             </motion.div>

// // //             {/* Recent Activity */}
// // //             <motion.div variants={itemVariants}>
// // //               <Card className="bg-white shadow-xl rounded-2xl overflow-hidden border-t-4 border-blue-500">
// // //                 <CardHeader className="bg-blue-50">
// // //                   <CardTitle className="flex items-center gap-2 text-blue-900 text-2xl">
// // //                     <Activity className="w-7 h-7 text-blue-600" />
// // //                     Recent Activity
// // //                   </CardTitle>
// // //                   <CardDescription className="text-slate-600 text-lg">Your latest accomplishments and interactions.</CardDescription>
// // //                 </CardHeader>
// // //                 <CardContent className="p-6">
// // //                   {recentActivities.length > 0 ? (
// // //                     <div className="space-y-4">
// // //                       <AnimatePresence>
// // //                         {recentActivities.map((activity, index) => {
// // //                           const Icon = activityIcons[activity.type] || Activity;
// // //                           const color = activityColors[activity.type] || 'text-gray-400';
                          
// // //                           return (
// // //                             <motion.div
// // //                               key={activity.id}
// // //                               initial={{ opacity: 0, x: -20 }}
// // //                               animate={{ opacity: 1, x: 0 }}
// // //                               exit={{ opacity: 0, x: 20 }}
// // //                               transition={{ delay: index * 0.1 }}
// // //                               className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
// // //                             >
// // //                               <div className={`p-3 rounded-full bg-white shadow-md ${color}`}>
// // //                                 <Icon className="w-6 h-6" />
// // //                               </div>
// // //                               <div className="flex-1">
// // //                                 <p className="text-base font-medium text-blue-900">{activity.description}</p>
// // //                                 <p className="text-sm text-slate-600">
// // //                                   {formatTimeAgo(activity.timestamp)}
// // //                                 </p>
// // //                               </div>
// // //                               {activity.points && (
// // //                                 <Badge variant="secondary" className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
// // //                                   +{activity.points} pts
// // //                                 </Badge>
// // //                               )}
// // //                             </motion.div>
// // //                           );
// // //                         })}
// // //                       </AnimatePresence>
// // //                     </div>
// // //                   ) : (
// // //                     <div className="text-center py-12">
// // //                       <motion.div
// // //                         initial={{ scale: 0.8, opacity: 0 }}
// // //                         animate={{ scale: 1, opacity: 1 }}
// // //                         transition={{ duration: 0.5 }}
// // //                       >
// // //                         <Activity className="w-20 h-20 mx-auto mb-4 text-blue-300 animate-bounce" />
// // //                       </motion.div>
// // //                       <p className="text-blue-900 font-medium text-lg">No recent activity yet.</p>
// // //                       <p className="text-sm text-slate-600 mt-2">
// // //                         Dive into Spark and start building your streak today!
// // //                       </p>
// // //                     </div>
// // //                   )}
// // //                 </CardContent>
// // //               </Card>
// // //             </motion.div>
// // //           </div>
// // //         </div>
// // //       </motion.div>
// // //     </>
// // //   );
// // // }

// // // // 'use client';

// // // // import { useState, useEffect } from 'react';
// // // // import { useUser } from '@clerk/nextjs';
// // // // import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// // // // import { Button } from "@/components/ui/button";
// // // // import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// // // // import { Separator } from "@/components/ui/separator";
// // // // import { Badge } from "@/components/ui/badge";
// // // // import { Progress } from "@/components/ui/progress";
// // // // import { motion, AnimatePresence } from "framer-motion";
// // // // import { 
// // // //   BookOpen, 
// // // //   CheckSquare, 
// // // //   Edit, 
// // // //   Flame, 
// // // //   Target, 
// // // //   Calendar,
// // // //   Trophy,
// // // //   Activity,
// // // //   Palette,
// // // //   Brain,
// // // //   MessageCircle,
// // // //   FileText,
// // // //   Star,
// // // //   TrendingUp,
// // // //   MapPin,
// // // //   Briefcase,
// // // //   Globe,
// // // //   Phone,
// // // //   Heart,
// // // //   Sparkles
// // // // } from "lucide-react";
// // // // import EditProfileModal from './EditProfileModal';
// // // // import { taskApi } from "@/backend/lib/api"; // Your backend/api helper

// // // // // Animation variants
// // // // const containerVariants = {hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } }};
// // // // const itemVariants = {hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 }};

// // // // const activityIcons = {
// // // //   'task_completed': CheckSquare,
// // // //   'habit_streak': Flame,
// // // //   'course_finished': BookOpen,
// // // //   'chat_message': MessageCircle,
// // // //   'whiteboard_created': Palette,
// // // //   'mindmap_created': Brain,
// // // //   'goal_achieved': Trophy,
// // // //   'profile_updated': Edit,
// // // //   'daily_login': Calendar,
// // // //   'milestone_reached': Star
// // // // };
// // // // const activityColors = {
// // // //   'task_completed': 'text-emerald-400',
// // // //   'habit_streak': 'text-amber-400',
// // // //   'course_finished': 'text-sky-400',
// // // //   'chat_message': 'text-purple-400',
// // // //   'whiteboard_created': 'text-pink-400',
// // // //   'mindmap_created': 'text-cyan-400',
// // // //   'goal_achieved': 'text-yellow-400',
// // // //   'profile_updated': 'text-gray-400',
// // // //   'daily_login': 'text-indigo-400',
// // // //   'milestone_reached': 'text-blue-400'
// // // // };

// // // // function useUserData() {
// // // //   const [data, setData] = useState({ tasksCompleted: 0, habitStreak: { count: 0 }, coursesFinished: 0 });
// // // //   useEffect(() => {
// // // //     const storedData = JSON.parse(localStorage.getItem('user_data') || '{}');
// // // //     setData({
// // // //       tasksCompleted: storedData.tasksCompleted || 0,
// // // //       habitStreak: storedData.habitStreak || { count: 0 },
// // // //       coursesFinished: storedData.coursesFinished || 0
// // // //     });
// // // //   }, []);
// // // //   return data;
// // // // }

// // // // export default function ProfilePage() {
// // // //   const { user, isLoaded, isSignedIn } = useUser();
// // // //   const { tasksCompleted, habitStreak, coursesFinished } = useUserData();
// // // //   const [isModalOpen, setIsModalOpen] = useState(false);
// // // //   const [recentActivities, setRecentActivities] = useState([]);
// // // //   const [userStats, setUserStats] = useState({
// // // //     totalPoints: 0,
// // // //     rank: 'Beginner',
// // // //     joinDate: null,
// // // //     lastActive: null
// // // //   });
// // // //   const [tasks, setTasks] = useState([]);

// // // //   useEffect(() => {
// // // //     if (user) {
// // // //       fetchUserTasks();
// // // //       loadUserStats();
// // // //     }
// // // //   }, [user]);

// // // //   useEffect(() => {
// // // //     if (user && (isLoaded || tasks.length > 0)) {
// // // //       loadUserActivities();
// // // //     }
// // // //   }, [user, isLoaded, tasks]);

// // // //   useEffect(() => {
// // // //     if (isLoaded && user && isSignedIn) {
// // // //       if (!user.unsafeMetadata?.primaryGoal || !user.unsafeMetadata?.bio || !user.unsafeMetadata?.skills) {
// // // //         setIsModalOpen(true);
// // // //       }
// // // //     }
// // // //   }, [user, isLoaded, isSignedIn]);

// // // //   const fetchUserTasks = async () => {
// // // //     if (!user?.id) return;
// // // //     try {
// // // //       const res = await taskApi.getTasks({ userId: user.id });
// // // //       if (res.success && Array.isArray(res.data)) setTasks(res.data);
// // // //     } catch { setTasks([]); }
// // // //   };

// // // //   // Combine local activities with completed tasks as activities
// // // //   const loadUserActivities = () => {
// // // //     try {
// // // //       const activities = JSON.parse(localStorage.getItem('user_activities') || '[]')
// // // //         .filter(activity => activity.userId === user.id);
// // // //       const taskCompletions = tasks
// // // //         .filter(t => t.status === 'completed')
// // // //         .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
// // // //         .slice(0, 10)
// // // //         .map(task => ({
// // // //           id: `task-${task._id}`,
// // // //           userId: user.id,
// // // //           timestamp: task.completedAt || task.updatedAt || new Date().toISOString(),
// // // //           type: 'task_completed',
// // // //           description: `Completed task: ${task.title}`,
// // // //           points: 5
// // // //         }));
// // // //       const all = [...activities, ...taskCompletions]
// // // //         .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
// // // //         .slice(0, 10);
// // // //       setRecentActivities(all);
// // // //     } catch {
// // // //       setRecentActivities([]);
// // // //     }
// // // //   };

// // // //   const loadUserStats = () => {
// // // //     try {
// // // //       const stats = JSON.parse(localStorage.getItem('user_stats') || '{}');
// // // //       const userStatsData = stats[user.id] || {
// // // //         totalPoints: 0,
// // // //         rank: 'Beginner',
// // // //         joinDate: user.createdAt,
// // // //         lastActive: new Date().toISOString()
// // // //       };
// // // //       setUserStats(userStatsData);
// // // //     } catch { }
// // // //   };

// // // //   const getRankColor = (rank) => {
// // // //     const colors = {
// // // //       'Beginner': 'bg-gray-500',
// // // //       'Intermediate': 'bg-blue-500',
// // // //       'Advanced': 'bg-purple-500',
// // // //       'Expert': 'bg-yellow-500',
// // // //       'Master': 'bg-red-500'
// // // //     };
// // // //     return colors[rank] || 'bg-gray-500';
// // // //   };
// // // //   const getNextRankProgress = (points) => {
// // // //     if (points < 50) return (points / 50) * 100;
// // // //     if (points < 200) return (points / 200) * 100;
// // // //     if (points < 500) return (points / 500) * 100;
// // // //     if (points < 1000) return (points / 1000) * 100;
// // // //     return 100;
// // // //   };
// // // //   const formatTimeAgo = (timestamp) => {
// // // //     const now = new Date();
// // // //     const time = new Date(timestamp);
// // // //     const diffInSeconds = Math.floor((now - time) / 1000);
// // // //     if (diffInSeconds < 60) return 'Just now';
// // // //     if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
// // // //     if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
// // // //     if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
// // // //     return time.toLocaleDateString();
// // // //   };

// // // //   if (!isLoaded) return (
// // // //     <div className="flex items-center justify-center h-64">
// // // //       <div className="text-center">
// // // //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
// // // //         <p className="text-white">Loading profile...</p>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // //   if (!isSignedIn) return (
// // // //     <div className="flex items-center justify-center h-64">
// // // //       <div className="text-center">
// // // //         <p className="text-white">Please sign in to view your profile.</p>
// // // //       </div>
// // // //     </div>
// // // //   );

// // // //   return (
// // // //     <>
// // // //       <EditProfileModal open={isModalOpen} onOpenChange={setIsModalOpen} />
// // // //       {/* The rest of your ProfilePage JSX from your first code block...
// // // //           Use recentActivities as activity source for the recent activity section.
// // // //           All UI remains as in your original post! */}
       

// // // //       {/* --- SNIPPED for brevity (insert your detailed profile JSX here as in your initial component) --- */}
// // // //     </>
// // // //   );
// // // // }
