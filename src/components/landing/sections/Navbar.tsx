"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MagneticButton from "../ui/MagneticButton";
import { LogoHorizontal } from "../ui/Logo";

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
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
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

  useEffect(() => {
    const idx = navItems.findIndex((i) => i.href.slice(1) === activeSection);
    const el = linkRefs.current[idx];
    if (el) {
      const parent = el.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        setIndicatorStyle({
          left: elRect.left - parentRect.left + elRect.width / 2 - 4,
          width: 8,
        });
      }
    }
  }, [activeSection]);

  const isActive = (href: string) => activeSection === href.slice(1);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] md:w-[85%] max-w-[1280px]"
    >
      <motion.div
        animate={{
          height: scrolled ? 52 : 58,
          boxShadow: scrolled
            ? "0 3px 0 0 #1A1A1A, 0 8px 24px rgba(0,0,0,0.06)"
            : "0 5px 0 0 #1A1A1A",
        }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className={`rounded-[26px] border-3 border-ink transition-all duration-250 ${
          scrolled
            ? "bg-white/85 backdrop-blur-xl"
            : "bg-white"
        }`}
      >
        <div className="flex items-center justify-between h-full px-5 md:px-7">
          <a href="#" className="flex items-center flex-shrink-0">
            <LogoHorizontal size="sm" />
          </a>

          <nav className="hidden md:flex items-center gap-10 lg:gap-14 relative">
            {navItems.map((item, i) => (
              <a
                key={item.href}
                ref={(el) => { linkRefs.current[i] = el; }}
                href={item.href}
                className={`group relative text-[13px] font-semibold tracking-[-0.01em] py-1 transition-all duration-250 ${
                  isActive(item.href)
                    ? "text-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {item.label}
                <span
                  className={`absolute left-0 right-0 bottom-0 h-[2px] bg-accent-purple rounded-full origin-left transition-transform duration-250 ease-out ${
                    isActive(item.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </a>
            ))}
            <motion.div
              animate={indicatorStyle}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute -bottom-[11px] h-[6px] w-[8px] bg-accent-purple"
              style={{ borderRadius: "50%" }}
            />
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <MagneticButton onClick={onSignIn}
              variant="secondary"
              className="!text-[12.5px] !px-[18px] !py-[7px] !font-semibold !border-2 !shadow-[0_2px_0_0_#1A1A1A] !rounded-xl"
            >
              Sign in
            </MagneticButton>
            <MagneticButton onClick={onGetStarted}
              variant="primary"
              className="!text-[13px] !px-[22px] !py-[8px] !font-bold !rounded-xl"
            >
              Start Collaborating
            </MagneticButton>
          </div>

          <button
            aria-label="Menu"
            className="md:hidden w-9 h-9 rounded-xl border-2 border-ink bg-white flex items-center justify-center flex-shrink-0"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <div className="w-4 h-3.5 flex flex-col justify-between">
              <span
                className={`block h-[2px] bg-ink rounded-full transition-all duration-250 ${
                  mobileOpen ? "rotate-45 translate-y-[5px]" : ""
                }`}
              />
              <span
                className={`block h-[2px] bg-ink rounded-full transition-all duration-250 ${
                  mobileOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-[2px] bg-ink rounded-full transition-all duration-250 ${
                  mobileOpen ? "-rotate-45 -translate-y-[6px]" : ""
                }`}
              />
            </div>
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden border-t-2 border-ink overflow-hidden"
            >
              <div className="px-6 py-4 flex flex-col gap-2">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`text-[14px] font-semibold px-3 py-2 rounded-xl transition-colors duration-200 ${
                      isActive(item.href)
                        ? "text-ink bg-pastel-purple"
                        : "text-ink-soft hover:text-ink hover:bg-paper"
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="pt-3 mt-2 border-t-2 border-ink/10 flex flex-col gap-2">
                  <MagneticButton onClick={onSignIn}
                    variant="secondary"
                    className="flex-1 !justify-center !text-[13px] !border-2 !rounded-xl"
                  >
                    Sign in
                  </MagneticButton>
                  <MagneticButton onClick={onGetStarted}
                    variant="primary"
                    className="flex-1 !justify-center !text-[13px] !rounded-xl"
                  >
                    Start Collaborating
                  </MagneticButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.header>
  );
}
