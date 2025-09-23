'use client';
import React, { useState } from 'react';
import {
  LayoutDashboard, Timer, LucideFocus, User,
  Menu, X, Bot, ListTodo, LogOut, LogIn, Target // <- Target icon for goals
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton
} from '@clerk/nextjs';

const Item = ({ icon, text, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center p-3 rounded-xl transition-colors
      ${active ? 'bg-blue-500 text-white shadow-md'
               : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}
      ${collapsed ? 'justify-center' : 'justify-start space-x-3'}`}
    title={collapsed ? text : ''}
  >
    {icon}
    <AnimatePresence>
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="font-medium whitespace-nowrap"
        >
          {text}
        </motion.span>
      )}
    </AnimatePresence>
  </button>
);

export default function Sidebar({
  activeSection,
  handleSectionChange,
  isSidebarOpen,
  setIsSidebarOpen
}) {
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () =>
    window.innerWidth >= 768
      ? setCollapsed(!collapsed)
      : setIsSidebarOpen(!isSidebarOpen);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg p-6 flex flex-col
                  space-y-4 transition-all duration-300 ease-in-out
                  ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
                  ${collapsed ? 'md:w-20' : 'md:w-64'}
                  md:relative md:translate-x-0 md:p-4`}
    >
      <div className="flex justify-between items-center mb-8">
        {!collapsed && (
          <h1 className="text-3xl font-bold text-gray-800">Momentom</h1>
        )}
        <button
          onClick={toggle}
          className={`p-2 rounded-lg text-gray-700 hover:bg-gray-200
                      ${collapsed ? 'mx-auto' : ''}`}
        >
          {collapsed ? <Menu size={24} /> : <X size={24} />}
        </button>
      </div>
      <nav className="flex-1 space-y-2">
        <Item icon={<LayoutDashboard size={20} />} text="Dashboard"
              active={activeSection === 'dashboard'}
              onClick={() => handleSectionChange('dashboard')}
              collapsed={collapsed} />
        <Item icon={<LucideFocus size={20} />} text="Focus Mode"
              active={activeSection === 'focus'}
              onClick={() => handleSectionChange('focus')}
              collapsed={collapsed} />
        <Item icon={<Timer size={20} />} text="Pomodoro"
              active={activeSection === 'pomodoro'}
              onClick={() => handleSectionChange('pomodoro')}
              collapsed={collapsed} />
        <Item icon={<ListTodo size={20} />} text="Task Manager"
              active={activeSection === 'tasks'}
              onClick={() => handleSectionChange('tasks')}
              collapsed={collapsed} />
        <Item icon={<Target size={20} />} text="Goals"
              active={activeSection === 'goals'}
              onClick={() => handleSectionChange('goals')}
              collapsed={collapsed} />
        <Item icon={<Bot size={20} />} text="AI Assistant"
              active={activeSection === 'ai'}
              onClick={() => handleSectionChange('ai')}
              collapsed={collapsed} />
        <Item icon={<User size={20} />} text="Profile"
              active={activeSection === 'profile'}
              onClick={() => handleSectionChange('profile')}
              collapsed={collapsed} />
      </nav>
      <SignedOut>
        <SignInButton mode="modal">
          <Item
            icon={<LogIn size={20} />}
            text="Log In"
            active={false}
            onClick={() => {}}
            collapsed={collapsed}
          />
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <SignOutButton signOutOptions={{ redirectUrl: '/' }}>
          <Item
            icon={<LogOut size={20} />}
            text="Log Out"
            active={false}
            onClick={() => {}}
            collapsed={collapsed}
          />
        </SignOutButton>
      </SignedIn>
    </aside>
  );
}

// 'use client';

// import React, { useState } from 'react';
// import {
//   LayoutDashboard, Timer, LucideFocus, User,
//   Menu, X, Bot, ListTodo, LogOut, LogIn        // ← LogIn icon
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   SignedIn,
//   SignedOut,
//   SignInButton,
//   SignOutButton
// } from '@clerk/nextjs';

// /* ───────────── reusable item ───────────── */
// const Item = ({ icon, text, active, onClick, collapsed }) => (
//   <button
//     onClick={onClick}
//     className={`w-full flex items-center p-3 rounded-xl transition-colors
//       ${active ? 'bg-blue-500 text-white shadow-md'
//                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}
//       ${collapsed ? 'justify-center' : 'justify-start space-x-3'}`}
//     title={collapsed ? text : ''}
//   >
//     {icon}
//     <AnimatePresence>
//       {!collapsed && (
//         <motion.span
//           initial={{ opacity: 0, x: -10 }}
//           animate={{ opacity: 1, x: 0 }}
//           exit={{ opacity: 0, x: -10 }}
//           transition={{ duration: 0.2 }}
//           className="font-medium whitespace-nowrap"
//         >
//           {text}
//         </motion.span>
//       )}
//     </AnimatePresence>
//   </button>
// );

// /* ───────────── sidebar ───────────── */
// export default function Sidebar({
//   activeSection,
//   handleSectionChange,
//   isSidebarOpen,
//   setIsSidebarOpen
// }) {
//   const [collapsed, setCollapsed] = useState(false);

//   /* quick helper to toggle width / slide-in */
//   const toggle = () =>
//     window.innerWidth >= 768
//       ? setCollapsed(!collapsed)
//       : setIsSidebarOpen(!isSidebarOpen);

//   return (
//     <aside
//       className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg p-6 flex flex-col
//                   space-y-4 transition-all duration-300 ease-in-out
//                   ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
//                   ${collapsed ? 'md:w-20' : 'md:w-64'}
//                   md:relative md:translate-x-0 md:p-4`}
//     >
//       {/* logo + burger */}
//       <div className="flex justify-between items-center mb-8">
//         {!collapsed && (
//           <h1 className="text-3xl font-bold text-gray-800">Momentom</h1>
//         )}
//         <button
//           onClick={toggle}
//           className={`p-2 rounded-lg text-gray-700 hover:bg-gray-200
//                       ${collapsed ? 'mx-auto' : ''}`}
//         >
//           {collapsed ? <Menu size={24} /> : <X size={24} />}
//         </button>
//       </div>

//       {/* main links */}
//       <nav className="flex-1 space-y-2">
//         <Item icon={<LayoutDashboard size={20} />} text="Dashboard"
//               active={activeSection === 'dashboard'}
//               onClick={() => handleSectionChange('dashboard')}
//               collapsed={collapsed} />
//         <Item icon={<LucideFocus size={20} />} text="Focus Mode"
//               active={activeSection === 'focus'}
//               onClick={() => handleSectionChange('focus')}
//               collapsed={collapsed} />
//         <Item icon={<Timer size={20} />} text="Pomodoro"
//               active={activeSection === 'pomodoro'}
//               onClick={() => handleSectionChange('pomodoro')}
//               collapsed={collapsed} />
//         <Item icon={<ListTodo size={20} />} text="Task Manager"
//               active={activeSection === 'tasks'}
//               onClick={() => handleSectionChange('tasks')}
//               collapsed={collapsed} />
//         <Item icon={<Bot size={20} />} text="AI Assistant"
//               active={activeSection === 'ai'}
//               onClick={() => handleSectionChange('ai')}
//               collapsed={collapsed} />
        
//         <Item icon={<User size={20} />} text="Profile"
//               active={activeSection === 'profile'}
//               onClick={() => handleSectionChange('profile')}
//               collapsed={collapsed} />
//       </nav>

//       {/* auth controls */}
//       <SignedOut>
//         <SignInButton mode="modal">
//           <Item
//             icon={<LogIn size={20} />}
//             text="Log In"
//             active={false}
//             onClick={() => {}}
//             collapsed={collapsed}
//           />
//         </SignInButton>
//       </SignedOut>

//       <SignedIn>
//         <SignOutButton signOutOptions={{ redirectUrl: '/' }}>
//           <Item
//             icon={<LogOut size={20} />}
//             text="Log Out"
//             active={false}
//             onClick={() => {}}
//             collapsed={collapsed}
//           />
//         </SignOutButton>
//       </SignedIn>
//     </aside>
//   );
// }
