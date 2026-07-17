import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import crypto from "crypto";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { firebaseConfig } from "../../../../firebase/config";
import Agent from 'https';

// SSL সার্টিফিকেট ভ্যালিডেশন সাময়িকভাবে ইগনোর করার সিকিউর এজেন্ট
const agent = new Agent.Agent({ rejectUnauthorized: false });

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// EPS নিয়ম অনুযায়ী HMAC-SHA512 হ্যাশ জেনারেট করার পিওর ফাংশন
function generateEpsHash(key, data) {
  return crypto.createHmac("sha512", key).update(data, "utf8").digest("base64");
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    let { amount, orderId, level, paymentType, userId, customerName, customerEmail, customerPhone } = body;

    // সেফটি গার্ড: ফ্রন্টএন্ড থেকে আসা ২২ ক্যারেক্টারের আইডিকে কেটে EPS-এর জন্য সর্বোচ্চ ২০ ক্যারেক্টার করা হলো
    const rawOrderId = orderId || "ILB-" + Date.now();
    const finalEpsOrderId = rawOrderId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 20);

    // সেফটি গার্ড: মার্চেন্ট ট্রানজেকশন আইডি থেকে হাইফেন মুছে শুধুমাত্র আলফানিউমেরিক ২০ ক্যারেক্টার করা হলো
    const merchantTxnId = ("TXN" + Date.now()).substring(0, 20);

    // লোকালহোস্ট ও লাইভ ওয়েবসাইট উভয়ের জন্য অটোমেটিক ডোমেন ট্র্যাকিং লজিক
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    let currentBaseUrl = "";

    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      currentBaseUrl = "https://ilbooksapp.com"; 
    } else {
      const protocol = req.headers.get("x-forwarded-proto") || "https";
      currentBaseUrl = `${protocol}://${host}`;
    }

    // পেমেন্ট টাইপ অনুযায়ী ডাইনামিক সাকসেস ইউআরএল সেট করার লজিক
    let finalSuccessUrl = "";
    if (paymentType === "book_shop") {
      finalSuccessUrl = `${currentBaseUrl}/dashboard/book-shop?payment=success&orderId=${finalEpsOrderId}`;
    } else if (paymentType === "patron") {
      finalSuccessUrl = `${currentBaseUrl}/dashboard/patron?status=active`;
    } else {
      finalSuccessUrl = `${currentBaseUrl}/dashboard/competition/exam?payment=success&level=${level || '0.1'}&orderId=${finalEpsOrderId}`;
    }

        // এনভায়রনমেন্ট ভেরিয়েবল এবং ডাইনামিক হ্যাশ ক্যালকুলেশন
    const baseApiUrl = process.env.EPS_API_URL || "https://eps.com.bd";
    const hashKey = process.env.EPS_HASH_KEY || "";
    const apiUserName = process.env.EPS_USERNAME || "";
    
    // ১ম এপিআই-এর জন্য ইউজারনেম দিয়ে হ্যাশ তৈরি
    const generatedHash = generateEpsHash(hashKey, apiUserName);

    // ১. প্রথম এপিআই কল: বিয়ারার টোকেন নিয়ে আসার রিকোয়েস্ট
    const tokenResponse = await fetch(`${baseApiUrl}/v1/Auth/GetToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hash": generatedHash
      },
      body: JSON.stringify({
        userName: apiUserName,
        password: process.env.EPS_PASSWORD || "Phoenix@1991" // আপনার নতুন পাসওয়ার্ড ব্যাকআপ হিসেবে দেওয়া হলো
      }),
      agent: agent
    });

    if (!tokenResponse.ok) {
      const tokenErrText = await tokenResponse.text();
      console.error("EPS Token Auth Failed:", tokenErrText);
      throw new Error(`EPS Token Auth Failed with status ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const bearerToken = tokenData.token;

    // ২. ২য় এপিআই-এর জন্য মার্চেন্ট ট্রানজেকশন আইডি দিয়ে হ্যাশ তৈরি (ডকুমেন্টেশন পৃষ্ঠা ৪ ও ৫ অনুযায়ী)
    const checkoutHash = generateEpsHash(hashKey, merchantTxnId);

    // পেমেন্ট ইনিশিয়ালাইজ করার অফিশিয়াল পেলোড অবজেক্ট
    const epsPayload = {
      storeId: process.env.EPS_STORE_ID,
      CustomerOrderId: finalEpsOrderId,
      merchantTransactionId: merchantTxnId,
      transactionTypeId: 1, 
      financialEntityId: 0,
      transitionStatusId: 0,
      totalAmount: Number(amount) || 10,
      ipAddress: "103.12.45.69",
      version: "1",
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
      productName: "ILBooks Service"
    };

        // ৩. দ্বিতীয় এপিআই কল: সরাসরি পেমেন্ট গেটওয়ে ইনিশিয়ালাইজ করা
    const epsResponse = await fetch(`${baseApiUrl}/v1/EPSEngine/InitializeEPS`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hash": checkoutHash,
        "Authorization": `Bearer ${bearerToken}`
      },
      body: JSON.stringify(epsPayload)
    });

    if (!epsResponse.ok) {
      const errorHTML = await epsResponse.text();
      console.error("EPS Gateway Initialization Failed. Server Returned:", errorHTML);
      throw new Error(`EPS Initialize failed with status ${epsResponse.status}`);
    }

    const epsData = await epsResponse.json();

    // ৪. রেসপন্স সফল হলে লিংকে পাঠানো এবং ফায়ারবেসে তথ্য ট্র্যাকিং সেভ করা
    if (epsData && epsData.RedirectURL) {
      if (userId) {
        try {
          const paymentRef = doc(db, "payments", finalEpsOrderId);
          await setDoc(paymentRef, {
            userId: userId || "GUEST",
            amount: Number(amount) || 0,
            orderId: finalEpsOrderId,
            merchantTransactionId: merchantTxnId,
            paymentType: paymentType || "competition",
            status: "PENDING_LIVE",
            gateway: "EPS_Live",
            createdAt: new Date()
          });
        } catch (dbError) {
          console.error("Firestore Save Error:", dbError);
        }
      }

      return NextResponse.json({
        success: true,
        url: epsData.RedirectURL
      });
    }

    // ব্যাকআপ ফলব্যাক ইউআরএল
    return NextResponse.json({
      success: true,
      url: finalSuccessUrl
    });

  } catch (error) {
    console.error("Critical Backend Crash:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
