"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WavySeparator from "../ui/WavySeparator";

const pipeline = [
  { name: "Conversation", role: "User Input", desc: "Team messages trigger the pipeline in realtime.", color: "bg-pastel-blue", accent: "#D6E8FF", icon: "💬" },
  { name: "Next.js", role: "Frontend Framework", desc: "Server components and edge rendering for instant page loads.", color: "bg-pastel-blue", accent: "#D6E8FF", icon: "N" },
  { name: "React", role: "Interactive UI", desc: "Component library powering the realtime collaborative interface.", color: "bg-pastel-purple", accent: "#E5DEFF", icon: "R" },
  { name: "Socket.IO", role: "Live Sync", desc: "Bi-directional event-based communication for realtime updates.", color: "bg-pastel-orange", accent: "#FFE4CC", icon: "S" },
  { name: "Supabase", role: "Realtime Database", desc: "Postgres with realtime subscriptions, auth, and storage.", color: "bg-pastel-green", accent: "#D8F5E3", icon: "S" },
  { name: "Groq", role: "AI Extraction Engine", desc: "Ultra-fast LLM inference that processes conversations instantly.", color: "bg-pastel-pink", accent: "#FFE0EC", icon: "G" },
  { name: "ThinkRoom", role: "AI Workspace", desc: "Transformed output: tasks, notes, documents, summaries.", color: "bg-accent-purple", accent: "#7C5CFC", icon: "T" },
];

const outputs = [
  { label: "Tasks", icon: "📋", color: "bg-pastel-orange", desc: "Auto-extracted from decisions" },
  { label: "Notes", icon: "✏️", color: "bg-pastel-purple", desc: "AI-generated knowledge notes" },
  { label: "Documents", icon: "📄", color: "bg-pastel-blue", desc: "Auto-written documentation" },
  { label: "Summaries", icon: "🔔", color: "bg-pastel-green", desc: "Catch Me Up recaps" },
];

function BgBlueprint() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, #1A1A1A 39px, #1A1A1A 40px),repeating-linear-gradient(90deg, transparent, transparent 39px, #1A1A1A 39px, #1A1A1A 40px)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, #1A1A1A 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          opacity: 0.04,
        }}
      />
      <svg className="absolute inset-0 w-full h-full opacity-[0.02]" viewBox="0 0 1200 600" preserveAspectRatio="none">
        <path d="M0 300 Q300 200 600 300 T1200 300" stroke="#1A1A1A" strokeWidth="1" fill="none" />
        <path d="M0 400 Q300 500 600 400 T1200 400" stroke="#1A1A1A" strokeWidth="1" fill="none" />
        <circle cx="600" cy="300" r="100" stroke="#1A1A1A" strokeWidth="0.5" fill="none" />
      </svg>
    </div>
  );
}

function DataPacket({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 z-20"
      style={{ left: "-3%" }}
      animate={{ left: ["-3%", "103%"] }}
      transition={{ repeat: Infinity, duration: 3, delay, ease: "linear" }}
    >
      <motion.div
        className="w-3 h-3 rounded-full border-2 border-ink bg-accent-purple shadow-[0_0_8px_rgba(124,92,252,0.5)]"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

function TrackSegment({ active }: { active: boolean }) {
  return (
    <div className="relative flex-1 min-w-[40px] h-8 flex items-center">
      <motion.div
        className={`absolute inset-x-0 h-[3px] rounded-full transition-colors duration-300 ${
          active ? "bg-accent-purple" : "bg-ink/15"
        }`}
      />
      <motion.div
        className={`absolute inset-x-0 h-[3px] rounded-full transition-opacity duration-300 ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: `repeating-linear-gradient(90deg, #7C5CFC 0px, #7C5CFC 8px, transparent 8px, transparent 16px)`,
          backgroundSize: "16px 3px",
        }}
        animate={active ? { backgroundPosition: ["0px 0px", "16px 0px"] } : {}}
        transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
      />
      {active && (
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent-purple"
          animate={{ left: ["0%", "100%"] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
      )}
      {!active && (
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-ink/20"
          animate={{ left: ["0%", "100%"] }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 1 }}
        />
      )}
    </div>
  );
}

function PipelineModule({
  module,
  index,
  active,
  hovered,
  onHover,
  onLeave,
}: {
  module: (typeof pipeline)[0];
  index: number;
  active: boolean;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const isInput = index === 0;
  const isOutput = index === pipeline.length - 1;

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.08, duration: 0.4 }}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        className="relative"
      >
        <motion.div
          animate={{
            y: hovered ? -6 : active ? -3 : 0,
            scale: hovered ? 1.06 : active ? 1.03 : 1,
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={`tr-card-sm p-3 min-w-[100px] md:min-w-[120px] text-center relative z-10 transition-shadow duration-300 ${
            isOutput ? "bg-accent-purple text-white" : module.color
          } ${active ? "shadow-[0_4px_0_0_#1A1A1A]" : "shadow-[0_2px_0_0_#1A1A1A]"}`}
        >
          {active && (
            <motion.div
              layoutId="pipeline-glow"
              className={`absolute inset-0 rounded-[14px] border-2 border-accent-purple opacity-60`}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            />
          )}

          {isInput ? (
            <span className="text-lg block mb-1">{module.icon}</span>
          ) : (
            <div className={`w-8 h-8 rounded-xl border-2 ${isOutput ? "border-white/60 bg-white/15" : "border-ink bg-white"} flex items-center justify-center mx-auto mb-1.5`}>
              <span className={`text-[11px] font-black ${isOutput ? "text-white" : "text-ink"}`}>{module.icon}</span>
            </div>
          )}

          <div className={`text-[11px] font-bold ${isOutput ? "text-white" : "text-ink"} leading-tight`}>
            {module.name}
          </div>
          <div className={`text-[8px] font-semibold ${isOutput ? "text-white/70" : "text-ink-muted"} mt-0.5 leading-tight`}>
            {module.role}
          </div>
        </motion.div>

        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 p-3 rounded-xl border-2 border-ink bg-white shadow-[0_3px_0_0_#1A1A1A] z-30"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="w-2 h-2 rounded-full border border-ink"
                  style={{ backgroundColor: module.accent }}
                />
                <span className="text-[10px] font-bold text-ink">{module.name}</span>
              </div>
              <p className="text-[9px] font-medium text-ink-soft leading-relaxed">{module.desc}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function OutputCards({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10"
        >
          <motion.div className="flex items-center gap-3 justify-center mb-5">
            <div className="h-[2px] flex-1 max-w-[120px] bg-ink/10" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="px-3 py-1 rounded-full border-2 border-ink bg-white text-[9px] font-bold text-ink-muted uppercase tracking-wider"
            >
              AI-Generated Output
            </motion.div>
            <div className="h-[2px] flex-1 max-w-[120px] bg-ink/10" />
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3">
            {outputs.map((output, i) => (
              <motion.div
                key={output.label}
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="group"
              >
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`tr-card-sm p-3 ${output.color} min-w-[120px] text-center shadow-[0_3px_0_0_#1A1A1A]`}
                >
                  <motion.span
                    className="text-lg block mb-1"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.3, ease: "easeInOut" }}
                  >
                    {output.icon}
                  </motion.span>
                  <div className="text-[11px] font-bold text-ink">{output.label}</div>
                  <div className="text-[8px] font-medium text-ink-muted mt-0.5">{output.desc}</div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="flex justify-center mt-5"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-ink bg-white shadow-[0_2px_0_0_#1A1A1A]">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-accent-green"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <span className="text-[10px] font-bold text-ink-muted">
                Continuous processing · No manual work required
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function TechStack() {
  const [phase, setPhase] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const segments = pipeline.length - 1;

  useEffect(() => {
    const timer = setTimeout(() => setPhase((prev) => (prev + 1) % segments), 1000);
    return () => clearTimeout(timer);
  }, [phase, segments]);

  const activeSeg = phase;
  const showOutputs = phase >= segments - 1;

  return (
    <>
      <WavySeparator color="#FFFDF7" />
      <section className="tr-section-padding overflow-hidden relative">
        <BgBlueprint />

        <div className="tr-container-wide relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full border-2 border-ink bg-pastel-yellow text-[12px] font-bold mb-4">
              The stack behind the magic
            </span>
            <h2 className="tr-heading-lg">
              How the pipeline
              <br />
              works together.
            </h2>
            <p className="tr-text-body mt-3 max-w-lg mx-auto text-ink-muted">
              Messages flow through this stack and emerge as organized work.
            </p>
          </motion.div>

          <div className="relative max-w-5xl mx-auto">
            <div className="flex items-center justify-center">
              {pipeline.map((mod, i) => (
                <div key={mod.name} className="flex items-center">
                  <PipelineModule
                    module={mod}
                    index={i}
                    active={i > 0 && activeSeg === i - 1}
                    hovered={hovered === mod.name}
                    onHover={() => setHovered(mod.name)}
                    onLeave={() => setHovered(null)}
                  />
                  {i < pipeline.length - 1 && (
                    <TrackSegment active={i === activeSeg} />
                  )}
                </div>
              ))}
            </div>

            <div className="absolute inset-x-0 top-1/2 h-0 pointer-events-none z-20" style={{ transform: 'translateY(calc(-50% + 1px))' }}>
              <DataPacket delay={0} />
              <DataPacket delay={1.5} />
            </div>

            <OutputCards show={showOutputs} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-ink bg-white shadow-[0_2px_0_0_#1A1A1A]">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-accent-green"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <span className="text-[11px] font-bold text-ink-muted">
                Hover over any module to learn more
              </span>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
