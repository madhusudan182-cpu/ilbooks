import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { amount, orderId, level } = body; 

    const currentOrderId = orderId || "ILB-" + Date.now();
    
    // 💡 টেক্সট (যেমন: "Level 0.1 Exam") থেকে শুধুমাত্র সংখ্যা এবং ডট (যেমন: 0.1) আলাদা করার ম্যাজিক কোড
    let cleanLevel = "0.0";
    if (level) {
      const match = level.toString().match(/\d+\.\d+/);
      if (match) {
        cleanLevel = match[0]; // এটি "Level 0.1 Exam" কে বানিয়ে দেবে শুধু "0.1"
      } else {
        // যদি ডট না থাকে, শুধু সিঙ্গেল সংখ্যা ব্যাকআপ হিসেবে চেক করবে
        const singleMatch = level.toString().match(/\d+/);
        if (singleMatch) cleanLevel = singleMatch[0];
      }
    }

    const host = req.headers.get("host") || "localhost:9002";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const currentBaseUrl = `${protocol}://${host}`;

    console.log(`💸 Sandbox Payment for Order: ${currentOrderId}, Extracted Level: ${cleanLevel}`);

    // এখন ইউআরএল-এ একদম নিখুঁতভাবে সংখ্যাটি (যেমন: ?level=0.1) পাস হবে
    const successRedirectUrl = `${currentBaseUrl}/dashboard/competition/exam?level=${cleanLevel}`;
    console.log(`🔗 Target Redirect URL: ${successRedirectUrl}`);

    return NextResponse.json({ 
      success: true, 
      url: successRedirectUrl 
    });

  } catch (error) {
    console.error("💥 Critical Backend Crash:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
