const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendChatNotification = functions.firestore
  .document("messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const messageData = snapshot.data();
    if (!messageData) return null;
    
    const receiverId = messageData.receiverId;
    const messageText = messageData.text;
    const senderId = messageData.senderId;

    if (!receiverId) return null;

    try {
      const userDoc = await admin.firestore().collection("users").doc(receiverId).get();
      const senderDoc = await admin.firestore().collection("users").doc(senderId).get();
      
      if (!userDoc.exists) return null;

      const receiverData = userDoc.data();
      const senderData = senderDoc.exists ? senderDoc.data() : { name: "কেউ একজন" };
      
      const targetToken = receiverData.fcmToken;

      if (!targetToken) {
        console.log("ইউজারের fcmToken ডেটাবেজে পাওয়া যায়নি।");
        return null;
      }

      const payload = {
        notification: {
          title: senderData.name || "নতুন মেসেজ এসেছে!",
          body: messageText || "আপনাকে একটি নতুন মেসেজ পাঠানো হয়েছে।",
        },
        data: {
          url: "/dashboard/messages", 
        },
        token: targetToken
      };

      const response = await admin.messaging().send(payload);
      console.log("ব্যাকগ্রাউন্ড পুশ নোটিফিকেশন সফলভাবে পাঠানো হয়েছে:", response);
      return response;

    } catch (error) {
      console.error("নোটিফিকেশন পুশ করতে এরর হয়েছে:", error);
      return null;
    }
  });
