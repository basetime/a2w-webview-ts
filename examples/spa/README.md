# spa

Tiny Vite + React + TypeScript test harness for the persistent SPA webview
hosted by scanner. It listens for the events the native side
fires (`standby`, `scan`, `error`) and renders a stub screen for each, plus a
debug panel that lets you round-trip messages back to native.

See the SPA example in [examples/webview-spa](examples/webview-spa).

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

### Proxying the dev server with ngrok

When the scanner is on a different network than your laptop (or you just
want a stable HTTPS URL the device can hit), point [ngrok](https://ngrok.com)
at the Vite dev server.

```bash
pnpm dev                              # leave running on :5173
ngrok http 5173                       # in another shell
# or, with a reserved subdomain:
ngrok http --domain=your-subdomain.ngrok-free.dev 5173
```

ngrok prints a forwarding URL such as
`https://your-subdomain.ngrok-free.dev`. Vite blocks unknown hosts by
default, so add that hostname to `server.allowedHosts` in
[vite.config.ts](vite.config.ts) (it already lists one ngrok host as an
example) and restart `pnpm dev`:

```ts
server: {
  host: true,
  port: 5173,
  allowedHosts: ['localhost', 'your-subdomain.ngrok-free.dev'],
},
```

Then use the ngrok URL (e.g. `https://your-subdomain.ngrok-free.dev`)
in place of the LAN URL as the scanner's `webviewSpaUrl` setting.

## SDK

Communication with the native scanner goes through the official
[`@basetime/a2w-webview-ts`](https://www.npmjs.com/package/@basetime/a2w-webview-ts)
SDK, using its React hook subpath
[`@basetime/a2w-webview-ts/react`](https://www.npmjs.com/package/@basetime/a2w-webview-ts).
This example owns no SDK glue of its own — there's no `atw.ts`, no
singleton, and no custom event map. Components import the hooks and the
payload types they need directly from the package.

```tsx
import type { StandbyPayload } from '@basetime/a2w-webview-ts';
import { useEvent, useWebApp } from '@basetime/a2w-webview-ts/react';

useEvent('standby', ({ payload }) => {
  // payload is typed as StandbyPayload | undefined via the SDK's
  // default AppEvents map.
});

const webApp = useWebApp();
webApp.send('navigate', { url: '/scan' });
```

Under the hood:

- `useEvent(event, cb)` subscribes via `WebApp.on(event, cb)` for the
  lifetime of the component and unsubscribes on unmount. The callback is
  held in a ref so passing an inline function does not re-subscribe on
  every render. The callback receives the full SDK `Message<E, K>`
  (`{ action, payload }`); destructure `payload` if you only need the
  body.
- `useWebApp()` returns a memoized `WebApp` instance that's stable across
  renders, so `webApp.send(...)` can be called from event handlers or
  effects without thrashing the native bridge.

Both hooks default to the SDK's built-in `AppEvents` map, so `payload` is
already typed correctly without passing any generic. Provide a custom
event map (`useEvent<MyEvents, ...>` / `useWebApp<MyEvents>`) only if
your app extends `AppEvents` with new events.

The SPA detects when it isn't embedded: `main.tsx` constructs a
throwaway `new WebApp()` to check `isEmbedded` and renders a small
"open in the scanner" screen
([src/screens/NotEmbeddedScreen.tsx](src/screens/NotEmbeddedScreen.tsx))
when `window.atw` / `window.ReactNativeWebView` aren't present, instead
of throwing. The main `<App />` only mounts inside the scanner WebView,
so its event subscriptions and `ready` send don't fire from a regular
browser tab.

Events received by this SPA (all types come from `@basetime/a2w-webview-ts`):

| event     | payload type     | fired from                              |
| --------- | ---------------- | --------------------------------------- |
| `standby` | `StandbyPayload` | home screen on focus                    |
| `scan`    | `ScanPayload`    | `/pass` once the pass record is fetched |
| `error`   | `ErrorPayload`   | `ErrorPage` on fetch failure            |

Actions this SPA sends back:

| action     | payload                           | handled by native                                           |
| ---------- | --------------------------------- | ----------------------------------------------------------- |
| `ready`    | `{}` (once on mount)              | flips `SpaWebViewHost` `isReady` and hides the boot spinner |
| `navigate` | `{ url: '/' \| '/scan' }`         | calls `router.replace(url)`                                 |
| `settings` | `{ settings: Partial<Settings> }` | dispatches `updateSettings`                                 |

> The SDK's `ScanPayload.found` is typed as `boolean`; the legacy native
> bridge still emits it as the string `'true'`/`'false'`. Screens use a
> `!!payload.found` cast so both shapes work.

## Build

```bash
pnpm build      # static bundle in dist/
pnpm preview    # serve dist/ over the LAN
pnpm typecheck  # tsc --noEmit
```
