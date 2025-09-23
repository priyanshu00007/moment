"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { LogIn, Loader2 } from 'lucide-react';
import { taskApi, generateUserDataFromTasks } from '@/backend/lib/api';
import { SignInButton } from '@clerk/nextjs';
import Sidebar from '@/app/components/Sidebar';
import DashboardContent from "../app/components/DashboardContent";
import FocusModeContent from '../app/components/FocusModeContent';
import PomodoroContent from '../app/components/PomodoroContent';
import TasksPage from '../app/components/TasksPage';
import SettingsContent from '../app/components/SettingsContent';
import ProfileContent from '../app/components/ProfileContent';
import AIAssistantContent from '../app/components/AIAssistantContent';
import ProductivityModal from '../app/components/ProductivityModal';
import WelcomeModal from '../app/components/WelcomeModal';
import GoalTracker from "../app/components/GoalTracker";

// FirstPage / WelcomeSignIn Component
function FirstPage() {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Starfield */}
      <div aria-hidden="true" className="absolute inset-0">
        <div className="starfield starfield1"></div>
        <div className="starfield starfield2"></div>
        <div className="starfield starfield3"></div>
      </div>

      <div className="relative z-10 text-center text-white px-6 max-w-md">
        <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg">
          Welcome to Focus App
        </h1>
        <p className="text-2xl mb-8 drop-shadow-md">
          Please sign in to continue
        </p>
        <SignInButton mode="modal">
          <button className="inline-flex items-center space-x-3 bg-white text-gray-900 px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-gray-100 transition-colors active:scale-95 transform">
            <LogIn className="w-6 h-6" />
            <span>Sign In</span>
          </button>
        </SignInButton>
      </div>

      <style jsx>{`
        .starfield {
          position: absolute;
          top: 0;
          left: 0;
          width: 200vw; 
          height: 200vh; 
          background: transparent;
          overflow: hidden;
          pointer-events: none;
        }
        .starfield::after {
          content: "";
          position: absolute;
          width: 3px;
          height: 3px;
          background: white;
          border-radius: 50%;
          box-shadow:
            10vw 15vh white,
            20vw 80vh white,
            35vw 25vh white,
            45vw 60vh white,
            70vw 40vh white,
            80vw 85vh white,
            95vw 60vh white,
            110vw 20vh white,
            130vw 10vh white,
            140vw 70vh white,
            160vw 50vh white,
            170vw 80vh white,
            190vw 20vh white;
          animation: twinkle 5s linear infinite alternate;
          opacity: 0.8;
          will-change: opacity;
        }
        .starfield1::after { animation-delay: 0s; }
        .starfield2::after {
          animation-delay: 2s;
          box-shadow:
            15vw 10vh white,
            30vw 75vh white,
            50vw 22vh white,
            60vw 55vh white,
            75vw 35vh white,
            85vw 90vh white,
            105vw 65vh white,
            120vw 25vh white,
            135vw 15vh white,
            155vw 75vh white,
            170vw 60vh white,
            180vw 85vh white,
            200vw 30vh white;
        }
        .starfield3::after {
          animation-delay: 4s;
          box-shadow:
            12vw 18vh white,
            25vw 77vh white,
            40vw 30vh white,
            55vw 65vh white,
            65vw 40vh white,
            90vw 88vh white,
            112vw 68vh white,
            125vw 22vh white,
            145vw 12vh white,
            165vw 72vh white,
            185vw 55vh white,
            195vw 78vh white,
            210vw 33vh white;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3 }
          50% { opacity: 1 }
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  const { user, isLoaded } = useUser();

  const [activeSection, setActiveSection] = useState('tasks');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [userData, setUserData] = useState(null);
  const [productivityLevel, setProductivityLevel] = useState(null);
  const [showProductivityModal, setShowProductivityModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const defaultUserData = {
    name: user?.firstName || user?.fullName || 'User',
    userId: user?.id || '',
    totalTasksCompleted: 0,
    totalFocusTime: 0,
    totalPomodoroSessions: 0,
    currentStreak: 0,
    xp: 0,
    level: 1,
    dailyStats: [],
    history: [],
  };

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    const key = `focus-app-productivity-${user.id}`;
    const storedProductivity = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (storedProductivity) {
      setProductivityLevel(storedProductivity);
      setShowProductivityModal(false);
    } else {
      setShowProductivityModal(true);
    }
    fetchTasksFromBackend();
  }, [isLoaded, user?.id]);

  useEffect(() => {
    if (typeof window !== 'undefined' && productivityLevel && user?.id) {
      localStorage.setItem(`focus-app-productivity-${user.id}`, productivityLevel);
    }
  }, [productivityLevel, user?.id]);

  const handleSetProductivity = (level) => {
    if (!level) return;
    setProductivityLevel(level);
    setShowProductivityModal(false);
  };

  const fetchTasksFromBackend = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const response = await taskApi.getTasks({ userId: user.id });
      if (response.success) {
        const backendTasks = response.data || [];
        setTasks(backendTasks.map(t => ({ ...t, completed: t.status === 'completed' })));
        setUserData(generateUserDataFromTasks(backendTasks, user.id, user.fullName || 'User'));
        localStorage.setItem(`focus-app-tasks-${user.id}`, JSON.stringify(backendTasks));
      } else {
        throw new Error(response.message || 'Failed to fetch tasks');
      }
    } catch (err) {
      const fallbackTasks = localStorage.getItem(`focus-app-tasks-${user.id}`);
      if (fallbackTasks) setTasks(JSON.parse(fallbackTasks));
      setError('Could not sync with backend.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  // Render FirstPage if user is not logged in
  if (!user) return <FirstPage />;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      <Sidebar
        activeSection={activeSection}
        handleSectionChange={setActiveSection}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        userData={userData}
      />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          {showProductivityModal ? (
            <ProductivityModal
              isOpen={true}
              onSubmit={handleSetProductivity}
            />
          ) : (
            <>
              {activeSection === 'dashboard' && <DashboardContent tasks={tasks} userData={userData} user={user} refreshData={fetchTasksFromBackend} />}
              {activeSection === 'focus' && <FocusModeContent tasks={tasks} userData={userData} user={user} activeTask={activeTask} setTasks={setTasks} setUserData={setUserData} onTaskComplete={fetchTasksFromBackend} />}
              {activeSection === 'pomodoro' && <PomodoroContent tasks={tasks} userData={userData} user={user} activeTask={activeTask} setTasks={setTasks} setUserData={setUserData} onTaskComplete={fetchTasksFromBackend} />}
              {activeSection === 'tasks' && <TasksPage tasks={tasks} userData={userData} user={user} setTasks={setTasks} productivityLevel={productivityLevel} setUserData={setUserData} onTaskComplete={fetchTasksFromBackend} />}
              {activeSection === 'goals' && <GoalTracker userId={user?.id} />}
              {activeSection === 'settings' && <SettingsContent user={user} userData={userData} setUserData={setUserData} productivityLevel={productivityLevel} setProductivityLevel={setProductivityLevel} />}
              {activeSection === 'profile' && <ProfileContent user={user} userData={userData} setUserData={setUserData} setTasks={setTasks} setProductivityLevel={setProductivityLevel} productivityLevel={productivityLevel} />}
              {activeSection === 'ai' && <AIAssistantContent user={user} userData={userData} tasks={tasks} refreshData={fetchTasksFromBackend} />}
            </>
          )}
          <WelcomeModal isOpen={showWelcomeModal} onSubmit={setUserData} />
        </div>
      </main>
    </div>
  );
}

// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useUser } from '@clerk/nextjs';
// import { LogIn, Loader2 } from 'lucide-react';
// import { taskApi, generateUserDataFromTasks } from '@/backend/lib/api';
// import { SignInButton } from '@clerk/nextjs';
// import Sidebar from '@/app/components/Sidebar';
// import DashboardContent from "../app/components/DashboardContent";
// import FocusModeContent from '../app/components/FocusModeContent';
// import PomodoroContent from '../app/components/PomodoroContent';
// import TasksPage from '../app/components/TasksPage';
// import SettingsContent from '../app/components/SettingsContent';
// import ProfileContent from '../app/components/ProfileContent';
// import AIAssistantContent from '../app/components/AIAssistantContent';
// import ProductivityModal from '../app/components/ProductivityModal';
// import WelcomeModal from '../app/components/WelcomeModal';
// import GoalTracker from "../app/components/GoalTracker"; // <--- Add this import

// export default function Home() {
//   const { user, isLoaded } = useUser();

//   const [activeSection, setActiveSection] = useState('tasks');
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [activeTask, setActiveTask] = useState(null);
//   const [tasks, setTasks] = useState([]);
//   const [userData, setUserData] = useState(null);
//   const [productivityLevel, setProductivityLevel] = useState(null);
//   const [showProductivityModal, setShowProductivityModal] = useState(false);
//   const [showWelcomeModal, setShowWelcomeModal] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const defaultUserData = {
//     name: user?.firstName || user?.fullName || 'User',
//     userId: user?.id || '',
//     totalTasksCompleted: 0,
//     totalFocusTime: 0,
//     totalPomodoroSessions: 0,
//     currentStreak: 0,
//     xp: 0,
//     level: 1,
//     dailyStats: [],
//     history: [],
//   };

//   useEffect(() => {
//     if (!isLoaded || !user?.id) return;
//     const key = `focus-app-productivity-${user.id}`;
//     const storedProductivity = typeof window !== "undefined" ? localStorage.getItem(key) : null;
//     if (storedProductivity) {
//       setProductivityLevel(storedProductivity);
//       setShowProductivityModal(false);
//     } else {
//       setShowProductivityModal(true);
//     }
//     fetchTasksFromBackend();
//   }, [isLoaded, user?.id]);

//   useEffect(() => {
//     if (typeof window !== 'undefined' && productivityLevel && user?.id) {
//       localStorage.setItem(`focus-app-productivity-${user.id}`, productivityLevel);
//     }
//   }, [productivityLevel, user?.id]);

//   const handleSetProductivity = (level) => {
//     if (!level) return;
//     setProductivityLevel(level);
//     setShowProductivityModal(false);
//   };

//   const fetchTasksFromBackend = async () => {
//     if (!user?.id) return;
//     try {
//       setIsLoading(true);
//       const response = await taskApi.getTasks({ userId: user.id });
//       if (response.success) {
//         const backendTasks = response.data || [];
//         setTasks(backendTasks.map(t => ({ ...t, completed: t.status === 'completed' })));
//         setUserData(generateUserDataFromTasks(backendTasks, user.id, user.fullName || 'User'));
//         localStorage.setItem(`focus-app-tasks-${user.id}`, JSON.stringify(backendTasks));
//       } else {
//         throw new Error(response.message || 'Failed to fetch tasks');
//       }
//     } catch (err) {
//       const fallbackTasks = localStorage.getItem(`focus-app-tasks-${user.id}`);
//       if (fallbackTasks) setTasks(JSON.parse(fallbackTasks));
//       setError('Could not sync with backend.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (!isLoaded || isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="text-center">
//           <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
//           <p className="text-gray-600">Loading your workspace...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="text-center max-w-md mx-auto p-6">
//           <div className="bg-red-50 border border-red-200 rounded-xl p-6">
//             <h2 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h2>
//             <p className="text-red-600 mb-4">{error}</p>
//             <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">Retry</button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700">
//         <div className="text-center text-white">
//           <h1 className="text-4xl font-bold mb-4">Welcome to Focus App</h1>
//           <p className="text-xl">Please sign in to continue</p>
//           <SignInButton mode="modal">
//             <button className="flex items-center space-x-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">
//               <LogIn className="h-5 w-5" />
//               <span>Sign In</span>
//             </button>
//           </SignInButton>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col md:flex-row h-screen bg-gray-100">
//       <Sidebar
//         activeSection={activeSection}
//         handleSectionChange={setActiveSection}
//         isSidebarOpen={isSidebarOpen}
//         setIsSidebarOpen={setIsSidebarOpen}
//         userData={userData}
//       />
//       <main className="flex-1 flex flex-col overflow-y-auto">
//         <div className="p-4 sm:p-6 lg:p-8">
//           {showProductivityModal ? (
//             <ProductivityModal
//               isOpen={true}
//               onSubmit={handleSetProductivity}
//             />
//           ) : (
//             <>
//               {activeSection === 'dashboard' && <DashboardContent tasks={tasks} userData={userData} user={user} refreshData={fetchTasksFromBackend} />}
//               {activeSection === 'focus' && <FocusModeContent tasks={tasks} userData={userData} user={user} activeTask={activeTask} setTasks={setTasks} setUserData={setUserData} onTaskComplete={fetchTasksFromBackend} />}
//               {activeSection === 'pomodoro' && <PomodoroContent tasks={tasks} userData={userData} user={user} activeTask={activeTask} setTasks={setTasks} setUserData={setUserData} onTaskComplete={fetchTasksFromBackend} />}
//               {activeSection === 'tasks' && <TasksPage tasks={tasks} userData={userData} user={user} setTasks={setTasks} productivityLevel={productivityLevel} setUserData={setUserData} onTaskComplete={fetchTasksFromBackend} />}
//               {activeSection === 'goals' && <GoalTracker userId={user?.id} />} {/* <-- ADD GOALS SECTION */}
//               {activeSection === 'settings' && <SettingsContent user={user} userData={userData} setUserData={setUserData} productivityLevel={productivityLevel} setProductivityLevel={setProductivityLevel} />}
//               {activeSection === 'profile' && <ProfileContent user={user} userData={userData} setUserData={setUserData} setTasks={setTasks} setProductivityLevel={setProductivityLevel} productivityLevel={productivityLevel} />}
//               {activeSection === 'ai' && <AIAssistantContent user={user} userData={userData} tasks={tasks} refreshData={fetchTasksFromBackend} />}
//             </>
//           )}
//           <WelcomeModal isOpen={showWelcomeModal} onSubmit={setUserData} />
//         </div>
//       </main>
//     </div>
//   );
// }

// 'use client';
// import React, { useState, useEffect } from 'react';
// import { useUser } from '@clerk/nextjs';
// import { LogIn, Menu, X, Loader2 } from 'lucide-react';
// import { taskApi, generateUserDataFromTasks } from '@/backend/lib/api';
// import { SignInButton } from '@clerk/nextjs';
// import Sidebar from '@/app/components/Sidebar';
// import DashboardContent from "../app/components/DashboardContent";
// import FocusModeContent from '../app/components/FocusModeContent';
// import PomodoroContent from '../app/components/PomodoroContent';
// import TasksPage from '../app/components/TasksPage';
// import SettingsContent from '../app/components/SettingsContent';
// import ProfileContent from '../app/components/ProfileContent';
// import AIAssistantContent from '../app/components/AIAssistantContent';
// import ProductivityModal from '../app/components/ProductivityModal';
// import WelcomeModal from '../app/components/WelcomeModal';

// export default function Home() {
//   const { user, isLoaded } = useUser();

//   // UI & Data State
//   const [activeSection, setActiveSection] = useState('tasks');
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [activeTask, setActiveTask] = useState(null);
//   const [tasks, setTasks] = useState([]);
//   const [userData, setUserData] = useState(null);
//   const [productivityLevel, setProductivityLevel] = useState(null);
//   const [showProductivityModal, setShowProductivityModal] = useState(false);
//   const [showWelcomeModal, setShowWelcomeModal] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Default user data for new users or fallback
//   const defaultUserData = {
//     name: user?.firstName || user?.fullName || 'User',
//     userId: user?.id || '',
//     totalTasksCompleted: 0,
//     totalFocusTime: 0,
//     totalPomodoroSessions: 0,
//     currentStreak: 0,
//     xp: 0,
//     level: 1,
//     dailyStats: [],
//     history: [],
//   };

//   // Read productivity level on client only, once user loaded  
//   useEffect(() => {
//     if (!isLoaded || !user?.id) return;
//     const key = `focus-app-productivity-${user.id}`;
//     const storedProductivity = typeof window !== "undefined" ? localStorage.getItem(key) : null;
//     if (storedProductivity) {
//       setProductivityLevel(storedProductivity);
//       setShowProductivityModal(false);
//     } else {
//       setShowProductivityModal(true);
//     }
//     fetchTasksFromBackend();
//     // eslint-disable-next-line
//   }, [isLoaded, user?.id]);

//   // Persist productivity on changes
//   useEffect(() => {
//     if (typeof window !== 'undefined' && productivityLevel && user?.id) {
//       localStorage.setItem(`focus-app-productivity-${user.id}`, productivityLevel);
//     }
//   }, [productivityLevel, user?.id]);

//   // Handle productivity modal
//   const handleSetProductivity = (level) => {
//     if (!level) return;
//     setProductivityLevel(level);
//     setShowProductivityModal(false);
//   };

//   // Fetch tasks
//   const fetchTasksFromBackend = async () => {
//     if (!user?.id) return;
//     try {
//       setIsLoading(true);
//       const response = await taskApi.getTasks({ userId: user.id });
//       if (response.success) {
//         const backendTasks = response.data || [];
//         setTasks(backendTasks.map(t => ({ ...t, completed: t.status === 'completed' })));
//         setUserData(generateUserDataFromTasks(backendTasks, user.id, user.fullName || 'User'));
//         localStorage.setItem(`focus-app-tasks-${user.id}`, JSON.stringify(backendTasks));
//       } else {
//         throw new Error(response.message || 'Failed to fetch tasks');
//       }
//     } catch (err) {
//       const fallbackTasks = localStorage.getItem(`focus-app-tasks-${user.id}`);
//       if (fallbackTasks) setTasks(JSON.parse(fallbackTasks));
//       setError('Could not sync with backend.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Loading
//   if (!isLoaded || isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="text-center">
//           <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
//           <p className="text-gray-600">Loading your workspace...</p>
//         </div>
//       </div>
//     );
//   }

//   // Error
//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="text-center max-w-md mx-auto p-6">
//           <div className="bg-red-50 border border-red-200 rounded-xl p-6">
//             <h2 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h2>
//             <p className="text-red-600 mb-4">{error}</p>
//             <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">Retry</button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Not authenticated
//   if (!user) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700">
//         <div className="text-center text-white">
//           <h1 className="text-4xl font-bold mb-4">Welcome to Focus App</h1>
//           <p className="text-xl">Please sign in to continue</p>
//           <SignInButton mode="modal">
//             <button className="flex items-center space-x-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">
//               <LogIn className="h-5 w-5" />
//               <span>Sign In</span>
//             </button>
//           </SignInButton>
//         </div>
//       </div>
//     );
//   }

//   // Main page content (always render UI, gate only task/sections as required)
//   return (
//     <div className="flex flex-col md:flex-row h-screen bg-gray-100">
//       {/* Sidebar */}
//       <Sidebar
//         activeSection={activeSection}
//         handleSectionChange={setActiveSection}
//         isSidebarOpen={isSidebarOpen}
//         setIsSidebarOpen={setIsSidebarOpen}
//         userData={userData}
//       />
//       {/* Main Content */}
//       <main className="flex-1 flex flex-col overflow-y-auto">
//         <div className="p-4 sm:p-6 lg:p-8">
//           {showProductivityModal ? (
//             <ProductivityModal
//               isOpen={true}
//               onSubmit={handleSetProductivity}
//             />
//           ) : (
//             <>
//               {activeSection === 'dashboard' && <DashboardContent tasks={tasks} userData={userData} user={user} refreshData={fetchTasksFromBackend} />}
//               {activeSection === 'focus' && <FocusModeContent tasks={tasks} userData={userData} user={user} activeTask={activeTask} setTasks={setTasks} setUserData={setUserData} onTaskComplete={fetchTasksFromBackend} />}
//               {activeSection === 'pomodoro' && <PomodoroContent tasks={tasks} userData={userData} user={user} activeTask={activeTask} setTasks={setTasks} setUserData={setUserData} onTaskComplete={fetchTasksFromBackend} />}
//               {activeSection === 'tasks' && <TasksPage tasks={tasks} userData={userData} user={user} setTasks={setTasks} productivityLevel={productivityLevel} setUserData={setUserData} onTaskComplete={fetchTasksFromBackend} />}
//               {activeSection === 'settings' && <SettingsContent user={user} userData={userData} setUserData={setUserData} productivityLevel={productivityLevel} setProductivityLevel={setProductivityLevel} />}
//               {activeSection === 'profile' && <ProfileContent user={user} userData={userData} setUserData={setUserData} setTasks={setTasks} setProductivityLevel={setProductivityLevel} productivityLevel={productivityLevel} />}
//               {activeSection === 'ai' && <AIAssistantContent user={user} userData={userData} tasks={tasks} refreshData={fetchTasksFromBackend} />}
//             </>
//           )}
//           <WelcomeModal isOpen={showWelcomeModal} onSubmit={setUserData} />
//         </div>
//       </main>
//     </div>
//   );
// }


// // 'use client';
// // import React, { useState, useEffect } from 'react';
// // import { useUser } from '@clerk/nextjs';
// // import { LogIn } from 'lucide-react';
// // import { Menu, X, Loader2 } from 'lucide-react';
// // import { format, subDays } from 'date-fns';
// // import { taskApi, generateUserDataFromTasks } from '@/backend/lib/api';
// // import { SignInButton } from '@clerk/nextjs';

// // // Import all the components
// // import Sidebar from '@/app/components/Sidebar';
// // import DashboardContent from "../app/components/DashboardContent";
// // import FocusModeContent from '../app/components/FocusModeContent';
// // import PomodoroContent from '../app/components/PomodoroContent';
// // import TasksPage from '../app/components/TasksPage';
// // import SettingsContent from '../app/components/SettingsContent';
// // import ProfileContent from '../app/components/ProfileContent';
// // import AIAssistantContent from '../app/components/AIAssistantContent';
// // import ProductivityModal from '../app/components/ProductivityModal';
// // import WelcomeModal from '../app/components/WelcomeModal';

// // export default function Home() {
// //   // Clerk user authentication
// //   const { user, isLoaded } = useUser();

// //   // UI State
// //   const [activeSection, setActiveSection] = useState('tasks');
// //   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
// //   const [activeTask, setActiveTask] = useState(null);
  
// //   // Data State
// //   const [tasks, setTasks] = useState([]);
// //   const [productivityLevel, setProductivityLevel] = useState(null);
// //   const [userData, setUserData] = useState(null);
  
// //   // Modal State
// //   const [showProductivityModal, setShowProductivityModal] = useState(false);
// //   const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
// //   // Loading State
// //   const [isLoading, setIsLoading] = useState(true);
// //   const [error, setError] = useState(null);

// //   // Default user data for new users or fallback
// //   const defaultUserData = {
// //     name: user?.firstName || user?.fullName || 'User',
// //     userId: user?.id || '',
// //     totalTasksCompleted: 0,
// //     totalFocusTime: 0,
// //     totalPomodoroSessions: 0,
// //     currentStreak: 0,
// //     xp: 0,
// //     level: 1,
// //     dailyStats: [],
// //     history: [],
// //   };

// //   // Initialize data when component mounts and user is loaded
// //   useEffect(() => {
// //   if (!isLoaded || !user?.id) return;

// //   const initializeApp = async () => {
// //     try {
// //       setIsLoading(true);

// //       const userProductivityKey = `focus-app-productivity-${user.id}`;
// //       const storedProductivity = localStorage.getItem(userProductivityKey);

// //       // Show Productivity Modal if not set
// //       if (!storedProductivity) {
// //         setShowProductivityModal(true);
// //       } else {
// //         setProductivityLevel(storedProductivity);
// //       }

// //       // Fetch tasks and generate user data
// //       await fetchTasksFromBackend();

// //     } catch (error) {
// //       console.error('Error initializing app:', error);
// //       setUserData(defaultUserData);
// //       setTasks([]);
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };

// //   initializeApp();
// // }, [isLoaded, user?.id]);

// //   // Fetch tasks from backend and generate user data
// //   const fetchTasksFromBackend = async () => {
// //     if (!user?.id) return;

// //     try {
// //       const response = await taskApi.getTasks({ userId: user.id });
      
// //       if (response.success) {
// //         const backendTasks = response.data || [];
        
// //         // Convert backend task format to your local format for compatibility
// //         const convertedTasks = backendTasks.map(task => ({
// //           id: task._id,
// //           _id: task._id,
// //           title: task.title,
// //           description: task.description,
// //           category: task.category,
// //           priority: task.priority,
// //           status: task.status,
// //           dueDate: task.dueDate,
// //           estimatedTime: task.estimatedTime,
// //           actualTime: task.actualTime,
// //           progress: task.progress,
// //           tags: task.tags,
// //           completed: task.status === 'completed',
// //           completedAt: task.completedAt,
// //           createdAt: task.createdAt,
// //           updatedAt: task.updatedAt,
// //           userId: task.userId
// //         }));

// //         setTasks(convertedTasks);

// //         // Generate user data from tasks
// //         const generatedUserData = generateUserDataFromTasks(
// //           backendTasks,
// //           user.id,
// //           user.firstName || user.fullName || 'User'
// //         );

// //         setUserData(generatedUserData);

// //         // Also save to localStorage as backup
// //         localStorage.setItem(`focus-app-tasks-${user.id}`, JSON.stringify(convertedTasks));
// //         localStorage.setItem(`focus-app-user-${user.id}`, JSON.stringify(generatedUserData));
        
// //       } else {
// //         throw new Error(response.message || 'Failed to fetch tasks');
// //       }
// //     } catch (error) {
// //       console.error('Error fetching tasks from backend:', error);
      
// //       // Try to load from localStorage as fallback
// //       const fallbackTasks = localStorage.getItem(`focus-app-tasks-${user.id}`);
// //       const fallbackUserData = localStorage.getItem(`focus-app-user-${user.id}`);
      
// //       if (fallbackTasks && fallbackUserData) {
// //         setTasks(JSON.parse(fallbackTasks));
// //         setUserData(JSON.parse(fallbackUserData));
// //       } else {
// //         setTasks([]);
// //         setUserData(defaultUserData);
// //       }
      
// //       throw error;
// //     }
// //   };

// //   // Save productivity level
// //   useEffect(() => {
// //     if (typeof window !== 'undefined' && productivityLevel && user?.id) {
// //       localStorage.setItem(`focus-app-productivity-${user.id}`, productivityLevel);
// //     }
// //   }, [productivityLevel, user?.id]);

// //   const handleSectionChange = (section, task = null) => {
// //     setActiveSection(section);
// //     setActiveTask(task);
// //     setIsSidebarOpen(false);
// //   };
  
// //   const handleSetProductivity = (level) => {
// //     setProductivityLevel(level);
// //     setShowProductivityModal(false);
// //   };
  
// //   const handleSetUserInfo = (info) => {
// //     const newUser = {
// //       ...defaultUserData,
// //       ...info,
// //     };
// //     setUserData(newUser);
// //     setShowWelcomeModal(false);
// //     setShowProductivityModal(true);
// //   };

// //   const handleTaskCompletion = async (taskId, duration) => {
// //     try {
// //       // Find the task (handle both id formats)
// //       const task = tasks.find(t => t.id === taskId || t._id === taskId);
// //       const backendTaskId = task?._id || taskId;

// //       // Complete task in backend
// //       if (backendTaskId) {
// //         await taskApi.completeTask(backendTaskId);
// //       }

// //       // Update local tasks
// //       setTasks(prevTasks =>
// //         prevTasks.map(task =>
// //           (task.id === taskId || task._id === taskId) 
// //             ? { 
// //                 ...task, 
// //                 completed: true, 
// //                 status: 'completed',
// //                 completedAt: new Date().toISOString(),
// //                 actualTime: (task.actualTime || 0) + duration
// //               } 
// //             : task
// //         )
// //       );

// //       // Update user data with your existing logic
// //       setUserData(prevUserData => {
// //         const currentData = prevUserData || defaultUserData;

// //         const newTotalTasksCompleted = currentData.totalTasksCompleted + 1;
// //         const newTotalFocusTime = currentData.totalFocusTime + duration;
// //         const newTotalPomodoroSessions = currentData.totalPomodoroSessions + 1;
        
// //         const xpGained = 10 * duration;
// //         const newXp = currentData.xp + xpGained;
// //         const newLevel = Math.floor(newXp / 1000) + 1;

// //         let newCurrentStreak = currentData.currentStreak;
// //         const today = format(new Date(), 'yyyy-MM-dd');
// //         const lastActivityDate = currentData.history?.length > 0
// //           ? format(new Date(currentData.history[0].completedAt), 'yyyy-MM-dd')
// //           : null;

// //         if (lastActivityDate === null) {
// //           newCurrentStreak = 1;
// //         } else if (lastActivityDate === format(subDays(new Date(), 1), 'yyyy-MM-dd')) {
// //           newCurrentStreak += 1;
// //         } else if (lastActivityDate !== today) {
// //           newCurrentStreak = 1;
// //         }

// //         const newDailyStats = [...(currentData.dailyStats || [])];
// //         const todayStatsIndex = newDailyStats.findIndex(d => d.date === today);

// //         if (todayStatsIndex !== -1) {
// //           newDailyStats[todayStatsIndex].tasksCompleted += 1;
// //           newDailyStats[todayStatsIndex].focusTime += duration;
// //         } else {
// //           newDailyStats.push({
// //             date: today,
// //             tasksCompleted: 1,
// //             focusTime: duration
// //           });
// //         }

// //         const completedTask = tasks.find(t => t.id === taskId || t._id === taskId);
// //         const newHistory = [
// //           {
// //             _id: Date.now().toString(),
// //             title: `Completed: ${completedTask?.title || 'Unknown Task'}`,
// //             type: 'Pomodoro',
// //             completedAt: new Date().toISOString()
// //           },
// //           ...(currentData.history || [])
// //         ].slice(0, 10);

// //         return {
// //           ...currentData,
// //           totalTasksCompleted: newTotalTasksCompleted,
// //           totalFocusTime: newTotalFocusTime,
// //           totalPomodoroSessions: newTotalPomodoroSessions,
// //           currentStreak: newCurrentStreak,
// //           xp: newXp,
// //           level: newLevel,
// //           dailyStats: newDailyStats,
// //           history: newHistory,
// //         };
// //       });

// //       // Refresh data from backend
// //       await fetchTasksFromBackend();

// //     } catch (error) {
// //       console.error('Error completing task:', error);
// //     }
// //   };

// //   // CRUD operations with backend integration
// //   const createTask = async (newTask) => {
// //     if (!user?.id) return;

// //     try {
// //       const taskToCreate = {
// //         ...newTask,
// //         userId: user.id,
// //         status: 'pending'
// //       };

// //       const response = await taskApi.createTask(taskToCreate);
      
// //       if (response.success && response.data) {
// //         const backendTask = response.data;
        
// //         // Convert to local format
// //         const localTask = {
// //           id: backendTask._id,
// //           _id: backendTask._id,
// //           ...backendTask,
// //           completed: false
// //         };

// //         setTasks(prevTasks => [localTask, ...prevTasks]);
        
// //         // Refresh data
// //         await fetchTasksFromBackend();
        
// //         return localTask;
// //       }
// //     } catch (error) {
// //       console.error('Error creating task:', error);
      
// //       // Fallback to local creation
// //       const localTask = {
// //         ...newTask,
// //         id: Date.now(),
// //         _id: Date.now().toString(),
// //         completed: false,
// //         status: 'pending',
// //         userId: user.id,
// //         createdAt: new Date().toISOString()
// //       };
      
// //       setTasks(prevTasks => [localTask, ...prevTasks]);
      
// //       return localTask;
// //     }
// //   };

// //   const updateTask = async (updatedTask) => {
// //     try {
// //       const taskId = updatedTask._id || updatedTask.id;
      
// //       if (taskId && taskId.length > 10) { // Backend ID
// //         const response = await taskApi.updateTask(taskId, updatedTask);
        
// //         if (response.success && response.data) {
// //           const updatedBackendTask = {
// //             ...response.data,
// //             id: response.data._id,
// //             completed: response.data.status === 'completed'
// //           };
          
// //           setTasks(prevTasks =>
// //             prevTasks.map(task =>
// //               (task.id === taskId || task._id === taskId) ? updatedBackendTask : task
// //             )
// //           );
          
// //           // Refresh data
// //           await fetchTasksFromBackend();
          
// //           return updatedBackendTask;
// //         }
// //       } else {
// //         // Local task update
// //         setTasks(prevTasks =>
// //           prevTasks.map(task =>
// //             (task.id === updatedTask.id || task._id === updatedTask.id) ? updatedTask : task
// //           )
// //         );
// //       }
// //     } catch (error) {
// //       console.error('Error updating task:', error);
      
// //       // Fallback to local update
// //       setTasks(prevTasks =>
// //         prevTasks.map(task =>
// //           (task.id === updatedTask.id || task._id === updatedTask.id) ? updatedTask : task
// //         )
// //       );
// //     }
// //   };

// //   const deleteTask = async (taskId) => {
// //     try {
// //       const task = tasks.find(t => t.id === taskId || t._id === taskId);
// //       const backendTaskId = task?._id;
      
// //       if (backendTaskId && backendTaskId.length > 10) { // Backend ID
// //         await taskApi.deleteTask(backendTaskId);
// //       }
      
// //       setTasks(prevTasks => 
// //         prevTasks.filter(task => task.id !== taskId && task._id !== taskId)
// //       );
      
// //       // Refresh data
// //       await fetchTasksFromBackend();
      
// //     } catch (error) {
// //       console.error('Error deleting task:', error);
      
// //       // Fallback to local deletion
// //       setTasks(prevTasks => 
// //         prevTasks.filter(task => task.id !== taskId && task._id !== taskId)
// //       );
// //     }
// //   };

// //   const renderContent = () => {
// //     const commonProps = {
// //       tasks,
// //       userData,
// //       user,
// //       refreshData: fetchTasksFromBackend
// //     };

// //     switch (activeSection) {
// //       case 'dashboard':
// //         return <DashboardContent {...commonProps} />;
// //       case 'focus':
// //         return <FocusModeContent
// //           {...commonProps}
// //           activeTask={activeTask}
// //           setTasks={setTasks}
// //           setUserData={setUserData}
// //           onTaskComplete={handleTaskCompletion}
// //         />;
// //       case 'pomodoro':
// //         return <PomodoroContent
// //           {...commonProps}
// //           activeTask={activeTask}
// //           setTasks={setTasks}
// //           setUserData={setUserData}
// //           onTaskComplete={handleTaskCompletion}
// //         />;
// //       case 'tasks':
// //         return <TasksPage
// //           {...commonProps}
// //           setTasks={setTasks}
// //           onPlayTask={handleSectionChange}
// //           productivityLevel={productivityLevel}
// //           setUserData={setUserData}
// //           onTaskComplete={handleTaskCompletion}
// //           createTask={createTask}
// //           updateTask={updateTask}
// //           deleteTask={deleteTask}
// //         />;
// //       case 'settings':
// //         return <SettingsContent 
// //           {...commonProps}
// //           setUserData={setUserData} 
// //           productivityLevel={productivityLevel}
// //           setProductivityLevel={setProductivityLevel}
// //         />;
// //       case 'profile':
// //         return <ProfileContent
// //           {...commonProps}
// //           setUserData={setUserData}
// //           setTasks={setTasks}
// //           setProductivityLevel={setProductivityLevel}
// //           setShowProductivityModal={setShowProductivityModal}
// //           productivityLevel={productivityLevel}
// //         />;
// //       case 'ai':
// //         return <AIAssistantContent {...commonProps} />;
// //       default:
// //         return <DashboardContent {...commonProps} />;
// //     }
// //   };

// //   // Loading state
// //   if (!isLoaded || isLoading) {
// //     return (
// //       <div className="flex items-center justify-center min-h-screen bg-gray-100">
// //         <div className="text-center">
// //           <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
// //           <p className="text-gray-600">Loading your workspace...</p>
// //           <p className="text-sm text-gray-400 mt-2">Syncing with backend...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // Error state
// //   if (error) {
// //     return (
// //       <div className="flex items-center justify-center min-h-screen bg-gray-100">
// //         <div className="text-center max-w-md mx-auto p-6">
// //           <div className="bg-red-50 border border-red-200 rounded-xl p-6">
// //             <h2 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h2>
// //             <p className="text-red-600 mb-4">{error}</p>
// //             <button 
// //               onClick={() => window.location.reload()}
// //               className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
// //             >
// //               Retry
// //             </button>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // Not authenticated
// //   if (!user) {
// //     return (
// //       <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700">
// //         <div className="text-center text-white">
// //           <h1 className="text-4xl font-bold mb-4">Welcome to Focus App</h1>
// //           <p className="text-xl">Please sign in to continue</p>
// //           <SignInButton mode="modal">
// //   <button className="flex items-center space-x-2 relative left-28 bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">
// //     <LogIn className="h-5 w-5" />
// //     <span>Sign In</span>
// //   </button>
// // </SignInButton>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="flex flex-col md:flex-row h-screen bg-gray-100">
// //       {/* Mobile Header */}
// //       <div className="md:hidden p-4 flex justify-between items-center bg-white shadow-md">
// //         <div>
// //           <h1 className="text-xl font-bold text-gray-800">Focus App</h1>
// //           <p className="text-xs text-gray-500">Welcome, {userData?.name}!</p>
// //         </div>
// //         <button
// //           onClick={() => setIsSidebarOpen(!isSidebarOpen)}
// //           className="p-2 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
// //         >
// //           {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
// //         </button>
// //       </div>

// //       {/* Mobile Overlay */}
// //       {isSidebarOpen && (
// //         <div
// //           className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 md:hidden"
// //           onClick={() => setIsSidebarOpen(false)}
// //         ></div>
// //       )}

// //       {/* Sidebar */}
// //       <Sidebar
// //         activeSection={activeSection}
// //         handleSectionChange={handleSectionChange}
// //         isSidebarOpen={isSidebarOpen}
// //         setIsSidebarOpen={setIsSidebarOpen}
// //         userData={userData}
// //       />

// //       {/* Main Content */}
// //       <main className="flex-1 flex flex-col overflow-y-auto">
// //         <div className="p-4 sm:p-6 lg:p-8">
// //           {renderContent()}
// //         </div>
// //       </main>

// //       {/* Modals */}
// //       <ProductivityModal
// //         isOpen={showProductivityModal}
// //         onSubmit={handleSetProductivity}
// //       />

// //       <WelcomeModal
// //         isOpen={showWelcomeModal}
// //         onSubmit={handleSetUserInfo}
// //       />
// //     </div>
// //   );
// // }
