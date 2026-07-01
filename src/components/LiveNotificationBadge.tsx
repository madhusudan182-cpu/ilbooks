'use strict';
'use client';
import React from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

interface LiveBadgeProps {
  userId: string | undefined;
}

export default function LiveNotificationBadge({ userId }: LiveBadgeProps) {
  const firestore = useFirestore();
  const [notifQuery, setNotifQuery] = React.useState<any>(null);

  React.useEffect(() => {
    if (firestore && userId) {
      setNotifQuery(
        query(
          collection(firestore, 'user_notifications'),
          where('userId', '==', userId),
          where('isRead', '==', false)
        )
      );
    }
  }, [firestore, userId]);

  const { data: notifications } = useCollection(notifQuery);
  const unreadCount = notifications ? notifications.length : 0;

  // সাউন্ড এবং ভাইব্রেশন ট্র্যাকিং করার জন্য Ref
  const prevCountRef = React.useRef<number>(0);

  React.useEffect(() => {
    // প্রথমবার ডেটা লোড হওয়া বাদ দিয়ে, শুধুমাত্র নতুন নোটিফিকেশন কাউন্ট বাড়লে সাউন্ড হবে
    if (prevCountRef.current !== undefined && unreadCount > prevCountRef.current) {
      // ১. সাউন্ড প্লে করার কোড
      const audio = new Audio('/notification.mp3'); // ফাইলটি আপনার public/ ফোল্ডারে থাকতে হবে
      audio.play().catch((err) => console.log("সাউন্ড প্লে করার জন্য ব্যবহারকারীর স্ক্রিনে একবার ক্লিক করা লাগবে: ", err));

      // ২. ভাইব্রেশন কোড (২০০ মিলিসেকেন্ড)
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200);
      }
    }
    // বর্তমান কাউন্টটি সেভ করে রাখা হচ্ছে পরবর্তী চেক করার জন্য
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  return unreadCount > 0 ? (
    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse z-50">
      {unreadCount}
    </span>
  ) : null;
}
