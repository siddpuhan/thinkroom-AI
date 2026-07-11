"use client";
import { motion } from "framer-motion";
import { JoinRoomIllustration, DiscussIllustration, AIOrganizesIllustration } from "../ui/Illustrations";
import WavySeparator from "../ui/WavySeparator";

const steps = [
  {
    title: "Join a Room",
    desc: "Create or join a ThinkRoom. Invite your team. Start chatting like you always do.",
    illustration: JoinRoomIllustration,
    color: "bg-pastel-blue",
  },
  {
    title: "Discuss Naturally",
    desc: "Talk about ideas, plans, and decisions. Our AI listens and understands context.",
    illustration: DiscussIllustration,
    color: "bg-pastel-purple",
  },
  {
    title: "AI Organizes Everything",
    desc: "Tasks, notes, and documents appear in your workspace. No prompts needed.",
    illustration: AIOrganizesIllustration,
    color: "bg-pastel-green",
  },
];

export default function HowItWorks() {
  return (
    <>
      <WavySeparator color="#FFFDF7" />
      <section id="how-it-works" className="tr-section-padding">
        <div className="tr-container-wide">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full border-2 border-ink bg-pastel-orange text-[12px] font-bold mb-4">
              Simple as chat
            </span>
            <h2 className="tr-heading-lg">
              Three steps to
              <br />
              organized work.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={`tr-card overflow-hidden ${step.color} group cursor-pointer`}
              >
                <div className="p-8 pb-0">
                  <step.illustration className="w-full max-w-[200px] mx-auto" />
                </div>
                <div className="p-8 pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 rounded-lg border-2 border-ink bg-white flex items-center justify-center text-sm font-black text-ink">
                      {i + 1}
                    </span>
                    <h3 className="tr-heading-sm">{step.title}</h3>
                  </div>
                  <p className="text-[15px] font-medium text-ink-soft leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
