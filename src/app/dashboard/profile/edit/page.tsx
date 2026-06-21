'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Pencil, User, Mail, FileText, MapPin } from 'lucide-react';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // সাইন-আপের সকল ফিল্ডের স্টেট
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    location: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const auth = getAuth();
      const firestore = getFirestore();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        router.push('/login');
        return;
      }

      try {
        const userRef = doc(firestore, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setFormData({
            name: data.name || '',
            username: data.username || '',
            email: data.email || currentUser.email || '',
            bio: data.bio || '',
            location: data.location || '',
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const auth = getAuth();
    const firestore = getFirestore();
    const currentUser = auth.currentUser;

    if (!currentUser) return;

    try {
      const userRef = doc(firestore, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name: formData.name,
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
      });
      alert("Profile updated successfully!");
      router.push('/dashboard/profile');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-white">Loading your profile information...</div>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto text-white min-h-screen">
      {/* ব্যাক বাটন ও হেডার */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* নাম ফিল্ড */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-3 pl-10 pr-10 focus:outline-none focus:border-purple-500"
              placeholder="Your Name"
              required
            />
            <Pencil className="absolute right-3 top-3.5 w-4 h-4 text-purple-400" />
          </div>
        </div>

        {/* ইউজারনেম ফিল্ড */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-500 font-semibold">@</span>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-3 pl-8 pr-10 focus:outline-none focus:border-purple-500"
              placeholder="username"
              required
            />
            <Pencil className="absolute right-3 top-3.5 w-4 h-4 text-purple-400" />
          </div>
        </div>

        {/* ইমেইল ফিল্ড (ডিজেবলড - সাইন আপের সিকিউরিটির জন্য) */}
        <div className="relative opacity-60">
          <label className="block text-sm font-medium text-gray-400 mb-2">Email Address (Cannot be changed)</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full bg-slate-950 border border-slate-900 rounded-lg py-3 pl-10 pr-4 cursor-not-allowed"
            />
          </div>
        </div>

        {/* বায়ো ফিল্ড */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-3 pl-10 pr-10 focus:outline-none focus:border-purple-500 resize-none"
              placeholder="Tell us about yourself..."
            />
            <Pencil className="absolute right-3 top-3.5 w-4 h-4 text-purple-400" />
          </div>
        </div>

        {/* লোকেশন ফিল্ড */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-3 pl-10 pr-10 focus:outline-none focus:border-purple-500"
              placeholder="e.g. Tala, Satkhira"
            />
            <Pencil className="absolute right-3 top-3.5 w-4 h-4 text-purple-400" />
          </div>
        </div>

        {/* সাবমিট বাটন */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg py-3 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving changes...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
