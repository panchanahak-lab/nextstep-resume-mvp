import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './routes';
import AuthGate from './components/AuthGate';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthGate>
        <AppRoutes />
      </AuthGate>
    </ThemeProvider>
  );
};

export default App;
