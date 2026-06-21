"use client";

import { useState, useRef } from "react";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Pill, Search, Upload, X, Loader2, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { analyzeMedicineByName, analyzeMedicinePhoto } from "@/lib/analyzeMedicine";
import { getUsage, canAnalyze, incrementUsage } from "@/lib/usageLimits";
import { LabReportRenderer, wrapLabReport } from "@/components/LabReportRenderer";
import { toast } from "sonner";

export default function MedicinePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const isPremium = userProfile?.plan === "premium";

  const runAnalysis = async (mode: "name" | "photo") => {
    if (!user) {
      toast.error("Please log in.");
      return;
    }
    if (mode === "name" && !name.trim()) {
      toast.error("Enter a medicine name.");
      return;
    }
    if (mode === "photo" && !file) {
      toast.error("Upload a photo first.");
      return;
    }

    // Photo lookups count against the monthly image-analysis quota (free tier).
    if (mode === "photo" && file) {
      const usage = await getUsage(user.uid);
      const verdict = canAnalyze(usage, userProfile?.plan, file.type);
      if (!verdict.allowed) {
        setShowUpgrade(true);
        return;
      }
    }

    setLoading(true);
    setResult(null);
    try {
      const res =
        mode === "photo" && file
          ? await analyzeMedicinePhoto(file)
          : await analyzeMedicineByName(name);
      setResult(wrapLabReport(res.markdown));
      if (mode === "photo" && file) {
        incrementUsage(user.uid, "image", userProfile?.plan).catch(() => {});
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't analyze this medicine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="bg-background text-foreground min-h-screen">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="text-muted-foreground lg:hidden h-10 w-10"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="font-semibold text-lg flex items-center gap-2">
                  <Pill className="h-5 w-5 text-teal-600" />
                  Medicine Info
                </h1>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">What is this medicine?</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Type a medicine name or upload a photo of the strip/box. Medibot explains what it is and what it's generally used for — clear, simple, and safe.
                  </p>
                </div>

                {!isPremium ? (
                  /* Premium gate — Medicine Info is a Premium feature */
                  <div className="rounded-2xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-blue-50 p-8 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-r from-teal-600 to-blue-600 flex items-center justify-center mb-4">
                      <Crown className="h-7 w-7 text-yellow-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Medicine Info is a Premium feature</h3>
                    <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
                      Instantly understand any medicine — what it is, what it's used for, side effects, and precautions — by name or by photo. Upgrade to Medibot Premium to unlock it.
                    </p>
                    <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
                      <Button variant="outline" onClick={() => router.push("/chat")}>
                        Back to chat
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white"
                        onClick={() => router.push("/pricing")}
                      >
                        <Crown className="h-4 w-4 mr-1.5" />
                        Upgrade to Premium — ₹99/month
                      </Button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-4">
                      Tip: you can still ask about medicines in the free chat — Medicine Info just makes it instant and structured.
                    </p>
                  </div>
                ) : (
                <>
                {/* Premium content below */}

                {/* Name lookup */}
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Look up by name</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && runAnalysis("name")}
                        placeholder="e.g. Paracetamol, Dolo 650, Metformin…"
                        className="pl-9"
                        disabled={loading}
                      />
                    </div>
                    <Button
                      onClick={() => runAnalysis("name")}
                      disabled={loading || !name.trim()}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Look up"}
                    </Button>
                  </div>
                </div>

                {/* Photo lookup */}
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Or upload a photo</label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  {!file ? (
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={loading}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg py-8 flex flex-col items-center gap-2 text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors"
                    >
                      <Upload className="h-6 w-6" />
                      <span className="text-sm font-medium">Tap to upload a medicine photo</span>
                      <span className="text-xs text-gray-400">JPG or PNG · counts as 1 photo analysis</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5">
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          onClick={() => runAnalysis("photo")}
                          disabled={loading}
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze"}
                        </Button>
                        <button onClick={() => setFile(null)} disabled={loading} className="text-gray-400 hover:text-gray-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Result */}
                {loading && (
                  <div className="flex items-center justify-center py-10 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Looking it up…
                  </div>
                )}
                {result && !loading && <LabReportRenderer response={result} />}
                </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Usage upgrade modal */}
        {showUpgrade && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowUpgrade(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-5 text-white">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-300" />
                  <h2 className="text-lg font-bold">You've used your free photo analyses</h2>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-700 leading-relaxed">
                  You've reached your monthly free photo-analysis limit. You can still look up medicines by name for free. Upgrade for unlimited photo analysis.
                </p>
                <div className="mt-5 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowUpgrade(false)}>Maybe later</Button>
                  <Button className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white" onClick={() => { setShowUpgrade(false); router.push("/pricing"); }}>
                    <Crown className="h-4 w-4 mr-1.5" /> Upgrade
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
