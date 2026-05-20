import { useEvent } from '@basetime/a2w-webview-ts/react';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import NotEmbeddedScreen from './screens/NotEmbeddedScreen';
import './styles.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container missing in index.html');
}

/**
 * Bootstraps the SPA based on whether the native bridge is available.
 *
 * We subscribe to the synthetic `boot` event rather than reading the
 * deprecated `isEmbedded` getter synchronously, because on older
 * Android WebView runtimes `window.atw` can be injected after this
 * module evaluates. The `boot` event fires once the SDK has finished
 * waiting for the bridge (or has timed out).
 *
 * Returning `null` while the bridge state is undetermined keeps the
 * page blank for at most one polling interval; in the embedded case
 * the bridge is normally already present at module evaluation time
 * and `boot` fires asynchronously on the very next tick.
 */
function Bootstrap(): React.ReactElement | null {
  const [isEmbedded, setIsEmbedded] = useState<boolean | null>(null);
  useEvent('boot', ({ payload }) => setIsEmbedded(payload.isEmbedded));

  if (isEmbedded === null) {
    return null;
  }
  return isEmbedded ? <App /> : <NotEmbeddedScreen />;
}

createRoot(container).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
);
