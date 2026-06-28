// public/firebase-messaging-sw.js

// সম্পূর্ণ সঠিক ও অফিশিয়াল ফায়ারবেস স্ক্রিপ্ট লিংক
importScripts('https://gstatic.com');
importScripts('https://gstatic.com');

// আপনার ফায়ারবেস কনফিগারেশন (সংশোধিত authDomain সহ)
const firebaseConfig = {
  apiKey: "AIzaSyDpIIAxo4u932msHjCDXG357-UxZPmjmbo",
  authDomain: "://firebaseapp.com",
  projectId: "bd-job-preparation-59001-7613b",
  storageBucket: "bd-job-preparation-59001-7613b.firebasestorage.app",
  messagingSenderId: "371000081986",
  appId: "1:371000081986:web:0cc4a0ffdd1c4c6c1437db"
};

// ফায়ারবেস অ্যাপ ইনিশিয়ালাইজ করা
firebase.initializeApp(firebaseConfig);

// মেসেজিং অবজেক্ট তৈরি
const messaging = firebase.messaging();

// ব্যাকগ্রাউন্ড নোটিফিকেশন রিসিভ করার লজিক
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received: ', payload);
  
  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
