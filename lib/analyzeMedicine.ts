/**
 * Medicine Analyzer — general drug information lookup.
 *
 * Accepts a typed medicine name OR a photo of a medicine strip/box, and returns
 * plain-language educational info: what it is, what it's generally used for,
 * common side effects, and precautions.
 *
 * LEGALLY SAFE: this is general drug information (like MedlinePlus / a pharmacy
 * leaflet), NOT a prescription or recommendation. The prompt forbids telling the
 * user to take anything or suggesting dosages for their situation.
 */

const GEMINI_MODEL_CHAIN = ["gemini-2.5-flash", "gemini-2.5-pro"];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return reject(new Error("Failed to read file"));
      const i = result.indexOf(",");
      resolve(i >= 0 ? result.slice(i + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader error"));
    reader.readAsDataURL(file);
  });
}

const SAFETY = `CRITICAL SAFETY RULES — NON-NEGOTIABLE:
1. You are NOT a doctor or pharmacist. This is GENERAL EDUCATIONAL INFORMATION only.
2. NEVER tell the user to take, start, stop, or change a medicine.
3. NEVER suggest a dosage for the user's specific situation. You may mention the typical general form only if clearly printed/known, framed as "commonly available as…".
4. NEVER diagnose or imply the user has a condition.
5. ALWAYS end by telling them to follow their doctor's or pharmacist's instructions.
6. If you are not confident what the medicine is, say so plainly and advise checking with a pharmacist — do NOT guess.`;

const OUTPUT_FORMAT = `OUTPUT FORMAT — return ONLY markdown, no code fences. Use exactly this structure:

### About This Medicine

**Name:** <medicine name (and generic name in parentheses if known)>
**Drug class:** <plain-language class, e.g. "pain reliever / fever reducer">

A 1-2 sentence plain-language summary of what this medicine is.

### What It's Generally Used For

A short bullet list of the conditions/situations this medicine is commonly used for (general medical knowledge — not advice for this specific user).

### Common Side Effects

A short bullet list of side effects people commonly experience. Note that not everyone gets them.

### Good to Know

2-4 bullets of general precautions people should be aware of (e.g. "often taken with food", "may cause drowsiness", "avoid alcohol"). General knowledge only — no dosing for the user.

---

*This is general information, not a recommendation to use this medicine. Always take medicines exactly as prescribed by your doctor, and ask your pharmacist if you have questions.*

LANGUAGE:
- Plain language for a non-medical reader. Explain any medical term in parentheses.
- No emojis. Warm but factual.
- Reply in the same language as the user's input if they typed in a non-English language.

Return ONLY the markdown, starting directly with "### About This Medicine".`;

export interface MedicineResult {
  markdown: string;
  modelUsed: string;
}

async function callGemini(parts: any[], apiKey: string): Promise<MedicineResult> {
  const body = {
    contents: [{ parts }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
  };
  let lastError: Error | null = null;
  for (const model of GEMINI_MODEL_CHAIN) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    let res: Response;
    try {
      res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } catch {
      lastError = new Error("Couldn't reach the analyzer. Check your connection.");
      continue;
    }
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error("Analyzer authentication failed.");
      lastError = new Error(res.status === 429 ? "Analyzer is busy. Try again in a minute." : "Couldn't analyze this. Try again.");
      continue;
    }
    const data = await res.json().catch(() => null);
    const cand = data?.candidates?.[0];
    if (data?.promptFeedback?.blockReason || cand?.finishReason === "SAFETY") {
      lastError = new Error("Couldn't process this input. Try a clearer photo or check the spelling.");
      continue;
    }
    const text = (cand?.content?.parts ?? []).map((p: any) => p?.text ?? "").join("").trim();
    if (text) {
      let s = text.replace(/^```(?:markdown|md)?\s*\n?/i, "").replace(/\n?```\s*$/, "").trim();
      const h = s.search(/^###\s/m);
      if (h > 0) s = s.slice(h).trim();
      return { markdown: s, modelUsed: model };
    }
    lastError = new Error("Empty response. Try again.");
  }
  throw lastError ?? new Error("All analyzers failed. Try again later.");
}

/** Look up a medicine by typed name. */
export async function analyzeMedicineByName(name: string): Promise<MedicineResult> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Analyzer is not configured. Please contact support.");
  const clean = name.trim();
  if (!clean) throw new Error("Please enter a medicine name.");
  const prompt = `You are Medibot's medicine information assistant. The user wants general information about a medicine they named: "${clean}".

If this is a recognizable medicine (generic or brand), provide its general information. If it is not a medicine or you cannot identify it, say so plainly and suggest checking the spelling or asking a pharmacist.

${SAFETY}

${OUTPUT_FORMAT}`;
  return callGemini([{ text: prompt }], apiKey);
}

/** Identify and explain a medicine from a photo of its strip/box. */
export async function analyzeMedicinePhoto(file: File): Promise<MedicineResult> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Analyzer is not configured. Please contact support.");
  if (!file.type.startsWith("image/")) throw new Error("Please upload an image of the medicine.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Image is too large (max 15 MB).");
  const base64 = await fileToBase64(file);
  const prompt = `You are Medibot's medicine information assistant. The user uploaded a PHOTO of a medicine (strip, box, bottle, or label). Read any visible name/text to identify the medicine, then provide general information about it.

If you cannot clearly read or identify the medicine from the photo, say so plainly and ask for a clearer, well-lit photo of the name — do NOT guess.

${SAFETY}

${OUTPUT_FORMAT}`;
  return callGemini([{ inlineData: { mimeType: file.type, data: base64 } }, { text: prompt }], apiKey);
}
