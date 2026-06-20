import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle, AuthenticationModal } from '@nextstep/shared';

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white dark:bg-neutral-900/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-gray-100 dark:border-neutral-800 dark:border-neutral-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="font-bold text-2xl text-blue-600 dark:text-blue-400 tracking-tight">
            NextStep
          </Link>

          {/* Desktop Right side */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={() => openAuth('login')}
              className="text-sm font-medium text-gray-600 dark:text-neutral-400 dark:text-neutral-300 hover:text-gray-900 dark:text-white dark:hover:text-white transition-colors"
            >
              Login
            </button>
            <button 
              onClick={() => openAuth('signup')}
              className="text-sm font-medium text-gray-600 dark:text-neutral-400 dark:text-neutral-300 hover:text-gray-900 dark:text-white dark:hover:text-white transition-colors"
            >
              Create Account
            </button>
            <button 
              onClick={() => openAuth('signup')}
              className="bg-blue-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Get Started
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 dark:text-neutral-400 dark:text-neutral-300 hover:bg-gray-100 dark:bg-neutral-800 dark:hover:bg-neutral-800 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-neutral-800 dark:border-neutral-800 bg-white dark:bg-neutral-900 dark:bg-neutral-900 transition-colors">
            <div className="px-4 py-4 flex flex-col gap-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-neutral-800 dark:border-neutral-800 mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-neutral-400 dark:text-neutral-300">Theme</span>
                <ThemeToggle />
              </div>
              <button 
                onClick={() => openAuth('login')}
                className="w-full text-left text-sm font-medium text-gray-600 dark:text-neutral-400 dark:text-neutral-300 hover:text-gray-900 dark:text-white dark:hover:text-white py-2"
              >
                Login
              </button>
              <button 
                onClick={() => openAuth('signup')}
                className="w-full text-left text-sm font-medium text-gray-600 dark:text-neutral-400 dark:text-neutral-300 hover:text-gray-900 dark:text-white dark:hover:text-white py-2"
              >
                Create Account
              </button>
              <button 
                onClick={() => openAuth('signup')}
                className="w-full text-sm font-medium bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-center"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      <AuthenticationModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialMode={authMode} 
      />
    </>
  );
};

export default Navbar;
