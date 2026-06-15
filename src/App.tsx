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
import Pricing from './components/Pricing';
import AdminPanel from './components/AdminPanel';
import LegalPages from './components/LegalPages';
import { supabase } from './lib/supabaseClient';

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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

  const handleLogout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(`Error signing out: ${error.message}`);
    }
  };

  const isLoggedIn = Boolean(user);

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
      />
    </div>
  );
}

export default App;
