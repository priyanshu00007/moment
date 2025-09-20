// hooks/useTasks.js
import { useState, useEffect, useCallback } from 'react';
import { taskApi, taskUtils } from '@/lib/api';
import { toast } from 'react-hot-toast';

export const useTasks = (userId = 'user123') => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = { userId };
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.category !== 'all') params.category = filters.category;
      
      const response = await taskApi.getTasks(params);
      
      if (response.success) {
        let filteredTasks = response.data || [];
        
        // Apply client-side filters
        if (filters.priority !== 'all') {
          filteredTasks = filteredTasks.filter(t => t.priority === filters.priority);
        }
        
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredTasks = filteredTasks.filter(t => 
            t.title.toLowerCase().includes(searchLower) ||
            t.description?.toLowerCase().includes(searchLower)
          );
        }
        
        // Apply sorting
        const sortedTasks = taskUtils.sortTasks(filteredTasks, sortBy, sortOrder);
        setTasks(sortedTasks);
      } else {
        throw new Error(response.error || 'Failed to fetch tasks');
      }
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [userId, filters, sortBy, sortOrder]);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // CRUD operations
  const createTask = async (taskData) => {
    try {
      const response = await taskApi.createTask({
        ...taskData,
        userId,
        status: 'pending',
        progress: { percentage: 0 },
        workedSeconds: 0,
        createdAt: new Date().toISOString()
      });
      
      if (response.success) {
        await fetchTasks(); // Refresh list
        toast.success('Task created successfully!');
        return response.data;
      }
    } catch (err) {
      toast.error('Failed to create task');
      throw err;
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const response = await taskApi.updateTask(taskId, updates);
      
      if (response.success) {
        await fetchTasks(); // Refresh list
        toast.success('Task updated successfully!');
        return response.data;
      }
    } catch (err) {
      toast.error('Failed to update task');
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const response = await taskApi.deleteTask(taskId);
      
      if (response.success) {
        setTasks(prev => prev.filter(t => t._id !== taskId));
        toast.success('Task deleted successfully!');
        return true;
      }
    } catch (err) {
              toast.error('Failed to delete task');
      throw err;
    }
  };

  const toggleTaskComplete = async (taskId) => {
    try {
      const task = tasks.find(t => t._id === taskId);
      if (!task) throw new Error('Task not found');

      if (task.status === 'completed') {
        // Reopen task
        const response = await taskApi.updateTask(taskId, {
          status: 'pending',
          completedAt: null,
          progress: { percentage: task.progress?.percentage || 0 }
        });
        
        if (response.success) {
          await fetchTasks();
          toast.success('Task reopened!');
          return response.data;
        }
      } else {
        // Complete task
        const response = await taskApi.completeTask(taskId);
        
        if (response.success) {
          await fetchTasks();
          toast.success('Task completed! 🎉');
          return response.data;
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update task status');
      throw err;
    }
  };

  const updateTaskProgress = async (taskId, workedSeconds) => {
    try {
      const response = await taskApi.updateTaskProgress(taskId, workedSeconds);
      
      if (response.success) {
        setTasks(prev => prev.map(t => 
          t._id === taskId ? response.data : t
        ));
        return response.data;
      }
    } catch (err) {
      console.error('Failed to update task progress:', err);
      // Don't show toast for progress updates to avoid spam
    }
  };

  // Batch operations
  const batchDelete = async (taskIds) => {
    try {
      const promises = taskIds.map(id => taskApi.deleteTask(id));
      await Promise.all(promises);
      
      setTasks(prev => prev.filter(t => !taskIds.includes(t._id)));
      toast.success(`${taskIds.length} tasks deleted successfully!`);
    } catch (err) {
      toast.error('Failed to delete some tasks');
      throw err;
    }
  };

  const batchComplete = async (taskIds) => {
    try {
      const updates = {
        status: 'completed',
        completedAt: new Date().toISOString(),
        progress: { percentage: 100 }
      };
      
      const response = await taskApi.batchUpdateTasks(taskIds, updates);
      
      if (response.success) {
        await fetchTasks();
        toast.success(`${taskIds.length} tasks completed! 🎉`);
      }
    } catch (err) {
      toast.error('Failed to complete some tasks');
      throw err;
    }
  };

  // Get computed values
  const statistics = taskUtils.getTaskStatistics(tasks);
  const overdueTasks = taskUtils.getOverdueTasks(tasks);
  const todaysTasks = taskUtils.getTodaysTasks(tasks);
  const upcomingTasks = taskUtils.getUpcomingTasks(tasks);

  return {
    // State
    tasks,
    loading,
    error,
    filters,
    sortBy,
    sortOrder,
    
    // Computed
    statistics,
    overdueTasks,
    todaysTasks,
    upcomingTasks,
    
    // Actions
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    updateTaskProgress,
    batchDelete,
    batchComplete,
    
    // Setters
    setFilters,
    setSortBy,
    setSortOrder
  };
};