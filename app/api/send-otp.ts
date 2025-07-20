import { NextApiRequest, NextApiResponse } from "next"
import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import nodemailer from "nodemailer"

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY as string)

const app = initializeApp({
  credential: cert(serviceAccount),
})
const db = getFirestore(app)

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.OTP_EMAIL,
    pass: process.env.OTP_PASSWORD,
  },
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.body

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  await db.collection("emailOtps").doc(email).set({
    otp,
    createdAt: Date.now(),
  })

  await transporter.sendMail({
    from: `"Medibot" <${process.env.OTP_EMAIL}>`,
    to: email,
    subject: "Your Medibot OTP Code",
    text: `Your OTP is: ${otp}`,
  })

  res.status(200).json({ success: true })
}
