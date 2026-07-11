'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function AIPipeline() {
  return (
    <section className="lp-section bg-orange">
      <div className="lp-container">
        <header className="lp-section-header">
          <span className="lp-label bg-white">Architecture</span>
          <h2 className="lp-heading-2">The AI Pipeline</h2>
        </header>

        <div className="lp-pipeline-container" style={{ marginTop: '4rem', overflowX: 'auto', padding: '1rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '900px', gap: '1rem' }}>
            
            <motion.div 
              className="lp-tr-card bg-yellow"
              whileHover={{ y: -5, boxShadow: '8px 12px 0px #000' }}
              style={{ flex: 1, textAlign: 'center' }}
            >
              <h3 className="lp-heading-3">Message</h3>
            </motion.div>

            <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 20H55M55 20L40 5M55 20L40 35" stroke="black" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter"/>
            </svg>

            <motion.div 
              className="lp-tr-card bg-pink"
              whileHover={{ y: -5, boxShadow: '8px 12px 0px #000' }}
              style={{ flex: 1, textAlign: 'center' }}
            >
              <h3 className="lp-heading-3">Groq LLM</h3>
            </motion.div>

            <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 20H55M55 20L40 5M55 20L40 35" stroke="black" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter"/>
            </svg>

            <motion.div 
              className="lp-tr-card bg-blue"
              whileHover={{ y: -5, boxShadow: '8px 12px 0px #000' }}
              style={{ flex: 1, textAlign: 'center' }}
            >
              <h3 className="lp-heading-3">Tasks</h3>
            </motion.div>

            <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 20H55M55 20L40 5M55 20L40 35" stroke="black" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter"/>
            </svg>

            <motion.div 
              className="lp-tr-card bg-green"
              whileHover={{ y: -5, boxShadow: '8px 12px 0px #000' }}
              style={{ flex: 1, textAlign: 'center' }}
            >
              <h3 className="lp-heading-3">Notes</h3>
            </motion.div>

          </div>
        </div>

        <div className="lp-pipeline-steps" style={{ marginTop: '4rem' }}>
          <h3 className="lp-heading-3" style={{ marginBottom: '2rem' }}>Inside the AI</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            {['Context Retrieval', 'Intent Parsing', 'Tool Selection', 'Response Generation', 'State Update'].map((step, index) => (
              <motion.div 
                key={index}
                whileHover={{ scale: 1.05 }}
                className="bg-white"
                style={{
                  border: '4px solid #000',
                  borderRadius: '999px',
                  padding: '1rem 2rem',
                  fontWeight: '900',
                  boxShadow: '6px 6px 0px #000',
                  fontSize: '1.25rem',
                  textTransform: 'uppercase'
                }}
              >
                <span style={{ marginRight: '0.5rem', color: '#ff5f56' }}>0{index + 1}</span> {step}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
