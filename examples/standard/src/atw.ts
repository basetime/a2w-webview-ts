import { WebApp } from '@basetime/a2w-webview-ts';

/**
 * Single SDK instance shared across the page entries, screens, and debug
 * panel. On most production WebViews the native bridge injects
 * `window.atw` via `injectedJavaScriptBeforeContentLoaded` and the
 * bridge is in place by the time this module evaluates. On older
 * Android WebView runtimes (notably some PAX devices) the injection
 * can lag behind module evaluation, so consumers should gate UI on the
 * `boot` event rather than the deprecated synchronous `isEmbedded`
 * getter — see `main.tsx` for the recommended pattern.
 *
 * Note: unlike `webview-spa`, this example imports `WebApp` from the main
 * `@basetime/a2w-webview-ts` entry and uses it directly. The `/react`
 * subpath (with `useEvent` / `useWebApp` hooks) is intentionally not used.
 *
 * Payload types (`ScanPayload`, `StandbyPayload`, `ErrorPayload`, etc.)
 * should be imported from `@basetime/a2w-webview-ts` directly at the call
 * site rather than re-exported here.
 */
export const webApp = new WebApp();
