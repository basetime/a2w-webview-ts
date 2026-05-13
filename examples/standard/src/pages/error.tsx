import { useEffect, useState } from 'react';
import DebugPanel, { type HistoryEntry } from '../components/DebugPanel';
import type { ErrorPayload } from '@basetime/a2w-webview-ts';
import ErrorScreen from '../screens/ErrorScreen';
import { webApp } from '../atw';

/**
 * Route component mounted at `/error/`. The scanner navigates the
 * webview to this URL when fetching a pass fails and dispatches a
 * single `error` event. `react-router` decides which page component
 * renders based on the URL, but each page still subscribes to only
 * its matching event.
 */
const ErrorPage = (): React.ReactElement => {
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

export default ErrorPage;
