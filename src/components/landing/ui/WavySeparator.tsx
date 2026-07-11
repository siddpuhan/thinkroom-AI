"use client";
import { motion } from "framer-motion";

export default function WavySeparator({ color = "#E5DEFF" }: { color?: string }) {
  return (
    <div className="relative w-full h-16 md:h-24 overflow-hidden -mb-1">
      <motion.svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute w-full h-full"
        animate={{ x: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      >
        <path
          d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z"
          fill={color}
          stroke="#1A1A1A"
          strokeWidth="3"
        />
      </motion.svg>
    </div>
  );
}
