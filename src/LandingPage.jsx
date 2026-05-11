import React, { useContext } from 'react';
import './LandingPage.css';
import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import Problem from './components/landing/Problem';
import Solution from './components/landing/Solution';
import HowItWorks from './components/landing/HowItWorks';
import UseCases from './components/landing/UseCases';
import Tech from './components/landing/Tech';
import Footer from './components/landing/Footer';
import ThemeContext from './context/ThemeContext';

const LandingPage = ({ onEnterChat, onEnterResources }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className={`lp-container ${theme}`}>
      <div className="scanline-overlay"></div>
      <Navbar onEnterChat={onEnterChat} onEnterResources={onEnterResources} />
      <main className="lp-main">
        <Hero onEnterChat={onEnterChat} onEnterResources={onEnterResources} />
        <Problem />
        <Solution />
        <HowItWorks />
        <UseCases />
        <Tech />
      </main>
      <Footer />
      <button 
        onClick={toggleTheme}
        className="theme-toggle"
        title="Toggle dark/light mode"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: theme === 'dark' ? '#fbbf24' : '#1e293b',
          color: theme === 'dark' ? '#1e293b' : '#fbbf24',
          fontSize: '1.5rem',
          cursor: 'pointer',
          zIndex: '1000',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );
};

export default LandingPage;
