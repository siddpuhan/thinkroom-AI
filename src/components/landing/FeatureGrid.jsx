'use client';

import React from 'react';
import { motion } from 'framer-motion';

const FeatureGrid = () => {
  const features = [
    { title: 'Live Cursors', desc: 'See who is editing what, exactly when they do it.', bg: 'var(--lp-pastel-yellow)', colSpan: 2 },
    { title: 'Smart Comments', desc: 'Leave context-aware feedback right where it matters.', bg: 'var(--lp-pastel-pink)', colSpan: 1 },
    { title: 'Version Control', desc: 'Roll back changes with zero hassle.', bg: 'var(--lp-pastel-purple)', colSpan: 1 },
    { title: 'AI Assistant', desc: 'Your personal AI pair programmer inside the canvas.', bg: 'var(--lp-pastel-green)', colSpan: 2 },
    { title: 'Instant Export', desc: 'Share your work anywhere in seconds.', bg: 'var(--lp-pastel-orange)', colSpan: 1 },
    { title: 'Custom Themes', desc: 'Make the workspace truly yours.', bg: 'var(--lp-pastel-blue)', colSpan: 2 }
  ];

  return (
    <section className="lp-section bg-cream">
      <div className="lp-container">
        <div className="lp-section-header">
          <span className="lp-label">Features</span>
          <h2 className="lp-heading">Everything you need</h2>
        </div>
        
        <div className="lp-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '3rem' }}>
          {features.map((feature, i) => (
            <motion.div key={i} className="lp-tr-card" whileHover={{ y: -5 }} style={{ backgroundColor: feature.bg, border: '4px solid black', boxShadow: '8px 8px 0px black', padding: '2rem', borderRadius: '16px', gridColumn: `span ${feature.colSpan}` }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '1rem' }}>{feature.title}</h3>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
