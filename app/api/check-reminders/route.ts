import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import admin from "firebase-admin";

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function GET() {
  try {
    console.log("🔔 Checking for due medication reminders...");
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight
    
    // Query for active reminders that are due (within 1 minute window)
    const remindersRef = collection(db, "scheduledReminders");
    const activeReminders = query(remindersRef, where("active", "==", true));
    const snapshot = await getDocs(activeReminders);
    
    const dueReminders: any[] = [];
    
    snapshot.forEach((doc) => {
      const reminder = doc.data();
      const reminderTime = reminder.hours * 60 + reminder.minutes;
      
      // Check if reminder is due (within 1-minute window)
      const timeDiff = Math.abs(currentTime - reminderTime);
      const isWithinWindow = timeDiff <= 1 || timeDiff >= (24 * 60 - 1); // Handle midnight rollover
      
      // Check if we haven't sent this reminder today
      const lastSent = reminder.lastSent?.toDate();
      const isToday = lastSent && lastSent.toDateString() === now.toDateString();
      
      if (isWithinWindow && !isToday) {
        dueReminders.push({ id: doc.id, ...reminder });
      }
    });
    
    console.log(`Found ${dueReminders.length} due reminders`);
    
    // Send notifications for due reminders
    const notificationPromises = dueReminders.map(async (reminder) => {
      try {
        // Get user's FCM token
        const userDoc = await getDoc(doc(db, "users", reminder.userId));
        const fcmToken = userDoc.data()?.fcmToken;
        
        if (fcmToken) {
          const message = {
            token: fcmToken,
            notification: {
              title: `💊 Time for ${reminder.medicationName}`,
              body: `Take your ${reminder.medicationName} (${reminder.dosage}) now`
            },
            data: {
              type: "medication_reminder",
              medicationId: reminder.medicationId,
              medicationName: reminder.medicationName,
              dosage: reminder.dosage,
              time: reminder.time,
              timestamp: Date.now().toString()
            },
            android: {
              priority: "high" as const,
              notification: {
                channelId: "medication_reminders",
                priority: "high" as const,
                defaultSound: true,
                defaultVibrateTimings: true
              }
            },
            apns: {
              payload: {
                aps: {
                  alert: {
                    title: `💊 Time for ${reminder.medicationName}`,
                    body: `Take your ${reminder.medicationName} (${reminder.dosage}) now`
                  },
                  sound: "default",
                  badge: 1
                }
              }
            }
          };
          
          // Send FCM notification
          const response = await admin.messaging().send(message);
          console.log(`✅ Notification sent for ${reminder.medicationName}:`, response);
          
          // Update lastSent timestamp
          await updateDoc(doc(db, "scheduledReminders", reminder.id), {
            lastSent: now,
            nextScheduled: getNextScheduledTime(reminder.hours, reminder.minutes)
          });
          
          return { success: true, medicationName: reminder.medicationName };
        } else {
          console.log(`❌ No FCM token for user ${reminder.userId}`);
          return { success: false, error: "No FCM token", medicationName: reminder.medicationName };
        }
      } catch (error) {
        console.error(`❌ Error sending notification for ${reminder.medicationName}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, error: errorMessage, medicationName: reminder.medicationName };
      }
    });
    
    const results = await Promise.all(notificationPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`📊 Notification results: ${successful} successful, ${failed} failed`);
    
    return NextResponse.json({ 
      success: true, 
      processed: dueReminders.length,
      successful,
      failed,
      results 
    });
    
  } catch (error) {
    console.error("❌ Error in reminder check:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

function getNextScheduledTime(hours: number, minutes: number): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hours, minutes, 0, 0);
  return tomorrow;
}

// Helper function to manually trigger reminder check (for testing)
export async function POST() {
  return GET(); // Reuse the same logic
}
