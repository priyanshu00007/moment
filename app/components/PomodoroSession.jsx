"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, RotateCcw, ArrowLeft, Coffee, Lock, Unlock } from "lucide-react";

export default function PomodoroSession({ task, onComplete, onExit }) {
  const WORK_TIME = 25 * 60;
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 15 * 60;
  const GRACE_PERIOD = 10; // 10 seconds grace period to allow stopping

  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [session, setSession] = useState(1);
  
  // Grace period state - buttons are enabled for first 10 seconds
  const [gracePeriodActive, setGracePeriodActive] = useState(false);
  const [gracePeriodTime, setGracePeriodTime] = useState(GRACE_PERIOD);

  const timerRef = useRef(null);
  const gracePeriodRef = useRef(null);

  // Load from localStorage and adjust timeLeft based on lastStoppedAt
  useEffect(() => {
    const stored = localStorage.getItem("pomodoroSession");
    if (stored) {
      const { timeLeft, completedPomodoros, isBreak, session, lastStoppedAt } = JSON.parse(stored);
      let updatedTimeLeft = timeLeft;

      if (lastStoppedAt) {
        const elapsed = Math.floor((Date.now() - lastStoppedAt) / 1000);
        updatedTimeLeft = Math.max(timeLeft - elapsed, 0);
      }

      setTimeLeft(updatedTimeLeft);
      setCompletedPomodoros(completedPomodoros);
      setIsBreak(isBreak);
      setSession(session);
    }
  }, []);

  // Save to localStorage whenever changes happen or on stop
  const saveSession = (stopped = false) => {
    const data = {
      timeLeft,
      completedPomodoros,
      isBreak,
      session,
      lastStoppedAt: stopped ? Date.now() : null
    };
    localStorage.setItem("pomodoroSession", JSON.stringify(data));
  };

  useEffect(() => {
    saveSession();
  }, [timeLeft, completedPomodoros, isBreak, session]);

  // Grace period countdown effect
  useEffect(() => {
    if (gracePeriodActive && gracePeriodTime > 0) {
      gracePeriodRef.current = setInterval(() => {
        setGracePeriodTime(prev => prev - 1);
      }, 1000);
    } else if (gracePeriodActive && gracePeriodTime === 0) {
      clearInterval(gracePeriodRef.current);
      setGracePeriodActive(false);
      setGracePeriodTime(GRACE_PERIOD); // Reset for next time
    }

    return () => clearInterval(gracePeriodRef.current);
  }, [gracePeriodActive, gracePeriodTime]);

  // Main timer effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      clearInterval(timerRef.current);
      handleSessionComplete();
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft]);

  const handleSessionComplete = () => {
    setGracePeriodActive(false); // Clear grace period when session completes
    clearInterval(gracePeriodRef.current);
    
    if (!isBreak) {
      const newCompleted = completedPomodoros + 1;
      setCompletedPomodoros(newCompleted);

      if (newCompleted >= 4) {
        onComplete && onComplete();
        setIsRunning(false);
        return;
      }

      setIsBreak(true);
      setTimeLeft(newCompleted % 4 === 0 ? LONG_BREAK : SHORT_BREAK);
    } else {
      setIsBreak(false);
      setTimeLeft(WORK_TIME);
      setSession(prev => prev + 1);
    }
    setIsRunning(false);
  };

  const handlePlayPause = () => {
    if (!isRunning) {
      // When starting, activate grace period (buttons enabled for 10 seconds)
      setIsRunning(true);
      setGracePeriodActive(true);
      setGracePeriodTime(GRACE_PERIOD);
    } else {
      // Allow pause anytime
      setIsRunning(false);
      // Clear grace period when pausing
      setGracePeriodActive(false);
      clearInterval(gracePeriodRef.current);
    }
  };

  const handleReset = () => {
    // Only allow reset during grace period OR when not running
    if (gracePeriodActive || !isRunning) {
      setIsRunning(false);
      setGracePeriodActive(false);
      clearInterval(gracePeriodRef.current);
      const currentSessionTime = isBreak ? 
        (completedPomodoros % 4 === 0 ? LONG_BREAK : SHORT_BREAK) : 
        WORK_TIME;
      setTimeLeft(currentSessionTime);
    }
  };

  const handleStop = () => {
    // Only allow stop during grace period OR when not running
    if (gracePeriodActive || !isRunning) {
      setIsRunning(false);
      setGracePeriodActive(false);
      clearInterval(gracePeriodRef.current);
      saveSession(true);
      onExit && onExit();
    }
  };

  const formatTime = sec => `${Math.floor(sec / 60).toString().padStart(2, "0")}:${(sec % 60).toString().padStart(2, "0")}`;
  const getCurrentSessionTime = () => (isBreak ? (completedPomodoros % 4 === 0 ? LONG_BREAK : SHORT_BREAK) : WORK_TIME);
  const progressPercentage = ((getCurrentSessionTime() - timeLeft) / getCurrentSessionTime()) * 100;

  // Buttons are DISABLED when running and grace period is over
  const buttonsLocked = isRunning && !gracePeriodActive;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center relative"
      >
        {/* Grace Period Notification - Shows countdown while buttons are still enabled */}
        <AnimatePresence>
          {gracePeriodActive && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg z-10 flex items-center space-x-2"
            >
              <Unlock className="w-4 h-4" />
              <span className="text-sm font-semibold">Grace Period: {gracePeriodTime}s</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Focus Lock Notification - Shows when buttons are locked */}
        <AnimatePresence>
          {buttonsLocked && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg z-10 flex items-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span className="text-sm font-semibold">Focus Mode Locked</span>
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
          <h1 className="text-xl font-bold text-gray-800">
            {isBreak ? "Break Time" : "Pomodoro"}
          </h1>
          <div className="w-10 h-6"></div>
        </div>

        {/* Session Info */}
        <div className="mb-6">
          <div className="flex justify-center items-center space-x-2 mb-2">
            {isBreak ? <Coffee className="w-5 h-5 text-orange-500" /> : <div className="w-5 h-5 bg-green-500 rounded-full"></div>}
            <span className="text-sm font-medium text-gray-600">
              {isBreak ? `${completedPomodoros % 4 === 0 ? "Long" : "Short"} Break` : `Session ${session}`}
            </span>
          </div>
          <div className="flex justify-center space-x-1">
            {[1,2,3,4].map(i => (
              <div 
                key={i} 
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i <= completedPomodoros ? "bg-green-500" : "bg-gray-200"
                }`} 
              />
            ))}
          </div>
        </div>

        {/* Progress Circle */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              fill="none" 
              stroke={isBreak ? "#f59e0b" : "#10b981"} 
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 45}`} 
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercentage / 100)}`} 
              strokeLinecap="round" 
              className="transition-all duration-1000 ease-out" 
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-gray-800">{formatTime(timeLeft)}</div>
              <div className="text-sm text-gray-500 mt-2">{Math.round(progressPercentage)}% Complete</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4 mb-8">
          {/* Play/Pause Button - Always enabled */}
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={handlePlayPause} 
            className={`p-4 rounded-full shadow-lg transition-all ${
              isRunning 
                ? "bg-yellow-500 hover:bg-yellow-600" 
                : "bg-green-500 hover:bg-green-600"
            } text-white relative`}
          >
            {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </motion.button>
          
          {/* Reset Button - Enabled during grace period, disabled after */}
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
            title={buttonsLocked ? "Locked during focus session" : "Reset timer"}
          >
            <RotateCcw className="w-8 h-8" />
            {buttonsLocked && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                <Lock className="w-3 h-3" />
              </div>
            )}
          </motion.button>
          
          {/* Stop Button - Enabled during grace period, disabled after */}
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
            title={buttonsLocked ? "Locked during focus session" : "Stop and exit"}
          >
            <Square className="w-8 h-8" />
            {buttonsLocked && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                <Lock className="w-3 h-3" />
              </div>
            )}
          </motion.button>
        </div>

        {/* Task Info */}
        <div className="bg-green-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Current Task</h3>
          <p className="text-gray-700">{task?.title || "Untitled Task"}</p>
          {task?.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
          <div className="mt-3 text-sm text-gray-600">
            <p>Completed: {completedPomodoros}/4 sessions</p>
            <p>Estimated time: {task?.estimatedTime || 25} minutes</p>
          </div>
        </div>

        {/* Grace Period Info */}
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
            <p>You have {gracePeriodTime} seconds to stop or reset if needed.</p>
            <p className="text-xs mt-1 opacity-75">After this, you'll be locked in focus mode!</p>
          </motion.div>
        )}

        {/* Focus Lock Info */}
        {buttonsLocked && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800"
          >
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Lock className="w-4 h-4" />
              <span className="font-semibold">Focus Mode Locked</span>
            </div>
            <p>Stop and Reset are now disabled to help you maintain focus.</p>
            <p className="text-xs mt-1 opacity-75">You can still pause if absolutely necessary.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}


// "use client";
// import React, { useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Play, Pause, Square, RotateCcw, ArrowLeft, Coffee, Lock, Unlock } from "lucide-react";

// export default function PomodoroSession({ task, onComplete, onExit }) {
//   const WORK_TIME = 25 * 60;
//   const SHORT_BREAK = 5 * 60;
//   const LONG_BREAK = 15 * 60;
//   const GRACE_PERIOD = 10; // 10 seconds grace period to allow stopping

//   const [timeLeft, setTimeLeft] = useState(WORK_TIME);
//   const [isRunning, setIsRunning] = useState(false);
//   const [completedPomodoros, setCompletedPomodoros] = useState(0);
//   const [isBreak, setIsBreak] = useState(false);
//   const [session, setSession] = useState(1);
  
//   // Grace period state - buttons are enabled for first 10 seconds
//   const [gracePeriodActive, setGracePeriodActive] = useState(false);
//   const [gracePeriodTime, setGracePeriodTime] = useState(GRACE_PERIOD);

//   const timerRef = useRef(null);
//   const gracePeriodRef = useRef(null);

//   // Load from localStorage and adjust timeLeft based on lastStoppedAt
//   useEffect(() => {
//     const stored = localStorage.getItem("pomodoroSession");
//     if (stored) {
//       const { timeLeft, completedPomodoros, isBreak, session, lastStoppedAt } = JSON.parse(stored);
//       let updatedTimeLeft = timeLeft;

//       if (lastStoppedAt) {
//         const elapsed = Math.floor((Date.now() - lastStoppedAt) / 1000);
//         updatedTimeLeft = Math.max(timeLeft - elapsed, 0);
//       }

//       setTimeLeft(updatedTimeLeft);
//       setCompletedPomodoros(completedPomodoros);
//       setIsBreak(isBreak);
//       setSession(session);
//     }
//   }, []);

//   // Save to localStorage whenever changes happen or on stop
//   const saveSession = (stopped = false) => {
//     const data = {
//       timeLeft,
//       completedPomodoros,
//       isBreak,
//       session,
//       lastStoppedAt: stopped ? Date.now() : null
//     };
//     localStorage.setItem("pomodoroSession", JSON.stringify(data));
//   };

//   useEffect(() => {
//     saveSession();
//   }, [timeLeft, completedPomodoros, isBreak, session]);

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
//       timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
//     } else if (timeLeft === 0 && isRunning) {
//       clearInterval(timerRef.current);
//       handleSessionComplete();
//     }
//     return () => clearInterval(timerRef.current);
//   }, [isRunning, timeLeft]);

//   const handleSessionComplete = () => {
//     setGracePeriodActive(false); // Clear grace period when session completes
//     clearInterval(gracePeriodRef.current);
    
//     if (!isBreak) {
//       const newCompleted = completedPomodoros + 1;
//       setCompletedPomodoros(newCompleted);

//       if (newCompleted >= 4) {
//         onComplete && onComplete();
//         setIsRunning(false);
//         return;
//       }

//       setIsBreak(true);
//       setTimeLeft(newCompleted % 4 === 0 ? LONG_BREAK : SHORT_BREAK);
//     } else {
//       setIsBreak(false);
//       setTimeLeft(WORK_TIME);
//       setSession(prev => prev + 1);
//     }
//     setIsRunning(false);
//   };

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
//       const currentSessionTime = isBreak ? 
//         (completedPomodoros % 4 === 0 ? LONG_BREAK : SHORT_BREAK) : 
//         WORK_TIME;
//       setTimeLeft(currentSessionTime);
//     }
//   };

//   const handleStop = () => {
//     // Only allow stop during grace period OR when not running
//     if (gracePeriodActive || !isRunning) {
//       setIsRunning(false);
//       setGracePeriodActive(false);
//       clearInterval(gracePeriodRef.current);
//       saveSession(true);
//       onExit && onExit();
//     }
//   };

//   const formatTime = sec => `${Math.floor(sec / 60).toString().padStart(2, "0")}:${(sec % 60).toString().padStart(2, "0")}`;
//   const getCurrentSessionTime = () => (isBreak ? (completedPomodoros % 4 === 0 ? LONG_BREAK : SHORT_BREAK) : WORK_TIME);
//   const progressPercentage = ((getCurrentSessionTime() - timeLeft) / getCurrentSessionTime()) * 100;

//   // Buttons are DISABLED when running and grace period is over
//   const buttonsLocked = isRunning && !gracePeriodActive;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
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
//           <h1 className="text-xl font-bold text-gray-800">
//             {isBreak ? "Break Time" : "Pomodoro"}
//           </h1>
//           <div className="w-10 h-6"></div>
//         </div>

//         {/* Session Info */}
//         <div className="mb-6">
//           <div className="flex justify-center items-center space-x-2 mb-2">
//             {isBreak ? <Coffee className="w-5 h-5 text-orange-500" /> : <div className="w-5 h-5 bg-green-500 rounded-full"></div>}
//             <span className="text-sm font-medium text-gray-600">
//               {isBreak ? `${completedPomodoros % 4 === 0 ? "Long" : "Short"} Break` : `Session ${session}`}
//             </span>
//           </div>
//           <div className="flex justify-center space-x-1">
//             {[1,2,3,4].map(i => (
//               <div 
//                 key={i} 
//                 className={`w-3 h-3 rounded-full transition-all duration-300 ${
//                   i <= completedPomodoros ? "bg-green-500" : "bg-gray-200"
//                 }`} 
//               />
//             ))}
//           </div>
//         </div>

//         {/* Progress Circle */}
//         <div className="relative w-64 h-64 mx-auto mb-8">
//           <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
//             <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
//             <circle 
//               cx="50" 
//               cy="50" 
//               r="45" 
//               fill="none" 
//               stroke={isBreak ? "#f59e0b" : "#10b981"} 
//               strokeWidth="8"
//               strokeDasharray={`${2 * Math.PI * 45}`} 
//               strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercentage / 100)}`} 
//               strokeLinecap="round" 
//               className="transition-all duration-1000 ease-out" 
//             />
//           </svg>
//           <div className="absolute inset-0 flex items-center justify-center">
//             <div className="text-center">
//               <div className="text-4xl font-mono font-bold text-gray-800">{formatTime(timeLeft)}</div>
//               <div className="text-sm text-gray-500 mt-2">{Math.round(progressPercentage)}% Complete</div>
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
//                 ? "bg-yellow-500 hover:bg-yellow-600" 
//                 : "bg-green-500 hover:bg-green-600"
//             } text-white relative`}
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
//         <div className="bg-green-50 rounded-xl p-4">
//           <h3 className="font-semibold text-gray-800 mb-2">Current Task</h3>
//           <p className="text-gray-700">{task?.title || "Untitled Task"}</p>
//           {task?.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
//           <div className="mt-3 text-sm text-gray-600">
//             <p>Completed: {completedPomodoros}/4 sessions</p>
//             <p>Estimated time: {task?.estimatedTime || 25} minutes</p>
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
//             <p>You have {gracePeriodTime} seconds to stop or reset if needed.</p>
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
//             <p>Stop and Reset are now disabled to help you maintain focus.</p>
//             <p className="text-xs mt-1 opacity-75">You can still pause if absolutely necessary.</p>
//           </motion.div>
//         )}
//       </motion.div>
//     </div>
//   );
// }
