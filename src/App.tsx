
import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WhyChooseUs from './components/WhyChooseUs';
import Services from './components/Services';
import Testimonials from './components/Testimonials';
import BottomCTA from './components/BottomCTA';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ATSChecker from './components/ATSChecker';
import LiveInterview from './components/LiveInterview';
import ResumeBuilder from './components/ResumeBuilder';
import JobTracker from './components/JobTracker';
import { supabase } from './lib/supabaseClient';
import Pricing from './components/Pricing';
import AdminPanel from './components/AdminPanel';
import LegalPages from './components/LegalPages';


function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(Boolean(data.session));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const closeAuth = () => {
    setIsAuthOpen(false);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans animate-fade-in">
      <Navbar onOpenAuth={openAuth} />
      <main className="flex-grow">
        <Hero />
        <ATSChecker isLoggedIn={isLoggedIn} onOpenAuth={openAuth} />
        <ResumeBuilder />
        <JobTracker />
        <LiveInterview />
        <Pricing isLoggedIn={isLoggedIn} onOpenAuth={openAuth} />
        <AdminPanel />
        <WhyChooseUs />
        <Services />
        <Testimonials />
        <BottomCTA />
        <LegalPages />
      </main>
      <Footer />
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={closeAuth} 
        initialMode={authMode}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;
