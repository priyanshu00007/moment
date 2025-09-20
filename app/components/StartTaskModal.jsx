"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Focus, Timer } from 'lucide-react';

export default function StartTaskModal({ isOpen, onClose, onSelectMode, task }) {
  if (!isOpen) return null;

  const handleModeSelection = (mode) => {
    onSelectMode(mode, task); // Pass both mode and task
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
            className="bg-white rounded-2xl p-8 w-full max-w-sm sm:max-w-md shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              Choose Your Focus Mode
            </h2>
            {task && (
              <p className="text-gray-600 text-center mb-6">
                Starting: <span className="font-semibold">{task.title}</span>
              </p>
            )}
            <div className="flex flex-col space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleModeSelection('focus')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Focus className="w-6 h-6" />
                <span>Focus Mode</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleModeSelection('pomodoro')}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Timer className="w-6 h-6" />
                <span>Pomodoro Technique</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
