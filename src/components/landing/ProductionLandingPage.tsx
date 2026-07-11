import React from "react";
import "./landing-theme.css";
import Navbar from "@/components/landing/sections/Navbar";
import Hero from "@/components/landing/sections/Hero";
import HowItWorks from "@/components/landing/sections/HowItWorks";
import InteractiveProduct from "@/components/landing/sections/InteractiveProduct";
import Features from "@/components/landing/sections/Features";
import RealtimeDemo from "@/components/landing/sections/RealtimeDemo";
import BeforeAfter from "@/components/landing/sections/BeforeAfter";
import TechStack from "@/components/landing/sections/TechStack";
import FAQ from "@/components/landing/sections/FAQ";
import FinalCTA from "@/components/landing/sections/FinalCTA";
import Footer from "@/components/landing/sections/Footer";
import CustomCursor from "@/components/landing/effects/CustomCursor";

interface ProductionLandingPageProps {
  onEnterChat: () => void;
  onEnterResources: () => void;
}

export default function ProductionLandingPage({
  onEnterChat,
  onEnterResources,
}: ProductionLandingPageProps) {
  return (
    <div className="tr-landing-wrapper">
      <main className="relative overflow-x-hidden">
        <CustomCursor />
        <Navbar onSignIn={onEnterChat} onGetStarted={onEnterResources} />
        <Hero onGetStarted={onEnterChat} />
        <HowItWorks />
        <InteractiveProduct />
        <Features />
        <RealtimeDemo />
        <BeforeAfter />
        <TechStack />
        <FAQ />
        <FinalCTA onGetStarted={onEnterResources} />
        <Footer />
      </main>
    </div>
  );
}
