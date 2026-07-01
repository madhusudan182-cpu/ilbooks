'use strict';
'use client';
import { useEffect } from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getMessaging, getToken } from 'firebase/messaging';

// আপনার অ্যাপে বর্তমানে যে ইউজার লগইন করে আছে তার ID আমরা লোকাল স্টোরেজ থেকে নেব
// (আপনার প্রজেক্টের রিয়েল সেটআপ অনুযায়ী এটি পরিবর্তিত হতে পারে)
const getCurrentUserId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userId') || ''; 
  }
  return '';
};

export default function NotificationInitializer() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      
      // ১. ব্যাকগ্রাউন্ড পুশ নোটিফিকেশনের সার্ভিস ওয়ার্কার রেজিস্টার করা
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker Registered Successfully:', registration);
          
          // ২. ব্রাউজারে নোটিফিকেশন পারমিশন চেক ও টোকেন জেনারেট করা
          if (Notification.permission === 'granted') {
            getAndSaveToken(registration);
          } else if (Notification.permission === 'default') {
            Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                getAndSaveToken(registration);
              }
            });
          }
        })
        .catch((error) => {
          console.error('Service Worker Registration Failed:', error);
        });
    }
  }, []);

  // ফায়ারবেস থেকে টোকেন নিয়ে ডেটাবেজে সেভ করার ফাংশন
  const getAndSaveToken = async (registration: ServiceWorkerRegistration) => {
    try {
      const messaging = getMessaging();
      const currentToken = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        // আপনার ফায়ারবেস কনসোলের Cloud Messaging সেকশন থেকে VAPID Key লাগতে পারে, আপাতত এটি এভাবে ট্রাই করুন
      });

      if (currentToken) {
        console.log('FCM Token Generated:', currentToken);
        const userId = getCurrentUserId();
        
        if (userId) {
          const db = getFirestore();
          const userRef = doc(db, 'users', userId);
          // ডেটাবেজে ইউজারের প্রোফাইলে fcmToken ফিল্ডটি যুক্ত/আপডেট করা হচ্ছে
          await updateDoc(userRef, {
            fcmToken: currentToken
          });
          console.log('FCM Token successfully saved to Firestore!');
        }
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } catch (err) {
      console.error('An error occurred while retrieving token:', err);
    }
  };

  return null;
}
