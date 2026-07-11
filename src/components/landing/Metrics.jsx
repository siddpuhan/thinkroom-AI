'use client';

import React from 'react';
import { motion } from 'framer-motion';

const Metrics = () => {
  const metrics = [
    { icon: '🚀', title: '10x Faster', desc: 'Accelerate your team\'s workflow and delivery times.' },
    { icon: '💡', title: 'Infinite Ideas', desc: 'Never lose a brilliant thought with instant capture.' },
    { icon: '🤝', title: 'Seamless Sync', desc: 'Everyone stays on the same page, in real-time.' },
    { icon: '🔒', title: 'Enterprise Secure', desc: 'Your data is protected with bank-level security.' },
    { icon: '⚡', title: 'Instant Setup', desc: 'Get your entire team onboarded in under 5 minutes.' },
    { icon: '📈', title: 'Data Driven', desc: 'Make better decisions with integrated analytics.' }
  ];

  return (
    <section className="lp-section bg-blue">
      <div className="lp-container">
        <div className="lp-section-header" style={{ color: 'white' }}>
          <span className="lp-label" style={{ backgroundColor: 'var(--lp-pastel-yellow)', color: 'black' }}>Metrics</span>
          <h2 className="lp-heading">Built for real collaboration</h2>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
          {metrics.map((metric, i) => (
            <motion.div key={i} className="lp-tr-card bg-cream" whileHover={{ scale: 1.05 }} style={{ border: '3px solid black', boxShadow: '6px 6px 0px black', padding: '1.5rem', borderRadius: '12px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{metric.icon}</div>
              <h3 className="lp-tr-heading-sm" style={{ fontWeight: '900', marginBottom: '0.5rem', fontSize: '1.5rem' }}>{metric.title}</h3>
              <p className="lp-body" style={{ fontWeight: 'bold' }}>{metric.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Metrics;
