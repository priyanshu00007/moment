// components/DebugDataPage.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export default function DebugDataPage() {
  const { user } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/v1/debug/all-data/${user.id}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!data) return <div className="p-8">No data</div>;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Debug Data</h1>
      
      {/* Stats */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.stats.totalTasks}</div>
            <div className="text-sm text-gray-500">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.stats.completedTasks}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{data.stats.totalSessions}</div>
            <div className="text-sm text-gray-500">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{data.stats.totalFocusHours}h</div>
            <div className="text-sm text-gray-500">Focus Time</div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Tasks ({data.tasks.length})</h2>
        <div className="space-y-2">
          {data.tasks.map((task, index) => (
            <div key={task._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">{task.title}</div>
                <div className="text-sm text-gray-500">{task.description}</div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${
                  task.status === 'completed' ? 'text-green-600' : 
                  task.status === 'in-progress' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {task.status}
                </div>
                <div className="text-xs text-gray-400">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sessions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Pomodoro Sessions ({data.sessions.length})</h2>
        <div className="space-y-2">
          {data.sessions.map((session, index) => (
            <div key={session._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">{Math.round(session.duration / 60)} minutes</div>
                <div className="text-sm text-gray-500">
                  {new Date(session.startedAt).toLocaleString()} - 
                  {new Date(session.endedAt).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-600">Focus Session</div>
                <div className="text-xs text-gray-400">
                  {new Date(session.startedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
