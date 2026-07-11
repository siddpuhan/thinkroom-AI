"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WavySeparator from "../ui/WavySeparator";

const faqs = [
  {
    q: "How does ThinkRoom AI capture conversations?",
    a: "ThinkRoom AI listens to your team's realtime chat in your ThinkRoom. It processes every message using AI to extract tasks, decisions, action items, and key information — without any special commands or prompts.",
  },
  {
    q: "Do I need to change how my team communicates?",
    a: "Not at all. Just chat normally. ThinkRoom AI works silently in the background, organizing everything automatically. No new workflows, no training needed.",
  },
  {
    q: "What happens to my data?",
    a: "Your data stays private and secure. We use enterprise-grade encryption, and you retain full ownership. Never used for training third-party models.",
  },
  {
    q: "Can I integrate with existing tools?",
    a: "Yes! ThinkRoom AI integrates with Slack, Discord, Linear, Jira, Notion, and more. Connect your existing workflow and let AI enhance it.",
  },
  {
    q: "Is there a free tier?",
    a: "Yes. Start with our free tier that includes up to 5 team members and basic AI features. Upgrade when you need more power.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <>
      <WavySeparator color="#FFFDF7" />
      <section id="faq" className="tr-section-padding">
        <div className="tr-container-wide">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full border-2 border-ink bg-pastel-blue text-[12px] font-bold mb-4">
              Got questions?
            </span>
            <h2 className="tr-heading-lg">
              Frequently asked
              <br />
              questions.
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className={`tr-card overflow-hidden transition-all duration-300 ${
                  openIndex === i ? "shadow-[0_6px_0_0_#1A1A1A]" : ""
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left"
                >
                  <span className="text-[15px] md:text-[17px] font-bold text-ink pr-4">{faq.q}</span>
                  <motion.span
                    animate={{ rotate: openIndex === i ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-6 h-6 rounded-lg border-2 border-ink bg-paper flex items-center justify-center flex-shrink-0"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2v8M2 6h8" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 md:px-6 pb-5 md:pb-6">
                        <p className="text-[14px] md:text-[15px] font-medium text-ink-soft leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
