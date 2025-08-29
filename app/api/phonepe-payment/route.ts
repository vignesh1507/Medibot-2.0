

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const PHONEPE_API_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.phonepe.com/apis/hermes/pg/v2/init"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox/v2/init";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[PhonePe] Incoming request body:", body);
    // Use production credentials from .env.local
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
    const clientVersion = process.env.PHONEPE_CLIENT_VERSION || "1";
    const { merchantTransactionId, amount, currency, redirectUrl, callbackUrl } = body;

    // Validate required fields
    if (!merchantId || !merchantTransactionId || !amount || !currency || !redirectUrl || !callbackUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
          debug: { merchantId, merchantTransactionId, amount, currency, redirectUrl, callbackUrl },
        },
        { status: 400 }
      );
    }

    // Prepare payload for PhonePe
    const paymentPayload = {
      merchantId,
      merchantTransactionId,
      amount: parseInt(amount, 10), // amount in paise (integer)
      currency,
      redirectUrl,
      redirectMode: "POST",
      callbackUrl,
      paymentInstrument: { type: "PAY_PAGE" },
    };
    const payloadString = JSON.stringify(paymentPayload);
    const apiPath = "/apis/hermes/pg/v2/init";
    const toSign = payloadString + apiPath + clientSecret;
    const sha256Hash = crypto.createHash("sha256").update(toSign).digest("hex");
    const signature = Buffer.from(sha256Hash).toString("base64");
    const xVerify = `${signature}###${clientSecret}`;

    // Call PhonePe API
    const response = await fetch(PHONEPE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": merchantId,
        "X-API-VERSION": clientVersion,
      },
      body: payloadString,
    });

    let result;
    try {
      result = await response.json();
    } catch (err) {
      result = { success: false, message: "Invalid response from PhonePe", raw: await response.text() };
    }
    console.log("[PhonePe] API response:", result);

    return NextResponse.json(result, { status: response.status });
  } catch (error: any) {
    console.error("[PhonePe] payment error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        debug: error?.message || error,
      },
      { status: 500 }
    );
  }
}