import { StrictMode, useEffect, useState } from 'react';
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

/**
 * Bootstraps the router based on whether the native bridge is
 * available. We listen for the synthetic `boot` event rather than
 * reading the deprecated `webApp.isEmbedded` getter synchronously,
 * because the native bridge can be injected after `WebApp` is
 * constructed on older Android WebView runtimes.
 */
function Bootstrap(): React.ReactElement | null {
  const [isEmbedded, setIsEmbedded] = useState<boolean | null>(null);

  useEffect(() => {
    return webApp.on('boot', ({ payload }) => {
      setIsEmbedded(payload.isEmbedded);
    });
  }, []);

  if (isEmbedded === null) {
    return null;
  }
  if (!isEmbedded) {
    return <NotEmbeddedScreen />;
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/standby" element={<StandbyPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<Navigate to="/standby" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(container).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
);
