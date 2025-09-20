
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Square, RotateCcw, ArrowLeft, Coffee } from "lucide-react";

export default function PomodoroSession({ task, onComplete, onExit }) {
  const WORK_TIME = 25 * 60;
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 15 * 60;

  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [session, setSession] = useState(1);

  const timerRef = useRef(null);

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
  };

  const handlePlayPause = () => setIsRunning(prev => !prev);
  const handleReset = () => setIsRunning(false);
  const handleStop = () => {
    setIsRunning(false);
    saveSession(true); // Save last stopped time
    onExit && onExit();
  };

  const formatTime = sec => `${Math.floor(sec / 60).toString().padStart(2, "0")}:${(sec % 60).toString().padStart(2, "0")}`;
  const getCurrentSessionTime = () => (isBreak ? (completedPomodoros % 4 === 0 ? LONG_BREAK : SHORT_BREAK) : WORK_TIME);
  const progressPercentage = ((getCurrentSessionTime() - timeLeft) / getCurrentSessionTime()) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={handleStop} className="p-2 text-gray-500 hover:text-gray-700 transition-colors"><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-bold text-gray-800">{isBreak ? "Break Time" : "Pomodoro"}</h1>
          <div className="w-10 h-6"></div>
        </div>

        {/* Session Info */}
        <div className="mb-6">
          <div className="flex justify-center items-center space-x-2 mb-2">
            {isBreak ? <Coffee className="w-5 h-5 text-orange-500" /> : <div className="w-5 h-5 bg-green-500 rounded-full"></div>}
            <span className="text-sm font-medium text-gray-600">{isBreak ? `${completedPomodoros % 4 === 0 ? "Long" : "Short"} Break` : `Session ${session}`}</span>
          </div>
          <div className="flex justify-center space-x-1">
            {[1,2,3,4].map(i => <div key={i} className={`w-3 h-3 rounded-full ${i <= completedPomodoros ? "bg-green-500" : "bg-gray-200"}`} />)}
          </div>
        </div>

        {/* Progress Circle */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle cx="50" cy="50" r="45" fill="none" stroke={isBreak ? "#f59e0b" : "#10b981"} strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercentage / 100)}`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
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
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handlePlayPause} className={`p-4 rounded-full ${isRunning ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"} text-white shadow-lg transition-colors`}>
            {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleReset} className="p-4 rounded-full bg-gray-500 hover:bg-gray-600 text-white shadow-lg transition-colors">
            <RotateCcw className="w-8 h-8" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStop} className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-colors">
            <Square className="w-8 h-8" />
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
      </motion.div>
    </div>
  );
}

// "use client";

// import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { Play, Pause, Square, RotateCcw, ArrowLeft, Coffee } from 'lucide-react';

// export default function PomodoroSession({ task, onComplete, onExit }) {
//   const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
//   const [isRunning, setIsRunning] = useState(false);
//   const [session, setSession] = useState(1);
//   const [isBreak, setIsBreak] = useState(false);
//   const [completedPomodoros, setCompletedPomodoros] = useState(0);

//   const WORK_TIME = 25 * 60; // 25 minutes
//   const SHORT_BREAK = 5 * 60; // 5 minutes
//   const LONG_BREAK = 15 * 60; // 15 minutes

//   useEffect(() => {
//     let interval = null;
//     if (isRunning && timeLeft > 0) {
//       interval = setInterval(() => {
//         setTimeLeft(timeLeft => timeLeft - 1);
//       }, 1000);
//     } else if (timeLeft === 0) {
//       setIsRunning(false);
//       handleSessionComplete();
//     }
//     return () => clearInterval(interval);
//   }, [isRunning, timeLeft]);

//   const handleSessionComplete = () => {
//     if (!isBreak) {
//       // Work session completed
//       const newCompletedPomodoros = completedPomodoros + 1;
//       setCompletedPomodoros(newCompletedPomodoros);
      
//       if (newCompletedPomodoros >= 4) {
//         // Task completed after 4 pomodoros
//         onComplete();
//         return;
//       }
      
//       // Start break
//       setIsBreak(true);
//       setTimeLeft(newCompletedPomodoros % 4 === 0 ? LONG_BREAK : SHORT_BREAK);
//     } else {
//       // Break completed
//       setIsBreak(false);
//       setTimeLeft(WORK_TIME);
//       setSession(session + 1);
//     }
//   };

//   const formatTime = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const getCurrentSessionTime = () => {
//     if (isBreak) {
//       return completedPomodoros % 4 === 0 ? LONG_BREAK : SHORT_BREAK;
//     }
//     return WORK_TIME;
//   };

//   const progressPercentage = ((getCurrentSessionTime() - timeLeft) / getCurrentSessionTime()) * 100;

//   const handlePlayPause = () => {
//     setIsRunning(!isRunning);
//   };

//   const handleReset = () => {
//     setIsRunning(false);
//     setTimeLeft(isBreak ? getCurrentSessionTime() : WORK_TIME);
//   };

//   const handleStop = () => {
//     setIsRunning(false);
//     onExit();
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
//       <motion.div
//         initial={{ scale: 0.9, opacity: 0 }}
//         animate={{ scale: 1, opacity: 1 }}
//         className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center"
//       >
//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <button
//             onClick={handleStop}
//             className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
//           >
//             <ArrowLeft className="w-6 h-6" />
//           </button>
//           <h1 className="text-xl font-bold text-gray-800">
//             {isBreak ? 'Break Time' : 'Pomodoro'}
//           </h1>
//           <div className="w-10 h-6"></div>
//         </div>

//         {/* Session Info */}
//         <div className="mb-6">
//           <div className="flex justify-center items-center space-x-2 mb-2">
//             {isBreak ? (
//               <Coffee className="w-5 h-5 text-orange-500" />
//             ) : (
//               <div className="w-5 h-5 bg-green-500 rounded-full"></div>
//             )}
//             <span className="text-sm font-medium text-gray-600">
//               {isBreak 
//                 ? `${completedPomodoros % 4 === 0 ? 'Long' : 'Short'} Break`
//                 : `Session ${session}`
//               }
//             </span>
//           </div>
//           <div className="flex justify-center space-x-1">
//             {[1, 2, 3, 4].map((i) => (
//               <div
//                 key={i}
//                 className={`w-3 h-3 rounded-full ${
//                   i <= completedPomodoros 
//                     ? 'bg-green-500' 
//                     : 'bg-gray-200'
//                 }`}
//               />
//             ))}
//           </div>
//         </div>

//         {/* Progress Circle */}
//         <div className="relative w-64 h-64 mx-auto mb-8">
//           <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
//             <circle
//               cx="50"
//               cy="50"
//               r="45"
//               fill="none"
//               stroke="#e5e7eb"
//               strokeWidth="8"
//             />
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
//               <div className="text-4xl font-mono font-bold text-gray-800">
//                 {formatTime(timeLeft)}
//               </div>
//               <div className="text-sm text-gray-500 mt-2">
//                 {Math.round(progressPercentage)}% Complete
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Controls */}
//         <div className="flex justify-center space-x-4 mb-8">
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={handlePlayPause}
//             className={`p-4 rounded-full ${
//               isRunning 
//                 ? 'bg-yellow-500 hover:bg-yellow-600' 
//                 : 'bg-green-500 hover:bg-green-600'
//             } text-white shadow-lg transition-colors`}
//           >
//             {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
//           </motion.button>
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={handleReset}
//             className="p-4 rounded-full bg-gray-500 hover:bg-gray-600 text-white shadow-lg transition-colors"
//           >
//             <RotateCcw className="w-8 h-8" />
//           </motion.button>
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={handleStop}
//             className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-colors"
//           >
//             <Square className="w-8 h-8" />
//           </motion.button>
//         </div>

//         {/* Task Info */}
//         <div className="bg-green-50 rounded-xl p-4">
//           <h3 className="font-semibold text-gray-800 mb-2">Current Task</h3>
//           <p className="text-gray-700">{task?.title || 'Untitled Task'}</p>
//           {task?.description && (
//             <p className="text-sm text-gray-500 mt-1">{task.description}</p>
//           )}
//           <div className="mt-3 text-sm text-gray-600">
//             <p>Completed: {completedPomodoros}/4 sessions</p>
//             <p>Estimated time: {task?.estimatedTime || 25} minutes</p>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// }

// // 'use client';
// // import React, { useState, useEffect, useRef } from 'react';
// // import { motion } from 'framer-motion';
// // import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

// // export default function PomodoroContent() {
// //   const [minutes, setMinutes] = useState(25);
// //   const [seconds, setSeconds] = useState(0);
// //   const [isActive, setIsActive] = useState(false);
// //   const [mode, setMode] = useState('work'); // 'work', 'shortBreak', 'longBreak'
// //   const intervalRef = useRef(null);

// //   // Timer settings
// //   const timerSettings = {
// //     work: 25,
// //     shortBreak: 5,
// //     longBreak: 15
// //   };

// //   useEffect(() => {
// //     if (isActive) {
// //       intervalRef.current = setInterval(() => {
// //         if (seconds === 0) {
// //           if (minutes === 0) {
// //             // Timer finished
// //             setIsActive(false);
// //             // Handle session completion here
// //             handleSessionComplete();
// //           } else {
// //             setMinutes(minutes - 1);
// //             setSeconds(59);
// //           }
// //         } else {
// //           setSeconds(seconds - 1);
// //         }
// //       }, 1000);
// //     } else {
// //       clearInterval(intervalRef.current);
// //     }

// //     return () => clearInterval(intervalRef.current);
// //   }, [isActive, minutes, seconds]);

// //   const handleSessionComplete = () => {
// //     // Play notification sound or show alert
// //     alert(`${mode} session completed!`);
    
// //     // Auto-switch to next mode
// //     if (mode === 'work') {
// //       setMode('shortBreak');
// //       resetTimer('shortBreak');
// //     } else {
// //       setMode('work');
// //       resetTimer('work');
// //     }
// //   };

// //   const startStop = () => {
// //     setIsActive(!isActive);
// //   };

// //   const resetTimer = (newMode = mode) => {
// //     setIsActive(false);
// //     setMinutes(timerSettings[newMode]);
// //     setSeconds(0);
// //     setMode(newMode);
// //   };

// //   const formatTime = (mins, secs) => {
// //     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
// //   };

// //   const progress = ((timerSettings[mode] * 60 - (minutes * 60 + seconds)) / (timerSettings[mode] * 60)) * 100;

// //   return (
// //     <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50">
// //       <motion.div
// //         initial={{ scale: 0.9, opacity: 0 }}
// //         animate={{ scale: 1, opacity: 1 }}
// //         transition={{ duration: 0.5 }}
// //         className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 max-w-md w-full text-center"
// //       >
// //         {/* Mode Selector */}
// //         <div className="flex justify-center space-x-2 mb-8">
// //           {Object.keys(timerSettings).map((timerMode) => (
// //             <button
// //               key={timerMode}
// //               onClick={() => resetTimer(timerMode)}
// //               className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
// //                 mode === timerMode
// //                   ? 'bg-blue-500 text-white'
// //                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
// //               }`}
// //             >
// //               {timerMode === 'work' ? 'Work' : 
// //                timerMode === 'shortBreak' ? 'Short Break' : 'Long Break'}
// //             </button>
// //           ))}
// //         </div>

// //         {/* Timer Display */}
// //         <div className="relative mb-8">
// //           {/* Circular Progress */}
// //           <svg className="w-64 h-64 mx-auto transform -rotate-90" viewBox="0 0 100 100">
// //             <circle
// //               cx="50"
// //               cy="50"
// //               r="45"
// //               stroke="currentColor"
// //               strokeWidth="2"
// //               fill="none"
// //               className="text-gray-200"
// //             />
// //             <circle
// //               cx="50"
// //               cy="50"
// //               r="45"
// //               stroke="currentColor"
// //               strokeWidth="2"
// //               fill="none"
// //               strokeLinecap="round"
// //               className={`transition-all duration-1000 ${
// //                 mode === 'work' ? 'text-blue-500' : 
// //                 mode === 'shortBreak' ? 'text-green-500' : 'text-purple-500'
// //               }`}
// //               strokeDasharray={`${2 * Math.PI * 45}`}
// //               strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
// //             />
// //           </svg>
          
// //           {/* Timer Text */}
// //           <div className="absolute inset-0 flex items-center justify-center">
// //             <div className="text-center">
// //               <div className="text-5xl font-mono font-bold text-gray-800 mb-2">
// //                 {formatTime(minutes, seconds)}
// //               </div>
// //               <div className="text-lg text-gray-500 capitalize">
// //                 {mode === 'shortBreak' ? 'Short Break' : 
// //                  mode === 'longBreak' ? 'Long Break' : 'Focus Time'}
// //               </div>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Controls */}
// //         <div className="flex justify-center space-x-4">
// //           <motion.button
// //             whileHover={{ scale: 1.05 }}
// //             whileTap={{ scale: 0.95 }}
// //             onClick={startStop}
// //             className={`flex items-center space-x-2 px-8 py-4 rounded-xl font-semibold text-white shadow-lg transition-colors ${
// //               isActive
// //                 ? 'bg-red-500 hover:bg-red-600'
// //                 : mode === 'work'
// //                 ? 'bg-blue-500 hover:bg-blue-600'
// //                 : mode === 'shortBreak'
// //                 ? 'bg-green-500 hover:bg-green-600'
// //                 : 'bg-purple-500 hover:bg-purple-600'
// //             }`}
// //           >
// //             {isActive ? <Pause size={20} /> : <Play size={20} />}
// //             <span>{isActive ? 'Pause' : 'Start'}</span>
// //           </motion.button>

// //           <motion.button
// //             whileHover={{ scale: 1.05 }}
// //             whileTap={{ scale: 0.95 }}
// //             onClick={() => resetTimer()}
// //             className="flex items-center space-x-2 px-6 py-4 rounded-xl bg-gray-500 text-white font-semibold hover:bg-gray-600 shadow-lg transition-colors"
// //           >
// //             <RotateCcw size={20} />
// //             <span>Reset</span>
// //           </motion.button>
// //         </div>

// //         {/* Session Info */}
// //         <div className="mt-8 text-sm text-gray-500">
// //           <p>Session: {timerSettings[mode]} minutes</p>
// //           <p>Progress: {Math.round(progress)}%</p>
// //         </div>
// //       </motion.div>
// //     </div>
// //   );
// // }
