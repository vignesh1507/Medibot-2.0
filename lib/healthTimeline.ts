/**
 * Health Timeline — aggregates a user's health data across all sources
 * into a unified, chronological view.
 *
 * SAFETY CONTRACT:
 * - Every function MUST filter by userId. No cross-user data ever.
 * - Reads are non-destructive. Never mutates source data.
 * - Handles missing/malformed fields gracefully — never throws on data shape.
 * - For AI memory injection, ONLY user-recorded facts are surfaced —
 *   not past AI responses, to avoid amplifying hallucinations.
 */

import { Timestamp } from "firebase/firestore";
import {
  getUserMedications,
  getUserHealthRecords,
  getUserSummaries,
  getUserChatSessions,
  getUserProfile,
  type Medication,
  type HealthRecord,
  type SummaryRequest,
  type ChatSession,
  type UserProfile,
} from "./firestore";

export type TimelineEventType =
  | "medication-started"
  | "medication-stopped"
  | "symptom"
  | "appointment"
  | "test-result"
  | "vital-signs"
  | "summary"
  | "chat-session"
  | "condition"
  | "allergy";

export interface TimelineEvent {
  id: string;
  userId: string;
  type: TimelineEventType;
  timestamp: number; // unix ms — single source of truth for sorting
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  sourceCollection: string; // for debugging / "view source" links
}

/**
 * Convert any timestamp-shaped value to unix milliseconds.
 * Returns 0 if it can't be parsed — caller can filter those out.
 */
export function toUnixMs(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value > 1e12 ? value : value * 1000;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  // Firestore Timestamp shape
  if (typeof value === "object" && value !== null) {
    const v = value as { seconds?: number; toMillis?: () => number; toDate?: () => Date };
    if (typeof v.toMillis === "function") return v.toMillis();
    if (typeof v.toDate === "function") return v.toDate().getTime();
    if (typeof v.seconds === "number") return v.seconds * 1000;
  }
  return 0;
}

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

// ─────────────────────────────────────────────────────────────
// Per-source extractors. Each takes raw collection data and
// returns TimelineEvent[]. All gracefully handle missing fields.
// ─────────────────────────────────────────────────────────────

export function extractMedicationEvents(meds: Medication[], userId: string): TimelineEvent[] {
  if (!Array.isArray(meds)) return [];
  const events: TimelineEvent[] = [];

  for (const med of meds) {
    if (!med || med.userId !== userId) continue; // defense-in-depth

    const name = safeString(med.name, "Unknown medication");
    const dosage = safeString(med.dosage);
    const startTs = toUnixMs(med.startDate) || toUnixMs(med.createdAt);

    if (startTs > 0) {
      events.push({
        id: `med-start-${med.id ?? name}-${startTs}`,
        userId,
        type: "medication-started",
        timestamp: startTs,
        title: `Started ${name}`,
        description: [dosage, safeString(med.frequency), safeString(med.notes)]
          .filter(Boolean)
          .join(" · "),
        metadata: { medicationId: med.id, dosage, frequency: med.frequency },
        sourceCollection: "medications",
      });
    }

    // Only emit stop event if explicitly inactive AND we have an endDate
    if (med.isActive === false && med.endDate) {
      const endTs = toUnixMs(med.endDate);
      if (endTs > 0) {
        events.push({
          id: `med-end-${med.id ?? name}-${endTs}`,
          userId,
          type: "medication-stopped",
          timestamp: endTs,
          title: `Stopped ${name}`,
          metadata: { medicationId: med.id },
          sourceCollection: "medications",
        });
      }
    }
  }

  return events;
}

export function extractHealthRecordEvents(records: HealthRecord[], userId: string): TimelineEvent[] {
  if (!Array.isArray(records)) return [];
  const events: TimelineEvent[] = [];

  for (const rec of records) {
    if (!rec || rec.userId !== userId) continue;

    const ts = toUnixMs(rec.date) || toUnixMs(rec.createdAt);
    if (ts === 0) continue;

    const typeMap: Record<HealthRecord["type"], TimelineEventType> = {
      symptom: "symptom",
      appointment: "appointment",
      test_result: "test-result",
      vital_signs: "vital-signs",
    };

    events.push({
      id: `record-${rec.id ?? ts}`,
      userId,
      type: typeMap[rec.type] ?? "symptom",
      timestamp: ts,
      title: safeString(rec.title, "Health event"),
      description: safeString(rec.description),
      metadata: { recordId: rec.id, attachments: rec.attachments ?? [] },
      sourceCollection: "healthRecords",
    });
  }

  return events;
}

export function extractSummaryEvents(summaries: SummaryRequest[], userId: string): TimelineEvent[] {
  if (!Array.isArray(summaries)) return [];
  const events: TimelineEvent[] = [];

  for (const s of summaries) {
    if (!s || s.userId !== userId) continue;
    const ts = toUnixMs(s.createdAt);
    if (ts === 0) continue;

    const category = safeString(s.category, "general");
    const preview = safeString(s.originalText).slice(0, 120);

    events.push({
      id: `summary-${s.id ?? ts}`,
      userId,
      type: "summary",
      timestamp: ts,
      title: `Summarized: ${category}`,
      description: preview + (s.originalText && s.originalText.length > 120 ? "…" : ""),
      metadata: { summaryId: s.id, category, summary: safeString(s.summary) },
      sourceCollection: "summaries",
    });
  }

  return events;
}

export function extractChatSessionEvents(sessions: ChatSession[], userId: string): TimelineEvent[] {
  if (!Array.isArray(sessions)) return [];
  const events: TimelineEvent[] = [];

  for (const sess of sessions) {
    if (!sess || sess.userId !== userId) continue;
    // Skip empty sessions
    if (!Array.isArray(sess.messages) || sess.messages.length === 0) continue;

    const ts = toUnixMs(sess.updatedAt) || toUnixMs(sess.createdAt);
    if (ts === 0) continue;

    // Use first user message as the description, not the AI response
    const firstUserMsg = sess.messages.find((m) => safeString(m.message))?.message ?? "";

    events.push({
      id: `chat-${sess.id ?? ts}`,
      userId,
      type: "chat-session",
      timestamp: ts,
      title: safeString(sess.title, "Health discussion"),
      description: safeString(firstUserMsg).slice(0, 140),
      metadata: { sessionId: sess.id, messageCount: sess.messages.length },
      sourceCollection: "chatSessions",
    });
  }

  return events;
}

export function extractProfileEvents(profile: UserProfile | null, userId: string): TimelineEvent[] {
  if (!profile || profile.uid !== userId) return [];
  const events: TimelineEvent[] = [];
  const baseTs = toUnixMs(profile.createdAt) || Date.now();

  const NOISE_VALUES = new Set(["", "none", "n/a", "na", "-", "nil", "no", "nothing"]);
  const isMeaningful = (v: string) => !NOISE_VALUES.has(v.trim().toLowerCase());

  const conditions = profile.medicalInfo?.conditions ?? [];
  for (const c of conditions) {
    const name = safeString(c);
    if (!isMeaningful(name)) continue;
    events.push({
      id: `condition-${name}`,
      userId,
      type: "condition",
      timestamp: baseTs,
      title: name,
      description: "Listed in profile medical information",
      sourceCollection: "users",
    });
  }

  const allergies = profile.medicalInfo?.allergies ?? [];
  for (const a of allergies) {
    const name = safeString(a);
    if (!isMeaningful(name)) continue;
    events.push({
      id: `allergy-${name}`,
      userId,
      type: "allergy",
      timestamp: baseTs,
      title: `Allergy: ${name}`,
      description: "Listed in profile medical information",
      sourceCollection: "users",
    });
  }

  return events;
}

// ─────────────────────────────────────────────────────────────
// MAIN AGGREGATOR
// ─────────────────────────────────────────────────────────────

export interface TimelineSnapshot {
  events: TimelineEvent[];
  profile: UserProfile | null;
  counts: {
    total: number;
    byType: Partial<Record<TimelineEventType, number>>;
  };
}

/**
 * Build the full health timeline for a user, sorted newest-first.
 * Safe to call with no data — returns empty arrays.
 */
export async function buildHealthTimeline(userId: string): Promise<TimelineSnapshot> {
  if (!userId || typeof userId !== "string") {
    return {
      events: [],
      profile: null,
      counts: { total: 0, byType: {} },
    };
  }

  // Fetch all sources in parallel. Each catches its own error so one bad source
  // doesn't kill the whole timeline.
  const [profile, meds, records, summaries, sessions] = await Promise.all([
    getUserProfile(userId).catch((e) => {
      console.error("[Timeline] profile fetch failed:", e);
      return null;
    }),
    getUserMedications(userId).catch((e) => {
      console.error("[Timeline] medications fetch failed:", e);
      return [] as Medication[];
    }),
    getUserHealthRecords(userId).catch((e) => {
      console.error("[Timeline] health records fetch failed:", e);
      return [] as HealthRecord[];
    }),
    getUserSummaries(userId).catch((e) => {
      console.error("[Timeline] summaries fetch failed:", e);
      return [] as SummaryRequest[];
    }),
    getUserChatSessions(userId).catch((e) => {
      console.error("[Timeline] chat sessions fetch failed:", e);
      return [] as ChatSession[];
    }),
  ]);

  const events: TimelineEvent[] = [
    ...extractProfileEvents(profile, userId),
    ...extractMedicationEvents(meds, userId),
    ...extractHealthRecordEvents(records, userId),
    ...extractSummaryEvents(summaries, userId),
    ...extractChatSessionEvents(sessions, userId),
  ];

  // Final safety filter — no event without a userId match makes it out
  const safeEvents = events.filter((e) => e.userId === userId && e.timestamp > 0);

  // Sort newest first
  safeEvents.sort((a, b) => b.timestamp - a.timestamp);

  // Compute counts
  const byType: Partial<Record<TimelineEventType, number>> = {};
  for (const e of safeEvents) {
    byType[e.type] = (byType[e.type] ?? 0) + 1;
  }

  return {
    events: safeEvents,
    profile,
    counts: { total: safeEvents.length, byType },
  };
}

// ─────────────────────────────────────────────────────────────
// AI MEMORY — what gets injected into chat prompt
// ─────────────────────────────────────────────────────────────

/**
 * Build a compact, factual summary of the user's health to inject
 * into the chat AI's system prompt.
 *
 * SAFETY: Only includes user-recorded facts. Does NOT include past
 * AI responses (which may have been hallucinations). Doctor-level
 * facts only — meds, conditions, allergies, recent user-logged events.
 *
 * Returns empty string if user has no data — safe to concat.
 */
export function buildAIMemoryContext(snapshot: TimelineSnapshot): string {
  if (!snapshot || !snapshot.profile) return "";

  const lines: string[] = [];
  const profile = snapshot.profile;

  // Identity context — first name only, for warmth
  const firstName = (profile.displayName ?? "").split(" ")[0];
  if (firstName) lines.push(`User's name: ${firstName}`);

  if (profile.dateOfBirth) {
    const dob = new Date(profile.dateOfBirth);
    if (!isNaN(dob.getTime())) {
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age > 0 && age < 130) lines.push(`Age: ${age}`);
    }
  }

  if (profile.gender) lines.push(`Gender: ${profile.gender}`);
  if (profile.medicalInfo?.bloodType) lines.push(`Blood type: ${profile.medicalInfo.bloodType}`);

  const allergies = profile.medicalInfo?.allergies ?? [];
  const realAllergies = allergies.filter((a) => safeString(a) && safeString(a).toLowerCase() !== "none");
  if (realAllergies.length > 0) {
    lines.push(`Known allergies: ${realAllergies.join(", ")}`);
  }

  const conditions = profile.medicalInfo?.conditions ?? [];
  const realConditions = conditions.filter((c) => safeString(c) && safeString(c).toLowerCase() !== "none");
  if (realConditions.length > 0) {
    lines.push(`Known conditions: ${realConditions.join(", ")}`);
  }

  // Active medications — derived from medication-started events with no matching stop
  const startedMeds = snapshot.events.filter((e) => e.type === "medication-started");
  const stoppedMedIds = new Set(
    snapshot.events
      .filter((e) => e.type === "medication-stopped")
      .map((e) => e.metadata?.medicationId)
      .filter(Boolean),
  );
  const activeMeds = startedMeds
    .filter((e) => !stoppedMedIds.has(e.metadata?.medicationId))
    .slice(0, 10); // cap to keep prompt small

  if (activeMeds.length > 0) {
    const medList = activeMeds
      .map((m) => {
        const name = m.title.replace(/^Started /, "");
        const dosage = safeString(m.metadata?.dosage);
        return dosage ? `${name} (${dosage})` : name;
      })
      .join(", ");
    lines.push(`Current medications: ${medList}`);
  }

  // Recent user-logged events (last 60 days, max 5) — symptoms, vitals, test results
  const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
  const recentLogs = snapshot.events
    .filter(
      (e) =>
        e.timestamp >= sixtyDaysAgo &&
        (e.type === "symptom" || e.type === "vital-signs" || e.type === "test-result" || e.type === "appointment"),
    )
    .slice(0, 5);

  if (recentLogs.length > 0) {
    lines.push("Recent health log:");
    for (const log of recentLogs) {
      const date = new Date(log.timestamp).toISOString().slice(0, 10);
      lines.push(`- ${date}: ${log.title}${log.description ? ` — ${log.description}` : ""}`);
    }
  }

  if (lines.length === 0) return "";

  return [
    "USER HEALTH PROFILE (verified user-recorded data only — use this to personalize your response):",
    ...lines,
  ].join("\n");
}
