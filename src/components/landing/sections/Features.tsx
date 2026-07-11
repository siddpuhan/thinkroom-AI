"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import WavySeparator from "../ui/WavySeparator";

const features = [
  {
    title: "Realtime Sync",
    desc: "Messages, tasks, and docs sync instantly across your entire team.",
    color: "bg-pastel-blue",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: "AI Task Extraction",
    desc: "Tasks appear from conversations automatically. No manual entry needed.",
    color: "bg-pastel-orange",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Knowledge Notes",
    desc: "Key decisions and ideas become searchable knowledge automatically.",
    color: "bg-pastel-purple",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    title: "Documents",
    desc: "Architecture specs and documentation written as your team talks.",
    color: "bg-pastel-green",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    title: "Catch Me Up",
    desc: "AI summarizes everything you missed since your last visit.",
    color: "bg-pastel-pink",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    title: "Workspace",
    desc: "Everything organized into a single, realtime workspace.",
    color: "bg-pastel-yellow",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
];

function FeatureCard({
  feature,
  index,
  side,
}: {
  feature: (typeof features)[0];
  index: number;
  side: "left" | "right";
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: side === "left" ? -30 : 30, y: 20 }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div className={`tr-card-sm p-4 ${feature.color} hover:-translate-y-1 transition-transform duration-300`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl border-2 border-ink bg-white flex items-center justify-center flex-shrink-0">
            {feature.icon}
          </div>
          <h3 className="text-[13px] font-bold text-ink">{feature.title}</h3>
        </div>
        <p className="text-[11px] font-medium text-ink-soft leading-relaxed">{feature.desc}</p>
      </div>
      <motion.div
        className={`h-8 w-0.5 bg-ink/20 mx-auto mt-1 ${side === "left" ? "ml-auto" : "mr-auto"}`}
        initial={{ scaleY: 0 }}
        animate={isInView ? { scaleY: 1 } : {}}
        transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
        style={{ transformOrigin: "top" }}
      />
      <motion.div
        className={`w-0 h-0 mx-auto border-l-4 border-r-4 border-t-4 border-transparent border-t-ink/20 ${side === "left" ? "ml-auto" : "mr-auto"}`}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: index * 0.1 + 0.5 }}
      />
    </motion.div>
  );
}

function StickyBrowser() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="sticky top-32 z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="tr-card overflow-hidden shadow-[0_6px_0_0_#1A1A1A]"
      >
        <div className="flex items-center gap-1.5 px-3 py-2 border-b-2 border-ink bg-white">
          <div className="w-2 h-2 rounded-full bg-[#FF6B6B] border border-ink" />
          <div className="w-2 h-2 rounded-full bg-[#FFD93D] border border-ink" />
          <div className="w-2 h-2 rounded-full bg-[#6BCB77] border border-ink" />
          <div className="ml-2 flex-1 max-w-[140px] h-4 rounded-md bg-pastel-blue/50 border border-ink flex items-center px-1.5">
            <span className="text-[7px] font-semibold text-ink/60">thinkroom.app</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-accent-purple/10 border border-ink">
            <motion.div
              className="w-1 h-1 rounded-full bg-accent-purple"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <span className="text-[6px] font-bold text-accent-purple">AI</span>
          </div>
        </div>
        <div className="p-3 bg-white">
          <div className="flex items-center gap-1.5 mb-2 text-[9px] font-bold text-ink-muted">
            <span className="text-ink font-bold">#general</span>
            <span>·</span>
            <span>12 online</span>
          </div>
          {[
            { text: "Let's finalize the migration plan", from: "Priya", color: "#D6E8FF" },
            { text: "Supabase is the right call", from: "Rahul", color: "#E5DEFF", right: true },
            { text: "I'll start the migration doc", from: "Priya", color: "#D6E8FF" },
          ].map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.3 }}
              className={`flex ${msg.right ? "justify-end" : "justify-start"} mb-1.5`}
            >
              <div className="max-w-[160px]">
                <div className="text-[7px] font-bold text-ink-muted mb-0.5">{msg.from}</div>
                <div className="px-2 py-1 rounded-xl border border-ink text-[9px] font-semibold text-ink" style={{ backgroundColor: msg.color }}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.7 }}
            className="mt-2 pt-2 border-t border-ink/10"
          >
            <div className="flex items-center gap-2 text-[8px] font-semibold text-ink-muted">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-accent-green"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <span>AI is listening · 3 tasks created</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function PipelineSVG() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1000 600"
      preserveAspectRatio="none"
    >
      <motion.path
        d="M0 100 Q200 120 350 200 L500 280"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        opacity="0.08"
        fill="none"
        strokeDasharray="4 4"
        animate={{ strokeDashoffset: [0, -16] }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
      />
      <motion.path
        d="M0 300 Q200 280 350 250 L500 280"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        opacity="0.08"
        fill="none"
        strokeDasharray="4 4"
        animate={{ strokeDashoffset: [0, -16] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "linear", delay: 0.5 }}
      />
      <motion.path
        d="M0 500 Q200 480 350 350 L500 280"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        opacity="0.08"
        fill="none"
        strokeDasharray="4 4"
        animate={{ strokeDashoffset: [0, -16] }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear", delay: 1 }}
      />
      <motion.path
        d="M1000 100 Q800 120 650 200 L500 280"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        opacity="0.08"
        fill="none"
        strokeDasharray="4 4"
        animate={{ strokeDashoffset: [0, -16] }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear", delay: 0.3 }}
      />
      <motion.path
        d="M1000 300 Q800 280 650 250 L500 280"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        opacity="0.08"
        fill="none"
        strokeDasharray="4 4"
        animate={{ strokeDashoffset: [0, -16] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "linear", delay: 0.8 }}
      />
      <motion.path
        d="M1000 500 Q800 480 650 350 L500 280"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        opacity="0.08"
        fill="none"
        strokeDasharray="4 4"
        animate={{ strokeDashoffset: [0, -16] }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear", delay: 1.2 }}
      />
    </svg>
  );
}

export default function Features() {
  const leftFeatures = features.slice(0, 3);
  const rightFeatures = features.slice(3, 6);

  return (
    <>
      <WavySeparator color="#FFFDF7" />
      <section id="features" className="tr-section-padding overflow-hidden">
        <div className="tr-container-wide">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full border-2 border-ink bg-pastel-purple text-[12px] font-bold mb-4">
              AI that works while you chat
            </span>
            <h2 className="tr-heading-lg">
              Conversations flow in.
              <br />
              Work flows out.
            </h2>
          </motion.div>

          <div className="relative max-w-5xl mx-auto">
            <PipelineSVG />
            <div className="grid md:grid-cols-12 gap-6 lg:gap-8 items-start relative z-10">
              <div className="md:col-span-4 space-y-6">
                {leftFeatures.map((feature, i) => (
                  <FeatureCard key={feature.title} feature={feature} index={i} side="left" />
                ))}
              </div>

              <div className="md:col-span-4 flex justify-center">
                <StickyBrowser />
              </div>

              <div className="md:col-span-4 space-y-6">
                {rightFeatures.map((feature, i) => (
                  <FeatureCard key={feature.title} feature={feature} index={i} side="right" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
