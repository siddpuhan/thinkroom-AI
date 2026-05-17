import React from 'react';

const Navbar = ({ onEnterChat, onEnterResources }) => {
  return (
    <nav className="lp-navbar">
      <div className="lp-brand">
        THINKROOM AI
      </div>
      <div className="lp-nav-links">
        <a className="lp-nav-link" href="#problem">PROBLEM</a>
        <a className="lp-nav-link" href="#solution">SOLUTION</a>
        <a className="lp-nav-link" href="#how-it-works">HOW IT WORKS</a>
        <a className="lp-nav-link" href="#tech">TECH</a>
      </div>
      <div className="lp-nav-buttons">
        <button className="lp-btn lp-btn-primary" onClick={onEnterChat}>SOS</button>
        <button className="lp-btn lp-btn-white" onClick={onEnterResources}>JOIN</button>
      </div>
    </nav>
  );
};

export default Navbar;
