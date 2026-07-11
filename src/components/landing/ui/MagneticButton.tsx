"use client";
import { motion, useMotionValue, useSpring } from "framer-motion";
import React, { useRef } from "react";

type Props = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  onClick?: () => void;
  href?: string;
};

export default function MagneticButton({ children, variant = "primary", className = "", href, onClick }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMove = (e: React.MouseEvent) => {
    const el = buttonRef.current || anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = 120;
    if (dist < radius) {
      x.set(dx * 0.2);
      y.set(dy * 0.2);
    }
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const baseStyles =
    variant === "primary"
      ? "bg-accent-purple text-white tr-btn-primary"
      : "bg-white text-ink tr-btn-secondary";

  const content = (
    <motion.span
      style={{ x: springX, y: springY }}
      className={`relative inline-flex items-center justify-center font-bold ${baseStyles} ${className}`}
    >
      {children}
    </motion.span>
  );

  if (href) {
    return (
      <motion.a
        ref={anchorRef}
        href={href}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="group relative inline-block cursor-pointer select-none"
        whileTap={{ scale: 0.97 }}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={buttonRef}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group relative inline-block cursor-pointer select-none"
      whileTap={{ scale: 0.97 }}
    >
      {content}
    </motion.button>
  );
}
