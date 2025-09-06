import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { userId, medicationId, reminderTimes, medicationName, dosage } = await req.json();

    if (!userId || !medicationId || !reminderTimes?.length) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Clear existing reminders for this medication
    const existingReminders = query(
      collection(db, "scheduledReminders"),
      where("medicationId", "==", medicationId)
    );
    const snapshot = await getDocs(existingReminders);
    await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));

    // Schedule new reminders for each time
    const schedulePromises = reminderTimes.map(async (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      
      // Create reminder document
      const reminderData = {
        userId,
        medicationId,
        medicationName,
        dosage,
        time: time,
        hours,
        minutes,
        active: true,
        createdAt: new Date(),
        lastSent: null,
        nextScheduled: getNextScheduledTime(hours, minutes)
      };

      const reminderId = `${medicationId}_${time.replace(":", "")}`;
      await setDoc(doc(db, "scheduledReminders", reminderId), reminderData);
    });

    await Promise.all(schedulePromises);

    return NextResponse.json({ success: true, message: "Reminders scheduled successfully" });
  } catch (error) {
    console.error("Error scheduling reminder:", error);
    return NextResponse.json({ success: false, error: "Failed to schedule reminder" }, { status: 500 });
  }
}

function getNextScheduledTime(hours: number, minutes: number): Date {
  const now = new Date();
  const scheduled = new Date();
  scheduled.setHours(hours, minutes, 0, 0);
  
  // If time has passed today, schedule for tomorrow
  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  
  return scheduled;
}

export async function DELETE(req: Request) {
  try {
    const { medicationId } = await req.json();

    if (!medicationId) {
      return NextResponse.json({ success: false, error: "Medication ID required" }, { status: 400 });
    }

    // Delete all reminders for this medication
    const reminders = query(
      collection(db, "scheduledReminders"),
      where("medicationId", "==", medicationId)
    );
    const snapshot = await getDocs(reminders);
    await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));

    return NextResponse.json({ success: true, message: "Reminders cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling reminders:", error);
    return NextResponse.json({ success: false, error: "Failed to cancel reminders" }, { status: 500 });
  }
}
