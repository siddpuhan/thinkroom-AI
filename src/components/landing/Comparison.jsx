'use client';

import React from 'react';
import { motion } from 'framer-motion';

const Comparison = () => {
  return (
    <section className="lp-section bg-orange">
      <div className="lp-container">
        <div className="lp-section-header">
          <span className="lp-label">Comparison</span>
          <h2 className="lp-heading">Without vs With</h2>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '3rem' }}>
          <motion.div className="lp-tr-card bg-cream" whileHover={{ y: -5 }} style={{ border: '4px solid black', boxShadow: '8px 8px 0px black', padding: '2rem', borderRadius: '12px' }}>
            <h3 style={{ color: 'red', fontSize: '2rem', fontWeight: '900', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Without ThinkRoom</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li>❌ Endless email threads</li>
              <li>❌ Lost context & ideas</li>
              <li>❌ Scattered feedback</li>
              <li>❌ Disconnected tools</li>
              <li>❌ Slow iteration cycles</li>
            </ul>
          </motion.div>
          
          <motion.div className="lp-tr-card bg-green" whileHover={{ y: -5 }} style={{ border: '4px solid black', boxShadow: '8px 8px 0px black', padding: '2rem', borderRadius: '12px' }}>
            <h3 style={{ color: 'black', fontSize: '2rem', fontWeight: '900', marginBottom: '1.5rem', textTransform: 'uppercase' }}>With ThinkRoom</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li>✅ Real-time collaboration</li>
              <li>✅ Centralized knowledge</li>
              <li>✅ Contextual discussions</li>
              <li>✅ All-in-one workspace</li>
              <li>✅ Lightning fast delivery</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Comparison;
