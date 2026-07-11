"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import MagneticButton from "../ui/MagneticButton";
import WavySeparator from "../ui/WavySeparator";

function FloatingFragments() {
  const items = [
    { icon: "📋", label: "Tasks", color: "bg-pastel-orange", x: "10%", y: "20%", delay: 0 },
    { icon: "✏️", label: "Notes", color: "bg-pastel-purple", x: "80%", y: "15%", delay: 0.3 },
    { icon: "📄", label: "Docs", color: "bg-pastel-blue", x: "85%", y: "60%", delay: 0.6 },
    { icon: "🔔", label: "Summaries", color: "bg-pastel-green", x: "15%", y: "65%", delay: 0.9 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((item) => (
        <motion.div
          key={item.label}
          className="absolute"
          style={{ left: item.x, top: item.y }}
          initial={{ opacity: 0, scale: 0, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: item.delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className={`tr-card-sm p-2 ${item.color} shadow-[0_2px_0_0_#1A1A1A]`}
            animate={{
              y: [0, -6, 0],
              rotate: [0, 3, -3, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 4,
              delay: item.delay,
              ease: "easeInOut",
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{item.icon}</span>
              <span className="text-[9px] font-bold text-ink">{item.label}</span>
            </div>
          </motion.div>
        </motion.div>
      ))}

      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full bg-accent-purple/40"
          style={{ left: `${20 + i * 20}%`, top: `${30 + (i % 2) * 30}%` }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 3 + i,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function CountUp({ end, suffix = "" }: { end: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const count = isInView ? end : 0;

  return (
    <motion.span
      ref={ref}
      className="text-[20px] font-black text-ink"
      animate={isInView ? { scale: [1, 1.1, 1] } : {}}
      transition={{ delay: 0.5, duration: 0.3 }}
    >
      {count.toLocaleString()}{suffix}
    </motion.span>
  );
}

export default function FinalCTA({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <>
      <WavySeparator color="#E5DEFF" />
      <section className="tr-section-padding bg-pastel-purple/30 overflow-hidden relative">
        <FloatingFragments />

        <div className="tr-container-wide relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full border-2 border-ink bg-white text-[12px] font-bold mb-6">
                Ready to transform your workflow?
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="tr-heading-lg mb-6"
            >
              Ready to stop
              <br />
              losing conversations?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="tr-text-body-lg text-ink-soft mb-8 max-w-lg mx-auto"
            >
              Join thousands of teams using ThinkRoom AI to turn every chat into organized work.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap justify-center gap-4 mb-12"
            >
              <MagneticButton onClick={onGetStarted} variant="primary" className="!text-[16px] !px-8 !py-4">
                Start Collaborating
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-1">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </MagneticButton>
              <MagneticButton variant="secondary" className="!text-[16px] !px-8 !py-4">
                Watch Live Demo
              </MagneticButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="inline-flex items-center gap-8 px-8 py-4 rounded-2xl border-2 border-ink bg-white/80"
            >
              <div className="text-center">
                <CountUp end={5000} suffix="+" />
                <div className="text-[10px] font-semibold text-ink-muted">Teams</div>
              </div>
              <div className="w-px h-8 bg-ink/20" />
              <div className="text-center">
                <CountUp end={50} suffix="K+" />
                <div className="text-[10px] font-semibold text-ink-muted">Developers</div>
              </div>
              <div className="w-px h-8 bg-ink/20" />
              <div className="text-center">
                <span className="text-[20px] font-black text-ink">99%</span>
                <div className="text-[10px] font-semibold text-ink-muted">Uptime</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
