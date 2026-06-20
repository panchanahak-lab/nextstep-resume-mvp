import React, { useState } from 'react';
import { AlertCircle, X, Loader2 } from 'lucide-react';
import { absoluteUrlFor, getSupabaseClient, isSupabaseConfigured } from '../auth';

export interface AuthenticationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthenticationModal: React.FC<AuthenticationModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured yet. Please try again later.');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setSuccess('Signup successful! Please check your email to verify your account.');
      } else if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        onClose();
        // optionally reload or redirect
        window.location.href = '/dashboard';
      } else if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: absoluteUrlFor('/app/dashboard'),
        });
        if (resetError) throw resetError;
        setSuccess('Password reset email sent. Please check your inbox.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    if (!isSupabaseConfigured()) {
      setError('Google login is not configured yet. Please try again later.');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: absoluteUrlFor('/app/dashboard'),
      },
    });

    if (signInError) {
      setError('We could not log you in with Google. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm text-left">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-neutral-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create an account' : 'Reset Password'}
          </h2>
          <p className="text-gray-600 dark:text-neutral-400 mb-6 text-sm">
            {mode === 'forgot' 
              ? 'Enter your email address and we will send you a link to reset your password.'
              : 'Create an account to save your resumes, unlock your first CV scan, and track interview results.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                <span>{success}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Password</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => setMode('forgot')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
            </button>
          </form>

          {mode !== 'forgot' && (
            <>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-neutral-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-neutral-900 text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors font-medium text-gray-700 dark:text-neutral-200 disabled:opacity-70"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
            </>
          )}

          <div className="mt-6 text-center text-sm">
            {mode === 'login' ? (
              <p className="text-gray-600 dark:text-neutral-400">
                Don't have an account?{' '}
                <button type="button" onClick={() => setMode('signup')} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-gray-600 dark:text-neutral-400">
                Already have an account?{' '}
                <button type="button" onClick={() => setMode('login')} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  Log in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationModal;
