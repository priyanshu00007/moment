"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, RotateCcw, ArrowLeft, Plus, Minus } from 'lucide-react';

export default function FocusSession({ task, onComplete, onExit }) {
  const initialTime = Math.max(task?.estimatedTime || 60, 60) * 60;
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [totalTime, setTotalTime] = useState(initialTime);
  const [workedTime, setWorkedTime] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('focusSession');
    if (stored) {
      const { timeLeft, totalTime, workedTime, isRunning, lastStoppedAt } = JSON.parse(stored);
      let updatedTimeLeft = timeLeft;
      let updatedWorkedTime = workedTime;

      if (lastStoppedAt && isRunning) {
        const elapsed = Math.floor((Date.now() - lastStoppedAt) / 1000);
        updatedTimeLeft = Math.max(timeLeft - elapsed, 0);
        updatedWorkedTime = workedTime + elapsed;
      }

      setTimeLeft(updatedTimeLeft);
      setTotalTime(totalTime);
      setWorkedTime(updatedWorkedTime);
      setIsRunning(false);
    }
  }, []);

  // Save to localStorage and update global stats
  const saveSession = (stopped = false) => {
    const sessionData = {
      timeLeft,
      totalTime,
      workedTime,
      isRunning: !stopped,
      lastStoppedAt: stopped || !isRunning ? Date.now() : null,
      taskId: task?._id,
      taskTitle: task?.title
    };
    localStorage.setItem('focusSession', JSON.stringify(sessionData));

    // Update global focus stats
    updateGlobalStats();
  };

  // Update global statistics
  const updateGlobalStats = () => {
    const today = new Date().toDateString();
    const stats = JSON.parse(localStorage.getItem('focusStats') || '{}');
    
    // Initialize today's stats if not exists
    if (!stats[today]) {
      stats[today] = {
        totalFocusTime: 0,
        sessionsCompleted: 0,
        tasksWorkedOn: new Set()
      };
    }

    // Convert Set to array for storage, then back to Set
    if (Array.isArray(stats[today].tasksWorkedOn)) {
      stats[today].tasksWorkedOn = new Set(stats[today].tasksWorkedOn);
    }

    // Update stats
    stats[today].totalFocusTime = Math.floor(workedTime / 60); // in minutes
    if (task?._id) {
      stats[today].tasksWorkedOn.add(task._id);
    }

    // Convert Set back to array for storage
    const statsToStore = {
      ...stats,
      [today]: {
        ...stats[today],
        tasksWorkedOn: Array.from(stats[today].tasksWorkedOn)
      }
    };

    localStorage.setItem('focusStats', JSON.stringify(statsToStore));
  };

  useEffect(() => {
    saveSession();
  }, [timeLeft, totalTime, workedTime, isRunning]);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
        setWorkedTime(w => w + 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleSessionComplete = () => {
    // Mark session as completed
    const today = new Date().toDateString();
    const stats = JSON.parse(localStorage.getItem('focusStats') || '{}');
    
    if (!stats[today]) {
      stats[today] = {
        totalFocusTime: 0,
        sessionsCompleted: 0,
        tasksWorkedOn: []
      };
    }

    stats[today].sessionsCompleted += 1;
    stats[today].totalFocusTime = Math.floor(workedTime / 60);
    
    localStorage.setItem('focusStats', JSON.stringify(stats));

    // Clear session data
    localStorage.removeItem('focusSession');
    
    onComplete();
  };

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
    setWorkedTime(0);
  };

  const handleStop = () => {
    setIsRunning(false);
    
    // Save final session data
    const today = new Date().toDateString();
    const stats = JSON.parse(localStorage.getItem('focusStats') || '{}');
    
    if (!stats[today]) {
      stats[today] = {
        totalFocusTime: 0,
        sessionsCompleted: 0,
        tasksWorkedOn: []
      };
    }

    stats[today].totalFocusTime = Math.floor(workedTime / 60);
    localStorage.setItem('focusStats', JSON.stringify(stats));
    
    saveSession(true);
    onExit();
  };

  const changeTime = (deltaMinutes) => {
    if (isRunning) return;
    const newTotal = Math.max(totalTime / 60 + deltaMinutes, 60);
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
            {!isRunning && (
              <div className="flex mt-4 space-x-4">
                <button onClick={() => changeTime(-5)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                  <Minus className="w-5 h-5"/>
                </button>
                <button onClick={() => changeTime(5)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                  <Plus className="w-5 h-5"/>
                </button>
              </div>
            )}
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
          <h3 className="font-semibold text-gray-800 mb-2">{task?.title || 'Focus Session'}</h3>
          <p className="text-gray-700">{task?.description || 'Stay focused and productive'}</p>
          <div className="mt-3 text-sm text-gray-600">
            <p>Time worked: {formatTime(workedTime)}</p>
            <p>Target: {formatTime(totalTime)}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
