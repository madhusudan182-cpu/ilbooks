'use strict';
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminNotificationPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [targetUserId, setTargetUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) {
      toast({ title: 'Database not connected', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      // ডাটাবেজের 'user_notifications' কালেকশনে নোটিফিকেশন ডাটা পাঠানো হচ্ছে
      await addDoc(collection(firestore, 'user_notifications'), {
        userId: targetUserId.trim(), // টার্গেটেড ইউজারের আইডি (যেমন: TynTrxU2ZMhVEL...)
        title: title.trim(),
        message: message.trim(),
        isRead: false, // ইউজার নোটিফিকেশনটি পড়েছে কি না তা ট্র্যাক করতে
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Notification sent successfully!', className: 'bg-emerald-600 text-white' });
      setTargetUserId('');
      setTitle('');
      setMessage('');
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to send notification', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      {/* Back Button */}
      <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Back to Admin Panel
      </Link>

      <Card className="max-w-xl mx-auto border border-gray-200 shadow-sm bg-gray-50/50">
        <CardHeader className="text-center pb-2">
          {/* Bell / Notification Icon */}
          <div className="flex justify-center text-gray-600 mb-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://w3.org">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
          </div>
          <CardTitle className="text-xl font-bold text-gray-800">Send Targeted Notification</CardTitle>
          <CardDescription className="text-xs">
            Send a real-time system notification to a specific user's navigation dashboard.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Target User ID :</label>
              <input
                type="text"
                required
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Paste User ID here (e.g., TynTrxU2ZMhVEL...)"
                className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notification Title :</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Order Processed, Exam Updates"
                className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Message Body :</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type the message details for the user..."
                className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="submit" size="sm" disabled={sending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4">
                {sending ? 'Sending...' : 'Send Notification'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
