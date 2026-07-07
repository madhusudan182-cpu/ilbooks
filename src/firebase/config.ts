import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
// নোটিফিকেশন সার্ভিসটি ইমপোর্ট করা হলো
import { getMessaging } from "firebase/messaging";


export const firebaseConfig = {
  apiKey: "AIzaSyDpIIAxo4u932msHjCDXG357-UxZPmjmbo",
  authDomain: "://firebaseapp.com",
  projectId: "bd-job-preparation-59001-7613b",
  storageBucket: "bd-job-preparation-59001-7613b.firebasestorage.app",
  messagingSenderId: "371000081986",
  appId: "1:371000081986:web:0cc4a0ffdd1c4c6c1437db",
  measurementId: ""
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// অফলাইন ক্যাশিং অন রেখে ফায়ারস্টোর ডাটাবেজ ইনিশিয়ালাইজ করা হলো
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});


// মেসেজিং সার্ভিসটি ক্লায়েন্ট সাইডের জন্য এক্সপোর্ট করা হলো
export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;
