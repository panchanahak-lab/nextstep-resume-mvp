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

interface AuthActionContextValue {
  openAuth: (mode: AuthMode, intendedDestination?: string) => void;
  goToProtectedRoute: (destination: string, mode?: AuthMode) => Promise<void>;
  startFree: () => Promise<void>;
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

  const startFree = async () => {
    await goToProtectedRoute(APP_ROUTES.dashboard, 'signup');
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      setAuthError('Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const destination = window.localStorage.getItem('nextstep_intended_destination') ?? APP_ROUTES.dashboard;
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

    const destination = window.localStorage.getItem('nextstep_intended_destination') ?? APP_ROUTES.dashboard;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: authMode === 'signup',
        emailRedirectTo: absoluteUrlFor(destination),
      },
    });

    if (error) {
      setAuthError(error.message);
      return false;
    }

    return true;
  };

  const value = useMemo(
    () => ({
      openAuth,
      goToProtectedRoute,
      startFree,
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
        onEmailAuth={sendEmailLink}
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
