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

const GOOGLE_AUTH_ERROR = 'We could not log you in with Google. Please try again.';

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
      setAuthError(GOOGLE_AUTH_ERROR);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthError(GOOGLE_AUTH_ERROR);
      return;
    }

    const destination = getStoredIntendedDestination() ?? APP_ROUTES.dashboard;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: absoluteUrlFor(destination),
        },
      });

      if (error) {
        console.error('Google auth failed', error);
        setAuthError(GOOGLE_AUTH_ERROR);
      }
    } catch (error) {
      console.error('Google auth failed', error);
      setAuthError(GOOGLE_AUTH_ERROR);
    }
  };

  return (
    <>
      {children}
      <AppAuthModal
        isOpen={!checking && !session && authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onGoogleAuth={signInWithGoogle}
        error={authError}
      />
    </>
  );
};

export default AuthGate;
