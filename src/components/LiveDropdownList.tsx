'use client';

import React, { useEffect, useState } from 'react';
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
          collection(firestore, 'notifications'),
          where('targetUserId', '==', userId),
          where('isSeen', '==', false),
          orderBy('createdAt', 'desc')
        )
      );
    }
  }, [firestore, userId]);

  const { data: notifList, loading } = useCollection(notifQuery);

  // নোটিফিকেশনে ক্লিক করলে ডাটাবেজে আপডেট এবং সঠিক পেজে রিডাইরেক্ট করার মেকানিজম
  const handleNotifClick = async (notif: any) => {
    if (!firestore) return;

    if (!notif.isSeen) {
      try {
        const docRef = doc(firestore, 'notifications', notif.id);
        await updateDoc(docRef, { isSeen: true });
      } catch (err) {
        console.error("Error marking as seen:", err);
      }
    }

    // যদি নোটিফিকেশনটি LIKE বা COMMENT টাইপের হয়, তবে সরাসরি প্রোফাইলের নির্দিষ্ট পোস্টে নিয়ে যাবে
    if (notif.type === 'LIKE' || notif.type === 'COMMENT') {
      window.location.href = `/dashboard/profile#post-${notif.postId || ''}`;
    } else {
      // অন্য সব নোটিফিকেশনের জন্য আগের মতোই notice-board পেজে নিয়ে যাবে
      window.location.href = '/dashboard/notice-board';
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-xs text-gray-400">Loading...</div>;
  }

  return !notifList || notifList.length === 0 ? (
    <div className="p-4 text-center text-xs text-gray-400">No notifications yet</div>
  ) : (
    <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 p-1 space-y-1">
      {notifList.map((notif: any) => {
        let displayTitle = notif.title;
        let displayMessage = notif.message;

        if (notif.type === 'LIKE') {
          displayTitle = "New Like!";
          displayMessage = `${notif.senderName || 'Someone'} liked your post.`;
        } else if (notif.type === 'COMMENT') {
          displayTitle = "New Comment!";
          displayMessage = `${notif.senderName || 'Someone'} commented on your post.`;
        }

        return (
          <div
            key={notif.id}
            onClick={() => handleNotifClick(notif)}
            className={`p-2 text-left rounded transition-colors hover:bg-gray-50 cursor-pointer ${
              !notif.isSeen ? 'bg-blue-50/40 border-l-2 border-blue-500' : ''
            }`}
          >
            <p className={`text-xs font-bold ${!notif.isSeen ? 'text-blue-900' : 'text-gray-800'}`}>
              {displayTitle}
            </p>
            <p className="text-[11px] text-gray-600 mt-0.5 break-words">
              {displayMessage}
            </p>
          </div>
        );
      })}
    </div>
  );
}
