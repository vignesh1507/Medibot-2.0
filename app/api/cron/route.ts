import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Verify this is called by a cron service (optional security check)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'medibot-cron-2024';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log("❌ Unauthorized cron attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("🚀 Cron job triggered - checking reminders...");
    
    // Call our reminder check endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/check-reminders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log("✅ Cron job completed:", result);
    
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      reminderResult: result 
    });
    
  } catch (error) {
    console.error("❌ Cron job error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
