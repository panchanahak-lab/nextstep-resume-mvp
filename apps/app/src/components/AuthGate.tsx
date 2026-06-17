import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  absoluteUrlFor,
  APP_ROUTES,
  consumeIntendedDestination,
  getCurrentSession,
  getStoredIntendedDestination,
  getSupabaseClient,
  isSupabaseConfigured,
  redirectToDestination,
  storeIntendedDestination,
} from '@nextstep/shared';
import AppAuthModal from './AppAuthModal';

const AuthGate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const destination = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (destination.startsWith('/app/')) {
      storeIntendedDestination(destination);
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setChecking(false);
      setAuthModalOpen(true);
      return undefined;
    }

    getCurrentSession().then((currentSession) => {
      setSession(currentSession);
      setChecking(false);
      if (!currentSession) setAuthModalOpen(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setAuthModalOpen(true);
        return;
      }

      setAuthModalOpen(false);
      const destinationAfterAuth = consumeIntendedDestination();
      if (destinationAfterAuth && destinationAfterAuth !== window.location.pathname) {
        redirectToDestination(destinationAfterAuth);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      setAuthError('Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const destination = getStoredIntendedDestination() ?? APP_ROUTES.dashboard;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: absoluteUrlFor(destination),
      },
    });

    if (error) setAuthError(error.message);
  };

  const sendEmailLink = async (email: string) => {
    if (!isSupabaseConfigured()) {
      setAuthError('Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.');
      return false;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const destination = getStoredIntendedDestination() ?? APP_ROUTES.dashboard;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: absoluteUrlFor(destination),
      },
    });

    if (error) {
      setAuthError(error.message);
      return false;
    }

    return true;
  };

  return (
    <>
      {children}
      <AppAuthModal
        isOpen={!checking && !session && authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onGoogleAuth={signInWithGoogle}
        onEmailAuth={sendEmailLink}
        error={authError}
      />
    </>
  );
};

export default AuthGate;
