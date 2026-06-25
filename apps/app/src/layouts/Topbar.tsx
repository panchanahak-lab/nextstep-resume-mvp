import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@nextstep/shared';

interface TopbarProps {
  onMenuClick: () => void;
  title: string;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick, title }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      try {
        const { getSupabaseClient } = await import('@nextstep/shared');
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.auth.signOut();
        }
        window.location.href = '/';
      } catch (e) {
        console.error('Logout failed', e);
      }
    }
  };

  return (
    <header className="app-topbar sticky top-0 z-40 h-16">
      <div className="flex items-center justify-between px-4 lg:px-8 h-full">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md app-muted hover:bg-white/10 transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] app-muted">NextStep</p>
            <h1 className="text-lg font-bold text-neutral-950 dark:text-white">{title}</h1>
          </div>
        </div>

        {/* Right: theme toggle + avatar */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 transition-shadow"
            >
              RK
            </button>
            {dropdownOpen && (
              <div className="app-panel absolute right-0 mt-2 w-48 rounded-lg overflow-hidden z-50">
                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-neutral-800 dark:text-neutral-200 hover:bg-white/10"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-neutral-800 dark:text-neutral-200 hover:bg-white/10"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
