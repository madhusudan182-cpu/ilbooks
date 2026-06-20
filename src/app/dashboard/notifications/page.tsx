'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useFirestore } from "@/firebase"; // আপনার প্রোজেক্টের আসল কাস্টম হুক পাথ
import { Bell, Heart, MessageSquare, UserPlus, ShieldAlert, Loader2 } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch } from 'firebase/firestore';


export default function NotificationsPage() {
  const { user } = useUser();
  const dbInstance = useFirestore();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

    // 🎯 পয়েন্ট ৩: নোটিফিকেশন রিয়েল-টাইমে Descending Order-এ সাজানো (লকড ভার্সন)
  useEffect(() => {
    // 🔒 ফায়ারবেস ক্র্যাশ লক: ইউজার আইডি বা ডাটাবেজ কানেকশন সম্পূর্ণ রেডি না হওয়া পর্যন্ত কোড রান করবে না
    if (!user?.uid || !dbInstance) return;


    try {
      const q = query(
        collection(dbInstance, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, async (snapshot: any) => {
        const list: any[] = [];
        const unreadIds: string[] = [];

        snapshot.forEach((doc: any) => {
          const data = doc.data();
          list.push({ id: doc.id, ...data });
          if (!data.isRead) {
            unreadIds.push(doc.id);
          }
        });

        setNotifications(list);
        setLoading(false);

        // 🎯 পয়েন্ট ৫: ইউজার নোটিফিকেশন পেজে আসা মাত্রই ডাটাবেজে রিড (Read) করা
        if (unreadIds.length > 0) {
          try {
            const batch = writeBatch(dbInstance);
            unreadIds.forEach((id) => {
              const ref = doc(dbInstance, 'notifications', id);
              batch.update(ref, { isRead: true });
            });
            await batch.commit();
          } catch (error) {
            console.error("Error updating read status:", error);
          }
        }
      }, (error: any) => {
        console.error("Firestore Error:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Notifications page firestore lock caught error:", e);
    }
  }, [user?.uid, dbInstance]); // dbInstance যখনই সচল হবে, তখনই কেবল এটি রান করবে


  // নোটিফিকেশনের ধরণ অনুযায়ী ডায়নামিক কালারফুল আইকন জেনারেটর
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="h-5 w-5 text-red-500" />;
      case 'comment': return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'follow': return <UserPlus className="h-5 w-5 text-green-500" />;
      default: return <ShieldAlert className="h-5 w-5 text-purple-500" />;
    }
  };

  if (loading || !dbInstance) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50/50 min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-black">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        
        {/* হেডিং সেকশন (মাঝখানে এলাইন করা) */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h1>
          </div>
          <span className="text-xs bg-purple-50 text-purple-600 font-semibold px-2.5 py-1 rounded-full">
            Total: {notifications.length}
          </span>
        </div>

        {/* লাইভ নোটিফিকেশন কার্ড লুপ এরিয়া */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">
              No notifications yet. When people interact with your profile, it will show up here! 📬
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`flex gap-4 p-4 rounded-xl border border-gray-100 transition-all duration-200 ${
                  !notif.isRead ? 'bg-purple-50/20 border-purple-100/60 shadow-xs' : 'bg-white'
                }`}
              >
                <div className="flex-shrink-0 bg-slate-50 p-2.5 rounded-lg border border-gray-50 h-10 w-10 flex items-center justify-center">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1">
                  <div className="text-sm text-gray-700 leading-relaxed">
                    <span className="font-bold text-gray-900 mr-1">{notif.senderName || 'System'}</span>
                    {notif.text}
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-1">
                    {notif.createdAt?.toDate ? new Date(notif.createdAt.toDate()).toLocaleString() : 'Just now'}
                  </span>
                </div>

                {!notif.isRead && (
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
