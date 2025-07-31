import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
} from "pg-sdk-node";

const clientId = process.env.PHONEPE_CLIENT_ID!;
const clientSecret = process.env.PHONEPE_CLIENT_SECRET!;
const clientVersion = Number(process.env.PHONEPE_CLIENT_VERSION || "1");
const environment = process.env.PHONEPE_ENV === "production" ? Env.PRODUCTION : Env.SANDBOX;

const client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, environment);

export async function POST(req: NextRequest) {
  try {
    const { amount, plan } = await req.json();

    const merchantOrderId = randomUUID();
    const redirectUrl = "https://medibot-ai.com/history";

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amount)
      .redirectUrl(redirectUrl)
      .build();

    const response = await client.pay(request);

    if (!response.redirectUrl) {
      return NextResponse.json({ error: "PhonePe did not return a URL" }, { status: 500 });
    }

    return NextResponse.json({
      orderId: merchantOrderId,
      redirectUrl: response.redirectUrl,
    });
  } catch (err) {
    console.error("PhonePe SDK Error:", err);
    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
  }
}
