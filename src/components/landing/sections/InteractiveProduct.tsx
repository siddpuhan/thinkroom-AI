"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrowserMockup, ChatBubble } from "../ui/Illustrations";
import WavySeparator from "../ui/WavySeparator";

const tabs = [
  { id: "chat", label: "Chat", color: "bg-pastel-blue" },
  { id: "workspace", label: "Workspace", color: "bg-pastel-purple" },
  { id: "tasks", label: "Tasks", color: "bg-pastel-orange" },
  { id: "notes", label: "Notes", color: "bg-pastel-yellow" },
  { id: "documents", label: "Documents", color: "bg-pastel-green" },
  { id: "catchmeup", label: "Catch Me Up", color: "bg-pastel-pink" },
];

const tabContent: Record<string, React.ReactNode> = {
  chat: (
    <div className="space-y-1">
      <ChatBubble text="Hey team, any ideas for the new feature?" color="#D6E8FF" />
      <ChatBubble text="Yeah! What if we add realtime collab?" color="#E5DEFF" align="right" />
      <ChatBubble text="Love that. Let me sketch a mockup..." color="#D6E8FF" />
      <ChatBubble text="AI just created tasks from this thread 🚀" color="#D8F5E3" align="right" />
    </div>
  ),
  workspace: (
    <div className="grid grid-cols-2 gap-2">
      {["Sprint Planning", "Feature Ideas", "Bug Triage", "Roadmap"].map((item) => (
        <div key={item} className="tr-card-sm p-3 flex items-center gap-2 cursor-pointer hover:bg-pastel-blue/30 transition-colors">
          <div className="w-6 h-6 rounded-lg border-2 border-ink bg-pastel-purple flex items-center justify-center text-[8px] font-bold">W</div>
          <span className="text-[11px] font-bold">{item}</span>
        </div>
      ))}
    </div>
  ),
  tasks: (
    <div className="space-y-2">
      {[
        { text: "Design new landing page", done: true },
        { text: "Implement realtime sync", done: false },
        { text: "Write API documentation", done: false },
        { text: "Review PR #234", done: true },
      ].map((task) => (
        <div key={task.text} className="flex items-center gap-2 p-2 rounded-xl border-2 border-ink">
          <div className={`w-4 h-4 rounded-full border-2 border-ink flex items-center justify-center ${task.done ? "bg-accent-green" : "bg-white"}`}>
            {task.done && <span className="text-[8px] text-white font-bold">✓</span>}
          </div>
          <span className={`text-[11px] font-semibold ${task.done ? "line-through text-ink-muted" : "text-ink"}`}>
            {task.text}
          </span>
        </div>
      ))}
    </div>
  ),
  notes: (
    <div className="space-y-2">
      {[
        { title: "Sprint Retro Notes", snippets: "Action items, feedback...", color: "bg-pastel-yellow" },
        { title: "Architecture Decision", snippets: "We chose Supabase for...", color: "bg-pastel-blue" },
        { title: "Customer Interview", snippets: "Key pain points...", color: "bg-pastel-green" },
      ].map((note) => (
        <div key={note.title} className={`tr-card-sm p-3 ${note.color} cursor-pointer hover:-translate-y-0.5 transition-transform`}>
          <div className="text-[11px] font-bold">{note.title}</div>
          <div className="text-[9px] font-medium text-ink-muted mt-0.5">{note.snippets}</div>
        </div>
      ))}
    </div>
  ),
  documents: (
    <div className="space-y-2">
      {[
        { title: "Q2 Product Roadmap", pages: 12, color: "bg-pastel-orange" },
        { title: "Engineering Guide", pages: 34, color: "bg-pastel-purple" },
        { title: "Design System", pages: 28, color: "bg-pastel-blue" },
      ].map((doc) => (
        <div key={doc.title} className="flex items-center gap-3 p-3 rounded-xl border-2 border-ink">
          <div className={`w-8 h-10 rounded-lg ${doc.color} border-2 border-ink flex items-center justify-center text-[8px] font-bold`}>
            PDF
          </div>
          <div>
            <div className="text-[11px] font-bold">{doc.title}</div>
            <div className="text-[9px] font-medium text-ink-muted">{doc.pages} pages</div>
          </div>
        </div>
      ))}
    </div>
  ),
  catchmeup: (
    <div className="tr-card-sm p-4 bg-pastel-pink">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-lg bg-accent-purple border-2 border-ink flex items-center justify-center text-[7px] text-white font-bold">AI</div>
        <span className="text-[11px] font-bold">Catch Me Up</span>
      </div>
      <div className="text-[10px] font-medium text-ink-soft leading-relaxed">
        Since your last visit: 23 new messages, 5 tasks created, 3 documents updated. Key decision: Team agreed on Supabase for backend.
      </div>
    </div>
  ),
};

export default function InteractiveProduct() {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <>
      <WavySeparator color="#FEFCF3" />
      <section id="product" className="tr-section-padding bg-ivory">
        <div className="tr-container-wide">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full border-2 border-ink bg-pastel-green text-[12px] font-bold mb-4">
              See it in action
            </span>
            <h2 className="tr-heading-lg">
              Everything you need
              <br />
              in one workspace.
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl border-2 border-ink text-[13px] font-bold transition-all ${
                    activeTab === tab.id
                      ? `${tab.color} shadow-[0_3px_0_0_#1A1A1A]`
                      : "bg-white hover:bg-paper"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <BrowserMockup className="max-w-[600px] mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {tabContent[activeTab]}
                </motion.div>
              </AnimatePresence>
            </BrowserMockup>
          </div>
        </div>
      </section>
    </>
  );
}
