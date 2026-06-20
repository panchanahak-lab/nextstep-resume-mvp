import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getSupabaseClient, AuthenticationModal } from '@nextstep/shared';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/builder': 'Resume Builder',
  '/scanner': 'Resume Scanner',
  '/interview': 'AI Mock Interview',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

const DashboardShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = pageTitles[location.pathname] || 'Dashboard';

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthModalOpen(true);
      }
    };
    checkAuth();

    const supabase = getSupabaseClient();
    const { data: authListener } = supabase?.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = 'http://localhost:5173/';
      } else if (event === 'SIGNED_IN') {
        setAuthModalOpen(false);
      }
    }) || { data: null };

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          title={pageTitle}
        />
        <main className="p-4 lg:p-6 bg-neutral-50 dark:bg-neutral-950 min-h-[calc(100vh-4rem)] overflow-y-auto relative">
          <Outlet />
          <AuthenticationModal 
            isOpen={authModalOpen} 
            onClose={() => {
              // If they close it without logging in, redirect to landing
              const supabase = getSupabaseClient();
              supabase?.auth.getSession().then(({ data: { session } }) => {
                if (!session) {
                  window.location.href = 'http://localhost:5173/';
                } else {
                  setAuthModalOpen(false);
                }
              });
            }} 
            initialMode="login"
          />
        </main>
      </div>
    </div>
  );
};

export default DashboardShell;
