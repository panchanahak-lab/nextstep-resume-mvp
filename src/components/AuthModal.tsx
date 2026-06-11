
import React, { useState, useEffect } from 'react';
import { supabase, hasValidSupabaseConfig } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode }) => {
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    identifier: '', // email
    password: ''
  });

  // Reset mode, error, and form when modal opens
  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setFormData({ name: '', identifier: '', password: '' });
  }, [initialMode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const isSupabaseConfigured = hasValidSupabaseConfig();

    if (mode === 'signin') {
      // Admin Check Logic - Supports 'username' or 'admin'
      const isAdminUser = formData.identifier.toLowerCase() === 'username' || formData.identifier.toLowerCase() === 'admin';
      
      if (isAdminUser && formData.password === 'password') {
        alert("👑 Admin Access Granted!\n\nWelcome back, Administrator.");
        if (isSupabaseConfigured) {
          // Attempt login via Supabase with default admin account
          const { error: adminError } = await supabase.auth.signInWithPassword({
            email: 'admin@nextstepresume.ai',
            password: 'password'
          });
          if (adminError) {
            console.warn("Failed to sign in with Supabase admin account, using offline demo session.", adminError.message);
          }
        } else {
          alert("Note: Supabase is not configured yet. Running in offline demo mode.");
        }
        setLoading(false);
        onClose();
        return;
      }

      // Standard Supabase login
      if (isSupabaseConfigured) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.identifier,
          password: formData.password
        });

        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }
      } else {
        setError("Supabase is not configured yet. Create a connection by setting VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.");
        setLoading(false);
        return;
      }
    } else {
      // Sign Up
      if (isSupabaseConfigured) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.identifier,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name
            }
          }
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        } else {
          alert(`✅ Account created for ${formData.name}! Please check your email to confirm registration.`);
        }
      } else {
        setError("Supabase is not configured yet. Create a connection by setting VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.");
        setLoading(false);
        return;
      }
    }
    
    setLoading(false);
    onClose();
  };

  const handleSocialLogin = async (provider: 'google' | 'linkedin_oidc') => {
    setError(null);
    if (!hasValidSupabaseConfig()) {
      setError("Supabase is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.");
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (authError) {
        setError(authError.message);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during social login.');
    }
  };

  const fillAdminCredentials = () => {
    setFormData({
      ...formData,
      identifier: 'username',
      password: 'password'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
       {/* Backdrop */}
       <div 
         className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm transition-opacity" 
         onClick={onClose}
       ></div>

       {/* Modal */}
       <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-fade-in-up">
         {/* Close Button */}
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

            {/* Social Auth */}
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

            {/* Error Message Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium flex items-start gap-2">
                <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0"></i>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
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
                    disabled={loading}
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
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all placeholder-slate-400"
                  placeholder="••••••••"
                  required
                  disabled={loading}
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
                disabled={loading}
                className="w-full bg-navy-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 mt-2 flex items-center justify-center"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
            
            {/* Demo Hint with Click-to-Fill */}
            {mode === 'signin' && (
               <div 
                 onClick={fillAdminCredentials}
                 className="mt-6 p-4 bg-brand-50 rounded-xl border border-brand-200 text-xs text-slate-600 text-center cursor-pointer hover:bg-brand-100 hover:border-brand-300 transition-all duration-200 group relative overflow-hidden shadow-sm"
                 title="Click to auto-fill admin credentials"
               >
                  <div className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">
                    TESTING
                  </div>
                  <p className="font-bold text-brand-700 mb-1 text-sm group-hover:text-brand-800 transition-colors flex items-center justify-center">
                    <i className="fas fa-magic mr-2 animate-pulse"></i> Use Demo Account
                  </p>
                  <p className="opacity-90 mt-1">
                    Click here to auto-fill credentials and unlock "Pro" features like ATS suggestions.
                  </p>
               </div>
            )}
         </div>

         {/* Footer */}
         <div className="bg-slate-50 px-8 py-4 text-center text-sm border-t border-slate-100">
           {mode === 'signin' ? (
             <p className="text-slate-600">
               Don't have an account?{' '}
               <button onClick={() => setMode('signup')} className="text-brand-500 font-bold hover:underline" disabled={loading}>
                 Sign up
               </button>
             </p>
           ) : (
             <p className="text-slate-600">
               Already have an account?{' '}
               <button onClick={() => setMode('signin')} className="text-brand-500 font-bold hover:underline" disabled={loading}>
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
