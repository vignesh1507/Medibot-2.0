import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // PhonePe will send payment status here
    const body = await req.json();
    // You can verify the payment status and update your DB here
    // For now, just echo the payload
    return NextResponse.json({ received: true, body });
  } catch (err) {
    console.error("PhonePe callback error:", err);
    return NextResponse.json({ error: "Callback failed", details: err }, { status: 500 });
  }
}

// Temporary GET handler for browser testing
export async function GET() {
  return NextResponse.json({ message: "PhonePe callback endpoint is working. Use POST for actual payment status." });
}
