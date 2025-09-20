'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings, Play, Pause, Music, LucideFocus } from 'lucide-react';
import PomodoroSettingsModal from './PomodoroSettingsModal';

export default function PomodoroContent({ activeTask, setTasks, setUserData }) {
  const [pomodoroSettings, setPomodoroSettings] = useState({
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4,
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [mode, setMode] = useState('work');
  const [time, setTime] = useState(pomodoroSettings.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!isRunning || time <= 0) {
      if (time <= 0 && isRunning) {
        setIsRunning(false);
        handleSessionEnd();
      }
      return;
    }
    const interval = setInterval(() => setTime(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning, time]);
  
  useEffect(() => {
    if (!isRunning) {
        switchMode(mode, pomodoroSettings);
    }
  }, [pomodoroSettings]);

  const handleSessionEnd = () => {
    if (mode === 'work') {
      const newCompletedCount = pomodorosCompleted + 1;
      setPomodorosCompleted(newCompletedCount);
      if (activeTask) { /* ... (task completion logic) ... */ }
      if (newCompletedCount % pomodoroSettings.sessionsUntilLongBreak === 0) {
        switchMode('longBreak');
      } else {
        switchMode('shortBreak');
      }
    } else {
      switchMode('work');
    }
  };

  const switchMode = (newMode, currentSettings = pomodoroSettings) => {
    setMode(newMode);
    setIsRunning(false);
    setTime(currentSettings[newMode] * 60);
  };
  
  const handleSaveSettings = (newSettings) => {
    setPomodoroSettings(newSettings);
    if (!isRunning) {
        switchMode(mode, newSettings);
    }
    setIsSettingsModalOpen(false);
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const toggleMusic = () => { /* ... (music logic) ... */ };
  const formatTime = (seconds) => {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  };
  const getModeButtonClass = (buttonMode) => mode === buttonMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-center">
      <audio ref={audioRef} loop src="https://www.dropbox.com/s/xci6pjthkc751e8/Memories%20of%20a%20Friend.mp3?raw=1" />
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
        className="bg-white p-8 sm:p-12 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col items-center space-y-8">
        
        <div className="w-full flex justify-between items-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">Pomodoro Timer</h2>
            <motion.button 
                whileHover={{ scale: 1.1, rotate: 15 }} 
                whileTap={{ scale: 0.9 }} 
                onClick={() => setIsSettingsModalOpen(true)}
                className="text-gray-500 hover:text-blue-600 p-2 rounded-full"
                title="Custom Times"
            >
                <Settings size={24} />
            </motion.button>
        </div>

        <div className="flex space-x-2 sm:space-x-4">
          <button onClick={() => switchMode('work')} className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${getModeButtonClass('work')}`}>
            Work ({pomodoroSettings.work} min)
          </button>
          <button onClick={() => switchMode('shortBreak')} className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${getModeButtonClass('shortBreak')}`}>
            Short Break ({pomodoroSettings.shortBreak} min)
          </button>
          <button onClick={() => switchMode('longBreak')} className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${getModeButtonClass('longBreak')}`}>
            Long Break ({pomodoroSettings.longBreak} min)
          </button>
        </div>

        <motion.div key={time} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}
            className="text-6xl sm:text-8xl font-mono font-extrabold text-blue-600 tracking-wide">
            {formatTime(time)}
        </motion.div>
        
        <p className="text-gray-500 font-medium">Completed Pomodoros: <span className="font-bold text-gray-700">{pomodorosCompleted}</span></p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full justify-center">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleTimer}
            className={`w-full text-2xl flex items-center justify-center space-x-3 px-6 py-4 rounded-xl font-bold shadow-lg transition-all duration-200 ${isRunning ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
            {isRunning ? <Pause size={28} /> : <Play size={28} />}
            <span>{isRunning ? 'PAUSE' : 'START'}</span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleMusic}
            className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-purple-500 text-white hover:bg-purple-600 font-semibold shadow-md transition-colors duration-200">
            <Music size={20} />
            <span>{isMusicPlaying ? 'Pause Music' : 'Play Music'}</span>
          </motion.button>
        </div>
      </motion.div>

      <PomodoroSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSubmit={handleSaveSettings}
        currentSettings={pomodoroSettings}
      />

      {activeTask && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-lg mt-8 w-full max-w-lg text-left">
           <div className="flex items-center space-x-3 mb-2">
            <LucideFocus className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-semibold text-gray-800">Currently Focusing On</h3>
          </div>
          <p className="text-gray-700 font-medium">{activeTask.title}</p>
          <p className="text-gray-500 text-sm">{activeTask.description}</p>
        </motion.div>
      )}
    </div>
  );
}
