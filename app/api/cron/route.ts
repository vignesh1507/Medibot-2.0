import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";

export async function GET(req: Request) {
  try {
    // Verify this is called by a cron service (optional security check)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'medibot-cron-2024';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log("❌ Unauthorized cron attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("🚀 Daily cron job triggered - cleaning up old reminders...");
    
    // Clean up old reminder records (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const remindersRef = collection(db, "scheduledReminders");
    const oldReminders = query(
      remindersRef, 
      where("createdAt", "<", thirtyDaysAgo)
    );
    
    const snapshot = await getDocs(oldReminders);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`🧹 Cleaned up ${snapshot.docs.length} old reminder records`);
    
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      cleanedRecords: snapshot.docs.length,
      message: "Daily maintenance completed successfully"
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
