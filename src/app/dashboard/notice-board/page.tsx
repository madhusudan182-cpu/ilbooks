'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection, query, where, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { or } from 'firebase/firestore';


interface NotificationItem {
  id: string;
  title: string;
  text?: string;       // আপনার ফায়ারবেস অনুযায়ী
  message?: string;    // এডমিন কালেকশনের জন্য ফলব্যাক
  isSeen?: boolean;    // আপনার ফায়ারবেস অনুযায়ী
  isRead?: boolean;    // এডমিন কালেকশনের জন্য ফলব্যাক
  createdAt?: any;
  targetUserId?: string; // আপনার ফায়ারবেস অনুযায়ী
  userId?: string;       // এডমিন কালেকশনের জন্য ফলব্যাক
  sourceCollection: 'user_notifications' | 'notifications';
  type?: string;        // নোটিফিকেশনের অ্যাকশন টাইপ চেনার জন্য
  senderName?: string;
  senderId?: string;
  postId?: string;
}

export default function NoticeBoardPage() {
  const firestore = useFirestore();
  const [userId, setUserId] = useState<string | null>(null);
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ১. বর্তমান লগইন থাকা ইউজার আইডি ট্র্যাক করা
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  // ২. আপনার রিয়েল ডাটাবেজ ফিল্ড অনুযায়ী দুটি কালেকশন থেকে লাইভ ডাটা আনা
  useEffect(() => {
    if (!firestore || !userId) return;

    // কুয়েরি A: এডমিন নোটিফিকেশন
    const adminNotifRef = collection(firestore, 'user_notifications');
    const qAdmin = query(adminNotifRef, where('userId', '==', userId));

    // কুয়েরি B: আপনার নতুন সাইন-আপ ও সোশ্যাল নোটিফিকেশন (সরাসরি notifications কালেকশন)
    const socialNotifRef = collection(firestore, 'notifications');
    const qSocial = query(
      socialNotifRef, 
      or(
        where('targetUserId', '==', userId),
        where('userId', '==', userId) // যদি ফলো ফাংশন targetUserId না পাঠিয়ে userId পাঠায়
      )
    );// 👈 আপনার স্ক্রিনশট অনুযায়ী targetUserId দিয়ে ফিল্টার করা

    let adminList: NotificationItem[] = [];
    let socialList: NotificationItem[] = [];

    const getMs = (dateObj: any) => {
      if (!dateObj) return 0;
      if (typeof dateObj.toDate === 'function') return dateObj.toDate().getTime();
      return new Date(dateObj).getTime() || 0;
    };

    const combineAndSort = () => {
      const combined = [...adminList, ...socialList];
      combined.sort((a, b) => getMs(b.createdAt) - getMs(a.createdAt));
      setAllNotifications(combined);
      setLoading(false);
    };

    const unsubscribeAdmin = onSnapshot(qAdmin, (snapshot) => {
      adminList = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        sourceCollection: 'user_notifications',
        ...docSnap.data()
      } as NotificationItem));
      combineAndSort();
    }, () => setLoading(false));

    const unsubscribeSocial = onSnapshot(qSocial, (snapshot) => {
      socialList = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        sourceCollection: 'notifications',
        ...docSnap.data()
      } as NotificationItem));
      combineAndSort();
    }, () => setLoading(false));

    return () => {
      unsubscribeAdmin();
      unsubscribeSocial();
    };
  }, [firestore, userId]);

  useEffect(() => {
  if (!firestore || !userId || allNotifications.length === 0) return;

  const markAllAsRead = async () => {
    const promises = allNotifications.map((notif) => {
      // যদি অলরেডি পঠিত হয়ে থাকে তবে স্কিপ করবে
      const alreadyRead = notif.sourceCollection === 'user_notifications' 
        ? notif.isRead 
        : notif.isSeen;

      if (alreadyRead) return Promise.resolve();

      const docRef = doc(firestore, notif.sourceCollection, notif.id);

      // এখানে ব্র্যাকেট এবং টার্নারি অপারেটরটি সঠিকভাবে ফিক্স করা হয়েছে
      return updateDoc(docRef, notif.sourceCollection === 'user_notifications'
        ? { isRead: true }
        : { isSeen: true }
      );
    });

    await Promise.all(promises);
  };

  markAllAsRead().catch(err => console.error("Error marking all read:", err));
}, [firestore, userId, allNotifications]);




  const formatNotificationDate = (dateObj: any) => {
    if (!dateObj) return 'Just now';
    try {
      const parsedDate = typeof dateObj.toDate === 'function' ? dateObj.toDate() : new Date(dateObj);
      return parsedDate.toLocaleDateString();
    } catch {
      return 'Just now';
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Loading notifications...</div>;
  }

    const handleUserClick = (e: React.MouseEvent, senderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/dashboard/profile/${senderId}`;
  };

  const handlePostClick = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/dashboard/profile#post-${postId}`;
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading notifications...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-800">Notifications</h1>
      
      {!allNotifications || allNotifications.length === 0 ? (
        <div className="p-8 text-center text-slate-400 bg-white rounded-lg border">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-2">
          {allNotifications.map((notification: any) => {
            const isSeen = notification.sourceCollection === 'user_notifications' 
              ? notification.isRead 
              : notification.isSeen;

            return (
              <div 
                key={notification.id} 
                className={`flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors ${
                  !isSeen ? "bg-orange-50/40 border-l-4 border-l-orange-500" : "bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={notification.senderAvatar} alt={notification.senderName} />
                    <AvatarFallback>{notification.senderName ? notification.senderName.charAt(0) : 'U'}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="text-sm text-slate-700">
                      {notification.title ? (
                        // সিস্টেম/স্বাগতম/কমপ্লেন নোটিফিকেশনের জন্য
                        <div>
                          <span className="font-bold text-blue-600 block text-sm font-headline mb-0.5">
                            {notification.title}
                          </span>
                          <p className="text-slate-600 text-xs leading-relaxed">
                            {notification.text || notification.message}
                          </p>
                        </div>
                      ) : (
                        // সাধারণ সোশ্যাল ও ফলো/ব্লক নোটিফিকেশনের জন্য (১০০% ফিক্সড)
                        <>
                          {/* ১. ইউজারের নাম যা ক্লিকেবল এবং অরেঞ্জ কালার */}
                          <span
                            onClick={(e) => handleUserClick(e, notification.senderId || '')}
                            className="font-bold text-orange-500 hover:text-orange-600 hover:underline cursor-pointer mr-1"
                          >
                            {notification.senderName || 'Someone'}
                          </span>

                          {/* ২. সব কন্ডিশন চেক করে মেসেজ ইংরেজিতে কনভার্ট করা */}
                          {(() => {
                            const type = notification.type;
                            const textVal = notification.text || '';
                            
                            // লাইক (LIKE) নোটিফিকেশন
                            if (type === 'LIKE') {
                              return (
                                <>
                                  liked your{' '}
                                  <span
                                    onClick={(e) => handlePostClick(e, notification.postId || '')}
                                    className="font-bold text-pink-500 hover:text-pink-600 hover:underline cursor-pointer"
                                  >
                                    post
                                  </span>
                                </>
                              );
                            }
                            
                            // কমেন্ট (COMMENT) নোটিফিকেশন
                            if (type === 'COMMENT') {
                              return (
                                <>
                                  commented on your{' '}
                                  <span
                                    onClick={(e) => handlePostClick(e, notification.postId || '')}
                                    className="font-bold text-pink-500 hover:text-pink-600 hover:underline cursor-pointer"
                                  >
                                    post
                                  </span>
                                </>
                              );
                            }
                            
                            // ফলো (FOLLOW) নোটিফিকেশন
                            if (type === 'FOLLOW' || textVal.includes('ফলো করেছেন')) {
                              return 'is following you.';
                            }
                            
                            // ফলো ব্যাক (FOLLOW_BACK) নোটিফিকেশন
                            if (type === 'FOLLOW_BACK' || textVal.includes('ফলো ব্যাক')) {
                              return 'is following you back.';
                            }
                            
                            // আনফলো (UNFOLLOW) নোটিফিকেশন
                            if (type === 'UNFOLLOW' || textVal.includes('আনফলো')) {
                              return 'has unfollowed you.';
                            }
                            
                            // ব্লক (BLOCK) নোটিফিকেশন
                            if (type === 'BLOCK' || textVal.includes('ব্লক')) {
                              return 'has blocked you.';
                            }

                            // কোনো কন্ডিশন না মিললে ব্যাকআপ হিসেবে ডেটাবেজের লেখা দেখাবে
                            return textVal || notification.message || 'interacted with your profile.';
                          })()}
                        </>
                      )}

                    </div>
                  </div>
                </div>                
                {!isSeen && (
                  <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0 ml-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
