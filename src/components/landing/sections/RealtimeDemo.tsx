"use client";
import { motion } from "framer-motion";
import { BrowserMockup, ChatBubble } from "../ui/Illustrations";
import WavySeparator from "../ui/WavySeparator";

export default function RealtimeDemo() {
  return (
    <>
      <WavySeparator color="#E5DEFF" />
      <section className="tr-section-padding bg-pastel-purple/40">
        <div className="tr-container-wide">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full border-2 border-ink bg-white text-[12px] font-bold mb-4">
              Real-time magic
            </span>
            <h2 className="tr-heading-lg">
              See it in
              <br />
              realtime.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <BrowserMockup className="w-full">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                  <span className="text-[10px] font-bold text-ink-muted">Alice</span>
                </div>
                <ChatBubble text="I think we should use serverless for this." color="#D6E8FF" />
                <ChatBubble text="Good point. Let me check the costs." color="#E5DEFF" align="right" />

                <motion.div
                  className="flex justify-start mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                >
                  <div className="px-3 py-2 rounded-2xl border-2 border-ink bg-pastel-yellow max-w-[200px]">
                    <p className="text-[11px] font-medium text-ink-soft italic">Typing...</p>
                  </div>
                </motion.div>
              </BrowserMockup>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <BrowserMockup className="w-full">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                  <span className="text-[10px] font-bold text-ink-muted">Bob</span>
                </div>
                <ChatBubble text="Serverless costs are reasonable at scale." color="#D8F5E3" />
                <ChatBubble text="Agreed. Let's go with it!" color="#E5DEFF" align="right" />

                <motion.div
                  className="mt-3 tr-card-sm p-3 bg-pastel-orange border-2 border-ink"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]">🤖</span>
                    <span className="text-[10px] font-bold text-ink">AI Task Created</span>
                  </div>
                  <p className="text-[10px] font-medium text-ink-soft mt-1">
                    Evaluate serverless cost for project
                  </p>
                </motion.div>
              </BrowserMockup>
            </motion.div>
          </div>

          <motion.div
            className="flex justify-center mt-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-ink bg-white shadow-[0_3px_0_0_#1A1A1A]">
              <motion.div
                className="w-3 h-3 rounded-full bg-accent-green"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <span className="text-[13px] font-bold text-ink">Socket connected · Realtime sync active</span>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
