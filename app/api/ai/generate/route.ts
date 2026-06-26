import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Run on Node (firebase-admin can't run on the Edge runtime) and allow long
// Gemini calls (lab-report analysis with 2.5-pro can take a while).
export const runtime = "nodejs";
export const maxDuration = 60;

// The Gemini key lives ONLY on the server. Prefer GEMINI_API_KEY; fall back to
// the old NEXT_PUBLIC_ name so nothing breaks before the env var is renamed.
const GEMINI_KEY =
  process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

const ALLOWED_MODELS = new Set([
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
]);

// Lazily initialize firebase-admin (best-effort) so we can verify the caller is
// a signed-in user. If admin credentials aren't configured (e.g. local dev),
// we skip verification rather than blocking — production has them (used by the
// payment routes), so production still enforces auth.
let adminChecked = false;
function adminAvailable(): boolean {
  if (!adminChecked) {
    adminChecked = true;
    const projectId =
      process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!getApps().length && projectId && clientEmail && rawKey) {
      try {
        const privateKey = rawKey
          .trim()
          .replace(/^"|"$/g, "")
          .replace(/\\n/g, "\n")
          .replace(/\r\n/g, "\n");
        initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
      } catch (e) {
        console.error("[ai/generate] admin init failed:", e);
      }
    }
  }
  return getApps().length > 0;
}

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const authz = req.headers.get("authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) return false; // a logged-in caller always sends one
  if (!adminAvailable()) return true; // dev fallback
  try {
    await getAuth().verifyIdToken(token);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!GEMINI_KEY) {
    return NextResponse.json(
      { error: "AI is not configured on the server." },
      { status: 500 },
    );
  }

  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { model, contents, generationConfig } = payload || {};
  if (typeof model !== "string" || !ALLOWED_MODELS.has(model)) {
    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  }
  if (!Array.isArray(contents)) {
    return NextResponse.json({ error: "Invalid contents" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents, generationConfig }),
      },
    );
  } catch (e) {
    console.error("[ai/generate] upstream fetch failed:", e);
    return NextResponse.json({ error: "Failed to reach the AI service." }, { status: 502 });
  }

  // Forward Gemini's response body and status verbatim so existing client-side
  // handling (response.ok, status codes, candidates, finishReason) keeps working.
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}
