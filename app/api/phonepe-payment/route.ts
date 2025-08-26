

// PhonePe V2 Integration (Client ID & Client Secret)
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const PHONEPE_API_URL = 'https://api.phonepe.com/apis/pg';
const CLIENT_ID = 'SU2507251940196342599529';
const CLIENT_SECRET = '1cedc54d-5c48-4cc5-a60c-a8ecd88c1b11';
const API_VERSION = 'v2';

export async function POST(req: NextRequest) {
  try {
    const { amount, userId, planName } = await req.json();

    console.log('[PhonePe] Incoming payment request:', { amount, userId, planName });

    if (!amount || !userId || !planName) {
      console.log('[PhonePe] Missing required fields:', { amount, userId, planName });
      return NextResponse.json({
        success: false,
        message: `Missing required fields: amount=${amount}, userId=${userId}, planName=${planName}`
      }, { status: 400 });
    }

    // Generate unique transaction ID
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      const host = req.headers.get('host');
      baseUrl = host?.includes('localhost') ? `http://${host}` : `https://${host}`;
    }
    const paymentPayload = {
      merchantId: CLIENT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: userId.substring(0, 36),
      amount: amount * 100,
      redirectUrl: `${baseUrl}/api/phonepe-callback`,
      redirectMode: 'POST',
      callbackUrl: `${baseUrl}/api/phonepe-callback`,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    const payloadString = JSON.stringify(paymentPayload);
    const signature = crypto.createHmac('sha256', CLIENT_SECRET).update(payloadString).digest('hex');

    console.log('[PhonePe] Payment payload:', paymentPayload);
    console.log('[PhonePe] HMAC signature:', signature);

    const response = await fetch(`${PHONEPE_API_URL}/${API_VERSION}/initiatePayment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CLIENT-ID': CLIENT_ID,
        'X-API-VERSION': API_VERSION,
        'X-VERIFY': signature
      },
      body: payloadString
    });

    let result;
    try {
      result = await response.json();
    } catch (err) {
      console.log('[PhonePe] Error parsing response:', err);
      result = { success: false, message: 'Invalid response from PhonePe', raw: await response.text() };
    }

    console.log('[PhonePe] API response:', result);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          redirectUrl: result.data.instrumentResponse.redirectInfo.url,
          transactionId,
          planName
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || 'Payment initiation failed',
        debug: result.raw || result
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[PhonePe] payment error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      debug: error?.message || error
    }, { status: 500 });
  }
}
