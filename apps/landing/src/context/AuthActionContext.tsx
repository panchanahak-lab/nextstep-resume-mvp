import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  APP_ROUTES,
  absoluteUrlFor,
  getCurrentSession,
  getSupabaseClient,
  isSupabaseConfigured,
  redirectToDestination,
  storeIntendedDestination,
} from '@nextstep/shared';
import AuthenticationModal from '../components/AuthenticationModal';

type AuthMode = 'login' | 'signup';
const GOOGLE_AUTH_ERROR = 'We could not log you in with Google. Please try again.';

interface AuthActionContextValue {
  openAuth: (mode: AuthMode, intendedDestination?: string) => void;
  goToProtectedRoute: (destination: string, mode?: AuthMode) => Promise<void>;
  getStarted: () => Promise<void>;
}

const AuthActionContext = createContext<AuthActionContextValue | null>(null);

export const AuthActionProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authError, setAuthError] = useState('');

  const openAuth = (mode: AuthMode, intendedDestination: string = APP_ROUTES.dashboard) => {
    storeIntendedDestination(intendedDestination);
    setAuthMode(mode);
    setAuthError('');
    setAuthModalOpen(true);
  };

  const goToProtectedRoute = async (destination: string, mode: AuthMode = 'login') => {
    storeIntendedDestination(destination);

    const session = await getCurrentSession();
    if (session) {
      redirectToDestination(destination);
      return;
    }

    openAuth(mode, destination);
  };

  const getStarted = async () => {
    await goToProtectedRoute(APP_ROUTES.dashboard, 'signup');
  };

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

    const destination = window.localStorage.getItem('nextstep_intended_destination') ?? APP_ROUTES.dashboard;
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

  const value = useMemo(
    () => ({
      openAuth,
      goToProtectedRoute,
      getStarted,
    }),
    [],
  );

  return (
    <AuthActionContext.Provider value={value}>
      {children}
      <AuthenticationModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onGoogleAuth={signInWithGoogle}
        error={authError}
      />
    </AuthActionContext.Provider>
  );
};

export const useAuthActions = () => {
  const context = useContext(AuthActionContext);
  if (!context) {
    throw new Error('useAuthActions must be used inside AuthActionProvider');
  }
  return context;
};
