import React from 'react';
import { ThemeProvider } from '@nextstep/shared';
import AppRoutes from './routes';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
};

export default App;
