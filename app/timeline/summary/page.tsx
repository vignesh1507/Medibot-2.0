"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/auth-guard";
import { buildHealthTimeline, type TimelineSnapshot } from "@/lib/healthTimeline";
import { Printer, Loader2 } from "lucide-react";

/**
 * Doctor visit summary — a clean, printable single-page report.
 * Designed to be opened in a new tab and printed via Cmd+P.
 *
 * Sections (in order most useful to a doctor):
 * 1. Patient identity
 * 2. Known allergies (red box — most important)
 * 3. Known conditions
 * 4. Current medications
 * 5. Recent symptoms (last 60 days)
 * 6. Recent vitals (last 60 days)
 * 7. Recent test results
 * 8. Recent doctor visits
 * 9. Recent topics discussed with Medibot
 */

function formatDate(ts: number): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function calculateAge(dob?: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const age = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return age > 0 && age < 130 ? age : null;
}

export default function HealthSummaryPage() {
  const [snapshot, setSnapshot] = useState<TimelineSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();
  const isPremium = userProfile?.plan === "premium";

  useEffect(() => {
    if (!user?.uid) return;
    buildHealthTimeline(user.uid)
      .then((s) => setSnapshot(s))
      .catch((e) => console.error("Summary load failed:", e))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-teal-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Preparing your health summary…</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Premium gate — direct navigation guard for free users.
  if (!isPremium) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-5 text-white">
              <h1 className="text-lg font-bold">Doctor Visit PDF — Premium</h1>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-gray-700 leading-relaxed">
                The doctor-ready health summary PDF is a Medibot Premium feature. Upgrade to generate a clean, printable one-pager of your full health history for every appointment.
              </p>
              <div className="mt-5 flex gap-2">
                <a href="/timeline" className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Back
                </a>
                <a href="/pricing" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-blue-600 text-white text-sm font-semibold">
                  Upgrade
                </a>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const profile = snapshot?.profile ?? null;
  const events = snapshot?.events ?? [];

  const allergies = (profile?.medicalInfo?.allergies ?? [])
    .map((a) => (a ?? "").trim())
    .filter((a) => a && a.toLowerCase() !== "none");

  const conditions = (profile?.medicalInfo?.conditions ?? [])
    .map((c) => (c ?? "").trim())
    .filter((c) => c && c.toLowerCase() !== "none");

  // Active medications — started, not stopped
  const stoppedMedIds = new Set(
    events
      .filter((e) => e.type === "medication-stopped")
      .map((e) => e.metadata?.medicationId)
      .filter(Boolean),
  );
  const activeMeds = events
    .filter((e) => e.type === "medication-started" && !stoppedMedIds.has(e.metadata?.medicationId))
    .sort((a, b) => b.timestamp - a.timestamp);

  const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
  const recentSymptoms = events.filter((e) => e.type === "symptom" && e.timestamp >= sixtyDaysAgo);
  const recentVitals = events.filter((e) => e.type === "vital-signs" && e.timestamp >= sixtyDaysAgo);
  const recentTests = events.filter((e) => e.type === "test-result" && e.timestamp >= sixtyDaysAgo);
  const recentVisits = events.filter((e) => e.type === "appointment" && e.timestamp >= sixtyDaysAgo);
  const recentChats = events.filter((e) => e.type === "chat-session" && e.timestamp >= sixtyDaysAgo).slice(0, 8);

  const age = calculateAge(profile?.dateOfBirth);
  const generatedDate = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-100 print:bg-white py-6 print:py-0">
        {/* Print controls — hidden when printing */}
        <div className="max-w-[800px] mx-auto px-4 mb-4 print:hidden flex items-center justify-between">
          <a href="/timeline" className="text-sm text-teal-700 hover:underline">
            ← Back to Health Memory
          </a>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg text-sm"
          >
            <Printer className="h-4 w-4" />
            Print or Save as PDF
          </button>
        </div>

        {/* Summary page — designed for A4 print */}
        <article className="max-w-[800px] mx-auto bg-white shadow-md print:shadow-none p-8 print:p-6 text-gray-900 text-[13px] leading-relaxed">
          {/* Header */}
          <header className="border-b-2 border-gray-900 pb-4 mb-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Health Summary</h1>
                <p className="text-xs text-gray-600 mt-1">Generated by Medibot · {generatedDate}</p>
              </div>
              <div className="text-right text-xs text-gray-600">
                <p className="font-semibold text-gray-900 text-sm">Medibot</p>
                <p>AI Health Companion</p>
              </div>
            </div>
          </header>

          {/* Patient identity */}
          <section className="mb-5">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Patient</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <Field label="Name" value={profile?.displayName} />
              <Field label="Email" value={profile?.email} />
              <Field label="Age" value={age !== null ? `${age} years` : undefined} />
              <Field label="Gender" value={profile?.gender} />
              <Field label="Date of birth" value={profile?.dateOfBirth} />
              <Field label="Blood type" value={profile?.medicalInfo?.bloodType} />
              <Field label="Phone" value={profile?.phoneNumber} />
              {profile?.emergencyContact?.name && (
                <Field
                  label="Emergency contact"
                  value={`${profile.emergencyContact.name} (${profile.emergencyContact.relationship ?? "—"}) · ${profile.emergencyContact.phone ?? "—"}`}
                />
              )}
            </div>
          </section>

          {/* Allergies — most important, red box */}
          {allergies.length > 0 && (
            <section className="mb-5 border-2 border-red-500 bg-red-50 p-3 rounded">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-red-700 mb-1">
                ⚠ Known Allergies
              </h2>
              <p className="text-sm font-medium text-red-900">{allergies.join(" · ")}</p>
            </section>
          )}

          {/* Conditions */}
          <Section title="Known Conditions" empty="None on record.">
            {conditions.length > 0 && (
              <ul className="list-disc list-inside space-y-0.5">
                {conditions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
          </Section>

          {/* Active medications */}
          <Section title="Current Medications" empty="No active medications on record.">
            {activeMeds.length > 0 && (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-300 text-xs uppercase text-gray-600">
                    <th className="py-1.5 pr-4 font-semibold">Medication</th>
                    <th className="py-1.5 pr-4 font-semibold">Details</th>
                    <th className="py-1.5 font-semibold">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {activeMeds.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100">
                      <td className="py-1.5 pr-4 font-medium">{m.title.replace(/^Started /, "")}</td>
                      <td className="py-1.5 pr-4 text-gray-700">{m.description || "—"}</td>
                      <td className="py-1.5 text-gray-600 whitespace-nowrap">{formatDate(m.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* Recent symptoms */}
          <Section
            title="Recent Symptoms (last 60 days)"
            empty="No symptoms logged in the last 60 days."
          >
            {recentSymptoms.length > 0 && (
              <EventTable events={recentSymptoms} />
            )}
          </Section>

          {/* Recent vitals */}
          {recentVitals.length > 0 && (
            <Section title="Recent Vitals (last 60 days)" empty="">
              <EventTable events={recentVitals} />
            </Section>
          )}

          {/* Recent test results */}
          {recentTests.length > 0 && (
            <Section title="Recent Test Results (last 60 days)" empty="">
              <EventTable events={recentTests} />
            </Section>
          )}

          {/* Recent doctor visits */}
          {recentVisits.length > 0 && (
            <Section title="Recent Doctor Visits (last 60 days)" empty="">
              <EventTable events={recentVisits} />
            </Section>
          )}

          {/* Topics discussed with Medibot */}
          {recentChats.length > 0 && (
            <Section title="Topics Discussed with Medibot (recent)" empty="">
              <ul className="space-y-1.5">
                {recentChats.map((c) => (
                  <li key={c.id} className="flex justify-between gap-4">
                    <span className="text-gray-800">{c.title}</span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(c.timestamp)}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Footer disclaimer */}
          <footer className="mt-8 pt-4 border-t border-gray-300">
            <p className="text-[10px] text-gray-500 italic leading-snug">
              This summary is generated from user-reported data and AI conversation history. It is provided for the patient's convenience and is not a substitute for a clinical assessment. The treating physician should verify all information directly with the patient. Medibot is not a licensed medical provider.
            </p>
          </footer>
        </article>
      </div>
    </AuthGuard>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-xs text-gray-600">{label}: </span>
      <span className="text-sm">{value && value.trim() ? value : "—"}</span>
    </div>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="mb-5 break-inside-avoid">
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 border-b border-gray-200 pb-1">
        {title}
      </h2>
      {children || <p className="text-sm text-gray-500 italic">{empty}</p>}
    </section>
  );
}

function EventTable({ events }: { events: { id: string; title: string; description?: string; timestamp: number }[] }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-gray-300 text-xs uppercase text-gray-600">
          <th className="py-1.5 pr-4 font-semibold">Date</th>
          <th className="py-1.5 pr-4 font-semibold">What</th>
          <th className="py-1.5 font-semibold">Notes</th>
        </tr>
      </thead>
      <tbody>
        {events.map((e) => (
          <tr key={e.id} className="border-b border-gray-100">
            <td className="py-1.5 pr-4 text-gray-600 whitespace-nowrap">{formatDate(e.timestamp)}</td>
            <td className="py-1.5 pr-4 font-medium">{e.title}</td>
            <td className="py-1.5 text-gray-700">{e.description || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
