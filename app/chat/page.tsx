"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import Lottie from "lottie-react";
import audioWave from "./Audio Wave.json";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TextType from "@/components/TextType";
import {
  detectEmergency,
  EmergencyBanner,
  SourceLinks,
  MedicalDisclaimer,
} from "@/components/MedicalSafety";
import { buildHealthTimeline, buildAIMemoryContext } from "@/lib/healthTimeline";
import { autoLogFromUserMessage } from "@/lib/healthAutoLogger";
import { analyzeLabReport, parseReportFindings } from "@/lib/analyzeLabReport";
import { LabReportRenderer, isLabReportResponse, wrapLabReport } from "@/components/LabReportRenderer";
import { ChatFileCard } from "@/components/ChatFileCard";
import { buildFileMeta } from "@/lib/fileMeta";
import type { ChatFileMeta } from "@/lib/firestore";
import { needsUpgradeForLanguage, type DetectedLanguage } from "@/lib/languageSupport";
import { getUsage, canAnalyze, incrementUsage, FREE_MONTHLY_LIMITS, type AnalysisFeature } from "@/lib/usageLimits";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  Search,
  ThumbsDown,
  ThumbsUp,
  Copy,
  Pencil,
  Lock,
  Sparkles,
  Check,
  CheckCircle,
  Crown,
  Plus,
  Camera,
  RotateCcw,
  Upload,
  Send,
  X,
  FileText,
  Pill,
  AlertCircle,
  Volume2,
  RefreshCw,
  StopCircle,
  ChevronDown,
  Ghost,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  createChatSession,
  addMessageToSession,
  subscribeToUserChatSessions,
  updateChatSessionTitle,
  deleteChatSession,
  addHealthRecord,
  type ChatSession,
} from "@/lib/firestore";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
// Removed PaymentDialog import (PhonePe/Stripe integration)

declare global {
  interface Window {
    SpeechSynthesisUtterance: any;
    puter?: any;
  }
}

declare const puter: any;

interface PrescriptionAnalysis {
  medications: string[];
  dosages: string[];
  instructions: string;
  warnings: string[];
  userId?: string;
  fileName?: string;
  createdAt?: Date;
}

interface ProcessedChatSession extends Omit<ChatSession, "createdAt" | "updatedAt" | "messages"> {
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{
    id: string;
    userId: string;
    image?: string | null;
    file?: ChatFileMeta | null;
    message: string;
    response: string;
    timestamp: Date;
    type: "chat" | "summarizer";
  }>;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason?: string;
    index?: number;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason?: string;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason?: string;
    index?: number;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}




// PhonePe PaymentForm (only for premium plan)


function ChatContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [currentSession, setCurrentSession] = useState<ProcessedChatSession | null>(null);
  // Always-fresh mirror of currentSession for use inside the Firestore snapshot
  // callback (which otherwise closes over a stale value and wrongly resets the view).
  const currentSessionRef = useRef<ProcessedChatSession | null>(null);
  useEffect(() => { currentSessionRef.current = currentSession; }, [currentSession]);
  const [sessions, setSessions] = useState<ProcessedChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PrescriptionAnalysis | null>(null);
  const [analyzingPrescription, setAnalyzingPrescription] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("medibot-care");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("base");
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<string>("base");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [copiedMessageIds, setCopiedMessageIds] = useState<Set<string>>(new Set());
  const [isGenerationStopped, setIsGenerationStopped] = useState(false);
  const [isCreatingNewSession, setIsCreatingNewSession] = useState(false);
  const [isAnySessionCreationInProgress, setIsAnySessionCreationInProgress] = useState(false);
  const [lastToastTime, setLastToastTime] = useState<number>(0);
  
  // 🔥 ENHANCED SCROLL-TO-LATEST FUNCTIONALITY
  // Voice recording animation state
  const [isRecording, setIsRecording] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [manualNewChatStarted, setManualNewChatStarted] = useState(false);
  const [healthMemoryContext, setHealthMemoryContext] = useState<string>("");

  // Incognito mode: ephemeral chat that is never saved, has no memory of the user,
  // and vanishes on exit. We stash the pre-incognito session to restore it on exit.
  const [isIncognito, setIsIncognito] = useState(false);
  const savedSessionBeforeIncognito = useRef<ProcessedChatSession | null>(null);
  // Language upgrade gate: set to the detected premium language when a free user
  // writes in a premium-only language. Drives the upgrade modal.
  const [languageGate, setLanguageGate] = useState<DetectedLanguage | null>(null);
  // Usage limit gate: set to the blocked feature when a free user exhausts their
  // monthly analysis quota. Drives the usage upgrade modal.
  const [usageGate, setUsageGate] = useState<AnalysisFeature | null>(null);
  // Ref mirror so async callbacks (Firestore snapshot) always read the live value.
  const isIncognitoRef = useRef(false);
  useEffect(() => { isIncognitoRef.current = isIncognito; }, [isIncognito]);

  const { user, userProfile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Build the user's health memory context for AI personalization.
  // Initial build on mount; refreshed on each send via getFreshMemoryContext().
  useEffect(() => {
    if (!user?.uid) {
      setHealthMemoryContext("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const snapshot = await buildHealthTimeline(user.uid);
        if (cancelled) return;
        const context = buildAIMemoryContext(snapshot);
        setHealthMemoryContext(context);
      } catch (e) {
        console.error("Failed to build health memory context:", e);
        if (!cancelled) setHealthMemoryContext("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, userProfile?.updatedAt]);

  // Always-fresh memory context — called right before sending a message.
  // Picks up any health records / meds / events added since the page mounted.
  const getFreshMemoryContext = async (): Promise<string> => {
    if (!user?.uid) return "";
    try {
      const snapshot = await buildHealthTimeline(user.uid);
      const fresh = buildAIMemoryContext(snapshot);
      // Update state too so UI-bound consumers stay in sync
      setHealthMemoryContext(fresh);
      return fresh;
    } catch (e) {
      console.error("getFreshMemoryContext failed, falling back to cached:", e);
      return healthMemoryContext;
    }
  };

  // Auto-switch to free model if user downgrades to base plan
  useEffect(() => {
    // Medibot brand-only model lineup. Underlying provider details are hidden from users.
    const modelMap: Record<string, { api: string; model: string; key: string; plan: 'free' | 'premium' }> = {
      "medibot-care": {
        api: "gemini",
        model: "gemini-2.5-flash",
        key: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
        plan: "free",
      },
      "medibot-specialist": {
        api: "gemini",
        model: "gemini-2.5-pro",
        key: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
        plan: "premium",
      },
    };

    const currentModel = modelMap[selectedModel];
    if (currentModel?.plan === 'premium' && userProfile?.plan === 'base') {
      setSelectedModel('medibot-care');
      toast("Switched to Medibot Care. Medibot Specialist requires a PRO subscription.");
    }
  }, [userProfile?.plan, selectedModel]);

  // Keep selectedPlan in sync with the user's actual plan from their profile.
  // This is what gates premium model access (picker + generateAIResponse), so it
  // MUST reflect userProfile.plan — otherwise paying users can't use premium.
  useEffect(() => {
    const plan = userProfile?.plan === 'premium' ? 'premium' : 'base';
    setSelectedPlan(plan);
    setSelectedPlanForPayment(plan);
  }, [userProfile?.plan]);
const VoiceInputButton = ({ onResult, disabled, onStartRecording, onStopRecording, isPremiumFeature = false }: { onResult: (text: string) => void; disabled?: boolean; onStartRecording?: () => void; onStopRecording?: () => void; isPremiumFeature?: boolean }) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const resultTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (resultTimeout.current) clearTimeout(resultTimeout.current);
    };
  }, []);

  const startListening = async () => {
  setError(null);

  // Check support
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    setError('Speech recognition is not supported in this browser.');
    alert('Speech recognition is not supported in this browser.');
    return;
  }

  try {
    // Step 1: Request mic permission first (fixes 2nd click issue)
    await navigator.mediaDevices.getUserMedia({ audio: true });

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    let gotResult = false;

    recognition.onstart = () => {
      setListening(true);
      if (onStartRecording) onStartRecording();
    };

    recognition.onresult = (event: any) => {
      gotResult = true;
      setListening(false);
      if (onStopRecording) onStopRecording();

      const transcript =
        event.results &&
        event.results[0] &&
        event.results[0][0] &&
        event.results[0][0].transcript;

      if (transcript && transcript.trim()) {
        onResult(transcript.trim());
      } else {
        setError('Could not recognize speech. Please try again.');
      }
      recognition.stop();
    };

    recognition.onerror = (event: any) => {
      setListening(false);
      if (onStopRecording) onStopRecording();
      setError('Speech recognition error: ' + event.error);
      if (event.error !== 'no-speech') alert('Speech recognition error: ' + event.error);
      recognition.stop();
    };

    recognition.onend = () => {
      setListening(false);
      if (onStopRecording) onStopRecording();
      if (!gotResult) {
        setError('No speech detected. Please try again.');
      }
    };

    recognition.start();

    // Fallback: Stop if no result within 10s
    if (resultTimeout.current) clearTimeout(resultTimeout.current);
    resultTimeout.current = setTimeout(() => {
      if (recognitionRef.current && listening) {
        recognitionRef.current.stop();
        setListening(false);
        setError('No speech detected (timeout). Please try again.');
      }
    }, 10000);
  } catch (err: any) {
    setError('Speech recognition failed to start.');
    alert('Speech recognition failed to start.');
  }
};


  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      if (onStopRecording) onStopRecording();
    }
    if (resultTimeout.current) clearTimeout(resultTimeout.current);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={listening ? stopListening : startListening}
        disabled={disabled}
        aria-label={listening ? 'Stop voice input' : 'Start voice input'}
        className={`h-8 w-8 flex items-center justify-center rounded-full border-none bg-transparent text-teal-600 hover:bg-teal-100 transition ${listening ? 'animate-pulse bg-teal-200' : ''} ${isPremiumFeature ? 'opacity-50' : ''}`}
        style={{ outline: 'none' }}
      >
        {listening ? (
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" className="opacity-30"/><rect x="8.5" y="5" width="3" height="7" rx="1.5"/><rect x="8.5" y="13" width="3" height="2" rx="1"/></svg>
        ) : (
          <>
            <img src="/microphone.png" alt="Microphone" className="h-5 w-5 block object-contain" />
            <img src="/microphone1.png" alt="Microphone" className="h-5 w-5 hidden object-contain" />
          </>
        )}
      </button>
      {isPremiumFeature && (
        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-400 text-white text-[6px] px-1 py-0.5 rounded font-bold">
          PRO
        </div>
      )}
      {error && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-red-100 text-red-700 text-xs rounded shadow p-2 z-50">
          {error}
        </div>
      )}
    </div>
  );
};
  // 🔥 ENHANCED SCROLL TO BOTTOM FUNCTION
  const scrollToBottom = (behavior: 'smooth' | 'instant' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setHasNewMessages(false);
    setShowScrollButton(false);
  };

  // 🔥 ENHANCED SCROLL DETECTION
  useEffect(() => {
    const scrollEl = scrollAreaRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      const threshold = 150; // Pixels from bottom to consider "at bottom"
      const currentIsAtBottom = scrollHeight - scrollTop <= clientHeight + threshold;
      
      setIsAtBottom(currentIsAtBottom);
      
      // Show button if there are new messages and user is not at bottom
      if (hasNewMessages && !currentIsAtBottom) {
        setShowScrollButton(true);
      } else if (currentIsAtBottom) {
        setShowScrollButton(false);
        setHasNewMessages(false);
      }
    };

    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [hasNewMessages]);

  // 🔥 DETECT NEW MESSAGES AND TRIGGER SCROLL BUTTON
  useEffect(() => {
    if (!currentSession?.messages) return;
    
    const newCount = currentSession.messages.length;
    
    // If messages increased and user is not at bottom, show scroll button
    if (newCount > messageCount && messageCount > 0 && !isAtBottom) {
      setHasNewMessages(true);
      setShowScrollButton(true);
    }
    
    setMessageCount(newCount);
    
    // Auto scroll to bottom if user is already at bottom
    if (isAtBottom && newCount > messageCount && messageCount > 0) {
      setTimeout(() => scrollToBottom('smooth'), 100);
    }
  }, [currentSession?.messages?.length, messageCount, isAtBottom]);

  // 🔥 SCROLL TO BOTTOM ON SESSION CHANGE
  useEffect(() => {
    if (currentSession?.messages) {
      setTimeout(() => scrollToBottom('instant'), 100);
    }
  }, [currentSession?.id]);

  const normalizeSession = (session: ChatSession): ProcessedChatSession => ({
    ...session,
    messages: (session.messages || []).map((msg) => ({
      ...msg,
      id: msg.id || uuidv4(),
      timestamp: msg.timestamp instanceof Date
        ? msg.timestamp
        : (msg.timestamp as any)?.toDate?.() || new Date(),
      image: msg.image && typeof msg.image === "string" && msg.image.startsWith("https://") ? msg.image : null,
    })),
    createdAt: session.createdAt instanceof Date
      ? session.createdAt
      : (session.createdAt as any)?.toDate?.() || new Date(),
    updatedAt: session.updatedAt instanceof Date
      ? session.updatedAt
      : (session.updatedAt as any)?.toDate?.() || new Date(),
  });

  const getLastSessionId = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`lastSessionId_${user?.uid}`);
    }
    return null;
  };

  const setLastSessionId = (sessionId: string) => {
    if (typeof window !== "undefined" && user) {
      localStorage.setItem(`lastSessionId_${user.uid}`, sessionId);
    }
  };

  // Function to clear session data and force new chat
  const clearSessionData = () => {
    if (typeof window !== "undefined" && user) {
      localStorage.removeItem(`lastSessionId_${user.uid}`);
      localStorage.setItem(`appClosed_${user.uid}`, Date.now().toString());
    }
  };

  // Function to check if app was closed/reopened
  const wasAppClosed = (): boolean => {
    if (typeof window !== "undefined" && user) {
      const lastCloseTime = localStorage.getItem(`appClosed_${user.uid}`);
      const sessionStart = sessionStorage.getItem(`sessionStart_${user.uid}`);
      const lastNewSessionTime = localStorage.getItem(`lastNewSession_${user.uid}`);
      
      // If no session start time, this is a new session
      if (!sessionStart) {
        sessionStorage.setItem(`sessionStart_${user.uid}`, Date.now().toString());
        
        // Check if we recently created a new session (within last 5 seconds)
        if (lastNewSessionTime) {
          const timeSinceLastSession = Date.now() - parseInt(lastNewSessionTime);
          if (timeSinceLastSession < 5000) {
            console.log("🚫 Skipping new session - recently created");
            return false;
          }
        }
        
        return !!lastCloseTime; // Return true if there was a previous close
      }
      
      return false;
    }
    return false;
  };

  // Function to create a new chat session
  const createNewChatSession = async () => {
    if (!user || isCreatingNewSession || isAnySessionCreationInProgress) return;
    
    try {
      setIsCreatingNewSession(true);
      setIsAnySessionCreationInProgress(true);
      console.log("🔄 Creating new temporary chat session...");
      
      // Create only a temporary session in memory - don't save to database until first message
      const tempSessionId = "temp-" + uuidv4();
      const newSession: ProcessedChatSession = {
        id: tempSessionId,
        userId: user.uid,
        title: "New Chat",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setCurrentSession(newSession);
      // Don't set lastSessionId yet - wait until first message is saved
      
      // Clear the app closed flag and record new session time
      if (typeof window !== "undefined") {
        localStorage.removeItem(`appClosed_${user.uid}`);
        localStorage.setItem(`lastNewSession_${user.uid}`, Date.now().toString());
      }
      
      console.log("✅ New temporary chat session created:", tempSessionId);
    } catch (error) {
      console.error("Error creating new session:", error);
    } finally {
      setIsCreatingNewSession(false);
      setIsAnySessionCreationInProgress(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setCurrentSession(null);
      setSessions([]);
      return;
    }

    // Don't run if manual new chat was just started
    if (manualNewChatStarted) {
      console.log("🔄 Skipping useEffect - manual new chat in progress");
      return;
    }

    // Check if app was closed and reopened
    const shouldCreateNewSession = wasAppClosed();

    let unsubscribe: () => void;
    const fetchSessions = async () => {
      try {
        setLoading(true);
        unsubscribe = subscribeToUserChatSessions(user.uid, (userSessions) => {
          const normalizedSessions = userSessions
            .map(normalizeSession)
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
          
          // Filter out any sessions that don't have messages (shouldn't happen with new logic, but safety check)
          const sessionsWithMessages = normalizedSessions.filter(session => session.messages && session.messages.length > 0);
          setSessions(sessionsWithMessages);
          
          // If app was closed, create new session instead of loading previous one —
          // but only when nothing is already open (avoid re-firing on every snapshot).
          if (shouldCreateNewSession && !currentSessionRef.current && !isCreatingNewSession && !isAnySessionCreationInProgress) {
            createNewChatSession();
            return;
          }
          
          // Never touch the session while in incognito — it must stay ephemeral.
          if (isIncognitoRef.current) {
            return;
          }

          // CRITICAL: if the user is already viewing ANY session (temp or real),
          // do NOT override it from a snapshot update. Snapshots fire on every
          // Firestore write (incl. the user's own messages) — overriding here was
          // resetting the view to a different/empty session after sending. We only
          // auto-select a session on the FIRST load, when nothing is open yet.
          if (currentSessionRef.current) {
            return;
          }

          const sessionIdFromUrl = searchParams ? searchParams.get('sessionId') : null;
          const lastSessionId = getLastSessionId();
          let selectedSession: ProcessedChatSession | undefined;

          if (sessionIdFromUrl) {
            selectedSession = sessionsWithMessages.find((s) => s.id === sessionIdFromUrl);
          } else if (lastSessionId) {
            selectedSession = sessionsWithMessages.find((s) => s.id === lastSessionId);
          } else if (sessionsWithMessages.length > 0) {
            selectedSession = sessionsWithMessages[0];
          }
          if (selectedSession) {
            setCurrentSession(selectedSession);
            if (selectedSession.id) {
              setLastSessionId(selectedSession.id);
            }
          } else {
            setCurrentSession(null);
          }
        });
      } catch (error: any) {
        console.error("Error fetching sessions:", error);
        toast.error("Failed to load chat sessions");
        setCurrentSession(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
    return () => unsubscribe?.();
  }, [user, searchParams, manualNewChatStarted]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Add event listeners for detecting app close/reopen
  useEffect(() => {
    if (!user) return;

    let visibilityTimeout: NodeJS.Timeout;
    let hiddenStartTime: number | null = null;
    let isHandlingVisibilityChange = false;

    // Handle page unload (browser tab close, navigate away, etc.)
    const handleBeforeUnload = () => {
      clearSessionData();
    };

    // Handle visibility change (mobile app backgrounding/foregrounding)
    const handleVisibilityChange = () => {
      if (isHandlingVisibilityChange) return;
      
      if (document.hidden) {
        // App is going to background - record the time but don't immediately mark as closed
        hiddenStartTime = Date.now();
        console.log("📱 App went to background");
        
        // Only mark as closed after being hidden for a significant amount of time (30 seconds)
        clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(() => {
          if (document.hidden && hiddenStartTime) {
            clearSessionData();
            console.log("📱 App marked as closed after extended background time");
          }
        }, 30000); // 30 seconds - much longer delay to avoid false positives
      } else {
        // App is coming to foreground
        const hiddenDuration = hiddenStartTime ? Date.now() - hiddenStartTime : 0;
        hiddenStartTime = null;
        clearTimeout(visibilityTimeout);
        
        // Only create new session if app was hidden for more than 2 minutes
        // AND we don't already have an active session with recent activity
        if (hiddenDuration > 120000) { // 2 minutes
          isHandlingVisibilityChange = true;
          
          setTimeout(() => {
            const wasClosedPreviously = wasAppClosed();
            const hasRecentActivity = currentSession && currentSession.messages.length > 0 && 
              currentSession.updatedAt && (Date.now() - currentSession.updatedAt.getTime()) < 600000; // 10 minutes
            
            // NOTE: We intentionally do NOT auto-create a new session when the
            // user returns to the tab. That was wiping the active chat (and firing
            // duplicate "new conversation" toasts) just for switching tabs. Users
            // start a new chat explicitly via the New Chat button.
            void wasClosedPreviously; void hasRecentActivity;
            isHandlingVisibilityChange = false;
          }, 1000); // 1 second debounce
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup event listeners
    return () => {
      clearTimeout(visibilityTimeout);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, currentSession, loading]);

  // 🔥 Helper function to extract recent health topics from user's conversation history
  const extractRecentHealthTopics = (): string[] => {
    if (!sessions || sessions.length === 0) return [];

    const healthKeywords = [
      "headache", "migraine", "pain", "fever", "medication", "prescription", 
      "diet", "nutrition", "exercise", "sleep", "stress", "anxiety", "mental health",
      "symptoms", "doctor", "treatment", "wellness", "fitness", "weight", "blood pressure",
      "diabetes", "heart", "lung", "skin", "allergy", "infection", "vitamin", "supplement",
      "cold", "flu", "cough", "throat", "stomach", "nausea", "fatigue", "energy"
    ];

    const topicCount: { [key: string]: number } = {};
    
    // Get messages from last 3 sessions
    const recentSessions = sessions.slice(0, 3);
    
    recentSessions.forEach(session => {
      session.messages.forEach(msg => {
        if (msg.message) {
          const lowerMessage = msg.message.toLowerCase();
          healthKeywords.forEach(keyword => {
            if (lowerMessage.includes(keyword)) {
              topicCount[keyword] = (topicCount[keyword] || 0) + 1;
            }
          });
        }
      });
    });

    return Object.entries(topicCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);
  };

  // Deterministic script detection for the common India case. Returns a forced
  // language name when the script is unambiguous, else "" (let the model decide).
  // Covers Devanagari (Hindi/Marathi), Bengali, Tamil, Telugu, Kannada, Malayalam,
  // Gujarati, Gurmukhi (Punjabi). Latin-only text → English.
  const detectScriptLanguage = (text: string): string => {
    if (!text) return "";
    const scripts: Array<[RegExp, string]> = [
      [/[ऀ-ॿ]/, "Hindi"],
      [/[ঀ-৿]/, "Bengali"],
      [/[஀-௿]/, "Tamil"],
      [/[ఀ-౿]/, "Telugu"],
      [/[ಀ-೿]/, "Kannada"],
      [/[ഀ-ൿ]/, "Malayalam"],
      [/[઀-૿]/, "Gujarati"],
      [/[਀-੿]/, "Punjabi"],
    ];
    for (const [re, lang] of scripts) {
      if (re.test(text)) return lang;
    }
    // Pure ASCII / Latin letters → English (covers "hello", "hey bro wassup")
    if (/[A-Za-z]/.test(text) && !/[^\x00-\x7F]/.test(text)) return "English";
    return "";
  };

  // 🔥 Helper function to create a concise prompt that prevents cutoffs
  const createOptimizedPrompt = (userMessage: string, contextMessages?: string, incognito: boolean = false) => {
    // Get user's name for personalization — suppressed entirely in incognito mode
    // so the AI "doesn't know who you are" and starts from scratch.
    let userName = "";
    if (!incognito) {
      if (userProfile?.displayName) {
        userName = userProfile.displayName.split(' ')[0];
      } else if (user?.displayName) {
        userName = user.displayName.split(' ')[0];
      } else if (user?.email) {
        userName = user.email.split("@")[0];
      }
    }

    const baseInstruction = `You are Medibot, a friendly and knowledgeable health information assistant created by Vignesh Skanda.

CRITICAL MEDICAL SAFETY RULES — non-negotiable:
1. NEVER recommend, prescribe, suggest, or name any specific medication, drug, brand name, or dosage. Not even over-the-counter ones (no paracetamol, ibuprofen, acetaminophen, loperamide, aspirin, etc.). Prescribing is illegal for you.
2. If asked "what medicine should I take," respond with non-pharmaceutical guidance (rest, hydration, when to seek care) and direct them to a pharmacist or doctor.
3. NEVER diagnose. Do not say "you have X disease." Describe possibilities only as "things to discuss with a doctor."
4. ALWAYS recommend consulting a qualified healthcare professional for diagnosis and treatment.
5. For red-flag symptoms (chest pain, severe bleeding, breathing difficulty, suicidal thoughts, stroke signs), tell them to seek emergency care immediately.

PERSONALIZATION:
${userName ? `- The user's name is ${userName}. Use their name naturally when appropriate.` : '- Learn and remember the user\'s name if they mention it.'}
- Use conversation history and verified health profile for personalized, contextual responses
- Reference previous discussions when relevant

MEMORY:
- You DO have access to this conversation's history, including any lab reports you previously analyzed for this user (their key findings appear in the Conversation Context below).
- When the user refers to "the report", "my results", or "this", look in the Conversation Context for the most recently analyzed report and answer using it.
- NEVER claim you "don't retain data" or "memory gets reset" — you can see the context provided. If the context genuinely has no report, simply ask them to re-share it.

LANGUAGE:
- ALWAYS reply in the SAME language as the user's MOST RECENT message — not the language used earlier in the conversation.
- If their latest message is in English, reply in English. If it's in Hindi, reply in Hindi. If they switch languages mid-conversation, switch with them immediately.
- Judge the language from the user's CURRENT message only, ignoring the language of past messages in the history.

FORMATTING:
- Plain text only. NO emojis or symbols.
- Natural, conversational paragraphs like a friend who knows health basics.
- Bullet points only when listing steps, symptoms to watch for, or when the user asks for a list.
- Always complete your responses fully.`;

    const forcedLang = detectScriptLanguage(userMessage);
    const langReminder = forcedLang
      ? `\n\n(CRITICAL: the user's latest message is in ${forcedLang}. You MUST reply ONLY in ${forcedLang}, regardless of the language used earlier in this conversation.)`
      : `\n\n(Reminder: reply in the same language as this latest user message — "${userMessage.slice(0, 80)}" — not the language of earlier messages.)`;

    if (contextMessages && contextMessages.length > 4000) {
      // If context is very long, keep the most recent portion (preserves report findings)
      const contextSummary = "..." + contextMessages.slice(-3500);
      return `${baseInstruction}\n\nRecent context: ${contextSummary}\n\nUser: ${userMessage}${langReminder}\n\nRespond as Medibot with warmth, personalization, and expertise:`;
    }

    return contextMessages
      ? `${baseInstruction}\n\nConversation Context: ${contextMessages}\n\nUser: ${userMessage}${langReminder}\n\nRespond as Medibot with warmth, personalization, and expertise:`
      : `${baseInstruction}\n\nUser: ${userMessage}\n\nRespond as Medibot with warmth and expertise:`;
  };

  // 🔥 ENHANCED FUNCTION: Build comprehensive user context for personalization
  const buildUserPersonalizationContext = () => {
    if (!sessions || sessions.length === 0) return "";

    // Get all messages from user's sessions (limit to last 50 for performance)
    const allMessages = sessions
      .flatMap(session => session.messages)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50);

    if (allMessages.length === 0) return "";

    // Extract user interests and patterns
    const userQueries = allMessages.filter(msg => msg.message && msg.message.length > 0).map(msg => msg.message);
    const frequentTopics = extractFrequentTopics(userQueries);
    const communicationStyle = analyzeCommunicationStyle(userQueries);
    const recentInteractions = allMessages.slice(0, 8);

    return `
USER PERSONALIZATION CONTEXT:
===========================================

FREQUENT TOPICS & INTERESTS:
${frequentTopics.join(", ")}

COMMUNICATION STYLE:
${communicationStyle}

RECENT CONVERSATION HISTORY:
${recentInteractions.map(msg => `User: ${msg.message}\nAI: ${msg.response}`).join("\n\n")}

CONVERSATION PATTERNS:
- Total conversations: ${sessions.length}
- Average query length: ${Math.round(userQueries.join(" ").split(" ").length / userQueries.length)} words
- Most active time: Recent sessions
===========================================
`;
  };

  // 🔥 Helper function to extract frequent topics from user queries
  const extractFrequentTopics = (queries: string[]): string[] => {
    const healthKeywords = [
      "headache", "migraine", "pain", "fever", "medication", "prescription", 
      "diet", "nutrition", "exercise", "sleep", "stress", "anxiety", "mental health",
      "symptoms", "doctor", "treatment", "wellness", "fitness", "weight", "blood pressure",
      "diabetes", "heart", "lung", "skin", "allergy", "infection", "vitamin", "supplement"
    ];

    const topicCount: { [key: string]: number } = {};
    
    queries.forEach(query => {
      const lowerQuery = query.toLowerCase();
      healthKeywords.forEach(keyword => {
        if (lowerQuery.includes(keyword)) {
          topicCount[keyword] = (topicCount[keyword] || 0) + 1;
        }
      });
    });

    return Object.entries(topicCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([topic]) => topic);
  };

  // 🔥 Helper function to analyze communication style
  const analyzeCommunicationStyle = (queries: string[]): string => {
    if (queries.length === 0) return "Casual, seeking general health information";

    const avgLength = queries.join(" ").split(" ").length / queries.length;
    const hasQuestions = queries.some(q => q.includes("?"));
    const hasUrgent = queries.some(q => q.toLowerCase().includes("urgent") || q.toLowerCase().includes("immediate"));
    const isDetailed = avgLength > 15;

    let style = "";
    if (isDetailed) style += "Detailed, thorough inquirer. ";
    if (hasQuestions) style += "Question-oriented, seeks specific answers. ";
    if (hasUrgent) style += "Sometimes needs urgent guidance. ";
    
    return style || "Conversational, health-conscious individual";
  };

  // ── Incognito mode ──────────────────────────────────────────────
  const enterIncognito = () => {
    if (isIncognito) return;
    // Remember where the user was so we can restore it on exit.
    savedSessionBeforeIncognito.current = currentSession;
    setIsIncognito(true);
    setSidebarOpen(false);
    setMessage("");
    setSelectedFile(null);
    setFileName("");
    // Fresh, in-memory-only session. The "incognito" id signals "never persist".
    setCurrentSession({
      id: "incognito",
      userId: user?.uid || "incognito",
      title: "Incognito",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const exitIncognito = () => {
    if (!isIncognito) return;
    setIsIncognito(false);
    setMessage("");
    setSelectedFile(null);
    setFileName("");
    // Discard the incognito conversation, restore the prior session (or new chat).
    setCurrentSession(savedSessionBeforeIncognito.current);
    savedSessionBeforeIncognito.current = null;
  };

  // Ephemeral send path for incognito — never persists, no memory, no auto-logging.
  const sendIncognitoMessage = async () => {
    if (!message.trim() && !selectedFile) {
      toast.error("Please enter a message or upload a file");
      return;
    }
    setIsGenerationStopped(false);
    const userMessage = message.trim() || (selectedFile ? "Please analyze this report" : "File uploaded");
    const messageId = uuidv4();
    const fileToAnalyze = selectedFile;
    let fileMeta: ChatFileMeta | null = null;
    if (selectedFile) {
      try { fileMeta = await buildFileMeta(selectedFile); }
      catch { fileMeta = { name: selectedFile.name, size: selectedFile.size, type: selectedFile.type }; }
    }

    setLoading(true);
    setMessage("");
    setSelectedFile(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Optimistically render the user message.
    setCurrentSession((prev) =>
      prev
        ? {
            ...prev,
            messages: [
              ...prev.messages,
              { id: messageId, userId: "incognito", message: userMessage, response: "", timestamp: new Date(), type: "chat" as const, image: null, file: fileMeta },
            ],
            updatedAt: new Date(),
          }
        : prev,
    );

    let botResponse = "";
    try {
      if (fileToAnalyze) {
        const toastId = toast.loading(`Analyzing ${fileToAnalyze.name}…`, { description: "Reading your report…" });
        try {
          const { markdown } = await analyzeLabReport(fileToAnalyze, message.trim());
          botResponse = wrapLabReport(markdown);
          toast.success("Report analyzed", { id: toastId });
          // NOTE: deliberately NOT logging findings to Health Memory in incognito.
        } catch (err: any) {
          toast.error("Analysis failed", { id: toastId, description: err?.message });
          botResponse = `I couldn't analyze "${fileToAnalyze.name}". ${err?.message ?? ""}`;
        }
      } else {
        // incognito=true → no health memory, no cross-session history, no name.
        botResponse = await generateAIResponse(userMessage, selectedModel, messageId, selectedPlan, "", true);
      }
    } catch (err) {
      console.error("Incognito generation failed:", err);
      botResponse = "Sorry, something went wrong. Please try again.";
    }

    setCurrentSession((prev) =>
      prev
        ? { ...prev, messages: prev.messages.map((m) => (m.id === messageId ? { ...m, response: botResponse } : m)), updatedAt: new Date() }
        : prev,
    );
    setLoading(false);
  };

  const startNewChat = async () => {
    if (!user || isAnySessionCreationInProgress) {
      if (!user) {
        toast.error("Please log in to start a new chat");
      }
      return;
    }
    try {
      console.log("🆕 Starting new chat...");
      
      // Set flag to prevent useEffect from interfering
      setManualNewChatStarted(true);
      setIsAnySessionCreationInProgress(true);
      
      // Create only a temporary session in memory - don't save to database until first message
      const tempSessionId = "temp-" + uuidv4();
      const newSession: ProcessedChatSession = {
        id: tempSessionId,
        userId: user.uid,
        title: "New Chat",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Clear existing state first
      setCurrentSession(null);
      setMessage("");
      setSelectedFile(null);
      setFileName("");
      setMessageCount(0);
      
      // Clear localStorage session tracking
      if (typeof window !== "undefined") {
        localStorage.removeItem(`lastSessionId_${user.uid}`);
        localStorage.removeItem(`appClosed_${user.uid}`);
        sessionStorage.setItem(`sessionStart_${user.uid}`, Date.now().toString());
      }
      
      // Set the new temporary session
      setTimeout(() => {
        setCurrentSession(newSession);
        console.log("✅ New temporary chat started:", tempSessionId);
        toast.success("New chat started!");
        // Reset flag after session is set
        setManualNewChatStarted(false);
        setIsAnySessionCreationInProgress(false);
      }, 100);
      
      // Don't navigate - this can cause useEffect cycles
      // router.replace('/chat');
      
    } catch (error: any) {
      console.error("Error starting new chat:", error);
      toast.error("Failed to start new chat");
      setManualNewChatStarted(false);
      setIsAnySessionCreationInProgress(false);
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string | null> => {
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) throw new Error("Cloudinary cloud name is not configured.");
      const validTypes = ["image/jpeg", "image/png", "image/heic", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type}. Please upload a JPG, PNG, HEIC, or PDF.`);
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "medibot_Uploads");
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${file.type === "application/pdf" ? "raw" : "image"}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudinary upload failed: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      const url = data.secure_url;
      if (!url || typeof url !== "string" || !url.startsWith("https://")) {
        console.warn("Invalid Cloudinary URL:", url);
        return null;
      }
      return url;
    } catch (error: any) {
      console.error("Error uploading to Cloudinary:", error);
      toast.error(`Failed to upload file: ${error.message || "Unknown error"}`);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!user) {
      toast.error("Please log in to send messages");
      return;
    }
    // Language paywall: free users writing in a premium-only language get an
    // upgrade prompt instead of a response.
    if (message.trim()) {
      const gate = needsUpgradeForLanguage(message, userProfile?.plan);
      if (gate) {
        setLanguageGate(gate);
        return;
      }
    }

    // Usage paywall: free users get 3 report + 3 image analyses per month.
    if (selectedFile) {
      const usage = await getUsage(user.uid);
      const verdict = canAnalyze(usage, userProfile?.plan, selectedFile.type);
      if (!verdict.allowed) {
        setUsageGate(verdict.blockedFeature ?? "report");
        return;
      }
    }

    // In incognito, use the ephemeral path that never persists.
    if (isIncognito) {
      return sendIncognitoMessage();
    }
    if (!message.trim() && !selectedFile) {
      toast.error("Please enter a message or upload a file");
      return;
    }
    
    // Reset generation stopped state when starting new message
    setIsGenerationStopped(false);
    
    const userMessage = message.trim() || (selectedFile ? "Please analyze this report" : "File uploaded");
    const messageId = uuidv4();
    setLoading(true);
    try {
      let sessionId = currentSession?.id;
      let isNewSession = !currentSession || currentSession.messages.length === 0;
      let smartTitle = currentSession?.title || "New Chat";
      
      // 🔥 ENHANCED AI TITLE GENERATION WITH ERROR HANDLING
      if (isNewSession) {
        try {
          const rawTitle = message.trim() ? await generateAITitle(message) : "File Chat";
          smartTitle = validateAndSanitizeTitle(rawTitle);
        } catch (titleError) {
          console.warn("Failed to generate AI title for new session:", titleError);
          smartTitle = validateAndSanitizeTitle(generateFallbackTitle(message.trim() || "File Chat"));
        }
      } else if (currentSession?.title === "New Chat" && message.trim()) {
        try {
          const rawTitle = await generateAITitle(message, currentSession.title);
          smartTitle = validateAndSanitizeTitle(rawTitle);
          await updateChatSessionTitle(sessionId!, smartTitle);
          setCurrentSession((prev) => (prev ? { ...prev, title: smartTitle } : prev));
        } catch (titleError) {
          console.warn("Failed to update title in database:", titleError);
          // Use fallback title but don't fail the message send
          smartTitle = validateAndSanitizeTitle(generateFallbackTitle(message));
          setCurrentSession((prev) => (prev ? { ...prev, title: smartTitle } : prev));
        }
      }
      
      // Note: We no longer upload to Cloudinary. The PDF/image is sent
      // directly to Gemini's multimodal API for analysis below. We store ONLY
      // privacy-safe metadata (name/size/type/pageCount) — never the file itself.
      const fileUrl: string | null = null;
      const fileToAnalyze: File | null = selectedFile;
      let fileMeta: ChatFileMeta | null = null;
      if (selectedFile) {
        try {
          fileMeta = await buildFileMeta(selectedFile);
        } catch (e) {
          console.warn("Failed to build file metadata:", e);
          fileMeta = { name: selectedFile.name, size: selectedFile.size, type: selectedFile.type };
        }
      }

      // For new sessions, create a temporary in-memory session to show the message immediately
      if (isNewSession && !currentSession) {
        const tempSession: ProcessedChatSession = {
          id: "temp-" + uuidv4(), // Temporary ID
          userId: user.uid,
          title: smartTitle,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setCurrentSession(tempSession);
      }
      
      const tempMessage: ProcessedChatSession["messages"][0] = {
        id: messageId,
        userId: user.uid,
        message: userMessage,
        response: "",
        timestamp: new Date(),
        type: "chat",
        image: fileUrl ?? null,
        file: fileMeta,
      };
      setCurrentSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, tempMessage],
          updatedAt: new Date(),
          title: smartTitle,
        };
      });
      setMessage("");
      setSelectedFile(null);
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      let botResponse = "";
      if (fileToAnalyze) {
        // A file is attached. If the user ALSO typed a question, answer that question
        // using the report. Otherwise, produce the full structured analysis.
        const userQuestion = message.trim();
        const isImageFile = fileToAnalyze.type.startsWith("image/");
        const toastId = toast.loading(`Analyzing ${fileToAnalyze.name}…`, {
          description: isImageFile ? "Looking at your image…" : (userQuestion ? "Answering your question from the report…" : "Reading your report — this takes a few seconds."),
        });
        try {
          const { markdown, modelUsed, kind } = await analyzeLabReport(fileToAnalyze, userQuestion);
          console.log(`[chat] image analyzed with ${modelUsed} (kind=${kind})`);
          botResponse = wrapLabReport(markdown);
          toast.success(kind === "symptom" ? "Photo analyzed" : "Report analyzed", { id: toastId });

          // Count this analysis against the user's monthly free quota (premium = no-op).
          incrementUsage(user.uid, kind === "symptom" ? "image" : "report", userProfile?.plan).catch(() => {});

          if (user?.uid && kind === "report") {
            // Feed abnormal findings into Health Memory (timeline + AI memory). Non-blocking.
            const parsed = parseReportFindings(markdown);
            const abnormal = parsed.findings.filter((f) => f.status !== "BORDERLINE");
            if (abnormal.length > 0) {
              const recordDate = parsed.reportDate || new Date().toISOString().slice(0, 10);
              const sourceLabel = parsed.reportType ? ` (${parsed.reportType})` : "";
              Promise.allSettled(
                abnormal.slice(0, 30).map((f) =>
                  addHealthRecord(user.uid, {
                    type: "test_result",
                    title: `${f.name}: ${f.value} (${f.status === "CRITICAL" ? "Critically " : ""}${f.status.charAt(0) + f.status.slice(1).toLowerCase()})`,
                    description: `${f.range ? `Normal range: ${f.range}. ` : ""}From uploaded lab report${sourceLabel}.`,
                    date: recordDate,
                  }),
                ),
              )
                .then((results) => {
                  const saved = results.filter((r) => r.status === "fulfilled").length;
                  if (saved > 0) {
                    toast.success(`Added ${saved} finding${saved === 1 ? "" : "s"} to your Health Memory`, { duration: 4000 });
                  }
                })
                .catch((e) => console.error("Failed to log report findings:", e));
            }
          } else if (user?.uid && kind === "symptom") {
            // Log a single symptom event to the timeline.
            addHealthRecord(user.uid, {
              type: "symptom",
              title: "Symptom photo shared",
              description: "You shared a photo of a physical symptom for visual observation.",
              date: new Date().toISOString().slice(0, 10),
            })
              .then(() => toast.success("Added to your Health Memory", { duration: 3000 }))
              .catch((e) => console.error("Failed to log symptom photo:", e));
          }
        } catch (err: any) {
          console.error("Image analysis failed:", err);
          const errMsg = err?.message ?? "Couldn't analyze this file.";
          toast.error("Analysis failed", { id: toastId, description: errMsg });
          botResponse = `I couldn't analyze "${fileToAnalyze.name}". ${errMsg}\n\nYou can try again, or upload a clearer photo.`;
        }
      } else if (message.trim()) {
        const freshMemory = await getFreshMemoryContext();
        botResponse = await generateAIResponse(userMessage, selectedModel, messageId, selectedPlan, freshMemory);

        // Background: auto-extract any symptoms / vitals the user mentioned and log them.
        // Non-blocking — fires and forgets. Shows a tiny toast for each new event.
        if (user?.uid) {
          autoLogFromUserMessage(user.uid, userMessage)
            .then((result) => {
              if (result.logged.length > 0) {
                const labels = result.logged.map((e) => e.title).join(", ");
                toast.success(`Logged to your Health Memory: ${labels}`, {
                  duration: 3500,
                });
              }
            })
            .catch((e) => console.error("auto-log failed:", e));
        }
      }
      
      // Update the message with the full response and set typing to true
      // The TextType component will handle the typing animation
      setCurrentSession((prev) => {
        if (!prev) return prev;
        const updatedMessages = prev.messages.map((msg) =>
          msg.id === messageId
            ? { ...msg, response: botResponse }
            : msg
        );
        return {
          ...prev,
          messages: updatedMessages,
          updatedAt: new Date(),
          title: smartTitle,
        };
      });
      
      // Create session now that we have a message to save
      if (isNewSession && (!sessionId || sessionId.startsWith("temp-"))) {
        try {
          console.log("💾 Creating session with first message:", smartTitle);
          sessionId = await createChatSession(user.uid, smartTitle);
          setLastSessionId(sessionId);
          
          // Update the current session with the real ID
          setCurrentSession((prev) => {
            if (!prev) return prev;
            return { ...prev, id: sessionId };
          });
        } catch (sessionError: any) {
          console.error("Failed to create session with AI title, trying with fallback:", sessionError);
          // Try with a safe fallback title
          try {
            const fallbackTitle = "Health Chat";
            sessionId = await createChatSession(user.uid, fallbackTitle);
            setLastSessionId(sessionId);
            smartTitle = fallbackTitle;
            
            setCurrentSession((prev) => {
              if (!prev) return prev;
              return { ...prev, id: sessionId, title: fallbackTitle };
            });
          } catch (fallbackError) {
            console.error("Failed to create session even with fallback title:", fallbackError);
            throw new Error("Unable to create chat session");
          }
        }
      }
      
      const newMessage = await addMessageToSession(sessionId!, user.uid, userMessage, botResponse, "chat", fileUrl, fileMeta);
      setCurrentSession((prev) => {
        if (!prev) return prev;
        const updatedMessages = prev.messages.map((msg) =>
          msg.id === messageId
            ? {
                ...newMessage,
                id: newMessage.id || uuidv4(),
                timestamp: newMessage.timestamp instanceof Date
                  ? newMessage.timestamp
                  : (newMessage.timestamp as any).toDate(),
                image: newMessage.image ?? null,
              }
            : msg
        );
        return {
          ...prev,
          messages: updatedMessages,
          updatedAt: new Date(),
          title: smartTitle,
        };
      });
      
      // Update sessions list
      setSessions((prev) => {
        const existingSessionIndex = prev.findIndex(session => session.id === sessionId);
        
        if (existingSessionIndex >= 0) {
          // Update existing session
          return prev.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: [
                    ...session.messages,
                    {
                      ...newMessage,
                      timestamp:
                        newMessage.timestamp instanceof Date
                          ? newMessage.timestamp
                          : (newMessage.timestamp as any)?.toDate?.() || new Date(),
                    },
                  ],
                  updatedAt: new Date(),
                  title: smartTitle,
                }
              : session
          );
        } else {
          // Add new session to the list (for sessions created during message sending)
          const newSessionForList: ProcessedChatSession = {
            id: sessionId!,
            userId: user.uid,
            title: smartTitle,
            messages: [{
              ...newMessage,
              timestamp:
                newMessage.timestamp instanceof Date
                  ? newMessage.timestamp
                  : (newMessage.timestamp as any)?.toDate?.() || new Date(),
            }],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return [newSessionForList, ...prev];
        }
      });
      sendMessageNotification(userMessage, botResponse);
      // (Removed the "Message sent successfully" toast — it was noise on every send.)
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(`Failed to send message: ${error.message || "Unknown error"}`);
      setMessage(userMessage);
      if (selectedFile) {
        setSelectedFile(selectedFile);
        setFileName(selectedFile.name);
      }
      setCurrentSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter((msg) => msg.id !== messageId),
        };
      });
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  // Global stop generation function
  const handleStopGeneration = () => {
    console.log("Stop generation clicked"); // Debug log
    setIsGenerationStopped(true);
    
    if (abortController) {
      console.log("Aborting controller"); // Debug log
      abortController.abort();
      setAbortController(null);
    }
    
    // Stop all generation immediately
    setLoading(false);
    
    // Reset stop state after a short delay
    setTimeout(() => {
      setIsGenerationStopped(false);
    }, 100);
    
    toast.info("Response generation stopped");
  };

  const handleStopResponse = (messageId: string) => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      toast.info("Response generation stopped");
    }
  };

  const handleRetryResponse = async (messageId: string, userMessage: string) => {
    if (!user) {
      toast.error("Please log in to retry responses");
      return;
    }
    
    setLoading(true);
    setIsGenerationStopped(false);
    
    try {
      // Generate a new, optimized response with enhanced prompt for retry
      const optimizedPrompt = userMessage.includes("(Please provide an improved")
        ? userMessage
        : `${userMessage} (Please provide an improved, more detailed and comprehensive response than your previous answer)`;
      const newMessageId = uuidv4();

      const freshMemory = isIncognito ? "" : await getFreshMemoryContext();
      const botResponse = await generateAIResponse(optimizedPrompt, selectedModel, newMessageId, selectedPlan, freshMemory, isIncognito);

      // 1) ALWAYS show the new response in the UI first — regardless of whether
      //    it can be persisted. This is what the user actually cares about.
      setCurrentSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [
            ...prev.messages,
            { id: newMessageId, userId: user.uid, message: userMessage, response: botResponse, timestamp: new Date(), type: "chat" as const, image: null, file: null },
          ],
          updatedAt: new Date(),
        };
      });
      toast.success("Generated improved response!");
      setTimeout(() => scrollToBottom(), 100);

      // 2) Persist best-effort — only for real, saved sessions (not incognito/temp).
      const sessionId = currentSession?.id;
      const isPersistable = !isIncognito && sessionId && !sessionId.startsWith("temp-") && sessionId !== "incognito";
      if (isPersistable) {
        try {
          await addMessageToSession(sessionId!, user.uid, userMessage, botResponse, "chat", null);
        } catch (persistErr) {
          console.warn("Retry response shown but not saved:", persistErr);
        }
      }
    } catch (error: any) {
      console.error("Error generating optimized response:", error);
      toast.error("Failed to generate improved response");
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const handleEditMessage = async (messageId: string, originalMessage: string) => {
    if (!user) {
      toast.error("Please log in to edit messages");
      return;
    }
    if (editingMessageId === messageId) {
      if (!editedMessage.trim()) {
        toast.error("Message cannot be empty");
        return;
      }
      try {
        setLoading(true);
        const freshMemory = isIncognito ? "" : await getFreshMemoryContext();
        const botResponse = await generateAIResponse(editedMessage, selectedModel, messageId, selectedPlan, freshMemory, isIncognito);

        // Update UI first, always.
        const existingMessage = currentSession?.messages.find((msg) => msg.id === messageId);
        setCurrentSession((prev) =>
          prev
            ? {
                ...prev,
                messages: prev.messages.map((msg) =>
                  msg.id === messageId ? { ...msg, message: editedMessage, response: botResponse } : msg,
                ),
              }
            : prev,
        );
        toast.success("Message updated!");

        // Persist best-effort for real sessions only.
        const sessionId = currentSession?.id;
        const isPersistable = !isIncognito && sessionId && !sessionId.startsWith("temp-") && sessionId !== "incognito";
        if (isPersistable) {
          try {
            await addMessageToSession(sessionId!, user.uid, editedMessage, botResponse, "chat", existingMessage?.image ?? null);
          } catch (persistErr) {
            console.warn("Edited message shown but not saved:", persistErr);
          }
        }
      } catch (error: any) {
        console.error("Error editing message:", error);
        toast.error("Failed to edit message");
      } finally {
        setEditingMessageId(null);
        setEditedMessage("");
        setLoading(false);
        setAbortController(null);
      }
    } else {
      setEditingMessageId(messageId);
      setEditedMessage(originalMessage);
    }
  };

  const handleFeedback = async (messageId: string, isPositive: boolean) => {
    if (!user) {
      toast.error("Please log in to provide feedback");
      return;
    }
    try {
      toast.success(`Thank you for your ${isPositive ? "positive" : "negative"} feedback!`);
    } catch (error: any) {
      console.error("Error handling feedback:", error);
      toast.error("Failed to submit feedback");
    }
  };

  const handleCopyText = (text: string, messageId?: string) => {
    navigator.clipboard.writeText(text);
    if (messageId) {
      setCopiedMessageIds(prev => new Set(prev).add(messageId));
      setTimeout(() => {
        setCopiedMessageIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
      }, 3000); // Show checkmark for 3 seconds
    }
  };

  const handleSpeakResponse = (text: string) => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-speech not supported in this browser");
      return;
    }
    
    // Check if user has premium plan for speech-to-speech
    if (userProfile?.plan === 'base') {
      toast.error("Speech-to-speech is a premium feature. Redirecting to upgrade page...");
      setTimeout(() => {
        router.push('/pricing');
      }, 1500);
      return;
    }
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      utteranceRef.current = null;
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    utterance.onerror = () => {
      
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const exportChat = () => {
    if (!currentSession) return;
    const content = currentSession.messages
      .map((msg) => `User: ${msg.message}\nAI: ${msg.response}\n`)
      .join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentSession.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported successfully!");
  };

  // 🔥 TITLE VALIDATION AND SANITIZATION
  const validateAndSanitizeTitle = (title: string): string => {
    if (!title || typeof title !== 'string') {
      return "Health Chat";
    }

    // Sanitize the title
    const sanitized = title
      .trim()
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/["""'']/g, '') // Remove quotes
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/^\W+|\W+$/g, '') // Remove leading/trailing special chars
      .slice(0, 50); // Max length

    // Validate the sanitized title
    if (sanitized.length === 0 || sanitized.length > 50) {
      return "Health Chat";
    }

    // Ensure it doesn't contain only special characters
    if (!/[a-zA-Z0-9]/.test(sanitized)) {
      return "Health Chat";
    }

    return sanitized;
  };

  // 🔥 ENHANCED AI-POWERED TITLE GENERATION WITH RETRY LOGIC
  const generateAITitle = async (message: string, previousTitle?: string, retryCount = 0): Promise<string> => {
    const maxRetries = 2;
    
    try {
      console.log(`🤖 Generating AI title for message (attempt ${retryCount + 1}):`, message.slice(0, 100));
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          previousTitle: previousTitle
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const aiTitle = data.title;

      if (aiTitle && typeof aiTitle === 'string' && aiTitle.trim() && aiTitle.length <= 50) {
        // Validate and sanitize the title
        const validatedTitle = validateAndSanitizeTitle(aiTitle);
        
        if (validatedTitle && validatedTitle !== "Health Chat") {
          console.log("✅ AI generated title:", validatedTitle);
          return validatedTitle;
        }
      }

      throw new Error("Invalid AI title response");

    } catch (error: any) {
      console.warn(`AI title generation attempt ${retryCount + 1} failed:`, error.message);
      
      // Retry logic
      if (retryCount < maxRetries && !error.name?.includes('AbortError')) {
        console.log(`🔄 Retrying AI title generation (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return generateAITitle(message, previousTitle, retryCount + 1);
      }
      
      console.warn("All AI title generation attempts failed, using fallback");
      return generateFallbackTitle(message);
    }
  };

  const generateFallbackTitle = (message: string): string => {
    try {
      const lowerMessage = message.toLowerCase().trim();
      
      if (lowerMessage.length === 0) {
        return "New Conversation";
      }

      // Enhanced health-related keyword matching
      const healthKeywords = [
        { keywords: ["headache", "migraine"], title: "Headache Relief" },
        { keywords: ["fever", "temperature"], title: "Fever Management" },
        { keywords: ["medication", "medicine", "prescription"], title: "Medication Help" },
        { keywords: ["diet", "nutrition", "food"], title: "Nutrition Advice" },
        { keywords: ["exercise", "workout", "fitness"], title: "Fitness Guidance" },
        { keywords: ["sleep", "insomnia"], title: "Sleep Issues" },
        { keywords: ["stress", "anxiety", "mental"], title: "Mental Health" },
        { keywords: ["pain"], title: "Pain Management" },
        { keywords: ["diabetes"], title: "Diabetes Care" },
        { keywords: ["weight", "lose"], title: "Weight Management" },
        { keywords: ["pregnancy", "pregnant"], title: "Pregnancy Care" },
        { keywords: ["child", "kid", "baby"], title: "Child Health" },
      ];

      for (const { keywords, title } of healthKeywords) {
        if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
          return title;
        }
      }

      const words = lowerMessage.split(/\s+/).filter((word) => word.length > 3);
      if (words.length === 0) return "Health Discussion";
      
      const keyPhrase = words.slice(0, 2).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
      return `${keyPhrase} Chat`;
    } catch (error) {
      console.error("Error in fallback title generation:", error);
      return "Health Chat";
    }
  };

  const sendMessageNotification = (userMessage: string, botResponse: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Medibot Response", {
        body: "Your message has been answered",
        icon: "/logo.png",
        badge: "/logo.png",
      });
    }
  };

  // 🔥 ENHANCED FUNCTION: AI Response with comprehensive personalization

const generateAIResponse = async (userMessage: string, selectedModel: string, messageId: string, userPlan: string = 'free', healthMemoryContext: string = '', incognito: boolean = false): Promise<string> => {
    // Handle "what's my age" and similar questions
    const ageQuestions = [
      "what's my age", "whats my age", "what is my age", "do you know my age", "tell me my age", "how old am i"
    ];
    if (!incognito && ageQuestions.some(q => userMessage.toLowerCase().includes(q))) {
      // Try to infer the most recent age from all chat sessions
      let userAge = "";
      let latestTimestamp = 0;
      if (sessions?.length) {
        const ageRegexes = [
          /i['’`]?m (\d{1,3})/i,
          /i am (\d{1,3})/i,
          /i['’`]?m (\d{1,3}) years old/i,
          /i am (\d{1,3}) years old/i,
          /my age is (\d{1,3})/i,
          /age: (\d{1,3})/i
        ];
        for (let s = 0; s < sessions.length; s++) {
          const msgs = sessions[s].messages || [];
          for (let i = 0; i < msgs.length; i++) {
            const msg = msgs[i];
            if (typeof msg.message === 'string') {
              for (const regex of ageRegexes) {
                const match = msg.message.match(regex);
                if (match && match[1]) {
                  const ts = msg.timestamp instanceof Date ? msg.timestamp.getTime() : new Date(msg.timestamp).getTime();
                  if (ts > latestTimestamp) {
                    userAge = match[1].trim();
                    latestTimestamp = ts;
                  }
                }
              }
            }
          }
        }
      }
      if (userAge) {
        return `You are ${userAge} years old.`;
      } else {
        return "I don't have your age yet. You can tell me by saying 'I'm 22' or 'I am 22 years old'.";
      }
    }
  try {
    const controller = new AbortController();
    setAbortController(controller);

    // Medibot brand-only lineup — underlying provider details are hidden from users.
    const modelMap: Record<string, { api: string; model: string; key: string; plan: 'free' | 'premium' }> = {
      "medibot-care": {
        api: "gemini",
        model: "gemini-2.5-flash",
        key: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
        plan: "free",
      },
      "medibot-specialist": {
        api: "gemini",
        model: "gemini-2.5-pro",
        key: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
        plan: "premium",
      },
      // Legacy alias — old chat sessions saved with "medibot" still work
      "medibot": {
        api: "gemini",
        model: "gemini-2.5-flash",
        key: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
        plan: "free",
      },
    };

    const config = modelMap[selectedModel];
    if (!config) throw new Error(`Invalid model: ${selectedModel}`);
    if (!config.key) throw new Error(`${config.api.toUpperCase()} API key is not configured.`);

    // Check if user has access to this model based on their plan
    if (config.plan === 'premium' && userPlan !== 'premium') {
      const gateErr: any = new Error(`This model requires a Premium subscription. Please upgrade to access ${selectedModel}.`);
      gateErr.isPremiumGate = true;
      throw gateErr;
    }

    const greetings = ["hi", "hello", "hey", "hola", "yo", "hii", "hi there", "hlo", "helloo", "good morning", "good afternoon", "good evening", "how are you", "wassup", "what's up", "sup"];
    const userMessageLower = userMessage.trim().toLowerCase();
    
    if (!incognito && greetings.some(greeting => userMessageLower === greeting || userMessageLower.startsWith(greeting + " "))) {
      // Get user's name from profile or infer from conversations
      let userName = "";
      if (userProfile?.displayName) {
        userName = userProfile.displayName.split(' ')[0]; // Use first name only
      } else if (user?.displayName) {
        userName = user.displayName.split(' ')[0];
      } else if (user?.email) {
        userName = user.email.split("@")[0];
      }
      
      // If no name found, try to extract from all chat sessions
      if (!userName && sessions?.length) {
        const nameRegex = /my name is ([A-Za-z ]+)/i;
        outer: for (let s = sessions.length - 1; s >= 0; s--) {
          const msgs = sessions[s].messages || [];
          for (let i = msgs.length - 1; i >= 0; i--) {
            const msgText = msgs[i].message;
            if (typeof msgText === 'string') {
              const match = msgText.match(nameRegex);
              if (match && match[1]) {
                userName = match[1].trim().split(' ')[0]; // Use first name only
                break outer;
              }
            }
          }
        }
      }

      // Check if this is the first greeting (new session or no previous messages)
      const isFirstGreeting = !currentSession || currentSession.messages.length === 0;
      
      // Create personalized greeting responses
      const personalizedResponses = userName ? [
        `Hi ${userName}! 🩺 Great to see you again! I'm Medibot, your health assistant. How can I help you with your health concerns today? 😊`,
        `Hello ${userName}! 🩺 Welcome back! I'm here to assist you with any health questions or concerns you might have. What's on your mind today? 😊`,
        `Hey ${userName}! 🩺 Nice to chat with you again! I'm Medibot, ready to help with your health and wellness questions. How can I assist you today? 😊`,
        `Hi there, ${userName}! 🩺 I'm Medibot, your personal health assistant. Feel free to ask me anything about health, medications, symptoms, or wellness tips. How can I help? 😊`
      ] : [
        "Hi there! 🩺 I'm Medibot, your helpful health assistant. How can I help you with your health concerns today? 😊",
        "Hello! 🩺 Great to see you! I'm here to assist you with any health questions or concerns you might have. What's on your mind today? 😊",
        "Hey! 🩺 I'm Medibot, ready to help you with your health and wellness questions. How can I assist you today? 😊",
        "Hi! 🩺 Welcome! I'm your personal health assistant. Feel free to ask me anything about health, medications, symptoms, or wellness tips. How can I help? 😊"
      ];

      // For returning users with conversation history, add context
      if (!isFirstGreeting && sessions && sessions.length > 0) {
        const recentTopics = extractRecentHealthTopics();
        if (recentTopics.length > 0) {
          const contextualGreeting = userName 
            ? `Hi ${userName}! 🩺 Welcome back! I remember we discussed ${recentTopics.slice(0, 2).join(' and ')} recently. How are you feeling today, and how can I help you further? 😊`
            : `Hi there! 🩺 Welcome back! I see we've discussed ${recentTopics.slice(0, 2).join(' and ')} recently. How are you feeling today, and what would you like to know more about? 😊`;
          return contextualGreeting;
        }
      }

      return personalizedResponses[Math.floor(Math.random() * personalizedResponses.length)];
    }


    const identityQuestions = [
      "who created you", "who made you", "who developed you", "who's your creator",
      "tell me your developer", "who built you", "who's your founder"
    ];
    if (identityQuestions.some(q => userMessage.toLowerCase().includes(q))) {
      return "I was developed by Vignesh Skanda from Medibot.";
    }

    // Handle "what's my name" and similar questions
    const nameQuestions = [
      "what's my name", "whats my name", "what is my name", "do you know my name", "tell me my name", "who am i"
    ];
    if (!incognito && nameQuestions.some(q => userMessage.toLowerCase().includes(q))) {
      // Try to infer name from userProfile, user, or all chat sessions
      let userName = "";
      if (userProfile?.displayName) userName = userProfile.displayName;
      else if (user?.displayName) userName = user.displayName;
      else if (user?.email) userName = user.email.split("@")[0];
      // Try to extract from all chat sessions if not found
      if (!userName && sessions?.length) {
        const nameRegex = /my name is ([A-Za-z ]+)/i;
        outer: for (let s = sessions.length - 1; s >= 0; s--) {
          const msgs = sessions[s].messages || [];
          for (let i = msgs.length - 1; i >= 0; i--) {
            const msgText = msgs[i].message;
            if (typeof msgText === 'string') {
              const match = msgText.match(nameRegex);
              if (match && match[1]) {
                userName = match[1].trim();
                break outer;
              }
            }
          }
        }
      }
      if (userName) {
        return `Your name is ${userName}.`;
      } else {
        return "I don't have your name yet. You can tell me by saying 'My name is ...'";
      }
    }

    // Handle requests for conversation history/previous questions
    const historyQuestions = [
      "what's my previous questions", "whats my previous questions", "what did i ask before", 
      "what were my previous questions", "show my previous questions", "my previous conversations",
      "what did we discuss", "our previous conversation", "conversation history", "chat history",
      "what did i ask you before", "my past questions", "previous topics", "what have we talked about"
    ];
    if (!incognito && historyQuestions.some(q => userMessage.toLowerCase().includes(q))) {
      // Get comprehensive conversation history
      let historyText = "";

      if (sessions && sessions.length > 0) {
        // Get user's questions from all sessions (excluding current session if it's new)
        const allUserQuestions: Array<{question: string, session: string, date: string}> = [];
        
        sessions.slice(0, 5).forEach((session, sessionIndex) => { // Last 5 sessions
          if (session.messages && session.messages.length > 0) {
            session.messages.forEach((msg, msgIndex) => {
              if (msg.message && msg.message.trim().length > 0) {
                // Skip current greeting if it's the only message in current session
                if (
                  session.id === currentSession?.id &&
                  currentSession &&
                  currentSession.messages.length === 1
                ) {
                  return;
                }
                
                allUserQuestions.push({
                  question: msg.message,
                  session: session.title || `Session ${sessionIndex + 1}`,
                  date: ""
                });
              }
            });
          }
        });

        if (allUserQuestions.length > 0) {
          // Limit to most recent 10 questions to avoid overwhelming response
          const recentQuestions = allUserQuestions.slice(0, 10);
          
          historyText = `🩺 Here are your recent questions from our conversations:\n\n`;
          
          recentQuestions.forEach((item, index) => {
            historyText += `${index + 1}. "${item.question}"\n\n`;
          });
          
          historyText += `These are your most recent questions. If you'd like to revisit any of these topics or have follow-up questions, I'm here to help! 😊`;
          
        } else {
          historyText = "🩺 I don't see any previous questions in our conversation history yet. This might be our first conversation, or the history might not be available. Feel free to ask me any health-related questions! 😊";
        }
      } else {
        historyText = "🩺 I don't have access to any previous conversations. This appears to be our first chat! I'm here to help with any health questions you might have. 😊";
      }
      
      return historyText;
    }

    // Condense a stored AI response for context. Lab-report analyses are huge
    // (10k+ chars) — for context we keep only the report type + abnormal findings
    // so follow-up questions ("explain more on this") can reference the report
    // without blowing up the prompt.
    const condenseForContext = (response: string): string => {
      if (!response) return "";
      if (!response.includes("[[LAB_REPORT]]")) return response;
      const clean = response.replace("[[LAB_REPORT]]", "").trim();
      const lines = clean.split("\n");
      const kept: string[] = [];
      let inAttention = false;
      for (const line of lines) {
        if (/^\*\*Report type:/i.test(line) || /^### Lab Report Analysis/i.test(line)) {
          kept.push(line.replace(/^###\s*/, ""));
        }
        if (/^### Results That Need Attention/i.test(line)) { inAttention = true; continue; }
        if (/^### /.test(line)) { inAttention = false; }
        // Keep the abnormal result headlines (the **[STATUS] Name** — value lines)
        if (inAttention && /^\*\*\[(LOW|BORDERLINE|HIGH|CRITICAL)\]/.test(line)) {
          kept.push(line.replace(/\*\*/g, "").replace(/_\(/g, "(").replace(/\)_/g, ")"));
        }
      }
      const summary = kept.join("\n").slice(0, 1500);
      return summary || "[Analyzed a lab report for the user]";
    };

    // Enhanced context building: Include both current session and cross-session context
    let currentSessionContext = "";
    let crossSessionContext = "";

    // Current session context (last 5 messages)
    if (currentSession?.messages?.length) {
      const recentMessages = currentSession.messages.slice(-5);
      currentSessionContext = recentMessages
        .map((msg) => `User: ${msg.message}\nAI: ${condenseForContext(msg.response)}`)
        .join("\n\n");
    }
    
    // Cross-session context for personalization (if this is a new session or has few messages).
    // SKIPPED entirely in incognito mode — the AI must not see any past conversations.
    if (!incognito && (!currentSession || currentSession.messages.length < 3) && sessions && sessions.length > 1) {
      const otherSessions = sessions.filter(s => s.id !== currentSession?.id).slice(0, 2);
      const relevantMessages = otherSessions.flatMap(session =>
        session.messages.slice(-2) // Last 2 messages from each of the 2 most recent other sessions
      );

      if (relevantMessages.length > 0) {
        crossSessionContext = `\n\nRELEVANT CONVERSATION HISTORY:\n${relevantMessages
          .map((msg) => `User: ${msg.message}\nAI: ${condenseForContext(msg.response)}`)
          .join("\n\n")}`;
      }
    }

    const fullContext = currentSessionContext + crossSessionContext;

    // Use optimized prompt to prevent cutoffs
    const optimizedPrompt = createOptimizedPrompt(userMessage, fullContext, incognito);
    
    // Alternative: Simple fallback prompt if needed
    const simplePrompt = `You are Medibot. Answer this health question with a complete, plain-text response. Do NOT use any emojis or emoticons: ${userMessage}`;
    const basePrompt = `You are Medibot, a helpful health information assistant.

CRITICAL MEDICAL SAFETY RULES — these are non-negotiable:
1. NEVER recommend, prescribe, suggest, or name any specific medication, drug, brand name, or dosage. Not even over-the-counter ones. Not even common ones like paracetamol, ibuprofen, acetaminophen, loperamide, aspirin, etc. You are not a doctor and prescribing is illegal for you.
2. If the user asks "what medicine should I take" or similar, respond with: general non-pharmaceutical guidance (rest, hydration, when to seek care) and explicitly tell them to consult a pharmacist or doctor for medication choices.
3. NEVER diagnose. Do not say "you have X" or "this sounds like X disease." You may describe possibilities only as "things to discuss with a doctor."
4. ALWAYS recommend the user consults a qualified healthcare professional for diagnosis and treatment decisions.
5. For any red-flag symptoms (chest pain, severe bleeding, breathing difficulty, suicidal thoughts, stroke signs), tell them to seek emergency care immediately.

FORMATTING RULES:
- Use plain text only. NO emojis, emoticons, or symbols (no 🩺 💊 ❤️ 😊 etc).
- Write in natural, flowing paragraphs like a friend who happens to know health basics.
- Use bullet points ONLY when listing steps, symptoms-to-watch-for, or when the user explicitly asks for a list.

PERSONALIZATION:
When the user's verified health profile is provided below, USE IT carefully. Reference known conditions, allergies, and recorded events when medically relevant. NEVER invent facts not in the profile. If the user mentions a symptom that's a known pattern for them, acknowledge it.

If the user asks about your developer, say: "I was developed by Vignesh Skanda from Medibot."`;
    const memoryBlock = healthMemoryContext ? `\n\n${healthMemoryContext}\n` : '';
    const prompt = currentSessionContext
  ? `${basePrompt}${memoryBlock}\n\nCONVERSATION HISTORY:\n${currentSessionContext}\n\nUSER QUESTION:\n${userMessage}`
  : `${basePrompt}${memoryBlock}\n\nUSER QUESTION:\n${userMessage}`;

    let content: string | undefined;

    // ✅ Gemini API Integration
    if (config.api === "gemini") {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.key}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: optimizedPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 65536,
              topP: 0.95,
              topK: 1,
              stopSequences: [],
              candidateCount: 1,
            },
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      // Check if response was truncated due to safety filters or other issues
      if (data.candidates?.[0]?.finishReason === "SAFETY" || 
          data.candidates?.[0]?.finishReason === "OTHER") {
        console.warn("Gemini response was filtered or truncated:", data.candidates[0].finishReason);
      }
    }

    // ✅ Anthropic Claude API Integration
    else if (config.api === "anthropic") {
      const response = await fetch(
        `https://api.anthropic.com/v1/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": config.key,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: config.model,
            max_tokens: 8192,
            temperature: 0.7,
            messages: [
              {
                role: "user",
                content: optimizedPrompt,
              },
            ],
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      content = data.content?.[0]?.text;
    }
    // ✅ HuggingFace API Integration (via backend proxy)
    else if (config.api === "huggingface") {
      const response = await fetch('/api/huggingface', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          prompt: optimizedPrompt,
        }),
        signal: controller.signal,
      });
    
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HuggingFace API error: ${response.status}`);
      }
    
      const data = await response.json();
      content = data.generated_text;
    }
    // ✅ OpenAI / Groq
    else {
      const url = config.api === "groq"
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.key}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: "system",
              content: "You are a helpful health assistant named Medibot created by Vignesh Skanda from Medibot.",
            },
            {
              role: "user",
              content: optimizedPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 8192,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0,
          stop: null,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${config.api.toUpperCase()} API error: ${response.status} - ${errorText}`);
      }

      const data: OpenAIResponse | GroqResponse = await response.json();
      content = data.choices?.[0]?.message?.content;
      
      // Check if response was truncated
      if (data.choices?.[0]?.finish_reason === "length") {
        console.warn("Response was truncated due to length limit");
        // Try again with a more concise prompt
        const shortPrompt = `You are Medibot. Answer this health question completely: ${userMessage}`;
        
        const retryResponse = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.key}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              {
                role: "system",
                content: "You are a helpful health assistant. Always complete your responses.",
              },
              {
                role: "user",
                content: shortPrompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 8192,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0,
            stop: null,
          }),
          signal: controller.signal,
        });
        
        if (retryResponse.ok) {
          const retryData: OpenAIResponse | GroqResponse = await retryResponse.json();
          const retryContent = retryData.choices?.[0]?.message?.content;
          if (retryContent) {
            content = retryContent;
          }
        }
      }
    }

    if (!content) throw new Error("No valid response");

    // Strip emojis from AI response — covers symbols, emoticons, dingbats, regional indicators, ZWJ sequences, variation selectors
    const stripEmojis = (s: string) =>
      s
        .replace(/[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{2B00}-\u{2BFF}\u{1F100}-\u{1F1FF}]/gu, '')
        .replace(/[\u{FE0E}\u{FE0F}\u{200D}]/gu, '')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();

    return stripEmojis(content);

  } catch (error: any) {
    if (error.name === "AbortError") return "";
    console.error(`Error generating ${selectedModel} response:`, error);

    // Case 1: user simply isn't premium — don't silently downgrade with a vague
    // toast. Tell them clearly and (optionally) nudge to upgrade.
    if (error?.isPremiumGate) {
      toast.error("Medibot Specialist is a Premium feature — answering with Medibot Care instead.");
      return generateAIResponse(userMessage, "medibot-care", messageId, "free", healthMemoryContext, incognito);
    }

    // Case 2: a genuine API failure on a premium model. Surface the real reason
    // (status / message) instead of hiding it, so issues are diagnosable.
    if (selectedModel !== "medibot-care" && selectedModel !== "medibot") {
      const reason = (error?.message || "").toString().slice(0, 160);
      toast.warning(`Medibot Specialist failed${reason ? ` (${reason})` : ""}. Falling back to Medibot Care…`);
      return generateAIResponse(userMessage, "medibot-care", messageId, userPlan, healthMemoryContext, incognito);
    }

    return "Sorry, something went wrong. Try again.";
  }
};




  const analyzePrescription = async (file: File): Promise<PrescriptionAnalysis> => {
    try {
      setAnalyzingPrescription(true);
      const fileBase64 = await fileToBase64(file);
      const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!geminiApiKey) throw new Error("Gemini API key is not configured.");
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text:
                      "Analyze this prescription image or PDF and extract medications, dosages, instructions, and warnings. Return JSON with fields: medications (array), dosages (array), instructions (string), warnings (array).",
                  },
                  {
                    inlineData: {
                      mimeType: file.type,
                      data: fileBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 500,
            },
          }),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      const data: GeminiResponse = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const cleanedResponseText = responseText.replace(/```json/g, "").replace(/```/g, "").replace(/`/g, "").trim();
      let result: PrescriptionAnalysis;
      try {
        result = JSON.parse(cleanedResponseText) as PrescriptionAnalysis;
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("Invalid JSON response from API");
      }
      return {
        medications: Array.isArray(result.medications) ? result.medications : ["Unknown"],
        dosages: Array.isArray(result.dosages) ? result.dosages : ["Unknown"],
        instructions: typeof result.instructions === "string" ? result.instructions : "No instructions provided.",
        warnings: Array.isArray(result.warnings) ? result.warnings : [],
      };
    } catch (error: any) {
      console.error("Error analyzing prescription:", error);
      toast.error(`Failed to analyze prescription: ${error.message || "Unknown error"}`);
      return {
        medications: ["Error"],
        dosages: ["N/A"],
        instructions: "Failed to analyze prescription.",
        warnings: ["Please try again or consult a healthcare professional."],
      };
    } finally {
      setAnalyzingPrescription(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        if (!base64String) reject(new Error("Failed to convert file to base64"));
        else resolve(base64String);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!user) {
      toast.error("Please log in to send messages");
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editingMessageId) {
        handleEditMessage(editingMessageId, editedMessage);
      } else {
        handleSendMessage();
      }
    }
  };

  const handlePrescriptionAnalysis = () => {
    if (!user) {
      toast.error("Please log in to analyze prescriptions");
      return;
    }
    
    // Check if user has premium plan for prescription analysis
    if (userProfile?.plan === 'base') {
      toast.error("Prescription analysis is a premium feature. Redirecting to upgrade page...");
      setTimeout(() => {
        router.push('/pricing');
      }, 1500);
      return;
    }
    
    setPrescriptionDialogOpen(true);
    setAnalysisResult(null);
  };

  const handleFileUpload = () => {
    if (!user) {
      toast.error("Please log in to upload files");
      return;
    }
    
    // Check if user has premium plan for file upload (prescription analysis)
    if (userProfile?.plan === 'base') {
      toast.error("File upload with prescription analysis is a premium feature. Redirecting to upgrade page...");
      setTimeout(() => {
        router.push('/pricing');
      }, 1500);
      return;
    }
    
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast.error("Please log in to upload files");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/heic", "application/pdf"].includes(file.type)) {
      toast.error("Please upload a JPG, PNG, HEIC, or PDF file.");
      return;
    }
    setSelectedFile(file);
    setFileName(file.name);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleHistoryDialog = () => {
    if (!user) {
      toast.error("Please log in to view chat history");
      return;
    }
    setHistoryDialogOpen(true);
  };

  const formatISTDateTime = (date: Date) => {
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isValidImageUrl = (url: string | null | undefined): boolean => {
    return !!url && typeof url === "string" && url.startsWith("https://");
  };

  const renderMessages = useMemo(() => {
    if (!user || !currentSession?.messages || currentSession.messages.length === 0) {
      return null;
    }
    
    return currentSession.messages.map((msg, messageIndex) => {
      // Enhanced helper to render response with proper paragraph spacing
      // Enhanced AI response rendering: subheadings, bullets, numbers, paragraphs, and dot-list formatting
      const renderResponse = (response: string) => {
        if (!response) return null;
        
        // Split by lines first to analyze content structure
        let lines = response.split(/\r?\n/).filter(line => line.trim() !== "");
        
        // Helper functions for content detection
        const isSubheading = (line: string) => {
          return /^(\*\*|##)\s?(.+?)(\*\*|)$/.test(line.trim()) || /^[A-Z][^.!?]*:$/.test(line.trim());
        };
        
        const isBulletPoint = (line: string) => {
          return /^\s*([-*•])\s+/.test(line);
        };
        
        const isNumberedPoint = (line: string) => {
          return /^\s*\d+\./.test(line);
        };
        
        // If multiple lines exist, render with proper formatting
        if (lines.length > 1) {
          return (
            <div className="ai-response space-y-3">
              {lines.map((line, idx) => {
                // Subheading: **Title** or ## Title or Title:
                if (isSubheading(line)) {
                  const text = line.replace(/^(\*\*|##)\s?/, '').replace(/(\*\*|)$|:$/g, '').trim();
                  return (
                    <div key={`msg-${messageIndex}-subheading-${idx}`} className="font-bold text-lg mt-4 mb-2 text-teal-700 border-b border-teal-200 pb-1">
                      {text}
                    </div>
                  );
                }
                // Bullet point: - or * or •
                if (isBulletPoint(line)) {
                  return (
                    <div key={`msg-${messageIndex}-bullet-${idx}`} className="pl-4 mb-2 flex items-start">
                      <span className="mr-3 text-teal-600 text-lg leading-6 select-none">•</span>
                      <span className="text-gray-800">{line.replace(/^\s*([-*•])\s+/, '')}</span>
                    </div>
                  );
                }
                // Numbered point: 1. 2. etc
                if (isNumberedPoint(line)) {
                  return (
                    <div key={`msg-${messageIndex}-numbered-${idx}`} className="pl-4 mb-2 flex items-start">
                      <span className="mr-3 text-teal-600 text-base font-semibold select-none">{line.match(/^\s*\d+\./)?.[0]}</span>
                      <span className="text-gray-800">{line.replace(/^\s*\d+\.\s*/, '')}</span>
                    </div>
                  );
                }
                // Regular paragraph
                return (
                  <p key={`msg-${messageIndex}-paragraph-${idx}`} className="mb-3 text-gray-800 leading-relaxed">{line}</p>
                );
              })}
            </div>
          );
        }
        
        // Single line: try to split into points for dot-list rendering
        const singleLine = lines[0];
        let points = [];
        
        // Split by emoji
        const emojiPointRegex = /([\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}])\s*/gu;
        let splitByEmoji = singleLine.split(emojiPointRegex).filter(Boolean).map(s => s.trim()).filter(Boolean);
        if (splitByEmoji.length > 2) {
          // Group as [text+emoji] pairs
          for (let i = 0; i < splitByEmoji.length; i += 2) {
            const text = splitByEmoji[i]?.trim();
            const emoji = splitByEmoji[i+1]?.trim();
            if (text && emoji) points.push(text + ' ' + emoji);
            else if (text) points.push(text);
          }
        } else {
          // Fallback: split by sentence
          points = singleLine.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
          // If still only one, try comma
          if (points.length === 1) {
            points = singleLine.split(/,\s+/).filter(Boolean);
          }
        }
        
        // If we have multiple points, render as dot-list
        if (points.length > 1) {
          return (
            <div className="ai-response space-y-2">
              {points.map((point, idx) => (
                <div key={`msg-${messageIndex}-point-${idx}`} className="pl-4 flex items-start">
                  <span className="mr-3 text-teal-600 text-lg leading-6 select-none">•</span>
                  <span className="text-gray-800">{point}</span>
                </div>
              ))}
            </div>
          );
        }
        
        // Single point/paragraph
        return <p className="ai-response text-gray-800 leading-relaxed">{singleLine}</p>;
      };
      const emergency = detectEmergency(msg.message);
      return (
        <div key={`message-${msg.id}-${messageIndex}`}>
          <div className="space-y-4">
            {emergency && (
              <EmergencyBanner category={emergency.category} severity={emergency.severity} />
            )}
            <div className="flex justify-end items-start space-x-2 max-w-[80%] ml-auto">
              <div className="relative group flex flex-col items-end gap-2">
                {msg.file && (
                  <ChatFileCard file={msg.file} />
                )}
                <div className="bg-zinc-900 rounded-xl p-4 text-white text-sm leading-relaxed border border-zinc-700">
                  {isValidImageUrl(msg.image) ? (
                    <div className="mb-2">
                      <Image
                        src={msg.image || ""}
                        alt="Uploaded file"
                        width={200}
                        height={200}
                        className="rounded-lg object-contain"
                        onError={(e) => console.error(`File failed to load: ${msg.image}`)}
                      />
                    </div>
                  ) : msg.image !== null ? (
                    <p className="text-xs text-red-400 mb-2">Invalid or missing file</p>
                  ) : null}
                 {editingMessageId === msg.id ? (
  <div className="flex flex-col w-full items-center">
    <div className="w-full flex justify-center">
      <div className="relative" style={{ width: '600px', maxWidth: '100%' }}>
        <textarea
          value={editedMessage}
          onChange={(e) => {
            const lines = e.target.value
              .split("\n")
              .map(line =>
                line.length > 60
                  ? line.match(/.{1,60}/g)?.join("\n")
                  : line
              );
            setEditedMessage(lines.join("\n"));

            // Auto-expand height
            const ta = e.target as HTMLTextAreaElement;
            ta.style.height = 'auto';
            ta.style.height = Math.min(ta.scrollHeight, 300) + 'px';
          }}
          onKeyDown={handleKeyPress}
          maxLength={500}
          rows={1}
          className="chatgpt-textarea pr-28" /* add padding-right for buttons */
          aria-label="Edit message"
          placeholder="Edit your message..."
          autoFocus
        />

        {/* Buttons inside the same box */}
        <div className="absolute bottom-2 right-2 flex gap-2">
          <button
            onClick={() => {
              setEditingMessageId(null);
              setEditedMessage("");
            }}
            className="rounded-xl px-5 py-2 font-semibold bg-black text-white transition-all duration-200 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black/40 focus:ring-offset-2 shadow-sm border border-black/80"
            style={{ minWidth: 60, borderRadius: 16, fontSize: 15, letterSpacing: 0.5 }}
          >
            Cancel
          </button>
          <button
            onClick={() => handleEditMessage(msg.id, msg.message)}
            disabled={
              loading ||
              editedMessage.trim() === msg.message.trim() ||
              !editedMessage.trim()
            }
            className="rounded-xl px-5 py-2 font-semibold bg-white text-black transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/40 focus:ring-offset-2 shadow-sm border border-black/80 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ minWidth: 80, borderRadius: 16, fontSize: 15, letterSpacing: 0.5 }}
          >
            Send
          </button>
        </div>
      </div>
    </div>

    <style jsx>{`
      .chatgpt-textarea {
        resize: none;
        min-height: 44px;
        max-height: 300px;
        width: 100%;
        font-family: inherit;
        font-size: 1rem;
        line-height: 1.5;
        padding: 12px 16px;
        background-color: var(--input-bg);
        color: var(--input-text);
        border: 1px solid var(--input-border);
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        outline: none;
        transition: border 0.2s, box-shadow 0.2s;
        overflow-y: auto;
        scrollbar-width: none;
      }
      .chatgpt-textarea:focus {
        border-color: #4f9cff;
        box-shadow: 0 0 0 2px rgba(79,156,255,0.2);
      }
      .chatgpt-textarea::-webkit-scrollbar {
        display: none;
      }
      :root {
        --input-bg: #ffffff;
        --input-text: #000000;
        --input-border: #d1d5db;
      }
      .dark {
        --input-bg: #40414f;
        --input-text: #ececec;
        --input-border: #565869;
      }
      .cancel-btn {
        padding: 4px 10px;
        border-radius: 6px;
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        color: #374151;
        font-size: 0.75rem;
        transition: background 0.2s;
      }
      .cancel-btn:hover {
        background: #e5e7eb;
      }
      .send-btn {
        padding: 4px 10px;
        border-radius: 6px;
        background: #4f9cff;
        border: none;
        color: #fff;
        font-size: 0.75rem;
        transition: background 0.2s;
      }
      .send-btn:hover {
        background: #3f89e6;
      }
      .send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `}</style>
  </div>
) : (
  // Suppress the "File uploaded" placeholder when a file card is already shown above
  (msg.file && msg.message === "File uploaded") ? null : <p>{msg.message}</p>
)}

                </div>
                <div className="absolute -bottom-6 right-4 flex space-x-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyText(msg.message, `user-${msg.id}`)}
                    className="text-gray-500 hover:text-gray-700 h-6 w-6 rounded-full transition-colors duration-200"
                    title="Copy Message"
                  >
                    {copiedMessageIds.has(`user-${msg.id}`) ? (
                      <Check className="h-4 w-4 text-black" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditMessage(msg.id, msg.message)}
                    className="text-gray-500 hover:text-teal-500 h-6 w-6 rounded-full transition-colors duration-200"
                    title="Edit Message"
                  >
                    <span className="relative h-4 w-4 inline-block">
                      <img src="/pencil.png" alt="Edit" className="h-4 w-4 block" />
                      <img src="/pencildark.png" alt="Edit" className="h-4 w-4 hidden" />
                    </span>
                  </Button>
                </div>
              </div>
              <Avatar className="w-8 h-8 mt-1 flex-shrink-0">
                <AvatarImage src={userProfile?.photoURL || user?.photoURL || ""} />
                <AvatarFallback className="bg-teal-600 text-white text-sm">
                  {userProfile?.displayName?.charAt(0).toUpperCase() ||
                    user?.displayName?.charAt(0).toUpperCase() ||
                    user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            {msg.response ? (
            <div className="flex items-start space-x-2" style={{ maxWidth: '100%' }}>
                <div className="relative group">
                  <div className="rounded-xl p-4 text-sm leading-relaxed space-y-4 ai-response">
                    {isLabReportResponse(msg.response) ? (
                      <LabReportRenderer response={msg.response} />
                    ) : (
                      <TextType
                        text={msg.response}
                        renderAsMarkdown={true}
                        className="text-sm leading-relaxed ai-response"
                      />
                    )}
                    <SourceLinks response={msg.response} />
                    <MedicalDisclaimer />
                  </div>
                  <div className="absolute -bottom-6 left-4 flex space-x-2 justify-start opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyText(msg.response, `ai-${msg.id}`)}
                      className="text-gray-500 hover:text-gray-700 h-6 w-6 rounded-full transition-colors duration-200"
                      title="Copy Response"
                    >
                      {copiedMessageIds.has(`ai-${msg.id}`) ? (
                        <Check className="h-4 w-4 text-black" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSpeakResponse(msg.response)}
                        className={`text-gray-500 hover:text-gray-700 h-6 w-6 rounded-full transition-colors duration-200 ${isSpeaking ? "animate-pulse bg-gray-500/20" : ""} ${userProfile?.plan === 'base' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={userProfile?.plan === 'base' ? "Speech-to-Speech (PRO Feature)" : (isSpeaking ? "Stop Speaking" : "Speak Response")}
                        disabled={userProfile?.plan === 'base'}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      {userProfile?.plan === 'base' && (
                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-400 text-white text-[6px] px-1 py-0.5 rounded font-bold">
                          PRO
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFeedback(msg.id, true)}
                      className="text-gray-500 hover:text-green-500 h-6 w-6 rounded-full transition-colors duration-200"
                      title="Thumbs Up"
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFeedback(msg.id, false)}
                      className="text-gray-500 hover:text-red-500 h-6 w-6 rounded-full transition-colors duration-200"
                      title="Thumbs Down"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRetryResponse(msg.id, msg.message)}
                      className="text-gray-500 hover:text-teal-500 h-6 w-6 rounded-full transition-colors duration-200"
                      title="Generate Improved Response ✨"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(msg.message)}`, "_blank")}
                      className="text-gray-500 hover:text-teal-500 h-6 w-6 rounded-full transition-colors duration-200"
                      title="Search PubMed"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              loading && (
                <div className="flex items-start space-x-2 w-full">
                  <div className="p-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      );
    });
  }, [user, currentSession, editingMessageId, editedMessage, isSpeaking, loading, copiedMessageIds]);

  return (
    <AuthGuard>
      <div className="min-h-screen flex h-screen overflow-hidden bg-gray-50">
        <style jsx global>{`
          textarea {
            max-height: 120px;
            overflow-y: auto;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .scroll-button-enter { animation: fadeIn 0.3s ease-out; }
          .scroll-button-pulse { animation: pulse 2s infinite; }
          
          /* Enhanced paragraph spacing for AI responses */
          .ai-response p {
            margin-bottom: 1rem;
            line-height: 1.7;
          }
          .ai-response p:last-child {
            margin-bottom: 0;
          }
          .ai-response .space-y-4 > * + * {
            margin-top: 1rem;
          }
          .ai-response .space-y-5 > * + * {
            margin-top: 1.25rem;
          }
          .ai-response .space-y-6 > * + * {
            margin-top: 1.5rem;
          }
          
          .cancel-btn, .send-btn {
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
            padding: 0.25rem 0.75rem;
            min-width: 56px;
            letter-spacing: 0.2px;
            transition: all 0.2s;
          }
          .cancel-btn {
            background: #000;
            color: #fff;
            border: 1.5px solid #000;
          }
          .cancel-btn:hover, .cancel-btn:focus {
            background: #222;
          }
          .send-btn {
            background: #fff;
            color: #000;
            border: 1.5px solid #000;
          }
          .send-btn:hover, .send-btn:focus {
            background: #f3f3f3;
          }
          .send-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}</style>
        {/* Sidebar is hidden entirely in incognito mode (Claude-style) */}
        {!isIncognito && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
       <div className="flex-1 flex flex-col overflow-hidden">
  {/* Transparent header, plan selector inline after Medibot name on all screens */}
  <div className="sticky top-0 z-20 flex flex-row items-center justify-between p-2 sm:p-3 md:p-4 border-b border-gray-200/80 bg-transparent shadow-none w-full min-h-[44px] sm:min-h-[56px] md:min-h-[64px]">
    {/* Left: Brand/Sidebar + Plan Selector */}
    {/* Note: the sidebar toggle (hamburger) is rendered by the Sidebar component itself
        as a fixed button on mobile/tablet. We add left padding here so the plan selector
        clears that floating button instead of overlapping it. */}
    <div className="flex flex-row items-center gap-1 min-w-[100px] w-auto flex-shrink-0 pl-14 lg:pl-0">
      {/* Brand Name with responsive font size */}
      {/* Plan Selector: visible on left for all screens */}
      <div className="ml-1">
        <Select
          value={selectedPlan}
          onValueChange={(value) => {
            if (value === "premium") {
              window.location.href = '/pricing';
              return;
            }
            setSelectedPlan(value);
          }}
        >
          <SelectTrigger className="group h-7 sm:h-8 md:h-9 text-xs sm:text-sm font-semibold text-gray-800 rounded-full px-2 sm:px-3 md:px-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 shadow-sm hover:shadow-md hover:scale-105 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all duration-200 w-auto min-w-[80px] sm:min-w-[100px] md:min-w-[120px]">
            <div className="flex items-center space-x-1 sm:space-x-2">
              {selectedPlan === "premium" ? (
                <>
                  <Crown className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-yellow-500 animate-pulse" />
                  <span className="text-xs sm:text-sm font-bold bg-gradient-to-r from-yellow-600 to-orange-500 bg-clip-text text-transparent">Premium</span>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Crown className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
                    <div className="absolute -top-0.5 -right-0.5 w-1 sm:w-1.5 md:w-2 h-1 sm:h-1.5 md:h-2 bg-teal-500 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold group-hover:text-teal-600 transition-colors duration-200">Medibot</span>
                </>
              )}
              <ChevronDown className="h-2 w-2 sm:h-3 sm:w-3 md:h-3 md:w-3 text-gray-500 group-hover:text-gray-700 transition-all duration-200 group-data-[state=open]:rotate-180" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white/95 backdrop-blur-lg text-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 p-2 space-y-2 min-w-[260px] animate-in fade-in-0 zoom-in-95 duration-200">
            <SelectItem value="premium" className="group flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-yellow-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 group-hover:scale-110 transition-transform duration-200" />
                  <div className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900 group-hover:text-yellow-700 transition-colors duration-200">
                    Premium Plan
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                    <span className="text-xs font-semibold text-yellow-600">₹99/month</span>
                    <div className="px-1.5 sm:px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-[9px] sm:text-[10px] font-bold rounded-full">
                      UPGRADE
                    </div>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 sm:mt-1 leading-tight">
                    • Unlimited conversations<br/>
                    • Priority support<br/>
                    • Advanced AI models
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 sm:gap-1">
                {selectedPlan === "premium" && <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />}
                <div className="text-[9px] sm:text-[10px] text-gray-400">Tap to upgrade</div>
              </div>
            </SelectItem>
            <SelectItem value="base" className="group flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gradient-to-r hover:from-teal-50 hover:to-teal-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-teal-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500 group-hover:scale-110 transition-transform duration-200" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900 group-hover:text-teal-700 transition-colors duration-200">Base Plan</span>
                  <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                    <span className="text-xs font-semibold text-green-600">Free forever</span>
                    <div className="px-1.5 sm:px-2 py-0.5 bg-gradient-to-r from-green-400 to-teal-400 text-white text-[9px] sm:text-[10px] font-bold rounded-full">
                      ACTIVE
                    </div>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 sm:mt-1 leading-tight">
                    • Basic conversations<br/>
                    • Standard AI models<br/>
                    • Community support
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 sm:gap-1">
                {selectedPlan === "base" && <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />}
                <div className="text-[9px] sm:text-[10px] text-gray-400">Current plan</div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    {/* Right: Icons/User Actions */}
    <div className="flex flex-row items-center gap-1 sm:gap-2 min-w-[120px] justify-end w-auto flex-shrink-0">
      {user ? (
        <>
          {isIncognito ? (
            <Button
              onClick={exitIncognito}
              variant="ghost"
              size="sm"
              className="group relative bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-7 sm:h-8 md:h-9 px-2 sm:px-3 transition-all duration-300 flex items-center gap-1.5"
              title="Exit incognito — this conversation will be discarded"
            >
              <Ghost className="h-4 w-4" />
              <span className="text-xs font-semibold hidden sm:inline">Exit Incognito</span>
            </Button>
          ) : (
            <Button
              onClick={enterIncognito}
              variant="ghost"
              size="icon"
              className="group relative bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 transition-all duration-300 hover:scale-110 border border-gray-200/50"
              title="Incognito chat — not saved, no memory"
            >
              <Ghost className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 group-hover:scale-125 transition-transform duration-300" />
            </Button>
          )}

          <Button
            onClick={startNewChat}
            variant="ghost"
            size="icon"
            className="group relative bg-gradient-to-br from-teal-500/10 via-teal-600/15 to-teal-700/10 hover:from-teal-500/20 hover:via-teal-600/25 hover:to-teal-700/20 text-teal-600 rounded-xl h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 transition-all duration-300 hover:scale-110 hover:rotate-12 hover:shadow-lg hover:shadow-teal-500/20 border border-teal-200/30"
            title="Start New Chat"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 group-hover:scale-125 transition-transform duration-300" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-400/0 via-teal-500/0 to-teal-600/0 group-hover:from-teal-400/10 group-hover:via-teal-500/5 group-hover:to-teal-600/10 transition-all duration-300"></div>
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-teal-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
          </Button>

          <Button 
            onClick={handlePrescriptionAnalysis} 
            variant="ghost" 
            size="icon" 
            className={`group relative bg-gradient-to-br from-teal-500/10 via-blue-600/15 to-cyan-500/10 hover:from-teal-500/20 hover:via-blue-600/25 hover:to-cyan-500/20 text-teal-600 rounded-xl h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 transition-all duration-300 hover:scale-110 hover:-rotate-6 hover:shadow-lg hover:shadow-blue-500/20 border border-teal-200/30 ${userProfile?.plan === 'base' ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={userProfile?.plan === 'base' ? "Prescription Analysis (PRO Feature)" : "Analyze Prescription"}
            disabled={userProfile?.plan === 'base'}
          >
            <Camera className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 group-hover:scale-125 transition-transform duration-300" />
            {userProfile?.plan === 'base' && (
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-400 text-white text-[6px] px-1 py-0.5 rounded font-bold">
                PRO
              </div>
            )}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-400/0 via-blue-500/0 to-cyan-500/0 group-hover:from-teal-400/10 group-hover:via-blue-500/5 group-hover:to-cyan-500/10 transition-all duration-300"></div>
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-teal-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300"></div>
          </Button>
          
          <Button 
            onClick={handleHistoryDialog} 
            variant="ghost" 
            size="icon" 
            className="group relative bg-gradient-to-br from-green-500/10 via-emerald-600/15 to-teal-500/10 hover:from-green-500/20 hover:via-emerald-600/25 hover:to-teal-500/20 text-green-600 rounded-xl h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 transition-all duration-300 hover:scale-110 hover:rotate-180 hover:shadow-lg hover:shadow-green-500/20 border border-green-200/30"
            title="View Chat History"
          >
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-400/0 via-emerald-500/0 to-teal-500/0 group-hover:from-green-400/10 group-hover:via-emerald-500/5 group-hover:to-teal-500/10 transition-all duration-300"></div>
            <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-opacity duration-300"></div>
          </Button>
          
          <Button 
            onClick={exportChat} 
            variant="ghost" 
            size="icon" 
            className="group relative bg-gradient-to-br from-orange-500/10 via-amber-600/15 to-yellow-500/10 hover:from-orange-500/20 hover:via-amber-600/25 hover:to-yellow-500/20 text-orange-600 rounded-xl h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/20 border border-orange-200/30"
            title="Export Chat"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 group-hover:scale-125 group-hover:translate-y-0.5 transition-transform duration-300" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-400/0 via-amber-500/0 to-yellow-500/0 group-hover:from-orange-400/10 group-hover:via-amber-500/5 group-hover:to-yellow-500/10 transition-all duration-300"></div>
            <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300"></div>
          </Button>
        </>
      ) : (
        <>
          <Link href="/auth/signin">
            <Button variant="outline" className="bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100/50 h-7 px-2 sm:h-8 sm:px-3 md:h-9 md:px-4 w-full sm:w-auto rounded-full text-xs">
              Login
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-700 hover:to-teal-600 h-7 px-2 sm:h-8 sm:px-3 md:h-9 md:px-4 w-full sm:w-auto rounded-full shadow-sm text-xs">
              Get Started
            </Button>
          </Link>
        </>
      )}
    </div>
  </div>

  {isIncognito && (
    <div className="flex items-center justify-center gap-2 bg-gray-900 text-gray-100 text-xs sm:text-sm py-2 px-4">
      <Ghost className="h-4 w-4" />
      <span>Incognito chat — not saved, no memory of you, and discarded when you exit.</span>
    </div>
  )}
  <div className="relative flex-1 overflow-hidden">
    <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
      <div className="max-w-4xl mx-auto space-y-4 px-4">
        {!user ? (
          <div className="min-h-full flex items-center justify-center px-2 sm:px-0">
            <div className="w-full max-w-md text-center space-y-8 mx-auto flex flex-col items-center justify-center">
              <div className="flex flex-col items-center space-y-6">
                <div className="w-20 h-20 relative">
                  <Image src="/logo.png" alt="Medibot Logo" width={80} height={80} className="rounded-full" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Welcome to Medibot</h1>
                  <p className="text-gray-500 text-sm">Please log in or sign up to start chatting.</p>
                </div>
              </div>
              <div className="space-y-4 w-full">
                <Link href="/auth/signin">
                  <Button
                    variant="outline"
                    className="w-full h-12 text-gray-500 hover:text-gray-700"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button
                    variant="outline"
                    className="w-full h-12 text-gray-500 hover:text-gray-700"
                  >
                    Signup
                  </Button>
                </Link>
              </div>
              <div className="mt-8 w-full">
                <div className="text-lg font-semibold text-gray-800 mb-2">Start a conversation below or try these suggestions:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                  <Button className="w-full flex items-center justify-center gap-2 bg-teal-50 text-teal-700 font-medium rounded-xl py-3 px-2 text-sm hover:bg-teal-100 transition-all">
                    🌡️ What are the symptoms of flu?
                  </Button>
                  <Button className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 font-medium rounded-xl py-3 px-2 text-sm hover:bg-green-100 transition-all">
                    💊 How to manage high blood pressure?
                  </Button>
                  <Button className="w-full flex items-center justify-center gap-2 bg-teal-50 text-teal-700 font-medium rounded-xl py-3 px-2 text-sm hover:bg-teal-100 transition-all">
                    🏃‍♀️ Best exercises for heart health
                  </Button>
                  <Button className="w-full flex items-center justify-center gap-2 bg-yellow-50 text-yellow-700 font-medium rounded-xl py-3 px-2 text-sm hover:bg-yellow-100 transition-all">
                    🥗 Nutrition tips for diabetes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (!currentSession || currentSession.messages.length === 0) ? (
          <div className="flex flex-1 flex-col min-h-[70vh]">
            {/* Welcome Header */}
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="w-full max-w-2xl mx-auto text-center space-y-8 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center space-y-6">
                  {/* Logo with enhanced styling */}
                  <div className="relative">
                    <div className="w-24 h-24 relative">
                      <Image src="/logo.png" alt="Medibot Logo" width={96} height={96} className="rounded-full shadow-lg" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Welcome text */}
                  <div className="space-y-3">
                    <h1 className="text-5xl font-extrabold tracking-wide bg-gradient-to-r from-teal-700 via-indigo-600 to-teal-500 bg-clip-text text-transparent drop-shadow-sm">
  Welcome to Medibot
</h1>

                    <p className="text-gray-600 text-lg max-w-md mx-auto">
                      Your AI-powered health companion ready to answer medical questions and provide health guidance.
                    </p>
                   
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          renderMessages
        )}
      </div>
      <div ref={messagesEndRef} />
    </ScrollArea>
    
    {/* 🔥 ENHANCED SCROLL-TO-LATEST BUTTON */}
    {showScrollButton && (
      <button
        onClick={() => scrollToBottom('smooth')}
        className="fixed bottom-24 right-6 bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 scroll-button-enter scroll-button-pulse border border-teal-400/30"
        aria-label="Scroll to latest message"
        style={{
          transform: showScrollButton ? 'translateY(0)' : 'translateY(100px)',
          opacity: showScrollButton ? 1 : 0,
        }}
      >
        <div className="flex items-center justify-center">
          <ChevronDown className="h-5 w-5" />
          {hasNewMessages && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-3 w-3 flex items-center justify-center">
              <div className="h-1.5 w-1.5 bg-white rounded-full animate-ping"></div>
            </div>
          )}
        </div>
      </button>
    )}
  </div>
  
  {user && (
    <div className="sticky bottom-0 z-10 w-full bg-gray-50 px-5 pt-4">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-2 rounded-3xl bg-white p-4 shadow-lg focus-within:ring-2 focus-within:ring-teal-400 focus-within:ring-offset-2 focus-within:ring-offset-white transition-all duration-300 relative">
          
          {/* Full-width Lottie background when recording */}
          {isRecording && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
              <Lottie
                animationData={audioWave}
                loop
                autoPlay
                style={{
                  width: "100%",
                  height: "100%",
                  opacity: 0.3, // Make semi-transparent for readability
                }}
              />
            </div>
          )}

          <div className="relative z-20">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (textareaRef.current) {
                  textareaRef.current.style.height = "auto";
                  textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                }
              }}
              onKeyDown={handleKeyPress}
              placeholder={
                isRecording ? "Listening..." : "Ask a health question or upload a file..."
              }
              className="w-full resize-none bg-transparent text-sm placeholder-gray-500 outline-none"
              rows={1}
              maxLength={1000}
              disabled={loading}
              aria-label="Message input"
            />
          </div>

          <div className="flex justify-between items-center pt-2 z-20">
            <div className="flex items-center gap-2">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="h-8 text-sm bg-transparent border-none shadow-none focus:ring-0 focus:outline-none">
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent className="bg-white text-sm border-gray-200 min-w-[260px]">
                  <SelectItem value="medibot-care" className="pl-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-teal-500">●</span>
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-gray-900">Medibot Care</span>
                        <span className="text-[11px] text-gray-500">Fast, friendly health guidance</span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="medibot-specialist"
                    className="pl-3 py-2"
                    disabled={selectedPlan !== 'premium'}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500">●</span>
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-900">Medibot Specialist</span>
                          {selectedPlan !== 'premium' && (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">PRO</span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500">Deeper analysis &amp; complex reasoning</span>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleFileUpload}
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-gray-500 hover:text-gray-700"
                title="Upload File"
              >
                <Plus className="h-5 w-5" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {/* Voice input button */}
              <VoiceInputButton
                onResult={(text) => {
                  // Check premium access for voice input
                  if (userProfile?.plan === 'base') {
                    toast.error("Voice input is a premium feature. Redirecting to upgrade page...");
                    setTimeout(() => {
                      router.push('/pricing');
                    }, 1500);
                    return;
                  }
                  setMessage(text);
                  setTimeout(() => handleSendMessage(), 100);
                }}
                disabled={loading || userProfile?.plan === 'base'}
                onStartRecording={() => setIsRecording(true)}
                onStopRecording={() => setIsRecording(false)}
                isPremiumFeature={userProfile?.plan === 'base'}
              />
            </div>

            <button
              onClick={loading ? handleStopGeneration : handleSendMessage}
              disabled={!loading && (!message.trim() && !selectedFile)}
              data-testid={loading ? "stop-button" : "send-button"}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1.5 h-fit border"
              aria-label={loading ? "Stop Generation" : "Send Message"}
            >
              {loading ? (
                <StopCircle
                  width="14"
                  height="14"
                  style={{ color: "currentcolor" }}
                />
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{ color: "currentcolor" }}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.70711 1.39644C8.31659 1.00592 7.68342 1.00592 7.2929 1.39644L2.21968 6.46966L1.68935 6.99999L2.75001 8.06065L3.28034 7.53032L7.25001 3.56065V14.25V15H8.75001V14.25V3.56065L12.7197 7.53032L13.25 8.06065L14.3107 6.99999L13.7803 6.46966L8.70711 1.39644Z"
                  />
                </svg>
              )}
            </button>
          </div>

          {fileName && (
            <div className="flex items-center gap-2 pt-1 z-20">
              <Badge className="bg-gray-100 text-sm truncate max-w-[300px]">
                {fileName}
              </Badge>
              <Button
                onClick={removeFile}
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-red-500 hover:text-red-600"
                title="Remove File"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <p className="mt-1 text-center text-sm text-gray-500 font-sans">
        Medibot can make mistakes. Check important info.
      </p>
    </div>
  )}

  {/* Additional dialogs and components */}
  {user && (
    <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
      <DialogContent className="bg-white max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-lg">
            <Camera className="h-5 w-5 text-gray-500" />
            <span>Prescription Analysis</span>
          </DialogTitle>
          <DialogDescription>
            Upload a photo or PDF of your prescription to analyze its contents.
          </DialogDescription>
        </DialogHeader>
        {!analysisResult ? (
          <div className="space-y-4">
            <p className="text-gray-500 text-sm">
              Upload a file for AI-powered analysis and information.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              {analyzingPrescription ? (
                <div className="space-y-4">
                  <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-500 text-sm">Analyzing file...</p>
                </div>
              ) : (
                <>
                  <Camera className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm mb-4">Upload prescription file</p>
                  <Button
                    onClick={handleFileUpload}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-sm"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAnalyzingPrescription(true);
                  analyzePrescription(file)
                    .then((analysis) => {
                      setAnalysisResult({
                        ...analysis,
                        userId: user.uid,
                        fileName: file.name,
                        createdAt: new Date(),
                      });
                      toast.success("Prescription analyzed successfully!");
                    })
                    .catch((error: any) => {
                      console.error("Error analyzing prescription:", error);
                      toast.error("Failed to analyze prescription");
                    })
                    .finally(() => {
                      setAnalyzingPrescription(false);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    });
                }
              }}
              className="hidden"
            />
            <p className="text-xs text-gray-500">
              Supported formats: JPG, PNG, HEIC, PDF. For informational purposes only.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span>Analysis Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-gray-900">Detected Medications</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.medications.map((med, index) => (
                        <Badge key={index} className="bg-teal-600 text-white text-sm">
                          <Pill className="mr-2 h-3 w-3" />
                          {med}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-gray-900">Dosage Information</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.dosages.map((dosage, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {dosage}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-gray-900">Instructions</h4>
                  <p className="text-gray-500 text-sm bg-gray-100 p-3 rounded-lg">
                    {analysisResult.instructions}
                  </p>
                </div>
                {analysisResult.warnings?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-gray-900 flex items-center">
                      <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
                      <span>Warnings & Precautions</span>
                    </h4>
                    <div className="space-y-2">
                      {analysisResult.warnings.map((warning, index) => (
                        <div key={index} className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                          <p className="text-yellow-700 text-sm">{warning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-teal-50 border border-teal-200 p-3 rounded-lg">
                  <p className="text-teal-700 text-sm">
                    <strong>Important:</strong> This analysis is for informational purposes only. Always follow your doctor's instructions and consult your pharmacist.
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                onClick={() => {
                  setAnalysisResult(null);
                  setPrescriptionDialogOpen(false);
                }}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => setAnalysisResult(null)}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              >
                Analyze Another
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )}
  
  {user && (
    <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
    <DialogContent className="bg-white w-[520px] max-w-full mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-lg">
            <RotateCcw className="h-5 w-5 text-gray-500" />
            <span>Recent Chats</span>
          </DialogTitle>
          <DialogDescription>
            View your recent chat sessions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto max-h-96">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 rounded-xl border border-gray-200 cursor-pointer transition-colors ${
                  currentSession?.id === session.id
                    ? "bg-teal-600/20 border-teal-600"
                    : "bg-gray-100 hover:bg-teal-600/10"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex-1"
                    onClick={() => {
                      setCurrentSession(normalizeSession(session));
                      if (session.id) {
                        setLastSessionId(session.id);
                        // Update URL with session id
                        router.replace(`/chat?session=${session.id}`);
                      }
                      setHistoryDialogOpen(false);
                    }}
                  > 
                    <h3 className="font-semibold text-sm text-gray-800 truncate">{session.title}</h3>
                    <p className="text-gray-500 text-xs font-mono select-all break-all mt-1">
                      ID: {session.id}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {session.messages.length} messages • {formatISTDateTime(session.updatedAt)}
                    </p>
                    {session.messages.length > 0 && (
                      <p className="text-gray-500 text-sm mt-1 truncate">
                        {session.messages[session.messages.length - 1]?.message || "No messages"}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      try {
                        if (session.id) {
                          await deleteChatSession(session.id);
                          setSessions((prev) => prev.filter((s) => s.id !== session.id));
                          if (currentSession?.id === session.id) {
                            setCurrentSession(null);
                            localStorage.removeItem(`lastSessionId_${user.uid}`);
                          }
                          toast.success("Chat session deleted!");
                        } else {
                          console.error("Session ID is undefined or null.");
                          toast.error("Failed to delete chat session: Invalid session ID");
                        }
                      } catch (error: any) {
                        console.error("Error deleting session:", error);
                        toast.error(`Failed to delete chat session: ${error.message || "Unknown error"}`);
                      }
                    }}
                    className="text-red-500 hover:text-red-600 h-8 w-8"
                    title="Delete Session"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center">
              No chat sessions found.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )}

  {/* Language upgrade gate modal */}
  {languageGate && (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={() => setLanguageGate(null)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-5 text-white">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-300" />
            <h2 className="text-lg font-bold">Unlock {languageGate.native || languageGate.name}</h2>
          </div>
          <p className="text-sm text-white/90 mt-1">
            {languageGate.native ? `${languageGate.native} (${languageGate.name})` : languageGate.name} is a Medibot Premium language.
          </p>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-700 leading-relaxed">
            Your free plan includes <span className="font-semibold">8 languages</span> — English, Hindi, Bengali, Tamil, Telugu, Gujarati, Kannada and Malayalam.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mt-3">
            Upgrade to <span className="font-semibold text-teal-700">Medibot Premium (₹99/month)</span> to chat in {languageGate.name} and 25+ more languages, plus voice in your native language.
          </p>
          <div className="mt-5 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setLanguageGate(null)}
            >
              Maybe later
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white"
              onClick={() => { setLanguageGate(null); router.push("/pricing"); }}
            >
              <Crown className="h-4 w-4 mr-1.5" />
              Upgrade
            </Button>
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-3">
            You can keep chatting for free in any of your 8 included languages.
          </p>
        </div>
      </div>
    </div>
  )}

  {/* Usage limit upgrade modal */}
  {usageGate && (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={() => setUsageGate(null)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-5 text-white">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-300" />
            <h2 className="text-lg font-bold">
              You've used your free {usageGate === "image" ? "photo" : "report"} analyses
            </h2>
          </div>
          <p className="text-sm text-white/90 mt-1">
            Free plan includes {FREE_MONTHLY_LIMITS[usageGate]} {usageGate === "image" ? "symptom photo" : "lab report"} analyses per month.
          </p>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-700 leading-relaxed">
            You've reached your monthly limit of <span className="font-semibold">{FREE_MONTHLY_LIMITS[usageGate]} free {usageGate === "image" ? "photo" : "report"} analyses</span>. Your quota resets at the start of next month.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mt-3">
            Upgrade to <span className="font-semibold text-teal-700">Medibot Premium (₹99/month)</span> for <span className="font-semibold">unlimited</span> report and photo analysis, trend charts, and your doctor-visit PDF.
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setUsageGate(null)}>
              Maybe later
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white"
              onClick={() => { setUsageGate(null); router.push("/pricing"); }}
            >
              <Crown className="h-4 w-4 mr-1.5" />
              Upgrade
            </Button>
          </div>
        </div>
      </div>
    </div>
  )}
</div>
      </div>
    </AuthGuard>
  );
}

export default function Chat() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthGuard>
        <ChatContent />
      </AuthGuard>
    </Suspense>
  );
}
