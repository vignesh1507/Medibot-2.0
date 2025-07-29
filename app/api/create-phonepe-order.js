import { NextResponse } from 'next/server';

// This is a placeholder. Replace with your actual PhonePe API integration.
export async function POST(req) {
  try {
    const { plan, amount } = await req.json();
    // TODO: Generate unique orderId and build PhonePe payload
    const orderId = 'ORDER_' + Date.now();
    // TODO: Call PhonePe API to create order and get redirect URL
    // Example: const phonePeRes = await fetch('https://api.phonepe.com/v3/order', ...)
    // For now, use a dummy UPI deep link (replace with real redirectUrl from PhonePe)
    const redirectUrl = `upi://pay?pa=your-vpa@okicici&pn=Your+Merchant&am=${amount/100}&cu=INR&tn=Payment+for+${plan}`;
    return NextResponse.json({ redirectUrl, orderId });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to create PhonePe order' }, { status: 500 });
  }
}
