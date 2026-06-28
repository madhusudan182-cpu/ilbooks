import { collection, doc, setDoc, query, where, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

/**
 * আপনার নতুন ডাটাবেজ স্কিমা অনুযায়ী সোশ্যাল নোটিফিকেশন ট্রিগার করার চূড়ান্ত ফাংশন
 */
export const triggerSocialNotification = async (
  firestore: any,
  receiverUserId: string,  // যে নোটিফিকেশন পাবে (targetUserId)
  currentUser: any,        // যে অ্যাকশনটি করছে (auth.currentUser)
  type: 'LIKE' | 'COMMENT' | 'SHARE' | 'FOLLOW' | 'FOLLOW_BACK' | 'UNFOLLOW',
  relatedPostId: string = "" 
) => {
  if (!firestore || !currentUser?.uid || !receiverUserId) return;
  if (receiverUserId === currentUser.uid) return;

  const notifCollectionRef = collection(firestore, 'notifications'); // 👈 সাব-কালেকশন ছাড়া সরাসরি মেইন কালেকশন

  // ১. আনফলো (UNFOLLOW) করলে আগের তৈরি হওয়া নোটিফিকেশন রিমুভ করা
  if (type === 'UNFOLLOW') {
    try {
      const q = query(
        notifCollectionRef,
        where('senderId', '==', currentUser.uid),
        where('targetUserId', '==', receiverUserId),
        where('type', '==', 'FOLLOW')
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (documentSnap) => {
        await deleteDoc(doc(firestore, 'notifications', documentSnap.id));
      });
    } catch (e) {
      console.error("Error cleaning follow notification:", e);
    }
    return;
  }

  // ২. আপনার পছন্দ অনুযায়ী সোশ্যাল মেসেজ জেনারেটর
  let title = "Social Update";
  let messageText = "";

  switch (type) {
    case 'LIKE':
      title = "New Like";
      messageText = "আপনার পোস্টে লাইক দিয়েছেন।";
      break;
    case 'COMMENT':
      title = "New Comment";
      messageText = "আপনার পোস্টে একটি মন্তব্য করেছেন।";
      break;
    case 'SHARE':
      title = "Post Shared";
      messageText = "Your post has been shared.";
      break;
    case 'FOLLOW':
      title = "New Follower";
      messageText = "আপনাকে ফলো করা শুরু করেছেন।";
      break;
    case 'FOLLOW_BACK':
      title = "Follow Back";
      messageText = "আপনাকে ফলো ব্যাক করেছেন।";
      break;
  }

  try {
    // ৩. আপনার ডাটাবেজের ফিল্ডের নাম অনুযায়ী ডকুমেন্ট সেভ করা
    const newNotifDocRef = doc(notifCollectionRef);
    await setDoc(newNotifDocRef, {
      title,
      text: messageText,
      type,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || "A bookworm",
      senderAvatar: currentUser.photoURL || "",
      targetUserId: receiverUserId,
      relatedId: relatedPostId,
      isSeen: false,
      createdAt: serverTimestamp() // এটি অবজেক্টের ভেতরে থাকবে
    });
    
    console.log(`Live notification triggered successfully for type: ${type}`);
  } catch (error) {
    console.error("Failed to inject live notification:", error);
  }
};

// utils/notifications.ts
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// অ্যাপ ইনিশিয়ালাইজ করা (Server-Side Error এড়ানোর জন্য)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const requestAndGetFCMToken = async (registration?: ServiceWorkerRegistration) => {
  try {
    if (typeof window === "undefined") return null;

    // ১. ব্রাউজারের নোটিফিকেশন পারমিশন চেক করা
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied.");
      return null;
    }

    // ২. মেসেজিং ইনিশিয়ালাইজ করা
    const messaging = getMessaging(app);

    // ৩. FCM টোকেন জেনারেট করা
    const currentToken = await getToken(messaging, {
      vapidKey: "YOUR_FIREBASE_VAPID_KEY", // আপনার ফায়ারবেস কনসোলের আসল VAPID Key এখানে দিন
      serviceWorkerRegistration: registration // এই লাইনটি এখানে যোগ করুন
    });

    if (currentToken) {
      console.log("FCM Token:", currentToken);
      // TODO: এই টোকেনটি আপনার Firestore ডাটাবেজে ইউজারের ডকুমেন্টের আন্ডারে সেভ করে রাখুন।
      return currentToken;
    } else {
      console.log("No registration token available. Request permission to generate one.");
      return null;
    }
  } catch (error) {
    console.error("An error occurred while retrieving token:", error);
    return null;
  }
};

// ফোরগ্রাউন্ড (অ্যাপ ওপেন থাকা অবস্থায়) মেসেজ শো করার লজিক
export const listenToForegroundMessages = () => {
  if (typeof window === "undefined") return;
  const messaging = getMessaging(app);
  
  onMessage(messaging, (payload) => {
    console.log("Foreground Message received: ", payload);
    // আপনি এখানে ব্রাউজারে কাস্টম টোস্ট বা অ্যালার্ট দেখাতে পারেন
    alert(`${payload.notification?.title}: ${payload.notification?.body}`);
  });
};
