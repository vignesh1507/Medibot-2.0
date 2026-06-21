import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { credential } from "firebase-admin";

// Initialize Firebase Admin
let admin_db: any = null;
const projectId_cb = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail_cb = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey_cb = process.env.FIREBASE_PRIVATE_KEY;
if (!getApps().length && projectId_cb && clientEmail_cb && rawPrivateKey_cb) {
  try {
    // Strip surrounding quotes if present and fix newline escapes
    let privateKey = rawPrivateKey_cb;
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');
    initializeApp({
      credential: credential.cert({ projectId: projectId_cb, clientEmail: clientEmail_cb, privateKey }),
    });
    admin_db = getFirestore();
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
} else if (getApps().length) {
  admin_db = getFirestore();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantTransactionId = searchParams.get('merchantTransactionId');
    const planName = searchParams.get('planName');
    const userId = searchParams.get('userId');
    const code = searchParams.get('code'); // PhonePe status code
    const transactionId = searchParams.get('transactionId');
    
    console.log("[PhonePe Callback] GET params:", { merchantTransactionId, planName, userId, code, transactionId });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://medibot-ai.com";
    
    if (!merchantTransactionId) {
      return NextResponse.redirect(`${baseUrl}/pricing?status=failed&message=Missing transaction ID`);
    }

    // Determine payment status based on PhonePe response
    const isSuccess = code === 'PAYMENT_SUCCESS' || code === 'SUCCESS';
    const status = isSuccess ? 'success' : 'failed';
    
    // Update transaction status in Firestore
    try {
      if (admin_db) {
        const paymentRef = admin_db.collection('payments').doc(merchantTransactionId);
        const updateData: any = {
          status: isSuccess ? 'completed' : 'failed',
          updatedAt: new Date(),
          phonepeTransactionId: transactionId,
          responseCode: code
        };

        // If payment successful, also update user's subscription
        if (isSuccess && userId && planName) {
          const isYearly = planName.toLowerCase() !== 'premium';
          const endDate = isYearly
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 365 days
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);  // 30 days

          // CRITICAL: the entire app gates premium features on the top-level
          // `plan` field (userProfile.plan). We MUST set it here, in addition to
          // the detailed `subscription` object, or paying users get no access.
          const userRef = admin_db.collection('users').doc(userId);
          await userRef.update({
            plan: 'premium',
            subscription: {
              plan: planName.toLowerCase(),
              status: 'active',
              startDate: new Date(),
              endDate,
              lastPaymentId: merchantTransactionId
            },
            updatedAt: new Date()
          });
          console.log(`[PhonePe Callback] Upgraded user ${userId} to premium until ${endDate.toISOString()}`);
        }

        await paymentRef.update(updateData);
      }
    } catch (dbError) {
      console.error("Error updating Firestore:", dbError);
    }

    // Redirect to pricing page with status
    const redirectUrl = `${baseUrl}/pricing?status=${status}&transactionId=${merchantTransactionId}${
      status === 'failed' ? '&message=Payment was not completed' : ''
    }`;
    
    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    console.error("[PhonePe Callback] Error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://medibot-ai.com";
    return NextResponse.redirect(`${baseUrl}/pricing?status=failed&message=Payment processing error`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log("[PhonePe Callback] POST Data:", data);

    // Handle POST callback if PhonePe sends one
    // This is typically used for server-to-server notifications
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Callback handling failed", error: error.message },
      { status: 500 }
    );
  }
}
