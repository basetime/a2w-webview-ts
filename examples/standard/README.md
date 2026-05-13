# standard

Tiny Vite + React + TypeScript test harness for the **multi-page** webview
flow hosted by scanner. Each scanner event has its own URL, and the
native side navigates the webview to that URL directly. The harness is a
single Vite SPA: one `index.html` boots `src/main.tsx`, which mounts
[`react-router`](https://reactrouter.com) and maps each scanner URL to a
dedicated route component. Each route only listens for the one event
that matches its path.

| URL          | Event listened for | Source                                                |
| ------------ | ------------------ | ----------------------------------------------------- |
| `/standby/`  | `standby`          | [src/pages/standby.tsx](src/pages/standby.tsx)        |
| `/scan/`     | `scan`             | [src/pages/scan.tsx](src/pages/scan.tsx)              |
| `/error/`    | `error`            | [src/pages/error.tsx](src/pages/error.tsx)            |

When the scanner navigates the webview to one of these URLs, the same
SPA bundle loads, `react-router` matches the path, and the matching
route component mounts. That component subscribes to its event with
`webApp.on(...)`, renders the matching screen plus a shared collapsible
debug panel, then fires `webApp.send('ready', ...)` so native can hide
its boot spinner. Hitting the bare host (`/`) or any unknown path
redirects to `/standby`.

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

Vite's dev server serves `index.html` for every path (SPA fallback), so
all three URLs hit the same bundle. `react-router` then renders the
matching route.

## SDK

This example uses the **plain SDK**: it imports `WebApp` from
[`@basetime/a2w-webview-ts`](https://www.npmjs.com/package/@basetime/a2w-webview-ts)
directly and does not use the `/react` hook subpath (`useEvent` /
`useWebApp`). If you want to see the hook-based usage, look at
[../spa](../spa).

The shared SDK glue in [src/atw.ts](src/atw.ts) is a single line:

```ts
import { WebApp } from '@basetime/a2w-webview-ts';

export const webApp = new WebApp();
```

The SDK's default `AppEvents` map already covers the `scan`, `standby`,
`error`, `navigate`, `ready`, and `settings` events, so there's no need
for a custom event type. Routes and screens import the payload types
they need straight from `@basetime/a2w-webview-ts`:

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

The harness refuses to boot when not embedded: [src/main.tsx](src/main.tsx)
checks `webApp.isEmbedded` once before mounting React and throws if
`window.atw` / `window.ReactNativeWebView` aren't present, matching the
SDK's documented usage. Open these URLs only via the scanner app, not
in a regular browser tab.

Events received by this example (types imported from `@basetime/a2w-webview-ts`):

| event     | payload type     | route that handles it                               |
| --------- | ---------------- | --------------------------------------------------- |
| `standby` | `StandbyPayload` | [src/pages/standby.tsx](src/pages/standby.tsx)      |
| `scan`    | `ScanPayload`    | [src/pages/scan.tsx](src/pages/scan.tsx)            |
| `error`   | `ErrorPayload`   | [src/pages/error.tsx](src/pages/error.tsx)          |

Actions every route sends back:

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
pnpm build      # static SPA bundle in dist/ (one index.html + assets)
pnpm preview    # serve dist/ over the LAN
pnpm typecheck  # tsc --noEmit
```

The build emits a single `dist/index.html` plus hashed JS/CSS assets.
When hosting `dist/` statically, configure the host with SPA fallback
so requests for `/standby/`, `/scan/`, and `/error/` (and any other
unknown path) all serve `index.html` — otherwise the scanner will see a
404 the first time it navigates to one of those URLs. `vite preview`
already does this fallback automatically.
