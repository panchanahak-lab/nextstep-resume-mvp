import React, { useState } from 'react';

interface AppAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleAuth: () => Promise<void>;
  onEmailAuth: (email: string) => Promise<boolean>;
  error?: string;
}

const AppAuthModal: React.FC<AppAuthModalProps> = ({
  isOpen,
  onClose,
  onGoogleAuth,
  onEmailAuth,
  error,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleGoogle = async () => {
    setLoading(true);
    setMessage('');
    await onGoogleAuth();
    setLoading(false);
  };

  const handleEmail = async () => {
    if (!email.trim()) {
      setMessage('Enter your email address first.');
      return;
    }

    setLoading(true);
    setMessage('');
    const ok = await onEmailAuth(email.trim());
    setLoading(false);

    if (ok) {
      setMessage('Check your email for the secure login link.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-neutral-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          aria-label="Close login"
        >
          <span className="text-xl leading-none">&times;</span>
        </button>

        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Welcome back</h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Log in to continue to your resume tools.
        </p>

        <div className="mt-8 space-y-4">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 px-4 py-3 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-wait disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Continue with Google
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-700" />
            <span className="mx-4 flex-shrink-0 text-sm text-neutral-400">or</span>
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-700" />
          </div>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />

          <button
            onClick={handleEmail}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 px-4 py-3 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-wait disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <span aria-hidden="true" className="text-lg leading-none">@</span>
            Continue with Email OTP
          </button>
        </div>

        {(error || message) && (
          <p className={`mt-5 text-sm ${error ? 'text-red-600' : 'text-green-600'}`}>
            {error || message}
          </p>
        )}
      </div>
    </div>
  );
};

export default AppAuthModal;
