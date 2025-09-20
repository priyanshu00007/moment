"use client"
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function ProductivityModal({ isOpen, onSubmit }) {
  const [level, setLevel] = useState('Medium');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(level);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        className="bg-white rounded-2xl p-8 w-full max-w-sm sm:max-w-md shadow-2xl relative"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          What's your current productivity level?
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-200"
          >
            Submit
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}