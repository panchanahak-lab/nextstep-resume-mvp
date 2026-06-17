import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '@nextstep/shared';
import { useAuthActions } from '../context/AuthActionContext';

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openAuth, startFree } = useAuthActions();

  const openAuthentication = (mode: 'login' | 'signup') => {
    openAuth(mode, APP_ROUTES.dashboard);
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="font-bold text-2xl text-blue-600 tracking-tight">
            NextStep
          </Link>

          {/* Desktop Right side */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => openAuthentication('login')}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Login
            </button>
            <button 
              onClick={() => openAuthentication('signup')}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Create Account
            </button>
            <button 
              onClick={startFree}
              className="text-sm font-medium bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-colors shadow-sm"
            >
              Start Free
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-4 flex flex-col gap-3">
              <button 
                onClick={() => openAuthentication('login')}
                className="w-full text-left text-sm font-medium text-gray-600 hover:text-gray-900 py-2"
              >
                Login
              </button>
              <button 
                onClick={() => openAuthentication('signup')}
                className="w-full text-left text-sm font-medium text-gray-600 hover:text-gray-900 py-2"
              >
                Create Account
              </button>
              <button 
                onClick={async () => {
                  setMobileOpen(false);
                  await startFree();
                }}
                className="w-full text-sm font-medium bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-center"
              >
                Start Free
              </button>
            </div>
          </div>
        )}
      </nav>

    </>
  );
};

export default Navbar;
