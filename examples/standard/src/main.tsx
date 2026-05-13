import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import ErrorPage from './pages/error';
import NotEmbeddedScreen from './screens/NotEmbeddedScreen';
import ScanPage from './pages/scan';
import StandbyPage from './pages/standby';
import { webApp } from './atw';
import './styles.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container missing in index.html');
}

createRoot(container).render(
  <StrictMode>
    {webApp.isEmbedded ? (
      <BrowserRouter>
        <Routes>
          <Route path="/standby" element={<StandbyPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="*" element={<Navigate to="/standby" replace />} />
        </Routes>
      </BrowserRouter>
    ) : (
      <NotEmbeddedScreen />
    )}
  </StrictMode>,
);
