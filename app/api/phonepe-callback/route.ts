import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log("[PhonePe Callback] Data:", data);

    // TODO: Update your DB with transaction status here
    // Example: mark order as PAID if success, FAILED otherwise.

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Callback handling failed", error: error.message },
      { status: 500 }
    );
  }
}
