import { WebApp } from '@basetime/a2w-scanner-ts';

/**
 * Single SDK instance shared across the page entries, screens, and debug
 * panel. The native bridge injects `window.atw` via
 * `injectedJavaScriptBeforeContentLoaded`, so the bridge is always in
 * place by the time this module evaluates inside the WebView.
 *
 * Note: unlike `webview-spa`, this example imports `WebApp` from the main
 * `@basetime/a2w-scanner-ts` entry and uses it directly. The `/react`
 * subpath (with `useEvent` / `useWebApp` hooks) is intentionally not used.
 *
 * Payload types (`ScanPayload`, `StandbyPayload`, `ErrorPayload`, etc.)
 * should be imported from `@basetime/a2w-scanner-ts` directly at the call
 * site rather than re-exported here.
 */
export const webApp = new WebApp();
