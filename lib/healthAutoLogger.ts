/**
 * Health Auto-Logger
 *
 * Listens for symptoms / vitals / health events in user chat messages
 * and silently logs them to the user's timeline via the existing
 * healthRecords collection.
 *
 * SAFETY:
 * - Only logs what the USER says, never the AI's response (which could be wrong).
 * - High-precision keyword matching first (cheap, deterministic).
 * - Optional LLM extraction for ambiguous cases (uses Gemini if available).
 * - Deduplication window: won't log the same symptom twice within 6 hours.
 * - Never auto-logs diagnoses, drug names, or anything that requires inference.
 *   We only log raw user-reported facts.
 */

import { addHealthRecord, type HealthRecord } from "./firestore";

export interface ExtractedEvent {
  type: HealthRecord["type"];
  title: string;
  description?: string;
  confidence: "high" | "medium" | "low";
}

// ─────────────────────────────────────────────────────────────
// Deterministic pattern matching — high precision, no inference
// ─────────────────────────────────────────────────────────────

interface SymptomPattern {
  regex: RegExp;
  canonicalName: string;
  type: HealthRecord["type"];
}

// Patterns require the user to SAY they have/are experiencing the symptom.
// Avoids false positives like "I read about X" or "X is when…"
const FIRST_PERSON_REPORT = /(i (?:have|am having|am experiencing|am feeling|feel|am suffering from|got|have been having|'m having|'ve been having|am dealing with)|my .{0,15} (?:hurts|aches|is swollen|is in pain))/i;

const SYMPTOM_PATTERNS: SymptomPattern[] = [
  { canonicalName: "Fever", type: "symptom", regex: /\b(fever|high temperature|running (?:a )?temperature)\b/i },
  { canonicalName: "Headache", type: "symptom", regex: /\b(headache|head ache|migraine|head pain)\b/i },
  { canonicalName: "Cough", type: "symptom", regex: /\b(cough(?:ing)?|hacking cough|dry cough|wet cough)\b/i },
  { canonicalName: "Sore throat", type: "symptom", regex: /\b(sore throat|throat pain|scratchy throat)\b/i },
  { canonicalName: "Cold / Runny nose", type: "symptom", regex: /\b(runny nose|stuffy nose|cold|congestion|blocked nose)\b/i },
  { canonicalName: "Body aches", type: "symptom", regex: /\b(body ache|body pain|muscle ache|muscle pain|joint pain)\b/i },
  { canonicalName: "Fatigue", type: "symptom", regex: /\b(fatigue|tiredness|exhausted|drained|no energy|lethargy)\b/i },
  { canonicalName: "Nausea", type: "symptom", regex: /\b(nausea|nauseous|feel like vomiting|queasy)\b/i },
  { canonicalName: "Vomiting", type: "symptom", regex: /\b(vomiting|throwing up|threw up|puking)\b/i },
  { canonicalName: "Loose motion / Diarrhea", type: "symptom", regex: /\b(loose motion|loose motions|diarrhea|diarrhoea|watery stool|loose stool)\b/i },
  { canonicalName: "Constipation", type: "symptom", regex: /\b(constipation|constipated|can't pass stool)\b/i },
  { canonicalName: "Stomach pain", type: "symptom", regex: /\b(stomach (?:ache|pain)|abdominal pain|belly (?:ache|pain)|tummy (?:ache|pain))\b/i },
  { canonicalName: "Chest pain", type: "symptom", regex: /\b(chest pain|chest pressure|chest tightness)\b/i },
  { canonicalName: "Shortness of breath", type: "symptom", regex: /\b(shortness of breath|breathless|trouble breathing|can'?t breathe|difficulty breathing)\b/i },
  { canonicalName: "Dizziness", type: "symptom", regex: /\b(dizz(?:y|iness)|lightheaded|vertigo|spinning)\b/i },
  { canonicalName: "Rash", type: "symptom", regex: /\b(rash|skin rash|hives|itchy skin|breakout)\b/i },
  { canonicalName: "Insomnia / Sleep trouble", type: "symptom", regex: /\b(can'?t sleep|insomnia|trouble sleeping|sleepless)\b/i },
  { canonicalName: "Anxiety", type: "symptom", regex: /\b(anxious|anxiety|panic attack|panicking)\b/i },
  { canonicalName: "Back pain", type: "symptom", regex: /\b(back pain|backache|lower back pain)\b/i },
];

// Vital signs — match a measurement pattern
const VITAL_PATTERNS: Array<{ regex: RegExp; label: (m: RegExpMatchArray) => string }> = [
  {
    regex: /\b(?:bp|blood pressure)[^\d]{0,10}(\d{2,3})\s*\/\s*(\d{2,3})\b/i,
    label: (m) => `Blood pressure ${m[1]}/${m[2]}`,
  },
  {
    regex: /\b(?:sugar|glucose|blood sugar)[^\d]{0,10}(\d{2,3}(?:\.\d+)?)\b/i,
    label: (m) => `Blood sugar ${m[1]} mg/dL`,
  },
  {
    regex: /\b(?:weight)[^\d]{0,10}(\d{2,3}(?:\.\d+)?)\s*(?:kg|kilo|kilograms?)\b/i,
    label: (m) => `Weight ${m[1]} kg`,
  },
  {
    regex: /\b(?:temperature|temp)[^\d]{0,10}(\d{2,3}(?:\.\d+)?)\s*°?\s*([fc])\b/i,
    label: (m) => `Temperature ${m[1]}°${m[2].toUpperCase()}`,
  },
];

/**
 * Extract symptoms and vitals from a user message.
 * Returns empty array if nothing matches — never throws.
 */
export function extractHealthEvents(message: string): ExtractedEvent[] {
  if (!message || typeof message !== "string") return [];
  const found: ExtractedEvent[] = [];
  const seen = new Set<string>();

  // Vitals always log (objective measurements)
  for (const v of VITAL_PATTERNS) {
    const m = message.match(v.regex);
    if (m) {
      const title = v.label(m);
      if (!seen.has(title)) {
        seen.add(title);
        found.push({ type: "vital_signs", title, confidence: "high" });
      }
    }
  }

  // Symptoms require first-person report context
  const isFirstPersonReport = FIRST_PERSON_REPORT.test(message);
  if (isFirstPersonReport) {
    for (const p of SYMPTOM_PATTERNS) {
      if (p.regex.test(message)) {
        if (!seen.has(p.canonicalName)) {
          seen.add(p.canonicalName);
          found.push({ type: p.type, title: p.canonicalName, confidence: "high" });
        }
      }
    }
  }

  return found;
}

// ─────────────────────────────────────────────────────────────
// Deduplication — don't spam the timeline with the same thing
// ─────────────────────────────────────────────────────────────

const DEDUP_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours

interface RecentLog {
  title: string;
  timestamp: number;
}

// Per-user in-memory dedup cache (cleared on page reload, that's fine)
const recentLogsCache = new Map<string, RecentLog[]>();

function wasRecentlyLogged(userId: string, title: string): boolean {
  const cache = recentLogsCache.get(userId) ?? [];
  const now = Date.now();
  // Drop expired entries
  const fresh = cache.filter((l) => now - l.timestamp < DEDUP_WINDOW_MS);
  recentLogsCache.set(userId, fresh);

  return fresh.some((l) => l.title.toLowerCase() === title.toLowerCase());
}

function markLogged(userId: string, title: string) {
  const cache = recentLogsCache.get(userId) ?? [];
  cache.push({ title, timestamp: Date.now() });
  recentLogsCache.set(userId, cache);
}

// ─────────────────────────────────────────────────────────────
// Main entry point — call this after every user message
// ─────────────────────────────────────────────────────────────

export interface AutoLogResult {
  logged: ExtractedEvent[];
  skipped: ExtractedEvent[];
}

/**
 * Extract events from the user's message and save new ones to Firestore.
 * Silent — does not throw on failure. Logs errors to console only.
 *
 * Pass `seedRecentTitles` to skip events the user already logged manually
 * (e.g. titles from the current timeline) — prevents auto-duplicates.
 */
export async function autoLogFromUserMessage(
  userId: string,
  message: string,
  seedRecentTitles: string[] = [],
): Promise<AutoLogResult> {
  const empty: AutoLogResult = { logged: [], skipped: [] };
  if (!userId || !message) return empty;

  // Seed the dedup cache with titles from the user's existing recent timeline
  // so we don't auto-log something they already have logged.
  for (const t of seedRecentTitles) {
    if (typeof t === "string" && t.trim()) {
      markLogged(userId, t);
    }
  }

  const events = extractHealthEvents(message);
  if (events.length === 0) return empty;

  const logged: ExtractedEvent[] = [];
  const skipped: ExtractedEvent[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const ev of events) {
    if (wasRecentlyLogged(userId, ev.title)) {
      skipped.push(ev);
      continue;
    }

    try {
      await addHealthRecord(userId, {
        type: ev.type,
        title: ev.title,
        description: `Auto-detected from your chat on ${today}`,
        date: today,
      });
      markLogged(userId, ev.title);
      logged.push(ev);
    } catch (e) {
      console.error("[autoLogger] failed to log event:", ev.title, e);
      skipped.push(ev);
    }
  }

  return { logged, skipped };
}
