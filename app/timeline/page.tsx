"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  Activity,
  Pill,
  FileText,
  MessageCircle,
  Stethoscope,
  HeartPulse,
  AlertTriangle,
  Plus,
  Search,
  RefreshCw,
  Printer,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  buildHealthTimeline,
  type TimelineEvent,
  type TimelineEventType,
  type TimelineSnapshot,
} from "@/lib/healthTimeline";
import { addHealthRecord, type HealthRecord } from "@/lib/firestore";
import { HealthTrends } from "@/components/HealthTrends";
import { exportHealthData } from "@/lib/healthExport";
import { Download, Crown } from "lucide-react";
import { toast } from "sonner";

const TYPE_META: Record<
  TimelineEventType,
  { label: string; icon: typeof Activity; color: string }
> = {
  "medication-started": { label: "Medication Started", icon: Pill, color: "text-teal-700 bg-teal-50 border-teal-200" },
  "medication-stopped": { label: "Medication Stopped", icon: Pill, color: "text-gray-700 bg-gray-50 border-gray-200" },
  symptom: { label: "Symptom", icon: Activity, color: "text-orange-700 bg-orange-50 border-orange-200" },
  appointment: { label: "Doctor Visit", icon: Stethoscope, color: "text-blue-700 bg-blue-50 border-blue-200" },
  "test-result": { label: "Test Result", icon: FileText, color: "text-purple-700 bg-purple-50 border-purple-200" },
  "vital-signs": { label: "Vital Signs", icon: HeartPulse, color: "text-rose-700 bg-rose-50 border-rose-200" },
  summary: { label: "Summary", icon: FileText, color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  "chat-session": { label: "Chat", icon: MessageCircle, color: "text-teal-700 bg-teal-50 border-teal-200" },
  condition: { label: "Condition", icon: AlertTriangle, color: "text-amber-700 bg-amber-50 border-amber-200" },
  allergy: { label: "Allergy", icon: AlertTriangle, color: "text-red-700 bg-red-50 border-red-200" },
};

function formatDate(ts: number): string {
  if (!ts || ts <= 0) return "Unknown date";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatRelative(ts: number): string {
  if (!ts || ts <= 0) return "";
  const diff = Date.now() - ts;
  if (diff < 0) return "Upcoming";
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default function TimelinePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<TimelineSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<TimelineEventType | "all">("all");
  const [showLogDialog, setShowLogDialog] = useState(false);
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const isPremium = userProfile?.plan === "premium";

  const loadTimeline = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setError(null);
      const data = await buildHealthTimeline(user.uid);
      setSnapshot(data);
    } catch (e) {
      console.error("Failed to build timeline:", e);
      setError("Couldn't load your timeline. Please refresh and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    loadTimeline();
  }, [user, authLoading, loadTimeline]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTimeline();
  };

  const filteredEvents = useMemo(() => {
    if (!snapshot) return [];
    const term = search.trim().toLowerCase();
    return snapshot.events.filter((e) => {
      if (activeFilter !== "all" && e.type !== activeFilter) return false;
      if (!term) return true;
      return (
        e.title.toLowerCase().includes(term) ||
        (e.description ?? "").toLowerCase().includes(term)
      );
    });
  }, [snapshot, search, activeFilter]);

  // Group events by month for visual structure
  const groupedEvents = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();
    for (const e of filteredEvents) {
      const d = new Date(e.timestamp);
      const key = d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    }
    return Array.from(groups.entries());
  }, [filteredEvents]);

  const handlePrintSummary = () => {
    if (!isPremium) {
      router.push("/pricing");
      toast("The Doctor Visit PDF is a Premium feature. Upgrade to generate it.");
      return;
    }
    // Open the dedicated print-optimized summary page in a new tab.
    window.open("/timeline/summary", "_blank", "noopener,noreferrer");
  };

  const handleExport = () => {
    if (!isPremium) {
      router.push("/pricing");
      toast("Exporting your full health data is a Premium feature.");
      return;
    }
    if (!snapshot || snapshot.events.length === 0) {
      toast.error("Nothing to export yet.");
      return;
    }
    exportHealthData(snapshot, userProfile?.displayName);
    toast.success("Your health data has been downloaded.");
  };

  return (
    <AuthGuard>
      <div className="bg-background text-foreground min-h-screen">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card print:hidden">
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
                <h1 className="font-semibold text-lg">Health Memory</h1>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                  className="hidden sm:flex"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={!snapshot || snapshot.events.length === 0}
                  className="hidden sm:flex"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  {!isPremium && <Crown className="h-3 w-3 ml-1.5 text-amber-500" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintSummary}
                  disabled={!snapshot || snapshot.events.length === 0}
                  className="hidden sm:flex"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Doctor PDF
                  {!isPremium && <Crown className="h-3 w-3 ml-1.5 text-amber-500" />}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowLogDialog(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Log Event
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Intro */}
                <div className="print:hidden">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                    Your Health Memory
                  </h2>
                  <p className="text-sm text-gray-600">
                    Every chat, medication, and health event in one place. Your doctor has 7 minutes — your timeline has years.
                  </p>
                </div>

                {/* Loading state */}
                {loading && (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
                      <p className="mt-3 text-sm text-gray-500">Building your timeline…</p>
                    </div>
                  </div>
                )}

                {/* Error state */}
                {!loading && error && (
                  <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center">
                    <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="font-semibold text-red-900">{error}</p>
                    <Button onClick={handleRefresh} className="mt-3 bg-red-600 hover:bg-red-700 text-white">
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Empty state */}
                {!loading && !error && snapshot && snapshot.events.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-gray-300 p-10 text-center">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Your timeline is empty</h3>
                    <p className="text-sm text-gray-600 max-w-md mx-auto mb-5">
                      Start chatting, log a medication, or record a symptom. Every health event you track here builds your personal medical history that Medibot remembers for you.
                    </p>
                    <Button
                      onClick={() => setShowLogDialog(true)}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Log Your First Event
                    </Button>
                  </div>
                )}

                {/* Timeline */}
                {!loading && !error && snapshot && snapshot.events.length > 0 && (
                  <>
                    {/* Stats summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
                      <StatCard label="Total Events" value={snapshot.counts.total} />
                      <StatCard label="Medications" value={snapshot.counts.byType["medication-started"] ?? 0} />
                      <StatCard label="Symptoms Logged" value={snapshot.counts.byType.symptom ?? 0} />
                      <StatCard label="Conversations" value={snapshot.counts.byType["chat-session"] ?? 0} />
                    </div>

                    {/* Health trends (premium) — shows when 2+ readings exist for a marker */}
                    <HealthTrends
                      events={snapshot.events}
                      isPremium={isPremium}
                      onUpgrade={() => router.push("/pricing")}
                    />

                    {/* Filters + search */}
                    <div className="space-y-3 print:hidden">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Search your health history…"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-9 bg-white border-gray-200"
                        />
                      </div>

                      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                        <FilterChip
                          label={`All (${snapshot.counts.total})`}
                          active={activeFilter === "all"}
                          onClick={() => setActiveFilter("all")}
                        />
                        {(Object.entries(snapshot.counts.byType) as [TimelineEventType, number][])
                          .filter(([, count]) => count > 0)
                          .map(([type, count]) => (
                            <FilterChip
                              key={type}
                              label={`${TYPE_META[type]?.label ?? type} (${count})`}
                              active={activeFilter === type}
                              onClick={() => setActiveFilter(type)}
                            />
                          ))}
                      </div>
                    </div>

                    {/* No results */}
                    {filteredEvents.length === 0 && (
                      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                        <p className="text-sm text-gray-600">
                          No events match your search. Try a different filter or term.
                        </p>
                      </div>
                    )}

                    {/* Grouped timeline */}
                    <div className="space-y-8">
                      {groupedEvents.map(([month, events]) => (
                        <section key={month}>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 sticky top-0 bg-background/95 backdrop-blur py-1 print:static">
                            {month}
                          </h3>
                          <div className="space-y-3">
                            {events.map((event) => (
                              <TimelineCard key={event.id} event={event} />
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Log event dialog */}
        {showLogDialog && user && (
          <LogEventDialog
            userId={user.uid}
            onClose={() => setShowLogDialog(false)}
            onSaved={() => {
              setShowLogDialog(false);
              loadTimeline();
            }}
          />
        )}
      </div>
    </AuthGuard>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
      <div className="text-2xl font-bold text-teal-700">{value}</div>
      <div className="text-xs text-gray-600 mt-0.5">{label}</div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? "bg-teal-600 border-teal-600 text-white"
          : "bg-white border-gray-200 text-gray-700 hover:border-teal-300 hover:text-teal-700"
      }`}
    >
      {label}
    </button>
  );
}

function TimelineCard({ event }: { event: TimelineEvent }) {
  const meta = TYPE_META[event.type] ?? TYPE_META.symptom;
  const Icon = meta.icon;

  return (
    <article className={`rounded-xl border p-4 bg-white hover:shadow-sm transition-shadow ${meta.color.split(" ").filter((c) => c.startsWith("border-")).join(" ")}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 rounded-lg p-2 ${meta.color}`}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-gray-900 leading-tight">{event.title}</h4>
              {event.description && (
                <p className="text-sm text-gray-600 mt-1 leading-relaxed break-words">
                  {event.description}
                </p>
              )}
            </div>
            <Badge variant="outline" className="text-[10px] font-medium flex-shrink-0">
              {meta.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <time>{formatDate(event.timestamp)}</time>
            <span aria-hidden>·</span>
            <span>{formatRelative(event.timestamp)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function LogEventDialog({
  userId,
  onClose,
  onSaved,
}: {
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<HealthRecord["type"]>("symptom");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    setSaving(true);
    try {
      await addHealthRecord(userId, {
        type,
        title: title.trim(),
        description: description.trim(),
        date,
      });
      toast.success("Event logged to your timeline");
      onSaved();
    } catch (err) {
      console.error("Failed to log event:", err);
      toast.error("Couldn't save event. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-1">Log a Health Event</h2>
        <p className="text-sm text-gray-600 mb-4">
          Record something you want Medibot to remember.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["symptom", "vital_signs", "test_result", "appointment"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    type === t
                      ? "bg-teal-600 border-teal-600 text-white"
                      : "bg-white border-gray-200 text-gray-700 hover:border-teal-300"
                  }`}
                >
                  {t === "vital_signs" ? "Vital Signs" : t === "test_result" ? "Test Result" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 mb-1.5">
              Title *
            </label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "symptom"
                  ? "e.g. Headache, fatigue"
                  : type === "vital_signs"
                  ? "e.g. Blood pressure 120/80"
                  : type === "test_result"
                  ? "e.g. CBC blood test"
                  : "e.g. Dr. Sharma — follow up"
              }
              maxLength={100}
              required
            />
          </div>

          <div>
            <label htmlFor="event-date" className="block text-sm font-medium text-gray-700 mb-1.5">
              Date
            </label>
            <Input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>

          <div>
            <label htmlFor="event-desc" className="block text-sm font-medium text-gray-700 mb-1.5">
              Details (optional)
            </label>
            <textarea
              id="event-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              placeholder="Any additional notes…"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !title.trim()}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            >
              {saving ? "Saving…" : "Save Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
