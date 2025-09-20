"use client";
import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Play, Edit2, Trash2 } from "lucide-react";

export default function TaskCard({ task, index, onStart, onEdit, onDelete, onToggleComplete }) {
  const isCompleted = task.status === "completed";
  const isOverdue = task.isOverdue;
  const daysUntilDue = task.daysUntilDue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className={`p-4 rounded-2xl shadow-md flex flex-col justify-between
        ${isCompleted ? "bg-green-100" : isOverdue ? "bg-red-100" : "bg-white"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3
          className={`text-lg font-semibold ${
            isCompleted ? "line-through text-gray-500" : "text-gray-900"
          }`}
        >
          {task.title}
        </h3>
        <CheckCircle
          className={`cursor-pointer ${isCompleted ? "text-green-600" : "text-gray-300"}`}
          onClick={() => onToggleComplete(task._id)}
        />
      </div>

      {/* Description */}
      {task.description && <p className="text-sm text-gray-600 mb-2">{task.description}</p>}

      {/* Metadata */}
      <div className="flex flex-col text-sm text-gray-500 mb-2">
        <span>Category: {task.category}</span>
        <span>Priority: {task.priority}</span>
        {task.dueDate && <span>Due in: {daysUntilDue} day(s)</span>}
        <span>Progress: {task.progress.percentage}%</span>
        {task.isRecurring && <span>Recurring: {task.recurringPattern}</span>}
      </div>

      {/* Pomodoro Info */}
      {task.pomodoroSessions?.length > 0 && (
        <div className="text-xs text-gray-400 mb-2">
          <span>Sessions: {task.pomodoroSessions.length}</span>
          <span> | Total Time: {task.pomodoroSessions.reduce((sum, s) => sum + (s.duration || 0), 0)} min</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => onStart(task)}
          className="p-2 rounded-full bg-indigo-100 hover:bg-indigo-200 transition"
        >
          <Play className="w-4 h-4 text-indigo-600" />
        </button>
        <button
          onClick={() => onEdit(task)}
          className="p-2 rounded-full bg-yellow-100 hover:bg-yellow-200 transition"
        >
          <Edit2 className="w-4 h-4 text-yellow-600" />
        </button>
        <button
          onClick={() => onDelete(task._id)}
          className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
    </motion.div>
  );
}

// // components/TaskCard.jsx
// "use client";

// import React, { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { format } from "date-fns";
// import { Clock, Zap, Calendar, Play, Edit, Trash2, Check } from "lucide-react";

// export default function TaskCard({
//   task,
//   index,
//   onToggleComplete,
//   onDelete,
//   onEdit,
//   onShowStartModal, // New prop to show the focus mode modal
//   onGainXP,         // New prop to handle gaining experience
// }) {
//   const [isFadingOut, setIsFadingOut] = useState(false);

//   const priorityColors = {
//     urgent: "bg-red-500",
//     high: "bg-red-500",
//     medium: "bg-yellow-500",
//     low: "bg-green-500",
//   };

//   const energyColors = { 
//     High: "text-blue-500", 
//     Medium: "text-orange-500", 
//     Low: "text-teal-500" 
//   };

//   const isCompleted = task.status === 'completed';

//   // This function now handles the animation and calls the parent functions
//   const handleToggle = async (e) => {
//     e.stopPropagation(); // Prevent card's onClick from firing

//     // If already completed, just toggle it back without animation or XP
//     if (isCompleted) {
//       onToggleComplete(task);
//       return;
//     }

//     // --- Animation and Logic for completing a task ---
//     setIsFadingOut(true); // Trigger the fade-out animation

//     // Wait for the animation to be visible
//     await new Promise(resolve => setTimeout(resolve, 600));

//     // Call the parent functions to update the database and user stats
//     await onToggleComplete(task); // Update the task in MongoDB
//     if (onGainXP) {
//       onGainXP(10); // Award 10 XP
//     }

//     // The component will re-render as "completed" after the parent state updates
//     setIsFadingOut(false); 
//   };

//   const handleDelete = (e) => {
//     e.stopPropagation();
//     onDelete(task._id);
//   };

//   const handleEdit = (e) => {
//     e.stopPropagation();
//     onEdit(task);
//   };
  
//   const handleStart = (e) => {
//     e.stopPropagation();
//     onShowStartModal(task); // Show the focus mode modal
//   };

//   return (
//     <motion.div
//       layout
//       initial={{ opacity: 0, y: 50 }}
//       animate={{ opacity: 1, y: 0 }}
//       exit={{ opacity: 0, scale: 0.8 }}
//       transition={{ duration: 0.3, delay: index * 0.05 }}
//       className={`relative bg-white rounded-2xl shadow-lg p-6 border ${
//         isCompleted ? "border-green-300 opacity-60" : "border-gray-200"
//       } hover:shadow-xl transition-all duration-300`}
//     >
//       {/* Completion Symbol Animation */}
//       <AnimatePresence>
//         {isFadingOut && (
//           <motion.div
//             initial={{ opacity: 0, scale: 0.5 }}
//             animate={{ opacity: 1, scale: 1 }}
//             exit={{ opacity: 0, scale: 1.5 }}
//             transition={{ duration: 0.4 }}
//             className="absolute inset-0 bg-green-500/80 rounded-2xl flex items-center justify-center z-10"
//           >
//             <Check className="w-16 h-16 text-white" />
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <div className="flex justify-between items-start mb-4">
//         <h3 className={`text-lg font-semibold pr-4 ${isCompleted ? "text-gray-400 line-through" : "text-gray-800"}`}>
//           {task.title}
//         </h3>
//         <motion.button
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//           onClick={handleToggle}
//           className={`flex-shrink-0 w-6 h-6 rounded-full border-2 ${
//             isCompleted ? "bg-green-500 border-green-500" : "border-gray-300"
//           } flex items-center justify-center transition-all`}
//         >
//           {isCompleted && (
//             <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
//             </svg>
//           )}
//         </motion.button>
//       </div>

//       <p className={`text-sm text-gray-500 mb-6 ${isCompleted ? "line-through" : ""}`}>
//         {task.description || 'No description provided'}
//       </p>

//       <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mb-6">
//         <div className="flex items-center text-gray-600">
//           <Clock className="w-4 h-4 mr-2" />
//           {task.estimatedTime || 25} min
//         </div>
//         {task.energy && (
//           <div className="flex items-center text-gray-600">
//             <Zap className={`w-4 h-4 mr-2 ${energyColors[task.energy]}`} />
//             {task.energy}
//           </div>
//         )}
//         {task.dueDate && (
//           <div className="flex items-center text-gray-600">
//             <Calendar className="w-4 h-4 mr-2" />
//             {format(new Date(task.dueDate), "MMM dd")}
//           </div>
//         )}
//         <div className="flex items-center text-gray-600">
//           <span className={`w-2.5 h-2.5 rounded-full mr-2 ${priorityColors[task.priority] || priorityColors.medium}`}></span>
//           {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'}
//         </div>
//       </div>

//       <div className="flex justify-end space-x-2 border-t pt-4 -mx-6 px-6">
//         {!isCompleted && (
//           <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="p-2 text-gray-500 hover:text-blue-500" title="Start Task">
//             <Play className="w-5 h-5" />
//           </motion.button>
//         )}
//         <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleEdit} className="p-2 text-gray-500 hover:text-yellow-500" title="Edit Task">
//           <Edit className="w-5 h-5" />
//         </motion.button>
//         <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleDelete} className="p-2 text-gray-500 hover:text-red-500" title="Delete Task">
//           <Trash2 className="w-5 h-5" />
//         </motion.button>
//       </div>
//     </motion.div>
//   );
// }

// // // components/TaskCard.jsx
// // "use client";
// // import React from "react";
// // import { motion } from "framer-motion";
// // import { format } from "date-fns";
// // import { Clock, Zap, Calendar, Play, Edit, Trash2 } from "lucide-react";

// // export default function TaskCard({
// //   task,
// //   index,
// //   onStart,
// //   onEdit,
// //   onDelete,
// //   onToggleComplete,
// // }) {
// //   const priorityColors = {
// //     urgent: "text-red-500 bg-red-500",
// //     high: "text-red-500 bg-red-500",
// //     medium: "text-yellow-500 bg-yellow-500",
// //     low: "text-green-500 bg-green-500",
// //   };

// //   const energyColors = { 
// //     High: "text-blue-500", 
// //     Medium: "text-orange-500", 
// //     Low: "text-teal-500" 
// //   };

// //   // Use task._id for MongoDB compatibility
// //   const handleToggle = () => onToggleComplete(task);
// //   const handleDelete = () => onDelete(task._id);
// //   const handleEdit = () => onEdit(task);

// //   const isCompleted = task.status === 'completed';

// //   return (
// //     <motion.div
// //       layout
// //       initial={{ opacity: 0, y: 50 }}
// //       animate={{ opacity: 1, y: 0 }}
// //       exit={{ opacity: 0, scale: 0.8 }}
// //       transition={{ duration: 0.3, delay: index * 0.05 }}
// //       className={`relative bg-white rounded-2xl shadow-lg p-6 border ${
// //         isCompleted ? "border-green-300 opacity-60" : "border-gray-200"
// //       } hover:shadow-xl transition-all duration-300`}
// //     >
// //       <div className="flex justify-between items-start mb-4">
// //         <h3
// //           className={`text-lg font-semibold pr-4 ${
// //             isCompleted ? "text-gray-400 line-through" : "text-gray-800"
// //           }`}
// //         >
// //           {task.title}
// //         </h3>

// //         <motion.button
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //           onClick={handleToggle}
// //           className={`flex-shrink-0 w-6 h-6 rounded-full border-2 ${
// //             isCompleted ? "bg-green-500 border-green-500" : "border-gray-300"
// //           } flex items-center justify-center transition-all`}
// //         >
// //           {isCompleted && (
// //             <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
// //             </svg>
// //           )}
// //         </motion.button>
// //       </div>

// //       <p className={`text-sm text-gray-500 mb-6 ${isCompleted ? "line-through" : ""}`}>
// //         {task.description || 'No description provided'}
// //       </p>

// //       <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mb-6">
// //         <div className="flex items-center text-gray-600">
// //           <Clock className="w-4 h-4 mr-2" />
// //           {task.estimatedTime || task.duration || 25} min
// //         </div>
// //         {task.energy && (
// //           <div className="flex items-center text-gray-600">
// //             <Zap className={`w-4 h-4 mr-2 ${energyColors[task.energy]}`} />
// //             {task.energy}
// //           </div>
// //         )}
// //         {task.dueDate && (
// //           <div className="flex items-center text-gray-600">
// //             <Calendar className="w-4 h-4 mr-2" />
// //             {format(new Date(task.dueDate), "MMM dd")}
// //           </div>
// //         )}
// //         <div className="flex items-center text-gray-600">
// //           <span className={`w-2.5 h-2.5 rounded-full mr-2 ${priorityColors[task.priority] || priorityColors.medium}`}></span>
// //           {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'}
// //         </div>
// //       </div>

// //       <div className="flex justify-end space-x-2 border-t pt-4 -mx-6 px-6">
// //         {!isCompleted && (
// //           <motion.button 
// //             whileHover={{ scale: 1.05 }} 
// //             whileTap={{ scale: 0.95 }} 
// //             onClick={() => onStart(task)}
// //             className="p-2 text-gray-500 hover:text-blue-500" 
// //             title="Start Task"
// //           >
// //             <Play className="w-5 h-5" />
// //           </motion.button>
// //         )}

// //         <motion.button 
// //           whileHover={{ scale: 1.05 }} 
// //           whileTap={{ scale: 0.95 }} 
// //           onClick={handleEdit}
// //           className="p-2 text-gray-500 hover:text-yellow-500" 
// //           title="Edit Task"
// //         >
// //           <Edit className="w-5 h-5" />
// //         </motion.button>

// //         <motion.button 
// //           whileHover={{ scale: 1.05 }} 
// //           whileTap={{ scale: 0.95 }} 
// //           onClick={handleDelete}
// //           className="p-2 text-gray-500 hover:text-red-500" 
// //           title="Delete Task"
// //         >
// //           <Trash2 className="w-5 h-5" />
// //         </motion.button>
// //       </div>
// //     </motion.div>
// //   );
// // }
