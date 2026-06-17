import React from 'react';
import Navbar from '../sections/Navbar';
import Hero from '../sections/Hero';
import Features from '../sections/Features';
import HowItWorks from '../sections/HowItWorks';
import ForEngineers from '../sections/ForEngineers';
import Pricing from '../sections/Pricing';
import Founder from '../sections/Founder';
import FAQ from '../sections/FAQ';
import Footer from '../sections/Footer';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen font-sans antialiased">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <ForEngineers />
      <Pricing />
      <Founder />
      <FAQ />
      <Footer />
    </div>
  );
};

export default LandingPage;
