// ফাইলের শুরু হবে প্রয়োজনীয় প্যাকেজ ইম্পোর্ট করার মাধ্যমে
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import { getAnalytics, isSupported } from "firebase/analytics"; // এই লাইনটি যোগ করা হয়েছে

export const firebaseConfig = {
  apiKey: "AIzaSyDpIIAxo4u932msHjCDXG357-UxZPmjmbo",
  authDomain: "://firebaseapp.com",
  projectId: "bd-job-preparation-59001-7613b",
  storageBucket: "bd-job-preparation-59001-7613b.firebasestorage.app",
  messagingSenderId: "371000081986",
  appId: "1:371000081986:web:0cc4a0ffdd1c4c6c1437db",
  measurementId: "G-VNWG69V64Z" // আপনার সঠিক মেজারমেন্ট আইডি এখানে বসানো হয়েছে
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// অফলাইন ক্যাশিং অন রেখে ফায়ারস্টোরের ডেটাবেজ ইনিশিয়ালাইজ করা হলো
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// উইন্ডো ও নোটিফিকেশন সাপোর্ট চেক করে মেসেজিং ইনস্ট্যান্স এক্সপোর্ট করা হলো
export const messaging = typeof window !== "undefined" && "Notification" in window
  ? getMessaging(app)
  : null as any;

// ক্লায়েন্ট-সাইড এনভায়রনমেন্ট চেক করে অ্যানালিটিক্স এক্সপোর্ট করার মূল কোড
export const analytics = typeof window !== "undefined" 
  ? isSupported().then((supported) => (supported ? getAnalytics(app) : null))
  : null;
// ফাইলের কোড এখানেই শেষ হলো
