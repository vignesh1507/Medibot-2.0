import { auth } from "@/lib/firebase";

export interface GeminiCallOptions {
  model: string;
  contents: any[];
  generationConfig?: Record<string, any>;
  signal?: AbortSignal;
}

/**
 * Calls Gemini through our own server route (/api/ai/generate) so the API key
 * stays server-side and is NEVER shipped to the browser.
 *
 * Returns the raw fetch Response — callers handle `.ok` / `.json()` / `.text()`
 * / status codes exactly as they did with a direct Gemini call, because the
 * route forwards Gemini's response body and status verbatim.
 */
export async function geminiGenerate({
  model,
  contents,
  generationConfig,
  signal,
}: GeminiCallOptions): Promise<Response> {
  let token: string | null = null;
  try {
    token = (await auth.currentUser?.getIdToken()) ?? null;
  } catch {
    token = null;
  }

  return fetch("/api/ai/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ model, contents, generationConfig }),
    signal,
  });
}
