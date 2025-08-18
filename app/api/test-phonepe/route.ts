import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const config = {
    MERCHANT_ID: process.env.NEXT_PUBLIC_PHONEPE_MERCHANT_ID || 'M23R8YJO33CEU',
    SALT_KEY: process.env.NEXT_PUBLIC_PHONEPE_SALT_KEY ? '[CONFIGURED]' : '[NOT CONFIGURED]',
    BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  };

  return NextResponse.json({
    message: 'PhonePe configuration test',
    config,
    timestamp: new Date().toISOString(),
  });
}
