import React, { useState } from 'react';

interface AppAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleAuth: () => Promise<void>;
  error?: string;
}

const AppAuthModal: React.FC<AppAuthModalProps> = ({
  isOpen,
  onClose,
  onGoogleAuth,
  error,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await onGoogleAuth();
    } finally {
      setLoading(false);
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

        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Welcome back to Nextstep</h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Continue with Google to save your resumes, unlock your first included CV scan, and track interview results.
        </p>

        <div className="mt-8 space-y-4">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 px-4 py-3 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-wait disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {loading ? 'Opening Google login...' : 'Continue with Google'}
          </button>
        </div>

        {error && (
          <p className="mt-5 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <p className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          By continuing, you agree to our{' '}
          <a href="/terms" className="font-medium text-primary-600 hover:text-primary-700">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="font-medium text-primary-600 hover:text-primary-700">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default AppAuthModal;
