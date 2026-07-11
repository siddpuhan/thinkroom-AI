"use client";
import { motion } from "framer-motion";
import { LogoHorizontal } from "../ui/Logo";

const footerLinks = [
  { label: "Product", href: "#" },
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

const socials = [
  { label: "GitHub", icon: "GH", href: "#" },
  { label: "LinkedIn", icon: "LI", href: "#" },
  { label: "Email", icon: "@", href: "#" },
];

const techItems = ["Next.js", "Groq", "Supabase", "Socket.IO"];

function AnimatedWave() {
  return (
    <div className="relative w-full h-12 overflow-hidden -mb-1">
      <motion.svg
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="absolute w-full h-full"
        animate={{ x: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
      >
        <path
          d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z"
          fill="#FFFDF7"
          stroke="#1A1A1A"
          strokeWidth="2"
        />
      </motion.svg>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t-3 border-ink bg-white overflow-hidden">
      <AnimatedWave />

      <div className="tr-container-wide px-6 md:px-10 py-12 md:py-16">
        <div className="grid md:grid-cols-4 gap-10 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-1"
          >
            <a href="#" className="inline-block mb-3">
              <LogoHorizontal size="md" />
            </a>
            <p className="text-[13px] font-medium text-ink-muted leading-relaxed mb-4">
              Conversations become work. Automatically.
            </p>

            <div className="flex gap-2.5">
              {socials.map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  whileHover={{ y: -2 }}
                  className="w-9 h-9 rounded-xl border-2 border-ink bg-paper flex items-center justify-center text-[11px] font-bold text-ink hover:bg-pastel-blue hover:shadow-[0_2px_0_0_#1A1A1A] transition-all duration-200"
                  aria-label={s.label}
                >
                  {s.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="text-[11px] font-extrabold text-ink-muted mb-4 uppercase tracking-widest">Links</h4>
            <div className="flex flex-col gap-2.5">
              {footerLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="group relative text-[14px] font-bold text-ink-soft hover:text-ink transition-colors duration-200 w-fit"
                >
                  {link.label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-accent-purple rounded-full group-hover:w-full transition-all duration-250" />
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="text-[11px] font-extrabold text-ink-muted mb-4 uppercase tracking-widest">Legal</h4>
            <div className="flex flex-col gap-2.5">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="group relative text-[14px] font-bold text-ink-soft hover:text-ink transition-colors duration-200 w-fit"
                >
                  {item}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-accent-purple rounded-full group-hover:w-full transition-all duration-250" />
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="text-[11px] font-extrabold text-ink-muted mb-4 uppercase tracking-widest">Stack</h4>
            <div className="flex flex-wrap gap-2">
              {techItems.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded-lg border-2 border-ink bg-paper text-[10px] font-bold text-ink"
                >
                  {tech}
                </span>
              ))}
            </div>

            <div className="mt-5 p-3.5 rounded-2xl border-2 border-ink bg-pastel-green/20">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-2 h-2 rounded-full bg-accent-green"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <span className="text-[11px] font-bold text-ink">All systems operational</span>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 pt-6 border-t-2 border-ink/10 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-[11px] font-medium text-ink-muted">
            &copy; {new Date().getFullYear()} ThinkRoom AI. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="text-[11px] font-bold text-ink-muted hover:text-ink transition-colors duration-200 group"
            >
              Project Repository
              <span className="block max-w-0 group-hover:max-w-full h-0.5 bg-accent-purple rounded-full transition-all duration-250" />
            </a>
            <span className="text-ink-muted/40">·</span>
            <span className="text-[11px] font-medium text-ink-muted">
              Made with <motion.span
                className="inline-block"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                💜
              </motion.span>
            </span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
