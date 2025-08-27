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
// - `location`: The location of the scanner.
// - `found`: Whether the pass was found or not. Value will be `true` or `false`.
// - `pass`: The entire pass object, which contains the campaign.
// - `webviewHeight`: The height of the webview.
// - `webviewWidth`: The width of the webview.
webApp.on('scan', ({ payload }) => {
  console.log(payload);

  // Wait 5 seconds before navigating to the standby screen.
  setTimeout(() => {
    webApp.send('navigate', { url: '/' });
  }, 5000);
});

// Triggered when the scanner is on the home screen.
// The message object contains the following properties:
// - `scanner`: The scanner id.
// - `location`: The location of the scanner.
// - `webviewHeight`: The height of the webview.
// - `webviewWidth`: The width of the webview.
webApp.on('standby', ({ payload }) => {
  console.log(payload);
  console.log('The scanner is in standby mode.');
});
```

Alternatively, you import the `WebApp` class directly from the CDN:

```html
<script type="module">
  import WebApp from 'https://cdn.addtowallet.io/js/scanner/v0.0.3/WebApp.js';

  const webApp = new WebApp();

  // Listen for scan events from the scanner.
  webApp.on('scan', ({ payload }) => {
    console.log(payload);
  });

  // Listen for standby events from the scanner.
  webApp.on('standby', ({ payload }) => {
    console.log('The scanner is in standby mode.');
  });
</script>
```
