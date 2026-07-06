"use client";
import React from 'react';

const Solution = () => {
  return (
    <section className="lp-solution" id="solution">
      <div className="lp-solution-grid">
        <div className="lp-solution-header">
          <h2 className="massive-header">Stay connected, even offline</h2>
        </div>
        
        <div className="lp-solution-card bg-primary text-black">
          <span className="material-symbols-outlined">wifi_off</span>
          <h3 className="massive-header">Send messages without internet</h3>
          <p>Your messages move through the mesh network even when the world goes dark.</p>
        </div>
        
        <div className="lp-solution-card bg-black text-white">
          <span className="material-symbols-outlined text-primary">share_reviews</span>
          <h3 className="massive-header">Connect directly with nearby devices</h3>
          <p>Devices form an ad-hoc local network using Bluetooth and Wi-Fi Direct protocols.</p>
        </div>
        
        <div className="lp-solution-card bg-white text-black">
          <span className="material-symbols-outlined">save</span>
          <h3 className="massive-header">Store data locally on your device</h3>
          <p>Encrypted local storage ensures your data persists even if power or signal is lost.</p>
        </div>
        
        <div className="lp-solution-card bg-primary text-black">
          <span className="material-symbols-outlined">sync</span>
          <h3 className="massive-header">Sync everything when network returns</h3>
          <p>As soon as one node finds a signal, the entire cluster updates the global status.</p>
        </div>
      </div>
    </section>
  );
};

export default Solution;
