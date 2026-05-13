import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import ErrorPage from './pages/error';
import ScanPage from './pages/scan';
import StandbyPage from './pages/standby';
import { webApp } from './atw';
import './styles.css';

if (!webApp.isEmbedded) {
  throw new Error('This app is not embedded in the atw scanner webview.');
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container missing in index.html');
}

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/standby" element={<StandbyPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<Navigate to="/standby" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
