'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'chat', label: 'Chat', color: 'bg-yellow' },
  { id: 'workspace', label: 'Workspace', color: 'bg-pink' },
  { id: 'tasks', label: 'Tasks', color: 'bg-blue' },
  { id: 'notes', label: 'Notes', color: 'bg-green' },
  { id: 'documents', label: 'Documents', color: 'bg-yellow' },
  { id: 'catch-me-up', label: 'Catch Me Up', color: 'bg-purple' }
];

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState('chat');
  const activeColor = TABS.find(t => t.id === activeTab)?.color || 'bg-yellow';
  const activeLabel = TABS.find(t => t.id === activeTab)?.label || 'Chat';

  return (
    <section className="lp-section bg-green" id="showcase">
      <div className="lp-container">
        <header className="lp-section-header">
          <span className="lp-label bg-white">Interactive</span>
          <h2 className="lp-heading-2">See it in action</h2>
        </header>
        
        <div className="lp-showcase-layout">
          <div className="lp-showcase-nav">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`lp-showcase-tab ${activeTab === tab.id ? 'active' : ''}`}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '1rem 1.5rem',
                  marginBottom: '1rem',
                  border: '4px solid #000',
                  borderRadius: '8px',
                  backgroundColor: activeTab === tab.id ? '#000' : '#fff',
                  color: activeTab === tab.id ? '#fff' : '#000',
                  boxShadow: activeTab === tab.id ? 'none' : '4px 4px 0px #000',
                  transform: activeTab === tab.id ? 'translate(4px, 4px)' : 'none',
                  fontWeight: '900',
                  fontSize: '1.25rem',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease-in-out'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="lp-browser-mockup" style={{
            border: '8px solid #000',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#fff',
            boxShadow: '12px 12px 0px #000',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '500px'
          }}>
            <div className="lp-browser-header bg-white" style={{
              borderBottom: '4px solid #000',
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
            }}>
              <div className="lp-browser-dots" style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#ff5f56', border: '2px solid #000' }}></div>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#ffbd2e', border: '2px solid #000' }}></div>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#27c93f', border: '2px solid #000' }}></div>
              </div>
              <div className="lp-browser-url bg-gray" style={{
                flex: 1,
                border: '2px solid #000',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                backgroundColor: '#f3f4f6'
              }}>
                app.thinkroom.ai/{activeTab}
              </div>
            </div>

            <div className={`lp-browser-body ${activeColor}`} style={{
              flex: 1,
              padding: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.3s ease'
            }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="bg-white"
                  style={{
                    border: '4px solid #000',
                    boxShadow: '8px 8px 0px #000',
                    padding: '3rem 2rem',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '400px',
                    textAlign: 'center'
                  }}
                >
                  <h3 className="lp-heading-3" style={{ fontSize: '2.5rem', marginBottom: '1rem', textTransform: 'uppercase' }}>
                    {activeLabel}
                  </h3>
                  <p style={{ fontWeight: 'bold', fontSize: '1.25rem', lineHeight: '1.5' }}>
                    Experience the dynamic features of {activeLabel} in action!
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
