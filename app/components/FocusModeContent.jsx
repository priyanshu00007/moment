"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, RotateCcw, ArrowLeft, Plus, Minus } from 'lucide-react';

export default function FocusSession({ task, onComplete, onExit }) {
  // Enforce minimum 60 minutes
  const initialTime = Math.max(task?.estimatedTime || 60, 60) * 60; // in seconds
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [totalTime, setTotalTime] = useState(initialTime);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      onComplete(); // Task completed
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  };

  const progressPercentage = ((totalTime - timeLeft) / totalTime) * 100;

  const handlePlayPause = () => setIsRunning(!isRunning);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(totalTime);
  };

  const handleStop = () => {
    setIsRunning(false);
    onExit();
  };

  // Increase/decrease total time dynamically
  const changeTime = (deltaMinutes) => {
    const newTotal = Math.max(totalTime / 60 + deltaMinutes, 60); // minimum 60 min
    setTotalTime(newTotal * 60);
    setTimeLeft(newTotal * 60);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={handleStop} className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Focus Mode</h1>
          <div className="w-10 h-6"></div>
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
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-mono font-bold text-gray-800">{formatTime(timeLeft)}</div>
            <div className="text-sm text-gray-500 mt-2">{Math.round(progressPercentage)}% Complete</div>

            {/* Time adjustment */}
            <div className="flex mt-4 space-x-4">
              <button onClick={() => changeTime(-5)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                <Minus className="w-5 h-5"/>
              </button>
              <button onClick={() => changeTime(5)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                <Plus className="w-5 h-5"/>
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4 mb-8">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handlePlayPause}
            className={`p-4 rounded-full ${isRunning ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'} text-white shadow-lg transition-colors`}
          >
            {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </motion.button>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleReset} className="p-4 rounded-full bg-gray-500 hover:bg-gray-600 text-white shadow-lg transition-colors">
            <RotateCcw className="w-8 h-8" />
          </motion.button>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleStop} className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-colors">
            <Square className="w-8 h-8" />
          </motion.button>
        </div>

        {/* Task Info */}
        <div className="bg-blue-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Current Task</h3>
          <p className="text-gray-700">{task?.title || 'Untitled Task'}</p>
          {task?.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
        </div>
      </motion.div>
    </div>
  );
}

// "use client";

// import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { Play, Pause, Square, RotateCcw, ArrowLeft } from 'lucide-react';

// export default function FocusSession({ task, onComplete, onExit }) {
//   const [timeLeft, setTimeLeft] = useState((task?.estimatedTime || 25) * 60); // Convert minutes to seconds
//   const [isRunning, setIsRunning] = useState(false);
//   const [totalTime] = useState((task?.estimatedTime || 25) * 60);

//   useEffect(() => {
//     let interval = null;
//     if (isRunning && timeLeft > 0) {
//       interval = setInterval(() => {
//         setTimeLeft(timeLeft => timeLeft - 1);
//       }, 1000);
//     } else if (timeLeft === 0) {
//       setIsRunning(false);
//       onComplete(); // Task completed
//     }
//     return () => clearInterval(interval);
//   }, [isRunning, timeLeft, onComplete]);

//   const formatTime = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const progressPercentage = ((totalTime - timeLeft) / totalTime) * 100;

//   const handlePlayPause = () => {
//     setIsRunning(!isRunning);
//   };

//   const handleReset = () => {
//     setIsRunning(false);
//     setTimeLeft(totalTime);
//   };

//   const handleStop = () => {
//     setIsRunning(false);
//     onExit();
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
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
//           <h1 className="text-xl font-bold text-gray-800">Focus Mode</h1>
//           <div className="w-10 h-6"></div> {/* Spacer */}
//         </div>

//         {/* Progress Circle */}
//         <div className="relative w-64 h-64 mx-auto mb-8">
//           <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
//             {/* Background circle */}
//             <circle
//               cx="50"
//               cy="50"
//               r="45"
//               fill="none"
//               stroke="#e5e7eb"
//               strokeWidth="8"
//             />
//             {/* Progress circle */}
//             <circle
//               cx="50"
//               cy="50"
//               r="45"
//               fill="none"
//               stroke="#3b82f6"
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
//                 : 'bg-blue-500 hover:bg-blue-600'
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
//         <div className="bg-blue-50 rounded-xl p-4">
//           <h3 className="font-semibold text-gray-800 mb-2">Current Task</h3>
//           <p className="text-gray-700">{task?.title || 'Untitled Task'}</p>
//           {task?.description && (
//             <p className="text-sm text-gray-500 mt-1">{task.description}</p>
//           )}
//         </div>
//       </motion.div>
//     </div>
//   );
// }
// not working
// "use client";
// import React, { useState, useEffect, useRef } from 'react';
// import { useUser } from '@clerk/nextjs';
// import { motion } from 'framer-motion';
// import { getDayOfYear, format } from 'date-fns';
// import { LucideFocus, Pause, Play, StopCircle, Music, Flower } from 'lucide-react';
// import { sessionApi, taskApi } from '@/backend/lib/api';   // ← new

// export default function FocusModeContent({ activeTask, setTasks, setUserData }) {
//   const { user } = useUser();

//   const [time, setTime]               = useState(0);
//   const [isRunning, setIsRunning]     = useState(false);
//   const [sessionsToday, setSessionsToday] = useState(0);
//   const [flowersGrown, setFlowersGrown]   = useState(0);
//   const [lastSessionDay, setLastSessionDay] = useState(getDayOfYear(new Date()));
//   const [message, setMessage]         = useState('');
//   const [isMusicPlaying, setIsMusicPlaying] = useState(false);
//   const audioRef = useRef(null);

//   /* reset daily counters at midnight */
//   useEffect(() => {
//     const today = getDayOfYear(new Date());
//     if (today !== lastSessionDay) {
//       setSessionsToday(0);
//       setLastSessionDay(today);
//     }
//   }, [lastSessionDay]);

//   useEffect(() => { alert('Focus mode counts only if timer > 1 hr'); }, []);

//   /* timer */
//   useEffect(() => {
//     if (!isRunning) return;
//     const id = setInterval(() => setTime((t) => t + 1), 1000);
//     return () => clearInterval(id);
//   }, [isRunning]);

//   /* start / pause */
//   const handleStartPause = () => { setIsRunning((r) => !r); setMessage(''); };

//   /* save session + optional task completion */
//   const handleStopAndSave = async () => {
//     setIsRunning(false);
//     if (time < 3600) {                        // <1 hr
//       if (time > 0) setMessage('Session under 1 hr was not recorded.');
//       setTime(0); return;
//     }

//     try {
//       /* 1️⃣  record session */
//       await sessionApi.create({
//   userId: user.id,
//   taskId: activeTask?._id ?? null,
//   duration: time,
//   startedAt: new Date(Date.now() - time * 1000),
//   endedAt: new Date(),
// });


//       /* 2️⃣  optionally mark task complete */
//       if (activeTask && activeTask.status !== 'completed') {
//         const r = await taskApi.updateTask(activeTask._id, { status: 'completed', completedAt: new Date() });
//         setTasks((prev) => prev.map((t) => (t._id === r.data._id ? r.data : t)));
//       }

//       /* 3️⃣  update user dashboard stats locally */
//       setUserData((prev) => prev && {
//         ...prev,
//         xp: prev.xp + 10,
//         totalFocusTime: prev.totalFocusTime + Math.round(time / 60),
//         totalPomodoroSessions: prev.totalPomodoroSessions + 1,
//         history: [
//           {
//   _id: Date.now().toString(),
//   title: activeTask ? activeTask.title : 'Focus Session',
//   type: 'Focus',
//   completedAt: new Date().toISOString(),
// }
// ,
//           ...prev.history,
//         ].slice(0, 10),
//       });

//       /* 4️⃣  local UI counters */
//       setSessionsToday((c) => c + 1);
//       setFlowersGrown((f) => f + 1);
//       setMessage(`Session of ${formatTime(time)} saved! 🌼`);
//     } catch (err) {
//       console.error('Save session error:', err);
//       setMessage('Failed to save session.');
//     } finally {
//       setTime(0);
//     }
//   };

//   /* bg-music */
//   const toggleMusic = () => {
//     if (isMusicPlaying) audioRef.current.pause();
//     else                audioRef.current.play();
//     setIsMusicPlaying((m) => !m);
//   };

//   /* helper */
//   const formatTime = (s) => {
//     const h = Math.floor(s / 3600);
//     const m = Math.floor((s % 3600) / 60);
//     const t = s % 60;
//     return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(t).padStart(2,'0')}`;
//   };

//   /* UI (unchanged except for message variable) */
//   return (
//     <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-center">
//       <audio ref={audioRef} loop src="https://www.dropbox.com/s/xci6pjthkc751e8/Memories%20of%20a%20Friend.mp3?raw=1" />
//       <motion.div
//         initial={{ scale: 0.8, opacity: 0 }}
//         animate={{ scale: 1, opacity: 1 }}
//         transition={{ duration: 0.5 }}
//         className="bg-white p-8 sm:p-12 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col items-center space-y-8"
//       >
//         <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">Focus Session</h2>

//         {/* timer */}
//         <div className="relative">
//           <motion.div
//             key={time}
//             initial={{ scale: 0.8, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             transition={{ duration: 0.3 }}
//             className="text-6xl sm:text-7xl font-mono font-extrabold text-blue-600 tracking-wide"
//           >
//             {formatTime(time)}
//           </motion.div>
//           <div className="text-lg text-gray-500 mt-2">Sessions Today: {sessionsToday}</div>

//           <div className="text-lg text-gray-500 mt-2 flex items-center justify-center space-x-2">
//             <Flower className="w-6 h-6 text-green-500" />
//             <span>Flowers Grown: {flowersGrown}</span>
//           </div>

//           {flowersGrown > 0 && (
//             <div className="flex flex-wrap justify-center mt-4 gap-2">
//               {Array.from({ length: flowersGrown }).map((_, i) => (
//                 <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.1 }}>
//                   <Flower className="w-8 h-8 text-green-500" />
//                 </motion.div>
//               ))}
//             </div>
//           )}
//         </div>

//         {message && (
//           <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-indigo-600 font-semibold">
//             {message}
//           </motion.p>
//         )}

//         {/* controls */}
//         <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full justify-center">
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={handleStartPause}
//             className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold shadow-md transition-colors 
//               ${isRunning ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
//           >
//             {isRunning ? <Pause size={20} /> : <Play size={20} />}
//             <span>{isRunning ? 'Pause' : 'Start'}</span>
//           </motion.button>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={handleStopAndSave}
//             disabled={time === 0 && !isRunning}
//             className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 font-semibold shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
//           >
//             <StopCircle size={20} />
//             <span>Stop & Save</span>
//           </motion.button>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={toggleMusic}
//             className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-purple-500 text-white hover:bg-purple-600 font-semibold shadow-md"
//           >
//             <Music size={20} />
//             <span>{isMusicPlaying ? 'Pause Music' : 'Play Music'}</span>
//           </motion.button>
//         </div>
//       </motion.div>

//       {activeTask && (
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl shadow-lg mt-8 w-full max-w-lg text-left">
//           <div className="flex items-center space-x-3 mb-2">
//             <LucideFocus className="w-6 h-6 text-blue-500" />
//             <h3 className="text-xl font-semibold text-gray-800">Currently Focusing On</h3>
//           </div>
//           <p className="text-gray-700 font-medium">{activeTask.title}</p>
//           <p className="text-gray-500 text-sm">{activeTask.description}</p>
//         </motion.div>
//       )}
//     </div>
//   );
// }
