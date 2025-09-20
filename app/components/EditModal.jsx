"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function EditModal({ isOpen, onClose, task, onSave }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
    }
  }, [task]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({ ...task, title, description });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full"
        >
          <h3 className="text-xl font-semibold mb-4">Edit Task</h3>
          <input
            type="text"
            className="w-full mb-4 px-3 py-2 border rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
          />
          <textarea
            className="w-full mb-4 px-3 py-2 border rounded"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task description"
          />
          <div className="flex justify-end gap-4">
            <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
              Cancel
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={handleSubmit}>
              Save
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
