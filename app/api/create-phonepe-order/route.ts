import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
} from "pg-sdk-node";

// Temporary GET handler for browser testing
export async function GET() {
  return NextResponse.json({ message: "PhonePe order creation endpoint is working. Use POST to create an order." });
}


const clientId = process.env.NEXT_PUBLIC_PHONEPE_MERCHANT_ID || process.env.PHONEPE_CLIENT_ID;
const clientSecret = process.env.PHONEPE_SALT_KEY || process.env.PHONEPE_CLIENT_SECRET;
const clientVersion = Number(process.env.PHONEPE_CLIENT_VERSION || "1");
const environment = process.env.PHONEPE_ENV === "production" ? Env.PRODUCTION : Env.SANDBOX;

if (!clientId || !clientSecret) {
  throw new Error("PhonePe credentials missing. Check .env.local for NEXT_PUBLIC_PHONEPE_MERCHANT_ID and PHONEPE_SALT_KEY.");
}

const client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, environment);

export async function POST(req: NextRequest) {
  try {
    const { amount, plan } = await req.json();

    const merchantOrderId = randomUUID();
    // Use a valid redirect URL for your app (should be a route that handles payment callback)
    const redirectUrl = process.env.NEXT_PUBLIC_PHONEPE_REDIRECT_URL || "https://medibot-ai.com/payment-callback";

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amount)
      .redirectUrl(redirectUrl)
      .build();

    let response;
    try {
      response = await client.pay(request);
    } catch (sdkErr) {

// Temporary GET handler for browser testing

      console.error("PhonePe SDK pay() error:", sdkErr);
      return NextResponse.json({ error: "PhonePe SDK pay() failed", details: sdkErr }, { status: 500 });
    }

    if (!response.redirectUrl) {
      return NextResponse.json({ error: "PhonePe did not return a URL", details: response }, { status: 500 });
    }

    return NextResponse.json({
      orderId: merchantOrderId,
      redirectUrl: response.redirectUrl,
    });
  } catch (err) {
    console.error("PhonePe API Error:", err);
    return NextResponse.json({ error: "Payment creation failed", details: err }, { status: 500 });
  }
}
