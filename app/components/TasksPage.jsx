"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import TaskCard from "@/app/components/TaskCard";
import TaskModal from "@/app/components/TaskModal";
import StartTaskModal from "@/app/components/StartTaskModal";
import FocusSession from "@/app/components/FocusSession ";
import PomodoroSession from "@/app/components/PomodoroSession";
import { taskApi, generateUserDataFromTasks } from "@/backend/lib/api";
import { toast } from "react-hot-toast";

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [productivityLevel, setProductivityLevel] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    category: "all",
    search: ""
  });

   const handleExitSession = () => {
    setActiveSession(null);
    setSelectedTask(null);
  };
  useEffect(() => {
    fetchTasks();
    // Get productivity level from localStorage
    const savedLevel = localStorage.getItem('productivityLevel');
    if (savedLevel) {
      setProductivityLevel(savedLevel);
    }
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskApi.getTasks({ userId: "user123" });
      if (response.success) {
        const backendTasks = Array.isArray(response.data) ? response.data : [];
        setTasks(backendTasks);

        // Generate user data
        const generatedUserData = generateUserDataFromTasks(
          backendTasks,
          "user123",
          "User"
        );
        setUserData(generatedUserData);
      } else {
        toast.error("Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError("Failed to load tasks");
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await taskApi.createTask({
        ...taskData,
        userId: "user123",
        status: "pending",
        progress: { percentage: 0 },
        workedSeconds: 0
      });

      if (response.success) {
        toast.success("Task created!");
        setTasks([response.data, ...tasks]);
        setIsModalOpen(false);
      }
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const response = await taskApi.updateTask(taskId, updates);
      if (response.success) {
        toast.success("Task updated!");
        setTasks(tasks.map(t => t._id === taskId ? response.data : t));
        setEditingTask(null);
        setIsModalOpen(false);
      }
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Delete this task?")) return;

    try {
      const response = await taskApi.deleteTask(taskId);
      if (response.success) {
        toast.success("Task deleted!");
        setTasks(tasks.filter(t => t._id !== taskId));
      }
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleToggleComplete = async (taskId) => {
    try {
      const task = tasks.find(t => t._id === taskId);
      const newStatus = task.status === "completed" ? "pending" : "completed";

      const response = await taskApi.updateTask(taskId, { 
        status: newStatus,
        completedAt: newStatus === "completed" ? new Date().toISOString() : null,
        progress: { percentage: newStatus === "completed" ? 100 : task.progress?.percentage || 0 }
      });
      
      if (response.success) {
        toast.success(newStatus === "completed" ? "Task completed!" : "Task reopened!");
        setTasks(tasks.map(t => t._id === taskId ? response.data : t));
      }
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleStartTask = (task) => {
    setSelectedTask(task);
    setIsStartModalOpen(true);
  };

  const handleSelectMode = async (mode, task) => {
    try {
      // Update task status to in-progress
      await taskApi.updateTask(task._id, { status: "in-progress" });
      
      // Update local state
      setTasks(tasks.map(t => t._id === task._id ? { ...t, status: "in-progress" } : t));
      
      // Set active session instead of navigation
      setActiveSession(mode);
      setSelectedTask(task);
      setIsStartModalOpen(false);
    } catch (error) {
      toast.error("Failed to start session");
    }
  };

  const handleSessionComplete = async () => {
    if (selectedTask) {
      try {
        await taskApi.updateTask(selectedTask._id, { 
          status: 'completed',
          progress: { percentage: 100 },
          completedAt: new Date().toISOString()
        });
        
        // Update local state
        setTasks(tasks.map(t => 
          t._id === selectedTask._id 
            ? { ...t, status: 'completed', progress: { percentage: 100 }, completedAt: new Date().toISOString() }
            : t
        ));
        
        toast.success('Task completed successfully!');
      } catch (error) {
        toast.error('Failed to update task status');
      }
    }
    
    // Clear session
    setActiveSession(null);
    setSelectedTask(null);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filters.status !== "all" && task.status !== filters.status) return false;
    if (filters.priority !== "all" && task.priority !== filters.priority) return false;
    if (filters.category !== "all" && task.category !== filters.category) return false;
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Separate active and completed tasks
  const activeTasks = filteredTasks.filter(task => task.status !== 'completed');
  const completedTasks = filteredTasks.filter(task => task.status === 'completed');

  // Sort tasks based on productivity level
  const recommendedTasks = productivityLevel 
    ? [
        ...activeTasks.filter(task => task.priority === productivityLevel),
        ...activeTasks.filter(task => task.priority !== productivityLevel)
      ]
    : activeTasks;

  // Session rendering logic
  if (activeSession === "focus") {
    return (
      <FocusSession
        activeTask={selectedTask}
        onTaskComplete={handleSessionComplete}
        setTasks={setTasks}
        setUserData={setUserData}
        userData={userData}
        onExit={handleExitSession}
      />
    );
  }

  if (activeSession === "pomodoro") {
    return (
      <PomodoroSession
        activeTask={selectedTask}
        onTaskComplete={handleSessionComplete}
        setTasks={setTasks}
        setUserData={setUserData}
        userData={userData}
        onExit={handleExitSession}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-10 text-center text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Tasks</h1>
          <p className="text-gray-600">Manage and track your tasks</p>
        </div>

        {/* Productivity Level Indicator */}
        {productivityLevel && (
          <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Your Productivity Level: 
              <span className={`ml-2 capitalize ${
                productivityLevel === 'high' ? 'text-green-600' :
                productivityLevel === 'medium' ? 'text-yellow-600' :
                'text-blue-600'
              }`}>
                {productivityLevel}
              </span>
            </h3>
            <p className="text-sm text-gray-600">
              {productivityLevel === 'high' 
                ? "You're feeling productive! Recommended high-priority tasks are shown first."
                : productivityLevel === 'medium'
                ? "Steady pace today. Medium-priority tasks are shown first."
                : "Take it easy. Low-priority tasks are shown first to build momentum."}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filters */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="study">Study</option>
              <option value="health">Health</option>
            </select>

            <button
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </button>
          </div>
        </div>

        {/* Active Tasks Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Active Tasks ({recommendedTasks.length})
            {productivityLevel && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                (Recommended tasks shown first)
              </span>
            )}
          </h2>
          
          {recommendedTasks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No active tasks. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {recommendedTasks.map((task, idx) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    index={idx}
                    onStart={handleStartTask}
                    onEdit={openEditModal}
                    onDelete={handleDeleteTask}
                    onToggleComplete={handleToggleComplete}
                    isRecommended={
                      productivityLevel && task.priority === productivityLevel
                    }
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Completed Tasks Section */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Completed Tasks ({completedTasks.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {completedTasks.map((task, idx) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    index={idx}
                    onStart={handleStartTask}
                    onEdit={openEditModal}
                    onDelete={handleDeleteTask}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={editingTask ? 
          (data) => handleUpdateTask(editingTask._id, data) : 
          handleCreateTask
        }
        task={editingTask}
      />

      <StartTaskModal
        isOpen={isStartModalOpen}
        onClose={() => {
          setIsStartModalOpen(false);
          setSelectedTask(null);
        }}
        onSelectMode={handleSelectMode}
        task={selectedTask}
      />
    </div>
  );
}

// "use client";
// import React, { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Plus, Search, Loader2 } from "lucide-react";
// import { useRouter } from 'next/navigation';
// import TaskCard from "@/app/components/TaskCard";
// import TaskModal from "@/app/components/TaskModal";
// import StartTaskModal from "@/app/components/StartTaskModal";
// import { taskApi } from "@/backend/lib/api";
// import { toast } from "react-hot-toast";

// export default function TasksPage() {
//   const router = useRouter();
//   const [tasks, setTasks] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isStartModalOpen, setIsStartModalOpen] = useState(false);
//   const [editingTask, setEditingTask] = useState(null);
//   const [selectedTask, setSelectedTask] = useState(null);
//   const [filters, setFilters] = useState({
//     status: "all",
//     priority: "all",
//     category: "all",
//     search: ""
//   });

//   useEffect(() => {
//     fetchTasks();
//   }, []);

//   const fetchTasks = async () => {
//     try {
//       setLoading(true);
//       const response = await taskApi.getTasks({ userId: "user123" });
//       if (response.success) {
//         setTasks(response.data || []);
//       } else {
//         toast.error("Failed to fetch tasks");
//       }
//     } catch (error) {
//       toast.error("Failed to load tasks");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateTask = async (taskData) => {
//     try {
//       const response = await taskApi.createTask({
//         ...taskData,
//         userId: "user123",
//         status: "pending",
//         progress: { percentage: 0 },
//         workedSeconds: 0
//       });

//       if (response.success) {
//         toast.success("Task created!");
//         setTasks([response.data, ...tasks]);
//         setIsModalOpen(false);
//       }
//     } catch (error) {
//       toast.error("Failed to create task");
//     }
//   };

//   const handleUpdateTask = async (taskId, updates) => {
//     try {
//       const response = await taskApi.updateTask(taskId, updates);
//       if (response.success) {
//         toast.success("Task updated!");
//         setTasks(tasks.map(t => t._id === taskId ? response.data : t));
//         setEditingTask(null);
//         setIsModalOpen(false);
//       }
//     } catch (error) {
//       toast.error("Failed to update task");
//     }
//   };

//   const handleDeleteTask = async (taskId) => {
//     if (!confirm("Delete this task?")) return;

//     try {
//       const response = await taskApi.deleteTask(taskId);
//       if (response.success) {
//         toast.success("Task deleted!");
//         setTasks(tasks.filter(t => t._id !== taskId));
//       }
//     } catch (error) {
//       toast.error("Failed to delete task");
//     }
//   };

//   const handleToggleComplete = async (taskId) => {
//     try {
//       const task = tasks.find(t => t._id === taskId);
//       const newStatus = task.status === "completed" ? "pending" : "completed";

//       const response = await taskApi.updateTask(taskId, { 
//         status: newStatus,
//         completedAt: newStatus === "completed" ? new Date().toISOString() : null,
//         progress: { percentage: newStatus === "completed" ? 100 : task.progress?.percentage || 0 }
//       });
      
//       if (response.success) {
//         toast.success(newStatus === "completed" ? "Task completed!" : "Task reopened!");
//         setTasks(tasks.map(t => t._id === taskId ? response.data : t));
//       }
//     } catch (error) {
//       toast.error("Failed to update task");
//     }
//   };

//   // Direct navigation to focus/pomodoro selection
//   const handleStartTask = (task) => {
//     setSelectedTask(task);
//     setIsStartModalOpen(true);
//   };

//   // Navigate to focus or pomodoro page with task data
//   const handleSelectMode = async (mode, task) => {
//     try {
//       // Update task status to in-progress
//       await taskApi.updateTask(task._id, { status: "in-progress" });
      
//       // Store task data in localStorage for the session
//       localStorage.setItem('currentTask', JSON.stringify(task));
      
//       // Navigate to the specific mode page
//       if (mode === 'focus') {
//         router.push(`/focus?taskId=${task._id}`);
//       } else if (mode === 'pomodoro') {
//         router.push(`/pomodoro?taskId=${task._id}`);
//       }
//     } catch (error) {
//       toast.error("Failed to start session");
//     }
//   };

//   const openEditModal = (task) => {
//     setEditingTask(task);
//     setIsModalOpen(true);
//   };

//   // Filter tasks
//   const filteredTasks = tasks.filter(task => {
//     if (filters.status !== "all" && task.status !== filters.status) return false;
//     if (filters.priority !== "all" && task.priority !== filters.priority) return false;
//     if (filters.category !== "all" && task.category !== filters.category) return false;
//     if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
//     return true;
//   });

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-4xl font-bold text-gray-900 mb-2">My Tasks</h1>
//           <p className="text-gray-600">Manage and track your tasks</p>
//         </div>

//         {/* Controls */}
//         <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
//           <div className="flex flex-col md:flex-row gap-4">
//             {/* Search */}
//             <div className="flex-1 relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input
//                 type="text"
//                 placeholder="Search tasks..."
//                 value={filters.search}
//                 onChange={(e) => setFilters({ ...filters, search: e.target.value })}
//                 className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               />
//             </div>

//             {/* Filters */}
//             <select
//               value={filters.status}
//               onChange={(e) => setFilters({ ...filters, status: e.target.value })}
//               className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             >
//               <option value="all">All Status</option>
//               <option value="pending">Pending</option>
//               <option value="in-progress">In Progress</option>
//               <option value="completed">Completed</option>
//             </select>

//             <select
//               value={filters.priority}
//               onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
//               className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             >
//               <option value="all">All Priorities</option>
//               <option value="high">High</option>
//               <option value="medium">Medium</option>
//               <option value="low">Low</option>
//             </select>

//             <select
//               value={filters.category}
//               onChange={(e) => setFilters({ ...filters, category: e.target.value })}
//               className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             >
//               <option value="all">All Categories</option>
//               <option value="work">Work</option>
//               <option value="personal">Personal</option>
//               <option value="study">Study</option>
//               <option value="health">Health</option>
//             </select>

//             <button
//               onClick={() => {
//                 setEditingTask(null);
//                 setIsModalOpen(true);
//               }}
//               className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
//             >
//               <Plus className="w-5 h-5" />
//               Add Task
//             </button>
//           </div>
//         </div>

//         {/* Tasks Grid */}
//         {loading ? (
//           <div className="flex justify-center items-center h-64">
//             <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
//           </div>
//         ) : filteredTasks.length === 0 ? (
//           <div className="text-center py-12">
//             <p className="text-gray-500 text-lg">No tasks found</p>
//             <button
//               onClick={() => setIsModalOpen(true)}
//               className="mt-4 text-indigo-600 hover:text-indigo-700"
//             >
//               Create your first task
//             </button>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             <AnimatePresence>
//               {filteredTasks.map((task, index) => (
//                 <TaskCard
//                   key={task._id}
//                   task={task}
//                   index={index}
//                   onStart={handleStartTask}
//                   onEdit={openEditModal}
//                   onDelete={handleDeleteTask}
//                   onToggleComplete={handleToggleComplete}
//                 />
//               ))}
//             </AnimatePresence>
//           </div>
//         )}
//       </div>

//       {/* Modals */}
//       <TaskModal
//         isOpen={isModalOpen}
//         onClose={() => {
//           setIsModalOpen(false);
//           setEditingTask(null);
//         }}
//         onSubmit={editingTask ? 
//           (data) => handleUpdateTask(editingTask._id, data) : 
//           handleCreateTask
//         }
//         task={editingTask}
//       />

//       <StartTaskModal
//         isOpen={isStartModalOpen}
//         onClose={() => {
//           setIsStartModalOpen(false);
//           setSelectedTask(null);
//         }}
//         onSelectMode={handleSelectMode}
//         task={selectedTask}
//       />
//     </div>
//   );
// }


// // app/tasks/page.js
// "use client";
// import React, { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Plus, Filter, Search, Loader2 } from "lucide-react";
// import TaskCard from "@/app/components/TaskCard";
// import TaskModal from "@/app/components/TaskModal";
// import { taskApi } from "@/backend/lib/api";
// import { toast } from "react-hot-toast";

// export default function TasksPage() {
//   const [tasks, setTasks] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingTask, setEditingTask] = useState(null);
//   const [filters, setFilters] = useState({
//     status: "all",
//     category: "all",
//     search: ""
//   });

//   // Fetch tasks on mount
//   useEffect(() => {
//     fetchTasks();
//   }, []);

//   const fetchTasks = async () => {
//     try {
//       setLoading(true);
//       const response = await taskApi.getTasks({ userId: "user123" });
//       if (response.success) {
//         setTasks(response.data || []);
//       } else {
//         toast.error(response.error || "Failed to fetch tasks");
//       }
//     } catch (error) {
//       toast.error("Failed to load tasks");
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateTask = async (taskData) => {
//     try {
//       const response = await taskApi.createTask({
//         ...taskData,
//         userId: "user123",
//         status: "pending",
//         progress: { percentage: 0 },
//         workedSeconds: 0
//       });
      
//       if (response.success) {
//         toast.success("Task created successfully!");
//         setTasks([response.data, ...tasks]);
//         setIsModalOpen(false);
//       }
//     } catch (error) {
//       toast.error("Failed to create task");
//     }
//   };

//   const handleUpdateTask = async (taskId, updates) => {
//     try {
//       const response = await taskApi.updateTask(taskId, updates);
//       if (response.success) {
//         toast.success("Task updated successfully!");
//         setTasks(tasks.map(t => t._id === taskId ? response.data : t));
//         setEditingTask(null);
//         setIsModalOpen(false);
//       }
//     } catch (error) {
//       toast.error("Failed to update task");
//     }
//   };

//   const handleDeleteTask = async (taskId) => {
//     if (!confirm("Are you sure you want to delete this task?")) return;
    
//     try {
//       const response = await taskApi.deleteTask(taskId);
//       if (response.success) {
//         toast.success("Task deleted successfully!");
//         setTasks(tasks.filter(t => t._id !== taskId));
//       }
//     } catch (error) {
//       toast.error("Failed to delete task");
//     }
//   };

//   const handleToggleComplete = async (taskId) => {
//     try {
//       const task = tasks.find(t => t._id === taskId);
//       const newStatus = task.status === "completed" ? "pending" : "completed";
      
//       const response = await taskApi.updateTask(taskId, { 
//         status: newStatus,
//         completedAt: newStatus === "completed" ? new Date() : null,
//         progress: { percentage: newStatus === "completed" ? 100 : task.progress?.percentage || 0 }
//       });
      
//       if (response.success) {
//         toast.success(newStatus === "completed" ? "Task completed!" : "Task reopened!");
//         setTasks(tasks.map(t => t._id === taskId ? response.data : t));
//       }
//     } catch (error) {
//       toast.error("Failed to update task status");
//     }
//   };

//   const handleStartTask = (task) => {
//     // Navigate to focus timer with task
//     window.location.href = `/focus?taskId=${task._id}`;
//   };

//   const openEditModal = (task) => {
//     setEditingTask(task);
//     setIsModalOpen(true);
//   };

//   // Filter tasks
//   const filteredTasks = tasks.filter(task => {
//     if (filters.status !== "all" && task.status !== filters.status) return false;
//     if (filters.category !== "all" && task.category !== filters.category) return false;
//     if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
//     return true;
//   });

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-4xl font-bold text-gray-900 mb-2">My Tasks</h1>
//           <p className="text-gray-600">Manage and track your tasks efficiently</p>
//         </div>

//         {/* Controls Bar */}
//         <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
//           <div className="flex flex-col md:flex-row gap-4">
//             {/* Search */}
//             <div className="flex-1 relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input
//                 type="text"
//                 placeholder="Search tasks..."
//                 value={filters.search}
//                 onChange={(e) => setFilters({ ...filters, search: e.target.value })}
//                 className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               />
//             </div>

//             {/* Filters */}
//             <select
//               value={filters.status}
//               onChange={(e) => setFilters({ ...filters, status: e.target.value })}
//               className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             >
//               <option value="all">All Status</option>
//               <option value="pending">Pending</option>
//               <option value="in-progress">In Progress</option>
//               <option value="completed">Completed</option>
//             </select>

//             <select
//               value={filters.category}
//               onChange={(e) => setFilters({ ...filters, category: e.target.value })}
//               className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             >
//               <option value="all">All Categories</option>
//               <option value="work">Work</option>
//               <option value="personal">Personal</option>
//               <option value="study">Study</option>
//               <option value="health">Health</option>
//             </select>

//             {/* Add Task Button */}
//             <button
//               onClick={() => {
//                 setEditingTask(null);
//                 setIsModalOpen(true);
//               }}
//               className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
//             >
//               <Plus className="w-5 h-5" />
//               Add Task
//             </button>
//           </div>
//         </div>

//         {/* Tasks Grid */}
//         {loading ? (
//           <div className="flex justify-center items-center h-64">
//             <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
//           </div>
//         ) : filteredTasks.length === 0 ? (
//           <div className="text-center py-12">
//             <p className="text-gray-500 text-lg">No tasks found</p>
//             <button
//               onClick={() => setIsModalOpen(true)}
//               className="mt-4 text-indigo-600 hover:text-indigo-700"
//             >
//               Create your first task
//             </button>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             <AnimatePresence>
//               {filteredTasks.map((task, index) => (
//                 <TaskCard
//                   key={task._id}
//                   task={task}
//                   index={index}
//                   onStart={handleStartTask}
//                   onEdit={openEditModal}
//                   onDelete={handleDeleteTask}
//                   onToggleComplete={handleToggleComplete}
//                 />
//               ))}
//             </AnimatePresence>
//           </div>
//         )}
//       </div>

//       {/* Task Modal */}
//       <TaskModal
//         isOpen={isModalOpen}
//         onClose={() => {
//           setIsModalOpen(false);
//           setEditingTask(null);
//         }}
//         onSubmit={editingTask ? 
//           (data) => handleUpdateTask(editingTask._id, data) : 
//           handleCreateTask
//         }
//         task={editingTask}
//       />
//     </div>
//   );
// }
// // "use client";
// // import React, { useState, useEffect } from "react";
// // import { useUser } from "@clerk/nextjs";
// // import { AnimatePresence } from "framer-motion";
// // import { Loader2 } from "lucide-react";

// // import TaskCard from "./TaskCard";
// // import StartTaskModal from "./StartTaskModal";
// // import FocusSession from "./FocusModeContent";
// // import PomodoroSession from "./PomodoroContent";
// // import AddTaskModal from "./AddTaskModal";
// // import { taskApi } from "@/backend/lib/api";

// // export default function TasksPage({ 
// //   productivityLevel,
// //   onTaskComplete,
// //   setUserData,
// //   userData
// // }) {
// //   const { user, isLoaded } = useUser();

// //   // Data state
// //   const [tasks, setTasks] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);

// //   // UI State
// //   const [showStartModal, setShowStartModal] = useState(false);
// //   const [selectedTask, setSelectedTask] = useState(null);
// //   const [activeSession, setActiveSession] = useState(null);
// //   const [showAddModal, setShowAddModal] = useState(false);
// //   const [searchQuery, setSearchQuery] = useState("");
// //   const [filterPriority, setFilterPriority] = useState("all");

// //   // Fetch tasks when user is loaded
// //   useEffect(() => {
// //     if (!isLoaded || !user) return;

// //     const fetchTasks = async () => {
// //       setLoading(true);
// //       setError(null);
// //       try {
// //         const response = await taskApi.getTasks({ userId: user.id });
// //         if (response.success) setTasks(response.data);
// //         else setError(response.error || "Failed to fetch tasks");
// //       } catch {
// //         setError("Failed to load tasks");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchTasks();
// //   }, [isLoaded, user]);

// //   // Filter tasks based on productivity level
// //   const getRecommendedTasks = (tasks) => {
// //     if (!productivityLevel) return tasks;

// //     const incompleteTasks = tasks.filter(task => !task.completed);

// //     switch (productivityLevel) {
// //       case 'high':
// //         // High productivity: Show high priority and complex tasks
// //         return incompleteTasks.sort((a, b) => {
// //           const priorityOrder = { high: 3, medium: 2, low: 1 };
// //           return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
// //         });

// //       case 'medium':
// //         // Medium productivity: Show medium priority tasks first
// //         return incompleteTasks.sort((a, b) => {
// //           if (a.priority === 'medium' && b.priority !== 'medium') return -1;
// //           if (a.priority !== 'medium' && b.priority === 'medium') return 1;
// //           return 0;
// //         });

// //       case 'low':
// //         // Low productivity: Show easy/low priority tasks
// //         return incompleteTasks.sort((a, b) => {
// //           const priorityOrder = { low: 3, medium: 2, high: 1 };
// //           return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
// //         });

// //       default:
// //         return incompleteTasks;
// //     }
// //   };

// //   // Task Actions
// //   const handleToggleComplete = async (task) => {
// //     try {
// //       await taskApi.completeTask(task._id);
// //       setTasks((prev) =>
// //         prev.map((t) =>
// //           t._id === task._id 
// //             ? { ...t, completed: !t.completed, status: !t.completed ? 'completed' : 'pending' } 
// //             : t
// //         )
// //       );
      
// //       // If task is being completed, update user data
// //       if (!task.completed && onTaskComplete) {
// //         onTaskComplete(task._id, task.estimatedTime || 25);
// //       }
// //     } catch (error) {
// //       console.error("Error toggling task:", error);
// //     }
// //   };

// //   const handleDelete = async (taskId) => {
// //     try {
// //       await taskApi.deleteTask(taskId);
// //       setTasks((prev) => prev.filter((t) => t._id !== taskId));
// //     } catch {
// //       setTasks((prev) => prev.filter((t) => t._id !== taskId));
// //     }
// //   };

// //   const handleEdit = (task) => {
// //     // Implement edit functionality
// //     console.log("Edit task:", task);
// //   };

// //   const handleStart = (task) => {
// //     setSelectedTask(task);
// //     setShowStartModal(true);
// //   };

// //   const handleSelectMode = (mode, task) => {
// //     setActiveSession(mode);
// //     setSelectedTask(task);
// //     setShowStartModal(false);
// //   };

// //   const handleSessionComplete = (duration) => {
// //     if (selectedTask && onTaskComplete) {
// //       onTaskComplete(selectedTask._id, duration);
// //     }
// //     setActiveSession(null);
// //     setSelectedTask(null);
// //   };

// //   const handleExitSession = () => {
// //     setActiveSession(null);
// //     setSelectedTask(null);
// //   };

// //   const handleAddTask = async (newTask) => {
// //     try {
// //       const response = await taskApi.createTask({ 
// //         ...newTask, 
// //         userId: user.id,
// //         status: 'pending',
// //         completed: false
// //       });
// //       if (response.success) {
// //         setTasks((prev) => [response.data, ...prev]);
// //       }
// //     } catch (err) {
// //       console.error("Failed to add task", err);
// //     }
// //     setShowAddModal(false);
// //   };

// //   // Apply filters
// //   const filteredTasks = tasks.filter((t) => {
// //     const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
// //     const matchesPriority = filterPriority === "all" || t.priority === filterPriority;
// //     return matchesSearch && matchesPriority;
// //   });

// //   // Get recommended tasks based on productivity level
// //   const recommendedTasks = getRecommendedTasks(filteredTasks);
// //   const completedTasks = filteredTasks.filter(t => t.completed);

// //   // Conditional rendering for sessions
// //   if (activeSession === "focus") {
// //     return (
// //       <FocusSession
// //         activeTask={selectedTask}
// //         onTaskComplete={handleSessionComplete}
// //         setTasks={setTasks}
// //         setUserData={setUserData}
// //         userData={userData}
// //       />
// //     );
// //   }

// //   if (activeSession === "pomodoro") {
// //     return (
// //       <PomodoroSession
// //         activeTask={selectedTask}
// //         onTaskComplete={handleSessionComplete}
// //         setTasks={setTasks}
// //         setUserData={setUserData}
// //         userData={userData}
// //       />
// //     );
// //   }

// //   // Loading state
// //   if (!isLoaded || loading) {
// //     return (
// //       <div className="flex justify-center items-center min-h-screen">
// //         <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
// //       </div>
// //     );
// //   }

// //   // Error state
// //   if (error) {
// //     return (
// //       <div className="p-10 text-center text-red-600">
// //         Error: {error}
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="p-4">
// //       {/* Productivity Level Indicator */}
// //       {productivityLevel && (
// //         <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
// //           <h3 className="text-lg font-semibold text-gray-800 mb-2">
// //             Your Productivity Level: 
// //             <span className={`ml-2 capitalize ${
// //               productivityLevel === 'high' ? 'text-green-600' :
// //               productivityLevel === 'medium' ? 'text-yellow-600' :
// //               'text-blue-600'
// //             }`}>
// //               {productivityLevel}
// //             </span>
// //           </h3>
// //           <p className="text-sm text-gray-600">
// //             {productivityLevel === 'high' 
// //               ? "You're feeling productive! Here are your high-priority tasks."
// //               : productivityLevel === 'medium'
// //               ? "Steady pace today. Focus on medium-priority tasks."
// //               : "Take it easy. Start with simple tasks to build momentum."}
// //           </p>
// //         </div>
// //       )}

// //       {/* Search + Filters + Add Task */}
// //       <div className="flex flex-col sm:flex-row gap-4 mb-6">
// //         <input
// //           type="text"
// //           placeholder="Search tasks..."
// //           value={searchQuery}
// //           onChange={(e) => setSearchQuery(e.target.value)}
// //           className="flex-1 border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
// //         />
        
// //         <select
// //           value={filterPriority}
// //           onChange={(e) => setFilterPriority(e.target.value)}
// //           className="border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
// //         >
// //           <option value="all">All Priorities</option>
// //           <option value="high">High Priority</option>
// //           <option value="medium">Medium Priority</option>
// //           <option value="low">Low Priority</option>
// //         </select>

// //         <button
// //           onClick={() => setShowAddModal(true)}
// //           className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
// //         >
// //           Add Task
// //         </button>
// //       </div>

// //       {/* Active Tasks Section */}
// //       <div className="mb-8">
// //         <h2 className="text-xl font-semibold text-gray-800 mb-4">
// //           {productivityLevel ? 'Recommended Tasks' : 'Active Tasks'} 
// //           ({recommendedTasks.length})
// //         </h2>
        
// //         {recommendedTasks.length === 0 ? (
// //           <div className="text-center py-12 bg-gray-50 rounded-lg">
// //             <p className="text-gray-500">No active tasks. Create one to get started!</p>
// //           </div>
// //         ) : (
// //           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
// //             <AnimatePresence>
// //               {recommendedTasks.map((task, idx) => (
// //                 <TaskCard
// //                   key={task._id}
// //                   task={task}
// //                   index={idx}
// //                   onStart={handleStart}
// //                   onEdit={handleEdit}
// //                   onDelete={handleDelete}
// //                   onToggleComplete={() => handleToggleComplete(task)}
// //                   isRecommended={
// //                     productivityLevel && 
// //                     ((productivityLevel === 'high' && task.priority === 'high') ||
// //                      (productivityLevel === 'medium' && task.priority === 'medium') ||
// //                      (productivityLevel === 'low' && task.priority === 'low'))
// //                   }
// //                 />
// //               ))}
// //             </AnimatePresence>
// //           </div>
// //         )}
// //       </div>

// //       {/* Completed Tasks Section */}
// //       {completedTasks.length > 0 && (
// //         <div>
// //           <h2 className="text-xl font-semibold text-gray-800 mb-4">
// //             Completed Tasks ({completedTasks.length})
// //           </h2>
// //           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
// //             <AnimatePresence>
// //               {completedTasks.map((task, idx) => (
// //                 <TaskCard
// //                   key={task._id}
// //                   task={task}
// //                   index={idx}
// //                   onStart={handleStart}
// //                   onEdit={handleEdit}
// //                   onDelete={handleDelete}
// //                   onToggleComplete={() => handleToggleComplete(task)}
// //                 />
// //               ))}
// //             </AnimatePresence>
// //           </div>
// //         </div>
// //       )}

// //       {/* Modals */}
// //       {showStartModal && (
// //         <StartTaskModal
// //           isOpen={showStartModal}
// //           onClose={() => setShowStartModal(false)}
// //           onSelectMode={handleSelectMode}
// //           task={selectedTask}
// //         />
// //       )}

// //       {showAddModal && (
// //         <AddTaskModal
// //           isOpen={showAddModal}
// //           onClose={() => setShowAddModal(false)}
// //           onSubmit={handleAddTask}
// //         />
// //       )}
// //     </div>
// //   );
// // }
// // //little old
// // // "use client";
// // // import React, { useState, useEffect } from "react";
// // // import { useUser } from "@clerk/nextjs";
// // // import { AnimatePresence } from "framer-motion";
// // // import { Loader2 } from "lucide-react";

// // // import TaskCard from "./TaskCard";
// // // import StartTaskModal from "./StartTaskModal";
// // // import FocusSession from "./FocusModeContent";
// // // import PomodoroSession from "./PomodoroContent";
// // // import AddTaskModal from "./AddTaskModal"; // New component for adding tasks
// // // import { taskApi } from "@/backend/lib/api";

// // // export default function TasksPage() {
// // //   const { user, isLoaded } = useUser();

// // //   // Data state
// // //   const [tasks, setTasks] = useState([]);
// // //   const [loading, setLoading] = useState(true);
// // //   const [error, setError] = useState(null);

// // //   // UI State
// // //   const [showStartModal, setShowStartModal] = useState(false);
// // //   const [selectedTask, setSelectedTask] = useState(null);
// // //   const [activeSession, setActiveSession] = useState(null); // "focus" | "pomodoro"
// // //   const [showAddModal, setShowAddModal] = useState(false);
// // //   const [searchQuery, setSearchQuery] = useState("");

// // //   // Fetch tasks when user is loaded
// // //   useEffect(() => {
// // //     if (!isLoaded || !user) return;

// // //     const fetchTasks = async () => {
// // //       setLoading(true);
// // //       setError(null);
// // //       try {
// // //         const response = await taskApi.getTasks({ userId: user.id });
// // //         if (response.success) setTasks(response.data);
// // //         else setError(response.error || "Failed to fetch tasks");
// // //       } catch {
// // //         setError("Failed to load tasks");
// // //       } finally {
// // //         setLoading(false);
// // //       }
// // //     };

// // //     fetchTasks();
// // //   }, [isLoaded, user]);

// // //   // Task Actions
// // //   const handleToggleComplete = async (task) => {
// // //     try {
// // //       await taskApi.completeTask(task._id); // Backend API call
// // //       setTasks((prev) =>
// // //         prev.map((t) =>
// // //           t._id === task._id ? { ...t, completed: !t.completed } : t
// // //         )
// // //       );
// // //     } catch {
// // //       setTasks((prev) =>
// // //         prev.map((t) =>
// // //           t._id === task._id ? { ...t, completed: !t.completed } : t
// // //         )
// // //       );
// // //     }
// // //   };

// // //   const handleDelete = async (taskId) => {
// // //     try {
// // //       await taskApi.deleteTask(taskId);
// // //       setTasks((prev) => prev.filter((t) => t._id !== taskId));
// // //     } catch {
// // //       setTasks((prev) => prev.filter((t) => t._id !== taskId));
// // //     }
// // //   };

// // //   const handleEdit = (task) => {
// // //     alert(`Edit task: ${task.title}`);
// // //   };

// // //   const handleStart = (task) => {
// // //     setSelectedTask(task);
// // //     setShowStartModal(true);
// // //   };

// // //   const handleSelectMode = (mode, task) => {
// // //     setActiveSession(mode);
// // //     setSelectedTask(task);
// // //   };

// // //   const handleSessionComplete = () => {
// // //     setActiveSession(null);
// // //     setSelectedTask(null);
// // //   };

// // //   const handleExitSession = () => {
// // //     setActiveSession(null);
// // //     setSelectedTask(null);
// // //   };

// // //   const handleAddTask = async (newTask) => {
// // //     try {
// // //       const response = await taskApi.createTask({ ...newTask, userId: user.id });
// // //       if (response.success) {
// // //         setTasks((prev) => [response.data, ...prev]);
// // //       }
// // //     } catch (err) {
// // //       console.error("Failed to add task", err);
// // //     }
// // //     setShowAddModal(false);
// // //   };

// // //   const filteredTasks = tasks.filter((t) =>
// // //     t.title.toLowerCase().includes(searchQuery.toLowerCase())
// // //   );

// // //   // Conditional rendering for sessions
// // //   if (activeSession === "focus") {
// // //     return (
// // //       <FocusSession
// // //         task={selectedTask}
// // //         onComplete={handleSessionComplete}
// // //         onExit={handleExitSession}
// // //       />
// // //     );
// // //   }

// // //   if (activeSession === "pomodoro") {
// // //     return (
// // //       <PomodoroSession
// // //         task={selectedTask}
// // //         onComplete={handleSessionComplete}
// // //         onExit={handleExitSession}
// // //       />
// // //     );
// // //   }

// // //   // Loading state
// // //   if (!isLoaded || loading) {
// // //     return (
// // //       <div className="flex justify-center items-center min-h-screen">
// // //         <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
// // //       </div>
// // //     );
// // //   }

// // //   // Error state
// // //   if (error) {
// // //     return (
// // //       <div className="p-10 text-center text-red-600">
// // //         Error: {error}
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div className="p-4">
// // //       {/* Search + Add Task */}
// // //       <div className="flex justify-between items-center mb-4">
// // //         <input
// // //           type="text"
// // //           placeholder="Search tasks..."
// // //           value={searchQuery}
// // //           onChange={(e) => setSearchQuery(e.target.value)}
// // //           className="border px-3 py-2 rounded-md w-full sm:w-1/2"
// // //         />
// // //         <button
// // //           onClick={() => setShowAddModal(true)}
// // //           className="ml-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
// // //         >
// // //           Add Task
// // //         </button>
// // //       </div>

// // //       {/* Task List */}
// // //       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
// // //         <AnimatePresence>
// // //           {filteredTasks.map((task, idx) => (
// // //             <TaskCard
// // //               key={task._id}
// // //               task={task}
// // //               index={idx}
// // //               onStart={handleStart}
// // //               onEdit={handleEdit}
// // //               onDelete={handleDelete}
// // //               onToggleComplete={() => handleToggleComplete(task)}
// // //             />
// // //           ))}
// // //         </AnimatePresence>
// // //       </div>

// // //       {/* Modals */}
// // //       {showStartModal && (
// // //         <StartTaskModal
// // //           isOpen={showStartModal}
// // //           onClose={() => setShowStartModal(false)}
// // //           onSelectMode={handleSelectMode}
// // //           task={selectedTask}
// // //         />
// // //       )}

// // //       {showAddModal && (
// // //         <AddTaskModal
// // //           isOpen={showAddModal}
// // //           onClose={() => setShowAddModal(false)}
// // //           onSubmit={handleAddTask}
// // //         />
// // //       )}
// // //     </div>
// // //   );
// // // }

// // // // "use client";
// // // // import React, { useState, useEffect } from "react";
// // // // import { useUser } from "@clerk/nextjs";
// // // // import { AnimatePresence } from "framer-motion";
// // // // import { Loader2, Plus, Search } from "lucide-react";

// // // // import TaskCard from "./TaskCard";
// // // // import StartTaskModal from "./StartTaskModal";
// // // // import FocusSession from "./FocusModeContent";
// // // // import PomodoroSession from "./PomodoroContent";

// // // // export default function TasksPage() {
// // // //   const { user, isLoaded } = useUser();

// // // //   // Data
// // // //   const [tasks, setTasks] = useState([]);
// // // //   const [loading, setLoading] = useState(false);
// // // //   const [error, setError] = useState(null);

// // // //   // UI
// // // //   const [showStartModal, setShowStartModal] = useState(false);
// // // //   const [selectedTask, setSelectedTask] = useState(null);
// // // //   const [activeSession, setActiveSession] = useState(null); // "focus" | "pomodoro"
// // // //   const [showAddTaskInput, setShowAddTaskInput] = useState(false);
// // // //   const [newTaskTitle, setNewTaskTitle] = useState("");
// // // //   const [searchQuery, setSearchQuery] = useState("");

// // // //   const API_BASE = "http://localhost:5000/api/v1/tasks"; // backend tasks API

// // // //   // Fetch tasks
// // // //   useEffect(() => {
// // // //     if (!isLoaded || !user) return;
// // // //     fetchTasks();
// // // //   }, [isLoaded, user]);

// // // //   const fetchTasks = async () => {
// // // //     setLoading(true);
// // // //     setError(null);
// // // //     try {
// // // //       const res = await fetch(`${API_BASE}?userId=${user.id}`);
// // // //       const data = await res.json();
// // // //       if (data.success) setTasks(data.data);
// // // //       else setError(data.message || "Failed to fetch tasks");
// // // //     } catch {
// // // //       setError("Failed to load tasks");
// // // //     } finally {
// // // //       setLoading(false);
// // // //     }
// // // //   };

// // // //   // Task actions
// // // //   const handleToggleComplete = async (task) => {
// // // //     try {
// // // //       const res = await fetch(`${API_BASE}/${task._id}/complete`, { method: "PUT" });
// // // //       const data = await res.json();
// // // //       if (data.success) fetchTasks();
// // // //     } catch (err) {
// // // //       console.error(err);
// // // //     }
// // // //   };

// // // //   const handleDelete = async (taskId) => {
// // // //     try {
// // // //       await fetch(`${API_BASE}/${taskId}`, { method: "DELETE" });
// // // //       setTasks((prev) => prev.filter((t) => t._id !== taskId));
// // // //     } catch (err) {
// // // //       console.error(err);
// // // //     }
// // // //   };

// // // //   const handleEdit = (task) => {
// // // //     alert(`Edit task: ${task.title}`);
// // // //   };

// // // //   const handleStart = (task) => {
// // // //     setSelectedTask(task);
// // // //     setShowStartModal(true);
// // // //   };

// // // //   const handleSelectMode = (mode, task) => {
// // // //     setActiveSession(mode);
// // // //     setSelectedTask(task);
// // // //   };

// // // //   const handleSessionComplete = () => {
// // // //     alert("Session completed!");
// // // //     setActiveSession(null);
// // // //     setSelectedTask(null);
// // // //   };

// // // //   const handleExitSession = () => {
// // // //     setActiveSession(null);
// // // //     setSelectedTask(null);
// // // //   };

// // // //   // Add task
// // // //   const handleAddTask = async () => {
// // // //     if (!newTaskTitle.trim()) return;

// // // //     const newTask = {
// // // //       title: newTaskTitle,
// // // //       description: "",
// // // //       status: "pending",
// // // //       userId: user.id,
// // // //     };

// // // //     try {
// // // //       const res = await fetch(API_BASE, {
// // // //         method: "POST",
// // // //         headers: { "Content-Type": "application/json" },
// // // //         body: JSON.stringify(newTask),
// // // //       });
// // // //       const data = await res.json();
// // // //       if (data.success) setTasks((prev) => [data.data, ...prev]);
// // // //       else alert("Failed to create task");
// // // //     } catch (err) {
// // // //       console.error(err);
// // // //     } finally {
// // // //       setNewTaskTitle("");
// // // //       setShowAddTaskInput(false);
// // // //     }
// // // //   };

// // // //   // Filtered tasks for search
// // // //   const filteredTasks = tasks.filter((task) =>
// // // //     task.title.toLowerCase().includes(searchQuery.toLowerCase())
// // // //   );

// // // //   // Conditional Rendering for sessions
// // // //   if (activeSession === "focus") {
// // // //     return (
// // // //       <FocusSession
// // // //         task={selectedTask}
// // // //         onComplete={handleSessionComplete}
// // // //         onExit={handleExitSession}
// // // //       />
// // // //     );
// // // //   }
// // // //   if (activeSession === "pomodoro") {
// // // //     return (
// // // //       <PomodoroSession
// // // //         task={selectedTask}
// // // //         onComplete={handleSessionComplete}
// // // //         onExit={handleExitSession}
// // // //       />
// // // //     );
// // // //   }

// // // //   // Loading
// // // //   if (loading) {
// // // //     return (
// // // //       <div className="flex justify-center items-center p-10">
// // // //         <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
// // // //       </div>
// // // //     );
// // // //   }

// // // //   // Error
// // // //   if (error) {
// // // //     return (
// // // //       <div className="p-10 text-center text-red-600">
// // // //         Error: {error}
// // // //       </div>
// // // //     );
// // // //   }

// // // //   return (
// // // //     <div className="p-4">
// // // //       {/* Add task + Search */}
// // // //       <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-2 sm:space-y-0">
// // // //         <div className="flex items-center space-x-2">
// // // //           {showAddTaskInput && (
// // // //             <input
// // // //               type="text"
// // // //               placeholder="Enter task title"
// // // //               value={newTaskTitle}
// // // //               onChange={(e) => setNewTaskTitle(e.target.value)}
// // // //               className="px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-indigo-400"
// // // //             />
// // // //           )}
// // // //           <button
// // // //             onClick={() => {
// // // //               if (showAddTaskInput) handleAddTask();
// // // //               setShowAddTaskInput(!showAddTaskInput);
// // // //             }}
// // // //             className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
// // // //           >
// // // //             <Plus size={16} />
// // // //             <span>{showAddTaskInput ? "Save Task" : "Add Task"}</span>
// // // //           </button>
// // // //         </div>

// // // //         <div className="flex items-center space-x-2">
// // // //           <Search size={18} />
// // // //           <input
// // // //             type="text"
// // // //             placeholder="Search tasks..."
// // // //             value={searchQuery}
// // // //             onChange={(e) => setSearchQuery(e.target.value)}
// // // //             className="px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-indigo-400"
// // // //           />
// // // //         </div>
// // // //       </div>

// // // //       {/* Task List */}
// // // //       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
// // // //         <AnimatePresence>
// // // //           {filteredTasks.map((task, idx) => (
// // // //             <TaskCard
// // // //               key={task._id}
// // // //               task={task}
// // // //               index={idx}
// // // //               onStart={handleStart}
// // // //               onEdit={handleEdit}
// // // //               onDelete={handleDelete}
// // // //               onToggleComplete={() => handleToggleComplete(task)}
// // // //             />
// // // //           ))}
// // // //         </AnimatePresence>
// // // //       </div>

// // // //       {/* Start Task Modal */}
// // // //       <StartTaskModal
// // // //         isOpen={showStartModal}
// // // //         onClose={() => setShowStartModal(false)}
// // // //         onSelectMode={handleSelectMode}
// // // //         task={selectedTask}
// // // //       />
// // // //     </div>
// // // //   );
// // // // }

// // // // // "use client";
// // // // // import React, { useState, useEffect } from "react";
// // // // // import { useUser } from "@clerk/nextjs";
// // // // // import { AnimatePresence } from "framer-motion";
// // // // // import { Loader2, Plus, Search } from "lucide-react";

// // // // // import TaskCard from "./TaskCard";
// // // // // import StartTaskModal from "./StartTaskModal";
// // // // // import FocusSession from "./FocusModeContent";
// // // // // import PomodoroSession from "./PomodoroContent";
// // // // // import { taskApi } from "@/backend/lib/api";

// // // // // export default function TasksPage() {
// // // // //   const { user, isLoaded } = useUser();

// // // // //   // Data
// // // // //   const [tasks, setTasks] = useState([]);
// // // // //   const [loading, setLoading] = useState(false);
// // // // //   const [error, setError] = useState(null);

// // // // //   // UI
// // // // //   const [showStartModal, setShowStartModal] = useState(false);
// // // // //   const [selectedTask, setSelectedTask] = useState(null);
// // // // //   const [activeSession, setActiveSession] = useState(null); // "focus" | "pomodoro"
// // // // //   const [showAddTaskInput, setShowAddTaskInput] = useState(false);
// // // // //   const [newTaskTitle, setNewTaskTitle] = useState("");
// // // // //   const [searchQuery, setSearchQuery] = useState("");

// // // // //   // Fetch tasks
// // // // //   useEffect(() => {
// // // // //     if (!isLoaded || !user) return;
// // // // //     fetchTasks();
// // // // //   }, [isLoaded, user]);

// // // // //   const fetchTasks = async () => {
// // // // //     setLoading(true);
// // // // //     setError(null);
// // // // //     try {
// // // // //       const response = await taskApi.getTasks({ userId: user.id });
// // // // //       if (response.success) setTasks(response.data);
// // // // //       else setError(response.error || "Failed to fetch tasks");
// // // // //     } catch {
// // // // //       setError("Failed to load tasks");
// // // // //     } finally {
// // // // //       setLoading(false);
// // // // //     }
// // // // //   };

// // // // //   // Task actions
// // // // //   const handleToggleComplete = (task) => {
// // // // //     setTasks((prev) =>
// // // // //       prev.map((t) => (t._id === task._id ? { ...t, completed: !t.completed } : t))
// // // // //     );
// // // // //   };

// // // // //   const handleDelete = (taskId) => {
// // // // //     setTasks((prev) => prev.filter((t) => t._id !== taskId));
// // // // //   };

// // // // //   const handleEdit = (task) => {
// // // // //     alert(`Edit task: ${task.title}`);
// // // // //   };

// // // // //   const handleStart = (task) => {
// // // // //     setSelectedTask(task);
// // // // //     setShowStartModal(true);
// // // // //   };

// // // // //   const handleSelectMode = (mode, task) => {
// // // // //     setActiveSession(mode);
// // // // //     setSelectedTask(task);
// // // // //   };

// // // // //   const handleSessionComplete = () => {
// // // // //     alert("Session completed!");
// // // // //     setActiveSession(null);
// // // // //     setSelectedTask(null);
// // // // //   };

// // // // //   const handleExitSession = () => {
// // // // //     setActiveSession(null);
// // // // //     setSelectedTask(null);
// // // // //   };

// // // // //   // Add task
// // // // //   const handleAddTask = async () => {
// // // // //     if (!newTaskTitle.trim()) return;

// // // // //     const newTask = {
// // // // //       title: newTaskTitle,
// // // // //       description: "",
// // // // //       status: "pending",
// // // // //       userId: user.id,
// // // // //       completed: false,
// // // // //     };

// // // // //     try {
// // // // //       const response = await taskApi.createTask(newTask);
// // // // //       if (response.success) setTasks((prev) => [response.data, ...prev]);
// // // // //       else alert("Failed to create task");
// // // // //     } catch {
// // // // //       alert("Error creating task");
// // // // //     } finally {
// // // // //       setNewTaskTitle("");
// // // // //       setShowAddTaskInput(false);
// // // // //     }
// // // // //   };

// // // // //   // Filtered tasks for search
// // // // //   const filteredTasks = tasks.filter((task) =>
// // // // //     task.title.toLowerCase().includes(searchQuery.toLowerCase())
// // // // //   );

// // // // //   // Conditional Rendering for sessions
// // // // //   if (activeSession === "focus") {
// // // // //     return (
// // // // //       <FocusSession
// // // // //         task={selectedTask}
// // // // //         onComplete={handleSessionComplete}
// // // // //         onExit={handleExitSession}
// // // // //       />
// // // // //     );
// // // // //   }
// // // // //   if (activeSession === "pomodoro") {
// // // // //     return (
// // // // //       <PomodoroSession
// // // // //         task={selectedTask}
// // // // //         onComplete={handleSessionComplete}
// // // // //         onExit={handleExitSession}
// // // // //       />
// // // // //     );
// // // // //   }

// // // // //   // Loading
// // // // //   if (loading) {
// // // // //     return (
// // // // //       <div className="flex justify-center items-center p-10">
// // // // //         <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
// // // // //       </div>
// // // // //     );
// // // // //   }

// // // // //   // Error
// // // // //   if (error) {
// // // // //     return (
// // // // //       <div className="p-10 text-center text-red-600">
// // // // //         Error: {error}
// // // // //       </div>
// // // // //     );
// // // // //   }

// // // // //   return (
// // // // //     <div className="p-4">
// // // // //       {/* Add task + Search */}
// // // // //       <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-2 sm:space-y-0">
// // // // //         {/* Add task input */}
// // // // //         <div className="flex items-center space-x-2">
// // // // //           {showAddTaskInput && (
// // // // //             <input
// // // // //               type="text"
// // // // //               placeholder="Enter task title"
// // // // //               value={newTaskTitle}
// // // // //               onChange={(e) => setNewTaskTitle(e.target.value)}
// // // // //               className="px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-indigo-400"
// // // // //             />
// // // // //           )}
// // // // //           <button
// // // // //             onClick={() => {
// // // // //               if (showAddTaskInput) handleAddTask();
// // // // //               setShowAddTaskInput(!showAddTaskInput);
// // // // //             }}
// // // // //             className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
// // // // //           >
// // // // //             <Plus size={16} />
// // // // //             <span>{showAddTaskInput ? "Save Task" : "Add Task"}</span>
// // // // //           </button>
// // // // //         </div>

// // // // //         {/* Search */}
// // // // //         <div className="flex items-center space-x-2">
// // // // //           <Search size={18} />
// // // // //           <input
// // // // //             type="text"
// // // // //             placeholder="Search tasks..."
// // // // //             value={searchQuery}
// // // // //             onChange={(e) => setSearchQuery(e.target.value)}
// // // // //             className="px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-indigo-400"
// // // // //           />
// // // // //         </div>
// // // // //       </div>

// // // // //       {/* Task List */}
// // // // //       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
// // // // //         <AnimatePresence>
// // // // //           {filteredTasks.map((task, idx) => (
// // // // //             <TaskCard
// // // // //               key={task._id}
// // // // //               task={task}
// // // // //               index={idx}
// // // // //               onStart={handleStart}
// // // // //               onEdit={handleEdit}
// // // // //               onDelete={handleDelete}
// // // // //               onToggleComplete={() => handleToggleComplete(task)}
// // // // //             />
// // // // //           ))}
// // // // //         </AnimatePresence>
// // // // //       </div>

// // // // //       {/* Start Task Modal */}
// // // // //       <StartTaskModal
// // // // //         isOpen={showStartModal}
// // // // //         onClose={() => setShowStartModal(false)}
// // // // //         onSelectMode={handleSelectMode}
// // // // //         task={selectedTask}
// // // // //       />
// // // // //     </div>
// // // // //   );
// // // // // }

// // // // // // "use client";
// // // // // // import React, { useState, useEffect } from "react";
// // // // // // import { useUser } from "@clerk/nextjs";
// // // // // // import { AnimatePresence } from "framer-motion";
// // // // // // import { Loader2 } from "lucide-react";

// // // // // // import TaskCard from "./TaskCard";
// // // // // // import StartTaskModal from "./StartTaskModal";
// // // // // // import FocusSession from "./FocusModeContent";
// // // // // // import PomodoroSession from "./PomodoroContent";
// // // // // // import { taskApi } from "@/backend/lib/api";

// // // // // // export default function TasksPage() {
// // // // // //   const { user, isLoaded } = useUser();
// // // // // //   const [tasks, setTasks] = useState([]);
// // // // // //   const [loading, setLoading] = useState(false);
// // // // // //   const [error, setError] = useState(null);

// // // // // //   // UI State
// // // // // //   const [showStartModal, setShowStartModal] = useState(false);
// // // // // //   const [selectedTask, setSelectedTask] = useState(null);
// // // // // //   const [activeSession, setActiveSession] = useState(null); // "focus" | "pomodoro"

// // // // // //   // Fetch tasks when user is loaded
// // // // // //   useEffect(() => {
// // // // // //     if (!isLoaded || !user) return;

// // // // // //     setLoading(true);
// // // // // //     setError(null);

// // // // // //     taskApi
// // // // // //       .getTasks({ userId: user.id })
// // // // // //       .then((response) => {
// // // // // //         if (response.success) {
// // // // // //           setTasks(response.data);
// // // // // //         } else {
// // // // // //           setError(response.error || "Failed to fetch tasks");
// // // // // //         }
// // // // // //       })
// // // // // //       .catch(() => setError("Failed to load tasks"))
// // // // // //       .finally(() => setLoading(false));
// // // // // //   }, [isLoaded, user]);

// // // // // //   // Task Actions
// // // // // //   const handleToggleComplete = (task) => {
// // // // // //     const updatedTask = { ...task, completed: !task.completed };
// // // // // //     setTasks((prev) => prev.map((t) => (t._id === task._id ? updatedTask : t)));
// // // // // //   };

// // // // // //   const handleDelete = (taskId) => {
// // // // // //     setTasks((prev) => prev.filter((t) => t._id !== taskId));
// // // // // //   };

// // // // // //   const handleEdit = (task) => {
// // // // // //     alert(`Edit task: ${task.title}`);
// // // // // //   };

// // // // // //   const handleStart = (task) => {
// // // // // //     setSelectedTask(task);
// // // // // //     setShowStartModal(true);
// // // // // //   };

// // // // // //   // When user selects a mode from modal
// // // // // //   const handleSelectMode = (mode, task) => {
// // // // // //     setActiveSession(mode);
// // // // // //     setSelectedTask(task);
// // // // // //   };

// // // // // //   // When session ends
// // // // // //   const handleSessionComplete = () => {
// // // // // //     alert("Session completed!");
// // // // // //     setActiveSession(null);
// // // // // //     setSelectedTask(null);
// // // // // //   };

// // // // // //   const handleExitSession = () => {
// // // // // //     setActiveSession(null);
// // // // // //     setSelectedTask(null);
// // // // // //   };

// // // // // //   // Conditional Rendering
// // // // // //   if (activeSession === "focus") {
// // // // // //     return (
// // // // // //       <FocusSession
// // // // // //         task={selectedTask}
// // // // // //         onComplete={handleSessionComplete}
// // // // // //         onExit={handleExitSession}
// // // // // //       />
// // // // // //     );
// // // // // //   }

// // // // // //   if (activeSession === "pomodoro") {
// // // // // //     return (
// // // // // //       <PomodoroSession
// // // // // //         task={selectedTask}
// // // // // //         onComplete={handleSessionComplete}
// // // // // //         onExit={handleExitSession}
// // // // // //       />
// // // // // //     );
// // // // // //   }

// // // // // //   // Loading State
// // // // // //   if (loading) {
// // // // // //     return (
// // // // // //       <div className="flex justify-center items-center p-10">
// // // // // //         <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
// // // // // //       </div>
// // // // // //     );
// // // // // //   }

// // // // // //   // Error State
// // // // // //   if (error) {
// // // // // //     return (
// // // // // //       <div className="p-10 text-center text-red-600">
// // // // // //         Error: {error}
// // // // // //       </div>
// // // // // //     );
// // // // // //   }

// // // // // //   return (
// // // // // //     <>
// // // // // //       {/* Task List */}
// // // // // //       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
// // // // // //         <AnimatePresence>
// // // // // //           {tasks.map((task, idx) => (
// // // // // //             <TaskCard
// // // // // //               key={task._id}
// // // // // //               task={task}
// // // // // //               index={idx}
// // // // // //               onStart={handleStart}
// // // // // //               onEdit={handleEdit}
// // // // // //               onDelete={handleDelete}
// // // // // //               onToggleComplete={() => handleToggleComplete(task)}
// // // // // //             />
// // // // // //           ))}
// // // // // //         </AnimatePresence>
// // // // // //       </div>

// // // // // //       {/* Start Task Modal */}
// // // // // //       <StartTaskModal
// // // // // //         isOpen={showStartModal}
// // // // // //         onClose={() => setShowStartModal(false)}
// // // // // //         onSelectMode={handleSelectMode}
// // // // // //         task={selectedTask}
// // // // // //       />
// // // // // //     </>
// // // // // //   );
// // // // // // }

// // // // // // // "use client";
// // // // // // // import React, { useState, useEffect } from "react";
// // // // // // // import { useUser } from "@clerk/nextjs";
// // // // // // // import { motion, AnimatePresence } from "framer-motion";
// // // // // // // import { Loader2 } from "lucide-react";
// // // // // // // import TaskCard from "./TaskCard";
// // // // // // // import { taskApi } from "@/backend/lib/api";

// // // // // // // export default function TasksPage({ onPlayTask }) {
// // // // // // //   const { user, isLoaded } = useUser();
// // // // // // //   const [tasks, setTasks] = useState([]);
// // // // // // //   const [loading, setLoading] = useState(false);
// // // // // // //   const [error, setError] = useState(null);

// // // // // // //   useEffect(() => {
// // // // // // //     if (!isLoaded || !user) return;
// // // // // // //     setLoading(true);
// // // // // // //     setError(null);
// // // // // // //     taskApi
// // // // // // //       .getTasks({ userId: user.id })
// // // // // // //       .then(response => {
// // // // // // //         if (response.success) {
// // // // // // //           setTasks(response.data);
// // // // // // //         } else {
// // // // // // //           setError(response.error || "Failed to fetch tasks");
// // // // // // //         }
// // // // // // //       })
// // // // // // //       .catch(() => setError("Failed to load tasks"))
// // // // // // //       .finally(() => setLoading(false));
// // // // // // //   }, [isLoaded, user]);

// // // // // // //   const handleToggleComplete = (task) => {
// // // // // // //     const updatedTask = { ...task, completed: !task.completed };
// // // // // // //     setTasks(prev => prev.map(t => (t._id === task._id ? updatedTask : t)));
// // // // // // //     // Optionally, sync to backend here
// // // // // // //   };

// // // // // // //   const handleDelete = (taskId) => {
// // // // // // //     setTasks(prev => prev.filter(t => t._id !== taskId));
// // // // // // //     // Optionally, delete in backend
// // // // // // //   };

// // // // // // //   const handleEdit = (task) => {
// // // // // // //     alert(`Edit task: ${task.title}`);
// // // // // // //     // Implement modal or real edit logic
// // // // // // //   };

// // // // // // //   const handleStart = (task) => {
// // // // // // //     alert(`Start task: ${task.title}`);
// // // // // // //     if (onPlayTask) onPlayTask(task);
// // // // // // //   };

// // // // // // //   if (loading) {
// // // // // // //     return (
// // // // // // //       <div className="flex justify-center items-center p-10">
// // // // // // //         <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
// // // // // // //       </div>
// // // // // // //     );
// // // // // // //   }

// // // // // // //   if (error) {
// // // // // // //     return (
// // // // // // //       <div className="p-10 text-center text-red-600">
// // // // // // //         Error: {error}
// // // // // // //       </div>
// // // // // // //     );
// // // // // // //   }

// // // // // // //   if (!tasks.length) {
// // // // // // //     // ONLY show nothing if there is no task
// // // // // // //     return (
// // // // // // //       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4" />
// // // // // // //     );
// // // // // // //   }

// // // // // // //   return (
    
// // // // // // //     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
// // // // // // //       <AnimatePresence>
// // // // // // //         {tasks.map((task, idx) => (
// // // // // // //           <TaskCard
// // // // // // //             key={task._id}
// // // // // // //             task={task}
// // // // // // //             index={idx}
// // // // // // //             onStart={handleStart}
// // // // // // //             onEdit={handleEdit}
// // // // // // //             onDelete={handleDelete}
// // // // // // //             onToggleComplete={() => handleToggleComplete(task)}
// // // // // // //           />
// // // // // // //         ))}
// // // // // // //       </AnimatePresence>
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // }

// // // // // // // // "use client";
// // // // // // // // import React, { useState, useEffect } from "react";
// // // // // // // // import { useUser } from "@clerk/nextjs";
// // // // // // // // import { motion, AnimatePresence } from "framer-motion";
// // // // // // // // import { Loader2, Calendar as CalendarIcon, Search, Plus } from "lucide-react";
// // // // // // // // import TaskCard from "./TaskCard";
// // // // // // // // import { taskApi } from "@/backend/lib/api";

// // // // // // // // // Helper to generate mock/example tasks for empty state
// // // // // // // // const exampleTasks = [
// // // // // // // //   {
// // // // // // // //     _id: "example-1",
// // // // // // // //     title: "Finish math assignment",
// // // // // // // //     description: "Complete algebra problems 1 to 10.",
// // // // // // // //     dueDate: new Date().toISOString(),
// // // // // // // //     estimatedTime: 45,
// // // // // // // //     status: "pending",
// // // // // // // //     priority: "medium",
// // // // // // // //     energy: "Medium",
// // // // // // // //     completed: false,
// // // // // // // //   },
// // // // // // // //   {
// // // // // // // //     _id: "example-2",
// // // // // // // //     title: "Read AI paper",
// // // // // // // //     description: "Skim Ch. 3–4 of latest ML review article.",
// // // // // // // //     dueDate: new Date().toISOString(),
// // // // // // // //     estimatedTime: 30,
// // // // // // // //     status: "pending",
// // // // // // // //     priority: "high",
// // // // // // // //     energy: "High",
// // // // // // // //     completed: false,
// // // // // // // //   },
// // // // // // // //   {
// // // // // // // //     _id: "example-3",
// // // // // // // //     title: "Refactor backend code",
// // // // // // // //     description: "Improve error handling and add tests.",
// // // // // // // //     dueDate: new Date().toISOString(),
// // // // // // // //     estimatedTime: 60,
// // // // // // // //     status: "pending",
// // // // // // // //     priority: "high",
// // // // // // // //     energy: "Medium",
// // // // // // // //     completed: false,
// // // // // // // //   },
// // // // // // // // ];

// // // // // // // // export default function TasksPage({ onPlayTask, productivityLevel }) {
// // // // // // // //   const { user, isLoaded } = useUser();
// // // // // // // //   const [tasks, setTasks] = useState([]);
// // // // // // // //   const [loading, setLoading] = useState(false);
// // // // // // // //   const [error, setError] = useState(null);

// // // // // // // //   // UI filters
// // // // // // // //   const [search, setSearch] = useState("");
// // // // // // // //   const [status, setStatus] = useState("all");
// // // // // // // //   const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

// // // // // // // //   // Fetch real tasks
// // // // // // // //   useEffect(() => {
// // // // // // // //     if (!isLoaded || !user) return;
// // // // // // // //     setLoading(true);
// // // // // // // //     setError(null);
// // // // // // // //     taskApi
// // // // // // // //       .getTasks({ userId: user.id })
// // // // // // // //       .then((response) => {
// // // // // // // //         if (response.success) setTasks(response.data);
// // // // // // // //         else setError(response.error || "Failed to fetch tasks");
// // // // // // // //       })
// // // // // // // //       .catch(() => setError("Failed to load tasks"))
// // // // // // // //       .finally(() => setLoading(false));
// // // // // // // //   }, [isLoaded, user]);

// // // // // // // //   // Filter for display
// // // // // // // //   const shownTasks = tasks.filter((task) => {
// // // // // // // //     const textMatch =
// // // // // // // //       !search ||
// // // // // // // //       (task.title && task.title.toLowerCase().includes(search.toLowerCase())) ||
// // // // // // // //       (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
// // // // // // // //     const statusMatch =
// // // // // // // //       status === "all"
// // // // // // // //         ? true
// // // // // // // //         : status === "completed"
// // // // // // // //         ? task.status === "completed" || task.completed
// // // // // // // //         : !(task.status === "completed" || task.completed);
// // // // // // // //     const dateMatch =
// // // // // // // //       !date || (task.dueDate && new Date(task.dueDate).toISOString().split("T")[0] === date);
// // // // // // // //     const prodMatch = productivityLevel
// // // // // // // //       ? String(task.energy || "")
// // // // // // // //           .toLowerCase()
// // // // // // // //           .includes(productivityLevel.toLowerCase())
// // // // // // // //       : true;
// // // // // // // //     return textMatch && statusMatch && dateMatch && prodMatch;
// // // // // // // //   });

// // // // // // // //   // Actions
// // // // // // // //   const handleStart = (task) => onPlayTask?.(task);
// // // // // // // //   const handleEdit = (task) => alert("Edit " + task.title);
// // // // // // // //   const handleDelete = (id) => setTasks((prev) => prev.filter((t) => t._id !== id));
// // // // // // // //   const handleToggleComplete = (task) => {
// // // // // // // //     setTasks((prev) =>
// // // // // // // //       prev.map((t) =>
// // // // // // // //         t._id === task._id
// // // // // // // //           ? { ...t, completed: !t.completed, status: t.completed ? "pending" : "completed" }
// // // // // // // //           : t
// // // // // // // //       )
// // // // // // // //     );
// // // // // // // //   };

// // // // // // // //   // Main UI
// // // // // // // //   return (
// // // // // // // //     <div className="max-w-6xl mx-auto pt-6">
// // // // // // // //       <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
// // // // // // // //         <div>
// // // // // // // //           <h1 className="text-3xl font-bold text-gray-900 mb-1">Task Manager</h1>
// // // // // // // //           <div className="text-gray-500 flex gap-2 items-center">
// // // // // // // //             {new Date(date).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}{" "}
// // // // // // // //             • {shownTasks.filter((t) => t.status === "completed" || t.completed).length}/{shownTasks.length} completed
// // // // // // // //           </div>
// // // // // // // //           {productivityLevel && (
// // // // // // // //             <span className="text-indigo-600 text-sm mt-1 block underline underline-offset-2">
// // // // // // // //               Filtered for {productivityLevel} energy tasks
// // // // // // // //             </span>
// // // // // // // //           )}
// // // // // // // //         </div>
// // // // // // // //         <button
// // // // // // // //           className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow font-semibold flex items-center gap-2 text-lg"
// // // // // // // //           onClick={() => alert("Add Task")}
// // // // // // // //         >
// // // // // // // //           <Plus className="w-5 h-5" />
// // // // // // // //           Add Task
// // // // // // // //         </button>
// // // // // // // //       </div>

// // // // // // // //       <div className="bg-white rounded-2xl shadow p-6 flex flex-col sm:flex-row gap-4 mb-10 items-center">
// // // // // // // //         <div className="relative flex-1 w-full">
// // // // // // // //           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
// // // // // // // //           <input
// // // // // // // //             type="text"
// // // // // // // //             placeholder="Search tasks..."
// // // // // // // //             className="w-full bg-gray-100 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-gray-800 font-medium"
// // // // // // // //             value={search}
// // // // // // // //             onChange={(e) => setSearch(e.target.value)}
// // // // // // // //           />
// // // // // // // //         </div>
// // // // // // // //         <select
// // // // // // // //           className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 font-medium"
// // // // // // // //           value={status}
// // // // // // // //           onChange={(e) => setStatus(e.target.value)}
// // // // // // // //         >
// // // // // // // //           <option value="all">All Tasks</option>
// // // // // // // //           <option value="pending">Pending</option>
// // // // // // // //           <option value="completed">Completed</option>
// // // // // // // //         </select>
// // // // // // // //         <div className="relative">
// // // // // // // //           <input
// // // // // // // //             type="date"
// // // // // // // //             className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 font-medium"
// // // // // // // //             value={date}
// // // // // // // //             onChange={(e) => setDate(e.target.value)}
// // // // // // // //           />
// // // // // // // //           <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
// // // // // // // //         </div>
// // // // // // // //       </div>

// // // // // // // //       {loading ? (
// // // // // // // //         <div className="flex justify-center items-center py-20">
// // // // // // // //           <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
// // // // // // // //         </div>
// // // // // // // //       ) : error ? (
// // // // // // // //         <div className="text-center text-red-600 py-16">{error}</div>
// // // // // // // //       ) : shownTasks.length === 0 ? (
// // // // // // // //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
// // // // // // // //           <AnimatePresence>
// // // // // // // //             {exampleTasks.map((task, idx) => (
// // // // // // // //               <TaskCard
// // // // // // // //                 key={task._id}
// // // // // // // //                 task={task}
// // // // // // // //                 index={idx}
// // // // // // // //                 onStart={() => alert("Demo Start")}
// // // // // // // //                 onEdit={() => alert("Demo Edit")}
// // // // // // // //                 onDelete={() => alert("Demo Delete")}
// // // // // // // //                 onToggleComplete={() => alert("Demo Complete")}
// // // // // // // //               />
// // // // // // // //             ))}
// // // // // // // //           </AnimatePresence>
// // // // // // // //         </div>
// // // // // // // //       ) : (
// // // // // // // //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// // // // // // // //           <AnimatePresence>
// // // // // // // //             {shownTasks.map((task, idx) => (
// // // // // // // //               <TaskCard
// // // // // // // //                 key={task._id}
// // // // // // // //                 task={task}
// // // // // // // //                 index={idx}
// // // // // // // //                 onStart={handleStart}
// // // // // // // //                 onEdit={handleEdit}
// // // // // // // //                 onDelete={() => handleDelete(task._id)}
// // // // // // // //                 onToggleComplete={() => handleToggleComplete(task)}
// // // // // // // //               />
// // // // // // // //             ))}
// // // // // // // //           </AnimatePresence>
// // // // // // // //         </div>
// // // // // // // //       )}
// // // // // // // //     </div>
// // // // // // // //   );
// // // // // // // // }

// // // // // // // // // "use client";

// // // // // // // // // import React, { useState, useEffect } from 'react';
// // // // // // // // // import { useUser } from '@clerk/nextjs';
// // // // // // // // // import { motion, AnimatePresence } from 'framer-motion';
// // // // // // // // // import { format } from 'date-fns';
// // // // // // // // // import { Plus, Search, Calendar, Loader2, AlertCircle, Clock, Zap, Play, Edit, Trash2, X, Focus, Timer, Save, Check } from 'lucide-react';
// // // // // // // // // import { taskApi } from '@/backend/lib/api'; 

// // // // // // // // // // ------ StartTaskModal Component ------
// // // // // // // // // function StartTaskModal({ isOpen, onClose, onSelectMode, task }) {
// // // // // // // // //   if (!isOpen) return null;

// // // // // // // // //   return (
// // // // // // // // //     <AnimatePresence>
// // // // // // // // //       {isOpen && (
// // // // // // // // //         <motion.div
// // // // // // // // //           initial={{ opacity: 0 }}
// // // // // // // // //           animate={{ opacity: 1 }}
// // // // // // // // //           exit={{ opacity: 0 }}
// // // // // // // // //           className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50"
// // // // // // // // //           onClick={onClose}
// // // // // // // // //         >
// // // // // // // // //           <motion.div
// // // // // // // // //             initial={{ scale: 0.9, y: 50 }}
// // // // // // // // //             animate={{ scale: 1, y: 0 }}
// // // // // // // // //             exit={{ scale: 0.9, y: 50 }}
// // // // // // // // //             className="bg-white rounded-2xl p-8 w-full max-w-sm sm:max-w-md shadow-2xl relative"
// // // // // // // // //             onClick={(e) => e.stopPropagation()}
// // // // // // // // //           >
// // // // // // // // //             <button
// // // // // // // // //               onClick={onClose}
// // // // // // // // //               className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
// // // // // // // // //             >
// // // // // // // // //               <X className="w-6 h-6" />
// // // // // // // // //             </button>
// // // // // // // // //             <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
// // // // // // // // //               Choose Your Focus Mode
// // // // // // // // //             </h2>
// // // // // // // // //             {task && (
// // // // // // // // //               <p className="text-gray-600 text-center mb-6">
// // // // // // // // //                 Starting: <span className="font-semibold">{task.title}</span>
// // // // // // // // //               </p>
// // // // // // // // //             )}
// // // // // // // // //             <div className="flex flex-col space-y-4">
// // // // // // // // //               <motion.button
// // // // // // // // //                 whileHover={{ scale: 1.02 }}
// // // // // // // // //                 whileTap={{ scale: 0.98 }}
// // // // // // // // //                 onClick={() => onSelectMode('focus')}
// // // // // // // // //                 className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
// // // // // // // // //               >
// // // // // // // // //                 <Focus className="w-6 h-6" />
// // // // // // // // //                 <span>Focus Mode</span>
// // // // // // // // //               </motion.button>
// // // // // // // // //               <motion.button
// // // // // // // // //                 whileHover={{ scale: 1.02 }}
// // // // // // // // //                 whileTap={{ scale: 0.98 }}
// // // // // // // // //                 onClick={() => onSelectMode('pomodoro')}
// // // // // // // // //                 className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
// // // // // // // // //               >
// // // // // // // // //                 <Timer className="w-6 h-6" />
// // // // // // // // //                 <span>Pomodoro Technique</span>
// // // // // // // // //               </motion.button>
// // // // // // // // //             </div>
// // // // // // // // //           </motion.div>
// // // // // // // // //         </motion.div>
// // // // // // // // //       )}
// // // // // // // // //     </AnimatePresence>
// // // // // // // // //   );
// // // // // // // // // }

// // // // // // // // // // ------ TaskCard Component ------
// // // // // // // // // function TaskCard({ task, index, onToggleComplete, onDelete, onEdit, onShowStartModal, onGainXP }) {
// // // // // // // // //   const [isFadingOut, setIsFadingOut] = useState(false);
  
// // // // // // // // //   const priorityColors = {
// // // // // // // // //     urgent: "bg-red-500",
// // // // // // // // //     high: "bg-red-500",
// // // // // // // // //     medium: "bg-yellow-500",
// // // // // // // // //     low: "bg-green-500",
// // // // // // // // //   };
  
// // // // // // // // //   const energyColors = { 
// // // // // // // // //     High: "text-blue-500", 
// // // // // // // // //     Medium: "text-orange-500", 
// // // // // // // // //     Low: "text-teal-500" 
// // // // // // // // //   };
  
// // // // // // // // //   const isCompleted = task.status === 'completed';

// // // // // // // // //   const handleToggle = async (e) => {
// // // // // // // // //     e.stopPropagation();
// // // // // // // // //     if (isCompleted) {
// // // // // // // // //       await onToggleComplete(task);
// // // // // // // // //       return;
// // // // // // // // //     }
// // // // // // // // //     setIsFadingOut(true);
// // // // // // // // //     await new Promise(resolve => setTimeout(resolve, 600));
// // // // // // // // //     await onToggleComplete(task);
// // // // // // // // //     if (onGainXP) onGainXP(10);
// // // // // // // // //     setIsFadingOut(false);
// // // // // // // // //   };

// // // // // // // // //   const handleDelete = (e) => { e.stopPropagation(); onDelete(task._id); };
// // // // // // // // //   const handleEdit = (e) => { e.stopPropagation(); onEdit(task); };
// // // // // // // // //   const handleStart = (e) => { 
// // // // // // // // //     e.stopPropagation(); 
// // // // // // // // //     if (onShowStartModal) {
// // // // // // // // //       onShowStartModal(task);
// // // // // // // // //     }
// // // // // // // // //   };

// // // // // // // // //   return (
// // // // // // // // //     <motion.div
// // // // // // // // //       layout
// // // // // // // // //       initial={{ opacity: 0, y: 50 }}
// // // // // // // // //       animate={{ opacity: 1, y: 0 }}
// // // // // // // // //       exit={{ opacity: 0, scale: 0.8 }}
// // // // // // // // //       transition={{ duration: 0.3, delay: index * 0.05 }}
// // // // // // // // //       className={`relative bg-white rounded-2xl shadow-lg p-6 border ${isCompleted ? "border-green-300 opacity-60" : "border-gray-200"} hover:shadow-xl transition-all duration-300`}
// // // // // // // // //     >
// // // // // // // // //       <AnimatePresence>
// // // // // // // // //         {isFadingOut && (
// // // // // // // // //           <motion.div
// // // // // // // // //             initial={{ opacity: 0, scale: 0.5 }}
// // // // // // // // //             animate={{ opacity: 1, scale: 1 }}
// // // // // // // // //             exit={{ opacity: 0, scale: 1.5 }}
// // // // // // // // //             transition={{ duration: 0.4 }}
// // // // // // // // //             className="absolute inset-0 bg-green-500/80 rounded-2xl flex items-center justify-center z-10"
// // // // // // // // //           >
// // // // // // // // //             <Check className="w-16 h-16 text-white" />
// // // // // // // // //           </motion.div>
// // // // // // // // //         )}
// // // // // // // // //       </AnimatePresence>

// // // // // // // // //       <div className="flex justify-between items-start mb-4">
// // // // // // // // //         <h3 className={`text-lg font-semibold pr-4 ${isCompleted ? "text-gray-400 line-through" : "text-gray-800"}`}>
// // // // // // // // //           {task.title}
// // // // // // // // //         </h3>
// // // // // // // // //         <motion.button
// // // // // // // // //           whileHover={{ scale: 1.1 }}
// // // // // // // // //           whileTap={{ scale: 0.9 }}
// // // // // // // // //           onClick={handleToggle}
// // // // // // // // //           className={`flex-shrink-0 w-6 h-6 rounded-full border-2 ${isCompleted ? "bg-green-500 border-green-500" : "border-gray-300"} flex items-center justify-center transition-all`}
// // // // // // // // //         >
// // // // // // // // //           {isCompleted && (
// // // // // // // // //             <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// // // // // // // // //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
// // // // // // // // //             </svg>
// // // // // // // // //           )}
// // // // // // // // //         </motion.button>
// // // // // // // // //       </div>

// // // // // // // // //       <p className={`text-sm text-gray-500 mb-6 ${isCompleted ? "line-through" : ""}`}>
// // // // // // // // //         {task.description || 'No description provided'}
// // // // // // // // //       </p>

// // // // // // // // //       <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mb-6">
// // // // // // // // //         <div className="flex items-center text-gray-600">
// // // // // // // // //           <Clock className="w-4 h-4 mr-2" />
// // // // // // // // //           {task.estimatedTime || 25} min
// // // // // // // // //         </div>
// // // // // // // // //         {task.energy && (
// // // // // // // // //           <div className="flex items-center text-gray-600">
// // // // // // // // //             <Zap className={`w-4 h-4 mr-2 ${energyColors[task.energy]}`} />
// // // // // // // // //             {task.energy}
// // // // // // // // //           </div>
// // // // // // // // //         )}
// // // // // // // // //         {task.dueDate && (
// // // // // // // // //           <div className="flex items-center text-gray-600">
// // // // // // // // //             <Calendar className="w-4 h-4 mr-2" />
// // // // // // // // //             {format(new Date(task.dueDate), "MMM dd")}
// // // // // // // // //           </div>
// // // // // // // // //         )}
// // // // // // // // //         <div className="flex items-center text-gray-600">
// // // // // // // // //           <span className={`w-2.5 h-2.5 rounded-full mr-2 ${priorityColors[task.priority] || priorityColors.medium}`}></span>
// // // // // // // // //           {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'}
// // // // // // // // //         </div>
// // // // // // // // //       </div>

// // // // // // // // //       <div className="flex justify-end space-x-2 border-t pt-4 -mx-6 px-6">
// // // // // // // // //         {!isCompleted && (
// // // // // // // // //           <motion.button 
// // // // // // // // //             whileHover={{ scale: 1.05 }} 
// // // // // // // // //             whileTap={{ scale: 0.95 }} 
// // // // // // // // //             onClick={handleStart}
// // // // // // // // //             className="p-2 text-gray-500 hover:text-blue-500" 
// // // // // // // // //             title="Start Task"
// // // // // // // // //           >
// // // // // // // // //             <Play className="w-5 h-5" />
// // // // // // // // //           </motion.button>
// // // // // // // // //         )}
// // // // // // // // //         <motion.button 
// // // // // // // // //           whileHover={{ scale: 1.05 }} 
// // // // // // // // //           whileTap={{ scale: 0.95 }} 
// // // // // // // // //           onClick={handleEdit}
// // // // // // // // //           className="p-2 text-gray-500 hover:text-yellow-500" 
// // // // // // // // //           title="Edit Task"
// // // // // // // // //         >
// // // // // // // // //           <Edit className="w-5 h-5" />
// // // // // // // // //         </motion.button>
// // // // // // // // //         <motion.button 
// // // // // // // // //           whileHover={{ scale: 1.05 }} 
// // // // // // // // //           whileTap={{ scale: 0.95 }} 
// // // // // // // // //           onClick={handleDelete}
// // // // // // // // //           className="p-2 text-gray-500 hover:text-red-500" 
// // // // // // // // //           title="Delete Task"
// // // // // // // // //         >
// // // // // // // // //           <Trash2 className="w-5 h-5" />
// // // // // // // // //         </motion.button>
// // // // // // // // //       </div>
// // // // // // // // //     </motion.div>
// // // // // // // // //   );
// // // // // // // // // }

// // // // // // // // // // ------ EditTaskModal Component ------
// // // // // // // // // function EditTaskModal({ isOpen, onClose, onSubmit, editingTask }) {
// // // // // // // // //   const defaultTask = { 
// // // // // // // // //     title: '', 
// // // // // // // // //     description: '', 
// // // // // // // // //     priority: 'medium', 
// // // // // // // // //     energy: 'Medium', 
// // // // // // // // //     estimatedTime: 25, 
// // // // // // // // //     dueDate: '',
// // // // // // // // //     category: 'personal' // Add default category
// // // // // // // // //   };
// // // // // // // // //   const [taskData, setTaskData] = useState(editingTask || defaultTask);

// // // // // // // // //   useEffect(() => {
// // // // // // // // //     setTaskData(editingTask ? { ...defaultTask, ...editingTask } : defaultTask);
// // // // // // // // //   }, [editingTask, isOpen]);

// // // // // // // // //   const handleChange = (field, value) => setTaskData(prev => ({ ...prev, [field]: value }));
// // // // // // // // //   const handleSubmit = (e) => { e.preventDefault(); onSubmit(taskData); };

// // // // // // // // //   if (!isOpen) return null;

// // // // // // // // //   return (
// // // // // // // // //     <AnimatePresence>
// // // // // // // // //       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
// // // // // // // // //         <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
// // // // // // // // //           <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
// // // // // // // // //           <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
// // // // // // // // //           <form onSubmit={handleSubmit} className="space-y-4">
// // // // // // // // //             <div>
// // // // // // // // //               <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
// // // // // // // // //               <input type="text" value={taskData.title} onChange={(e) => handleChange('title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
// // // // // // // // //             </div>
// // // // // // // // //             <div>
// // // // // // // // //               <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
// // // // // // // // //               <textarea value={taskData.description} onChange={(e) => handleChange('description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="3" />
// // // // // // // // //             </div>
// // // // // // // // //             <div className="grid grid-cols-2 gap-4">
// // // // // // // // //               <div>
// // // // // // // // //                 <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
// // // // // // // // //                 <select value={taskData.priority} onChange={(e) => handleChange('priority', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
// // // // // // // // //                   <option value="low">Low</option>
// // // // // // // // //                   <option value="medium">Medium</option>
// // // // // // // // //                   <option value="high">High</option>
// // // // // // // // //                   <option value="urgent">Urgent</option>
// // // // // // // // //                 </select>
// // // // // // // // //               </div>
// // // // // // // // //               <div>
// // // // // // // // //                 <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
// // // // // // // // //                 <select value={taskData.category} onChange={(e) => handleChange('category', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
// // // // // // // // //                   <option value="personal">Personal</option>
// // // // // // // // //                   <option value="work">Work</option>
// // // // // // // // //                   <option value="study">Study</option>
// // // // // // // // //                   <option value="fitness">Fitness</option>
// // // // // // // // //                   <option value="hobby">Hobby</option>
// // // // // // // // //                   <option value="other">Other</option>
// // // // // // // // //                 </select>
// // // // // // // // //               </div>
// // // // // // // // //             </div>
// // // // // // // // //             <div className="grid grid-cols-2 gap-4">
// // // // // // // // //               <div>
// // // // // // // // //                 <label className="block text-sm font-medium text-gray-700 mb-2">Energy Level</label>
// // // // // // // // //                 <select value={taskData.energy} onChange={(e) => handleChange('energy', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
// // // // // // // // //                   <option value="Low">Low</option>
// // // // // // // // //                   <option value="Medium">Medium</option>
// // // // // // // // //                   <option value="High">High</option>
// // // // // // // // //                 </select>
// // // // // // // // //               </div>
// // // // // // // // //               <div>
// // // // // // // // //                 <label className="block text-sm font-medium text-gray-700 mb-2">Est. Time (min)</label>
// // // // // // // // //                 <input type="number" value={taskData.estimatedTime} onChange={(e) => handleChange('estimatedTime', parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" min="1" />
// // // // // // // // //               </div>
// // // // // // // // //             </div>
// // // // // // // // //             <div>
// // // // // // // // //               <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
// // // // // // // // //               <input type="date" value={taskData.dueDate ? taskData.dueDate.split('T')[0] : ''} onChange={(e) => handleChange('dueDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
// // // // // // // // //             </div>
// // // // // // // // //             <div className="flex space-x-4 pt-4">
// // // // // // // // //               <motion.button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</motion.button>
// // // // // // // // //               <motion.button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"><Save className="w-4 h-4" /><span>Save Task</span></motion.button>
// // // // // // // // //             </div>
// // // // // // // // //           </form>
// // // // // // // // //         </motion.div>
// // // // // // // // //       </motion.div>
// // // // // // // // //     </AnimatePresence>
// // // // // // // // //   );
// // // // // // // // // }

// // // // // // // // // // ------ MAIN PAGE COMPONENT: TasksPage ------
// // // // // // // // // export default function TasksPage({ onPlayTask, productivityLevel, onTaskComplete }) {
// // // // // // // // //   const { user, isLoaded } = useUser();
// // // // // // // // //   const [tasks, setTasks] = useState([]);
// // // // // // // // //   const [filteredTasks, setFilteredTasks] = useState([]);
// // // // // // // // //   const [isModalOpen, setIsModalOpen] = useState(false);
// // // // // // // // //   const [editingTask, setEditingTask] = useState(null);
// // // // // // // // //   const [loading, setLoading] = useState(true);
// // // // // // // // //   const [error, setError] = useState(null);
// // // // // // // // //   const [filters, setFilters] = useState({
// // // // // // // // //     status: 'all',
// // // // // // // // //     search: '',
// // // // // // // // //     date: new Date().toISOString().split('T')[0]
// // // // // // // // //   });

// // // // // // // // //   // New state for StartTaskModal and XP
// // // // // // // // //   const [isStartModalOpen, setIsStartModalOpen] = useState(false);
// // // // // // // // //   const [taskToStart, setTaskToStart] = useState(null);
// // // // // // // // //   const [userXP, setUserXP] = useState(0);

// // // // // // // // //   // Fetch tasks
// // // // // // // // //   useEffect(() => {
// // // // // // // // //     const fetchTasks = async () => {
// // // // // // // // //       if (!user?.id) {
// // // // // // // // //         setLoading(false);
// // // // // // // // //         return;
// // // // // // // // //       }
// // // // // // // // //       setError(null);
// // // // // // // // //       try {
// // // // // // // // //         const response = await taskApi.getTasks({ userId: user.id });
// // // // // // // // //         if (response.success && response.data) {
// // // // // // // // //           setTasks(response.data);
// // // // // // // // //         } else {
// // // // // // // // //           throw new Error(response.error || 'Failed to fetch tasks');
// // // // // // // // //         }
// // // // // // // // //       } catch (err) {
// // // // // // // // //         setError(err.message);
// // // // // // // // //       } finally {
// // // // // // // // //         setLoading(false);
// // // // // // // // //       }
// // // // // // // // //     };
// // // // // // // // //     fetchTasks();
// // // // // // // // //   }, [user?.id]);

// // // // // // // // //   // Filter tasks
// // // // // // // // //   useEffect(() => {
// // // // // // // // //     let filtered = tasks || [];
// // // // // // // // //     if (productivityLevel) {
// // // // // // // // //       filtered = filtered.filter(task => task.energy?.toLowerCase() === productivityLevel.toLowerCase());
// // // // // // // // //     }
// // // // // // // // //     if (filters.status !== 'all') {
// // // // // // // // //       filtered = filtered.filter(task => filters.status === 'completed' ? task.status === 'completed' : task.status !== 'completed');
// // // // // // // // //     }
// // // // // // // // //     if (filters.search) {
// // // // // // // // //       filtered = filtered.filter(task =>
// // // // // // // // //         task.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
// // // // // // // // //         task.description?.toLowerCase().includes(filters.search.toLowerCase())
// // // // // // // // //       );
// // // // // // // // //     }
// // // // // // // // //     if (filters.date) {
// // // // // // // // //       filtered = filtered.filter(task => task.dueDate?.startsWith(filters.date));
// // // // // // // // //     }
// // // // // // // // //     setFilteredTasks(filtered);
// // // // // // // // //   }, [tasks, filters, productivityLevel]);

// // // // // // // // //   // New handler functions
// // // // // // // // //   const handleShowStartModal = (task) => {
// // // // // // // // //     setTaskToStart(task);
// // // // // // // // //     setIsStartModalOpen(true);
// // // // // // // // //   };

// // // // // // // // //   const handleGainXP = (amount) => {
// // // // // // // // //     setUserXP(prevXP => prevXP + amount);
// // // // // // // // //     console.log(`Gained ${amount} XP! Total XP: ${userXP + amount}`);
// // // // // // // // //     // Here you would also update the user's XP in your database
// // // // // // // // //   };

// // // // // // // // //   const handleModeSelection = (mode) => {
// // // // // // // // //     setIsStartModalOpen(false);
// // // // // // // // //     console.log(`Selected mode: ${mode} for task: ${taskToStart?.title}`);
// // // // // // // // //     if (onPlayTask) {
// // // // // // // // //       onPlayTask(mode, taskToStart);
// // // // // // // // //     }
// // // // // // // // //   };

// // // // // // // // //   // CRUD Handlers
// // // // // // // // //   const handleTaskSubmit = async (taskData) => {
// // // // // // // // //     if (editingTask) {
// // // // // // // // //       await handleUpdateTask(taskData);
// // // // // // // // //     } else {
// // // // // // // // //       await handleCreateTask(taskData);
// // // // // // // // //     }
// // // // // // // // //   };

// // // // // // // // //   const handleCreateTask = async (taskData) => {
// // // // // // // // //     if (!user?.id) return;
// // // // // // // // //     try {
// // // // // // // // //       const taskPayload = {
// // // // // // // // //         ...taskData,
// // // // // // // // //         userId: user.id,
// // // // // // // // //         category: taskData.category || 'personal',
// // // // // // // // //         status: 'pending'
// // // // // // // // //       };
// // // // // // // // //       const response = await taskApi.createTask(taskPayload);
// // // // // // // // //       if (response.success && response.data) {
// // // // // // // // //         setTasks(prev => [response.data, ...prev]);
// // // // // // // // //         closeModal();
// // // // // // // // //       } else {
// // // // // // // // //         throw new Error(response.error || 'Failed to create task');
// // // // // // // // //       }
// // // // // // // // //     } catch (err) { 
// // // // // // // // //       setError(err.message); 
// // // // // // // // //     }
// // // // // // // // //   };

// // // // // // // // //   const handleUpdateTask = async (taskData) => {
// // // // // // // // //     if (!editingTask?._id) return;
// // // // // // // // //     try {
// // // // // // // // //       const response = await taskApi.updateTask(editingTask._id, taskData);
// // // // // // // // //       if (response.success && response.data) {
// // // // // // // // //         setTasks(prev => prev.map(t => t._id === editingTask._id ? response.data : t));
// // // // // // // // //         closeModal();
// // // // // // // // //       } else {
// // // // // // // // //         throw new Error(response.error || 'Failed to update task');
// // // // // // // // //       }
// // // // // // // // //     } catch (err) { 
// // // // // // // // //       setError(err.message); 
// // // // // // // // //     }
// // // // // // // // //   };

// // // // // // // // //   const handleDeleteTask = async (taskId) => {
// // // // // // // // //     if (!taskId || !confirm('Are you sure you want to delete this task?')) return;
// // // // // // // // //     try {
// // // // // // // // //       const response = await taskApi.deleteTask(taskId);
// // // // // // // // //       if (response.success) {
// // // // // // // // //         setTasks(prev => prev.filter(t => t._id !== taskId));
// // // // // // // // //       } else {
// // // // // // // // //         throw new Error(response.error || 'Failed to delete task');
// // // // // // // // //       }
// // // // // // // // //     } catch (err) { 
// // // // // // // // //       setError(err.message); 
// // // // // // // // //     }
// // // // // // // // //   };

// // // // // // // // //   const handleToggleComplete = async (task) => {
// // // // // // // // //     if (!task?._id) return;
// // // // // // // // //     const newStatus = task.status === 'completed' ? 'pending' : 'completed';
// // // // // // // // //     const updatedData = { ...task, status: newStatus, completedAt: newStatus === 'completed' ? new Date().toISOString() : null };
    
// // // // // // // // //     // Optimistic UI update
// // // // // // // // //     setTasks(prev => prev.map(t => t._id === task._id ? updatedData : t));

// // // // // // // // //     try {
// // // // // // // // //       const response = await taskApi.updateTask(task._id, { status: newStatus, completedAt: updatedData.completedAt });
// // // // // // // // //       if (!response.success) {
// // // // // // // // //         // Revert on failure
// // // // // // // // //         setTasks(prev => prev.map(t => t._id === task._id ? task : t));
// // // // // // // // //         throw new Error(response.error || 'Failed to update task status');
// // // // // // // // //       }
// // // // // // // // //       if (newStatus === 'completed' && onTaskComplete) {
// // // // // // // // //         onTaskComplete(task._id, task.estimatedTime || 25);
// // // // // // // // //       }
// // // // // // // // //     } catch (err) { 
// // // // // // // // //       setError(err.message); 
// // // // // // // // //     }
// // // // // // // // //   };

// // // // // // // // //   // Modal Handlers
// // // // // // // // //   const openEditModal = (task) => { setEditingTask(task); setIsModalOpen(true); };
// // // // // // // // //   const openCreateModal = () => { setEditingTask(null); setIsModalOpen(true); };
// // // // // // // // //   const closeModal = () => { setIsModalOpen(false); setEditingTask(null); };

// // // // // // // // //   // UI Stats
// // // // // // // // //   const tasksForDay = filteredTasks.filter(task => task.dueDate?.startsWith(filters.date));
// // // // // // // // //   const completedTasksCount = tasksForDay.filter(t => t.status === 'completed').length;
// // // // // // // // //   const totalTasksCount = tasksForDay.length;

// // // // // // // // //   if (loading) {
// // // // // // // // //     return <div className="flex-1 flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
// // // // // // // // //   }

// // // // // // // // //   return (
// // // // // // // // //     <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
// // // // // // // // //       <div className="max-w-7xl mx-auto">
// // // // // // // // //         {error && (
// // // // // // // // //           <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
// // // // // // // // //             <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
// // // // // // // // //             <div><p className="text-red-800 font-medium">Error</p><p className="text-red-600 text-sm">{error}</p></div>
// // // // // // // // //             <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
// // // // // // // // //           </div>
// // // // // // // // //         )}

// // // // // // // // //         <header className="mb-8">
// // // // // // // // //           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
// // // // // // // // //             <div>
// // // // // // // // //               <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Task Manager</h1>
// // // // // // // // //               <p className="text-gray-500 mt-2">{format(new Date(filters.date.replace(/-/g, '\/')), 'EEEE, MMMM do, yyyy')} • {completedTasksCount}/{totalTasksCount} completed</p>
// // // // // // // // //               {productivityLevel && <p className="text-sm text-indigo-600 mt-1">Filtered for {productivityLevel} energy tasks</p>}
// // // // // // // // //             </div>
// // // // // // // // //             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openCreateModal} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 shadow-md mt-4 sm:mt-0">
// // // // // // // // //               <Plus className="w-5 h-5" /><span>Add Task</span>
// // // // // // // // //             </motion.button>
// // // // // // // // //           </div>
// // // // // // // // //           <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
// // // // // // // // //             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// // // // // // // // //               <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Search tasks..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} className="w-full bg-gray-100 border border-transparent rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500"/></div>
// // // // // // // // //               <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="bg-gray-100 border border-transparent rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"><option value="all">All Tasks</option><option value="pending">Pending</option><option value="completed">Completed</option></select>
// // // // // // // // //               <input type="date" value={filters.date || ''} onChange={(e) => setFilters({...filters, date: e.target.value})} className="w-full bg-gray-100 border border-transparent rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"/>
// // // // // // // // //             </div>
// // // // // // // // //           </div>
// // // // // // // // //         </header>

// // // // // // // // //         <main>
// // // // // // // // //           {filteredTasks.length === 0 ? (
// // // // // // // // //             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
// // // // // // // // //               <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center"><Calendar className="w-12 h-12 text-gray-500" /></div>
// // // // // // // // //               <h3 className="text-xl font-semibold text-gray-700 mb-2">No tasks match your criteria</h3>
// // // // // // // // //               <p className="text-gray-500 mb-6">Try adjusting the filters or add a new task for this day.</p>
// // // // // // // // //             </motion.div>
// // // // // // // // //           ) : (
// // // // // // // // //             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
// // // // // // // // //               <AnimatePresence>
// // // // // // // // //                 {filteredTasks.map((task, index) => (
// // // // // // // // //                   <TaskCard 
// // // // // // // // //                     key={task._id} 
// // // // // // // // //                     task={task} 
// // // // // // // // //                     index={index} 
// // // // // // // // //                     onToggleComplete={handleToggleComplete}
// // // // // // // // //                     onDelete={handleDeleteTask}
// // // // // // // // //                     onEdit={openEditModal}
// // // // // // // // //                     onShowStartModal={handleShowStartModal}
// // // // // // // // //                     onGainXP={handleGainXP}
// // // // // // // // //                   />
// // // // // // // // //                 ))}
// // // // // // // // //               </AnimatePresence>
// // // // // // // // //             </div>
// // // // // // // // //           )}
// // // // // // // // //         </main>

// // // // // // // // //         <EditTaskModal isOpen={isModalOpen} onClose={closeModal} onSubmit={handleTaskSubmit} editingTask={editingTask} />
// // // // // // // // //         <StartTaskModal isOpen={isStartModalOpen} onClose={() => setIsStartModalOpen(false)} task={taskToStart} onSelectMode={handleModeSelection} />
// // // // // // // // //       </div>
// // // // // // // // //     </div>
// // // // // // // // //   );
// // // // // // // // // }

// // // // // // // // // // "use client";
// // // // // // // // // // import React, { useState, useEffect } from "react";
// // // // // // // // // // import { useUser } from "@clerk/nextjs";
// // // // // // // // // // import { motion, AnimatePresence } from "framer-motion";
// // // // // // // // // // import { Loader2, AlertCircle } from "lucide-react";
// // // // // // // // // // import TaskCard from "./TaskCard";
// // // // // // // // // // import { taskApi } from "@/backend/lib/api";

// // // // // // // // // // export default function TasksPage({ onPlayTask }) {
// // // // // // // // // //   const { user, isLoaded } = useUser();
// // // // // // // // // //   const [tasks, setTasks] = useState([]);
// // // // // // // // // //   const [loading, setLoading] = useState(false);
// // // // // // // // // //   const [error, setError] = useState(null);

// // // // // // // // // //   useEffect(() => {
// // // // // // // // // //     if (!isLoaded || !user) return;
// // // // // // // // // //     (async () => {
// // // // // // // // // //       setLoading(true);
// // // // // // // // // //       setError(null);
// // // // // // // // // //       try {
// // // // // // // // // //         const response = await taskApi.getTasks({ userId: user.id });
// // // // // // // // // //         if (response.success) {
// // // // // // // // // //           setTasks(response.data);
// // // // // // // // // //         } else {
// // // // // // // // // //           setError(response.error || "Failed to fetch tasks");
// // // // // // // // // //         }
// // // // // // // // // //       } catch {
// // // // // // // // // //         setError("Failed to load tasks");
// // // // // // // // // //       } finally {
// // // // // // // // // //         setLoading(false);
// // // // // // // // // //       }
// // // // // // // // // //     })();
// // // // // // // // // //   }, [isLoaded, user]);

// // // // // // // // // //   const handleToggleComplete = async (task) => {
// // // // // // // // // //     const updatedTask = { ...task, completed: !task.completed };
// // // // // // // // // //     setTasks((prev) =>
// // // // // // // // // //       prev.map((t) => (t._id === task._id ? updatedTask : t))
// // // // // // // // // //     );
// // // // // // // // // //     // Optionally sync to backend here
// // // // // // // // // //   };

// // // // // // // // // //   const handleDelete = (taskId) => {
// // // // // // // // // //     setTasks((prev) => prev.filter((t) => t._id !== taskId));
// // // // // // // // // //     // Optionally delete in backend
// // // // // // // // // //   };

// // // // // // // // // //   const handleEdit = (task) => {
// // // // // // // // // //     alert(`Edit task: ${task.title}`);
// // // // // // // // // //     // Implement modal or real edit logic
// // // // // // // // // //   };

// // // // // // // // // //   const handleStart = (task) => {
// // // // // // // // // //     alert(`Start task: ${task.title}`);
// // // // // // // // // //     if(onPlayTask) onPlayTask(task);
// // // // // // // // // //   };

// // // // // // // // // //   if (loading) {
// // // // // // // // // //     return (
// // // // // // // // // //       <div className="flex justify-center items-center p-10">
// // // // // // // // // //         <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
// // // // // // // // // //       </div>
// // // // // // // // // //     );
// // // // // // // // // //   }

// // // // // // // // // //   if (error) {
// // // // // // // // // //     return (
// // // // // // // // // //       <div className="p-10 text-center text-red-600">
// // // // // // // // // //         Error: {error}
// // // // // // // // // //       </div>
// // // // // // // // // //     );
// // // // // // // // // //   }

// // // // // // // // // //   if (!tasks.length) {
// // // // // // // // // //     return <div className="p-10 text-center">No tasks found.</div>;
// // // // // // // // // //   }

// // // // // // // // // //   return (
// // // // // // // // // //     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
// // // // // // // // // //       <AnimatePresence>
// // // // // // // // // //         {tasks.map((task, idx) => (
// // // // // // // // // //           <TaskCard
// // // // // // // // // //             key={task._id}
// // // // // // // // // //             task={task}
// // // // // // // // // //             index={idx}
// // // // // // // // // //             onStart={handleStart}
// // // // // // // // // //             onEdit={handleEdit}
// // // // // // // // // //             onDelete={handleDelete}
// // // // // // // // // //             onToggleComplete={() => handleToggleComplete(task)}
// // // // // // // // // //           />
// // // // // // // // // //         ))}
// // // // // // // // // //       </AnimatePresence>
// // // // // // // // // //     </div>
// // // // // // // // // //   );
// // // // // // // // // // }


// // // // // // // // // // // "use client"
// // // // // // // // // // // import React, { useState, useEffect } from 'react';
// // // // // // // // // // // import { useUser } from '@clerk/nextjs';
// // // // // // // // // // // import { motion, AnimatePresence } from 'framer-motion';
// // // // // // // // // // // import { format } from 'date-fns';
// // // // // // // // // // // import { Plus, Search, Calendar, Loader2, AlertCircle } from 'lucide-react';
// // // // // // // // // // // import { taskApi } from '@/backend/lib/api';
// // // // // // // // // // // import TaskCard from './TaskCard';
// // // // // // // // // // // import TaskModal from './TaskModal';
// // // // // // // // // // // import StartTaskModal from './StartTaskModal.jsx';

// // // // // // // // // // // export default function TasksPage({ 
// // // // // // // // // // //   tasks = [], 
// // // // // // // // // // //   setTasks, 
// // // // // // // // // // //   onPlayTask, 
// // // // // // // // // // //   productivityLevel, 
// // // // // // // // // // //   setUserData,
// // // // // // // // // // //   createTask,
// // // // // // // // // // //   updateTask,
// // // // // // // // // // //   deleteTask,
// // // // // // // // // // //   onTaskComplete 
// // // // // // // // // // // }) {
// // // // // // // // // // //   // Get current user
// // // // // // // // // // //   const { user } = useUser();

// // // // // // // // // // //   // Local state
// // // // // // // // // // //   const [filteredTasks, setFilteredTasks] = useState([]);
// // // // // // // // // // //   const [isModalOpen, setIsModalOpen] = useState(false);
// // // // // // // // // // //   const [isStartModalOpen, setIsStartModalOpen] = useState(false);
// // // // // // // // // // //   const [editingTask, setEditingTask] = useState(null);
// // // // // // // // // // //   const [taskToStart, setTaskToStart] = useState(null);
// // // // // // // // // // //   const [loading, setLoading] = useState(false);
// // // // // // // // // // //   const [error, setError] = useState(null);
// // // // // // // // // // //   const [filters, setFilters] = useState({
// // // // // // // // // // //     status: 'all',
// // // // // // // // // // //     search: '',
// // // // // // // // // // //     date: new Date().toISOString().split('T')[0]
// // // // // // // // // // //   });

// // // // // // // // // // //   // Fetch tasks when component loads or user changes
// // // // // // // // // // //   useEffect(() => {
// // // // // // // // // // //     const fetchTasks = async () => {
// // // // // // // // // // //       if (!user?.id) return;

// // // // // // // // // // //       try {
// // // // // // // // // // //         setLoading(true);
// // // // // // // // // // //         setError(null);
        
// // // // // // // // // // //         console.log('📋 Fetching tasks for user:', user.id);
// // // // // // // // // // //         const response = await taskApi.getTasks({ userId: user.id });
        
// // // // // // // // // // //         if (response.success && response.data) {
// // // // // // // // // // //           console.log(`✅ Loaded ${response.data.length} tasks`);
// // // // // // // // // // //           setTasks(response.data);
// // // // // // // // // // //         } else {
// // // // // // // // // // //           throw new Error(response.error || 'Failed to fetch tasks');
// // // // // // // // // // //         }
// // // // // // // // // // //       } catch (err) {
// // // // // // // // // // //         console.error('❌ Error fetching tasks:', err);
// // // // // // // // // // //         setError(err.message);
// // // // // // // // // // //       } finally {
// // // // // // // // // // //         setLoading(false);
// // // // // // // // // // //       }
// // // // // // // // // // //     };

// // // // // // // // // // //     if (user?.id) {
// // // // // // // // // // //       fetchTasks();
// // // // // // // // // // //     }
// // // // // // // // // // //   }, [user?.id, setTasks]);

// // // // // // // // // // //   // Filter tasks based on filters and productivity level
// // // // // // // // // // //  // In your TasksPage component, update the filtering logic:
// // // // // // // // // // // useEffect(() => {
// // // // // // // // // // //   let filtered = tasks || [];

// // // // // // // // // // //   console.log('🔍 Raw tasks from backend:', tasks); // Debug log
// // // // // // // // // // //   console.log('🔍 Number of tasks:', filtered.length); // Debug log

// // // // // // // // // // //   // Filter by productivity level (energy)
// // // // // // // // // // //   if (productivityLevel) {
// // // // // // // // // // //     filtered = filtered.filter(task => 
// // // // // // // // // // //       task.energy?.toLowerCase() === productivityLevel.toLowerCase()
// // // // // // // // // // //     );
// // // // // // // // // // //   }

// // // // // // // // // // //   // Filter by status - FIX: Check both 'status' and 'completed' fields
// // // // // // // // // // //   if (filters.status !== 'all') {
// // // // // // // // // // //     filtered = filtered.filter(task => {
// // // // // // // // // // //       if (filters.status === 'completed') {
// // // // // // // // // // //         return task.status === 'completed' || task.completed === true;
// // // // // // // // // // //       } else if (filters.status === 'pending') {
// // // // // // // // // // //         return task.status === 'pending' || task.completed === false;
// // // // // // // // // // //       }
// // // // // // // // // // //       return true;
// // // // // // // // // // //     });
// // // // // // // // // // //   }

// // // // // // // // // // //   // Filter by search
// // // // // // // // // // //   if (filters.search) {
// // // // // // // // // // //     filtered = filtered.filter(task =>
// // // // // // // // // // //       task.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
// // // // // // // // // // //       task.description?.toLowerCase().includes(filters.search.toLowerCase())
// // // // // // // // // // //     );
// // // // // // // // // // //   }

// // // // // // // // // // //   // Filter by date - FIX: Handle different date field names
// // // // // // // // // // //   if (filters.date) {
// // // // // // // // // // //     filtered = filtered.filter(task => {
// // // // // // // // // // //       if (!task.dueDate && !task.date) return false;
      
// // // // // // // // // // //       const taskDate = task.dueDate ? 
// // // // // // // // // // //         new Date(task.dueDate).toISOString().split('T')[0] :
// // // // // // // // // // //         new Date(task.date).toISOString().split('T')[0];
        
// // // // // // // // // // //       return taskDate === filters.date;
// // // // // // // // // // //     });
// // // // // // // // // // //   }

// // // // // // // // // // //   console.log('🔍 Filtered tasks:', filtered); // Debug log
// // // // // // // // // // //   setFilteredTasks(filtered);
// // // // // // // // // // // }, [tasks, filters, productivityLevel]);


// // // // // // // // // // //   // Handle adding new task
// // // // // // // // // // //   const handleAddTask = async (taskData) => {
// // // // // // // // // // //     if (!user?.id) return;

// // // // // // // // // // //     try {
// // // // // // // // // // //       setLoading(true);
// // // // // // // // // // //       setError(null);

// // // // // // // // // // //       const newTaskData = {
// // // // // // // // // // //         title: taskData.title,
// // // // // // // // // // //         description: taskData.description || '',
// // // // // // // // // // //         userId: user.id,
// // // // // // // // // // //         category: taskData.category || 'personal',
// // // // // // // // // // //         priority: taskData.priority || 'medium',
// // // // // // // // // // //         status: 'pending',
// // // // // // // // // // //         dueDate: taskData.date ? new Date(taskData.date).toISOString() : undefined,
// // // // // // // // // // //         estimatedTime: parseInt(taskData.duration) || 25,
// // // // // // // // // // //         tags: taskData.tags || [],
// // // // // // // // // // //         energy: taskData.energy || 'Medium', // For your productivity level filtering
// // // // // // // // // // //       };

// // // // // // // // // // //       let newTask;
// // // // // // // // // // //       if (createTask) {
// // // // // // // // // // //         // Use parent's createTask function if available
// // // // // // // // // // //         newTask = await createTask(newTaskData);
// // // // // // // // // // //       } else {
// // // // // // // // // // //         // Direct API call
// // // // // // // // // // //         const response = await taskApi.createTask(newTaskData);
// // // // // // // // // // //         if (response.success && response.data) {
// // // // // // // // // // //           newTask = response.data;
// // // // // // // // // // //           setTasks(prev => [newTask, ...(prev || [])]);
// // // // // // // // // // //         } else {
// // // // // // // // // // //           throw new Error(response.error || 'Failed to create task');
// // // // // // // // // // //         }
// // // // // // // // // // //       }

// // // // // // // // // // //       setIsModalOpen(false);
// // // // // // // // // // //       setEditingTask(null);
// // // // // // // // // // //       console.log('✅ Task created:', newTask.title);
// // // // // // // // // // //     } catch (err) {
// // // // // // // // // // //       console.error('❌ Error creating task:', err);
// // // // // // // // // // //       setError(err.message);
// // // // // // // // // // //     } finally {
// // // // // // // // // // //       setLoading(false);
// // // // // // // // // // //     }
// // // // // // // // // // //   };

// // // // // // // // // // //   // Handle editing task
// // // // // // // // // // //   const handleEditTask = async (taskData) => {
// // // // // // // // // // //     if (!editingTask?._id) return;

// // // // // // // // // // //     try {
// // // // // // // // // // //       setLoading(true);
// // // // // // // // // // //       setError(null);

// // // // // // // // // // //       const updatedData = {
// // // // // // // // // // //         title: taskData.title,
// // // // // // // // // // //         description: taskData.description || '',
// // // // // // // // // // //         category: taskData.category || 'personal',
// // // // // // // // // // //         priority: taskData.priority || 'medium',
// // // // // // // // // // //         dueDate: taskData.date ? new Date(taskData.date).toISOString() : undefined,
// // // // // // // // // // //         estimatedTime: parseInt(taskData.duration) || 25,
// // // // // // // // // // //         tags: taskData.tags || [],
// // // // // // // // // // //         energy: taskData.energy || 'Medium',
// // // // // // // // // // //       };

// // // // // // // // // // //       let updatedTask;
// // // // // // // // // // //       if (updateTask) {
// // // // // // // // // // //         // Use parent's updateTask function if available
// // // // // // // // // // //         updatedTask = await updateTask(editingTask._id, updatedData);
// // // // // // // // // // //       } else {
// // // // // // // // // // //         // Direct API call
// // // // // // // // // // //         const response = await taskApi.updateTask(editingTask._id, updatedData);
// // // // // // // // // // //         if (response.success && response.data) {
// // // // // // // // // // //           updatedTask = response.data;
// // // // // // // // // // //           setTasks(prev => 
// // // // // // // // // // //             (prev || []).map(task =>
// // // // // // // // // // //               task._id === editingTask._id ? updatedTask : task
// // // // // // // // // // //             )
// // // // // // // // // // //           );
// // // // // // // // // // //         } else {
// // // // // // // // // // //           throw new Error(response.error || 'Failed to update task');
// // // // // // // // // // //         }
// // // // // // // // // // //       }

// // // // // // // // // // //       setEditingTask(null);
// // // // // // // // // // //       setIsModalOpen(false);
// // // // // // // // // // //       console.log('✅ Task updated:', updatedTask.title);
// // // // // // // // // // //     } catch (err) {
// // // // // // // // // // //       console.error('❌ Error updating task:', err);
// // // // // // // // // // //       setError(err.message);
// // // // // // // // // // //     } finally {
// // // // // // // // // // //       setLoading(false);
// // // // // // // // // // //     }
// // // // // // // // // // //   };

// // // // // // // // // // //   // Handle deleting task
// // // // // // // // // // //   const handleDeleteTask = async (taskId) => {
// // // // // // // // // // //     if (!taskId) return;
    
// // // // // // // // // // //     if (!confirm('Are you sure you want to delete this task?')) return;

// // // // // // // // // // //     try {
// // // // // // // // // // //       setLoading(true);
// // // // // // // // // // //       setError(null);

// // // // // // // // // // //       if (deleteTask) {
// // // // // // // // // // //         // Use parent's deleteTask function if available
// // // // // // // // // // //         await deleteTask(taskId);
// // // // // // // // // // //       } else {
// // // // // // // // // // //         // Direct API call
// // // // // // // // // // //         const response = await taskApi.deleteTask(taskId);
// // // // // // // // // // //         if (response.success) {
// // // // // // // // // // //           setTasks(prev => (prev || []).filter(task => task._id !== taskId));
// // // // // // // // // // //         } else {
// // // // // // // // // // //           throw new Error(response.error || 'Failed to delete task');
// // // // // // // // // // //         }
// // // // // // // // // // //       }

// // // // // // // // // // //       console.log('✅ Task deleted');
// // // // // // // // // // //     } catch (err) {
// // // // // // // // // // //       console.error('❌ Error deleting task:', err);
// // // // // // // // // // //       setError(err.message);
// // // // // // // // // // //     } finally {
// // // // // // // // // // //       setLoading(false);
// // // // // // // // // // //     }
// // // // // // // // // // //   };

// // // // // // // // // // //   // Handle toggling task completion
// // // // // // // // // // //   const handleToggleComplete = async (task) => {
// // // // // // // // // // //     if (!task?._id) return;

// // // // // // // // // // //     try {
// // // // // // // // // // //       setLoading(true);
// // // // // // // // // // //       setError(null);

// // // // // // // // // // //       const newStatus = task.status === 'completed' ? 'pending' : 'completed';
// // // // // // // // // // //       const updatedData = { 
// // // // // // // // // // //         status: newStatus,
// // // // // // // // // // //         completedAt: newStatus === 'completed' ? new Date().toISOString() : null
// // // // // // // // // // //       };

// // // // // // // // // // //       if (updateTask) {
// // // // // // // // // // //         // Use parent's updateTask function if available
// // // // // // // // // // //         await updateTask(task._id, updatedData);
// // // // // // // // // // //       } else {
// // // // // // // // // // //         // Direct API call
// // // // // // // // // // //         const response = await taskApi.updateTask(task._id, updatedData);
// // // // // // // // // // //         if (response.success && response.data) {
// // // // // // // // // // //           setTasks(prev => 
// // // // // // // // // // //             (prev || []).map(t => 
// // // // // // // // // // //               t._id === task._id ? response.data : t
// // // // // // // // // // //             )
// // // // // // // // // // //           );
// // // // // // // // // // //         } else {
// // // // // // // // // // //           throw new Error(response.error || 'Failed to update task');
// // // // // // // // // // //         }
// // // // // // // // // // //       }

// // // // // // // // // // //       // Call completion handler if provided
// // // // // // // // // // //       if (newStatus === 'completed' && onTaskComplete) {
// // // // // // // // // // //         onTaskComplete(task._id, task.estimatedTime || 25);
// // // // // // // // // // //       }

// // // // // // // // // // //       console.log(`✅ Task ${newStatus}:`, task.title);
// // // // // // // // // // //     } catch (err) {
// // // // // // // // // // //       console.error('❌ Error toggling task:', err);
// // // // // // // // // // //       setError(err.message);
// // // // // // // // // // //     } finally {
// // // // // // // // // // //       setLoading(false);
// // // // // // // // // // //     }
// // // // // // // // // // //   };

// // // // // // // // // // //   // Modal handlers
// // // // // // // // // // //   const openEditModal = (task) => {
// // // // // // // // // // //     setEditingTask(task);
// // // // // // // // // // //     setIsModalOpen(true);
// // // // // // // // // // //   };

// // // // // // // // // // //   const closeModal = () => {
// // // // // // // // // // //     setIsModalOpen(false);
// // // // // // // // // // //     setEditingTask(null);
// // // // // // // // // // //   };

// // // // // // // // // // //   const openStartModal = (task) => {
// // // // // // // // // // //     setTaskToStart(task);
// // // // // // // // // // //     setIsStartModalOpen(true);
// // // // // // // // // // //   };

// // // // // // // // // // //   const closeStartModal = () => {
// // // // // // // // // // //     setIsStartModalOpen(false);
// // // // // // // // // // //     setTaskToStart(null);
// // // // // // // // // // //   };

// // // // // // // // // // //   const handleModeSelection = (mode) => {
// // // // // // // // // // //     if (onPlayTask) {
// // // // // // // // // // //       onPlayTask(mode, taskToStart);
// // // // // // // // // // //     }
// // // // // // // // // // //     closeStartModal();
// // // // // // // // // // //   };

// // // // // // // // // // //   // Calculate stats for the selected day
// // // // // // // // // // //   const tasksForDay = (tasks || []).filter(task => {
// // // // // // // // // // //     if (!task.dueDate || !filters.date) return false;
// // // // // // // // // // //     const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
// // // // // // // // // // //     const matchesDate = taskDate === filters.date;
// // // // // // // // // // //     const matchesEnergy = !productivityLevel || 
// // // // // // // // // // //       task.energy?.toLowerCase() === productivityLevel.toLowerCase();
// // // // // // // // // // //     return matchesDate && matchesEnergy;
// // // // // // // // // // //   });

// // // // // // // // // // //   const completedTasks = tasksForDay.filter(task => task.status === 'completed').length;
// // // // // // // // // // //   const totalTasks = tasksForDay.length;

// // // // // // // // // // //   // Loading state
// // // // // // // // // // //   if (loading && (!tasks || tasks.length === 0)) {
// // // // // // // // // // //     return (
// // // // // // // // // // //       <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
// // // // // // // // // // //         <div className="max-w-7xl mx-auto">
// // // // // // // // // // //           <div className="flex items-center justify-center py-16">
// // // // // // // // // // //             <div className="text-center">
// // // // // // // // // // //               <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
// // // // // // // // // // //               <p className="text-gray-600">Loading your tasks...</p>
// // // // // // // // // // //             </div>
// // // // // // // // // // //           </div>
// // // // // // // // // // //         </div>
// // // // // // // // // // //       </div>
// // // // // // // // // // //     );
// // // // // // // // // // //   }

// // // // // // // // // // //   return (
// // // // // // // // // // //     <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
// // // // // // // // // // //       <div className="max-w-7xl mx-auto">
// // // // // // // // // // //         {/* Error Display */}
// // // // // // // // // // //         {error && (
// // // // // // // // // // //           <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
// // // // // // // // // // //             <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
// // // // // // // // // // //             <div>
// // // // // // // // // // //               <p className="text-red-800 font-medium">Error</p>
// // // // // // // // // // //               <p className="text-red-600 text-sm">{error}</p>
// // // // // // // // // // //             </div>
// // // // // // // // // // //             <button
// // // // // // // // // // //               onClick={() => setError(null)}
// // // // // // // // // // //               className="ml-auto text-red-500 hover:text-red-700"
// // // // // // // // // // //             >
// // // // // // // // // // //               ×
// // // // // // // // // // //             </button>
// // // // // // // // // // //           </div>
// // // // // // // // // // //         )}

// // // // // // // // // // //         <div className="mb-8">
// // // // // // // // // // //           {/* Header */}
// // // // // // // // // // //           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
// // // // // // // // // // //             <div>
// // // // // // // // // // //               <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Task Manager</h1>
// // // // // // // // // // //               <p className="text-gray-500 mt-2">
// // // // // // // // // // //                 {format(new Date(filters.date || new Date()), 'EEEE, MMMM do, yyyy')} • 
// // // // // // // // // // //                 {completedTasks}/{totalTasks} completed
// // // // // // // // // // //               </p>
// // // // // // // // // // //               {productivityLevel && (
// // // // // // // // // // //                 <p className="text-sm text-indigo-600 mt-1">
// // // // // // // // // // //                   Filtered for {productivityLevel} energy tasks
// // // // // // // // // // //                 </p>
// // // // // // // // // // //               )}
// // // // // // // // // // //             </div>
// // // // // // // // // // //             <motion.button 
// // // // // // // // // // //               whileHover={{ scale: 1.05 }} 
// // // // // // // // // // //               whileTap={{ scale: 0.95 }} 
// // // // // // // // // // //               onClick={() => setIsModalOpen(true)} 
// // // // // // // // // // //               disabled={loading}
// // // // // // // // // // //               className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-medium flex items-center space-x-2 shadow-md w-full sm:w-auto justify-center"
// // // // // // // // // // //             >
// // // // // // // // // // //               {loading ? (
// // // // // // // // // // //                 <Loader2 className="w-5 h-5 animate-spin" />
// // // // // // // // // // //               ) : (
// // // // // // // // // // //                 <Plus className="w-5 h-5" />
// // // // // // // // // // //               )}
// // // // // // // // // // //               <span>{loading ? 'Loading...' : 'Add Task'}</span>
// // // // // // // // // // //             </motion.button>
// // // // // // // // // // //           </div>

// // // // // // // // // // //           {/* Filters */}
// // // // // // // // // // //           <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
// // // // // // // // // // //             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// // // // // // // // // // //               <div className="relative">
// // // // // // // // // // //                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
// // // // // // // // // // //                 <input 
// // // // // // // // // // //                   type="text" 
// // // // // // // // // // //                   placeholder="Search tasks..." 
// // // // // // // // // // //                   value={filters.search} 
// // // // // // // // // // //                   onChange={(e) => setFilters({...filters, search: e.target.value})} 
// // // // // // // // // // //                   className="w-full bg-gray-100 border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
// // // // // // // // // // //                 />
// // // // // // // // // // //               </div>
// // // // // // // // // // //               <select 
// // // // // // // // // // //                 value={filters.status} 
// // // // // // // // // // //                 onChange={(e) => setFilters({...filters, status: e.target.value})} 
// // // // // // // // // // //                 className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
// // // // // // // // // // //               >
// // // // // // // // // // //                 <option value="all">All Tasks</option>
// // // // // // // // // // //                 <option value="pending">Pending</option>
// // // // // // // // // // //                 <option value="completed">Completed</option>
// // // // // // // // // // //               </select>
// // // // // // // // // // //               <input 
// // // // // // // // // // //                 type="date" 
// // // // // // // // // // //                 value={filters.date || ''} 
// // // // // // // // // // //                 onChange={(e) => setFilters({...filters, date: e.target.value})} 
// // // // // // // // // // //                 className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
// // // // // // // // // // //               />
// // // // // // // // // // //             </div>
// // // // // // // // // // //           </div>
// // // // // // // // // // //         </div>

// // // // // // // // // // //         {/* Tasks Grid */}
// // // // // // // // // // //         <AnimatePresence>
// // // // // // // // // // //   {filteredTasks.length === 0 ? (
// // // // // // // // // // //     <motion.div
// // // // // // // // // // //       initial={{ opacity: 0 }}
// // // // // // // // // // //       animate={{ opacity: 1 }}
// // // // // // // // // // //       className="text-center py-8"
// // // // // // // // // // //     >
// // // // // // // // // // //       <p className="text-gray-600">No tasks found for this criteria.</p>
// // // // // // // // // // //     </motion.div>
// // // // // // // // // // //   ) : (
// // // // // // // // // // //     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
// // // // // // // // // // //       {filteredTasks.map((task, idx) => (
// // // // // // // // // // //         <TaskCard
// // // // // // // // // // //           key={task._id}
// // // // // // // // // // //           task={task}
// // // // // // // // // // //           index={idx}
// // // // // // // // // // //           onStart={() => onPlayTask(task)} // Or your handler
// // // // // // // // // // //           onEdit={() => openEditModal(task)}
// // // // // // // // // // //           onDelete={() => handleDeleteTask(task._id)}
// // // // // // // // // // //           onToggleComplete={() => handleToggleComplete(task)}
// // // // // // // // // // //         />
// // // // // // // // // // //       ))}
// // // // // // // // // // //     </div>
// // // // // // // // // // //   )}
// // // // // // // // // // // </AnimatePresence>

// // // // // // // // // // //         {/* Modals */}
// // // // // // // // // // //         <TaskModal 
// // // // // // // // // // //           isOpen={isModalOpen} 
// // // // // // // // // // //           onClose={closeModal} 
// // // // // // // // // // //           onSubmit={editingTask ? handleEditTask : handleAddTask} 
// // // // // // // // // // //           editingTask={editingTask}
// // // // // // // // // // //         />
// // // // // // // // // // //         <StartTaskModal 
// // // // // // // // // // //           isOpen={isStartModalOpen} 
// // // // // // // // // // //           onClose={closeStartModal} 
// // // // // // // // // // //           onSelectMode={handleModeSelection}
// // // // // // // // // // //         />
// // // // // // // // // // //       </div>
// // // // // // // // // // //     </div>
// // // // // // // // // // //   );
// // // // // // // // // // // }
