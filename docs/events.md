# Events

The scanner communicates with your embedded app through a small set of events.
Inbound events (`scan`, `standby`, `error`) are dispatched by the scanner and
consumed via `webApp.on(...)`. Outbound events (`navigate`, `settings`) are
sent from your app back to the scanner via `webApp.send(...)`.

All inbound event callbacks receive a message object of the shape
`{ action, payload }`, where `action` is the event name and `payload` is the
event-specific data described below.

## Wildcard listener

Pass `'*'` as the event name to subscribe to every built-in event in a single
call. The callback fires once per event with the actual `action` (e.g.
`'scan'`), so it's a convenient way to log, debug, or proxy all scanner
traffic without registering a handler per event:

```typescript
const off = webApp.on('*', ({ action, payload }) => {
  console.log('scanner event:', action, payload);
});

// Later, to unsubscribe:
off();
// or equivalently:
webApp.off('*', callback);
```

The wildcard covers the SDK's built-in native `AppEvents` keys (`scan`,
`standby`, `error`, `navigate`, `ready`, `settings`); the synthetic
`boot` event and custom event names added via a typed `WebApp<E>` are
not included.

The same wildcard works in the React hook:

```tsx
import { useEvent } from '@basetime/a2w-webview-ts/react';

useEvent('*', ({ action, payload }) => {
  console.log('scanner event:', action, payload);
});
```

## `boot`

A **synthetic** event emitted by the SDK itself (not by the native
bridge) once it has determined whether `window.atw` is or will become
available. Fires exactly once per `WebApp` instance. Subscribers that
register after the event has already fired receive the cached payload
asynchronously, so it is safe to subscribe at any time.

`boot` is **not** included in the `'*'` wildcard fan-out because it
does not correspond to a real native event.

Use `boot` instead of the deprecated synchronous `isEmbedded` getter
when gating your UI on whether the app is embedded — on older Android
WebView runtimes the native bridge can be injected after `WebApp` is
constructed, which makes a synchronous check unreliable.

```typescript
webApp.on('boot', ({ payload }) => {
  if (!payload.isEmbedded) {
    // render a "not embedded" UI
    return;
  }
  // proceed with the embedded UI
});
```

`payload` (`BootPayload`) properties:

- `isEmbedded` (`boolean`): Whether the app is embedded inside the atw
  scanner webview, i.e. whether the native bridge is available.

While the SDK is waiting for the bridge, calls to `webApp.send(...)`
are queued and flushed in order once the bridge appears; calls to
`webApp.on(nativeEvent, ...)` are likewise queued and attached on
arrival. If the bridge never appears within 10 seconds the SDK emits
`boot` with `isEmbedded: false`, logs a `console.warn`, and drops any
queued messages or pending subscriptions.

## `scan`

Triggered by the scanner each time it processes a pass scan, regardless of
whether the pass was found. Use this event to validate the pass, run any
business logic against the campaign, and optionally drive the scanner to a
new screen using the `navigate` event.

```typescript
webApp.on('scan', ({ payload }) => {
  if (!payload.found) {
    console.warn('Pass not recognized');
    return;
  }

  console.log('Scanned pass:', payload.pass);
});
```

`payload` (`ScanPayload`) properties:

- `scanner` (`string`): The ID of the scanner that produced the event.
- `barcode` (`string`): The barcode of the scanned pass.
- `isA2w` (`boolean`): Whether the scanned pass is an A2W pass.
- `location` (`string`): The device location as `"latitude,longitude"`.
- `found` (`boolean`): Whether the scanned pass was found in the system.
- `pass` (`Pass`): The full pass object, including its associated campaign.
- `tags` (`string[]`): The tags associated with the scanner.
- `password` (`string`): The password configured in the Addtowallet app, if
  any. Useful for authenticating the request inside your handler.
- `settings` (`Record<string, any>`): Additional scanner settings.
- `webviewHeight` (`number`): The height of the scanner webview in pixels.
- `webviewWidth` (`number`): The width of the scanner webview in pixels.
- `device` (`ScannerDeviceInfo`): Information about the device:
  - `manufacturer` (`string | null`): e.g. `"Apple"`, `"Google"`, `"xiaomi"`.
  - `model` (`string | null`): e.g. `"iPhone XS Max"`, `"Pixel 2"`.
  - `osVersion` (`string | null`): e.g. `"12.3.1"`, `"11.0"`.
  - `deviceName` (`string | null`): The user-assigned device name, e.g.
    `"Vivian's iPhone XS"`. May be `null` if unavailable.

## `standby`

Triggered when the scanner is sitting on its home / standby screen. This is a
good place to push per-device configuration overrides via the `settings`
event, or to render an idle UI in your embedded webview.

```typescript
webApp.on('standby', ({ payload }) => {
  console.log('Scanner', payload.scanner, 'is idle');
});
```

`payload` (`StandbyPayload`) properties:

- `scanner` (`string`): The ID of the scanner.
- `location` (`string`): The device location as `"latitude,longitude"`.
- `password` (`string`): The password configured in the Addtowallet app, if
  any.
- `settings` (`Record<string, any>`): Additional scanner settings.
- `webviewHeight` (`number`): The height of the scanner webview in pixels.
- `webviewWidth` (`number`): The width of the scanner webview in pixels.
- `device` (`ScannerDeviceInfo`): Device information (see `scan` above).

## `error`

Triggered whenever the scanner encounters a recoverable error, such as a
missing pass or campaign. Use this event to surface a user-friendly error
state inside your webview.

```typescript
webApp.on('error', ({ payload }) => {
  console.error(`[${payload.errorCode}] ${payload.errorMessage}`);
});
```

`payload` (`ErrorPayload`) properties:

- `scanner` (`string`): The ID of the scanner.
- `location` (`string`): The device location as `"latitude,longitude"`.
- `password` (`string`): The password configured in the Addtowallet app, if
  any.
- `settings` (`Record<string, any>`): Additional scanner settings.
- `webviewHeight` (`number`): The height of the scanner webview in pixels.
- `webviewWidth` (`number`): The width of the scanner webview in pixels.
- `device` (`ScannerDeviceInfo`): Device information (see `scan` above).
- `errorCode` (`number`): A numeric representation of the error, e.g. `404`.
- `errorMessage` (`string`): A human-readable description of the error, e.g.
  `"Campaign not found"`.

## `navigate`

Sent from your app to the scanner to instruct it to navigate one of its
webviews to a new URL. Commonly used after handling a `scan` event to return
the scanner to its standby screen or to advance to a custom flow.

```typescript
webApp.send('navigate', { url: '/' });
```

`payload` (`NavigatePayload`) properties:

- `url` (`string`): The URL (or path) the scanner should navigate to.

## `ready`

Sent from your app to the scanner to notify it that the webview is ready.

```typescript
webApp.send('ready');
```

## `settings`

Sent from your app to override scanner settings at runtime. Overrides
provided this way persist on the device until the backend pushes a new
settings payload with the `force` flag. Only the fields you provide are
updated; everything else is left untouched.

```typescript
webApp.send('settings', {
  pin: '1234',
  webviewStandbyUrl: 'https://example.com/standby',
});
```

`payload` is a `Partial<Settings>` object. Supported fields:

- `baseUrl` (`string`): The base URL of the API.
- `pin` (`string`): The PIN that unlocks the scanner's settings screen.
- `brandColor` (`string`): The brand color used by the scanner UI.
- `brandLogoUrl` (`string`): The URL of the brand logo.
- `tags` (`string[]`): The tags associated with the scanner.
- `webviewSpaUrl` (`string`): The URL displayed in the SPA webview.
- `webviewScanUrl` (`string`): The URL displayed in the scan webview.
- `webviewStandbyUrl` (`string`): The URL displayed in the standby webview.
- `webviewErrorUrl` (`string`): The URL displayed in the error webview.
- `webviewPassword` (`string`): The password required to access the webview.
- `isKioskMode` (`boolean`): Whether to hide the scan button on the home
  screen.
- `debugWebviews` (`boolean`): Whether to enable debug mode for webviews.
- `logLevel` (`'debug' | 'info' | 'error'`): Minimum log severity. `debug`
  logs everything; `info` logs info and errors; `error` logs only errors.
- `additionalSettings` (`Record<string, any>`): Arbitrary additional
  settings.
