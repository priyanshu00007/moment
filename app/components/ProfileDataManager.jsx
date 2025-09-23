
import { Shield, Trophy, Star } from 'lucide-react';
class RankingSystem {
  static ranks = [
    {
      name: 'Bronze I',
      tier: 'Bronze',
      level: 1,
      minXP: 0,
      maxXP: 199,
      gradient: 'from-blue-600 to-blue-800',
      glowColor: 'shadow-blue-500/50',
      icon: 'Shield',
      iconColor: 'text-blue-300',
      description: 'Beginner'
    },
    {
      name: 'Bronze II',
      tier: 'Bronze',
      level: 2,
      minXP: 200,
      maxXP: 399,
      gradient: 'from-blue-600 to-blue-800',
      glowColor: 'shadow-blue-500/50',
      icon: 'Shield',
      iconColor: 'text-blue-300',
      description: 'Aspiring Achiever'
    },
    {
      name: 'Silver I',
      tier: 'Silver',
      level: 1,
      minXP: 400,
      maxXP: 799,
      gradient: 'from-gray-400 to-gray-600',
      glowColor: 'shadow-gray-500/50',
      icon: 'Trophy',
      iconColor: 'text-gray-300',
      description: 'Steady Progressor'
    },
    {
      name: 'Silver II',
      tier: 'Silver',
      level: 2,
      minXP: 800,
      maxXP: 1199,
      gradient: 'from-gray-400 to-gray-600',
      glowColor: 'shadow-gray-500/50',
      icon: 'Trophy',
      iconColor: 'text-gray-300',
      description: 'Consistent Worker'
    },
    {
      name: 'Gold I',
      tier: 'Gold',
      level: 1,
      minXP: 1200,
      maxXP: 1999,
      gradient: 'from-yellow-500 to-yellow-700',
      glowColor: 'shadow-yellow-500/50',
      icon: 'Star',
      iconColor: 'text-yellow-300',
      description: 'Productivity Star'
    },
    {
      name: 'Gold II',
      tier: 'Gold',
      level: 2,
      minXP: 2000,
      maxXP: 2999,
      gradient: 'from-yellow-500 to-yellow-700',
      glowColor: 'shadow-yellow-500/50',
      icon: 'Star',
      iconColor: 'text-yellow-300',
      description: 'Elite Performer'
    },
    {
      name: 'Platinum',
      tier: 'Platinum',
      level: 1,
      minXP: 3000,
      maxXP: 4999,
      gradient: 'from-blue-300 to-teal-500',
      glowColor: 'shadow-teal-500/50',
      icon: 'Star',
      iconColor: 'text-teal-300',
      description: 'Master of Focus'
    },
    {
      name: 'Diamond I',
      tier: 'Diamond',
      level: 1,
      minXP: 5000,
      maxXP: 7999,
      gradient: 'from-cyan-300 to-blue-500',
      glowColor: 'shadow-cyan-500/50',
      icon: 'Star',
      iconColor: 'text-cyan-300',
      description: 'Legendary Achiever'
    },
    {
      name: 'Diamond II',
      tier: 'Diamond',
      level: 2,
      minXP: 8000,
      maxXP: Infinity,
      gradient: 'from-cyan-300 to-blue-500',
      glowColor: 'shadow-cyan-500/50',
      icon: 'Star',
      iconColor: 'text-cyan-300',
      description: 'Ultimate Master'
    }
  ];

  static getRankByXP(xp) {
    return this.ranks.find(rank => xp >= rank.minXP && xp <= rank.maxXP) || this.ranks[0];
  }

  static getProgressToNextRank(xp) {
    const currentRank = this.getRankByXP(xp);
    const nextRankIndex = this.ranks.findIndex(rank => rank.name === currentRank.name) + 1;
    const nextRank = this.ranks[nextRankIndex];
    if (!nextRank) return { progress: 100, xpNeeded: 0, nextRank: null };
    const xpRange = nextRank.minXP - currentRank.minXP;
    const progress = ((xp - currentRank.minXP) / xpRange) * 100;
    return { progress: Math.min(progress, 100), xpNeeded: nextRank.minXP - xp, nextRank };
  }

  static getXPRewards(tier, activityType) {
    const rewards = {
      Bronze: {
        task_completed_low: 5,
        task_completed_medium: 10,
        task_completed_high: 15,
        focus_session_completed: 25,
        pomodoro_session_completed: 12,
        session_started: 2,
        daily_streak: 7
      },
      Silver: {
        task_completed_low: 7,
        task_completed_medium: 15,
        task_completed_high: 22,
        focus_session_completed: 37,
        pomodoro_session_completed: 17,
        session_started: 5,
        daily_streak: 12
      },
      Gold: {
        task_completed_low: 12,
        task_completed_medium: 25,
        task_completed_high: 37,
        focus_session_completed: 50,
        pomodoro_session_completed: 25,
        session_started: 7,
        daily_streak: 25
      },
      Platinum: {
        task_completed_low: 25,
        task_completed_medium: 50,
        task_completed_high: 75,
        focus_session_completed: 100,
        pomodoro_session_completed: 50,
        session_started: 12,
        daily_streak: 50
      },
      Diamond: {
        task_completed_low: 40,
        task_completed_medium: 80,
        task_completed_high: 120,
        focus_session_completed: 150,
        pomodoro_session_completed: 75,
        session_started: 20,
        daily_streak: 80
      }
    };
    return rewards[tier]?.[activityType] || 0;
  }
}

class ProfileDataManager {
  static storageKeys = {
    userStats: 'user_stats',
    focusStats: 'focus-sessions-data',
    pomodoroStats: 'pomodoro-sessions-data',
    taskAnalytics: 'tasks-analytics-data',
    userActivities: 'user-activities-data'
  };

  static getUserStats(userId) {
    try {
      const stats = JSON.parse(localStorage.getItem(this.storageKeys.userStats) || '{}');
      const userStats = stats[userId] || {
        totalPoints: 0,
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        achievements: [],
        badges: [],
        streakCount: 0,
        lastTaskCompletionDate: null,
        totalFocusTime: 0,
        totalSessions: 0,
        tasksCompleted: 0
      };
      const currentRank = RankingSystem.getRankByXP(userStats.totalPoints);
      userStats.rank = currentRank.name;
      userStats.tier = currentRank.tier;
      userStats.level = currentRank.level;
      return userStats;
    } catch (error) {
      console.error('Error loading user stats:', error);
      return {
        totalPoints: 0,
        rank: 'Bronze I',
        tier: 'Bronze',
        level: 1,
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        achievements: [],
        badges: [],
        streakCount: 0,
        lastTaskCompletionDate: null,
        totalFocusTime: 0,
        totalSessions: 0,
        tasksCompleted: 0
      };
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

  static updateStreak(userId) {
    try {
      const currentStats = this.getUserStats(userId);
      const today = new Date().toISOString().split('T')[0];
      const lastCompletion = currentStats.lastTaskCompletionDate
        ? new Date(currentStats.lastTaskCompletionDate).toISOString().split('T')[0]
        : null;

      let newStreakCount = currentStats.streakCount;
      if (!lastCompletion) {
        newStreakCount = 1;
      } else if (lastCompletion === today) {
        newStreakCount = currentStats.streakCount;
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (lastCompletion === yesterdayStr) {
          newStreakCount = currentStats.streakCount + 1;
        } else {
          newStreakCount = 1;
        }
      }

      const xpReward = RankingSystem.getXPRewards(currentStats.tier, 'daily_streak');
      const updatedStats = this.updateUserStats(userId, {
        streakCount: newStreakCount,
        lastTaskCompletionDate: new Date().toISOString(),
        totalPoints: currentStats.totalPoints + xpReward
      });

      this.logActivity(userId, {
        type: 'daily_streak',
        description: `Maintained a ${newStreakCount}-day streak`,
        points: xpReward
      });

      return updatedStats;
    } catch (error) {
      console.error('Error updating streak:', error);
      return this.getUserStats(userId);
    }
  }

  static logActivity(userId, activity) {
    try {
      const currentStats = this.getUserStats(userId);
      const currentRank = RankingSystem.getRankByXP(currentStats.totalPoints);
      const xpReward = RankingSystem.getXPRewards(currentRank.tier, activity.type);
      const updatedStats = this.updateUserStats(userId, {
        totalPoints: currentStats.totalPoints + xpReward
      });
      const newRank = RankingSystem.getRankByXP(updatedStats.totalPoints);
      const rankUp = newRank.name !== currentRank.name;
      if (rankUp) {
        const rankUpBonus = Math.floor(newRank.minXP * 0.05); // 5% rank-up bonus
        this.updateUserStats(userId, {
          totalPoints: updatedStats.totalPoints + rankUpBonus
        });
      }
      const activities = JSON.parse(localStorage.getItem(this.storageKeys.userActivities) || '[]');
      const newActivity = {
        id: Date.now().toString(),
        userId,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        points: xpReward,
        ...activity
      };
      activities.unshift(newActivity);
      localStorage.setItem(this.storageKeys.userActivities, JSON.stringify(activities.slice(0, 100)));
      return { activity: newActivity, xpReward, rankUp };
    } catch (error) {
      console.error('Error logging activity:', error);
      return { xpReward: 0, rankUp: false };
    }
  }

  static deductTaskXP(userId, taskId) {
    try {
      const currentStats = this.getUserStats(userId);
      const activities = JSON.parse(localStorage.getItem(this.storageKeys.userActivities) || '[]');
      const completionActivity = activities.find(
        activity => activity.taskId === taskId && activity.type.startsWith('task_completed_')
      );
      const originalXPReward = completionActivity ? completionActivity.points : 0;
      const deductionPercentage = 0.5;
      const xpToDeduct = Math.floor(originalXPReward * deductionPercentage);
      const newTotalPoints = Math.max(0, currentStats.totalPoints - xpToDeduct);
      const updatedStats = this.updateUserStats(userId, {
        totalPoints: newTotalPoints
      });

      const newActivity = {
        id: Date.now().toString(),
        userId,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        points: -xpToDeduct,
        type: 'task_uncompleted',
        taskId,
        description: `Uncompleted task, deducted ${xpToDeduct} XP`
      };
      activities.unshift(newActivity);
      localStorage.setItem(this.storageKeys.userActivities, JSON.stringify(activities.slice(0, 100)));
      return updatedStats;
    } catch (error) {
      console.error('Error deducting XP for uncompleted task:', error);
      return this.getUserStats(userId);
    }
  }
}

export { ProfileDataManager, RankingSystem };
// class RankingSystem {
//   static ranks = [
//     {
//       name: 'Bronze I',
//       tier: 'Bronze',
//       level: 1,
//       minXP: 0,
//       maxXP: 199,
//       gradient: 'from-blue-600 to-blue-800',
//       glowColor: 'shadow-blue-500/50',
//       icon: Shield,
//       iconColor: 'text-blue-300',
//       description: 'Beginner'
//     },
//     {
//       name: 'Bronze II',
//       tier: 'Bronze',
//       level: 2,
//       minXP: 200,
//       maxXP: 399,
//       gradient: 'from-blue-600 to-blue-800',
//       glowColor: 'shadow-blue-500/50',
//       icon: Shield,
//       iconColor: 'text-blue-300',
//       description: 'Aspiring Achiever'
//     },
//     {
//       name: 'Silver I',
//       tier: 'Silver',
//       level: 1,
//       minXP: 400,
//       maxXP: 799,
//       gradient: 'from-gray-400 to-gray-600',
//       glowColor: 'shadow-gray-500/50',
//       icon: Trophy,
//       iconColor: 'text-gray-300',
//       description: 'Steady Progressor'
//     },
//     {
//       name: 'Silver II',
//       tier: 'Silver',
//       level: 2,
//       minXP: 800,
//       maxXP: 1199,
//       gradient: 'from-gray-400 to-gray-600',
//       glowColor: 'shadow-gray-500/50',
//       icon: Trophy,
//       iconColor: 'text-gray-300',
//       description: 'Consistent Worker'
//     },
//     {
//       name: 'Gold I',
//       tier: 'Gold',
//       level: 1,
//       minXP: 1200,
//       maxXP: 1999,
//       gradient: 'from-yellow-500 to-yellow-700',
//       glowColor: 'shadow-yellow-500/50',
//       icon: Star,
//       iconColor: 'text-yellow-300',
//       description: 'Productivity Star'
//     },
//     {
//       name: 'Gold II',
//       tier: 'Gold',
//       level: 2,
//       minXP: 2000,
//       maxXP: 2999,
//       gradient: 'from-yellow-500 to-yellow-700',
//       glowColor: 'shadow-yellow-500/50',
//       icon: Star,
//       iconColor: 'text-yellow-300',
//       description: 'Elite Performer'
//     },
//     {
//       name: 'Platinum',
//       tier: 'Platinum',
//       level: 1,
//       minXP: 3000,
//       maxXP: 4999,
//       gradient: 'from-blue-300 to-teal-500',
//       glowColor: 'shadow-teal-500/50',
//       icon: Star,
//       iconColor: 'text-teal-300',
//       description: 'Master of Focus'
//     },
//     {
//       name: 'Diamond I',
//       tier: 'Diamond',
//       level: 1,
//       minXP: 5000,
//       maxXP: 7999,
//       gradient: 'from-cyan-300 to-blue-500',
//       glowColor: 'shadow-cyan-500/50',
//       icon: Star,
//       iconColor: 'text-cyan-300',
//       description: 'Legendary Achiever'
//     },
//     {
//       name: 'Diamond II',
//       tier: 'Diamond',
//       level: 2,
//       minXP: 8000,
//       maxXP: Infinity,
//       gradient: 'from-cyan-300 to-blue-500',
//       glowColor: 'shadow-cyan-500/50',
//       icon: Star,
//       iconColor: 'text-cyan-300',
//       description: 'Ultimate Master'
//     }
//   ];

//   static getRankByXP(xp) {
//     return this.ranks.find(rank => xp >= rank.minXP && xp <= rank.maxXP) || this.ranks[0];
//   }

//   static getProgressToNextRank(xp) {
//     const currentRank = this.getRankByXP(xp);
//     const nextRankIndex = this.ranks.findIndex(rank => rank.name === currentRank.name) + 1;
//     const nextRank = this.ranks[nextRankIndex];
//     if (!nextRank) return { progress: 100, xpNeeded: 0, nextRank: null };
//     const xpRange = nextRank.minXP - currentRank.minXP;
//     const progress = ((xp - currentRank.minXP) / xpRange) * 100;
//     return { progress: Math.min(progress, 100), xpNeeded: nextRank.minXP - xp, nextRank };
//   }

//   static getXPRewards(tier, activityType) {
//     const rewards = {
//       Bronze: {
//         task_completed_low: 5,
//         task_completed_medium: 10,
//         task_completed_high: 15,
//         focus_session_completed: 25,
//         pomodoro_session_completed: 12,
//         session_started: 2,
//         daily_streak: 7
//       },
//       Silver: {
//         task_completed_low: 7,
//         task_completed_medium: 15,
//         task_completed_high: 22,
//         focus_session_completed: 37,
//         pomodoro_session_completed: 17,
//         session_started: 5,
//         daily_streak: 12
//       },
//       Gold: {
//         task_completed_low: 12,
//         task_completed_medium: 25,
//         task_completed_high: 37,
//         focus_session_completed: 50,
//         pomodoro_session_completed: 25,
//         session_started: 7,
//         daily_streak: 25
//       },
//       Platinum: {
//         task_completed_low: 25,
//         task_completed_medium: 50,
//         task_completed_high: 75,
//         focus_session_completed: 100,
//         pomodoro_session_completed: 50,
//         session_started: 12,
//         daily_streak: 50
//       },
//       Diamond: {
//         task_completed_low: 40,
//         task_completed_medium: 80,
//         task_completed_high: 120,
//         focus_session_completed: 150,
//         pomodoro_session_completed: 75,
//         session_started: 20,
//         daily_streak: 80
//       }
//     };
//     return rewards[tier]?.[activityType] || 0;
//   }
// }

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
//         lastTaskCompletionDate: null,
//         totalFocusTime: 0,
//         totalSessions: 0,
//         tasksCompleted: 0
//       };
//       userStats.totalFocusTime = dashboardData.totalActiveTime || 0;
//       userStats.totalSessions = (dashboardData.totalFocusSessions || 0) + (dashboardData.totalPomodoroSessions || 0);
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
//         lastTaskCompletionDate: null,
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
//       const updatedStats = { ...currentStats, ...updates, lastActive: new Date().toISOString() };
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

//   static updateStreak(userId) {
//     try {
//       const currentStats = this.getUserStats(userId);
//       const today = new Date().toISOString().split('T')[0];
//       const lastCompletion = currentStats.lastTaskCompletionDate
//         ? new Date(currentStats.lastTaskCompletionDate).toISOString().split('T')[0]
//         : null;

//       let newStreakCount = currentStats.streakCount;
//       if (!lastCompletion) {
//         newStreakCount = 1;
//       } else if (lastCompletion === today) {
//         newStreakCount = currentStats.streakCount;
//       } else {
//         const yesterday = new Date();
//         yesterday.setDate(yesterday.getDate() - 1);
//         const yesterdayStr = yesterday.toISOString().split('T')[0];
//         if (lastCompletion === yesterdayStr) {
//           newStreakCount = currentStats.streakCount + 1;
//         } else {
//           newStreakCount = 1;
//         }
//       }

//       const xpReward = RankingSystem.getXPRewards(currentStats.tier, 'daily_streak');
//       const updatedStats = this.updateUserStats(userId, {
//         streakCount: newStreakCount,
//         lastTaskCompletionDate: new Date().toISOString(),
//         totalPoints: currentStats.totalPoints + xpReward
//       });

//       this.logActivity(userId, {
//         type: 'daily_streak',
//         description: `Maintained a ${newStreakCount}-day streak`,
//         points: xpReward
//       });

//       return updatedStats;
//     } catch (error) {
//       console.error('Error updating streak:', error);
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
//         const rankUpBonus = Math.floor(newRank.minXP * 0.05); // 5% rank-up bonus
//         this.updateUserStats(userId, {
//           totalPoints: updatedStats.totalPoints + rankUpBonus
//         });
//       }
//       const activities = JSON.parse(localStorage.getItem(this.storageKeys.userActivities) || '[]');
//       const newActivity = {
//         id: Date.now().toString(),
//         userId,
//         timestamp: new Date().toISOString(),
//         date: new Date().toISOString().split('T')[0],
//         points: xpReward, // Store exact XP awarded
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

//   static deductTaskXP(userId, taskId) {
//     try {
//       const currentStats = this.getUserStats(userId);
//       const activities = JSON.parse(localStorage.getItem(this.storageKeys.userActivities) || '[]');
//       // Find the task completion activity
//       const completionActivity = activities.find(
//         activity => activity.taskId === taskId && activity.type.startsWith('task_completed_')
//       );
//       const originalXPReward = completionActivity ? completionActivity.points : 0;
//       const deductionPercentage = 0.5; // Deduct 50% of original XP
//       const xpToDeduct = Math.floor(originalXPReward * deductionPercentage);
//       const newTotalPoints = Math.max(0, currentStats.totalPoints - xpToDeduct); // Prevent negative XP
//       const updatedStats = this.updateUserStats(userId, {
//         totalPoints: newTotalPoints
//       });

//       const newActivity = {
//         id: Date.now().toString(),
//         userId,
//         timestamp: new Date().toISOString(),
//         date: new Date().toISOString().split('T')[0],
//         points: -xpToDeduct,
//         type: 'task_uncompleted',
//         taskId,
//         description: `Uncompleted task, deducted ${xpToDeduct} XP`
//       };
//       activities.unshift(newActivity);
//       localStorage.setItem(this.storageKeys.userActivities, JSON.stringify(activities.slice(0, 100)));
//       return updatedStats;
//     } catch (error) {
//       console.error('Error deducting XP for uncompleted task:', error);
//       return this.getUserStats(userId);
//     }
//   }

//   static getDashboardData() {
//     try {
//       const focusData = JSON.parse(localStorage.getItem(this.storageKeys.focusStats) || '[]');
//       const pomodoroData = JSON.parse(localStorage.getItem(this.storageKeys.pomodoroStats) || '[]');
//       const taskData = JSON.parse(localStorage.getItem(this.storageKeys.taskAnalytics) || '[]');
//       let totalActiveTime = 0,
//         totalFocusSessions = 0,
//         totalPomodoroSessions = 0,
//         totalTasksCompleted = 0;
//       focusData.forEach((session) => {
//         if (session.duration) totalActiveTime += Math.floor(session.duration / 60);
//         if (session.completed !== false) totalFocusSessions += 1;
//       });
//       pomodoroData.forEach((session) => {
//         if (session.duration && session.type === 'work') totalActiveTime += Math.floor(session.duration / 60);
//         if (session.completed !== false && session.type === 'work') totalPomodoroSessions += 1;
//       });
//       taskData.forEach((activity) => {
//         if (activity.type === 'task_completed') totalTasksCompleted += 1;
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

// export { ProfileDataManager, RankingSystem };

// import { Shield, Trophy, Star } from 'lucide-react';

// class RankingSystem {
//   static ranks = [
//     {
//       name: 'Bronze I',
//       tier: 'Bronze',
//       level: 1,
//       minXP: 0,
//       maxXP: 199,
//       gradient: 'from-blue-600 to-blue-800',
//       glowColor: 'shadow-blue-500/50',
//       icon: Shield,
//       iconColor: 'text-blue-300',
//       description: 'Beginner'
//     },
//     {
//       name: 'Bronze II',
//       tier: 'Bronze',
//       level: 2,
//       minXP: 200,
//       maxXP: 399,
//       gradient: 'from-blue-600 to-blue-800',
//       glowColor: 'shadow-blue-500/50',
//       icon: Shield,
//       iconColor: 'text-blue-300',
//       description: 'Aspiring Achiever'
//     },
//     {
//       name: 'Silver I',
//       tier: 'Silver',
//       level: 1,
//       minXP: 400,
//       maxXP: 799,
//       gradient: 'from-gray-400 to-gray-600',
//       glowColor: 'shadow-gray-500/50',
//       icon: Trophy,
//       iconColor: 'text-gray-300',
//       description: 'Steady Progressor'
//     },
//     {
//       name: 'Silver II',
//       tier: 'Silver',
//       level: 2,
//       minXP: 800,
//       maxXP: 1199,
//       gradient: 'from-gray-400 to-gray-600',
//       glowColor: 'shadow-gray-500/50',
//       icon: Trophy,
//       iconColor: 'text-gray-300',
//       description: 'Consistent Worker'
//     },
//     {
//       name: 'Gold I',
//       tier: 'Gold',
//       level: 1,
//       minXP: 1200,
//       maxXP: 1999,
//       gradient: 'from-yellow-500 to-yellow-700',
//       glowColor: 'shadow-yellow-500/50',
//       icon: Star,
//       iconColor: 'text-yellow-300',
//       description: 'Productivity Star'
//     },
//     {
//       name: 'Gold II',
//       tier: 'Gold',
//       level: 2,
//       minXP: 2000,
//       maxXP: 2999,
//       gradient: 'from-yellow-500 to-yellow-700',
//       glowColor: 'shadow-yellow-500/50',
//       icon: Star,
//       iconColor: 'text-yellow-300',
//       description: 'Elite Performer'
//     },
//     {
//       name: 'Platinum',
//       tier: 'Platinum',
//       level: 1,
//       minXP: 3000,
//       maxXP: 4999,
//       gradient: 'from-blue-300 to-teal-500',
//       glowColor: 'shadow-teal-500/50',
//       icon: Star,
//       iconColor: 'text-teal-300',
//       description: 'Master of Focus'
//     },
//     {
//       name: 'Diamond I',
//       tier: 'Diamond',
//       level: 1,
//       minXP: 5000,
//       maxXP: 7999,
//       gradient: 'from-cyan-300 to-blue-500',
//       glowColor: 'shadow-cyan-500/50',
//       icon: Star,
//       iconColor: 'text-cyan-300',
//       description: 'Legendary Achiever'
//     },
//     {
//       name: 'Diamond II',
//       tier: 'Diamond',
//       level: 2,
//       minXP: 8000,
//       maxXP: Infinity,
//       gradient: 'from-cyan-300 to-blue-500',
//       glowColor: 'shadow-cyan-500/50',
//       icon: Star,
//       iconColor: 'text-cyan-300',
//       description: 'Ultimate Master'
//     }
//   ];

//   static getRankByXP(xp) {
//     return this.ranks.find(rank => xp >= rank.minXP && xp <= rank.maxXP) || this.ranks[0];
//   }

//   static getProgressToNextRank(xp) {
//     const currentRank = this.getRankByXP(xp);
//     const nextRankIndex = this.ranks.findIndex(rank => rank.name === currentRank.name) + 1;
//     const nextRank = this.ranks[nextRankIndex];
//     if (!nextRank) return { progress: 100, xpNeeded: 0, nextRank: null };
//     const xpRange = nextRank.minXP - currentRank.minXP;
//     const progress = ((xp - currentRank.minXP) / xpRange) * 100;
//     return { progress: Math.min(progress, 100), xpNeeded: nextRank.minXP - xp, nextRank };
//   }

//   static getXPRewards(tier, activityType) {
//     const rewards = {
//       Bronze: {
//         task_completed_low: 5,
//         task_completed_medium: 10,
//         task_completed_high: 15,
//         focus_session_completed: 25,
//         pomodoro_session_completed: 12,
//         session_started: 2,
//         daily_streak: 7
//       },
//       Silver: {
//         task_completed_low: 7,
//         task_completed_medium: 15,
//         task_completed_high: 22,
//         focus_session_completed: 37,
//         pomodoro_session_completed: 17,
//         session_started: 5,
//         daily_streak: 12
//       },
//       Gold: {
//         task_completed_low: 12,
//         task_completed_medium: 25,
//         task_completed_high: 37,
//         focus_session_completed: 50,
//         pomodoro_session_completed: 25,
//         session_started: 7,
//         daily_streak: 25
//       },
//       Platinum: {
//         task_completed_low: 25,
//         task_completed_medium: 50,
//         task_completed_high: 75,
//         focus_session_completed: 100,
//         pomodoro_session_completed: 50,
//         session_started: 12,
//         daily_streak: 50
//       },
//       Diamond: {
//         task_completed_low: 40,
//         task_completed_medium: 80,
//         task_completed_high: 120,
//         focus_session_completed: 150,
//         pomodoro_session_completed: 75,
//         session_started: 20,
//         daily_streak: 80
//       }
//     };
//     return rewards[tier]?.[activityType] || 0;
//   }
// }

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
//         lastTaskCompletionDate: null,
//         totalFocusTime: 0,
//         totalSessions: 0,
//         tasksCompleted: 0
//       };
//       userStats.totalFocusTime = dashboardData.totalActiveTime || 0;
//       userStats.totalSessions = (dashboardData.totalFocusSessions || 0) + (dashboardData.totalPomodoroSessions || 0);
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
//         lastTaskCompletionDate: null,
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
//       const updatedStats = { ...currentStats, ...updates, lastActive: new Date().toISOString() };
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

//   static updateStreak(userId) {
//     try {
//       const currentStats = this.getUserStats(userId);
//       const today = new Date().toISOString().split('T')[0];
//       const lastCompletion = currentStats.lastTaskCompletionDate
//         ? new Date(currentStats.lastTaskCompletionDate).toISOString().split('T')[0]
//         : null;

//       let newStreakCount = currentStats.streakCount;
//       if (!lastCompletion) {
//         newStreakCount = 1;
//       } else if (lastCompletion === today) {
//         newStreakCount = currentStats.streakCount;
//       } else {
//         const yesterday = new Date();
//         yesterday.setDate(yesterday.getDate() - 1);
//         const yesterdayStr = yesterday.toISOString().split('T')[0];
//         if (lastCompletion === yesterdayStr) {
//           newStreakCount = currentStats.streakCount + 1;
//         } else {
//           newStreakCount = 1;
//         }
//       }

//       const xpReward = RankingSystem.getXPRewards(currentStats.tier, 'daily_streak');
//       const updatedStats = this.updateUserStats(userId, {
//         streakCount: newStreakCount,
//         lastTaskCompletionDate: new Date().toISOString(),
//         totalPoints: currentStats.totalPoints + xpReward
//       });

//       this.logActivity(userId, {
//         type: 'daily_streak',
//         description: `Maintained a ${newStreakCount}-day streak`
//       });

//       return updatedStats;
//     } catch (error) {
//       console.error('Error updating streak:', error);
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
//         const rankUpBonus = Math.floor(newRank.minXP * 0.05); // Reduced to 5%
//         this.updateUserStats(userId, {
//           totalPoints: updatedStats.totalPoints + rankUpBonus
//         });
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

//   static deductTaskXP(userId, taskId, priority) {
//     try {
//       const currentStats = this.getUserStats(userId);
//       const currentRank = RankingSystem.getRankByXP(currentStats.totalPoints);
//       const originalXPReward = RankingSystem.getXPRewards(currentRank.tier, `task_completed_${priority}`);
//       const deductionPercentage = 0.5; // Deduct 50% of original XP
//       const xpToDeduct = Math.floor(originalXPReward * deductionPercentage);
//       const newTotalPoints = Math.max(0, currentStats.totalPoints - xpToDeduct); // Prevent negative XP
//       const updatedStats = this.updateUserStats(userId, {
//         totalPoints: newTotalPoints
//       });

//       const activities = JSON.parse(localStorage.getItem(this.storageKeys.userActivities) || '[]');
//       const newActivity = {
//         id: Date.now().toString(),
//         userId,
//         timestamp: new Date().toISOString(),
//         date: new Date().toISOString().split('T')[0],
//         points: -xpToDeduct,
//         type: 'task_uncompleted',
//         taskId,
//         description: `Uncompleted task, deducted ${xpToDeduct} XP`
//       };
//       activities.unshift(newActivity);
//       localStorage.setItem(this.storageKeys.userActivities, JSON.stringify(activities.slice(0, 100)));
//       return updatedStats;
//     } catch (error) {
//       console.error('Error deducting XP for uncompleted task:', error);
//       return this.getUserStats(userId);
//     }
//   }

//   static getDashboardData() {
//     try {
//       const focusData = JSON.parse(localStorage.getItem(this.storageKeys.focusStats) || '[]');
//       const pomodoroData = JSON.parse(localStorage.getItem(this.storageKeys.pomodoroStats) || '[]');
//       const taskData = JSON.parse(localStorage.getItem(this.storageKeys.taskAnalytics) || '[]');
//       let totalActiveTime = 0,
//         totalFocusSessions = 0,
//         totalPomodoroSessions = 0,
//         totalTasksCompleted = 0;
//       focusData.forEach((session) => {
//         if (session.duration) totalActiveTime += Math.floor(session.duration / 60);
//         if (session.completed !== false) totalFocusSessions += 1;
//       });
//       pomodoroData.forEach((session) => {
//         if (session.duration && session.type === 'work') totalActiveTime += Math.floor(session.duration / 60);
//         if (session.completed !== false && session.type === 'work') totalPomodoroSessions += 1;
//       });
//       taskData.forEach((activity) => {
//         if (activity.type === 'task_completed') totalTasksCompleted += 1;
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

// export { ProfileDataManager, RankingSystem };

// // import { Shield, Trophy, Star } from 'lucide-react';

// // class RankingSystem {
// //   static ranks = [
// //     { name: 'Bronze I', tier: 'Bronze', level: 1, minXP: 0, maxXP: 99, gradient: 'from-blue-600 to-blue-800', glowColor: 'shadow-blue-500/50', icon: Shield, iconColor: 'text-blue-300', description: 'Beginner' },
// //     { name: 'Bronze II', tier: 'Bronze', level: 2, minXP: 100, maxXP: 199, gradient: 'from-blue-600 to-blue-800', glowColor: 'shadow-blue-500/50', icon: Shield, iconColor: 'text-blue-300', description: 'Aspiring Achiever' },
// //     { name: 'Silver I', tier: 'Silver', level: 1, minXP: 200, maxXP: 399, gradient: 'from-gray-400 to-gray-600', glowColor: 'shadow-gray-500/50', icon: Trophy, iconColor: 'text-gray-300', description: 'Steady Progressor' },
// //     { name: 'Silver II', tier: 'Silver', level: 2, minXP: 400, maxXP: 599, gradient: 'from-gray-400 to-gray-600', glowColor: 'shadow-gray-500/50', icon: Trophy, iconColor: 'text-gray-300', description: 'Consistent Worker' },
// //     { name: 'Gold I', tier: 'Gold', level: 1, minXP: 600, maxXP: 999, gradient: 'from-yellow-500 to-yellow-700', glowColor: 'shadow-yellow-500/50', icon: Star, iconColor: 'text-yellow-300', description: 'Productivity Star' },
// //     { name: 'Gold II', tier: 'Gold', level: 2, minXP: 1000, maxXP: 1499, gradient: 'from-yellow-500 to-yellow-700', glowColor: 'shadow-yellow-500/50', icon: Star, iconColor: 'text-yellow-300', description: 'Elite Performer' },
// //     { name: 'Platinum', tier: 'Platinum', level: 1, minXP: 1500, maxXP: Infinity, gradient: 'from-blue-300 to-teal-500', glowColor: 'shadow-teal-500/50', icon: Star, iconColor: 'text-teal-300', description: 'Master of Focus' },
// //   ];

// //   static getRankByXP(xp) {
// //     return this.ranks.find(rank => xp >= rank.minXP && xp <= rank.maxXP) || this.ranks[0];
// //   }

// //   static getProgressToNextRank(xp) {
// //     const currentRank = this.getRankByXP(xp);
// //     const nextRankIndex = this.ranks.findIndex(rank => rank.name === currentRank.name) + 1;
// //     const nextRank = this.ranks[nextRankIndex];
// //     if (!nextRank) return { progress: 100, xpNeeded: 0, nextRank: null };
// //     const xpRange = nextRank.minXP - currentRank.minXP;
// //     const progress = ((xp - currentRank.minXP) / xpRange) * 100;
// //     return { progress: Math.min(progress, 100), xpNeeded: nextRank.minXP - xp, nextRank };
// //   }

// //   static getXPRewards(tier, activityType) {
// //     const rewards = {
// //       Bronze: { task_completed_low: 10, task_completed_medium: 20, task_completed_high: 30, focus_session_completed: 50, pomodoro_session_completed: 25, session_started: 5, daily_streak: 15 },
// //       Silver: { task_completed_low: 15, task_completed_medium: 30, task_completed_high: 45, focus_session_completed: 75, pomodoro_session_completed: 35, session_started: 10, daily_streak: 25 },
// //       Gold: { task_completed_low: 25, task_completed_medium: 50, task_completed_high: 75, focus_session_completed: 100, pomodoro_session_completed: 50, session_started: 15, daily_streak: 50 },
// //       Platinum: { task_completed_low: 50, task_completed_medium: 100, task_completed_high: 150, focus_session_completed: 200, pomodoro_session_completed: 100, session_started: 25, daily_streak: 100 },
// //     };
// //     return rewards[tier]?.[activityType] || 0;
// //   }
// // }

// // class ProfileDataManager {
// //   static storageKeys = {
// //     userStats: 'user_stats',
// //     focusStats: 'focus-sessions-data',
// //     pomodoroStats: 'pomodoro-sessions-data',
// //     taskAnalytics: 'tasks-analytics-data',
// //     userActivities: 'user-activities-data',
// //   };

// //   static getUserStats(userId) {
// //     try {
// //       const stats = JSON.parse(localStorage.getItem(this.storageKeys.userStats) || '{}');
// //       const dashboardData = this.getDashboardData();
// //       const userStats = stats[userId] || {
// //         totalPoints: 0,
// //         joinDate: new Date().toISOString(),
// //         lastActive: new Date().toISOString(),
// //         achievements: [],
// //         badges: [],
// //         streakCount: 0,
// //         lastTaskCompletionDate: null,
// //         totalFocusTime: 0,
// //         totalSessions: 0,
// //         tasksCompleted: 0,
// //       };
// //       userStats.totalFocusTime = dashboardData.totalActiveTime || 0;
// //       userStats.totalSessions = (dashboardData.totalFocusSessions || 0) + (dashboardData.totalPomodoroSessions || 0);
// //       userStats.tasksCompleted = dashboardData.totalTasksCompleted || 0;
// //       const currentRank = RankingSystem.getRankByXP(userStats.totalPoints);
// //       userStats.rank = currentRank.name;
// //       userStats.tier = currentRank.tier;
// //       userStats.level = currentRank.level;
// //       return userStats;
// //     } catch (error) {
// //       console.error('Error loading user stats:', error);
// //       return {
// //         totalPoints: 0,
// //         rank: 'Bronze I',
// //         tier: 'Bronze',
// //         level: 1,
// //         joinDate: new Date().toISOString(),
// //         lastActive: new Date().toISOString(),
// //         achievements: [],
// //         badges: [],
// //         streakCount: 0,
// //         lastTaskCompletionDate: null,
// //         totalFocusTime: 0,
// //         totalSessions: 0,
// //         tasksCompleted: 0,
// //       };
// //     }
// //   }

// //   static updateUserStats(userId, updates) {
// //     try {
// //       const allStats = JSON.parse(localStorage.getItem(this.storageKeys.userStats) || '{}');
// //       const currentStats = allStats[userId] || this.getUserStats(userId);
// //       const updatedStats = { ...currentStats, ...updates, lastActive: new Date().toISOString() };
// //       const newRank = RankingSystem.getRankByXP(updatedStats.totalPoints);
// //       updatedStats.rank = newRank.name;
// //       updatedStats.tier = newRank.tier;
// //       updatedStats.level = newRank.level;
// //       allStats[userId] = updatedStats;
// //       localStorage.setItem(this.storageKeys.userStats, JSON.stringify(allStats));
// //       return updatedStats;
// //     } catch (error) {
// //       console.error('Error updating user stats:', error);
// //       return this.getUserStats(userId);
// //     }
// //   }

// //   static updateStreak(userId) {
// //     try {
// //       const currentStats = this.getUserStats(userId);
// //       const today = new Date().toISOString().split('T')[0];
// //       const lastCompletion = currentStats.lastTaskCompletionDate
// //         ? new Date(currentStats.lastTaskCompletionDate).toISOString().split('T')[0]
// //         : null;

// //       let newStreakCount = currentStats.streakCount;
// //       if (!lastCompletion) {
// //         newStreakCount = 1;
// //       } else if (lastCompletion === today) {
// //         newStreakCount = currentStats.streakCount;
// //       } else {
// //         const yesterday = new Date();
// //         yesterday.setDate(yesterday.getDate() - 1);
// //         const yesterdayStr = yesterday.toISOString().split('T')[0];
// //         if (lastCompletion === yesterdayStr) {
// //           newStreakCount = currentStats.streakCount + 1;
// //         } else {
// //           newStreakCount = 1;
// //         }
// //       }

// //       const xpReward = RankingSystem.getXPRewards(currentStats.tier, 'daily_streak');
// //       const updatedStats = this.updateUserStats(userId, {
// //         streakCount: newStreakCount,
// //         lastTaskCompletionDate: new Date().toISOString(),
// //         totalPoints: currentStats.totalPoints + xpReward,
// //       });

// //       this.logActivity(userId, {
// //         type: 'daily_streak',
// //         description: `Maintained a ${newStreakCount}-day streak`,
// //       });

// //       return updatedStats;
// //     } catch (error) {
// //       console.error('Error updating streak:', error);
// //       return this.getUserStats(userId);
// //     }
// //   }

// //   static logActivity(userId, activity) {
// //     try {
// //       const currentStats = this.getUserStats(userId);
// //       const currentRank = RankingSystem.getRankByXP(currentStats.totalPoints);
// //       const xpReward = RankingSystem.getXPRewards(currentRank.tier, activity.type);
// //       const updatedStats = this.updateUserStats(userId, { totalPoints: currentStats.totalPoints + xpReward });
// //       const newRank = RankingSystem.getRankByXP(updatedStats.totalPoints);
// //       const rankUp = newRank.name !== currentRank.name;
// //       if (rankUp) {
// //         const rankUpBonus = Math.floor(newRank.minXP * 0.1);
// //         this.updateUserStats(userId, { totalPoints: updatedStats.totalPoints + rankUpBonus });
// //       }
// //       const activities = JSON.parse(localStorage.getItem(this.storageKeys.userActivities) || '[]');
// //       const newActivity = {
// //         id: Date.now().toString(),
// //         userId,
// //         timestamp: new Date().toISOString(),
// //         date: new Date().toISOString().split('T')[0],
// //         points: xpReward,
// //         ...activity,
// //       };
// //       activities.unshift(newActivity);
// //       localStorage.setItem(this.storageKeys.userActivities, JSON.stringify(activities.slice(0, 100)));
// //       return { activity: newActivity, xpReward, rankUp };
// //     } catch (error) {
// //       console.error('Error logging activity:', error);
// //       return { xpReward: 0, rankUp: false };
// //     }
// //   }

// //   static getDashboardData() {
// //     try {
// //       const focusData = JSON.parse(localStorage.getItem(this.storageKeys.focusStats) || '[]');
// //       const pomodoroData = JSON.parse(localStorage.getItem(this.storageKeys.pomodoroStats) || '[]');
// //       const taskData = JSON.parse(localStorage.getItem(this.storageKeys.taskAnalytics) || '[]');
// //       let totalActiveTime = 0,
// //         totalFocusSessions = 0,
// //         totalPomodoroSessions = 0,
// //         totalTasksCompleted = 0;
// //       focusData.forEach((session) => {
// //         if (session.duration) totalActiveTime += Math.floor(session.duration / 60);
// //         if (session.completed !== false) totalFocusSessions += 1;
// //       });
// //       pomodoroData.forEach((session) => {
// //         if (session.duration && session.type === 'work') totalActiveTime += Math.floor(session.duration / 60);
// //         if (session.completed !== false && session.type === 'work') totalPomodoroSessions += 1;
// //       });
// //       taskData.forEach((activity) => {
// //         if (activity.type === 'task_completed') totalTasksCompleted += 1;
// //       });
// //       return {
// //         totalActiveTime,
// //         totalFocusSessions,
// //         totalPomodoroSessions,
// //         totalTasksCompleted,
// //         currentStreak: 0,
// //       };
// //     } catch (error) {
// //       console.error('Error getting dashboard data:', error);
// //       return {
// //         totalActiveTime: 0,
// //         totalFocusSessions: 0,
// //         totalPomodoroSessions: 0,
// //         totalTasksCompleted: 0,
// //         currentStreak: 0,
// //       };
// //     }
// //   }
// // }

// // export { ProfileDataManager, RankingSystem };