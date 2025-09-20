
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
import { Loader2, Save, User, Target, FileText, X, MapPin, Phone, Globe, Briefcase, Heart } from "lucide-react";

export default function EditProfileModal({ open, onOpenChange }) {
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
    }
  }, [user, open]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const updatedMetadata = { ...user.unsafeMetadata, ...formData, lastUpdated: new Date().toISOString() };
      await user.update({ unsafeMetadata: updatedMetadata });
      logActivity({
        type: 'profile_updated',
        description: 'Updated profile information',
        points: 10
      });
      alert('Profile updated successfully!');
      onOpenChange(false);
    } catch (error) {
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logActivity = (activity) => {
    try {
      const activities = JSON.parse(localStorage.getItem('user_activities') || '[]');
      const newActivity = {
        id: Date.now().toString(),
        userId: user?.id,
        timestamp: new Date().toISOString(),
        ...activity
      };
      activities.unshift(newActivity);
      localStorage.setItem('user_activities', JSON.stringify(activities.slice(0, 100)));
      const stats = JSON.parse(localStorage.getItem('user_stats') || '{}');
      if (!stats[user?.id || '']) {
        stats[user?.id || ''] = {
          totalPoints: 0, rank: 'Beginner', joinDate: new Date().toISOString(), lastActive: new Date().toISOString()
        };
      }
      stats[user?.id || ''].totalPoints += activity.points || 0;
      stats[user?.id || ''].lastActive = new Date().toISOString();
      if (stats[user?.id || ''].totalPoints >= 1000) stats[user?.id || ''].rank = 'Master';
      else if (stats[user?.id || ''].totalPoints >= 500) stats[user?.id || ''].rank = 'Expert';
      else if (stats[user?.id || ''].totalPoints >= 200) stats[user?.id || ''].rank = 'Advanced';
      else if (stats[user?.id || ''].totalPoints >= 50) stats[user?.id || ''].rank = 'Intermediate';
      localStorage.setItem('user_stats', JSON.stringify(stats));
    } catch (error) { /* ignore */ }
  };
  const handleCancel = () => onOpenChange(false);
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
        onClick={e => e.target === e.currentTarget && handleCancel()}
      >
        {/* ...MODAL UI as in your code... */}
        {/* Inputs for profile fields, Save/Cancel buttons */}
      </motion.div>
    </AnimatePresence>
  );
}
