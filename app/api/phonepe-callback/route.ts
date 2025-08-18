import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SALT_KEY = process.env.NEXT_PUBLIC_PHONEPE_SALT_KEY || '1cedc54d-5c48-4cc5-a60c-a8ecd88c1b11';
const SALT_INDEX = 1;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { response } = body;

    if (!response) {
      return NextResponse.redirect(new URL('/pricing?status=failed&message=Invalid response', req.url));
    }

    // Decode the response
    const decodedResponse = Buffer.from(response, 'base64').toString('utf-8');
    const responseData = JSON.parse(decodedResponse);

    // Verify checksum
    const receivedChecksum = req.headers.get('X-VERIFY');
    const computedChecksum = crypto.createHash('sha256')
      .update(response + '/pg/v1/status/' + responseData.merchantId + '/' + responseData.merchantTransactionId + SALT_KEY)
      .digest('hex') + '###1';

    if (receivedChecksum !== computedChecksum) {
      return NextResponse.redirect(new URL('/pricing?status=failed&message=Invalid checksum', req.url));
    }

    // Check payment status
    if (responseData.code === 'PAYMENT_SUCCESS') {
      // Payment successful - redirect to success page
      return NextResponse.redirect(new URL(`/pricing?status=success&transactionId=${responseData.merchantTransactionId}&plan=premium`, req.url));
    } else {
      // Payment failed - redirect to failure page
      return NextResponse.redirect(new URL(`/pricing?status=failed&message=${responseData.message || 'Payment failed'}`, req.url));
    }

  } catch (error: any) {
    console.error('PhonePe callback error:', error);
    return NextResponse.redirect(new URL('/pricing?status=failed&message=Processing error', req.url));
  }
}

export async function GET(req: NextRequest) {
  // Handle GET redirects as well
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const transactionId = searchParams.get('transactionId');
  
  if (status === 'success') {
    return NextResponse.redirect(new URL(`/pricing?status=success&transactionId=${transactionId}&plan=premium`, req.url));
  } else {
    return NextResponse.redirect(new URL('/pricing?status=failed', req.url));
  }
}
