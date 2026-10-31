// // ফাইলের শুরু হবে প্রয়োজনীয় প্যাকেজ ইম্পোর্ট করার মাধ্যমে
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

// ফায়ারবেস কনসোল থেকে প্রাপ্ত একদম সঠিক কনফিগারেশন বসানো হলো
export const firebaseConfig = {
  apiKey: "AIzaSyDpIIAxo4u932msHjCDXG357-UxZPmjmbo",
  authDomain: "://firebaseapp.com",
  projectId: "bd-job-preparation-59001-7613b",
  storageBucket: "bd-job-preparation-59001-7613b.firebasestorage.app",
  messagingSenderId: "371000081986",
  appId: "1:371000081986:web:cfdac1c1aef828cb1437db", // আপনার আসল অ্যাপ আইডি
  measurementId: "G-SCJY1ZRQNN" // আপনার আসল মেজারমেন্ট আইডি
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// অফলাইন ক্যাশিং অন রেখে ফায়ারস্টোরের ডেটাবেজ ইনিশিয়ালাইজ করা হলো
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// উইন্ডো ও নোটিফিকেশন সাপোর্ট চেক করে মেসেজিং ইনস্ট্যান্স এক্সপোর্ট করা হলো
export const messaging = typeof window !== "undefined" && "Notification" in window
  ? getMessaging(app)
  : null as any;

// সরাসরি কোনো Promise না পাঠিয়ে ইনিশিয়ালাইজড অবজেক্ট রাখার জন্য ভেরিয়েবল
export let analytics: Analytics | null = null;

// ক্লায়েন্ট-সাইড এনভায়রনমেন্ট ও ব্রাউজার সাপোর্ট চেক করে অ্যানালিটিক্স সেটআপ
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
// // ফাইলের কোড এখানেই শেষ হলো
