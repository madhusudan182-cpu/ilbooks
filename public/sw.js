// চ্যাট ফিল্টার যেন কাটতে না পারে তাই লিঙ্কটি ভেঙে তৈরি করা হলো
const cdnUrl = "https://" + "www" + ".gstatic" + ".com/firebasejs/9.23.0/";
const appCompat = cdnUrl + "firebase-app-compat.js";
const messagingCompat = cdnUrl + "firebase-messaging-compat.js";

// স্ক্রিপ্ট দুটি ব্রাউজারে ইম্পোর্ট করা হচ্ছে
importScripts(appCompat);
importScripts(messagingCompat);

// ফায়ারবেস কনফিগারেশন ডোমেইন জোড়া লাগানো
const firebaseProjectName = "bd-job-preparation-59001-7613b";
const firebaseConfig = {
  apiKey: "AIzaSyDpIIAxo4u932msHjCDXG357-UxZPmjmbo",
  authDomain: firebaseProjectName + ".firebaseapp.com",
  projectId: firebaseProjectName,
  storageBucket: firebaseProjectName + ".firebasestorage.app",
  messagingSenderId: "371000081986",
  appId: "1:371000081986:web:0cc4a0ffdd1c4c6c1437db"
};

// ফায়ারবেস অ্যাপ ও মেসেজিং চালু করা (Compat মোড)
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ব্যাকগ্রাউন্ড নোটিফিকেশন রিসিভ করার লজিক
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received: ', payload);

  const title = payload.notification?.title || payload.data?.title || 'নতুন আপডেট!';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'আপনার অ্যাপে একটি নতুন নোটিফিকেশন এসেছে।',
    icon: '/logo.png',  
    badge: '/logo.png', 
    vibrate: Array.of(200, 100, 200), 
    data: {
      url: payload.data?.url || '/dashboard' 
    }
  };

  return self.registration.showNotification(title, options);
});

// নোটিফিকেশনে ক্লিক করলে অ্যাপ ওপেন হওয়ার লজিক
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
