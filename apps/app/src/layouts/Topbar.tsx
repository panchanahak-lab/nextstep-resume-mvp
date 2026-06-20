import React from 'react';
import { ThemeToggle } from '@nextstep/shared';

interface TopbarProps {
  onMenuClick: () => void;
  title: string;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick, title }) => {

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 h-16">
      <div className="flex items-center justify-between px-4 lg:px-6 h-full">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h1>
        </div>

        {/* Right: theme toggle + avatar */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-medium flex items-center justify-center text-sm">
            RK
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
