'use strict';
'use client';
import { useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { db, messaging } from '@/firebase/config';
// আপনার প্রজেক্টের কাস্টম useUser হুকটি এখানে ইমপোর্ট করা হলো
import { useUser } from '@/firebase';

export default function NotificationInitializer() {
  //useUser এর মাধ্যমে কারেন্ট লগইন করা ইউজার এবং লোডিং স্টেট নেওয়া হলো
  const { user, loading } = useUser();

  useEffect(() => {
    // ইউজার যখন সম্পূর্ণ লগইন অবস্থায় থাকবে এবং মেসেজিং সচল থাকবে, তখনই কেবল এটি রান হবে
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && messaging && user?.uid && !loading) {
      
      // ১. সার্ভিস ওয়ার্কার রেজিস্টার করা
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker Registered Successfully:', registration);
          
          // ২. ব্রাউজারের নোটিফিকেশন পারমিশন চেক করা
          if (Notification.permission === 'granted') {
            getAndSaveToken(registration, user.uid);
          } else if (Notification.permission === 'default') {
            Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                getAndSaveToken(registration, user.uid);
              }
            });
          }
        })
        .catch((error) => {
          console.error('Service Worker Registration Failed:', error);
        });
    }
  }, [user, loading]); // ইউজার লগইন হওয়ার সাথে সাথে এটি পুনরায় চেক করবে

  // ফায়ারবেস থেকে টোকেন নিয়ে ফায়ারস্টোরে সেভ করার ফাংশন
  const getAndSaveToken = async (registration: ServiceWorkerRegistration, uid: string) => {
    try {
      if (!messaging || !uid) return;

      // টোকেন জেনারেট করা হচ্ছে
      const currentToken = await getToken(messaging, {
        serviceWorkerRegistration: registration,
      });

      if (currentToken) {
        console.log('FCM Token Generated Successfully:', currentToken);
        
        const userRef = doc(db, 'users', uid);
        // সরাসরি আসল ফায়ারবেস uid এর ঘরে fcmToken-টি আপডেট করে দেওয়া হলো
        await updateDoc(userRef, {
          fcmToken: currentToken
        });
        console.log('FCM Token successfully saved to Firestore for user:', uid);
      } else {
        console.log('No registration token available.');
      }
    } catch (err) {
      console.error('An error occurred while retrieving token:', err);
    }
  };

  return null;
}
