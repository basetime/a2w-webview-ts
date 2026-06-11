# React

If your embedded app is built with React, the SDK ships a small set of
hooks under the optional `/react` subpath. React is declared as an
**optional peer dependency**, so non-React consumers don't pay any bundle
cost and don't need to install it.

```bash
npm install @basetime/a2w-webview-ts react
```

```tsx
import { useEvent, useWebApp } from '@basetime/a2w-webview-ts/react';

export function ScanScreen() {
  useEvent('scan', ({ payload }) => {
    if (!payload.found) {
      return;
    }
    console.log('Scanned pass:', payload.pass);
  });

  useEvent('standby', () => {
    console.log('Scanner is idle');
  });

  // `useWebApp` is only needed if you want to call `send` or
  // otherwise access the instance directly.
  const webApp = useWebApp();

  // Use the `boot` event to decide what to render once the SDK has
  // resolved whether the native bridge is available. On older Android
  // WebView runtimes the bridge can be injected after `WebApp` is
  // constructed, so a synchronous `isEmbedded` check is unreliable.
  const [isEmbedded, setIsEmbedded] = useState<boolean | null>(null);
  useEvent('boot', ({ payload }) => setIsEmbedded(payload.isEmbedded));

  if (isEmbedded === null) {
    return <p>Loading…</p>;
  }
  if (!isEmbedded) {
    return <p>Open this app inside the atw scanner.</p>;
  }

  return <p>Waiting for a scan…</p>;
}
```

Using the wildcard listener, we can listen to all events and navigate to the appropriate screen based on the event.

```tsx
import React, { useState } from 'react';
import { useEvent, useWebApp } from '@basetime/a2w-webview-ts/react';
import { ScanScreen, StandbyScreen, ErrorScreen } from './screens';

export function App() {
  const [page, setPage] = useState<'scan' | 'standby' | 'error'>('scan');

  useEvent('*', ({ action, payload }) => {
    if (action === 'scan') {
      setPage('scan');
    } else if (action === 'standby') {
      setPage('standby');
    } else if (action === 'error') {
      setPage('error');
    }
  });

  if (page === 'scan') {
    return <ScanScreen />;
  } else if (page === 'standby') {
    return <StandbyScreen />;
  } else if (page === 'error') {
    return <ErrorScreen />;
  }

  return <p>Waiting for a scan…</p>;
}
```

Available hooks:

- `useEvent(event, callback)` subscribes to an event for the lifetime of
  the component. The callback is captured in a ref, so passing an inline
  arrow function does **not** cause the listener to re-subscribe on every
  render.
- `useWebApp()` returns a stable `WebApp` instance for cases where you need
  to call `send` or otherwise interact with the scanner imperatively.
  Prefer subscribing to the `boot` event (via `useEvent('boot', ...)`)
  over reading the deprecated `isEmbedded` getter, since the native
  bridge can be injected after construction on older Android WebView
  runtimes.
