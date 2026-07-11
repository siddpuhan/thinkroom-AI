"use client";
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 400, damping: 28 });
  const springY = useSpring(y, { stiffness: 400, damping: 28 });

  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;
    if (window.innerWidth < 1024) return;

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };
    const handleEnter = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target?.closest('a, button, [data-cursor-hover]')) setIsHovering(true);
    };
    const handleLeave = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target?.closest('a, button, [data-cursor-hover]')) setIsHovering(false);
    };

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseover", handleEnter);
    document.addEventListener("mouseout", handleLeave);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", handleEnter);
      document.removeEventListener("mouseout", handleLeave);
    };
  }, [x, y, isVisible]);

  if (!isVisible) return null;

  return (
    <>
      <motion.div
        style={{ x: springX, y: springY }}
        className="fixed top-0 left-0 z-[9998] pointer-events-none hidden lg:block"
      >
        <motion.div
          animate={{ scale: isHovering ? 2.5 : 1, opacity: isHovering ? 0.9 : 0.6 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-ink"
        />
      </motion.div>
      <motion.div
        style={{ x, y }}
        className="fixed top-0 left-0 z-[9998] pointer-events-none hidden lg:block"
      >
        <motion.div
          animate={{ scale: isHovering ? 1.8 : 1 }}
          className="w-6 h-6 -ml-3 -mt-3 rounded-full border border-ink/30"
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
      </motion.div>
    </>
  );
}
