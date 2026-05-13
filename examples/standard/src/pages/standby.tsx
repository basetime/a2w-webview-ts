import { useEffect, useState } from 'react';
import DebugPanel, { type HistoryEntry } from '../components/DebugPanel';
import type { StandbyPayload } from '@basetime/a2w-webview-ts';
import StandbyScreen from '../screens/StandbyScreen';
import { webApp } from '../atw';

/**
 * Route component mounted at `/standby/`. The scanner navigates the
 * webview to this URL when it enters its idle / home state and
 * dispatches a single `standby` event. `react-router` decides which
 * page component renders based on the URL, but each page still
 * subscribes to only its matching event.
 */
const StandbyPage = (): React.ReactElement => {
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

export default StandbyPage;
