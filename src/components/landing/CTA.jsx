'use client';

import React from 'react';

export default function CTA() {
  return (
    <section className="lp-section bg-pink">
      <div className="lp-container">
        <div className="lp-cta-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '2rem', padding: '4rem 0' }}>
          <img 
            src="/images/cta_mascot.jpg" 
            alt="Mascot waving" 
            style={{ 
              maxWidth: '300px', 
              borderRadius: '50%', 
              border: 'var(--lp-border-width) solid var(--lp-border)',
              boxShadow: 'var(--lp-shadow-md)'
            }} 
          />
          <h2 className="lp-tr-heading-lg" style={{ maxWidth: '800px', margin: '0 auto' }}>Ready to stop losing conversations?</h2>
          <button className="lp-btn lp-tr-btn-primary lp-btn-lg">Start Collaborating</button>
        </div>
      </div>
    </section>
  );
}
