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

// Listen for scan events from the scanner.
webApp.on('scan', (message) => {
  console.log(message);
});

// Send a message to the scanner to navigate to the scan screen.
webApp.send({ action: 'navigate', payload: 'scan' });
```

Alternatively, you import the `WebApp` class directly from the CDN:

```html
<script type="module">
  import WebApp from 'https://cdn.addtowallet.io/js/scanner/v0.0.3/WebApp.js';

  const webApp = new WebApp();

  // Listen for scan events from the scanner.
  webApp.on('scan', (message) => {
    console.log(message);
  });

  // Send a message to the scanner to navigate to the scan screen.
  webApp.send({ action: 'navigate', payload: 'scan' });
</script>
```
