import { useCallback, useEffect, useState } from 'react';
import DebugPanel, { type HistoryEntry } from './components/DebugPanel';
import ErrorScreen from './screens/ErrorScreen';
import IdleScreen from './screens/IdleScreen';
import ScanScreen from './screens/ScanScreen';
import StandbyScreen from './screens/StandbyScreen';
import {
  useWebAppEvent,
  webAppSend,
  type ErrorPayload,
  type ScanPayload,
  type StandbyPayload,
} from './atw';

type ActiveEvent = 'idle' | 'standby' | 'scan' | 'error';

interface AppState {
  activeEvent: ActiveEvent;
  payload: unknown;
  history: HistoryEntry[];
}

const initialState: AppState = {
  activeEvent: 'idle',
  payload: null,
  history: [],
};

const App = (): React.ReactElement => {
  const [state, setState] = useState<AppState>(initialState);

  /**
   * Push a new event onto state. The most recent event drives which screen
   * is rendered. History keeps everything for the debug panel.
   */
  const recordEvent = useCallback((event: ActiveEvent, payload: unknown) => {
    setState((prev) => ({
      activeEvent: event,
      payload,
      history: [
        ...prev.history,
        { event, payload, timestamp: Date.now() },
      ],
    }));
  }, []);

  const handleStandby = useCallback(
    (payload: StandbyPayload | undefined) => recordEvent('standby', payload),
    [recordEvent],
  );
  const handleScan = useCallback(
    (payload: ScanPayload | undefined) => recordEvent('scan', payload),
    [recordEvent],
  );
  const handleError = useCallback(
    (payload: ErrorPayload | undefined) => recordEvent('error', payload),
    [recordEvent],
  );

  useWebAppEvent('standby', handleStandby);
  useWebAppEvent('scan', handleScan);
  useWebAppEvent('error', handleError);

  /**
   * Notify native that the SPA has finished bootstrapping. The host uses
   * this to hide its global loading spinner.
   */
  useEffect(() => {
    webAppSend('ready', { status: 'ready' });
  }, []);

  let screen: React.ReactElement;
  switch (state.activeEvent) {
    case 'standby':
      screen = <StandbyScreen payload={state.payload as StandbyPayload | null} />;
      break;
    case 'scan':
      screen = <ScanScreen payload={state.payload as ScanPayload | null} />;
      break;
    case 'error':
      screen = <ErrorScreen payload={state.payload as ErrorPayload | null} />;
      break;
    case 'idle':
    default:
      screen = <IdleScreen />;
      break;
  }

  return (
    <main className="app">
      <div className="app__screen">{screen}</div>
      <DebugPanel
        activeEvent={state.activeEvent}
        payload={state.payload}
        history={state.history}
      />
    </main>
  );
};

export default App;
