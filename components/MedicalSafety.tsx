"use client";

import { AlertTriangle, ExternalLink, Phone, Info } from "lucide-react";

/**
 * EMERGENCY KEYWORD DETECTION
 * Returns the matched emergency category, or null if the message is safe.
 */
const EMERGENCY_PATTERNS: Array<{ category: string; regex: RegExp; severity: "critical" | "urgent" }> = [
  {
    category: "self-harm",
    severity: "critical",
    regex: /\b(suicid\w*|kill myself|end my life|end it all|self[\s-]?harm|cutting myself|don'?t want to live|want to die)\b/i,
  },
  {
    category: "overdose",
    severity: "critical",
    regex: /\b(overdos\w*|too many pills|took (the )?whole bottle|poison\w*)\b/i,
  },
  {
    category: "cardiac",
    severity: "critical",
    regex: /\b(heart attack|cardiac arrest|chest pain.{0,20}(arm|jaw|breath)|crushing chest)\b/i,
  },
  {
    category: "stroke",
    severity: "critical",
    regex: /\b(stroke|face droop|sudden numbness|can'?t speak|slurred speech|sudden weakness on one side)\b/i,
  },
  {
    category: "anaphylaxis",
    severity: "critical",
    regex: /\b(anaphyla\w*|throat closing|can'?t breathe|severe allergic reaction|tongue swelling)\b/i,
  },
  {
    category: "severe-bleeding",
    severity: "urgent",
    regex: /\b(bleeding heavily|won'?t stop bleeding|coughing up blood|vomiting blood)\b/i,
  },
];

export function detectEmergency(message: string): { category: string; severity: "critical" | "urgent" } | null {
  if (!message) return null;
  for (const pattern of EMERGENCY_PATTERNS) {
    if (pattern.regex.test(message)) {
      return { category: pattern.category, severity: pattern.severity };
    }
  }
  return null;
}

interface EmergencyBannerProps {
  category: string;
  severity: "critical" | "urgent";
}

export function EmergencyBanner({ category, severity }: EmergencyBannerProps) {
  const isCritical = severity === "critical";

  const messages: Record<string, { title: string; subtitle: string }> = {
    "self-harm": {
      title: "You're not alone — help is available right now",
      subtitle: "If you're having thoughts of suicide or self-harm, please reach out immediately. Trained counselors are available 24/7.",
    },
    overdose: {
      title: "Seek emergency care immediately",
      subtitle: "Overdose can be life-threatening. Call emergency services now, even if symptoms seem mild.",
    },
    cardiac: {
      title: "Possible cardiac emergency — call immediately",
      subtitle: "Don't wait. Heart attack symptoms need immediate medical attention.",
    },
    stroke: {
      title: "Possible stroke — every minute counts",
      subtitle: "Stroke treatment is most effective in the first few hours. Call emergency services now.",
    },
    anaphylaxis: {
      title: "Possible severe allergic reaction",
      subtitle: "If you have an epinephrine auto-injector (EpiPen), use it now and call emergency services.",
    },
    "severe-bleeding": {
      title: "Severe bleeding requires emergency care",
      subtitle: "Apply firm pressure to the wound and seek medical help immediately.",
    },
  };

  const m = messages[category] ?? {
    title: "Medical emergency detected",
    subtitle: "Please seek immediate medical attention.",
  };

  return (
    <div
      className={`mb-4 rounded-xl border-2 p-4 ${
        isCritical ? "border-red-500 bg-red-50" : "border-orange-400 bg-orange-50"
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={`h-6 w-6 flex-shrink-0 mt-0.5 ${isCritical ? "text-red-600" : "text-orange-600"}`}
        />
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-base ${isCritical ? "text-red-900" : "text-orange-900"}`}>
            {m.title}
          </h3>
          <p className={`text-sm mt-1 ${isCritical ? "text-red-800" : "text-orange-800"}`}>
            {m.subtitle}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="tel:112"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <Phone className="h-4 w-4" />
              Call 112 (India)
            </a>
            <a
              href="tel:911"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <Phone className="h-4 w-4" />
              Call 911 (US)
            </a>
            {category === "self-harm" && (
              <a
                href="tel:9152987821"
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <Phone className="h-4 w-4" />
                iCall (India): 9152987821
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * SOURCE LINKS — extracts conditions/drugs from response and links to NIH/Mayo.
 * Uses a curated keyword list to keep matches high-confidence (no false positives on common words).
 */
const MEDICAL_TERMS: Record<string, { source: "mayo" | "nih"; slug?: string }> = {
  // Conditions
  diabetes: { source: "mayo", slug: "diabetes/symptoms-causes/syc-20371444" },
  hypertension: { source: "mayo", slug: "high-blood-pressure/symptoms-causes/syc-20373410" },
  "high blood pressure": { source: "mayo", slug: "high-blood-pressure/symptoms-causes/syc-20373410" },
  asthma: { source: "mayo", slug: "asthma/symptoms-causes/syc-20369653" },
  migraine: { source: "mayo", slug: "migraine-headache/symptoms-causes/syc-20360201" },
  depression: { source: "mayo", slug: "depression/symptoms-causes/syc-20356007" },
  anxiety: { source: "mayo", slug: "anxiety/symptoms-causes/syc-20350961" },
  fever: { source: "mayo", slug: "fever/symptoms-causes/syc-20352759" },
  flu: { source: "mayo", slug: "flu/symptoms-causes/syc-20351719" },
  influenza: { source: "mayo", slug: "flu/symptoms-causes/syc-20351719" },
  cancer: { source: "mayo", slug: "cancer/symptoms-causes/syc-20370588" },
  arthritis: { source: "mayo", slug: "arthritis/symptoms-causes/syc-20350772" },
  cholesterol: { source: "mayo", slug: "high-blood-cholesterol/symptoms-causes/syc-20350800" },
  pneumonia: { source: "mayo", slug: "pneumonia/symptoms-causes/syc-20354204" },
  bronchitis: { source: "mayo", slug: "bronchitis/symptoms-causes/syc-20355566" },
  // Common drugs
  paracetamol: { source: "nih" },
  acetaminophen: { source: "nih" },
  ibuprofen: { source: "nih" },
  aspirin: { source: "nih" },
  metformin: { source: "nih" },
  amoxicillin: { source: "nih" },
  insulin: { source: "nih" },
};

function buildSourceUrl(term: string, info: { source: "mayo" | "nih"; slug?: string }): string {
  if (info.source === "mayo" && info.slug) {
    return `https://www.mayoclinic.org/diseases-conditions/${info.slug}`;
  }
  if (info.source === "nih") {
    return `https://medlineplus.gov/druginfo/meds/search?query=${encodeURIComponent(term)}`;
  }
  return `https://www.mayoclinic.org/search/search-results?q=${encodeURIComponent(term)}`;
}

export function extractSources(response: string): Array<{ term: string; url: string; source: string }> {
  if (!response) return [];
  const found = new Map<string, { url: string; source: string }>();
  const lower = response.toLowerCase();

  for (const [term, info] of Object.entries(MEDICAL_TERMS)) {
    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(lower)) {
      found.set(term, {
        url: buildSourceUrl(term, info),
        source: info.source === "mayo" ? "Mayo Clinic" : "MedlinePlus (NIH)",
      });
    }
  }

  return Array.from(found.entries()).map(([term, v]) => ({ term, ...v }));
}

interface SourceLinksProps {
  response: string;
}

export function SourceLinks({ response }: SourceLinksProps) {
  const sources = extractSources(response);
  if (sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
        <Info className="h-3 w-3" />
        Learn more from trusted sources:
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.slice(0, 4).map((s) => (
          <a
            key={s.term}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 px-2.5 py-1 rounded-md border border-teal-200 transition-colors"
          >
            <span className="capitalize font-medium">{s.term}</span>
            <span className="text-teal-500">·</span>
            <span className="text-teal-600">{s.source}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * MEDICAL DISCLAIMER — subtle footer under every AI response.
 */
export function MedicalDisclaimer() {
  return (
    <p className="mt-2 text-[11px] text-gray-500 italic leading-relaxed">
      Medibot provides general health information for educational purposes only. This is not medical advice — always consult a qualified healthcare professional for diagnosis and treatment.
    </p>
  );
}
