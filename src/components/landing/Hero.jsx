"use client";
import React from 'react';

const Hero = ({ onEnterChat, onEnterResources }) => {
  return (
    <section className="lp-hero brutalist-grid">
      <div className="lp-hero-inner">
        <div className="lp-signal-status">
          SIGNAL STATUS: CRITICAL
        </div>
        <h1 className="lp-hero-title massive-header">
          Communicate when<br />
          <span className="text-primary">everything else</span><br />
          fails
        </h1>
        <p className="lp-hero-subtitle">
          When disasters take down networks, ThinkRoom AI keeps people connected using offline-first technology.
        </p>
        <div className="lp-hero-actions">
          <button className="lp-hero-btn lp-hero-btn-primary" onClick={onEnterChat}>
            Request Help
          </button>
          <button className="lp-hero-btn lp-hero-btn-dark" onClick={onEnterResources}>
            Offer Help
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
