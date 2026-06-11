# Usage

```typescript
import { WebApp } from '@basetime/a2w-webview-ts';

const webApp = new WebApp();

// Wait for the SDK to determine whether the native bridge is
// available, then decide whether to render the embedded UI. The
// `boot` event fires exactly once per `WebApp` instance and is
// replayed for subscribers that register late.
webApp.on('boot', ({ payload }) => {
  if (!payload.isEmbedded) {
    throw new Error('This app is not embedded in the atw scanner webview.');
  }
});

// Listen for scan events from the scanner.
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
webApp.on('error', ({ payload }) => {
  console.log(payload.errorCode);
  console.log(payload.errorMessage);
});
```

Alternatively, you import the `WebApp` class directly from the CDN:

```html
<script type="module">
  import WebApp from 'https://cdn.addtowallet.io/js/webview/v0.2.3/WebApp.js';

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
