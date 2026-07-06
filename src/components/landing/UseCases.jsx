"use client";
import React from 'react';

const UseCases = () => {
  return (
    <section className="lp-usecases">
      <div className="lp-uc-header">
        <h2 className="massive-header">Where it helps</h2>
      </div>
      <div className="lp-uc-grid">
        <div className="lp-uc-card">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2fKB3mZ1IeDEXQ-goi8Eiy1oTImL382aE3-74r24Yr806OUYShhUI0VgLKfGyCPAXjjeHQE_gQ5fczd4KKxK12hJK9inE1ph5hZxK-csu5OCjaWH8aKK5pokwjLuZm_oHi2vPu84G9_ck1sBAgZ0ofCXO6LT6FhuC-HfwwIMSX7_md8wBmflJwPe9Ce0RmxCAkY4pj_BTb-TE0ayXoGVuB5yksapz4FAIGSQJpIdwwXo_fXw1HjJOWGKMOu9Nx_0dBH5UvNU5_u51" 
            alt="Flooding" 
          />
          <div className="lp-uc-overlay bg-primary"></div>
          <div className="lp-uc-text">
            <h5 className="massive-header">Flood-affected areas</h5>
          </div>
        </div>
        
        <div className="lp-uc-card">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZyOvIfNs9OHS1227Nl-48HxFNRnEh9YI31d34zA_lYA83ZLQI-96Gc2fzewSw1Tlb_dQeiyQA9s91PDh3aGJgDdh52nHcTIfrXdGpoaHEq68rZKf93TTLaTWAkDh4Ie55pSkg4Y8aO_6aHC1mYmCRKo6OSDvL_1aYw0jY_09-zYGhaAkdyg6YPt0KCj4dpCmnRneeXtgoPQkz-cJqQPO4l0R04U5_vqmay9RzT2DEGXInyg-9tMfx-_whbyd1rp7P-cCVEtI8ZyYd" 
            alt="Earthquake ruins" 
          />
          <div className="lp-uc-overlay bg-error"></div>
          <div className="lp-uc-text">
            <h5 className="massive-header">Earthquake zones</h5>
          </div>
        </div>
        
        <div className="lp-uc-card">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9nZf7G9tI6vT_tV4lGf5t_m7s_X5i7E1b7k2c9d8a5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0" 
            alt="Heavy storm" 
          />
          <div className="lp-uc-overlay bg-primary"></div>
          <div className="lp-uc-text">
            <h5 className="massive-header">Cyclone emergencies</h5>
          </div>
        </div>
        
        <div className="lp-uc-card">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8Fe5ok7llX16S13h-vX8C7MIcnpZW1S7TJ7m9iKB73DK56H--3hv380eyh8e3fZ0u9e-8FTNThgSo10f77WjglmXdKYSjxicESFfRKksn4Xrh4eLv0UFFXt6N_KoWrr1oRQKlEaxfeqL8BlNU3XOkiaNHqnjoe0gnm2XjmE8JEJIi6XsBFOF-Z0vjQijCdX-E91FJx15TauUn8JaQtxStPKm9H7SM2ULaZNghLYqNe7wW1dzPcLdv2Kq5A9zVGoOfNuABwzNko59d" 
            alt="Remote mountains" 
          />
          <div className="lp-uc-overlay bg-black"></div>
          <div className="lp-uc-text">
            <h5 className="massive-header">Remote regions</h5>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCases;
