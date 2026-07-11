'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Transformation() {
  return (
    <section className='lp-section bg-cream'>
      <div className="lp-header-container">
        <span className="lp-label">The Magic</span>
        <h2 className="lp-heading">From Conversation to Knowledge</h2>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', marginTop: '3rem' }}>
        
        {/* Input */}
        <div className="lp-tr-card bg-blue" style={{ padding: '2rem', maxWidth: '400px', textAlign: 'center' }}>
          <h3 className="lp-tr-card-title" style={{ color: 'white' }}>Chat Message</h3>
          <p className="lp-tr-card-desc" style={{ color: 'white', fontWeight: 'bold' }}>"We need to update the landing page design by Friday."</p>
        </div>

        {/* Arrow */}
        <motion.svg 
          width="50" height="100" viewBox="0 0 50 100" fill="none" xmlns="http://www.w3.org/2000/svg"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse' }}
        >
          <path d="M25 0V90M25 90L10 75M25 90L40 75" stroke="black" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        </motion.svg>

        {/* Output Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '500px' }}>
          <div className="lp-tr-card bg-yellow" style={{ padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: '900', fontSize: '1.2rem' }}>Task</h4>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Update landing page</p>
          </div>
          <div className="lp-tr-card bg-purple" style={{ padding: '1.5rem', color: 'white' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: '900', fontSize: '1.2rem' }}>Note</h4>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Design due Friday</p>
          </div>
          <div className="lp-tr-card bg-green" style={{ padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: '900', fontSize: '1.2rem' }}>Doc</h4>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Design specs</p>
          </div>
          <div className="lp-tr-card bg-pink" style={{ padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: '900', fontSize: '1.2rem' }}>Summary</h4>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Action items generated</p>
          </div>
        </div>

      </div>
    </section>
  );
}
