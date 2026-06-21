/**
 * Free-tier monthly usage limits for AI analysis features.
 *
 * Counters live on the user's profile doc (users/{uid}.usage) so the existing
 * owner-write Firestore rule covers them — no new collection or rule deploy needed.
 * Premium users are never limited.
 */

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export type AnalysisFeature = "report" | "image";

export const FREE_MONTHLY_LIMITS: Record<AnalysisFeature, number> = {
  report: 3, // lab report analyses / month
  image: 3, // symptom photo analyses / month
};

export interface UsageState {
  month: string; // "YYYY-MM"
  report: number;
  image: number;
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

/** Read usage for the current month (resets automatically when the month rolls over). */
export async function getUsage(userId: string): Promise<UsageState> {
  const fresh: UsageState = { month: currentMonth(), report: 0, image: 0 };
  if (!userId) return fresh;
  try {
    const snap = await getDoc(doc(db, "users", userId));
    const u = snap.exists() ? (snap.data() as any).usage : null;
    if (u && u.month === currentMonth()) {
      return {
        month: u.month,
        report: typeof u.report === "number" ? u.report : 0,
        image: typeof u.image === "number" ? u.image : 0,
      };
    }
  } catch (e) {
    console.warn("getUsage failed:", e);
  }
  return fresh;
}

export function remaining(usage: UsageState, feature: AnalysisFeature): number {
  return Math.max(0, FREE_MONTHLY_LIMITS[feature] - (usage[feature] ?? 0));
}

/**
 * Can the user analyze this file right now?
 * Premium → always. Free → must have budget for the relevant feature.
 * For images we don't know report-vs-symptom until after analysis, so we allow
 * if EITHER bucket has budget, then increment the detected kind afterward.
 */
export function canAnalyze(
  usage: UsageState,
  plan: string | undefined,
  fileType: string,
): { allowed: boolean; blockedFeature?: AnalysisFeature } {
  if (plan === "premium") return { allowed: true };
  const isImage = fileType.startsWith("image/");
  if (isImage) {
    if (remaining(usage, "image") > 0 || remaining(usage, "report") > 0) return { allowed: true };
    return { allowed: false, blockedFeature: "image" };
  }
  // PDF / document → report bucket
  if (remaining(usage, "report") > 0) return { allowed: true };
  return { allowed: false, blockedFeature: "report" };
}

/** Increment the counter for a feature after a successful analysis (free users only). */
export async function incrementUsage(userId: string, feature: AnalysisFeature, plan: string | undefined): Promise<void> {
  if (!userId || plan === "premium") return;
  try {
    const usage = await getUsage(userId);
    const next: UsageState = {
      month: currentMonth(),
      report: usage.report,
      image: usage.image,
    };
    next[feature] = (next[feature] ?? 0) + 1;
    await updateDoc(doc(db, "users", userId), { usage: next });
  } catch (e) {
    console.warn("incrementUsage failed:", e);
  }
}
