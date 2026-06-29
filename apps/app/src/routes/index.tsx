import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardShell from '../layouts/DashboardShell';
import DashboardPage from '../pages/DashboardPage';
import BuilderPage from '../pages/BuilderPage';
import ScannerPage from '../pages/ScannerPage';
import InterviewPage from '../pages/InterviewPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';

const KeepAlivePages = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <DashboardShell>
      <div style={{ display: path === '/dashboard' ? 'block' : 'none' }}>
        <DashboardPage />
      </div>
      <div style={{ display: path === '/builder' ? 'block' : 'none' }}>
        <BuilderPage />
      </div>
      <div style={{ display: path === '/scanner' ? 'block' : 'none' }}>
        <ScannerPage />
      </div>
      <div style={{ display: path === '/interview' ? 'block' : 'none' }}>
        <InterviewPage />
      </div>
      <div style={{ display: path === '/profile' ? 'block' : 'none' }}>
        <ProfilePage />
      </div>
      <div style={{ display: path === '/settings' ? 'block' : 'none' }}>
        <SettingsPage />
      </div>
    </DashboardShell>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<KeepAlivePages />} />
    </Routes>
  );
};

export default AppRoutes;
