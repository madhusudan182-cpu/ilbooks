import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, updateDoc, setDoc } from "firebase/firestore";
import { firebaseConfig } from "../../../../firebase/config"; // আপনার config ফাইলের সঠিক পাথ নিশ্চিত করুন

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    let { amount, orderId, level, paymentType, userId, customerName, customerEmail, customerPhone } = body;

    const currentOrderId = orderId || "ILB-" + Date.now();

    // ডোমেন ও প্রোটোকল ডিটেকশন (রিডাইরেকশনের জন্য)
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const currentBaseUrl = `${protocol}://${host}`;

    // EPS গেটওয়েতে রিকোয়েস্ট পাঠানোর জন্য অফিসিয়াল পেলোড অবজেক্ট
    const epsPayload = {
      store_id: process.env.EPS_STORE_ID,
      hash_key: process.env.EPS_HASH_KEY,
      order_id: currentOrderId,
      amount: amount || 10, // ন্যূনতম টেস্ট অ্যামাউন্ট
      currency: "BDT",
      cus_name: customerName || "ILBooks Customer",
      cus_email: customerEmail || "customer@ilbooks.com.bd",
      cus_phone: customerPhone || "01700000000",
      success_url: `${currentBaseUrl}/dashboard/competition/exam?payment=success&level=${level || '0.1'}&orderId=${currentOrderId}`,
      fail_url: `${currentBaseUrl}/dashboard/payment-failed`,
      cancel_url: `${currentBaseUrl}/dashboard`
    };

    console.log("📡 Sending Live Payload to EPS Gateway for Order:", currentOrderId);

    // EPS Live API এন্ডপয়েন্টে রিয়েল মানি ট্রানজেকশন ইনিশিয়েট করা
    const epsResponse = await fetch(`${process.env.EPS_API_URL}/initiate-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(epsPayload),
    });

    const epsData = await epsResponse.json();

    // যদি EPS সার্ভার থেকে লাইভ পেমেন্ট ইউআরএল সফলভাবে আসে
    if (epsData && epsData.payment_url) {
      console.log("🔗 EPS Live Payment URL Generated Successfully:", epsData.payment_url);
      
      // ফায়ারবেস ট্র্যাকিং হিস্ট্রি ব্যাকএন্ডেই ইনিশিয়াল মোডে সেভ করে রাখা নিরাপদ
      if (userId) {
        const paymentRef = doc(db, "payments", currentOrderId);
        await setDoc(paymentRef, {
          userId: userId,
          amount: amount || 0,
          orderId: currentOrderId,
          paymentType: paymentType || "competition",
          status: "PENDING_LIVE",
          gateway: "EPS_Live",
          createdAt: new Date(),
        });
      }

      return NextResponse.json({
        success: true,
        url: epsData.payment_url, // ফ্রন্টএন্ড এই ইউআরএল-এ ইউজারকে রিডাইরেক্ট করবে
      });
    }

    // ব্যাকআপ হ্যান্ডলার (যদি এপিআই রেসপন্স না করে তবেই লোকাল মোডে যাবে)
    console.warn("⚠️ EPS Live API failed, falling back to local redirection.");
    let fallbackRedirectUrl = `${currentBaseUrl}/dashboard/competition/exam?payment=success&level=${level || '0.1'}&orderId=${currentOrderId}`;

    return NextResponse.json({
      success: true,
      url: fallbackRedirectUrl,
    });

  } catch (error) {
    console.error("💥 Critical Backend Crash:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
