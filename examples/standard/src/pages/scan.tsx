import { useEffect, useState } from 'react';
import DebugPanel, { type HistoryEntry } from '../components/DebugPanel';
import type { ScanPayload } from '@basetime/a2w-webview-ts';
import ScanScreen from '../screens/ScanScreen';
import { webApp } from '../atw';

/**
 * Route component mounted at `/scan/`. The scanner navigates the
 * webview to this URL after fetching a pass and dispatches a single
 * `scan` event. `react-router` decides which page component renders
 * based on the URL, but each page still subscribes to only its
 * matching event.
 */
const ScanPage = (): React.ReactElement => {
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

    webApp.send('ready');

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

export default ScanPage;
