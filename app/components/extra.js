// "use client";
// import React, { useState, useEffect } from "react";
// import { useUser } from "@clerk/nextjs";
// import { motion, AnimatePresence } from "framer-motion";
// import { Loader2, AlertCircle } from "lucide-react";
// import TaskCard from "./TaskCard";
// import { taskApi } from "@/backend/lib/api";

// export default function TasksPage({ onPlayTask }) {
//   const { user, isLoaded } = useUser();
//   const [tasks, setTasks] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!isLoaded || !user) return;
//     (async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const response = await taskApi.getTasks({ userId: user.id });
//         if (response.success) {
//           setTasks(response.data);
//         } else {
//           setError(response.error || "Failed to fetch tasks");
//         }
//       } catch {
//         setError("Failed to load tasks");
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [isLoaded, user]);

//   const handleToggleComplete = async (task) => {
//     const updatedTask = { ...task, completed: !task.completed };
//     setTasks((prev) =>
//       prev.map((t) => (t._id === task._id ? updatedTask : t))
//     );
//     // Optionally sync to backend here
//   };

//   const handleDelete = (taskId) => {
//     setTasks((prev) => prev.filter((t) => t._id !== taskId));
//     // Optionally delete in backend
//   };

//   const handleEdit = (task) => {
//     alert(`Edit task: ${task.title}`);
//     // Implement modal or real edit logic
//   };

//   const handleStart = (task) => {
//     alert(`Start task: ${task.title}`);
//     if(onPlayTask) onPlayTask(task);
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center p-10">
//         <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-10 text-center text-red-600">
//         Error: {error}
//       </div>
//     );
//   }

//   if (!tasks.length) {
//     return <div className="p-10 text-center">No tasks found.</div>;
//   }

//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
//       <AnimatePresence>
//         {tasks.map((task, idx) => (
//           <TaskCard
//             key={task._id}
//             task={task}
//             index={idx}
//             onStart={handleStart}
//             onEdit={handleEdit}
//             onDelete={handleDelete}
//             onToggleComplete={() => handleToggleComplete(task)}
//           />
//         ))}
//       </AnimatePresence>
//     </div>
//   );
// }

// // "use client";

// // import React, { useState, useEffect } from 'react';
// // import { useUser } from '@clerk/nextjs';
// // import { motion, AnimatePresence } from 'framer-motion';
// // import { format } from 'date-fns';
// // import { Plus, Search, Calendar, Loader2, AlertCircle, Clock, Zap, Play, Edit, Trash2, X, Focus, Timer, Save, Check } from 'lucide-react';
// // import { taskApi } from '@/backend/lib/api'; // Assuming you have this API helper

// // // ------ StartTaskModal Component ------
// // function StartTaskModal({ isOpen, onClose, onSelectMode, task }) {
// //   if (!isOpen) return null;

// //   return (
// //     <AnimatePresence>
// //       {isOpen && (
// //         <motion.div
// //           initial={{ opacity: 0 }}
// //           animate={{ opacity: 1 }}
// //           exit={{ opacity: 0 }}
// //           className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50"
// //           onClick={onClose}
// //         >
// //           <motion.div
// //             initial={{ scale: 0.9, y: 50 }}
// //             animate={{ scale: 1, y: 0 }}
// //             exit={{ scale: 0.9, y: 50 }}
// //             className="bg-white rounded-2xl p-8 w-full max-w-sm sm:max-w-md shadow-2xl relative"
// //             onClick={(e) => e.stopPropagation()}
// //           >
// //             <button
// //               onClick={onClose}
// //               className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
// //             >
// //               <X className="w-6 h-6" />
// //             </button>
// //             <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
// //               Choose Your Focus Mode
// //             </h2>
// //             {task && (
// //               <p className="text-gray-600 text-center mb-6">
// //                 Starting: <span className="font-semibold">{task.title}</span>
// //               </p>
// //             )}
// //             <div className="flex flex-col space-y-4">
// //               <motion.button
// //                 whileHover={{ scale: 1.02 }}
// //                 whileTap={{ scale: 0.98 }}
// //                 onClick={() => onSelectMode('focus')}
// //                 className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
// //               >
// //                 <Focus className="w-6 h-6" />
// //                 <span>Focus Mode</span>
// //               </motion.button>
// //               <motion.button
// //                 whileHover={{ scale: 1.02 }}
// //                 whileTap={{ scale: 0.98 }}
// //                 onClick={() => onSelectMode('pomodoro')}
// //                 className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
// //               >
// //                 <Timer className="w-6 h-6" />
// //                 <span>Pomodoro Technique</span>
// //               </motion.button>
// //             </div>
// //           </motion.div>
// //         </motion.div>
// //       )}
// //     </AnimatePresence>
// //   );
// // }

// // // ------ TaskCard Component ------
// // function TaskCard({ task, index, onToggleComplete, onDelete, onEdit, onShowStartModal, onGainXP }) {
// //   const [isFadingOut, setIsFadingOut] = useState(false);
  
// //   const priorityColors = {
// //     urgent: "bg-red-500",
// //     high: "bg-red-500",
// //     medium: "bg-yellow-500",
// //     low: "bg-green-500",
// //   };
  
// //   const energyColors = { 
// //     High: "text-blue-500", 
// //     Medium: "text-orange-500", 
// //     Low: "text-teal-500" 
// //   };
  
// //   const isCompleted = task.status === 'completed';

// //   const handleToggle = async (e) => {
// //     e.stopPropagation();
// //     if (isCompleted) {
// //       await onToggleComplete(task);
// //       return;
// //     }
// //     setIsFadingOut(true);
// //     await new Promise(resolve => setTimeout(resolve, 600));
// //     await onToggleComplete(task);
// //     if (onGainXP) onGainXP(10);
// //     setIsFadingOut(false);
// //   };

// //   const handleDelete = (e) => { e.stopPropagation(); onDelete(task._id); };
// //   const handleEdit = (e) => { e.stopPropagation(); onEdit(task); };
// //   const handleStart = (e) => { 
// //     e.stopPropagation(); 
// //     if (onShowStartModal) {
// //       onShowStartModal(task);
// //     }
// //   };

// //   return (
// //     <motion.div
// //       layout
// //       initial={{ opacity: 0, y: 50 }}
// //       animate={{ opacity: 1, y: 0 }}
// //       exit={{ opacity: 0, scale: 0.8 }}
// //       transition={{ duration: 0.3, delay: index * 0.05 }}
// //       className={`relative bg-white rounded-2xl shadow-lg p-6 border ${isCompleted ? "border-green-300 opacity-60" : "border-gray-200"} hover:shadow-xl transition-all duration-300`}
// //     >
// //       <AnimatePresence>
// //         {isFadingOut && (
// //           <motion.div
// //             initial={{ opacity: 0, scale: 0.5 }}
// //             animate={{ opacity: 1, scale: 1 }}
// //             exit={{ opacity: 0, scale: 1.5 }}
// //             transition={{ duration: 0.4 }}
// //             className="absolute inset-0 bg-green-500/80 rounded-2xl flex items-center justify-center z-10"
// //           >
// //             <Check className="w-16 h-16 text-white" />
// //           </motion.div>
// //         )}
// //       </AnimatePresence>

// //       <div className="flex justify-between items-start mb-4">
// //         <h3 className={`text-lg font-semibold pr-4 ${isCompleted ? "text-gray-400 line-through" : "text-gray-800"}`}>
// //           {task.title}
// //         </h3>
// //         <motion.button
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //           onClick={handleToggle}
// //           className={`flex-shrink-0 w-6 h-6 rounded-full border-2 ${isCompleted ? "bg-green-500 border-green-500" : "border-gray-300"} flex items-center justify-center transition-all`}
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
// //           {task.estimatedTime || 25} min
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
// //             onClick={handleStart}
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

// // // ------ EditTaskModal Component ------
// // function EditTaskModal({ isOpen, onClose, onSubmit, editingTask }) {
// //   const defaultTask = { 
// //     title: '', 
// //     description: '', 
// //     priority: 'medium', 
// //     energy: 'Medium', 
// //     estimatedTime: 25, 
// //     dueDate: '',
// //     category: 'personal' // Add default category
// //   };
// //   const [taskData, setTaskData] = useState(editingTask || defaultTask);

// //   useEffect(() => {
// //     setTaskData(editingTask ? { ...defaultTask, ...editingTask } : defaultTask);
// //   }, [editingTask, isOpen]);

// //   const handleChange = (field, value) => setTaskData(prev => ({ ...prev, [field]: value }));
// //   const handleSubmit = (e) => { e.preventDefault(); onSubmit(taskData); };

// //   if (!isOpen) return null;

// //   return (
// //     <AnimatePresence>
// //       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
// //         <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
// //           <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
// //           <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
// //           <form onSubmit={handleSubmit} className="space-y-4">
// //             <div>
// //               <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
// //               <input type="text" value={taskData.title} onChange={(e) => handleChange('title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
// //             </div>
// //             <div>
// //               <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
// //               <textarea value={taskData.description} onChange={(e) => handleChange('description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="3" />
// //             </div>
// //             <div className="grid grid-cols-2 gap-4">
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
// //                 <select value={taskData.priority} onChange={(e) => handleChange('priority', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
// //                   <option value="low">Low</option>
// //                   <option value="medium">Medium</option>
// //                   <option value="high">High</option>
// //                   <option value="urgent">Urgent</option>
// //                 </select>
// //               </div>
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
// //                 <select value={taskData.category} onChange={(e) => handleChange('category', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
// //                   <option value="personal">Personal</option>
// //                   <option value="work">Work</option>
// //                   <option value="study">Study</option>
// //                   <option value="fitness">Fitness</option>
// //                   <option value="hobby">Hobby</option>
// //                   <option value="other">Other</option>
// //                 </select>
// //               </div>
// //             </div>
// //             <div className="grid grid-cols-2 gap-4">
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700 mb-2">Energy Level</label>
// //                 <select value={taskData.energy} onChange={(e) => handleChange('energy', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
// //                   <option value="Low">Low</option>
// //                   <option value="Medium">Medium</option>
// //                   <option value="High">High</option>
// //                 </select>
// //               </div>
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700 mb-2">Est. Time (min)</label>
// //                 <input type="number" value={taskData.estimatedTime} onChange={(e) => handleChange('estimatedTime', parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" min="1" />
// //               </div>
// //             </div>
// //             <div>
// //               <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
// //               <input type="date" value={taskData.dueDate ? taskData.dueDate.split('T')[0] : ''} onChange={(e) => handleChange('dueDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
// //             </div>
// //             <div className="flex space-x-4 pt-4">
// //               <motion.button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</motion.button>
// //               <motion.button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"><Save className="w-4 h-4" /><span>Save Task</span></motion.button>
// //             </div>
// //           </form>
// //         </motion.div>
// //       </motion.div>
// //     </AnimatePresence>
// //   );
// // }

// // // ------ MAIN PAGE COMPONENT: TasksPage ------
// // export default function TasksPage({ onPlayTask, productivityLevel, onTaskComplete }) {
// //   const { user, isLoaded } = useUser();
// //   const [tasks, setTasks] = useState([]);
// //   const [filteredTasks, setFilteredTasks] = useState([]);
// //   const [isModalOpen, setIsModalOpen] = useState(false);
// //   const [editingTask, setEditingTask] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [filters, setFilters] = useState({
// //     status: 'all',
// //     search: '',
// //     date: new Date().toISOString().split('T')[0]
// //   });

// //   // New state for StartTaskModal and XP
// //   const [isStartModalOpen, setIsStartModalOpen] = useState(false);
// //   const [taskToStart, setTaskToStart] = useState(null);
// //   const [userXP, setUserXP] = useState(0);

// //   // Fetch tasks
// //   useEffect(() => {
// //     const fetchTasks = async () => {
// //       if (!user?.id) {
// //         setLoading(false);
// //         return;
// //       }
// //       setError(null);
// //       try {
// //         const response = await taskApi.getTasks({ userId: user.id });
// //         if (response.success && response.data) {
// //           setTasks(response.data);
// //         } else {
// //           throw new Error(response.error || 'Failed to fetch tasks');
// //         }
// //       } catch (err) {
// //         setError(err.message);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchTasks();
// //   }, [user?.id]);

// //   // Filter tasks
// //   useEffect(() => {
// //     let filtered = tasks || [];
// //     if (productivityLevel) {
// //       filtered = filtered.filter(task => task.energy?.toLowerCase() === productivityLevel.toLowerCase());
// //     }
// //     if (filters.status !== 'all') {
// //       filtered = filtered.filter(task => filters.status === 'completed' ? task.status === 'completed' : task.status !== 'completed');
// //     }
// //     if (filters.search) {
// //       filtered = filtered.filter(task =>
// //         task.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
// //         task.description?.toLowerCase().includes(filters.search.toLowerCase())
// //       );
// //     }
// //     if (filters.date) {
// //       filtered = filtered.filter(task => task.dueDate?.startsWith(filters.date));
// //     }
// //     setFilteredTasks(filtered);
// //   }, [tasks, filters, productivityLevel]);

// //   // New handler functions
// //   const handleShowStartModal = (task) => {
// //     setTaskToStart(task);
// //     setIsStartModalOpen(true);
// //   };

// //   const handleGainXP = (amount) => {
// //     setUserXP(prevXP => prevXP + amount);
// //     console.log(`Gained ${amount} XP! Total XP: ${userXP + amount}`);
// //     // Here you would also update the user's XP in your database
// //   };

// //   const handleModeSelection = (mode) => {
// //     setIsStartModalOpen(false);
// //     console.log(`Selected mode: ${mode} for task: ${taskToStart?.title}`);
// //     if (onPlayTask) {
// //       onPlayTask(mode, taskToStart);
// //     }
// //   };

// //   // CRUD Handlers
// //   const handleTaskSubmit = async (taskData) => {
// //     if (editingTask) {
// //       await handleUpdateTask(taskData);
// //     } else {
// //       await handleCreateTask(taskData);
// //     }
// //   };

// //   const handleCreateTask = async (taskData) => {
// //     if (!user?.id) return;
// //     try {
// //       const taskPayload = {
// //         ...taskData,
// //         userId: user.id,
// //         category: taskData.category || 'personal',
// //         status: 'pending'
// //       };
// //       const response = await taskApi.createTask(taskPayload);
// //       if (response.success && response.data) {
// //         setTasks(prev => [response.data, ...prev]);
// //         closeModal();
// //       } else {
// //         throw new Error(response.error || 'Failed to create task');
// //       }
// //     } catch (err) { 
// //       setError(err.message); 
// //     }
// //   };

// //   const handleUpdateTask = async (taskData) => {
// //     if (!editingTask?._id) return;
// //     try {
// //       const response = await taskApi.updateTask(editingTask._id, taskData);
// //       if (response.success && response.data) {
// //         setTasks(prev => prev.map(t => t._id === editingTask._id ? response.data : t));
// //         closeModal();
// //       } else {
// //         throw new Error(response.error || 'Failed to update task');
// //       }
// //     } catch (err) { 
// //       setError(err.message); 
// //     }
// //   };

// //   const handleDeleteTask = async (taskId) => {
// //     if (!taskId || !confirm('Are you sure you want to delete this task?')) return;
// //     try {
// //       const response = await taskApi.deleteTask(taskId);
// //       if (response.success) {
// //         setTasks(prev => prev.filter(t => t._id !== taskId));
// //       } else {
// //         throw new Error(response.error || 'Failed to delete task');
// //       }
// //     } catch (err) { 
// //       setError(err.message); 
// //     }
// //   };

// //   const handleToggleComplete = async (task) => {
// //     if (!task?._id) return;
// //     const newStatus = task.status === 'completed' ? 'pending' : 'completed';
// //     const updatedData = { ...task, status: newStatus, completedAt: newStatus === 'completed' ? new Date().toISOString() : null };
    
// //     // Optimistic UI update
// //     setTasks(prev => prev.map(t => t._id === task._id ? updatedData : t));

// //     try {
// //       const response = await taskApi.updateTask(task._id, { status: newStatus, completedAt: updatedData.completedAt });
// //       if (!response.success) {
// //         // Revert on failure
// //         setTasks(prev => prev.map(t => t._id === task._id ? task : t));
// //         throw new Error(response.error || 'Failed to update task status');
// //       }
// //       if (newStatus === 'completed' && onTaskComplete) {
// //         onTaskComplete(task._id, task.estimatedTime || 25);
// //       }
// //     } catch (err) { 
// //       setError(err.message); 
// //     }
// //   };

// //   // Modal Handlers
// //   const openEditModal = (task) => { setEditingTask(task); setIsModalOpen(true); };
// //   const openCreateModal = () => { setEditingTask(null); setIsModalOpen(true); };
// //   const closeModal = () => { setIsModalOpen(false); setEditingTask(null); };

// //   // UI Stats
// //   const tasksForDay = filteredTasks.filter(task => task.dueDate?.startsWith(filters.date));
// //   const completedTasksCount = tasksForDay.filter(t => t.status === 'completed').length;
// //   const totalTasksCount = tasksForDay.length;

// //   if (loading) {
// //     return <div className="flex-1 flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
// //   }

// //   return (
// //     <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
// //       <div className="max-w-7xl mx-auto">
// //         {error && (
// //           <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
// //             <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
// //             <div><p className="text-red-800 font-medium">Error</p><p className="text-red-600 text-sm">{error}</p></div>
// //             <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
// //           </div>
// //         )}

// //         <header className="mb-8">
// //           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
// //             <div>
// //               <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Task Manager</h1>
// //               <p className="text-gray-500 mt-2">{format(new Date(filters.date.replace(/-/g, '\/')), 'EEEE, MMMM do, yyyy')} • {completedTasksCount}/{totalTasksCount} completed</p>
// //               {productivityLevel && <p className="text-sm text-indigo-600 mt-1">Filtered for {productivityLevel} energy tasks</p>}
// //             </div>
// //             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openCreateModal} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 shadow-md mt-4 sm:mt-0">
// //               <Plus className="w-5 h-5" /><span>Add Task</span>
// //             </motion.button>
// //           </div>
// //           <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
// //             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// //               <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Search tasks..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} className="w-full bg-gray-100 border border-transparent rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500"/></div>
// //               <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="bg-gray-100 border border-transparent rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"><option value="all">All Tasks</option><option value="pending">Pending</option><option value="completed">Completed</option></select>
// //               <input type="date" value={filters.date || ''} onChange={(e) => setFilters({...filters, date: e.target.value})} className="w-full bg-gray-100 border border-transparent rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"/>
// //             </div>
// //           </div>
// //         </header>

// //         <main>
// //           {filteredTasks.length === 0 ? (
// //             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
// //               <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center"><Calendar className="w-12 h-12 text-gray-500" /></div>
// //               <h3 className="text-xl font-semibold text-gray-700 mb-2">No tasks match your criteria</h3>
// //               <p className="text-gray-500 mb-6">Try adjusting the filters or add a new task for this day.</p>
// //             </motion.div>
// //           ) : (
// //             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
// //               <AnimatePresence>
// //                 {filteredTasks.map((task, index) => (
// //                   <TaskCard 
// //                     key={task._id} 
// //                     task={task} 
// //                     index={index} 
// //                     onToggleComplete={handleToggleComplete}
// //                     onDelete={handleDeleteTask}
// //                     onEdit={openEditModal}
// //                     onShowStartModal={handleShowStartModal}
// //                     onGainXP={handleGainXP}
// //                   />
// //                 ))}
// //               </AnimatePresence>
// //             </div>
// //           )}
// //         </main>

// //         <EditTaskModal isOpen={isModalOpen} onClose={closeModal} onSubmit={handleTaskSubmit} editingTask={editingTask} />
// //         <StartTaskModal isOpen={isStartModalOpen} onClose={() => setIsStartModalOpen(false)} task={taskToStart} onSelectMode={handleModeSelection} />
// //       </div>
// //     </div>
// //   );
// // }
