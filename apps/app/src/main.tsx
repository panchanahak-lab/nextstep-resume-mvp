import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

type ViteImportMeta = ImportMeta & {
  env?: Record<string, string | undefined>;
};

const baseUrl = (import.meta as ViteImportMeta).env?.BASE_URL ?? '/';
const appBaseName = baseUrl === '/'
  ? undefined
  : baseUrl.replace(/\/$/, '');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={appBaseName}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
