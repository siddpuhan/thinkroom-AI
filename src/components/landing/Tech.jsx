import React from 'react';

const Tech = () => {
  return (
    <>
      <section className="lp-tech" id="tech">
        <div className="lp-tech-grid">
          <div className="lp-tech-title-box">
            <h2 className="massive-header">Built for extreme conditions</h2>
          </div>
          <div className="lp-tech-content">
            <p>
              Powered by Progressive Web Apps, IndexedDB, and peer-to-peer communication, ThinkRoom AI is designed to work when traditional systems fail.
            </p>
          </div>
        </div>
      </section>

      <section className="lp-cta">
        <div className="lp-cta-inner">
          <h2 className="massive-header">READY_SIGNAL</h2>
          <div className="lp-cta-buttons">
            <button className="lp-cta-btn lp-cta-btn-dark">
              GET PWA
            </button>
            <button className="lp-cta-btn lp-cta-btn-light">
              VIEW DOCS
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Tech;
