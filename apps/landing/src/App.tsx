import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { ThemeProvider } from '@nextstep/shared';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import PaymentPage from './pages/PaymentPage';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </Router>
      <SpeedInsights />
    </ThemeProvider>
  );
};

export default App;
