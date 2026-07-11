"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MagneticButton from "../ui/MagneticButton";

const PHASES = [
  { dur: 700 },
  { dur: 1400, msg: "Rahul, deploy backend tomorrow.", from: "Priya", color: "#D6E8FF" },
  { dur: 1200, ai: true },
  { dur: 1300, task: true },
  { dur: 1000, msg: "We decided to migrate to Supabase.", from: "Rahul", color: "#E5DEFF", right: true },
  { dur: 1300, note: true },
  { dur: 700, msg: "Meeting finished.", from: "System", color: "#F0F0F0" },
  { dur: 1600, summary: true },
  { dur: 2000, workspace: true },
  { dur: 700 },
];

function CursorBlink() {
  return (
    <motion.span
      className="inline-block w-[2px] h-[14px] bg-accent-purple ml-0.5 align-middle"
      animate={{ opacity: [1, 0, 1] }}
      transition={{ repeat: Infinity, duration: 0.8 }}
    />
  );
}

function BgDecorations() {
  return (
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
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 700" fill="none" preserveAspectRatio="none">
        <motion.path
          d="M0 350 Q300 150 600 350 T1200 350"
          stroke="#1A1A1A" strokeWidth="1" opacity="0.04"
          animate={{ pathLength: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
        />
        <motion.path
          d="M0 450 Q300 650 600 450 T1200 450"
          stroke="#1A1A1A" strokeWidth="1" opacity="0.03"
          animate={{ pathLength: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut", delay: 3 }}
        />
      </svg>
    </div>
  );
}

function FloatingSparkles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute"
          style={{
            left: `${10 + i * 22}%`,
            top: `${20 + (i % 2) * 50}%`,
          }}
          animate={{
            y: [0, -12, 0],
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 3 + i * 0.5,
            delay: i * 0.8,
            ease: "easeInOut",
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M4 0L5 3L8 4L5 5L4 8L3 5L0 4L3 3Z" fill="#7C5CFC" />
          </svg>
        </motion.div>
      ))}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-accent-purple/30"
          style={{
            left: `${45 + i * 20}%`,
            top: `${30 + i * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 4 + i,
            delay: i * 1.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function AnimatedMessage({
  text, from, color, right, show,
}: {
  text: string; from: string; color: string; right?: boolean; show: boolean;
}) {
  const [typed, setTyped] = useState("");
  const [typingDone, setTypingDone] = useState(false);

  useEffect(() => {
    if (!show) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setTyped(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setTypingDone(true);
      }
    }, 22);
    return () => {
      clearInterval(interval);
      setTyped("");
      setTypingDone(false);
    };
  }, [show, text]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`flex ${right ? "justify-end" : "justify-start"} mb-2`}
        >
          <div className="max-w-[260px]">
            <div className="text-[10px] font-bold text-ink-muted mb-0.5">{from}</div>
            <div className="px-3 py-2 rounded-2xl border-2 border-ink" style={{ backgroundColor: color }}>
              <p className="text-[12px] font-semibold text-ink leading-snug">
                {typed}
                {!typingDone && <CursorBlink />}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AIPulse({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-2 py-2">
            <motion.div
              className="relative w-7 h-7 rounded-xl border-2 border-ink bg-accent-purple flex items-center justify-center flex-shrink-0"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-white"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            </motion.div>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-accent-purple"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                />
              ))}
              <span className="text-[11px] font-semibold text-ink-soft ml-1">AI is processing...</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MiniCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`tr-card-sm p-2.5 bg-white shadow-[0_3px_0_0_#1A1A1A] ${className}`}>
      {children}
    </div>
  );
}

function TaskCardUI({ show, delay }: { show: boolean; delay: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 30, rotate: 1.5 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          exit={{ opacity: 0, x: 30, rotate: 1.5 }}
          transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <MiniCard className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-lg border-2 border-ink bg-accent-green flex items-center justify-center flex-shrink-0">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-ink truncate">Deploy backend to production</p>
              <p className="text-[9px] font-medium text-ink-muted">Assigned · Today</p>
            </div>
            <div className="w-5 h-5 rounded-md border-2 border-ink bg-pastel-orange flex items-center justify-center text-[7px] font-black text-ink flex-shrink-0">T</div>
          </MiniCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NoteCardUI({ show, delay }: { show: boolean; delay: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 15, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, y: 15, rotate: -1 }}
          transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <MiniCard className="bg-pastel-purple/50">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-4 h-4 rounded-md border-2 border-ink bg-pastel-yellow flex items-center justify-center text-[6px] font-black text-ink">N</div>
              <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider">Knowledge Note</span>
            </div>
            <p className="text-[11px] font-bold text-ink">Decision: Migrate to Supabase</p>
            <p className="text-[9px] font-medium text-ink-soft mt-0.5 leading-relaxed">Team agreed on Supabase for backend infrastructure. Migration estimated at 2 weeks.</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[7px] px-1.5 py-0.5 rounded-full border border-ink bg-white font-bold text-ink-muted">#architecture</span>
              <span className="text-[7px] px-1.5 py-0.5 rounded-full border border-ink bg-white font-bold text-ink-muted">#decision</span>
            </div>
          </MiniCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SummaryCardUI({ show, delay }: { show: boolean; delay: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <MiniCard className="bg-pastel-green/50">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-4 h-4 rounded-md border-2 border-ink bg-accent-green flex items-center justify-center text-[6px] font-black text-white">AI</div>
              <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider">Catch Me Up</span>
            </div>
            <p className="text-[10px] font-bold text-ink mb-1">Standup Recap · Just now</p>
            <ul className="space-y-0.5">
              {["Backend deploy scheduled", "Supabase migration approved", "3 new tasks created", "1 document updated"].map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.2 + i * 0.12, duration: 0.3 }}
                  className="flex items-center gap-1 text-[9px] font-medium text-ink-soft"
                >
                  <span className="w-1 h-1 rounded-full bg-accent-green flex-shrink-0" />
                  {item}
                </motion.li>
              ))}
            </ul>
          </MiniCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ConversationAnimation() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const p = PHASES[phase % PHASES.length];
    const timer = setTimeout(() => setPhase((prev) => prev + 1), p.dur);
    return () => clearTimeout(timer);
  }, [phase]);

  const p = phase % PHASES.length;
  const cur = PHASES[p];
  const showMsg1 = p >= 2;
  const showAI = cur.ai || (p > 2 && p < 8);
  const showTask = p >= 4;
  const showMsg2 = p >= 5;
  const showNote = p >= 6;
  const showMsg3 = p >= 7;
  const showSummary = p >= 8;
  const showWorkspace = p >= 9;

  return (
    <div className="relative w-full">
      <div className="tr-card overflow-hidden shadow-[0_8px_0_0_#1A1A1A]">
        <div className="flex items-center gap-1.5 px-4 py-3 border-b-2 border-ink bg-white">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B] border border-ink" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFD93D] border border-ink" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#6BCB77] border border-ink" />
          <div className="ml-3 flex-1 max-w-[180px] h-5 rounded-lg bg-pastel-blue/50 border-2 border-ink flex items-center px-2">
            <span className="text-[8px] font-semibold text-ink/60">thinkroom.app/chat</span>
          </div>
          {showAI && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-accent-purple/10 border border-ink"
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-accent-purple"
                animate={{ scale: [1, 1.6, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              <span className="text-[7px] font-bold text-accent-purple">AI Active</span>
            </motion.div>
          )}
        </div>

        <div className="p-4 md:p-5 bg-white min-h-[320px] relative">
          <AnimatePresence mode="popLayout">
            <div key={`phase-${phase}`} className="space-y-1.5">
              <AnimatedMessage text="Rahul, deploy backend tomorrow." from="Priya · 10:32 AM" color="#D6E8FF" show={showMsg1} />
              <AIPulse show={showAI} />
              <AnimatedMessage text="We decided to migrate to Supabase." from="Rahul · 10:33 AM" color="#E5DEFF" right show={showMsg2} />
              <AnimatedMessage text="Meeting finished." from="ThinkRoom · 10:35 AM" color="#F0F0F0" show={showMsg3} />
              <div className="space-y-2 pt-1">
                <TaskCardUI show={showTask} delay={0.15} />
                <NoteCardUI show={showNote} delay={0.15} />
                <SummaryCardUI show={showSummary} delay={0.15} />
              </div>
              {showWorkspace && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-2.5 mt-2 border-t-2 border-ink/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-accent-green"
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                      <span className="text-[10px] font-bold text-ink-muted">Workspace updated</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {[
                        { label: "Tasks", count: "+3", color: "bg-pastel-orange" },
                        { label: "Notes", count: "+2", color: "bg-pastel-purple" },
                        { label: "Docs", count: "+1", color: "bg-pastel-blue" },
                      ].map((item, i) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.15 + i * 0.08 }}
                          className="flex items-center gap-1"
                        >
                          <div className={`w-4 h-4 rounded-md border-2 border-ink ${item.color} flex items-center justify-center`}>
                            <span className="text-[6px] font-black text-ink">{item.count}</span>
                          </div>
                          <span className="text-[8px] font-semibold text-ink-muted">{item.label}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

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
      <BgDecorations />
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
            className="relative lg:translate-x-8 xl:translate-x-12"
          >
            <FloatingSparkles />
            <div className="scale-[1.06] md:scale-110 origin-top-left">
              <ConversationAnimation />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
