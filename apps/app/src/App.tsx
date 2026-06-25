import React from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { ThemeProvider } from '@nextstep/shared';
import AppRoutes from './routes';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppRoutes />
      <SpeedInsights />
    </ThemeProvider>
  );
};

export default App;
