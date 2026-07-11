"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar({ onSignIn, onGetStarted }: { onSignIn?: () => void; onGetStarted?: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("product");
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [logoHovered, setLogoHovered] = useState(false);
  const [ctaHovered, setCtaHovered] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const ids = navItems.map((i) => i.href.slice(1));
      for (const id of ids.reverse()) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => activeSection === href.slice(1);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-48px)] max-w-[1400px]"
    >
      <motion.nav
        animate={{
          height: scrolled ? 64 : 72,
          boxShadow: scrolled
            ? "0 8px 32px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)"
            : "0 4px 16px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between w-full h-full px-8 md:px-10 rounded-[999px]"
        style={{
              background: "#B084D7",
          border: "1.5px solid rgba(26, 26, 26, 0.15)",
          boxShadow: scrolled
            ? "0 8px 32px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)"
            : "0 4px 16px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        {/* Logo */}
        <a
          href="#"
          className="flex items-center gap-3 flex-shrink-0 group outline-none focus:outline-none"
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
        >
          <motion.div
            animate={{ rotate: logoHovered ? -6 : 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-5 h-5 md:w-6 md:h-6 rounded-[8px] bg-[#1A1A1A] flex items-center justify-center flex-shrink-0"
          >
            <span className="text-[#B084D7] text-[11px] md:text-[13px] font-bold">T</span>
          </motion.div>
          <span className="text-[17px] md:text-[19px] font-bold tracking-[-0.03em] text-[#1A1A1A]">
            ThinkRoom
            <span className="text-[#1A1A1A]/50 text-[13px] md:text-[15px] font-semibold ml-[2px]">AI</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 relative h-full">
          {navItems.map((item, i) => (
            <a
              key={item.href}
              ref={(el) => { linkRefs.current[i] = el; }}
              href={item.href}
              className="group relative px-4 py-1.5 rounded-full text-sm font-medium tracking-[-0.01em] transition-all duration-250 outline-none focus:outline-none"
              style={{
                color: isActive(item.href) ? "#1A1A1A" : "rgba(26, 26, 26, 0.55)",
              }}
            >
              {isActive(item.href) && (
                <motion.span
                  layoutId="navPill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: "rgba(26, 26, 26, 0.07)" }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                />
              )}
              <span className="relative z-[1] block group-hover:-translate-y-[1.5px] transition-transform duration-200">
                {item.label}
              </span>
              <span
                className="absolute left-1/2 bottom-[2px] h-[2px] rounded-full -translate-x-1/2 transition-all duration-250"
                style={{
                  background: "rgba(26, 26, 26, 0.3)",
                  width: isActive(item.href) ? "0" : "0",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.width = "60%";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.width = "0";
                  }
                }}
              />
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={onSignIn}
            className="text-sm font-semibold text-[rgba(26,26,26,0.55)] px-5 py-2 rounded-full transition-all duration-200 outline-none focus:outline-none hover:text-[#1A1A1A] hover:bg-[rgba(26,26,26,0.06)] hover:-translate-y-[1px] active:translate-y-0"
          >
            Sign in
          </button>
          <motion.button
            onClick={onGetStarted}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="text-sm font-semibold text-[#1A1A1A] px-[22px] py-[10px] rounded-full transition-all duration-200 outline-none focus:outline-none"
            style={{
              background: "#FEFCF3",
              boxShadow: ctaHovered
                ? "0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)"
                : "0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
          >
            <span className="flex items-center gap-[6px]">
              Start Collaborating
              <motion.svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="mt-[1px]"
                animate={{ x: ctaHovered ? 4 : 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </motion.svg>
            </span>
          </motion.button>
        </div>

        {/* Mobile hamburger */}
        <button
          aria-label="Menu"
          className="md:hidden w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 outline-none focus:outline-none hover:bg-[rgba(26,26,26,0.06)]"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <div className="w-[18px] h-3.5 flex flex-col justify-between">
            <span className={`block h-[2px] rounded-full bg-[#1A1A1A] transition-all duration-250 ${mobileOpen ? "rotate-45 translate-y-[5.5px]" : ""}`} />
            <span className={`block h-[2px] rounded-full bg-[#1A1A1A] transition-all duration-250 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-[2px] rounded-full bg-[#1A1A1A] transition-all duration-250 ${mobileOpen ? "-rotate-45 -translate-y-[6.5px]" : ""}`} />
          </div>
        </button>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden mt-2 rounded-[24px] overflow-hidden"
            style={{
          background: "#B084D7",
              border: "1.5px solid rgba(26, 26, 26, 0.15)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            }}
          >
            <div className="px-5 py-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium px-3 py-2.5 rounded-xl transition-colors duration-200 outline-none focus:outline-none"
                  style={{
                    color: isActive(item.href) ? "#1A1A1A" : "rgba(26,26,26,0.55)",
                    background: isActive(item.href) ? "rgba(26,26,26,0.07)" : "transparent",
                  }}
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-3 mt-2 border-t border-[rgba(26,26,26,0.08)] flex flex-col gap-2">
                <button
                  onClick={onSignIn}
                  className="text-sm font-semibold py-2.5 px-3 rounded-xl text-[rgba(26,26,26,0.55)] hover:text-[#1A1A1A] transition-colors duration-200 text-left outline-none focus:outline-none"
                >
                  Sign in
                </button>
                <button
                  onClick={onGetStarted}
                  className="text-sm font-semibold text-[#1A1A1A] py-3 px-4 rounded-xl text-center transition-all duration-200 outline-none focus:outline-none"
                  style={{
                    background: "#FEFCF3",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  Start Collaborating
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
