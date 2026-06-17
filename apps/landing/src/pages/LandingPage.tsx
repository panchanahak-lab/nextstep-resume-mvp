import React from 'react';
import Navbar from '../sections/Navbar';
import Hero from '../sections/Hero';
import CoreActionsSection from '../sections/CoreActionsSection';
import ValueSection from '../sections/ValueSection';
import HowItWorks from '../sections/HowItWorks';
import ResumeBuilderSection from '../sections/ResumeBuilderSection';
import UploadResumeSection from '../sections/UploadResumeSection';
import ATSScanSection from '../sections/ATSScanSection';
import JobReadinessSection from '../sections/JobReadinessSection';
import LiveInterviewSection from '../sections/LiveInterviewSection';
import InterviewResultSection from '../sections/InterviewResultSection';
import Pricing from '../sections/Pricing';
import ShareReferralSection from '../sections/ShareReferralSection';
import TrustSection from '../sections/TrustSection';
import FAQ from '../sections/FAQ';
import Footer from '../sections/Footer';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen font-sans antialiased bg-white selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <main>
        <Hero />
        <CoreActionsSection />
        <ValueSection />
        <HowItWorks />
        <ResumeBuilderSection />
        <UploadResumeSection />
        <ATSScanSection />
        <JobReadinessSection />
        <LiveInterviewSection />
        <InterviewResultSection />
        <Pricing />
        <ShareReferralSection />
        <FAQ />
        <TrustSection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
