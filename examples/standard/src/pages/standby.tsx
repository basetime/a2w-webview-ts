import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import DebugPanel, { type HistoryEntry } from '../components/DebugPanel';
import type { StandbyPayload } from '@basetime/a2w-scanner-ts';
import StandbyScreen from '../screens/StandbyScreen';
import { webApp } from '../atw';
import '../styles.css';

if (!webApp.isEmbedded) {
  throw new Error('This app is not embedded in the atw scanner webview.');
}

/**
 * Page entry for `/standby/`. The scanner loads this URL when it enters
 * its idle / home state and dispatches a single `standby` event. There is
 * no router; the URL itself is the routing decision.
 */
const Page = (): React.ReactElement => {
  const [payload, setPayload] = useState<StandbyPayload | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const off = webApp.on('standby', ({ payload }) => {
      setPayload(payload ?? null);
      setHistory((prev) => [
        ...prev,
        { event: 'standby', payload, timestamp: Date.now() },
      ]);
    });

    // Tell native this page is mounted and ready to receive its event.
    webApp.send('ready', { status: 'ready' });

    return () => {
      off();
    };
  }, []);

  return (
    <main className="app">
      <div className="app__screen">
        <StandbyScreen payload={payload} />
      </div>
      <DebugPanel activeEvent="standby" payload={payload} history={history} />
    </main>
  );
};

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container missing in standby/index.html');
}

createRoot(container).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);
