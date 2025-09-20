// components/TaskModal.js
"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Tag, Flag } from "lucide-react";

export default function TaskModal({ isOpen, onClose, onSubmit, task }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "personal",
    priority: "medium",
    estimatedMinutes: 25,
    dueDate: "",
    isRecurring: false,
    recurringPattern: "daily"
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        category: task.category || "personal",
        priority: task.priority || "medium",
        estimatedMinutes: task.estimatedMinutes || 25,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
        isRecurring: task.isRecurring || false,
        recurringPattern: task.recurringPattern || "daily"
      });
    } else {
      // Reset form for new task
      setFormData({
        title: "",
        description: "",
        category: "personal",
        priority: "medium",
        estimatedMinutes: 25,
        dueDate: "",
        isRecurring: false,
        recurringPattern: "daily"
      });
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please enter a task title");
      return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black bg-opacity-50"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">
              {task ? "Edit Task" : "Create New Task"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter task title..."
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
                placeholder="Add task description..."
              />
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Tag className="inline w-4 h-4 mr-1" />
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="study">Study</option>
                  <option value="health">Health</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Flag className="inline w-4 h-4 mr-1" />
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Estimated Time & Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="inline w-4 h-4 mr-1" />
                                    Estimated Time (min)
                </label>
                <input
                  type="number"
                  value={formData.estimatedMinutes}
                  onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="1"
                  max="480"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Recurring Task */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Recurring Task</span>
              </label>
              
              {formData.isRecurring && (
                <select
                  value={formData.recurringPattern}
                  onChange={(e) => setFormData({ ...formData, recurringPattern: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                {task ? "Update Task" : "Create Task"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
// "use client"
// import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { X } from 'lucide-react';

// export default function TaskModal({ isOpen, onClose, onSubmit, editingTask }) {
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [duration, setDuration] = useState(30);
//   const [energy, setEnergy] = useState('Medium');
//   const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
//   const [priority, setPriority] = useState('medium');

//   useEffect(() => {
//     if (editingTask) {
//       setTitle(editingTask.title);
//       setDescription(editingTask.description);
//       setDuration(editingTask.duration);
//       setEnergy(editingTask.energy);
//       setDate(editingTask.date);
//       setPriority(editingTask.priority);
//     } else {
//       setTitle('');
//       setDescription('');
//       setDuration(30);
//       setEnergy('Medium');
//       setDate(new Date().toISOString().split('T')[0]);
//       setPriority('medium');
//     }
//   }, [editingTask, isOpen]);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onSubmit({ title, description, duration: Number(duration), energy, date, priority });
//   };

//   if (!isOpen) return null;

//   return (
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
//       <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="bg-white rounded-2xl p-8 w-full max-w-sm sm:max-w-md shadow-2xl relative">
//         <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
//           <X className="w-6 h-6" />
//         </button>
//         <h2 className="text-2xl font-bold text-gray-800 mb-6">{editingTask ? 'Edit Task' : 'Add New Task'}</h2>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label htmlFor="title" className="block text-gray-700 text-sm font-medium mb-1">Title</label>
//             <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
//           </div>
//           <div>
//             <label htmlFor="description" className="block text-gray-700 text-sm font-medium mb-1">Description</label>
//             <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]" rows="3"></textarea>
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div>
//               <label htmlFor="duration" className="block text-gray-700 text-sm font-medium mb-1">Duration (min)</label>
//               <input type="number" id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent" min="5" step="5" required />
//             </div>
//             <div>
//               <label htmlFor="energy" className="block text-gray-700 text-sm font-medium mb-1">Energy Required</label>
//               <select id="energy" value={energy} onChange={(e) => setEnergy(e.target.value)} className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
//                 <option value="Low">Low</option>
//                 <option value="Medium">Medium</option>
//                 <option value="High">High</option>
//               </select>
//             </div>
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div>
//               <label htmlFor="date" className="block text-gray-700 text-sm font-medium mb-1">Due Date</label>
//               <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
//             </div>
//             <div>
//               <label htmlFor="priority" className="block text-gray-700 text-sm font-medium mb-1">Priority</label>
//               <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
//                 <option value="low">Low</option>
//                 <option value="medium">Medium</option>
//                 <option value="high">High</option>
//               </select>
//             </div>
//           </div>
//           <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-200">
//             {editingTask ? 'Save Changes' : 'Add Task'}
//           </motion.button>
//         </form>
//       </motion.div>
//     </motion.div>
//   );
// }