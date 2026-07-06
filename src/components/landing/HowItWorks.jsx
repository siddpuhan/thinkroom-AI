"use client";
import React from 'react';

const HowItWorks = () => {
  return (
    <section className="lp-howitworks" id="how-it-works">
      <div className="lp-hiw-container">
        <h2 className="massive-header">How it works</h2>
        
        <div className="lp-hiw-steps">
          <div className="lp-hiw-step">
            <div className="lp-hiw-num text-primary">01</div>
            <div className="lp-hiw-content underline-primary">
              <h4>Open the app</h4>
              <p>The Progressive Web App works instantly without a traditional app store download during emergencies.</p>
            </div>
          </div>
          
          <div className="lp-hiw-step">
            <div className="lp-hiw-num text-white">02</div>
            <div className="lp-hiw-content underline-white">
              <h4>Connect with nearby users</h4>
              <p>Your device automatically searches for and bridges with other active nodes in the vicinity.</p>
            </div>
          </div>
          
          <div className="lp-hiw-step">
            <div className="lp-hiw-num text-primary">03</div>
            <div className="lp-hiw-content underline-primary">
              <h4>Send and receive messages</h4>
              <p>Encrypted packets are routed through the mesh network to their intended recipients.</p>
            </div>
          </div>
          
          <div className="lp-hiw-step">
            <div className="lp-hiw-num text-white">04</div>
            <div className="lp-hiw-content underline-white">
              <h4>Data syncs when internet is available</h4>
              <p>Automatic global uplink happens the moment any bridge to the internet is established.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
