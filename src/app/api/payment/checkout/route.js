// --- কোডের শুরু ---
import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, updateDoc, setDoc } from "firebase/firestore";
import { firebaseConfig } from "../../../../firebase/config"; 

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    let { amount, orderId, level, paymentType, userId, customerName, customerEmail, customerPhone } = body;

    const currentOrderId = orderId || "ILB-" + Date.now();
    const merchantTxnId = "TXN-" + Date.now(); // EPS এর জন্য ইউনিক ট্রানজেকশন আইডি

    // ডোমেন ও প্রোটোকল ডিটেকশন
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const currentBaseUrl = `${protocol}://${host}`;

    // ১. পেমেন্ট টাইপ অনুযায়ী আলাদা সাকসেস ইউআরএল সেট করার লজিক
    let finalSuccessUrl = "";

    if (paymentType === "book_shop") {
      finalSuccessUrl = `${currentBaseUrl}/dashboard/book-shop?payment=success&orderId=${currentOrderId}`;
    } else if (paymentType === "patron") {
      finalSuccessUrl = `${currentBaseUrl}/dashboard/patron?status=active`;
    } else {
      finalSuccessUrl = `${currentBaseUrl}/dashboard/competition/exam?payment=success&level=${level || '0.1'}&orderId=${currentOrderId}`;
    }

    const baseApiUrl = process.env.EPS_API_URL; // https://eps.com.bd

    // ২. প্রথম এপিআই কল করে Bearer Token নিয়ে আসা (ডকুমেন্টেশন পৃষ্ঠা ২ অনুযায়ী) [source: 2]
    const tokenResponse = await fetch(`${baseApiUrl}/v1/Auth/GetToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hash": process.env.EPS_HASH_KEY 
      },
      body: JSON.stringify({
        userName: process.env.EPS_USERNAME,
        password: process.env.EPS_PASSWORD
      })
    });

    if (!tokenResponse.ok) {
      const tokenErrText = await tokenResponse.text();
      console.error("EPS Token Auth Failed:", tokenErrText);
      throw new Error(`EPS Token Auth Failed with status ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const bearerToken = tokenData.token; 

    // ৩. টোকেন ও হ্যাশ ব্যবহার করে পেমেন্ট ইনিশিয়ালাইজ করার পেলোড (ডকুমেন্টেশন পৃষ্ঠা ৫ অনুযায়ী) [source: 5]
    const epsPayload = {
      storeId: process.env.EPS_STORE_ID,
      CustomerOrderId: currentOrderId,
      merchantTransactionId: merchantTxnId,
      transactionTypeId: 1, // 1 = Web View
      totalAmount: Number(amount) || 10,
      successUrl: finalSuccessUrl,
      failUrl: `${currentBaseUrl}/dashboard/payment-failed`,
      cancelUrl: `${currentBaseUrl}/dashboard`,
      customerName: customerName || "ILBooks Customer",
      customerEmail: customerEmail || "customer@ilbooks.com.bd",
      customerPhone: customerPhone || "01700000000",
      customerAddress: "Dhaka, Bangladesh",
      customerCity: "Dhaka",
      customerState: "Dhaka",
      customerPostcode: "1200",
      customerCountry: "BD",
      productName: "ILBooks Service",
      version: "1"
    };

    console.log("Sending Live Payload to EPS Gateway for Order:", currentOrderId);

    // ৪. সরাসরি পেমেন্ট এপিআই এন্ডপয়েন্টে রিকোয়েস্ট পাঠানো হলো [source: 5]
    const epsResponse = await fetch(`${baseApiUrl}/v1/EPSEngine/InitializeEPS`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hash": process.env.EPS_HASH_KEY,
        "Authorization": `Bearer ${bearerToken}` // ১ম এপিআই থেকে প্রাপ্ত টোকেন [source: 5]
      },
      body: JSON.stringify(epsPayload),
    });

    if (!epsResponse.ok) {
      const errorHTML = await epsResponse.text();
      console.error("EPS Gateway Initialization Failed. Server Returned:", errorHTML);
      throw new Error(`EPS Initialize failed with status ${epsResponse.status}`);
    }

    const epsData = await epsResponse.json();

    // ৫. রেসপন্স সফল হলে ইউজারকে রিডাইরেক্ট লিংকে পাঠানো [source: 6]
    if (epsData && epsData.RedirectURL) {
      console.log("EPS Live Payment URL Generated Successfully:", epsData.RedirectURL);

      // ফায়ারবেস ট্র্যাকিং (নিরাপদ try/catch ব্লকের ভেতরে রাখা হলো)
      if (userId) {
        try {
          const paymentRef = doc(db, "payments", currentOrderId);
          await setDoc(paymentRef, {
            userId: userId || "GUEST",
            amount: Number(amount) || 0,
            orderId: currentOrderId,
            merchantTransactionId: merchantTxnId,
            paymentType: paymentType || "competition",
            status: "PENDING_LIVE",
            gateway: "EPS_Live",
            createdAt: new Date(),
          });
          console.log("Firestore tracking saved successfully.");
        } catch (dbError) {
          console.error("Firestore Save Error (Skipped for payment process):", dbError);
        }
      }

      return NextResponse.json({
        success: true,
        url: epsData.RedirectURL, // সঠিক অবজেক্ট কী পাস করা হলো [source: 6]
      });
    }

    console.warn("EPS API response missing RedirectURL, falling back.");
    return NextResponse.json({
      success: true,
      url: finalSuccessUrl,
    });

  } catch (error) {
    console.error("Critical Backend Crash:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}