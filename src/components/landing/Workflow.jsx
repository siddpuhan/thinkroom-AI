'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Workflow() {
  return (
    <section className='lp-section bg-yellow'>
      <div className="lp-header-container">
        <span className="lp-label">How it Works</span>
        <h2 className="lp-heading">Three steps to organized knowledge</h2>
      </div>
      <div className="lp-hiw-grid">
        <div className="lp-tr-card bg-cream">
          <img className="lp-hiw-img" src="/images/hiw_join_room.jpg" alt="Join Room" />
          <h3 className="lp-tr-card-title">Join Room</h3>
          <p className="lp-tr-card-desc">Open the door to a colorful collaboration space.</p>
        </div>
        <div className="lp-tr-card bg-cream">
          <img className="lp-hiw-img" src="/images/hiw_discuss.jpg" alt="Discuss" />
          <h3 className="lp-tr-card-title">Discuss</h3>
          <p className="lp-tr-card-desc">Have natural conversations on giant speech bubbles.</p>
        </div>
        <div className="lp-tr-card bg-cream">
          <img className="lp-hiw-img" src="/images/hiw_organize.jpg" alt="AI Organizes" />
          <h3 className="lp-tr-card-title">AI Organizes</h3>
          <p className="lp-tr-card-desc">A cute robot sorts everything into neat folders.</p>
        </div>
      </div>
    </section>
  );
}
