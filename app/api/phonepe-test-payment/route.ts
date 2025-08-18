import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// PhonePe Test Credentials (for development/testing)
const TEST_MERCHANT_ID = 'PGTESTPAYUAT';
const TEST_SALT_KEY = '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
const SALT_INDEX = 1;

export async function POST(req: NextRequest) {
  try {
    const { amount, userId, planName } = await req.json();

    // Generate unique transaction ID
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare payment payload with test credentials
    const paymentPayload = {
      merchantId: TEST_MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: userId.substring(0, 36),
      amount: amount * 100, // Convert to paise
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/phonepe-test-callback`,
      redirectMode: 'POST',
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/phonepe-test-callback`,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    // Convert payload to base64
    const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
    
    // Generate checksum
    const checksumString = base64Payload + '/pg/v1/pay' + TEST_SALT_KEY;
    const checksum = crypto.createHash('sha256').update(checksumString).digest('hex') + `###${SALT_INDEX}`;

    console.log('Test PhonePe Payment Request:', {
      transactionId,
      amount: amount * 100,
      merchantId: TEST_MERCHANT_ID,
      payload: paymentPayload
    });

    // Make request to PhonePe test API
    const response = await fetch('https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
      },
      body: JSON.stringify({
        request: base64Payload
      })
    });

    const result = await response.json();
    
    console.log('PhonePe Test API Response:', JSON.stringify(result, null, 2));
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
        message: result.message || 'Payment initiation failed',
        error: result
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('PhonePe test payment error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
