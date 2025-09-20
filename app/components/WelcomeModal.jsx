"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Target, Globe, Clock, Calendar } from 'lucide-react';

export default function WelcomeModal({ isOpen, onSubmit }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    purpose: '',
    source: '',
    schedule: '',
    workingHours: '',
    goals: '',
    experience: '',
    preferredSession: '25'
  });

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <User className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Welcome to Focus App!</h2>
        <p className="text-gray-600 mt-2">Let's personalize your experience</p>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">What's your name?</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your name"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">What do you need this app for?</label>
        <select
          value={formData.purpose}
          onChange={(e) => handleInputChange('purpose', e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select your main purpose</option>
          <option value="work">Work & Professional Tasks</option>
          <option value="study">Study & Learning</option>
          <option value="personal">Personal Projects</option>
          <option value="mixed">Mix of Work & Personal</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">Where did you hear about this app?</label>
        <select
          value={formData.source}
          onChange={(e) => handleInputChange('source', e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select source</option>
          <option value="search">Google/Search Engine</option>
          <option value="social">Social Media</option>
          <option value="friend">Friend/Colleague</option>
          <option value="blog">Blog/Article</option>
          <option value="other">Other</option>
        </select>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <Clock className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Your Schedule</h2>
        <p className="text-gray-600 mt-2">Help us understand your routine</p>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">What are your typical working hours?</label>
        <select
          value={formData.workingHours}
          onChange={(e) => handleInputChange('workingHours', e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select your schedule</option>
          <option value="morning">Morning Person (6AM - 2PM)</option>
          <option value="standard">Standard Hours (9AM - 5PM)</option>
          <option value="evening">Evening Person (2PM - 10PM)</option>
          <option value="night">Night Owl (6PM - 2AM)</option>
          <option value="flexible">Flexible Schedule</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">Preferred focus session length?</label>
        <select
          value={formData.preferredSession}
          onChange={(e) => handleInputChange('preferredSession', e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="15">15 minutes (Quick bursts)</option>
          <option value="25">25 minutes (Pomodoro)</option>
          <option value="45">45 minutes (Deep focus)</option>
          <option value="60">60 minutes (Extended work)</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">Describe your typical day</label>
        <textarea
          value={formData.schedule}
          onChange={(e) => handleInputChange('schedule', e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., I work from home, have meetings in the morning, prefer focused work in the afternoon..."
          required
        />
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <Target className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Your Goals</h2>
        <p className="text-gray-600 mt-2">Let's set you up for success</p>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">What's your main goal?</label>
        <select
          value={formData.goals}
          onChange={(e) => handleInputChange('goals', e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select your primary goal</option>
          <option value="productivity">Increase productivity</option>
          <option value="focus">Improve focus & concentration</option>
          <option value="procrastination">Overcome procrastination</option>
          <option value="balance">Better work-life balance</option>
          <option value="habits">Build better habits</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">Experience with focus techniques?</label>
        <select
          value={formData.experience}
          onChange={(e) => handleInputChange('experience', e.target.value)}
          className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select your experience level</option>
          <option value="beginner">New to focus techniques</option>
          <option value="some">Some experience with Pomodoro</option>
          <option value="experienced">Experienced with focus methods</option>
          <option value="expert">Expert - I know what works for me</option>
        </select>
      </div>
    </motion.div>
  );

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative"
      >
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i <= step
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i}
              </div>
              {i < 3 && (
                <div
                  className={`w-8 h-1 ${
                    i < step ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={handlePrev}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                step === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              disabled={step === 1}
            >
              Previous
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                Next
              </button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
              >
                Get Started!
              </motion.button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// "use client"
// import React, { useState } from 'react';
// import { motion } from 'framer-motion';

// export default function WelcomeModal({ isOpen, onSubmit }) {
//   const [name, setName] = useState('');
//   const [purpose, setPurpose] = useState('');
//   const [source, setSource] = useState('');
//   const [schedule, setSchedule] = useState('');

//   if (!isOpen) return null;

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onSubmit({ name, purpose, source, schedule });
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50"
//     >
//       <motion.div
//         initial={{ scale: 0.9, y: 50 }}
//         animate={{ scale: 1, y: 0 }}
//         exit={{ scale: 0.9, y: 50 }}
//         className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative"
//       >
//         <h2 className="text-2xl font-bold text-gray-800 mb-6">
//           Welcome to Focus App!
//         </h2>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label htmlFor="name" className="block text-gray-700 text-sm font-medium mb-1">Your Name</label>
//             <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3" required />
//           </div>
//           <div>
//             <label htmlFor="purpose" className="block text-gray-700 text-sm font-medium mb-1">What do you need this app for?</label>
//             <textarea id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 min-h-[60px]" required />
//           </div>
//           <div>
//             <label htmlFor="source" className="block text-gray-700 text-sm font-medium mb-1">Where did you hear about this app?</label>
//             <input type="text" id="source" value={source} onChange={(e) => setSource(e.target.value)} className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3" required />
//           </div>
//           <div>
//             <label htmlFor="schedule" className="block text-gray-700 text-sm font-medium mb-1">What's your daily schedule?</label>
//             <textarea id="schedule" value={schedule} onChange={(e) => setSchedule(e.target.value)} className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 min-h-[100px]" required />
//           </div>
//           <motion.button
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.98 }}
//             type="submit"
//             className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-200"
//           >
//             Get Started
//           </motion.button>
//         </form>
//       </motion.div>
//     </motion.div>
//   );
// }