"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MagneticButton from "../ui/MagneticButton";

/* ───────────────────────────────────────────
   Types
   ─────────────────────────────────────────── */
type StepType = "task" | "decision" | "document" | "summary";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  avatar: string;
}

interface StepData {
  message: ChatMessage;
  response: { type: StepType; title: string; content: string; badge: string };
}

interface WorkspaceEntry {
  id: string;
  type: StepType;
  title: string;
}

/* ───────────────────────────────────────────
   Conversation data — 4 unique sets that loop
   ─────────────────────────────────────────── */
const CONVERSATION_SETS: StepData[][] = [
  [
    {
      message: { id: "m1", sender: "Rahul", text: "Rahul, deploy backend before Friday.", avatar: "#4A90D9" },
      response: { type: "task", title: "Deploy backend", content: "Production deployment of backend services", badge: "High Priority" },
    },
    {
      message: { id: "m2", sender: "Priya", text: "We decided to migrate to Supabase.", avatar: "#34B876" },
      response: { type: "decision", title: "Supabase Migration", content: "Migrate from current DB to Supabase", badge: "Team Decision" },
    },
    {
      message: { id: "m3", sender: "Alex", text: "Can someone summarize today\u2019s meeting?", avatar: "#FF8A47" },
      response: { type: "summary", title: "Daily Standup Recap", content: "Key decisions, blockers, and action items from standup", badge: "Auto-Saved" },
    },
    {
      message: { id: "m4", sender: "Kim", text: "Our API architecture is finalized.", avatar: "#7C5CFC" },
      response: { type: "document", title: "API Architecture v2", content: "Finalized endpoint structure and data flow", badge: "Saved to Docs" },
    },
  ],
  [
    {
      message: { id: "m5", sender: "Rahul", text: "Add login page to auth module.", avatar: "#4A90D9" },
      response: { type: "task", title: "Login page UI", content: "Implement authentication login page", badge: "Sprint Task" },
    },
    {
      message: { id: "m6", sender: "Priya", text: "We'll use PostGIS for location data.", avatar: "#34B876" },
      response: { type: "decision", title: "PostGIS Integration", content: "Use PostGIS for geospatial queries", badge: "Architecture Decision" },
    },
    {
      message: { id: "m7", sender: "Alex", text: "TL;DR of the design review?", avatar: "#FF8A47" },
      response: { type: "summary", title: "Design Review Notes", content: "Feedback on new component library proposal", badge: "Team Summary" },
    },
    {
      message: { id: "m8", sender: "Kim", text: "API contracts are approved.", avatar: "#7C5CFC" },
      response: { type: "document", title: "API Contracts v1", content: "Approved request/response schemas for all endpoints", badge: "Finalized" },
    },
  ],
  [
    {
      message: { id: "m9", sender: "Rahul", text: "Fix the payment gateway timeout.", avatar: "#4A90D9" },
      response: { type: "task", title: "Payment timeout fix", content: "Increase gateway timeout and add retry logic", badge: "Bug Fix" },
    },
    {
      message: { id: "m10", sender: "Priya", text: "We're going with Tailwind for the new dashboard.", avatar: "#34B876" },
      response: { type: "decision", title: "Dashboard Tech Stack", content: "Use Tailwind + Radix UI for admin panel", badge: "Tech Decision" },
    },
    {
      message: { id: "m11", sender: "Alex", text: "What did we decide about caching?", avatar: "#FF8A47" },
      response: { type: "summary", title: "Caching Strategy", content: "Redis with CDN invalidation for static assets", badge: "Architecture Summary" },
    },
    {
      message: { id: "m12", sender: "Kim", text: "Monitoring runbook is complete.", avatar: "#7C5CFC" },
      response: { type: "document", title: "Monitoring Runbook", content: "Step-by-step incident response and alert handling", badge: "Operations" },
    },
  ],
];

const SENDER_COLORS: Record<string, string> = {
  Rahul: "#4A90D9",
  Priya: "#34B876",
  Alex: "#FF8A47",
  Kim: "#7C5CFC",
};

function pickConversationSet(previousIndex: number): { steps: StepData[]; index: number } {
  let idx: number;
  do {
    idx = Math.floor(Math.random() * CONVERSATION_SETS.length);
  } while (idx === previousIndex);
  return { steps: CONVERSATION_SETS[idx]!, index: idx };
}

/* ───────────────────────────────────────────
   Phase / Timing helpers
   ─────────────────────────────────────────── */
const DURATIONS = {
  INITIAL_DELAY: 500,
  SHOW_MESSAGE: 600,
  TYPING: 800,
  SHOW_CARD: 350,
  FLY_CARD: 500,
  GLOW_DURATION: 500,
} as const;

/* ───────────────────────────────────────────
   Sub-components
   ─────────────────────────────────────────── */

/** macOS-style traffic lights + URL bar */
function BrowserChrome() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#E8E6E1] bg-white/90 backdrop-blur-sm rounded-t-[16px]">
      <div className="flex items-center gap-[6px]">
        <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
        <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
        <div className="w-3 h-3 rounded-full bg-[#28C840]" />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0EEE9] text-[11px] text-ink-muted font-medium max-w-[200px]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span className="truncate">thinkroom.ai/chat/product-team</span>
        </div>
      </div>
    </div>
  );
}

/** Avatar circle with initials */
function Avatar({ name, color }: { name: string; color?: string }) {
  const bg = color || SENDER_COLORS[name] || "#7C5CFC";
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 border border-white/30"
      style={{ background: bg }}
    >
      {name[0]}
    </div>
  );
}

/** Thinking dots */
function ThinkingDots() {
  return (
    <motion.div
      className="flex items-center gap-[3px] px-4 py-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center gap-[4px] bg-white rounded-2xl px-3 py-2 border border-[#E8E6E1] shadow-sm">
        <motion.div
          className="w-[6px] h-[6px] rounded-full bg-accent-purple"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1, delay: 0 }}
        />
        <motion.div
          className="w-[6px] h-[6px] rounded-full bg-accent-purple"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
        />
        <motion.div
          className="w-[6px] h-[6px] rounded-full bg-accent-purple"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
        />
      </div>
    </motion.div>
  );
}

/** Workspace section header with glow */
function SectionHeader({ icon, label, count, glow }: { icon: string; label: string; count?: number; glow: boolean }) {
  return (
    <motion.div
      className="flex items-center justify-between mb-1"
      animate={glow ? { backgroundColor: "rgba(124, 92, 252, 0.08)" } : { backgroundColor: "rgba(124, 92, 252, 0)" }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[10px]">{icon}</span>
        <span className="text-[10px] font-semibold text-ink-soft">{label}</span>
      </div>
      {count !== undefined && (
        <motion.span
          key={count}
          className="text-[9px] font-bold text-accent-purple bg-accent-purple/10 px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          {count}
        </motion.span>
      )}
    </motion.div>
  );
}

/** A single workspace item */
function WorkspaceItem({
  title,
  index,
  type,
}: {
  title: string;
  index: number;
  type: StepType;
}) {
  const iconMap: Record<StepType, string> = {
    task: "\u2713",
    decision: "\u25C6",
    document: "\u25A1",
    summary: "\u2191",
  };
  const colorMap: Record<StepType, string> = {
    task: "#34B876",
    decision: "#FF8A47",
    document: "#4A90D9",
    summary: "#7C5CFC",
  };
  return (
    <motion.div
      className="flex items-center gap-1.5 py-[5px] px-2 rounded-lg border border-transparent hover:border-[#E8E6E1] transition-colors"
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 22 }}
      layout
    >
      <div
        className="w-[14px] h-[14px] rounded-[4px] flex items-center justify-center text-white text-[7px] font-bold flex-shrink-0"
        style={{ background: colorMap[type] }}
      >
        {iconMap[type]}
      </div>
      <span className="text-[10px] font-medium text-ink truncate">{title}</span>
    </motion.div>
  );
}

/* ───────────────────────────────────────────
   Main Browser Demo
   ─────────────────────────────────────────── */
function BrowserDemo() {
  const browserRef = useRef<HTMLDivElement>(null);

  /* Cycle state */
  const [setIndex, setSetIndex] = useState(0);
  const [currentSteps, setCurrentSteps] = useState<StepData[]>(CONVERSATION_SETS[0]!);
  const [stepIdx, setStepIdx] = useState(0);

  /* Per-step phases */
  const [phase, setPhase] = useState<"idle" | "message" | "typing" | "card" | "fly">("idle");

  /* Accumulated state */
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [workspaceLog, setWorkspaceLog] = useState<WorkspaceEntry[]>([]);
  const [workspaceGlows, setWorkspaceGlows] = useState<Record<StepType, boolean>>({
    task: false,
    decision: false,
    document: false,
    summary: false,
  });

  /* Flying card animation */
  const [flyCard, setFlyCard] = useState<{ title: string; type: StepType } | null>(null);

  /* Decision counter */
  const decisionCount = workspaceLog.filter((e) => e.type === "decision").length;

  /* ── Unique ID counter to prevent key collisions across cycles ── */
  const idCounter = useRef(0);

  /* ── Advance one step (called after workspace commit) ── */
  const advanceStep = useCallback(() => {
    setPhase("idle");
    const next = stepIdx + 1;
    if (next >= 4) {
      const { steps: newSteps, index: newIdx } = pickConversationSet(setIndex);
      setSetIndex(newIdx);
      setCurrentSteps(newSteps);
      setStepIdx(0);
      // Clear accumulated state so new cycle starts fresh
      setChatLog([]);
      setWorkspaceLog([]);
    } else {
      setStepIdx(next);
    }
  }, [stepIdx, setIndex]);

  /* ── Run the current step's phases ── */
  const stepRef = useRef(stepIdx);
  stepRef.current = stepIdx;

  useEffect(() => {
    const step = currentSteps[stepIdx];
    if (!step) return;

    let cancelled = false;
    const D = DURATIONS;

    const t1 = setTimeout(() => {
      if (cancelled) return;
      idCounter.current += 1;
      const uniqueMsg = { ...step.message, id: `msg-${idCounter.current}` };
      setChatLog((prev) => [...prev, uniqueMsg]);
      setPhase("message");
    }, D.INITIAL_DELAY);

    const t2 = setTimeout(() => {
      if (cancelled) return;
      setPhase("typing");
    }, D.INITIAL_DELAY + D.SHOW_MESSAGE);

    const t3 = setTimeout(() => {
      if (cancelled) return;
      setPhase("card");
    }, D.INITIAL_DELAY + D.SHOW_MESSAGE + D.TYPING);

    const t4 = setTimeout(() => {
      if (cancelled) return;
      setPhase("fly");
      setFlyCard({ title: step.response.title, type: step.response.type });

      const flyEnd = setTimeout(() => {
        if (cancelled) return;
        idCounter.current += 1;
        const entry: WorkspaceEntry = {
          id: `${step.response.type}-${idCounter.current}`,
          type: step.response.type,
          title: step.response.title,
        };
        setWorkspaceLog((prev) => [...prev, entry]);
        setWorkspaceGlows((prev) => ({ ...prev, [step.response.type]: true }));
        setFlyCard(null);
        setPhase("idle");

        setTimeout(() => {
          if (cancelled) return;
          setWorkspaceGlows((prev) => ({ ...prev, [step.response.type]: false }));
        }, D.GLOW_DURATION);

        // Advance to next step after a brief pause
        setTimeout(() => {
          if (cancelled) return;
          advanceStep();
        }, 200);
      }, D.FLY_CARD);
    }, D.INITIAL_DELAY + D.SHOW_MESSAGE + D.TYPING + D.SHOW_CARD);

    return () => {
      cancelled = true;
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, [stepIdx, currentSteps, advanceStep]);

  /* ── Kick off step 0 on mount ── */
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  /* ── Cursor animation state ── */
  const [cursorPos, setCursorPos] = useState({ x: 30, y: 70 });

  useEffect(() => {
    const positions = [
      { x: 30, y: 70 },
      { x: 35, y: 45 },
      { x: 55, y: 50 },
      { x: 60, y: 30 },
      { x: 50, y: 65 },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % positions.length;
      setCursorPos(positions[idx]!);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full" ref={browserRef}>
      {/* ── Browser frame ── */}
      <div className="relative w-full rounded-[16px] border-2 border-ink shadow-[0_8px_32px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] bg-white overflow-hidden">
        <BrowserChrome />

        {/* Browser content area */}
        <div className="flex" style={{ minHeight: 340, height: "clamp(300px, 38vw, 420px)" }}>
          {/* ── LEFT: Chat Panel ── */}
          <div className="w-[55%] border-r border-[#E8E6E1] bg-[#FCFAF5] flex flex-col">
            {/* Chat header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E8E6E1] bg-white/60">
              <div className="flex -space-x-1">
                {["Rahul", "Priya", "Alex", "Kim"].map((name) => (
                  <div key={name} className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-[6px] font-bold" style={{ background: SENDER_COLORS[name] }}>{name[0]}</div>
                ))}
              </div>
              <span className="text-[11px] font-semibold text-ink">product-team</span>
              <div className="ml-auto">
                <motion.div
                  className="w-[7px] h-[7px] rounded-full"
                  animate={{ backgroundColor: ["#34B876", "#34B876", "#34B876"] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{ boxShadow: "0 0 6px rgba(52,184,118,0.4)" }}
                />
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-hidden relative p-2.5 flex flex-col justify-end">
              <AnimatePresence mode="popLayout">
                {chatLog.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    className="flex items-start gap-2 mb-2"
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    layout
                  >
                    <Avatar name={msg.sender} color={msg.avatar} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-bold text-ink">{msg.sender}</span>
                        <span className="text-[8px] text-ink-muted">just now</span>
                      </div>
                      <motion.div
                        className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 border border-[#E8E6E1] shadow-sm"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <p className="text-[11px] text-ink leading-relaxed">{msg.text}</p>
                      </motion.div>

                      {/* AI response card (appears in phase "card") */}
                      {phase === "card" && i === chatLog.length - 1 && (
                        <motion.div
                          id={`ai-card-${stepIdx}`}
                          className="mt-1.5 px-3 py-2 rounded-xl border border-accent-purple/20 bg-accent-purple/[0.04]"
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <motion.div
                              className="w-1.5 h-1.5 rounded-full bg-accent-purple"
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                            />
                            <span className="text-[8px] font-bold text-accent-purple uppercase tracking-wider">
                              {currentSteps[stepIdx]?.response.type}
                            </span>
                            <span className="text-[8px] text-ink-muted ml-auto">\u2713 Generated</span>
                          </div>
                          <p className="text-[10px] font-semibold text-ink">
                            {currentSteps[stepIdx]?.response.title}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Thinking dots */}
              <AnimatePresence>
                {phase === "typing" && <ThinkingDots />}
              </AnimatePresence>
            </div>
          </div>

          {/* ── RIGHT: Workspace Panel ── */}
          <div className="w-[45%] bg-white flex flex-col">
            {/* Workspace header */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#E8E6E1]">
              <div className="w-4 h-4 rounded-[5px] bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#B084D7" strokeWidth="3" strokeLinecap="round">
                  <path d="M4 6h16M4 12h16M4 18h10" />
                </svg>
              </div>
              <span className="text-[11px] font-bold text-ink">AI Workspace</span>
              <motion.div
                className="w-[5px] h-[5px] rounded-full bg-accent-purple ml-auto"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </div>

            {/* Workspace content */}
            <div className="flex-1 overflow-hidden p-2.5 flex flex-col gap-1.5 text-[11px]">
              {/* Tasks */}
              <div className="rounded-lg border border-[#E8E6E1] p-2 transition-colors duration-300" style={{ backgroundColor: workspaceGlows.task ? "rgba(124, 92, 252, 0.06)" : "transparent" }}>
                <SectionHeader icon="\u2713" label="Tasks" glow={workspaceGlows.task} />
                <div className="space-y-[1px]">
                  {workspaceLog.filter((e) => e.type === "task").map((item, i) => (
                    <WorkspaceItem key={item.id} title={item.title} index={i} type="task" />
                  ))}
                  {workspaceLog.filter((e) => e.type === "task").length === 0 && (
                    <p className="text-[9px] text-ink-muted italic px-2 py-1">No tasks yet</p>
                  )}
                </div>
              </div>

              {/* Decisions */}
              <div className="rounded-lg border border-[#E8E6E1] p-2 transition-colors duration-300" style={{ backgroundColor: workspaceGlows.decision ? "rgba(124, 92, 252, 0.06)" : "transparent" }}>
                <SectionHeader icon="\u25C6" label="Decisions" count={decisionCount} glow={workspaceGlows.decision} />
                <div className="space-y-[1px]">
                  {workspaceLog.filter((e) => e.type === "decision").map((item, i) => (
                    <WorkspaceItem key={item.id} title={item.title} index={i} type="decision" />
                  ))}
                  {workspaceLog.filter((e) => e.type === "decision").length === 0 && (
                    <p className="text-[9px] text-ink-muted italic px-2 py-1">No decisions yet</p>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="rounded-lg border border-[#E8E6E1] p-2 transition-colors duration-300" style={{ backgroundColor: workspaceGlows.document ? "rgba(124, 92, 252, 0.06)" : "transparent" }}>
                <SectionHeader icon="\u25A1" label="Documents" glow={workspaceGlows.document} />
                <div className="space-y-[1px]">
                  {workspaceLog.filter((e) => e.type === "document").map((item, i) => (
                    <WorkspaceItem key={item.id} title={item.title} index={i} type="document" />
                  ))}
                  {workspaceLog.filter((e) => e.type === "document").length === 0 && (
                    <p className="text-[9px] text-ink-muted italic px-2 py-1">No documents yet</p>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg border border-[#E8E6E1] p-2 transition-colors duration-300" style={{ backgroundColor: workspaceGlows.summary ? "rgba(124, 92, 252, 0.06)" : "transparent" }}>
                <SectionHeader icon="\u2191" label="Notes &amp; Summaries" glow={workspaceGlows.summary} />
                <div className="space-y-[1px]">
                  {workspaceLog.filter((e) => e.type === "summary").map((item, i) => (
                    <WorkspaceItem key={item.id} title={item.title} index={i} type="summary" />
                  ))}
                  {workspaceLog.filter((e) => e.type === "summary").length === 0 && (
                    <p className="text-[9px] text-ink-muted italic px-2 py-1">No summaries yet</p>
                  )}
                </div>
              </div>

              {/* Catch Me Up */}
              <motion.button
                className="mt-auto flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-accent-purple/30 bg-accent-purple/[0.04] text-accent-purple text-[10px] font-semibold hover:bg-accent-purple/10 transition-colors cursor-default"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                Catch Me Up
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Flying card overlay ── */}
      <AnimatePresence>
        {flyCard && (
          <motion.div
            className="absolute z-20 pointer-events-none"
            style={{ left: "42%", top: "55%", width: 100 }}
            initial={{ opacity: 0, scale: 0.85, x: 0, y: 0 }}
            animate={{ opacity: 1, scale: 1, x: "12%", y: "-20%" }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 180, damping: 18, mass: 0.8 }}
          >
            <div className="bg-white rounded-xl border-2 border-accent-purple/30 shadow-lg px-3 py-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[8px] font-bold text-accent-purple uppercase tracking-wider">{flyCard.type}</span>
              </div>
              <p className="text-[10px] font-semibold text-ink">{flyCard.title}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating cursor ── */}
      <motion.div
        className="absolute z-10 pointer-events-none"
        animate={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%` }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
          <path d="M2 2L12 12H7.5L6.5 17L4 14.5L2 2Z" fill="#1A1A1A" opacity={0.85} />
        </svg>
      </motion.div>

      {/* ── Floating particles ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-accent-purple"
            style={{
              width: `${2 + (i % 2) * 2}px`,
              height: `${2 + (i % 2) * 2}px`,
              left: `${8 + i * 18}%`,
              top: `${10 + (i * 13) % 75}%`,
              opacity: 0.2,
            }}
            animate={{ y: [0, -12, 0], opacity: [0.15, 0.35, 0.15] }}
            transition={{ repeat: Infinity, duration: 4 + (i % 3) * 2, delay: i * 0.6, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* ── Purple AI pulse glow ── */}
      <motion.div
        className="absolute -top-6 -right-6 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(124,92,252,0.08), transparent 70%)",
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(124,92,252,0.05), transparent 70%)",
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
      />
    </div>
  );
}

/* ───────────────────────────────────────────
   Tech stack badges (unchanged)
   ─────────────────────────────────────────── */
const techStack = [
  { name: "Next.js", color: "bg-pastel-blue" },
  { name: "React", color: "bg-pastel-purple" },
  { name: "Socket.IO", color: "bg-pastel-orange" },
  { name: "Supabase", color: "bg-pastel-green" },
  { name: "Groq", color: "bg-pastel-pink" },
];

export default function Hero({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <section className="tr-section-padding pt-32 md:pt-36 lg:pt-40 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={`dot-${i}`}
            className="absolute w-2 h-2 rounded-full bg-ink/10 border border-ink/20"
            style={{ left: `${8 + i * 18}%`, top: `${5 + (i % 3) * 38}%` }}
            animate={{ y: [0, -10, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 3 + (i % 3), delay: i * 0.5, ease: "easeInOut" }}
          />
        ))}
      </div>
      <div className="tr-container-wide relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 border-ink bg-pastel-yellow mb-5">
              <span className="w-2 h-2 rounded-full bg-accent-green border border-ink" />
              <span className="text-[11px] font-extrabold text-ink tracking-wide">Realtime AI Collaboration</span>
            </div>

            <h1 className="tr-heading-xl">
              Conversations
              <br />
              become work.
              <br />
              <span className="text-accent-purple relative">
                Automatically.
                <motion.svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 200 8"
                  preserveAspectRatio="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                >
                  <path d="M2 6 Q50 0 100 6 Q150 12 198 6" stroke="#7C5CFC" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </motion.svg>
              </span>
            </h1>

            <p className="tr-text-body-lg mt-5 max-w-md text-ink-soft leading-relaxed">
              ThinkRoom AI continuously transforms conversations into structured knowledge — tasks,
              notes, documents, and summaries — so your team never loses important information.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-7">
              <MagneticButton onClick={onGetStarted} variant="primary" className="!text-[15px] !px-7 !py-3.5">
                Start Collaborating
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="ml-1">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </MagneticButton>
              <MagneticButton variant="secondary" className="!text-[15px] !px-7 !py-3.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mr-1.5">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" stroke="#1A1A1A" strokeWidth="2" />
                  <path d="M9.5 8.5v7l6-3.5-6-3.5z" fill="#1A1A1A" />
                </svg>
                Watch Demo
              </MagneticButton>
            </div>

            <div className="flex items-center gap-1.5 mt-8 text-ink-muted flex-wrap">
              <span className="text-[11px] font-semibold mr-1">Built with</span>
              {techStack.map((tech) => (
                <span key={tech.name} className={`px-2.5 py-1 rounded-lg border-2 border-ink text-[10px] font-bold text-ink ${tech.color}`}>
                  {tech.name}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="relative lg:ml-6 xl:ml-10"
            style={{ perspective: "1000px" }}
          >
            <BrowserDemo />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
