'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function RealtimeDemo() {
  return (
    <section className='lp-section bg-purple'>
      <div className="lp-header-container">
        <span className="lp-label">Realtime</span>
        <h2 className="lp-heading">Instantly synced</h2>
      </div>
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '3rem' }}>
        <div className="lp-browser-mockup" style={{ width: '400px', maxWidth: '100%' }}>
          <div className="lp-browser-header">
            <div className="lp-browser-dots">
              <span></span><span></span><span></span>
            </div>
            <div className="lp-browser-url">thinkroom.ai/room/design</div>
          </div>
          <div className="lp-browser-body bg-cream" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="lp-tr-card bg-blue" style={{ alignSelf: 'flex-start', padding: '1rem', width: 'fit-content' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Let's talk about the new colors!</p>
            </div>
          </div>
        </div>

        <div className="lp-browser-mockup" style={{ width: '400px', maxWidth: '100%' }}>
          <div className="lp-browser-header">
            <div className="lp-browser-dots">
              <span></span><span></span><span></span>
            </div>
            <div className="lp-browser-url">thinkroom.ai/room/design</div>
          </div>
          <div className="lp-browser-body bg-cream" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="lp-tr-card bg-blue" style={{ alignSelf: 'flex-start', padding: '1rem', width: 'fit-content' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Let's talk about the new colors!</p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="lp-tr-card bg-yellow" style={{ alignSelf: 'flex-end', padding: '1rem', width: 'fit-content' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>I love the Neo-Brutalist look.</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
