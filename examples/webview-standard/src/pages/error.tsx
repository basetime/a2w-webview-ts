import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import DebugPanel, { type HistoryEntry } from '../components/DebugPanel';
import type { ErrorPayload } from '@basetime/a2w-scanner-ts';
import ErrorScreen from '../screens/ErrorScreen';
import { webApp } from '../atw';
import '../styles.css';

if (!webApp.isEmbedded) {
  throw new Error('This app is not embedded in the atw scanner webview.');
}

/**
 * Page entry for `/error/`. The scanner loads this URL when fetching a
 * pass fails and dispatches a single `error` event. There is no router;
 * the URL itself is the routing decision.
 */
const Page = (): React.ReactElement => {
  const [payload, setPayload] = useState<ErrorPayload | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const off = webApp.on('error', ({ payload }) => {
      setPayload(payload ?? null);
      setHistory((prev) => [
        ...prev,
        { event: 'error', payload, timestamp: Date.now() },
      ]);
    });

    webApp.send('ready', { status: 'ready' });

    return () => {
      off();
    };
  }, []);

  return (
    <main className="app">
      <div className="app__screen">
        <ErrorScreen payload={payload} />
      </div>
      <DebugPanel activeEvent="error" payload={payload} history={history} />
    </main>
  );
};

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container missing in error/index.html');
}

createRoot(container).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);
