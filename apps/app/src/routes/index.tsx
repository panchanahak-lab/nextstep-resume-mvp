import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardShell from '../layouts/DashboardShell';
import DashboardPage from '../pages/DashboardPage';
import BuilderPage from '../pages/BuilderPage';
import ScannerPage from '../pages/ScannerPage';
import InterviewPage from '../pages/InterviewPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<DashboardShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/builder" element={<BuilderPage />} />
        <Route path="/scanner" element={<ScannerPage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
