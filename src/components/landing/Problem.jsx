"use client";
import React from 'react';

const Problem = () => {
  return (
    <section className="lp-problem" id="problem">
      <div className="lp-problem-content">
        <h2 className="massive-header lp-problem-title">
          When disaster strikes, communication breaks
        </h2>
        <div className="lp-problem-list">
          <div className="lp-problem-item">
            <span className="material-symbols-outlined" style={{ fontWeight: 900 }}>close</span> 
            NO INTERNET ACCESS
          </div>
          <div className="lp-problem-item">
            <span className="material-symbols-outlined" style={{ fontWeight: 900 }}>signal_cellular_off</span> 
            NO MOBILE SIGNAL
          </div>
          <div className="lp-problem-item">
            <span className="material-symbols-outlined" style={{ fontWeight: 900 }}>help_center</span> 
            NO WAY TO REACH HELP
          </div>
          <div className="lp-problem-item">
            <span className="material-symbols-outlined" style={{ fontWeight: 900 }}>dangerous</span> 
            CRITICAL INFORMATION GETS LOST
          </div>
        </div>
      </div>
      <div className="lp-problem-image">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvNqmLLE7MNlLUCJW1bwbN1D_Gef_hWreQdQcZftXBQqUfgBHxc9PlVuYMAUaLbKg8ftvL76eVfZnZJ6TShpwOvdfc1UZOwj1DJJN_lBG9eleTNN4iendcPRvfSZLBsfdQ3oIEzVcbvQQAi8y0KlrYAr3ixzXRdyq7J03x09dLCsNlNYCp_lUcF0PVtAu5keKyuLYPX8AI0Et9vKsfP57BrWnxxVsyLViCTffkm6k2AWrfWQIs8JyKxuDL4cyU8dyJo31c9IpD7Oia" 
          alt="Storm hitting a city" 
        />
        <div className="lp-problem-overlay"></div>
      </div>
    </section>
  );
};

export default Problem;
