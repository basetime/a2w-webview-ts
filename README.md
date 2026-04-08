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
webApp.on('scan', ({ payload }) => {
  console.log(payload);

  // Check the password if one as set in the Addtowallet app.
  if (payload.password !== '123434) {
    throw new Error('Invalid password.');
  }

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
webApp.on('standby', ({ payload }) => {
  console.log(payload);
  console.log('The scanner is in standby mode.');
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
