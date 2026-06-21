/**
 * Language support tiers.
 *
 * FREE tier: English + 7 major Indian languages (8 total).
 * PREMIUM tier: many more — additional Indian languages + major world languages.
 *
 * Detection is script-based (deterministic for non-Latin scripts). Romanized
 * text falls back to English. This powers the "upgrade to use this language"
 * paywall for free users.
 */

export interface DetectedLanguage {
  name: string;
  tier: "free" | "premium";
  /** native label for nice UI, e.g. "हिन्दी" */
  native?: string;
}

// Free languages — the 8 every user gets.
export const FREE_LANGUAGES = [
  "English",
  "Hindi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Gujarati",
  "Kannada",
  "Malayalam",
] as const;

// Premium languages — a generous list (Indian + global). Not exhaustive of every
// language the model can speak, but the headline set we advertise.
export const PREMIUM_LANGUAGES = [
  "Punjabi", "Odia", "Urdu", "Assamese", "Marathi", "Nepali", "Sinhala",
  "Arabic", "Persian", "Chinese", "Japanese", "Korean", "Thai", "Russian",
  "Spanish", "French", "German", "Portuguese", "Italian", "Indonesian",
  "Vietnamese", "Turkish", "Greek", "Hebrew", "Ukrainian",
] as const;

// Script → language mapping. Order matters (check more specific first).
const SCRIPT_MAP: Array<{ re: RegExp; name: string; tier: "free" | "premium"; native?: string }> = [
  // Free Indian languages (by script)
  { re: /[ঀ-৿]/, name: "Bengali", tier: "free", native: "বাংলা" },
  { re: /[஀-௿]/, name: "Tamil", tier: "free", native: "தமிழ்" },
  { re: /[ఀ-౿]/, name: "Telugu", tier: "free", native: "తెలుగు" },
  { re: /[ಀ-೿]/, name: "Kannada", tier: "free", native: "ಕನ್ನಡ" },
  { re: /[ഀ-ൿ]/, name: "Malayalam", tier: "free", native: "മലയാളം" },
  { re: /[઀-૿]/, name: "Gujarati", tier: "free", native: "ગુજરાતી" },
  // Devanagari is Hindi (free). Marathi/Nepali also use it but we treat Devanagari as Hindi (free).
  { re: /[ऀ-ॿ]/, name: "Hindi", tier: "free", native: "हिन्दी" },

  // Premium scripts
  { re: /[਀-੿]/, name: "Punjabi", tier: "premium", native: "ਪੰਜਾਬੀ" },
  { re: /[଀-୿]/, name: "Odia", tier: "premium", native: "ଓଡ଼ିଆ" },
  { re: /[؀-ۿݐ-ݿ]/, name: "Arabic/Urdu", tier: "premium", native: "العربية / اردو" },
  { re: /[一-鿿]/, name: "Chinese", tier: "premium", native: "中文" },
  { re: /[぀-ヿ]/, name: "Japanese", tier: "premium", native: "日本語" },
  { re: /[가-힯]/, name: "Korean", tier: "premium", native: "한국어" },
  { re: /[฀-๿]/, name: "Thai", tier: "premium", native: "ไทย" },
  { re: /[Ѐ-ӿ]/, name: "Cyrillic (Russian/Ukrainian)", tier: "premium", native: "Русский" },
  { re: /[Ͱ-Ͽ]/, name: "Greek", tier: "premium", native: "Ελληνικά" },
  { re: /[֐-׿]/, name: "Hebrew", tier: "premium", native: "עברית" },
];

/**
 * Detect the language of a message from its script.
 * Returns null when it can't determine a non-English script (e.g. plain Latin/English,
 * numbers, or empty) — callers treat null as "no gating needed".
 */
export function detectLanguage(text: string): DetectedLanguage | null {
  if (!text || !text.trim()) return null;
  for (const s of SCRIPT_MAP) {
    if (s.re.test(text)) {
      return { name: s.name, tier: s.tier, native: s.native };
    }
  }
  // Latin letters only → English (free). No gating.
  if (/[A-Za-z]/.test(text)) return { name: "English", tier: "free" };
  return null;
}

/**
 * Should we block this message for a free user and prompt an upgrade?
 * True only when the detected language is premium-only and the user is on the base plan.
 */
export function needsUpgradeForLanguage(text: string, userPlan: string | undefined): DetectedLanguage | null {
  const detected = detectLanguage(text);
  if (!detected) return null;
  if (detected.tier === "premium" && userPlan !== "premium") {
    return detected;
  }
  return null;
}
