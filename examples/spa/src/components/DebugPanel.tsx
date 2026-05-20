import { useWebApp } from '@basetime/a2w-webview-ts/react';
import { useState } from 'react';

export interface HistoryEntry {
  event: string;
  payload: unknown;
  timestamp: number;
}

interface Props {
  activeEvent: string;
  payload: unknown;
  history: HistoryEntry[];
}

const formatTime = (ts: number): string => {
  return new Date(ts).toLocaleTimeString();
};

const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

/**
 * Bottom-anchored debug panel. Collapses to a single header bar so it
 * doesn't get in the way during real testing on a device, and expands to
 * show the live payload, event history, and round-trip action buttons.
 */
const DebugPanel = ({
  activeEvent,
  payload,
  history,
}: Props): React.ReactElement => {
  const [open, setOpen] = useState(false);
  const webApp = useWebApp();

  return (
    <aside className={`debug ${open ? 'debug--open' : 'debug--closed'}`}>
      <header className="debug__header">
        <button
          type="button"
          className="debug__toggle"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? 'Hide debug' : 'Show debug'}
        </button>
        <span className="debug__active">
          event: <strong>{activeEvent}</strong>
        </span>
      </header>

      {open && (
        <div className="debug__body">
          <section className="debug__section">
            <h3>Round-trip</h3>
            <div className="debug__buttons">
              <button
                type="button"
                onClick={() => webApp.send('navigate', { url: '/' })}
              >
                navigate /
              </button>
              <button
                type="button"
                onClick={() => webApp.send('navigate', { url: '/scan' })}
              >
                navigate /scan
              </button>
              <button
                type="button"
                onClick={() =>
                  webApp.send('settings', {
                    settings: { debugWebviews: true },
                  })
                }
              >
                set debugWebviews=true
              </button>
              <button
                type="button"
                onClick={() => webApp.send('ready')}
              >
                resend ready
              </button>
            </div>
          </section>

          <section className="debug__section">
            <h3>Active payload</h3>
            <pre className="debug__pre">{safeStringify(payload)}</pre>
          </section>

          <section className="debug__section">
            <h3>History ({history.length})</h3>
            <ol className="debug__history">
              {history
                .slice()
                .reverse()
                .map((entry, idx) => (
                  <li key={`${entry.timestamp}-${idx}`}>
                    <span className="debug__history-time">
                      {formatTime(entry.timestamp)}
                    </span>
                    <span className="debug__history-event">{entry.event}</span>
                    <pre className="debug__pre debug__pre--small">
                      {safeStringify(entry.payload)}
                    </pre>
                  </li>
                ))}
              {history.length === 0 && <li className="muted">No events yet.</li>}
            </ol>
          </section>
        </div>
      )}
    </aside>
  );
};

export default DebugPanel;
