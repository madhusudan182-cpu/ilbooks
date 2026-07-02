'use strict';
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface LiveBadgeProps {
  userId: string | undefined;
}

export default function LiveNotificationBadge({ userId }: LiveBadgeProps) {
  const firestore = useFirestore();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const prevCountRef = useRef<number>(0);

  // ১. ফায়ারবেস থেকে রিয়েল-টাইম ডেটা লিসেন করা (লুপ মুক্ত পদ্ধতি)
  useEffect(() => {
    if (!firestore || !userId) return;

    const notifCollection = collection(firestore, 'user_notifications');
    const q = query(
      notifCollection,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    // onSnapshot ব্যবহার করলে কোনো রি-রেন্ডার লুপ তৈরি হয় না
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const count = snapshot.size; // সরাসরি ডক সাইজ থেকে কাউন্ট নেওয়া
      setUnreadCount(count);
    }, (error) => {
      console.error("Error fetching notifications: ", error);
    });

    return () => unsubscribe();
  }, [firestore, userId]);

  // ২. নতুন নোটিফিকেশন আসলে সাউন্ড ও ভাইব্রেশন প্লে করা
  useEffect(() => {
    // শুধুমাত্র নতুন নোটিফিকেশন কাউন্ট বাড়লে সাউন্ড হবে
    if (unreadCount > prevCountRef.current) {
      // সাউন্ড প্লে করার কোড
      const audio = new Audio('/notification.mp3'); 
      audio.play().catch((err) => 
        console.log("সাউন্ড প্লে করার জন্য ব্যবহারকারীর স্ক্রিনে একবার ক্লিক করা লাগবে: ", err)
      );

      // ভাইব্রেশন কোড (২০০ মিলিসেকেন্ড)
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200);
      }
    }
    
    // বর্তমান কাউন্টটি সেভ করে রাখা হচ্ছে পরবর্তী চেক করার জন্য
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  if (unreadCount > 0) {
    return (
      <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse z-50">
        {unreadCount}
      </span>
    );
  }

  return null;
}
