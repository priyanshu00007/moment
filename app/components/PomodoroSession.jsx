"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Square, RotateCcw, ArrowLeft, Coffee } from "lucide-react";

export default function PomodoroSession({ activeTask, onTaskComplete, setTasks, setUserData, userData }) {
  const WORK_TIME = 25 * 60;
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 15 * 60;

  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [session, setSession] = useState(1);
  const [totalWorkedTime, setTotalWorkedTime] = useState(0);

  const timerRef = useRef(null);

  // Load from localStorage and adjust timeLeft based on lastStoppedAt
  useEffect(() => {
    const stored = localStorage.getItem("pomodoroSession");
    if (stored) {
      const { timeLeft, completedPomodoros, isBreak, session, totalWorkedTime, lastStoppedAt } = JSON.parse(stored);
      let updatedTimeLeft = timeLeft;
      let updatedWorkedTime = totalWorkedTime || 0;

      if (lastStoppedAt) {
        const elapsed = Math.floor((Date.now() - lastStoppedAt) / 1000);
        updatedTimeLeft = Math.max(timeLeft - elapsed, 0);
        
        // Only add to worked time if it was a work session
        if (!isBreak) {
          updatedWorkedTime = totalWorkedTime + elapsed;
        }
      }

      setTimeLeft(updatedTimeLeft);
      setCompletedPomodoros(completedPomodoros);
      setIsBreak(isBreak);
      setSession(session);
      setTotalWorkedTime(updatedWorkedTime);
    }
  }, []);

  // Save to localStorage whenever changes happen or on stop
  const saveSession = (stopped = false) => {
    const data = {
      timeLeft,
      completedPomodoros,
      isBreak,
      session,
      totalWorkedTime,
      lastStoppedAt: stopped ? Date.now() : null,
      taskId: activeTask?._id,
      taskTitle: activeTask?.title
    };
    localStorage.setItem("pomodoroSession", JSON.stringify(data));

    // Update global stats
    updateGlobalStats();
  };

  // Update global statistics
  const updateGlobalStats = () => {
    const today = new Date().toDateString();
    const stats = JSON.parse(localStorage.getItem('pomodoroStats') || '{}');
    
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
    stats[today].totalFocusTime = Math.floor(totalWorkedTime / 60); // in minutes
    stats[today].sessionsCompleted = completedPomodoros;
    if (activeTask?._id) {
      stats[today].tasksWorkedOn.add(activeTask._id);
    }

    // Convert Set back to array for storage
    const statsToStore = {
      ...stats,
      [today]: {
        ...stats[today],
        tasksWorkedOn: Array.from(stats[today].tasksWorkedOn)
      }
    };

    localStorage.setItem('pomodoroStats', JSON.stringify(statsToStore));
  };

  useEffect(() => {
    saveSession();
  }, [timeLeft, completedPomodoros, isBreak, session, totalWorkedTime]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        
        // Only count work time, not break time
        if (!isBreak) {
          setTotalWorkedTime(prev => prev + 1);
        }
      }, 1000);
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

      // Check if we've completed 4 pomodoros
      if (newCompleted >= 4) {
        // Task is complete!
        handleTaskComplete();
        return;
      }

      // Start break
      setIsBreak(true);
      setTimeLeft(newCompleted % 4 === 0 ? LONG_BREAK : SHORT_BREAK);
    } else {
      // Break is over, start new work session
      setIsBreak(false);
      setTimeLeft(WORK_TIME);
      setSession(prev => prev + 1);
    }

    // Auto-start next session after a brief pause
    setIsRunning(false);
    setTimeout(() => {
      setIsRunning(true);
    }, 2000);
  };

  const handleTaskComplete = () => {
    // Save final stats
    const today = new Date().toDateString();
    const stats = JSON.parse(localStorage.getItem('pomodoroStats') || '{}');
    
    if (!stats[today]) {
      stats[today] = {
        totalFocusTime: 0,
        sessionsCompleted: 0,
        tasksWorkedOn: []
      };
    }

    stats[today].sessionsCompleted = completedPomodoros;
    stats[today].totalFocusTime = Math.floor(totalWorkedTime / 60);
    
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));

    // Clear session data
    localStorage.removeItem('pomodoroSession');
    
    // Notify parent component
    onTaskComplete();
  };

  const handlePlayPause = () => setIsRunning(prev => !prev);

  const handleReset = () => {
    setIsRunning(false);
    if (isBreak) {
      setTimeLeft(completedPomodoros % 4 === 0 ? LONG_BREAK : SHORT_BREAK);
    } else {
      setTimeLeft(WORK_TIME);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    
    // Save final session data
    const today = new Date().toDateString();
    const stats = JSON.parse(localStorage.getItem('pomodoroStats') || '{}');
    
    if (!stats[today]) {
      stats[today] = {
        totalFocusTime: 0,
        sessionsCompleted: 0,
        tasksWorkedOn: []
      };
    }

    stats[today].totalFocusTime = Math.floor(totalWorkedTime / 60);
    stats[today].sessionsCompleted = completedPomodoros;
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
    
    saveSession(true); // Save last stopped time
    onTaskComplete();
  };

  const formatTime = sec => `${Math.floor(sec / 60).toString().padStart(2, "0")}:${(sec % 60).toString().padStart(2, "0")}`;
  const getCurrentSessionTime = () => (isBreak ? (completedPomodoros % 4 === 0 ? LONG_BREAK : SHORT_BREAK) : WORK_TIME);
  const progressPercentage = ((getCurrentSessionTime() - timeLeft) / getCurrentSessionTime()) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
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
          <h1 className="text-xl font-bold text-gray-800">
            {isBreak ? "Break Time" : "Pomodoro"}
          </h1>
          <div className="w-10 h-6"></div>
        </div>

        {/* Session Info */}
        <div className="mb-6">
          <div className="flex justify-center items-center space-x-2 mb-2">
            {isBreak ? (
              <Coffee className="w-5 h-5 text-orange-500" />
            ) : (
              <div className="w-5 h-5 bg-green-500 rounded-full"></div>
            )}
            <span className="text-sm font-medium text-gray-600">
              {isBreak 
                ? `${completedPomodoros % 4 === 0 ? "Long" : "Short"} Break` 
                : `Session ${session}`
              }
            </span>
          </div>
          <div className="flex justify-center space-x-1">
            {[1,2,3,4].map(i => (
              <div 
                key={i} 
                className={`w-3 h-3 rounded-full ${
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
              <div className="text-4xl font-mono font-bold text-gray-800">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {Math.round(progressPercentage)}% Complete
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4 mb-8">
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={handlePlayPause} 
            className={`p-4 rounded-full ${
              isRunning 
                ? "bg-yellow-500 hover:bg-yellow-600" 
                : "bg-green-500 hover:bg-green-600"
            } text-white shadow-lg transition-colors`}
          >
            {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={handleReset} 
            className="p-4 rounded-full bg-gray-500 hover:bg-gray-600 text-white shadow-lg transition-colors"
          >
            <RotateCcw className="w-8 h-8" />
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={handleStop} 
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-colors"
          >
            <Square className="w-8 h-8" />
          </motion.button>
        </div>

        {/* Task Info */}
        <div className="bg-green-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Current Task</h3>
          <p className="text-gray-700">{activeTask?.title || "Untitled Task"}</p>
          {activeTask?.description && (
            <p className="text-sm text-gray-500 mt-1">{activeTask.description}</p>
          )}
          <div className="mt-3 text-sm text-gray-600">
            <p>Completed: {completedPomodoros}/4 sessions</p>
            <p>Total work time: {formatTime(totalWorkedTime)}</p>
            <p>Estimated time: {activeTask?.estimatedTime || 25} minutes</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
