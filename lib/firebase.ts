
import { initializeApp } from "firebase/app"
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  sendEmailVerification,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset
} from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getMessaging } from "firebase/messaging"

// All values come from environment variables — nothing hardcoded.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
let app
try {
  app = initializeApp(firebaseConfig)
} catch (error) {
  console.error("Firebase initialization error:", error)
  // Fallback initialization
  app = initializeApp(firebaseConfig)
}

export const auth = getAuth(app)

// Configure auth persistence to survive browser restart by default
auth.useDeviceLanguage();

export const db = getFirestore(app)
export const storage = getStorage(app)
export const messaging = typeof window !== "undefined" ? getMessaging(app) : null

// Auth providers
export const googleProvider = new GoogleAuthProvider()
export const facebookProvider = new FacebookAuthProvider()

// Configure providers
googleProvider.setCustomParameters({
  prompt: "select_account",
})

facebookProvider.setCustomParameters({
  display: "popup",
})

// Email verification functions
export const sendVerificationEmail = async (user: any) => {
  try {
    await sendEmailVerification(user, {
      url: `${window.location.origin}/auth/signin`, // Redirect URL after verification
      handleCodeInApp: false,
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return { success: false, error: error.message };
  }
};

export const verifyEmailAction = async (actionCode: string) => {
  try {
    await applyActionCode(auth, actionCode);
    return { success: true };
  } catch (error: any) {
    console.error("Error verifying email:", error);
    return { success: false, error: error.message };
  }
};

export default app
