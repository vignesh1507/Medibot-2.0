import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const PHONEPE_STATUS_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.phonepe.com/apis/pg/v2/status"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox/v2/status";

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID!;
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET!;
const CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || "v2";

export async function POST(req: NextRequest) {
  try {
    const { transactionId } = await req.json();

    if (!transactionId) {
      return NextResponse.json(
        { success: false, message: "TransactionId required" },
        { status: 400 }
      );
    }

    const apiPath = `/pg/v2/status/${MERCHANT_ID}/${transactionId}`;
    const toSign = apiPath + CLIENT_SECRET;
    const sha256Hash = crypto.createHash("sha256").update(toSign).digest("hex");
    const signature = Buffer.from(sha256Hash).toString("base64");

    const response = await fetch(
      `${PHONEPE_STATUS_URL}/${MERCHANT_ID}/${transactionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-CLIENT-ID": MERCHANT_ID,
          "X-API-VERSION": CLIENT_VERSION,
          "X-VERIFY": signature,
        },
      }
    );

    const result = await response.json().catch(async () => ({
      success: false,
      message: "Invalid response from PhonePe",
      raw: await response.text(),
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Status check failed" },
      { status: 500 }
    );
  }
}
