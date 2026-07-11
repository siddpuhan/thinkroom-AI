"use client";
import React from "react";
import { motion } from "framer-motion";

function FloatAnim({ children, delay = 0, duration = 3 }: { children: React.ReactNode; delay?: number; duration?: number }) {
  return (
    <motion.g
      animate={{ y: [0, -6, 0] }}
      transition={{ repeat: Infinity, duration, ease: "easeInOut", delay }}
    >
      {children}
    </motion.g>
  );
}

function PulseAnim({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.g
      animate={{ opacity: [1, 0.4, 1] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay }}
    >
      {children}
    </motion.g>
  );
}

export function AIBrainMachine({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 500" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <FloatAnim delay={0}>
        <rect x="180" y="140" width="240" height="220" rx="40" fill="#E5DEFF" stroke="#1A1A1A" strokeWidth="3" />
        <rect x="200" y="160" width="200" height="180" rx="30" fill="#D6E8FF" stroke="#1A1A1A" strokeWidth="2.5" />
      </FloatAnim>

      <circle cx="300" cy="240" r="50" fill="#7C5CFC" stroke="#1A1A1A" strokeWidth="3" />
      <circle cx="300" cy="240" r="30" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2" />
      <PulseAnim delay={0}>
        <circle cx="300" cy="240" r="12" fill="#7C5CFC" />
      </PulseAnim>

      <motion.path
        d="M240 200 Q260 180 280 200"
        stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round"
        animate={{ pathLength: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      />
      <motion.path
        d="M320 200 Q340 180 360 200"
        stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round"
        animate={{ pathLength: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
      />

      <rect x="250" y="270" width="20" height="8" rx="4" fill="#4A90D9" stroke="#1A1A1A" strokeWidth="2" />
      <rect x="280" y="270" width="20" height="8" rx="4" fill="#34B876" stroke="#1A1A1A" strokeWidth="2" />
      <rect x="310" y="270" width="20" height="8" rx="4" fill="#FF8A47" stroke="#1A1A1A" strokeWidth="2" />
      <rect x="340" y="270" width="20" height="8" rx="4" fill="#7C5CFC" stroke="#1A1A1A" strokeWidth="2" />

      <motion.g
        animate={{ x: [0, 80, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <rect x="420" y="180" width="80" height="40" rx="12" fill="#FFE4CC" stroke="#1A1A1A" strokeWidth="2.5" />
        <text x="430" y="205" fontSize="10" fontWeight="700" fill="#1A1A1A">Tasks</text>
        <motion.circle
          cx="490" cy="200" r="4" fill="#34B876" stroke="#1A1A1A" strokeWidth="1.5"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      </motion.g>

      <motion.g
        animate={{ y: [0, -60, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
      >
        <rect x="420" y="240" width="80" height="40" rx="12" fill="#D6E8FF" stroke="#1A1A1A" strokeWidth="2.5" />
        <text x="430" y="265" fontSize="10" fontWeight="700" fill="#1A1A1A">Notes</text>
      </motion.g>

      <motion.g
        animate={{ x: [0, -80, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
      >
        <rect x="100" y="180" width="80" height="40" rx="12" fill="#FFF5CC" stroke="#1A1A1A" strokeWidth="2.5" />
        <text x="110" y="205" fontSize="10" fontWeight="700" fill="#1A1A1A">Docs</text>
      </motion.g>

      <motion.g
        animate={{ y: [0, -40, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1.5 }}
      >
        <rect x="100" y="240" width="80" height="40" rx="12" fill="#D8F5E3" stroke="#1A1A1A" strokeWidth="2.5" />
        <text x="105" y="265" fontSize="9" fontWeight="700" fill="#1A1A1A">Summaries</text>
      </motion.g>

      <FloatAnim delay={0.8} duration={2.5}>
        <g transform="translate(180, 370)">
          <circle cx="0" cy="0" r="12" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="4" fill="#1A1A1A" />
          <line x1="-6" y1="8" x2="6" y2="8" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
        </g>
      </FloatAnim>

      <FloatAnim delay={1.2} duration={2.8}>
        <g transform="translate(420, 350)">
          <circle cx="0" cy="0" r="12" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="4" fill="#1A1A1A" />
          <line x1="-6" y1="8" x2="6" y2="8" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
        </g>
      </FloatAnim>

      <FloatAnim delay={1.6} duration={3.2}>
        <g transform="translate(260, 380)">
          <circle cx="0" cy="0" r="10" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
          <line x1="-4" y1="0" x2="4" y2="0" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
        </g>
      </FloatAnim>

      <motion.path
        d="M100 200 Q60 190 40 160"
        stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="4 3"
        animate={{ strokeDashoffset: [0, -14] }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
      <motion.path
        d="M420 200 Q460 190 480 160"
        stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="4 3"
        animate={{ strokeDashoffset: [0, -14] }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear", delay: 0.3 }}
      />
      <motion.path
        d="M500 200 Q540 220 560 260"
        stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="5 3"
        animate={{ strokeDashoffset: [0, -16] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "linear", delay: 0.6 }}
      />

      <FloatAnim delay={0.3} duration={2}>
        {[0, 1, 2].map((i) => (
          <motion.ellipse
            key={`bubble-${i}`}
            cx={300 + i * 8 - 8}
            cy={140 + i * 12}
            rx="4" ry="3"
            fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="1.5"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.4, ease: "easeInOut" }}
          />
        ))}
      </FloatAnim>
    </svg>
  );
}

export function AIMascot({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 240" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <motion.g
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <circle cx="100" cy="60" r="40" fill="#E5DEFF" stroke="#1A1A1A" strokeWidth="3" />
        <circle cx="85" cy="52" r="6" fill="#1A1A1A" />
        <circle cx="115" cy="52" r="6" fill="#1A1A1A" />
        <circle cx="85" cy="52" r="2" fill="#FFFFFF" />
        <circle cx="115" cy="52" r="2" fill="#FFFFFF" />
        <path d="M88 72 Q100 82 112 72" stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="100" cy="45" r="3" fill="#7C5CFC" />
        <circle cx="100" cy="45" r="5" fill="#7C5CFC" opacity="0.3" />
      </motion.g>

      <motion.g
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 100px" }}
      >
        <rect x="70" y="100" width="60" height="70" rx="18" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="3" />
        <rect x="82" y="110" width="36" height="6" rx="3" fill="#D6E8FF" stroke="#1A1A1A" strokeWidth="2" />
        <rect x="82" y="122" width="28" height="6" rx="3" fill="#D8F5E3" stroke="#1A1A1A" strokeWidth="2" />
        <rect x="82" y="134" width="32" height="6" rx="3" fill="#FFF5CC" stroke="#1A1A1A" strokeWidth="2" />
        <rect x="82" y="146" width="24" height="6" rx="3" fill="#FFE4CC" stroke="#1A1A1A" strokeWidth="2" />
      </motion.g>

      <motion.g
        animate={{ x: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
      >
        <rect x="55" y="115" width="14" height="10" rx="5" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
      </motion.g>

      <motion.g
        animate={{ x: [0, 4, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
      >
        <rect x="131" y="115" width="14" height="10" rx="5" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
      </motion.g>

      <motion.g
        animate={{ rotate: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1 }}
        style={{ transformOrigin: "100px 175px" }}
      >
        <ellipse cx="100" cy="185" rx="35" ry="10" fill="#1A1A1A" />
      </motion.g>

      <motion.g
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.8 }}
      >
        <path d="M100 100 L90 90 L100 80" stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
    </svg>
  );
}

export function PipelineIllustration({ className = "" }: { className?: string }) {
  const items = [
    { label: "Conversation", color: "#D6E8FF", x: 30 },
    { label: "AI", color: "#E5DEFF", x: 160 },
    { label: "Tasks", color: "#FFE4CC", x: 300 },
    { label: "Notes", color: "#FFF5CC", x: 430 },
    { label: "Docs", color: "#D8F5E3", x: 560 },
  ];
  return (
    <svg viewBox="0 0 650 200" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {items.map((item, i) => (
        <motion.g
          key={item.label}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15, duration: 0.5, ease: "easeOut" }}
        >
          <rect x={item.x} y="40" width="100" height="80" rx="20" fill={item.color} stroke="#1A1A1A" strokeWidth="3" />
          <text x={item.x + 50} y="85" textAnchor="middle" fontSize="14" fontWeight="800" fill="#1A1A1A">{item.label}</text>
        </motion.g>
      ))}

      {items.slice(0, -1).map((_, i) => (
        <motion.g key={`arrow-${i}`} animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}>
          <line x1={items[i].x + 100} y1="80" x2={items[i + 1].x} y2="80" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
          <polygon points={`${items[i + 1].x + 2},75 ${items[i + 1].x + 2},85 ${items[i + 1].x + 10},80`} fill="#1A1A1A" />
        </motion.g>
      ))}

      <motion.g
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <rect x="230" y="140" width="190" height="40" rx="30" fill="#7C5CFC" stroke="#1A1A1A" strokeWidth="3" />
        <text x="325" y="167" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FFFFFF">Workspace</text>
      </motion.g>
    </svg>
  );
}

export function JoinRoomIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <FloatAnim delay={0}>
        <rect x="20" y="20" width="200" height="160" rx="24" fill="#D6E8FF" stroke="#1A1A1A" strokeWidth="3" />
        <rect x="40" y="40" width="160" height="12" rx="6" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2" />
        <circle cx="55" cy="46" r="4" fill="#FF6B6B" stroke="#1A1A1A" strokeWidth="1.5" />
        <circle cx="70" cy="46" r="4" fill="#FFD93D" stroke="#1A1A1A" strokeWidth="1.5" />
        <circle cx="85" cy="46" r="4" fill="#6BCB77" stroke="#1A1A1A" strokeWidth="1.5" />
      </FloatAnim>

      <motion.g
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, delay: 0.3 }}
      >
        <circle cx="85" cy="100" r="20" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
        <circle cx="85" cy="100" r="8" fill="#1A1A1A" />
        <path d="M75 115 Q85 125 95 115" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
      </motion.g>

      <motion.g
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, delay: 1.2 }}
      >
        <circle cx="145" cy="110" r="15" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
        <circle cx="145" cy="110" r="6" fill="#1A1A1A" />
      </motion.g>

      <motion.path
        d="M40 60 Q20 80 40 100"
        stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="3 3"
        animate={{ strokeDashoffset: [0, -12] }}
        transition={{ repeat: Infinity, duration: 1 }}
      />
      <motion.path
        d="M200 80 Q220 100 200 120"
        stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="3 3"
        animate={{ strokeDashoffset: [0, -12] }}
        transition={{ repeat: Infinity, duration: 1, delay: 0.5 }}
      />
    </svg>
  );
}

export function DiscussIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <FloatAnim delay={0}>
        <rect x="20" y="20" width="200" height="160" rx="24" fill="#E5DEFF" stroke="#1A1A1A" strokeWidth="3" />
      </FloatAnim>

      <motion.g
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2, delay: 0.2 }}
      >
        <rect x="40" y="35" width="120" height="30" rx="15" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
        <circle cx="55" cy="50" r="6" fill="#1A1A1A" />
        <text x="68" y="54" fontSize="9" fontWeight="700" fill="#1A1A1A">Hey team!</text>
      </motion.g>

      <motion.g
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
      >
        <rect x="60" y="75" width="140" height="30" rx="15" fill="#D6E8FF" stroke="#1A1A1A" strokeWidth="2.5" />
        <circle cx="75" cy="90" r="6" fill="#4A90D9" />
        <text x="88" y="94" fontSize="9" fontWeight="700" fill="#1A1A1A">Ideas for sprint?</text>
      </motion.g>

      <motion.g
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2, delay: 1 }}
      >
        <rect x="40" y="115" width="130" height="30" rx="15" fill="#FFF5CC" stroke="#1A1A1A" strokeWidth="2.5" />
        <circle cx="55" cy="130" r="6" fill="#1A1A1A" />
        <text x="68" y="134" fontSize="9" fontWeight="700" fill="#1A1A1A">Let me share...</text>
      </motion.g>

      <motion.g
        animate={{ rotate: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 3, delay: 1.5 }}
        style={{ transformOrigin: "195px 50px" }}
      >
        <rect x="170" y="35" width="40" height="40" rx="10" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
        <polygon points="178,45 178,65 195,55" fill="#1A1A1A" />
      </motion.g>
    </svg>
  );
}

export function AIOrganizesIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <FloatAnim delay={0}>
        <rect x="20" y="20" width="200" height="160" rx="24" fill="#D8F5E3" stroke="#1A1A1A" strokeWidth="3" />
      </FloatAnim>

      <motion.g
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2, delay: 0 }}
      >
        <circle cx="120" cy="70" r="28" fill="#7C5CFC" stroke="#1A1A1A" strokeWidth="3" />
        <circle cx="120" cy="70" r="14" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2" />
        <circle cx="120" cy="70" r="6" fill="#7C5CFC" />
        <motion.path d="M140 50 Q160 40 170 30" stroke="#1A1A1A" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="3 2"
          animate={{ strokeDashoffset: [0, -10] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        />
      </motion.g>

      <motion.rect
        x="35" y="120" width="50" height="35" rx="10" fill="#FFE4CC" stroke="#1A1A1A" strokeWidth="2.5"
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
      />
      <text x="42" y="143" fontSize="9" fontWeight="700" fill="#1A1A1A">Tasks</text>

      <motion.rect
        x="95" y="125" width="50" height="35" rx="10" fill="#D6E8FF" stroke="#1A1A1A" strokeWidth="2.5"
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
      />
      <text x="102" y="148" fontSize="9" fontWeight="700" fill="#1A1A1A">Notes</text>

      <motion.rect
        x="155" y="120" width="50" height="35" rx="10" fill="#FFF5CC" stroke="#1A1A1A" strokeWidth="2.5"
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2, delay: 0.9 }}
      />
      <text x="162" y="143" fontSize="9" fontWeight="700" fill="#1A1A1A">Docs</text>

      <motion.path
        d="M85 90 L60 115"
        stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"
        animate={{ strokeDashoffset: [0, -5] }}
        transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }}
      />
      <motion.path
        d="M120 98 L120 120"
        stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"
        animate={{ strokeDashoffset: [0, -5] }}
        transition={{ repeat: Infinity, duration: 0.5, delay: 0.4 }}
      />
      <motion.path
        d="M155 90 L180 115"
        stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"
        animate={{ strokeDashoffset: [0, -5] }}
        transition={{ repeat: Infinity, duration: 0.5, delay: 0.6 }}
      />
    </svg>
  );
}

export function BrowserMockup({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`tr-card overflow-hidden ${className}`}>
      <div className="flex items-center gap-1.5 px-4 py-3 border-b-2 border-ink">
        <div className="w-3 h-3 rounded-full bg-[#FF6B6B] border border-ink" />
        <div className="w-3 h-3 rounded-full bg-[#FFD93D] border border-ink" />
        <div className="w-3 h-3 rounded-full bg-[#6BCB77] border border-ink" />
        <div className="ml-4 flex-1 max-w-[200px] h-6 rounded-lg bg-pastel-blue border-2 border-ink flex items-center px-3">
          <span className="text-[10px] font-semibold text-ink/60">app.thinkroom.ai</span>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function ChatBubble({ text, color = "#D6E8FF", align = "left" }: { text: string; color?: string; align?: "left" | "right" }) {
  return (
    <motion.div
      className={`flex ${align === "right" ? "justify-end" : "justify-start"} mb-2`}
      initial={{ opacity: 0, x: align === "right" ? 20 : -20, scale: 0.95 }}
      whileInView={{ opacity: 1, x: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <div
        className="px-3 py-2 rounded-2xl border-2 border-ink max-w-[200px]"
        style={{ backgroundColor: color }}
      >
        <p className="text-[11px] font-medium text-ink">{text}</p>
      </div>
    </motion.div>
  );
}
