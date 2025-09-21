'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Save, User, Target, FileText, X, MapPin, Phone, Globe, Briefcase, Heart, Star, Award } from "lucide-react";

export default function EditProfileModal({ open, onOpenChange, onProfileUpdated }) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    primaryGoal: '',
    bio: '',
    skills: '',
    interests: '',
    location: '',
    phone: '',
    website: '',
    jobTitle: '',
    company: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user && open) {
      setFormData({
        primaryGoal: user.unsafeMetadata?.primaryGoal || '',
        bio: user.unsafeMetadata?.bio || '',
        skills: user.unsafeMetadata?.skills || '',
        interests: user.unsafeMetadata?.interests || '',
        location: user.unsafeMetadata?.location || '',
        phone: user.unsafeMetadata?.phone || '',
        website: user.unsafeMetadata?.website || '',
        jobTitle: user.unsafeMetadata?.jobTitle || '',
        company: user.unsafeMetadata?.company || ''
      });
      setErrors({});
    }
  }, [user, open]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.primaryGoal && formData.primaryGoal.length > 200) {
      newErrors.primaryGoal = 'Primary goal must be less than 200 characters';
    }
    
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }
    
    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'Website must start with http:// or https://';
    }
    
    if (formData.phone && !formData.phone.match(/^[\+]?[1-9][\d]{0,15}$/)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user || !validateForm()) return;
    
    setIsLoading(true);
    try {
      const updatedMetadata = { 
        ...user.unsafeMetadata, 
        ...formData, 
        lastUpdated: new Date().toISOString() 
      };
      
      await user.update({ unsafeMetadata: updatedMetadata });
      
      // Log activity for profile update
      logActivity({
        type: 'profile_updated',
        description: 'Updated profile information',
        points: 10
      });
      
      // Call callback to refresh parent component
      if (onProfileUpdated) {
        onProfileUpdated();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logActivity = (activity) => {
    try {
      const activities = JSON.parse(localStorage.getItem('user-activities-data') || '[]');
      const newActivity = {
        id: Date.now().toString(),
        userId: user?.id,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        ...activity
      };
      
      activities.unshift(newActivity);
      localStorage.setItem('user-activities-data', JSON.stringify(activities.slice(0, 100)));
      
      // Update user stats
      const stats = JSON.parse(localStorage.getItem('user-stats-data') || '{}');
      if (!stats[user?.id]) {
        stats[user?.id] = {
          totalPoints: 0, 
          rank: 'Beginner', 
          joinDate: new Date().toISOString(), 
          lastActive: new Date().toISOString(),
          level: 1
        };
      }
      
      stats[user?.id].totalPoints += activity.points || 0;
      stats[user?.id].lastActive = new Date().toISOString();
      
      // Update rank based on points
      const points = stats[user?.id].totalPoints;
      if (points >= 2000) stats[user?.id].rank = 'Master';
      else if (points >= 1000) stats[user?.id].rank = 'Expert';
      else if (points >= 500) stats[user?.id].rank = 'Advanced';
      else if (points >= 100) stats[user?.id].rank = 'Intermediate';
      else stats[user?.id].rank = 'Beginner';
      
      localStorage.setItem('user-stats-data', JSON.stringify(stats));
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      primaryGoal: user?.unsafeMetadata?.primaryGoal || '',
      bio: user?.unsafeMetadata?.bio || '',
      skills: user?.unsafeMetadata?.skills || '',
      interests: user?.unsafeMetadata?.interests || '',
      location: user?.unsafeMetadata?.location || '',
      phone: user?.unsafeMetadata?.phone || '',
      website: user?.unsafeMetadata?.website || '',
      jobTitle: user?.unsafeMetadata?.jobTitle || '',
      company: user?.unsafeMetadata?.company || ''
    });
    setErrors({});
    onOpenChange(false);
  };

  if (!open) return null;

  const formFields = [
    {
      key: 'primaryGoal',
      label: 'Primary Goal',
      icon: Target,
      placeholder: 'What do you want to achieve?',
      type: 'textarea',
      maxLength: 200
    },
    {
      key: 'bio',
      label: 'Bio',
      icon: FileText,
      placeholder: 'Tell us about yourself...',
      type: 'textarea',
      maxLength: 500
    },
    {
      key: 'jobTitle',
      label: 'Job Title',
      icon: Briefcase,
      placeholder: 'Your current position',
      type: 'input'
    },
    {
      key: 'company',
      label: 'Company',
      icon: Briefcase,
      placeholder: 'Where do you work?',
      type: 'input'
    },
    {
      key: 'location',
      label: 'Location',
      icon: MapPin,
      placeholder: 'City, Country',
      type: 'input'
    },
    {
      key: 'skills',
      label: 'Skills',
      icon: Star,
      placeholder: 'JavaScript, Design, Management...',
      type: 'input'
    },
    {
      key: 'interests',
      label: 'Interests',
      icon: Heart,
      placeholder: 'Photography, Reading, Travel...',
      type: 'input'
    },
    {
      key: 'phone',
      label: 'Phone',
      icon: Phone,
      placeholder: '+1 234 567 8900',
      type: 'input'
    },
    {
      key: 'website',
      label: 'Website',
      icon: Globe,
      placeholder: 'https://yourwebsite.com',
      type: 'input'
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
        onClick={e => e.target === e.currentTarget && handleCancel()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || 'User'} />
                    <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {user?.fullName?.charAt(0) || user?.primaryEmailAddress?.emailAddress?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl text-gray-800 flex items-center gap-2">
                      <User className="w-6 h-6 text-blue-600" />
                      Edit Profile
                    </CardTitle>
                    <p className="text-gray-600">Update your profile information and preferences</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                {formFields.map(({ key, label, icon: Icon, placeholder, type, maxLength }) => (
                  <motion.div 
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: formFields.findIndex(f => f.key === key) * 0.1 }}
                    className="space-y-2"
                  >
                    <Label htmlFor={key} className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Icon className="w-4 h-4 text-blue-600" />
                      {label}
                      {maxLength && (
                        <span className="text-xs text-gray-400 ml-auto">
                          {formData[key]?.length || 0}/{maxLength}
                        </span>
                      )}
                    </Label>
                    
                    {type === 'textarea' ? (
                      <Textarea
                        id={key}
                        value={formData[key]}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        rows={3}
                        className={`resize-none rounded-xl border-2 focus:border-blue-500 transition-colors ${
                          errors[key] ? 'border-red-300 focus:border-red-500' : 'border-gray-200'
                        }`}
                      />
                    ) : (
                      <Input
                        id={key}
                        value={formData[key]}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        placeholder={placeholder}
                        className={`rounded-xl border-2 focus:border-blue-500 transition-colors ${
                          errors[key] ? 'border-red-300 focus:border-red-500' : 'border-gray-200'
                        }`}
                      />
                    )}
                    
                    {errors[key] && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-600 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        {errors[key]}
                      </motion.p>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
            
            <Separator className="mx-6" />
            
            <div className="p-6">
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="px-6 py-2 rounded-xl border-2 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={isLoading || Object.keys(errors).length > 0}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200"
              >
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Award className="w-4 h-4" />
                  <span className="font-medium">Earn 10 XP for updating your profile!</span>
                </div>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


// 'use client';

// import { useState, useEffect } from 'react';
// import { useUser } from '@clerk/nextjs';
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
// import { motion, AnimatePresence } from "framer-motion";
// import { Loader2, Save, User, Target, FileText, X, MapPin, Phone, Globe, Briefcase, Heart } from "lucide-react";

// export default function EditProfileModal({ open, onOpenChange }) {
//   const { user } = useUser();
//   const [isLoading, setIsLoading] = useState(false);
//   const [formData, setFormData] = useState({
//     primaryGoal: '',
//     bio: '',
//     skills: '',
//     interests: '',
//     location: '',
//     phone: '',
//     website: '',
//     jobTitle: '',
//     company: ''
//   });

//   useEffect(() => {
//     if (user && open) {
//       setFormData({
//         primaryGoal: user.unsafeMetadata?.primaryGoal || '',
//         bio: user.unsafeMetadata?.bio || '',
//         skills: user.unsafeMetadata?.skills || '',
//         interests: user.unsafeMetadata?.interests || '',
//         location: user.unsafeMetadata?.location || '',
//         phone: user.unsafeMetadata?.phone || '',
//         website: user.unsafeMetadata?.website || '',
//         jobTitle: user.unsafeMetadata?.jobTitle || '',
//         company: user.unsafeMetadata?.company || ''
//       });
//     }
//   }, [user, open]);

//   const handleInputChange = (field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   const handleSave = async () => {
//     if (!user) return;
//     setIsLoading(true);
//     try {
//       const updatedMetadata = { ...user.unsafeMetadata, ...formData, lastUpdated: new Date().toISOString() };
//       await user.update({ unsafeMetadata: updatedMetadata });
//       logActivity({
//         type: 'profile_updated',
//         description: 'Updated profile information',
//         points: 10
//       });
//       alert('Profile updated successfully!');
//       onOpenChange(false);
//     } catch (error) {
//       alert('Failed to update profile. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const logActivity = (activity) => {
//     try {
//       const activities = JSON.parse(localStorage.getItem('user_activities') || '[]');
//       const newActivity = {
//         id: Date.now().toString(),
//         userId: user?.id,
//         timestamp: new Date().toISOString(),
//         ...activity
//       };
//       activities.unshift(newActivity);
//       localStorage.setItem('user_activities', JSON.stringify(activities.slice(0, 100)));
//       const stats = JSON.parse(localStorage.getItem('user_stats') || '{}');
//       if (!stats[user?.id || '']) {
//         stats[user?.id || ''] = {
//           totalPoints: 0, rank: 'Beginner', joinDate: new Date().toISOString(), lastActive: new Date().toISOString()
//         };
//       }
//       stats[user?.id || ''].totalPoints += activity.points || 0;
//       stats[user?.id || ''].lastActive = new Date().toISOString();
//       if (stats[user?.id || ''].totalPoints >= 1000) stats[user?.id || ''].rank = 'Master';
//       else if (stats[user?.id || ''].totalPoints >= 500) stats[user?.id || ''].rank = 'Expert';
//       else if (stats[user?.id || ''].totalPoints >= 200) stats[user?.id || ''].rank = 'Advanced';
//       else if (stats[user?.id || ''].totalPoints >= 50) stats[user?.id || ''].rank = 'Intermediate';
//       localStorage.setItem('user_stats', JSON.stringify(stats));
//     } catch (error) { /* ignore */ }
//   };
//   const handleCancel = () => onOpenChange(false);
//   if (!open) return null;

//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//         className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
//         onClick={e => e.target === e.currentTarget && handleCancel()}
//       >
//       </motion.div>
//     </AnimatePresence>
//   );
// }
