# a2w-scanner-ts

SDK for embedded apps running inside the atw scanner webview.

## Installation

```bash
npm install @basetime/a2w-scanner-ts
```

## Usage

```typescript
import { WebApp } from '@basetime/a2w-scanner-ts';

const webApp = new WebApp();

// Check if the app is embedded in the atw scanner webview.
if (!webApp.isEmbedded) {
  throw new Error('This app is not embedded in the atw scanner webview.');
}

// Listen for scan events from the scanner.
// The message object contains the following properties:
// - `scanner`: The scanner id.
// - `settings`: The settings associated with the scanner.
// - `tags`: The tags associated with the scanner app.
// - `location`: The location of the scanner.
// - `found`: Whether the pass was found or not. Value will be `true` or `false`.
// - `pass`: The entire pass object, which contains the campaign.
// - `password`: The password if one was set in the Addtowallet app.
// - `webviewHeight`: The height of the webview.
// - `webviewWidth`: The width of the webview.
// - `device`: {
// -    manufacturer: e.g. "Google", "xiaomi", "Apple", "Google", null
// -    model: e.g. "Pixel 2", "iPhone XS Max", "iPhone", null
// -    osVersion: e.g. "4.0.3", "12.3.1", "11.0", "8.1.0"
// -    deviceName: e.g. name of the phone, "Vivian's iPhone XS"
// - }
webApp.on('scan', ({ payload }) => {
  console.log(payload);

  const isApple = payload.device.model.toLowerCase().includes('iphone');
  console.log(`Using ${isApple ? 'iPhone' : 'Android'}`);

  // Check the password if one as set in the Addtowallet app.
  if (payload.password !== '123434) {
    throw new Error('Invalid password.');
  }

  // Notify the scanner that the webview is ready. (Not currently used.)
  webApp.send('ready');

  // Wait 5 seconds before navigating to the standby screen.
  setTimeout(() => {
    webApp.send('navigate', { url: '/' });
  }, 5000);
});

// Triggered when the scanner is on the home screen.
// The message object contains the following properties:
// - `scanner`: The scanner id.
// - `settings`: The settings associated with the scanner.
// - `password`: The password if one was set in the Addtowallet app.
// - `location`: The location of the scanner.
// - `webviewHeight`: The height of the webview.
// - `webviewWidth`: The width of the webview.
// - `device`: {
// -    manufacturer: e.g. "Google", "xiaomi", "Apple", "Google", null
// -    model: e.g. "Pixel 2", "iPhone XS Max", "iPhone", null
// -    osVersion: e.g. "4.0.3", "12.3.1", "11.0", "8.1.0"
// -    deviceName: e.g. name of the phone, "Vivian's iPhone XS"
// - }
webApp.on('standby', ({ payload }) => {
  console.log(payload);
  console.log('The scanner is in standby mode.');

  // Override these settings in the scanner app.
  // They remain overridden until the `force` flag is
  // used by the backend.
  webApp.send('settings', {
    pin: '1234',
    webviewStandbyUrl: 'https://example.com/standby',
  });
});

// Triggered when an error is encountered in the scanner. For example,
// if a pass or campaign is not found.
// - `scanner`: The scanner id.
// - `settings`: The settings associated with the scanner.
// - `password`: The password if one was set in the Addtowallet app.
// - `location`: The location of the scanner.
// - `webviewHeight`: The height of the webview.
// - `webviewWidth`: The width of the webview.
// - `errorCode`: A representation of the error, e.g. 404
// - `errorMessage`: A string representation of the error, e.g. "Campaign not found"
// - `device`: {
// -    manufacturer: e.g. "Google", "xiaomi", "Apple", "Google", null
// -    model: e.g. "Pixel 2", "iPhone XS Max", "iPhone", null
// -    osVersion: e.g. "4.0.3", "12.3.1", "11.0", "8.1.0"
// -    deviceName: e.g. name of the phone, "Vivian's iPhone XS"
// - }
webApp.on('error', ({ payload }) => {
  console.log(payload.errorCode);
  console.log(payload.errorMessage);
});
```

Alternatively, you import the `WebApp` class directly from the CDN:

```html
<script type="module">
  import WebApp from 'https://cdn.addtowallet.io/js/scanner/v0.1.7/WebApp.js';

  const webApp = new WebApp();

  // Listen for scan events from the scanner.
  webApp.on('scan', ({ payload }) => {
    console.log(payload);
  });

  // Listen for standby events from the scanner.
  webApp.on('standby', ({ payload }) => {
    console.log('The scanner is in standby mode.');
  });

  // Listen for error events from the scanner.
  webApp.on('error', ({ payload }) => {
    console.log('There has been an error.');
  });
</script>
```

## React

If your embedded app is built with React, the SDK ships a small set of
hooks under the optional `/react` subpath. React is declared as an
**optional peer dependency**, so non-React consumers don't pay any bundle
cost and don't need to install it.

```bash
npm install @basetime/a2w-scanner-ts react
```

```tsx
import { useEvent, useWebApp } from '@basetime/a2w-scanner-ts/react';

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

  // `useWebApp` is only needed if you want to call `send`, check
  // `isEmbedded`, or otherwise access the instance directly.
  const webApp = useWebApp();
  if (!webApp.isEmbedded) {
    return <p>Open this app inside the atw scanner.</p>;
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
  to call `send`, inspect `isEmbedded`, or otherwise interact with the
  scanner imperatively.

## Events

The scanner communicates with your embedded app through a small set of events.
Inbound events (`scan`, `standby`, `error`) are dispatched by the scanner and
consumed via `webApp.on(...)`. Outbound events (`navigate`, `settings`) are
sent from your app back to the scanner via `webApp.send(...)`.

All inbound event callbacks receive a message object of the shape
`{ action, payload }`, where `action` is the event name and `payload` is the
event-specific data described below.

### `scan`

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

### `standby`

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

### `error`

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

### `navigate`

Sent from your app to the scanner to instruct it to navigate one of its
webviews to a new URL. Commonly used after handling a `scan` event to return
the scanner to its standby screen or to advance to a custom flow.

```typescript
webApp.send('navigate', { url: '/' });
```

`payload` (`NavigatePayload`) properties:

- `url` (`string`): The URL (or path) the scanner should navigate to.

### `ready`

Sent from your app to the scanner to notify it that the webview is ready.

```typescript
webApp.send('ready');
```

### `settings`

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
