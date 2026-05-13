import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import DebugPanel, { type HistoryEntry } from '../components/DebugPanel';
import ScanScreen from '../screens/ScanScreen';
import { webApp, type ScanPayload } from '../atw';
import '../styles.css';

if (!webApp.isEmbedded) {
  throw new Error('This app is not embedded in the atw scanner webview.');
}

/**
 * Page entry for `/scan/`. The scanner loads this URL after fetching a
 * pass and dispatches a single `scan` event. There is no router; the URL
 * itself is the routing decision.
 */
const Page = (): React.ReactElement => {
  const [payload, setPayload] = useState<ScanPayload | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const off = webApp.on('scan', ({ payload }) => {
      setPayload(payload ?? null);
      setHistory((prev) => [
        ...prev,
        { event: 'scan', payload, timestamp: Date.now() },
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
        <ScanScreen payload={payload} />
      </div>
      <DebugPanel activeEvent="scan" payload={payload} history={history} />
    </main>
  );
};

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container missing in scan/index.html');
}

createRoot(container).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);
