'use strict';
'use client';

import React from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';

interface LiveDropdownListProps {
  userId: string | undefined;
}

export default function LiveDropdownList({ userId }: LiveDropdownListProps) {
  const firestore = useFirestore();
  const [notifQuery, setNotifQuery] = React.useState<any>(null);

  React.useEffect(() => {
    if (firestore && userId) {
      setNotifQuery(
        query(
          collection(firestore, 'user_notifications'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        )
      );
    }
  }, [firestore, userId]);

  const { data: notifList, loading } = useCollection(notifQuery);

  // নোটিফিকেশনে ক্লিক করলে ডাটাবেজে isRead: true করার মেকানিজম
  const handleNotifClick = async (notifId: string, isRead: boolean) => {
    if (!firestore) return;
    if (!isRead) {
      try {
        const docRef = doc(firestore, 'user_notifications', notifId);
        await updateDoc(docRef, { isRead: true });
      } catch (err) {
        console.error("Error marking as read:", err);
      }
    }
    // ক্লিক করার পর সরাসরি notice-board পেজে নিয়ে যাবে
    window.location.href = '/dashboard/notice-board';
  };

  if (loading) {
    return <div className="p-4 text-center text-xs text-gray-400">Loading...</div>;
  }

  return !notifList || notifList.length === 0 ? (
    <div className="p-4 text-center text-xs text-gray-400">No notifications yet</div>
  ) : (
    <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 p-1 space-y-1">
      {notifList.map((notif: any) => (
        <div 
          key={notif.id} 
          onClick={() => handleNotifClick(notif.id, notif.isRead)}
          className={`p-2 text-left rounded transition-colors hover:bg-gray-50 cursor-pointer ${
            !notif.isRead ? 'bg-blue-50/40 border-l-2 border-blue-500' : ''
          }`}
        >
          <p className={`text-xs font-bold ${!notif.isRead ? 'text-blue-900' : 'text-gray-800'}`}>
            {notif.title}
          </p>
          <p className="text-[11px] text-gray-600 mt-0.5 break-words">{notif.message}</p>
        </div>
      ))}
    </div>
  );
}
