import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// PhonePe UAT/Production API endpoints
const PHONEPE_API_URL = 'https://api.phonepe.com/apis/pg'; // Production endpoint
const MERCHANT_ID = process.env.NEXT_PUBLIC_PHONEPE_MERCHANT_ID;
const SALT_KEY = process.env.NEXT_PUBLIC_PHONEPE_SALT_KEY;
const SALT_INDEX = 1;
const CLIENT_ID = process.env.NEXT_PUBLIC_PHONEPE_CLIENT_ID;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_PHONEPE_CLIENT_SECRET;

// Validate credentials
if (!MERCHANT_ID || !SALT_KEY) {
  console.error('PhonePe credentials not configured');
}

export async function POST(req: NextRequest) {
  try {
    const { amount, userId, planName } = await req.json();

    // Validate required fields
    if (!amount || !userId || !planName) {
      console.error('PhonePe Payment Error: Missing fields', { amount, userId, planName });
      const body = await req.text();
      console.error('Request body:', body);
      return NextResponse.json({
        success: false,
        message: `Missing required fields: amount=${amount}, userId=${userId}, planName=${planName}`
      }, { status: 400 });
    }

    // Validate credentials
    if (!MERCHANT_ID || !SALT_KEY) {
      return NextResponse.json({
        success: false,
        message: 'PhonePe credentials not configured'
      }, { status: 500 });
    }

    console.log('PhonePe Payment Request:', { amount, userId, planName, MERCHANT_ID });

    // Generate unique transaction ID
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare payment payload
    // Detect base URL for callback/redirect
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      // Try to infer from request headers (for local dev)
      const host = req.headers.get('host');
      baseUrl = host?.includes('localhost') ? `http://${host}` : `https://${host}`;
    }
    const paymentPayload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: userId.substring(0, 36), // Ensure it's within limits
      amount: amount * 100, // Convert to paise
      redirectUrl: `${baseUrl}/api/phonepe-callback`,
      redirectMode: 'POST',
      callbackUrl: `${baseUrl}/api/phonepe-callback`,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    // Convert payload to base64
    const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
    
    // Generate checksum
  const checksumString = base64Payload + '/pg/v1/pay' + SALT_KEY;
  const checksum = crypto.createHash('sha256').update(checksumString).digest('hex') + `###${SALT_INDEX}`;

    // Make request to PhonePe API
    const response = await fetch(`${PHONEPE_API_URL}/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        ...(CLIENT_ID && CLIENT_SECRET ? {
          'X-CLIENT-ID': CLIENT_ID,
          'X-CLIENT-SECRET': CLIENT_SECRET,
        } : {})
      },
      body: JSON.stringify({
        request: base64Payload
      })
    });

    const result = await response.json();
    
    // Log the response for debugging
    console.log('PhonePe API Response:', JSON.stringify(result, null, 2));
    console.log('Response Status:', response.status);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          redirectUrl: result.data.instrumentResponse.redirectInfo.url,
          transactionId: transactionId,
          planName: planName
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || 'Payment initiation failed'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('PhonePe payment error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
