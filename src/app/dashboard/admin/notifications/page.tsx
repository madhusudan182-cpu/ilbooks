'use strict';
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminNotificationPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // নতুন মোড স্টেট: 'USER' | 'LEVEL' | 'ALL'
  const [sendMode, setSendMode] = useState<'USER' | 'LEVEL' | 'ALL'>('USER');
  const [targetUserId, setTargetUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  // নির্বাচিত লেভেল ট্র্যাকিং
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

  // ডাইনামিকভাবে 0.0 থেকে 19.9 পর্যন্ত ২০০টি লেভেল জেনারেট করা
  const levelsArray: string[] = [];
  for (let i = 0; i <= 19; i++) {
    for (let j = 0; j <= 9; j++) {
      levelsArray.push(`${i}.${j}`);
    }
  }

  const handleLevelCheckboxChange = (lvl: string) => {
    if (selectedLevels.includes(lvl)) {
      setSelectedLevels(selectedLevels.filter(l => l !== lvl));
    } else {
      setSelectedLevels([...selectedLevels, lvl]);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) {
      toast({ title: 'Database not connected', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const notifCollection = collection(firestore, 'user_notifications');
      const notificationData = {
        title: title.trim(),
        message: message.trim(),
        isRead: false,
        createdAt: serverTimestamp(),
      };

      if (sendMode === 'USER') {
        // ১. নির্দিষ্ট একক ইউজারকে পাঠানো
        await addDoc(notifCollection, {
          ...notificationData,
          userId: targetUserId.trim(),
        });
      } 
      else if (sendMode === 'LEVEL') {
        // ২. নির্দিষ্ট লেভেলের সকল ইউজারকে পাঠানো
        if (selectedLevels.length === 0) {
          toast({ title: 'Please select at least one level', variant: 'destructive' });
          setSending(false);
          return;
        }
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('level', 'in', selectedLevels));
        const querySnapshot = await getDocs(q);
        
        const promises = querySnapshot.docs.map(userDoc => 
          addDoc(notifCollection, { ...notificationData, userId: userDoc.id })
        );
        await Promise.all(promises);
      } 
      else if (sendMode === 'ALL') {
        // ৩. অ্যাপের সকল ইউজারকে পাঠানো
        const usersRef = collection(firestore, 'users');
        const querySnapshot = await getDocs(usersRef);
        
        const promises = querySnapshot.docs.map(userDoc => 
          addDoc(notifCollection, { ...notificationData, userId: userDoc.id })
        );
        await Promise.all(promises);
      }

      toast({ title: 'Notification sent successfully!', className: 'bg-emerald-600 text-white' });
      setTargetUserId('');
      setTitle('');
      setMessage('');
      setSelectedLevels([]);
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to send notification', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
        Back to Admin Panel
      </Link>
      
      <Card className="max-w-xl mx-auto border border-gray-200 shadow-sm bg-gray-50/50">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-bold text-gray-800">Send Notifications</CardTitle>
          <CardDescription className="text-xs">Select target type and send custom notification.</CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* মোড সিলেকশন বাটন সমূহ */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <Button type="button" variant={sendMode === 'USER' ? 'default' : 'outline'} onClick={() => setSendMode('USER')}>User</Button>
            <Button type="button" variant={sendMode === 'LEVEL' ? 'default' : 'outline'} onClick={() => setSendMode('LEVEL')}>Level</Button>
            <Button type="button" variant={sendMode === 'ALL' ? 'default' : 'outline'} onClick={() => setSendMode('ALL')}>All Users</Button>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-4">
            {sendMode === 'USER' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Target User ID:</label>
                <input
                  type="text"
                  required
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="Paste User ID here..."
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                />
              </div>
            )}

            {sendMode === 'LEVEL' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Select Levels (Total {selectedLevels.length} selected):</label>
                <div className="border border-gray-300 rounded-md p-2 bg-white max-h-40 overflow-y-auto grid grid-cols-4 gap-2">
                  {levelsArray.map((lvl) => (
                    <label key={lvl} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedLevels.includes(lvl)}
                        onChange={() => handleLevelCheckboxChange(lvl)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {lvl}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notification Title :</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Notice, Announcement"
                className="w-full p-2 text-sm border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Message Body :</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type the message details here..."
                className="w-full p-2 text-sm border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="submit" size="sm" disabled={sending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                {sending ? 'Sending...' : 'Send Notification'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
