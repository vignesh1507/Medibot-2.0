/**
 * Export the user's full health data (premium feature).
 * Produces a structured JSON download of their entire timeline + profile.
 * Pure client-side — no server, no third-party. Privacy-preserving.
 */

import type { TimelineSnapshot } from "./healthTimeline";

function triggerDownload(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportHealthData(snapshot: TimelineSnapshot, displayName?: string) {
  const profile = snapshot.profile;
  const exportObj = {
    exportedAt: new Date().toISOString(),
    source: "Medibot — AI Health Companion",
    patient: profile
      ? {
          name: profile.displayName ?? null,
          email: profile.email ?? null,
          dateOfBirth: profile.dateOfBirth ?? null,
          gender: profile.gender ?? null,
          bloodType: profile.medicalInfo?.bloodType ?? null,
          allergies: (profile.medicalInfo?.allergies ?? []).filter((a) => a && a.toLowerCase() !== "none"),
          conditions: (profile.medicalInfo?.conditions ?? []).filter((c) => c && c.toLowerCase() !== "none"),
          emergencyContact: profile.emergencyContact ?? null,
        }
      : null,
    totals: snapshot.counts,
    events: snapshot.events.map((e) => ({
      date: new Date(e.timestamp).toISOString(),
      type: e.type,
      title: e.title,
      description: e.description ?? null,
      source: e.sourceCollection,
    })),
  };

  const safeName = (displayName || "medibot").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const stamp = new Date().toISOString().slice(0, 10);
  triggerDownload(`${safeName}-health-data-${stamp}.json`, JSON.stringify(exportObj, null, 2), "application/json");
}
