# webview-spa

Tiny Vite + React + TypeScript test harness for the persistent SPA webview
hosted by scanner. It listens for the events the native side
fires (`standby`, `scan`, `error`) and renders a stub screen for each, plus a
debug panel that lets you round-trip messages back to native.

## Run

```bash
pnpm install
pnpm dev
```

`vite --host` prints both a `localhost` URL and a LAN URL. Copy the LAN URL
(for example `http://192.168.1.42:5173`) and set it as the scanner's
`webviewSpaUrl` setting (via the dashboard or via `setSettings` in
[../store/settingsSlice.ts](../store/settingsSlice.ts)). The mobile app loads
this SPA once at boot and then dispatches events to it instead of reloading
per-screen webviews.

## SDK

Communication with the native scanner goes through the official
[`@basetime/a2w-scanner-ts`](https://www.npmjs.com/package/@basetime/a2w-scanner-ts)
SDK. A singleton `WebApp` is created in [`src/atw.ts`](src/atw.ts):

```ts
import { useWebAppEvent, webAppSend } from './atw';

useWebAppEvent('standby', (payload) => {
  // payload is typed as StandbyPayload | undefined
});

webAppSend('navigate', { url: '/scan' });
```

Under the hood:

- `useWebAppEvent(event, cb)` subscribes via `webApp.on(event, cb)` and
  removes the listener on unmount. The callback receives the unwrapped
  `payload` from the SDK's `Message<E, K>`.
- `webAppSend(action, payload)` calls `webApp.send(action, payload)`,
  which serializes as `{ action, payload }` for the native side.

The SPA refuses to boot when not embedded: `main.tsx` checks
`webApp.isEmbedded` and throws if `window.atw` / `window.ReactNativeWebView`
aren't present, matching the SDK's documented usage. Open this URL only via
the scanner app, not in a regular browser tab.

Events received by this SPA (typed via the SDK in `src/atw.ts`):

| event     | payload type     | fired from                              |
| --------- | ---------------- | --------------------------------------- |
| `standby` | `StandbyPayload` | home screen on focus                    |
| `scan`    | `ScanPayload`    | `/pass` once the pass record is fetched |
| `error`   | `ErrorPayload`   | `ErrorPage` on fetch failure            |

Actions this SPA sends back:

| action     | payload                               | handled by native                                           |
| ---------- | ------------------------------------- | ----------------------------------------------------------- |
| `ready`    | `{ status: 'ready' }` (once on mount) | flips `SpaWebViewHost` `isReady` and hides the boot spinner |
| `navigate` | `{ url: '/' \| '/scan' }`             | calls `router.replace(url)`                                 |
| `settings` | `{ settings: Partial<Settings> }`     | dispatches `updateSettings`                                 |

> The SDK's `ScanPayload.found` is typed as `boolean`; the legacy native
> bridge still emits it as the string `'true'`/`'false'`. Screens use a
> `!!payload.found` cast so both shapes work.

## Build

```bash
pnpm build      # static bundle in dist/
pnpm preview    # serve dist/ over the LAN
pnpm typecheck  # tsc --noEmit
```
