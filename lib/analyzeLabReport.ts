/**
 * Lab Report Analyzer
 *
 * Sends a PDF or image of a medical lab report directly to Gemini's
 * multimodal API. No Cloudinary, no server, no text extraction —
 * the AI reads the file natively and returns structured markdown.
 *
 * Markdown output (not JSON) — far more robust against parser failures.
 *
 * SAFETY:
 * - Prompt forbids diagnosis and medication recommendations.
 * - Categorizes values only against the report's own reference ranges.
 * - All output framed as "things to discuss with your doctor."
 */

import { geminiGenerate } from "@/lib/aiClient";

// Fallback chain — tries each in order until one succeeds.
const GEMINI_MODEL_CHAIN = [
  "gemini-2.5-flash",  // Primary
  "gemini-2.5-pro",    // Fallback (higher quality, lower free quota)
];

/**
 * Convert a File to base64 (without the data: prefix).
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read file"));
        return;
      }
      const commaIdx = result.indexOf(",");
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader error"));
    reader.readAsDataURL(file);
  });
}

const ANALYSIS_PROMPT = `You are Medibot's lab report analyzer. Read the uploaded medical lab report and produce a clean, useful markdown analysis.

CRITICAL SAFETY RULES — NON-NEGOTIABLE:
1. You are NOT a doctor. NEVER diagnose. Don't write "you have X" or "this indicates X disease."
2. NEVER recommend, name, or suggest any medication, drug, brand, or dosage.
3. NEVER recommend treatments.
4. You CAN categorize values against the reference ranges PRINTED ON THE REPORT ITSELF.
5. You CAN explain in plain English what each test measures.
6. ALWAYS frame insights as "things to discuss with your doctor."
7. Borderline = within ~5% of the edge of the reference range.

WHAT TO INCLUDE — be strict and complete:
- ONLY include tests that have a NUMERIC result printed on the report (a value in the Results column).
- DO NOT include tests whose Results column is blank, missing, or "pending." Those go in the "Tests Pending Results" section.
- DO NOT invent or guess values that aren't shown.
- Read EVERY page of the PDF — multi-page reports often have results spread across pages 1, 2, 3, 4 and beyond. Do not stop at page 3.
- BEFORE you finish, count: did you include every numeric test from every page? If not, add the missing ones.
- COMPLETENESS IS MORE IMPORTANT THAN BREVITY. If a report has 30 tests, your analysis must cover all 30. Better to be slightly verbose than to skip a test.

OUTPUT FORMAT — return ONLY markdown, no JSON, no code fences. Use exactly this structure:

### Lab Report Analysis

**Report type:** <ONE short, plain-language category — e.g. "Heart Health Screening" or "Lipid & Blood Sugar Panel" or "Complete Blood Count". NOT a list of every test. Pick the most accurate single category a layperson would understand.>
**Patient:** <name> · <age> · <gender> · <date>
**Lab:** <lab name>

A 2-3 sentence plain-language overview of what this report covers and why a doctor might order it. No diagnosis.

### Results That Need Attention

List ALL tests with status [LOW], [BORDERLINE], [HIGH], or [CRITICAL] first. For each, write ONE block:

**[STATUS] Test Name** — value unit  _(normal: <range>)_
One short sentence: what the test measures + what this specific result means in plain words. No diagnosis.

If there are NO abnormal results, write a single line: "All your tested values are within normal range — great news."

### Normal Results

List ALL tests with status [NORMAL] in a compact format, one per line:

**[NORMAL] Test Name** — value unit _(normal: <range>)_

(No explanation needed for normal results — keep this section tight.)

Rules:
- Cover EVERY test on the report that has a numeric/categorical result. Do not skip any.
- Allowed [STATUS] tags: [NORMAL] [LOW] [BORDERLINE] [HIGH] [CRITICAL]
- DO NOT use [UNKNOWN] anywhere — if the value is missing, list the test name in the Pending section at the bottom instead.

### Worth Noting

Bullet list of plain-language observations. Each bullet says WHAT (which value is off and by how much) but never WHY. If everything is normal, write one positive bullet.

### Questions to Ask Your Doctor

3-5 specific, personalized questions the user could ask their doctor.

### Tests Pending Results

ONLY include this section if some tests on the report have blank/missing Results columns. Format:
- <Test name 1>
- <Test name 2>

Add one line at the end: *"These tests appear on the report but don't have results filled in — they may still be processing, or the lab may not have completed them. Check with your provider."*

If ALL tests have results, OMIT this entire section.

---

*This analysis is for your understanding only. It is not a diagnosis. Please review these results with a qualified doctor who can interpret them in the context of your full health history.*

LANGUAGE RULES:
- Plain language for a non-medical reader.
- If you must use a medical term (e.g. "LDL"), explain it in parentheses ("LDL — the 'bad' cholesterol that builds up in arteries").
- Be warm but factual.
- No emojis.

FINAL CHECKLIST before you stop generating — confirm internally:
[ ] Did I list every abnormal test from every page in "Results That Need Attention"?
[ ] Did I list every normal test (one line each) in "Normal Results"?
[ ] Did I write the "Worth Noting" bullets?
[ ] Did I write the "Questions to Ask Your Doctor" section?
[ ] Did I write "Tests Pending Results" if any were blank?
[ ] Did I include the final disclaimer line?

Do not stop until all six sections exist. Return ONLY the markdown. No preamble like "Here is your analysis:" — start directly with "### Lab Report Analysis".`;

export interface LabAnalysisResult {
  markdown: string;
  modelUsed: string;
  kind: "report" | "symptom";
}

/**
 * Symptom-photo analysis prompt. Used when the user uploads an IMAGE that is a
 * photo of a body part / skin / eye / wound rather than a document.
 * STRICTLY observational — never diagnoses.
 */
const SYMPTOM_PHOTO_PROMPT = `You are Medibot analyzing a photo a user shared of a physical symptom (e.g. skin rash, wound, eye, swelling, nail, mouth, or other body part).

CRITICAL SAFETY RULES — NON-NEGOTIABLE:
1. You are NOT a doctor and CANNOT see this person in real life. NEVER diagnose. Do NOT name a specific disease or condition ("this is eczema/ringworm/melanoma" is FORBIDDEN).
2. NEVER recommend, name, or suggest any medication, drug, cream, or treatment.
3. Describe ONLY what is visually observable — color, size estimate, shape, location, texture, distribution, borders. Nothing more.
4. ALWAYS tell the user to have it evaluated by a qualified doctor or dermatologist.
5. If the image shows anything that could be urgent (heavy bleeding, deep wound, signs of severe infection like spreading redness/pus, a mole with irregular borders/colors, blue lips, severe swelling), tell them to seek prompt medical care.

OUTPUT FORMAT — return ONLY markdown, no code fences. Use exactly this structure:

### What I Can See

A short, plain-language description of what is visually observable in the photo (2-4 sentences). Describe objectively. Do NOT diagnose.

### What to Tell Your Doctor

A bullet list of useful details the user should mention to their doctor (e.g. how long it's been there, whether it itches/hurts/changes, any spreading). 3-5 bullets.

### When to Seek Care Sooner

One or two short bullets on warning signs that mean they shouldn't wait.

---

*This is a visual observation only, not a diagnosis. A photo cannot replace an in-person exam. Please have this looked at by a qualified doctor.*

LANGUAGE & STYLE:
- Plain language, warm but factual. No emojis.
- If you genuinely cannot tell what the image shows, say so and ask them to retake a clearer, well-lit photo.

Return ONLY the markdown, starting directly with "### What I Can See".`;

export interface LabFinding {
  name: string;
  value: string;
  status: "LOW" | "BORDERLINE" | "HIGH" | "CRITICAL";
  range?: string;
}

export interface ParsedReportMeta {
  reportType?: string;
  reportDate?: string; // ISO yyyy-mm-dd if parseable
  findings: LabFinding[];
}

/**
 * Parse the analysis markdown to extract structured abnormal findings and the
 * report's metadata. Used to feed findings into the user's Health Memory.
 *
 * Matches lines like:
 *   **[CRITICAL] Total Bilirubin** — 5.00 mg/dL _(normal: 0.30-1.20)_
 */
export function parseReportFindings(markdown: string): ParsedReportMeta {
  const result: ParsedReportMeta = { findings: [] };
  if (!markdown) return result;

  const clean = markdown.replace("[[LAB_REPORT]]", "");
  const lines = clean.split("\n");

  for (const line of lines) {
    // Report type
    const typeMatch = line.match(/^\*\*Report type:\*\*\s*(.+)$/i);
    if (typeMatch) result.reportType = typeMatch[1].trim();

    // Report date — from "**Patient:** Name · age · gender · DATE"
    if (!result.reportDate) {
      const patientMatch = line.match(/^\*\*Patient:\*\*\s*(.+)$/i);
      if (patientMatch) {
        const parts = patientMatch[1].split("·").map((s) => s.trim());
        for (const p of parts.reverse()) {
          const d = Date.parse(p);
          if (!isNaN(d)) {
            result.reportDate = new Date(d).toISOString().slice(0, 10);
            break;
          }
        }
      }
    }

    // Abnormal finding line
    const m = line.match(/^\*\*\[(LOW|BORDERLINE|HIGH|CRITICAL)\]\s+(.+?)\*\*\s*[—-]\s*(.+?)(?:\s*_\(normal:\s*(.+?)\)_)?\s*$/i);
    if (m) {
      result.findings.push({
        status: m[1].toUpperCase() as LabFinding["status"],
        name: m[2].trim(),
        value: m[3].trim(),
        range: m[4]?.trim(),
      });
    }
  }

  return result;
}

/**
 * When the user asks a specific question along with their upload, we answer
 * THAT question using the report — instead of (or alongside) the full structured
 * analysis. Same safety rules apply.
 */
/**
 * When the user asks a question with their upload, we STILL produce the full
 * structured analysis (so findings can be parsed into Health Memory) — we just
 * prepend a directive to also answer their question in a dedicated section.
 * This keeps the parseable [STATUS] lines intact while honoring the question.
 */
function buildPromptWithQuestion(userQuestion: string): string {
  return `The user uploaded this medical report AND asked a specific question: "${userQuestion}"

Do BOTH of the following, in this order:

1. Immediately after the "### Lab Report Analysis" header block and overview paragraph, add a section titled "### Your Question" that answers their question directly and conversationally in plain language, referencing the actual values from the report. Explain any medical term in parentheses. Follow all safety rules (no diagnosis, no medications, frame as "discuss with your doctor").

2. Then continue with the COMPLETE structured analysis exactly as specified below — including "### Results That Need Attention", "### Normal Results", "### Worth Noting", "### Questions to Ask Your Doctor", and the rest. Do NOT skip the structured sections; they are required.

Here is the full structured format you must follow for everything after the "### Your Question" section:

${ANALYSIS_PROMPT}`;
}

/**
 * Analyze a lab report file (PDF or image) using Gemini multimodal API.
 * If `userQuestion` is provided, the AI answers that question using the report
 * instead of producing the full structured analysis.
 * Returns the markdown analysis. Throws with a user-friendly message on hard failures.
 */
export async function analyzeLabReport(file: File, userQuestion?: string): Promise<LabAnalysisResult> {
  const supportedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
  if (!supportedTypes.includes(file.type)) {
    throw new Error(`This file type (${file.type || "unknown"}) is not supported for analysis. Please upload a PDF or image.`);
  }

  // The file is sent to our own API route (which holds the AI key), so it must
  // fit under the serverless request-body limit. 3 MB raw keeps the base64
  // payload comfortably under that ceiling.
  const MAX_BYTES = 3 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error("File is too large. Please upload a report under 3 MB.");
  }

  const base64 = await fileToBase64(file);

  // If the user asked a specific question, answer it. Otherwise, full analysis.
  const trimmedQuestion = userQuestion?.trim();
  const hasQuestion =
    !!trimmedQuestion &&
    trimmedQuestion.toLowerCase() !== "file uploaded" &&
    trimmedQuestion.toLowerCase() !== "please analyze this report";

  // PDFs are always documents → report analysis. Images could be a photo of a
  // report OR a photo of a physical symptom — so for images we ask the model to
  // classify and respond in the matching format.
  const isImage = file.type.startsWith("image/");
  let promptText: string;
  if (isImage) {
    promptText = `You are Medibot. First, decide what this image is:
- If it is a medical DOCUMENT (lab report, test result, prescription, discharge summary), respond using FORMAT A below.
- If it is a PHOTO OF A PHYSICAL SYMPTOM (skin, rash, wound, eye, swelling, nail, mouth, or any body part), respond using FORMAT B below.

Output ONLY the chosen format's markdown — nothing else, no explanation of which you picked.

═══════ FORMAT A (medical document) ═══════
${hasQuestion ? buildPromptWithQuestion(trimmedQuestion!) : ANALYSIS_PROMPT}

═══════ FORMAT B (symptom photo) ═══════
${SYMPTOM_PHOTO_PROMPT}`;
  } else {
    promptText = hasQuestion ? buildPromptWithQuestion(trimmedQuestion!) : ANALYSIS_PROMPT;
  }

  const body = {
    contents: [
      {
        parts: [
          { inlineData: { mimeType: file.type, data: base64 } },
          { text: promptText },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      // 65536 is the Gemini 2.5 family maximum — effectively "use what you need".
      // The model will only output what it generates; this just removes our artificial ceiling.
      maxOutputTokens: 65536,
    },
  };

  let lastError: Error | null = null;

  for (const model of GEMINI_MODEL_CHAIN) {
    // Non-streaming generateContent. This returns the full response in one JSON
    // body. We read EVERY part in candidates[0].content.parts and concatenate them
    // (Gemini splits long outputs across multiple parts within the single candidate).
    let response: Response;
    try {
      response = await geminiGenerate({
        model,
        contents: body.contents,
        generationConfig: body.generationConfig,
      });
    } catch (e) {
      lastError = new Error("Couldn't reach the AI analyzer. Check your internet connection.");
      console.warn(`[analyzeLabReport] network error on ${model}, trying next…`, e);
      continue;
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.warn(`[analyzeLabReport] ${model} returned ${response.status}: ${errText.slice(0, 200)}`);

      if (response.status === 401 || response.status === 403) {
        throw new Error("AI analyzer authentication failed. Please check your API key.");
      }
      if (response.status === 429 || response.status === 404 || response.status === 503) {
        lastError = new Error(
          response.status === 429
            ? "AI analyzer is rate-limited. Wait a minute and try again."
            : "This model isn't available right now.",
        );
        continue;
      }
      lastError = new Error("The AI couldn't read this report. It may be unclear, password-protected, or not a recognizable lab report.");
      continue;
    }

    let data: any;
    try {
      data = await response.json();
    } catch (e) {
      lastError = new Error("The AI returned an unreadable response. Try uploading again.");
      console.warn(`[analyzeLabReport] ${model} JSON parse failed`, e);
      continue;
    }

    const promptBlock: string | undefined = data?.promptFeedback?.blockReason;
    const candidate = data?.candidates?.[0];
    const finishReason: string | undefined = candidate?.finishReason;
    const parts: Array<{ text?: string }> = candidate?.content?.parts ?? [];
    const text = parts.map((p) => (typeof p?.text === "string" ? p.text : "")).join("").trim();

    console.log(
      `[analyzeLabReport] ${model} finish=${finishReason ?? "n/a"} ` +
      `parts=${parts.length} chars=${text.length} promptBlock=${promptBlock ?? "none"}`,
    );

    // Input-level block (watermarked/scanned PDFs sometimes trip this)
    if (promptBlock || finishReason === "SAFETY" || finishReason === "RECITATION" || finishReason === "BLOCKLIST") {
      lastError = new Error(
        `The AI couldn't process this report (${promptBlock ?? finishReason}). Try a clearer scan or a different report.`,
      );
      continue;
    }

    if (text) {
      const markdown =
        finishReason === "MAX_TOKENS"
          ? `${cleanMarkdown(text)}\n\n---\n*Note: this report is very long and the analysis may be incomplete. Ask your doctor to review the full report.*`
          : cleanMarkdown(text);
      // Detect which format the model produced (symptom photos start with "What I Can See").
      const kind: "report" | "symptom" = /^###\s*What I Can See/im.test(markdown) ? "symptom" : "report";
      console.log(`[analyzeLabReport] ${model} returning ${markdown.length} chars (kind=${kind})`);
      return { markdown, modelUsed: model, kind };
    }

    lastError = new Error("The AI returned an empty response. Try uploading again.");
    console.warn(`[analyzeLabReport] ${model} empty text, trying next…`);
    continue;
  }

  throw lastError ?? new Error("All AI analyzers failed. Please try again later.");
}

/**
 * Strip common AI wrapper artifacts: markdown code fences, leading preamble.
 */
function cleanMarkdown(raw: string): string {
  let s = raw.trim();
  // Strip ```markdown ... ``` or ``` ... ``` wrappers
  s = s.replace(/^```(?:markdown|md)?\s*\n?/i, "").replace(/\n?```\s*$/, "");
  // Strip leading "Here is..." / "Sure!..." preamble before the first ###
  const firstHeading = s.search(/^###\s/m);
  if (firstHeading > 0) s = s.slice(firstHeading);
  return s.trim();
}
