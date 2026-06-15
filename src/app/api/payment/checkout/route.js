import { NextResponse } from "next/server";
import { db } from "../../../../firebase";
import { doc, updateDoc, setDoc } from "firebase/firestore";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { amount, orderId, level, paymentType, userId } = body; // ফ্রন্টএন্ড থেকে userId ও পাস করতে হবে

    const currentOrderId = orderId || "ILB-" + Date.now();
    const host = req.headers.get("host") || "localhost:9002";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const currentBaseUrl = `${protocol}://${host}`;

    let successRedirectUrl = `${currentBaseUrl}/dashboard`;

    // 💡 পেমেন্ট টাইপ অনুযায়ী ডায়নামিক রিডাইরেকশন লজিক
    if (paymentType === "book_shop") {
      // বই কেনার পর কাস্টমার বুকশপ বা অর্ডারের সাকসেস পেজে যাবে
      successRedirectUrl = `${currentBaseUrl}/dashboard/book-shop?payment=success&orderId=${currentOrderId}`;
    } else if (paymentType === "patron") {
      // পেট্রন সাবস্ক্রিপশন সফল হলে পেট্রন ড্যাশবোর্ডে যাবে
      successRedirectUrl = `${currentBaseUrl}/dashboard/patron?status=active`;
    } else {
      // আগের কোডটি পরিবর্তন করে এটি লিখুন
      successRedirectUrl = `${currentBaseUrl}/dashboard/competition/exam?payment=success&level=${level || '0.1'}&orderId=${currentOrderId}`;
    }


    // 🔥 ফায়ারবেস ফায়ারস্টোর ডাটাবেজ আপডেট লজিক
    if (userId) {
      try {
        const userRef = doc(db, "users", userId);
        
        // পেমেন্ট টাইপ অনুযায়ী ইউজারের প্রোফাইলে আলাদা ফিল্ড আপডেট
        if (paymentType === "patron") {
          await updateDoc(userRef, {
            isPatron: true,
            patronSince: new Date(),
          });
        } else if (paymentType === "book_shop") {
          // বই কিনলে ইউজারের কেনা বইয়ের লিস্টে অর্ডারের ট্র্যাক রাখা
          await updateDoc(userRef, {
            lastPurchasedOrderId: currentOrderId,
          });
        } else {
          // কম্পিটিশন বা ডিফল্ট এক্সামের ক্ষেত্রে লেভেল আপডেট
          // আগের কোডটি পরিবর্তন করে এটি লিখুন
        await updateDoc(userRef, {
          level: level || "0.1", // এখানে unlockedLevel এর জায়গায়   level হবে
          isPremium: true,
        });

        }

        // পেমেন্টের ট্র্যাকিং হিস্ট্রি আলাদা কালেকশনে জমা রাখা
        const paymentRef = doc(db, "payments", currentOrderId);
        await setDoc(paymentRef, {
          userId: userId,
          amount: amount || 0,
          orderId: currentOrderId,
          paymentType: paymentType || "competition",
          status: "COMPLETED",
          gateway: "EPS_Sandbox",
          createdAt: new Date(),
        });

        console.log("✅ Firestore updated successfully for order:", currentOrderId);
      } catch (dbError) {
        console.error("❌ Firestore update failed:", dbError);
        // ডাটাবেজ আপডেট ফেইল করলেও যেন গেটওয়ে ক্র্যাশ না করে, তাই মেইন ক্যাচে পাঠানো হলো না
      }
    } else {
      console.warn("⚠️ No userId found in request body. Firestore tracking skipped.");
    }

    console.log(`🔌 Sandbox Payment [Type: ${paymentType || 'exam'}] -> Redirecting to: ${successRedirectUrl}`);

    return NextResponse.json({
      success: true,
      url: successRedirectUrl
    });

  } catch (error) {
    console.error("💥 Critical Backend Crash:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { 
      status: 500 
    });
  }
}
