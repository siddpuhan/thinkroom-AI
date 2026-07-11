"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WavySeparator from "../ui/WavySeparator";

const beforeItems = [
  { label: "Team chats", detail: "Scattered across Slack, Discord, email", status: "chaotic" },
  { label: "Tasks", detail: "Lost in threads, never followed up", status: "chaotic" },
  { label: "Decisions", detail: "Forgotten or buried in scrollback", status: "chaotic" },
  { label: "Documentation", detail: "Manual, outdated, nobody writes it", status: "chaotic" },
  { label: "Meeting notes", detail: "Never taken, never shared", status: "chaotic" },
];

const afterItems = [
  { label: "Team chats", detail: "One organized workspace with AI context", status: "clean" },
  { label: "Tasks", detail: "Auto-extracted, assigned, and tracked", status: "clean" },
  { label: "Decisions", detail: "Captured as searchable knowledge notes", status: "clean" },
  { label: "Documentation", detail: "Generated automatically from conversations", status: "clean" },
  { label: "Meeting notes", detail: "AI-written summaries every time", status: "clean" },
];

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative flex items-center bg-white border-3 border-ink rounded-2xl p-1 shadow-[0_3px_0_0_#1A1A1A]"
    >
      <div className="relative z-10 flex">
        {["Without", "With ThinkRoom"].map((label, i) => (
          <span
            key={label}
            className={`px-5 py-2 text-[12px] font-bold rounded-xl transition-colors duration-300 ${
              (active && i === 1) || (!active && i === 0) ? "text-white" : "text-ink"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
      <motion.div
        layoutId="toggle-bg"
        className="absolute top-1 bottom-1 left-1 right-1/2 rounded-xl bg-accent-purple border-2 border-ink z-0"
        animate={{
          left: active ? "50%" : "0.25rem",
          right: active ? "0.25rem" : "50%",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />
    </button>
  );
}

export default function BeforeAfter() {
  const [showAfter, setShowAfter] = useState(false);

  return (
    <>
      <WavySeparator color="#FEFCF3" />
      <section id="comparison" className="tr-section-padding bg-ivory overflow-hidden">
        <div className="tr-container-wide">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <span className="inline-block px-4 py-1.5 rounded-full border-2 border-ink bg-pastel-orange text-[12px] font-bold mb-4">
              The difference
            </span>
            <h2 className="tr-heading-lg mb-6">
              Before vs
              <br />
              After ThinkRoom.
            </h2>
            <div className="flex justify-center">
              <Toggle active={showAfter} onToggle={() => setShowAfter(!showAfter)} />
            </div>
          </motion.div>

          <div className="max-w-4xl mx-auto relative">
            <AnimatePresence mode="wait">
              {showAfter ? (
                <motion.div
                  key="after"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="tr-card overflow-hidden shadow-[0_6px_0_0_#1A1A1A] border-3 border-ink">
                    <div className="px-6 py-4 border-b-2 border-ink bg-pastel-green/40">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl border-2 border-ink bg-accent-green flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-[17px] font-extrabold text-ink">With ThinkRoom</h3>
                          <p className="text-[11px] font-medium text-ink-muted">Everything organized. Automatically.</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-2">
                      {afterItems.map((item, i) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08, duration: 0.3 }}
                          className="flex items-center gap-4 p-3 rounded-xl border-2 border-ink bg-white hover:-translate-y-0.5 transition-transform duration-200"
                        >
                          <div className="w-6 h-6 rounded-lg border-2 border-ink bg-accent-green flex items-center justify-center flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-[13px] font-bold text-ink">{item.label}</div>
                            <div className="text-[11px] font-medium text-ink-muted">{item.detail}</div>
                          </div>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 + i * 0.08, type: "spring" }}
                            className="w-5 h-5 rounded-full border-2 border-ink bg-accent-green flex items-center justify-center"
                          >
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="before"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="tr-card overflow-hidden shadow-[0_6px_0_0_#1A1A1A] border-3 border-ink opacity-60">
                    <div className="px-6 py-4 border-b-2 border-ink bg-pastel-pink/40">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl border-2 border-ink bg-white flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-[17px] font-extrabold text-ink">Without ThinkRoom</h3>
                          <p className="text-[11px] font-medium text-ink-muted">Scattered. Disconnected. Manual.</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-2">
                      {beforeItems.map((item, i) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08, duration: 0.3 }}
                          className="flex items-center gap-4 p-3 rounded-xl border-2 border-ink bg-white"
                        >
                          <div className="w-6 h-6 rounded-lg border-2 border-ink bg-paper flex items-center justify-center flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-[13px] font-bold text-ink">{item.label}</div>
                            <div className="text-[11px] font-medium text-ink-muted">{item.detail}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showAfter && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="mt-6 text-center"
                >
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-ink bg-pastel-green/30">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-accent-green"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                    <span className="text-[12px] font-bold text-ink">Your team could be here</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </>
  );
}
