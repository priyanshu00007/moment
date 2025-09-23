"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Focus, Timer, Award } from "lucide-react";
import { ProfileDataManager, RankingSystem } from "./ProfileDataManager";

export default function StartTaskModal({ isOpen, onClose, onSelectMode, task, userStats }) {
  if (!isOpen) return null;

  const handleSelectMode = (mode) => {
    if (task && userStats) {
      ProfileDataManager.logActivity(userStats.userId, {
        type: 'session_started',
        sessionType: mode,
        taskId: task._id,
        taskTitle: task.title,
        description: `Started ${mode} session for "${task.title}"`,
      });
    }
    onSelectMode(mode, task);
  };

  const currentRank = userStats ? RankingSystem.getRankByXP(userStats.totalPoints) : RankingSystem.ranks[0];
  const focusXP = RankingSystem.getXPRewards(currentRank.tier, 'focus_session_completed');
  const pomodoroXP = RankingSystem.getXPRewards(currentRank.tier, 'pomodoro_session_completed');
  const startXP = RankingSystem.getXPRewards(currentRank.tier, 'session_started');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100"
          >
            <button onClick={onClose} className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 p-2">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Choose Focus Mode</h2>
              {task && <p className="text-gray-600">Ready to start: <span className="font-semibold text-blue-600">{task.title}</span></p>}
            </div>
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelectMode('focus')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-5 px-6 rounded-2xl shadow-lg flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Focus className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-lg">Focus Mode</div>
                    <div className="text-sm opacity-90">Deep work session</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">+{focusXP} XP</div>
                  <div className="text-xs opacity-90">on completion</div>
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelectMode('pomodoro')}
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold py-5 px-6 rounded-2xl shadow-lg flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Timer className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-lg">Pomodoro Technique</div>
                    <div className="text-sm opacity-90">25 min focused bursts</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">+{pomodoroXP} XP</div>
                  <div className="text-xs opacity-90">per session</div>
                </div>
              </motion.button>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200/50"
            >
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <Award className="w-5 h-5" />
                <span className="font-medium">Instant Reward: +{startXP} XP for starting!</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
// "use client";
// import React from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { X, Focus, Timer, Award } from "lucide-react";
// import { ProfileDataManager, RankingSystem } from "./ProfileDataManager";

// export default function StartTaskModal({ isOpen, onClose, onSelectMode, task, userStats }) {
//   if (!isOpen) return null;

//   const handleSelectMode = (mode) => {
//     if (task && userStats) {
//       ProfileDataManager.logActivity(userStats.userId || "user123", {
//         type: 'session_started',
//         sessionType: mode,
//         taskId: task._id,
//         taskTitle: task.title,
//         description: `Started ${mode} session for "${task.title}"`,
//       });
//     }
//     onSelectMode(mode, task);
//   };

//   const currentRank = userStats ? RankingSystem.getRankByXP(userStats.totalPoints) : RankingSystem.ranks[0];
//   const focusXP = RankingSystem.getXPRewards(currentRank.tier, 'focus_session_completed');
//   const pomodoroXP = RankingSystem.getXPRewards(currentRank.tier, 'pomodoro_session_completed');
//   const startXP = RankingSystem.getXPRewards(currentRank.tier, 'session_started');

//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
//           onClick={(e) => e.target === e.currentTarget && onClose()}
//         >
//           <motion.div
//             initial={{ scale: 0.8, y: 50, opacity: 0 }}
//             animate={{ scale: 1, y: 0, opacity: 1 }}
//             exit={{ scale: 0.8, y: 50, opacity: 0 }}
//             className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100"
//           >
//             <button onClick={onClose} className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 p-2">
//               <X className="w-5 h-5" />
//             </button>
//             <div className="text-center mb-8">
//               <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Choose Focus Mode</h2>
//               {task && <p className="text-gray-600">Ready to start: <span className="font-semibold text-blue-600">{task.title}</span></p>}
//             </div>
//             <div className="space-y-4">
//               <motion.button
//                 whileHover={{ scale: 1.03, y: -2 }}
//                 whileTap={{ scale: 0.97 }}
//                 onClick={() => handleSelectMode('focus')}
//                 className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-5 px-6 rounded-2xl shadow-lg flex items-center justify-between"
//               >
//                 <div className="flex items-center space-x-3">
//                   <Focus className="w-6 h-6" />
//                   <div className="text-left">
//                     <div className="text-lg">Focus Mode</div>
//                     <div className="text-sm opacity-90">Deep work session</div>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <div className="text-lg font-bold">+{focusXP} XP</div>
//                   <div className="text-xs opacity-90">on completion</div>
//                 </div>
//               </motion.button>
//               <motion.button
//                 whileHover={{ scale: 1.03, y: -2 }}
//                 whileTap={{ scale: 0.97 }}
//                 onClick={() => handleSelectMode('pomodoro')}
//                 className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold py-5 px-6 rounded-2xl shadow-lg flex items-center justify-between"
//               >
//                 <div className="flex items-center space-x-3">
//                   <Timer className="w-6 h-6" />
//                   <div className="text-left">
//                     <div className="text-lg">Pomodoro Technique</div>
//                     <div className="text-sm opacity-90">25 min focused bursts</div>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <div className="text-lg font-bold">+{pomodoroXP} XP</div>
//                   <div className="text-xs opacity-90">per session</div>
//                 </div>
//               </motion.button>
//             </div>
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.3 }}
//               className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200/50"
//             >
//               <div className="flex items-center justify-center gap-2 text-blue-700">
//                 <Award className="w-5 h-5" />
//                 <span className="font-medium">Instant Reward: +{startXP} XP for starting!</span>
//               </div>
//             </motion.div>
//           </motion.div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }
// // "use client";

// // import React from 'react';
// // import { motion, AnimatePresence } from 'framer-motion';
// // import { X, Focus, Timer } from 'lucide-react';

// // export default function StartTaskModal({ isOpen, onClose, onSelectMode, task }) {
// //   if (!isOpen) return null;

// //   const handleModeSelection = (mode) => {
// //     onSelectMode(mode, task); // Pass both mode and task
// //     onClose();
// //   };

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
// //                 onClick={() => handleModeSelection('focus')}
// //                 className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
// //               >
// //                 <Focus className="w-6 h-6" />
// //                 <span>Focus Mode</span>
// //               </motion.button>
// //               <motion.button
// //                 whileHover={{ scale: 1.02 }}
// //                 whileTap={{ scale: 0.98 }}
// //                 onClick={() => handleModeSelection('pomodoro')}
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
