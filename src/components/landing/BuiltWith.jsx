'use client';

import React from 'react';
import { motion } from 'framer-motion';

const BuiltWith = () => {
  return (
    <section className="lp-section bg-cream">
      <div className="lp-container">
        <div className="lp-section-header">
          <span className="lp-label">Tech Stack</span>
          <h2 className="lp-heading">Powered by modern tools</h2>
        </div>
        
        <div className="lp-tech-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginTop: '3rem' }}>
          <motion.div whileHover={{ scale: 1.05 }} className="lp-tech-pill" style={{ backgroundColor: 'var(--lp-pastel-yellow)', padding: '1rem 2rem', borderRadius: '50px', border: '3px solid black', boxShadow: '4px 4px 0px black', fontSize: '1.25rem', fontWeight: 'bold' }}>
            Next.js
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="lp-tech-pill" style={{ backgroundColor: 'var(--lp-pastel-blue)', padding: '1rem 2rem', borderRadius: '50px', border: '3px solid black', boxShadow: '4px 4px 0px black', fontSize: '1.25rem', fontWeight: 'bold' }}>
            React
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="lp-tech-pill" style={{ backgroundColor: 'var(--lp-pastel-green)', padding: '1rem 2rem', borderRadius: '50px', border: '3px solid black', boxShadow: '4px 4px 0px black', fontSize: '1.25rem', fontWeight: 'bold' }}>
            Socket.IO
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="lp-tech-pill" style={{ backgroundColor: 'var(--lp-pastel-pink)', padding: '1rem 2rem', borderRadius: '50px', border: '3px solid black', boxShadow: '4px 4px 0px black', fontSize: '1.25rem', fontWeight: 'bold' }}>
            Supabase
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="lp-tech-pill" style={{ backgroundColor: 'var(--lp-pastel-purple)', padding: '1rem 2rem', borderRadius: '50px', border: '3px solid black', boxShadow: '4px 4px 0px black', fontSize: '1.25rem', fontWeight: 'bold' }}>
            PostgreSQL
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="lp-tech-pill" style={{ backgroundColor: 'var(--lp-pastel-orange)', padding: '1rem 2rem', borderRadius: '50px', border: '3px solid black', boxShadow: '4px 4px 0px black', fontSize: '1.25rem', fontWeight: 'bold' }}>
            Groq
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BuiltWith;
