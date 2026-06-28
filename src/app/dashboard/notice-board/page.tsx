'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection, query, where, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

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
    const qSocial = query(socialNotifRef, where('targetUserId', '==', userId)); // 👈 আপনার স্ক্রিনশট অনুযায়ী targetUserId দিয়ে ফিল্টার করা

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

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
      <div className="mb-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs border border-gray-200 rounded px-2 py-1 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1 text-xl font-headline">
            <Bell className="w-6 h-6 text-primary" />
            All Notifications
          </CardTitle>
          <CardDescription>
            Here is a list of your recent activity and admin notices.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {allNotifications && allNotifications.length > 0 ? (
            <div className="space-y-4">
              {allNotifications.map((notification, index) => {
                const isReadStatus = notification.sourceCollection === 'user_notifications' 
                  ? notification.isRead 
                  : notification.isSeen;

                return (
                  <div 
                    key={notification.id || index} 
                    className={`flex items-start gap-4 p-4 border-b last:border-b-0 rounded-lg transition-colors ${
                      isReadStatus ? 'bg-transparent opacity-75' : 'bg-purple-50/40 border-l-4 border-l-purple-600'
                    }`}
                  >
                    <div className="bg-muted p-2 rounded-full">
                      <Bell className={`w-5 h-5 ${isReadStatus ? 'text-muted-foreground' : 'text-purple-600'}`} />
                    </div>
                    <div className="flex-grow text-left">
                      <p className={`font-semibold ${isReadStatus ? 'text-gray-600' : 'text-purple-900'}`}>
                        {notification.title} 
                        {notification.sourceCollection === 'user_notifications' && (
                          <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-mono">Admin</span>
                        )}
                      </p>
                      <div className="text-sm text-gray-700 mt-0.5 break-words">
                      {(() => {
                        const type = notification.type;
                        const senderName = notification.senderName || 'Someone';
                        const senderId = notification.senderId; // আপনার ফায়ারবেস অবজেক্টের সেন্ডার আইডি

                        // নামের জন্য ক্লিকেবল লিংক কম্পোনেন্ট তৈরি করা
                        const NameLink = () => (
                          senderId ? (
                            <Link 
                              href={`/dashboard/profile/${senderId}`} 
                              className="font-bold text-orange-500 hover:underline cursor-pointer mr-1"
                            >
                              {senderName}
                            </Link>
                          ) : (
                            <span className="font-bold mr-1">{senderName}</span>
                          )
                        );

                        if (type === 'FOLLOW') {
                          return <span><NameLink />is following you.</span>;
                        }
                        if (type === 'UNFOLLOW') {
                          return <span><NameLink />has unfollowed you.</span>;
                        }
                        if (type === 'FOLLOW_BACK') {
                          return <span><NameLink />has followed you back.</span>;
                        }
                        if (type === 'LIKE') {
                          return <span><NameLink />liked your post.</span>;
                        }
                        if (type === 'COMMENT') {
                          return <span><NameLink />commented on your post.</span>;
                        }

                        // সাইন-আপ এবং অ্যাডমিন নোটিফিকেশনের জন্য সাধারণ টেক্সট
                        return <span>{notification.text || notification.message || ''}</span>;
                      })()}
                    </div>

                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatNotificationDate(notification.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              You have no new notifications.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
