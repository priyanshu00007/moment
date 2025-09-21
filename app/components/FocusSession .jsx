"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, RotateCcw, ArrowLeft, Plus, Minus, Lock, Unlock, Target, TrendingUp } from 'lucide-react';

// Focus session data manager
const FocusDataManager = {
  storageKey: 'focus-sessions-data',
  
  saveSession(sessionData) {
    try {
      const existing = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      existing.push({
        ...sessionData,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0]
      });
      localStorage.setItem(this.storageKey, JSON.stringify(existing));
    } catch (error) {
      console.error('Error saving focus session:', error);
    }
  },

  getTodayStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const sessions = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      const todaySessions = sessions.filter(s => s.date === today);
      
      return {
        completedSessions: todaySessions.filter(s => s.completed).length,
        totalFocusTime: todaySessions.reduce((acc, s) => acc + s.duration, 0),
        longestSession: Math.max(...todaySessions.map(s => s.duration), 0),
        sessionsCount: todaySessions.length
      };
    } catch (error) {
      console.error('Error getting today stats:', error);
      return { completedSessions: 0, totalFocusTime: 0, longestSession: 0, sessionsCount: 0 };
    }
  },

  saveCurrentState(state) {
    try {
      localStorage.setItem('focus-current-session', JSON.stringify({
        ...state,
        lastSaved: Date.now()
      }));
    } catch (error) {
      console.error('Error saving current state:', error);
    }
  },

  loadCurrentState() {
    try {
      const saved = localStorage.getItem('focus-current-session');
      if (saved) {
        const state = JSON.parse(saved);
        // Check if state is recent (within last 2 hours)
        if (Date.now() - state.lastSaved < 7200000) {
          return state;
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading current state:', error);
      return null;
    }
  },

  clearCurrentState() {
    try {
      localStorage.removeItem('focus-current-session');
    } catch (error) {
      console.error('Error clearing current state:', error);
    }
  }
};

export default function FocusSession({ task, onComplete, onExit, disableSidebars }) {
  // Enforce minimum 60 minutes
  const initialTime = Math.max(task?.estimatedTime || 60, 60) * 60; // in seconds
  const GRACE_PERIOD = 10; // 10 seconds grace period

  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [totalTime, setTotalTime] = useState(initialTime);
  const [startTime, setStartTime] = useState(null);
  const [actualTimeSpent, setActualTimeSpent] = useState(0);
  const [pausedTime, setPausedTime] = useState(0);
  
  // Grace period state
  const [gracePeriodActive, setGracePeriodActive] = useState(false);
  const [gracePeriodTime, setGracePeriodTime] = useState(GRACE_PERIOD);

  // Statistics
  const [todayStats, setTodayStats] = useState(FocusDataManager.getTodayStats());

  const timerRef = useRef(null);
  const gracePeriodRef = useRef(null);
  const sessionStartRef = useRef(null);
  const lastTickRef = useRef(null);

  // Load saved state on component mount
  useEffect(() => {
    const savedState = FocusDataManager.loadCurrentState();
    if (savedState && savedState.taskId === task?._id) {
      setTimeLeft(savedState.timeLeft);
      setTotalTime(savedState.totalTime);
      setActualTimeSpent(savedState.actualTimeSpent || 0);
      setPausedTime(savedState.pausedTime || 0);
    }
  }, [task]);

  // Auto-save state every 15 seconds when running
  useEffect(() => {
    if (isRunning) {
      const saveInterval = setInterval(() => {
        FocusDataManager.saveCurrentState({
          taskId: task?._id,
          timeLeft,
          totalTime,
          actualTimeSpent,
          pausedTime
        });
      }, 15000);

      return () => clearInterval(saveInterval);
    }
  }, [isRunning, timeLeft, totalTime, actualTimeSpent, pausedTime, task]);

  // Disable sidebar navigation during focus mode
  useEffect(() => {
    if (disableSidebars && isRunning && !gracePeriodActive) {
      const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'w' || e.key === 't')) {
          e.preventDefault();
        }
      };

      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'Your focus session will be interrupted. Are you sure?';
        return e.returnValue;
      };

      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isRunning, gracePeriodActive, disableSidebars]);

  // Grace period countdown
  useEffect(() => {
    if (gracePeriodActive && gracePeriodTime > 0) {
      gracePeriodRef.current = setInterval(() => {
        setGracePeriodTime(prev => prev - 1);
      }, 1000);
    } else if (gracePeriodActive && gracePeriodTime === 0) {
      clearInterval(gracePeriodRef.current);
      setGracePeriodActive(false);
      setGracePeriodTime(GRACE_PERIOD);
    }

    return () => clearInterval(gracePeriodRef.current);
  }, [gracePeriodActive, gracePeriodTime]);

  // High precision timer with accurate tracking
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      lastTickRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const deltaTime = now - lastTickRef.current;
        
        // Update actual time spent
        if (sessionStartRef.current) {
          setActualTimeSpent(Math.floor((now - sessionStartRef.current - pausedTime) / 1000));
        }
        
        // Update timer
        setTimeLeft(prev => Math.max(0, prev - 1));
        lastTickRef.current = now;
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      clearInterval(timerRef.current);
      handleSessionComplete();
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    setGracePeriodActive(false);
    clearInterval(gracePeriodRef.current);
    
    const finalDuration = sessionStartRef.current ? 
      Math.floor((Date.now() - sessionStartRef.current - pausedTime) / 1000) : 
      totalTime - timeLeft;

    // Save completed session
    FocusDataManager.saveSession({
      taskId: task?._id,
      taskTitle: task?.title,
      duration: finalDuration,
      plannedDuration: totalTime,
      completed: true,
      efficiency: Math.round((finalDuration / totalTime) * 100)
    });

    FocusDataManager.clearCurrentState();
    setTodayStats(FocusDataManager.getTodayStats());
    onComplete(finalDuration);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
    }
    return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  };

  const progressPercentage = ((totalTime - timeLeft) / totalTime) * 100;

  const handlePlayPause = () => {
    if (!isRunning) {
      setIsRunning(true);
      setGracePeriodActive(true);
      setGracePeriodTime(GRACE_PERIOD);
      
      if (!sessionStartRef.current) {
        sessionStartRef.current = Date.now();
      } else {
        // Resuming after pause - add pause duration
        setPausedTime(prev => prev + (Date.now() - lastTickRef.current));
      }
    } else {
      setIsRunning(false);
      setGracePeriodActive(false);
      clearInterval(gracePeriodRef.current);
      
      // Save partial session
      if (sessionStartRef.current) {
        const duration = Math.floor((Date.now() - sessionStartRef.current - pausedTime) / 1000);
        if (duration > 300) { // Only save if more than 5 minutes
          FocusDataManager.saveSession({
            taskId: task?._id,
            taskTitle: task?.title,
            duration: duration,
            plannedDuration: totalTime,
            completed: false,
            paused: true
          });
        }
      }
      
      lastTickRef.current = Date.now(); // Mark pause time
    }
  };

  const handleReset = () => {
    if (gracePeriodActive || !isRunning) {
      setIsRunning(false);
      setGracePeriodActive(false);
      clearInterval(gracePeriodRef.current);
      setTimeLeft(totalTime);
      setActualTimeSpent(0);
      setPausedTime(0);
      sessionStartRef.current = null;
      lastTickRef.current = null;
    }
  };

  const handleStop = () => {
    if (gracePeriodActive || !isRunning) {
      setIsRunning(false);
      setGracePeriodActive(false);
      clearInterval(gracePeriodRef.current);
      
      // Save session if significant time was spent
      if (sessionStartRef.current && actualTimeSpent > 300) { // More than 5 minutes
        FocusDataManager.saveSession({
          taskId: task?._id,
          taskTitle: task?.title,
          duration: actualTimeSpent,
          plannedDuration: totalTime,
          completed: false,
          stopped: true
        });
      }
      
      FocusDataManager.clearCurrentState();
      setTodayStats(FocusDataManager.getTodayStats());
      onExit();
    }
  };

  const changeTime = (deltaMinutes) => {
    if (!isRunning || gracePeriodActive) {
      const newTotal = Math.max(totalTime / 60 + deltaMinutes, 60); // minimum 60 min
      const newTotalSeconds = newTotal * 60;
      setTotalTime(newTotalSeconds);
      setTimeLeft(newTotalSeconds);
    }
  };

  const buttonsLocked = isRunning && !gracePeriodActive;
  const timeAdjustmentLocked = isRunning && !gracePeriodActive;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center relative"
      >
        {/* Grace Period Notification */}
        <AnimatePresence>
          {gracePeriodActive && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg z-10 flex items-center space-x-2"
            >
              <Unlock className="w-4 h-4" />
              <span className="text-sm font-semibold">Grace: {gracePeriodTime}s</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Focus Lock Notification */}
        <AnimatePresence>
          {buttonsLocked && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg z-10 flex items-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span className="text-sm font-semibold">Locked</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleStop} 
            disabled={buttonsLocked}
            className={`p-2 transition-colors ${
              buttonsLocked 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Deep Focus</h1>
          <div className="w-10 h-6"></div>
        </div>

        {/* Today's Stats */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span>Today: {todayStats.completedSessions} sessions</span>
            <span>Focus: {Math.floor(todayStats.totalFocusTime / 3600)}h {Math.floor((todayStats.totalFocusTime % 3600) / 60)}m</span>
            <span>Best: {Math.floor(todayStats.longestSession / 60)}m</span>
          </div>
        </div>

        {/* Progress Circle */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="8"
              strokeDasharray={2 * Math.PI * 45}
              strokeDashoffset={2 * Math.PI * 45 * (1 - progressPercentage / 100)}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-mono font-bold text-gray-800">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {Math.round(progressPercentage)}% Complete
            </div>
            {actualTimeSpent > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                Active: {formatTime(actualTimeSpent)}
              </div>
            )}

            {/* Time adjustment controls */}
            <div className="flex mt-4 space-x-4">
              <button 
                onClick={() => changeTime(-5)} 
                disabled={timeAdjustmentLocked}
                className={`p-2 rounded-full transition-all ${
                  timeAdjustmentLocked
                    ? 'bg-gray-200 cursor-not-allowed opacity-50'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
                title={timeAdjustmentLocked ? "Locked" : "Remove 5 min"}
              >
                <Minus className="w-5 h-5"/>
              </button>
              <button 
                onClick={() => changeTime(5)} 
                disabled={timeAdjustmentLocked}
                className={`p-2 rounded-full transition-all ${
                  timeAdjustmentLocked
                    ? 'bg-gray-200 cursor-not-allowed opacity-50'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
                title={timeAdjustmentLocked ? "Locked" : "Add 5 min"}
              >
                <Plus className="w-5 h-5"/>
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4 mb-8">
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayPause}
            className={`p-4 rounded-full shadow-lg transition-all ${
              isRunning 
                ? 'bg-yellow-500 hover:bg-yellow-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </motion.button>

          <motion.button 
            whileHover={!buttonsLocked ? { scale: 1.05 } : {}} 
            whileTap={!buttonsLocked ? { scale: 0.95 } : {}}
            onClick={handleReset} 
            disabled={buttonsLocked}
            className={`p-4 rounded-full shadow-lg transition-all relative ${
              buttonsLocked 
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            <RotateCcw className="w-8 h-8" />
            {buttonsLocked && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                <Lock className="w-3 h-3" />
              </div>
            )}
          </motion.button>

          <motion.button 
            whileHover={!buttonsLocked ? { scale: 1.05 } : {}} 
            whileTap={!buttonsLocked ? { scale: 0.95 } : {}}
            onClick={handleStop} 
            disabled={buttonsLocked}
            className={`p-4 rounded-full shadow-lg transition-all relative ${
              buttonsLocked 
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            <Square className="w-8 h-8" />
            {buttonsLocked && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                <Lock className="w-3 h-3" />
              </div>
            )}
          </motion.button>
        </div>

        {/* Task Info */}
        <div className="bg-blue-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Focus Task</h3>
          <p className="text-gray-700">{task?.title || 'Deep Work Session'}</p>
          {task?.description && (
            <p className="text-sm text-gray-500 mt-1">{task.description}</p>
          )}
          <div className="mt-3 text-sm text-gray-600">
            <p>Target: {Math.floor(totalTime / 60)} minutes</p>
            <p>Remaining: {Math.floor(timeLeft / 60)} minutes</p>
            {actualTimeSpent > 0 && (
              <p>Active Time: {Math.floor(actualTimeSpent / 60)}m {actualTimeSpent % 60}s</p>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {gracePeriodActive && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800"
          >
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Unlock className="w-4 h-4" />
              <span className="font-semibold">Grace Period Active</span>
            </div>
            <p>{gracePeriodTime} seconds to make adjustments before locking into focus mode.</p>
          </motion.div>
        )}

        {buttonsLocked && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800"
          >
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Lock className="w-4 h-4" />
              <span className="font-semibold">Deep Focus Mode</span>
            </div>
            <p>All controls locked. Stay focused! You can pause if absolutely necessary.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// "use client";
// import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Play, Pause, Square, RotateCcw, ArrowLeft, Plus, Minus, Lock, Unlock } from 'lucide-react';

// export default function FocusSession({ task, onComplete, onExit, disableSidebars }) {
//   // Enforce minimum 60 minutes
//   const initialTime = Math.max(task?.estimatedTime || 60, 60) * 60; // in seconds
//   const GRACE_PERIOD = 10; // 10 seconds grace period to allow stopping

//   const [timeLeft, setTimeLeft] = useState(initialTime);
//   const [isRunning, setIsRunning] = useState(false);
//   const [totalTime, setTotalTime] = useState(initialTime);
  
//   // Grace period state - buttons are enabled for first 10 seconds
//   const [gracePeriodActive, setGracePeriodActive] = useState(false);
//   const [gracePeriodTime, setGracePeriodTime] = useState(GRACE_PERIOD);

//   const timerRef = useRef(null);
//   const gracePeriodRef = useRef(null);

//   // Disable sidebar navigation during focus mode
//   useEffect(() => {
//     if (disableSidebars && isRunning && !gracePeriodActive) {
//       // Add event listeners to prevent navigation
//       const handleKeyDown = (e) => {
//         // Prevent common navigation shortcuts
//         if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'w' || e.key === 't')) {
//           e.preventDefault();
//         }
//       };

//       const handleBeforeUnload = (e) => {
//         e.preventDefault();
//         e.returnValue = 'Are you sure you want to leave? Your focus session will be interrupted.';
//         return e.returnValue;
//       };

//       document.addEventListener('keydown', handleKeyDown);
//       window.addEventListener('beforeunload', handleBeforeUnload);

//       return () => {
//         document.removeEventListener('keydown', handleKeyDown);
//         window.removeEventListener('beforeunload', handleBeforeUnload);
//       };
//     }
//   }, [isRunning, gracePeriodActive, disableSidebars]);

//   // Grace period countdown effect
//   useEffect(() => {
//     if (gracePeriodActive && gracePeriodTime > 0) {
//       gracePeriodRef.current = setInterval(() => {
//         setGracePeriodTime(prev => prev - 1);
//       }, 1000);
//     } else if (gracePeriodActive && gracePeriodTime === 0) {
//       clearInterval(gracePeriodRef.current);
//       setGracePeriodActive(false);
//       setGracePeriodTime(GRACE_PERIOD); // Reset for next time
//     }

//     return () => clearInterval(gracePeriodRef.current);
//   }, [gracePeriodActive, gracePeriodTime]);

//   // Main timer effect
//   useEffect(() => {
//     if (isRunning && timeLeft > 0) {
//       timerRef.current = setInterval(() => {
//         setTimeLeft(t => t - 1);
//       }, 1000);
//     } else if (timeLeft === 0 && isRunning) {
//       clearInterval(timerRef.current);
//       setIsRunning(false);
//       setGracePeriodActive(false);
//       clearInterval(gracePeriodRef.current);
//       onComplete(); // Task completed
//     }

//     return () => clearInterval(timerRef.current);
//   }, [isRunning, timeLeft, onComplete]);

//   const formatTime = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
//   };

//   const progressPercentage = ((totalTime - timeLeft) / totalTime) * 100;

//   const handlePlayPause = () => {
//     if (!isRunning) {
//       // When starting, activate grace period (buttons enabled for 10 seconds)
//       setIsRunning(true);
//       setGracePeriodActive(true);
//       setGracePeriodTime(GRACE_PERIOD);
//     } else {
//       // Allow pause anytime
//       setIsRunning(false);
//       // Clear grace period when pausing
//       setGracePeriodActive(false);
//       clearInterval(gracePeriodRef.current);
//     }
//   };

//   const handleReset = () => {
//     // Only allow reset during grace period OR when not running
//     if (gracePeriodActive || !isRunning) {
//       setIsRunning(false);
//       setGracePeriodActive(false);
//       clearInterval(gracePeriodRef.current);
//       setTimeLeft(totalTime);
//     }
//   };

//   const handleStop = () => {
//     // Only allow stop during grace period OR when not running
//     if (gracePeriodActive || !isRunning) {
//       setIsRunning(false);
//       setGracePeriodActive(false);
//       clearInterval(gracePeriodRef.current);
//       onExit();
//     }
//   };

//   // Increase/decrease total time dynamically - only when not running or during grace period
//   const changeTime = (deltaMinutes) => {
//     if (!isRunning || gracePeriodActive) {
//       const newTotal = Math.max(totalTime / 60 + deltaMinutes, 60); // minimum 60 min
//       setTotalTime(newTotal * 60);
//       setTimeLeft(newTotal * 60);
//     }
//   };

//   // Buttons are DISABLED when running and grace period is over
//   const buttonsLocked = isRunning && !gracePeriodActive;
//   const timeAdjustmentLocked = isRunning && !gracePeriodActive;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
//       <motion.div
//         initial={{ scale: 0.9, opacity: 0 }}
//         animate={{ scale: 1, opacity: 1 }}
//         className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center relative"
//       >
//         {/* Grace Period Notification - Shows countdown while buttons are still enabled */}
//         <AnimatePresence>
//           {gracePeriodActive && (
//             <motion.div
//               initial={{ opacity: 0, y: -20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg z-10 flex items-center space-x-2"
//             >
//               <Unlock className="w-4 h-4" />
//               <span className="text-sm font-semibold">Grace Period: {gracePeriodTime}s</span>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Focus Lock Notification - Shows when buttons are locked */}
//         <AnimatePresence>
//           {buttonsLocked && (
//             <motion.div
//               initial={{ opacity: 0, y: -20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg z-10 flex items-center space-x-2"
//             >
//               <Lock className="w-4 h-4" />
//               <span className="text-sm font-semibold">Focus Mode Locked</span>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <button 
//             onClick={handleStop} 
//             disabled={buttonsLocked}
//             className={`p-2 transition-colors ${
//               buttonsLocked 
//                 ? 'text-gray-300 cursor-not-allowed' 
//                 : 'text-gray-500 hover:text-gray-700'
//             }`}
//           >
//             <ArrowLeft className="w-6 h-6" />
//           </button>
//           <h1 className="text-xl font-bold text-gray-800">Focus Mode</h1>
//           <div className="w-10 h-6"></div>
//         </div>

//         {/* Progress Circle */}
//         <div className="relative w-64 h-64 mx-auto mb-8">
//           <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
//             <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
//             <circle
//               cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="8"
//               strokeDasharray={2 * Math.PI * 45}
//               strokeDashoffset={2 * Math.PI * 45 * (1 - progressPercentage / 100)}
//               strokeLinecap="round"
//               className="transition-all duration-1000 ease-out"
//             />
//           </svg>
//           <div className="absolute inset-0 flex flex-col items-center justify-center">
//             <div className="text-4xl font-mono font-bold text-gray-800">{formatTime(timeLeft)}</div>
//             <div className="text-sm text-gray-500 mt-2">{Math.round(progressPercentage)}% Complete</div>

//             {/* Time adjustment - disabled when locked */}
//             <div className="flex mt-4 space-x-4">
//               <button 
//                 onClick={() => changeTime(-5)} 
//                 disabled={timeAdjustmentLocked}
//                 className={`p-2 rounded-full transition-all ${
//                   timeAdjustmentLocked
//                     ? 'bg-gray-200 cursor-not-allowed opacity-50'
//                     : 'bg-gray-200 hover:bg-gray-300'
//                 }`}
//                 title={timeAdjustmentLocked ? "Time adjustment locked" : "Decrease 5 minutes"}
//               >
//                 <Minus className="w-5 h-5"/>
//               </button>
//               <button 
//                 onClick={() => changeTime(5)} 
//                 disabled={timeAdjustmentLocked}
//                 className={`p-2 rounded-full transition-all ${
//                   timeAdjustmentLocked
//                     ? 'bg-gray-200 cursor-not-allowed opacity-50'
//                     : 'bg-gray-200 hover:bg-gray-300'
//                 }`}
//                 title={timeAdjustmentLocked ? "Time adjustment locked" : "Increase 5 minutes"}
//               >
//                 <Plus className="w-5 h-5"/>
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Controls */}
//         <div className="flex justify-center space-x-4 mb-8">
//           {/* Play/Pause Button - Always enabled */}
//           <motion.button 
//             whileHover={{ scale: 1.05 }} 
//             whileTap={{ scale: 0.95 }}
//             onClick={handlePlayPause}
//             className={`p-4 rounded-full shadow-lg transition-all ${
//               isRunning 
//                 ? 'bg-yellow-500 hover:bg-yellow-600' 
//                 : 'bg-blue-500 hover:bg-blue-600'
//             } text-white`}
//           >
//             {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
//           </motion.button>

//           {/* Reset Button - Enabled during grace period, disabled after */}
//           <motion.button 
//             whileHover={!buttonsLocked ? { scale: 1.05 } : {}} 
//             whileTap={!buttonsLocked ? { scale: 0.95 } : {}}
//             onClick={handleReset} 
//             disabled={buttonsLocked}
//             className={`p-4 rounded-full shadow-lg transition-all relative ${
//               buttonsLocked 
//                 ? 'bg-gray-300 cursor-not-allowed text-gray-500'
//                 : 'bg-gray-500 hover:bg-gray-600 text-white'
//             }`}
//             title={buttonsLocked ? "Locked during focus session" : "Reset timer"}
//           >
//             <RotateCcw className="w-8 h-8" />
//             {buttonsLocked && (
//               <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
//                 <Lock className="w-3 h-3" />
//               </div>
//             )}
//           </motion.button>

//           {/* Stop Button - Enabled during grace period, disabled after */}
//           <motion.button 
//             whileHover={!buttonsLocked ? { scale: 1.05 } : {}} 
//             whileTap={!buttonsLocked ? { scale: 0.95 } : {}}
//             onClick={handleStop} 
//             disabled={buttonsLocked}
//             className={`p-4 rounded-full shadow-lg transition-all relative ${
//               buttonsLocked 
//                 ? 'bg-gray-300 cursor-not-allowed text-gray-500'
//                 : 'bg-red-500 hover:bg-red-600 text-white'
//             }`}
//             title={buttonsLocked ? "Locked during focus session" : "Stop and exit"}
//           >
//             <Square className="w-8 h-8" />
//             {buttonsLocked && (
//               <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
//                 <Lock className="w-3 h-3" />
//               </div>
//             )}
//           </motion.button>
//         </div>

//         {/* Task Info */}
//         <div className="bg-blue-50 rounded-xl p-4">
//           <h3 className="font-semibold text-gray-800 mb-2">Current Task</h3>
//           <p className="text-gray-700">{task?.title || 'Untitled Task'}</p>
//           {task?.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
//           <div className="mt-3 text-sm text-gray-600">
//             <p>Total Focus Time: {Math.floor(totalTime / 60)} minutes</p>
//             <p>Remaining: {Math.floor(timeLeft / 60)} minutes</p>
//           </div>
//         </div>

//         {/* Grace Period Info */}
//         {gracePeriodActive && (
//           <motion.div 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800"
//           >
//             <div className="flex items-center justify-center space-x-2 mb-2">
//               <Unlock className="w-4 h-4" />
//               <span className="font-semibold">Grace Period Active</span>
//             </div>
//             <p>You have {gracePeriodTime} seconds to stop, reset, or adjust time if needed.</p>
//             <p className="text-xs mt-1 opacity-75">After this, you'll be locked in focus mode!</p>
//           </motion.div>
//         )}

//         {/* Focus Lock Info */}
//         {buttonsLocked && (
//           <motion.div 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800"
//           >
//             <div className="flex items-center justify-center space-x-2 mb-2">
//               <Lock className="w-4 h-4" />
//               <span className="font-semibold">Focus Mode Locked</span>
//             </div>
//             <p>All controls are now locked to help you maintain deep focus.</p>
//             <p className="text-xs mt-1 opacity-75">You can still pause if absolutely necessary.</p>
//           </motion.div>
//         )}
//       </motion.div>
//     </div>
//   );
// }
