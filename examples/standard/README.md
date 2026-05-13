# standard

Tiny Vite + React + TypeScript test harness for the **multi-page** webview
flow hosted by scanner. Each scanner event has its own URL, and the
native side loads that URL directly. Each page only listens for the one event
that matches its path.

| URL          | Event listened for | Source                                                |
| ------------ | ------------------ | ----------------------------------------------------- |
| `/standby/`  | `standby`          | [src/pages/standby.tsx](src/pages/standby.tsx)        |
| `/scan/`     | `scan`             | [src/pages/scan.tsx](src/pages/scan.tsx)              |
| `/error/`    | `error`            | [src/pages/error.tsx](src/pages/error.tsx)            |

Each page mounts its own React tree, subscribes to its event with
`webApp.on(...)`, renders the matching screen plus a shared collapsible
debug panel, then fires `webApp.send('ready', ...)` so native can hide its
boot spinner.

## Run

```bash
pnpm install
pnpm dev
```

`vite --host` prints both a `localhost` URL and a LAN URL. Copy the LAN URL
(for example `http://192.168.1.42:5173`) and configure the scanner's
per-screen webview URLs to point at the matching subpath:

| Setting              | Value                              |
| -------------------- | ---------------------------------- |
| `webviewStandbyUrl`  | `http://192.168.1.42:5173/standby` |
| `webviewScanUrl`     | `http://192.168.1.42:5173/scan`    |
| `webviewErrorUrl`    | `http://192.168.1.42:5173/error`   |

Opening the bare host (`http://192.168.1.42:5173/`) in a browser will 404 —
this example intentionally has no root page. Each subpath is its own
independent entry point.

## SDK

This example uses the **plain SDK**: it imports `WebApp` from
[`@basetime/a2w-webview-ts`](https://www.npmjs.com/package/@basetime/a2w-webview-ts)
directly and does not use the `/react` hook subpath (`useEvent` /
`useWebApp`). If you want to see the hook-based usage, look at
[../webview-spa](../webview-spa).

The shared SDK glue in [src/atw.ts](src/atw.ts) is a single line:

```ts
import { WebApp } from '@basetime/a2w-webview-ts';

export const webApp = new WebApp();
```

The SDK's default `AppEvents` map already covers the `scan`, `standby`,
`error`, `navigate`, `ready`, and `settings` events, so there's no need
for a custom event type. Pages and screens import the payload types they
need straight from `@basetime/a2w-webview-ts`:

```tsx
import type { ScanPayload } from '@basetime/a2w-webview-ts';
import { webApp } from '../atw';

useEffect(() => {
  const off = webApp.on('scan', ({ payload }) => {
    setPayload(payload ?? null);
  });
  webApp.send('ready', { status: 'ready' });
  return off;
}, []);
```

Screens send navigate / settings messages back to native via
`webApp.send(...)` directly (see the buttons in
[src/screens/StandbyScreen.tsx](src/screens/StandbyScreen.tsx) and the debug
panel in [src/components/DebugPanel.tsx](src/components/DebugPanel.tsx)).

Each page refuses to boot when not embedded: its `*.tsx` entry checks
`webApp.isEmbedded` and throws if `window.atw` / `window.ReactNativeWebView`
aren't present, matching the SDK's documented usage. Open these URLs only
via the scanner app, not in a regular browser tab.

Events received by this example (types imported from `@basetime/a2w-webview-ts`):

| event     | payload type     | page that handles it                                |
| --------- | ---------------- | --------------------------------------------------- |
| `standby` | `StandbyPayload` | [src/pages/standby.tsx](src/pages/standby.tsx)      |
| `scan`    | `ScanPayload`    | [src/pages/scan.tsx](src/pages/scan.tsx)            |
| `error`   | `ErrorPayload`   | [src/pages/error.tsx](src/pages/error.tsx)          |

Actions every page sends back:

| action     | payload                           | handled by native                                           |
| ---------- | --------------------------------- | ----------------------------------------------------------- |
| `ready`    | `{ status: 'ready' }` (once on mount) | flips the webview host's `isReady` and hides the boot spinner |
| `navigate` | `{ url: '/' \| '/scan' }`         | calls `router.replace(url)`                                 |
| `settings` | `{ settings: Partial<Settings> }` | dispatches `updateSettings`                                 |

> The SDK's `ScanPayload.found` is typed as `boolean`; the legacy native
> bridge still emits it as the string `'true'`/`'false'`. The scan screen
> uses a `!!payload.found` cast so both shapes work.

## Build

```bash
pnpm build      # static bundle in dist/ (one HTML per page)
pnpm preview    # serve dist/ over the LAN
pnpm typecheck  # tsc --noEmit
```

The build emits `dist/standby/index.html`, `dist/scan/index.html`, and
`dist/error/index.html` (one Rollup input per subpath) so the same clean
URL layout works when hosted statically.
