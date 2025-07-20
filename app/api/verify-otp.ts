import { NextApiRequest, NextApiResponse } from "next"
import { getFirestore } from "firebase-admin/firestore"

const db = getFirestore()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email, otp } = req.body
  const doc = await db.collection("emailOtps").doc(email).get()
  const data = doc.data()

  if (!data || data.otp !== otp || Date.now() - data.createdAt > 5 * 60 * 1000) {
    return res.status(400).json({ success: false, message: "Invalid or expired OTP" })
  }

  res.status(200).json({ success: true })
}
