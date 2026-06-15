import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode }) => {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setFormData({ name: '', identifier: '', password: '' });
    setErrorMessage('');
  }, [initialMode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supabase || !isSupabaseConfigured) {
      setErrorMessage('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const email = formData.identifier.trim();
      const authResult = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password: formData.password })
        : await supabase.auth.signUp({
            email,
            password: formData.password,
            options: {
              data: {
                full_name: formData.name,
              },
            },
          });

      if (authResult.error) {
        setErrorMessage(authResult.error.message);
        return;
      }

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'linkedin_oidc') => {
    if (!supabase || !isSupabaseConfigured) {
      setErrorMessage('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setErrorMessage(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
       <div
         className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm transition-opacity"
         onClick={onClose}
       ></div>

       <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-fade-in-up">
         <button
           onClick={onClose}
           className="absolute top-4 right-4 text-slate-400 hover:text-navy-900 transition-colors z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"
         >
           <i className="fas fa-times text-lg"></i>
         </button>

         <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="font-heading text-2xl font-bold text-navy-900 mb-2">
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-slate-600 text-sm">
                {mode === 'signin'
                  ? 'Enter your details to access your dashboard.'
                  : 'Start your journey to a better career today.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                className="flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
              >
                <i className="fab fa-google text-red-500 mr-2"></i>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('linkedin_oidc')}
                className="flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
              >
                <i className="fab fa-linkedin text-[#0077b5] text-lg mr-2"></i>
                LinkedIn
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or continue with</span>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                {errorMessage}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all placeholder-slate-400"
                    placeholder="John Doe"
                    required={mode === 'signup'}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.identifier}
                  onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all placeholder-slate-400"
                  placeholder="john@example.com"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all placeholder-slate-400"
                  placeholder="Password"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {mode === 'signin' && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center text-slate-600 cursor-pointer">
                    <input type="checkbox" className="mr-2 rounded text-brand-500 focus:ring-brand-500 border-gray-300" />
                    Remember me
                  </label>
                  <a href="#" className="text-brand-500 hover:text-brand-600 font-medium">Forgot password?</a>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-navy-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 mt-2 disabled:opacity-60 flex items-center justify-center"
              >
                {isSubmitting && (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSubmitting ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
         </div>

         <div className="bg-slate-50 px-8 py-4 text-center text-sm border-t border-slate-100">
           {mode === 'signin' ? (
             <p className="text-slate-600">
               Don't have an account?{' '}
               <button onClick={() => setMode('signup')} className="text-brand-500 font-bold hover:underline" disabled={isSubmitting}>
                 Sign up
               </button>
             </p>
           ) : (
             <p className="text-slate-600">
               Already have an account?{' '}
               <button onClick={() => setMode('signin')} className="text-brand-500 font-bold hover:underline" disabled={isSubmitting}>
                 Log in
               </button>
             </p>
           )}
         </div>
       </div>
    </div>
  );
};

export default AuthModal;
