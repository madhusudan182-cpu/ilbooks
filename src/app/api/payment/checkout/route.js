import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { amount, orderId, level, paymentType } = body; 

    const currentOrderId = orderId || "ILB-" + Date.now();
    const host = req.headers.get("host") || "localhost:9002";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const currentBaseUrl = `${protocol}://${host}`;

    let successRedirectUrl = `${currentBaseUrl}/dashboard`;

    // 💡 পেমেন্ট টাইপ অনুযায়ী ডায়নামিক রিডাইরেকশন লজিক
    if (paymentType === "book_shop") {
      // বই কেনার পর কাস্টমার বুকশপ বা অর্ডারের সাকসেস পেজে যাবে
      successRedirectUrl = `${currentBaseUrl}/dashboard/book-shop?payment=success&orderId=${currentOrderId}`;
    } else if (paymentType === "patron") {
      // পেট্রন সাবস্ক্রিপশন সফল হলে পেট্রন ড্যাশবোর্ডে যাবে
      successRedirectUrl = `${currentBaseUrl}/dashboard/patron?status=active`;
    } else {
      // ডিফল্ট বা কম্পিটিশন এক্সামের ক্ষেত্রে লেভেল এক্সট্রাক্ট করে এক্সাম পেজে যাবে
      let cleanLevel = "0.0";
      if (level) {
        const match = level.toString().match(/\d+\.\d+/);
        if (match) cleanLevel = match[0];
        else {
          const singleMatch = level.toString().match(/\d+/);
          if (singleMatch) cleanLevel = singleMatch[0];
        }
      }
      successRedirectUrl = `${currentBaseUrl}/dashboard/competition/exam?level=${cleanLevel}`;
    }

    console.log(`💸 Sandbox Payment [Type: ${paymentType || 'exam'}] -> Redirecting to: ${successRedirectUrl}`);

    return NextResponse.json({ 
      success: true, 
      url: successRedirectUrl 
    });

  } catch (error) {
    console.error("💥 Critical Backend Crash:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
