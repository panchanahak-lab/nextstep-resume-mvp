
import React, { useState, useEffect } from 'react';
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
import { supabase } from './lib/supabase';

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen to auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const closeAuth = () => {
    setIsAuthOpen(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(`Error signing out: ${error.message}`);
    } else {
      alert('Logged out successfully');
    }
  };

  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen flex flex-col font-sans animate-fade-in">
      <Navbar 
        onOpenAuth={openAuth} 
        isLoggedIn={isLoggedIn} 
        userEmail={user?.email || undefined} 
        onLogout={handleLogout} 
      />
      <main className="flex-grow">
        <Hero />
        <ATSChecker isLoggedIn={isLoggedIn} onOpenAuth={openAuth} />
        <ResumeBuilder userId={user?.id} />
        <JobTracker userId={user?.id} />
        <LiveInterview />
        <WhyChooseUs />
        <Services />
        <Testimonials />
        <BottomCTA />
      </main>
      <Footer />
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={closeAuth} 
        initialMode={authMode}
      />
    </div>
  );
}

export default App;
