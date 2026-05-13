import { WebApp } from '@basetime/a2w-scanner-ts';
import type {
  ErrorPayload as SdkErrorPayload,
  ScanPayload as SdkScanPayload,
  Settings,
  StandbyPayload as SdkStandbyPayload,
} from '@basetime/a2w-scanner-ts/build/Message';

/**
 * Subset of the host app's `Settings` slice that scanner event payloads
 * carry. The native side merges scanner-app config with the dashboard's
 * `additionalSettings` bag, so arbitrary admin-defined keys may appear
 * alongside the typed ones below.
 */
export interface ScannerSettings {
  brandColor: string;
  brandLogoUrl: string;
  isKioskMode: boolean;
  tags: string[];
  webviewScanUrl: string;
  webviewStandbyUrl: string;
  webviewErrorUrl: string;
  webviewSpaUrl: string;
  [extra: string]: unknown;
}

/**
 * Convenience pass shape — the SDK exposes the full `Pass` from
 * `@basetime/a2w-api-ts`, but this example only needs a tiny subset.
 */
export interface PassRecord {
  id: string;
  primaryKey?: string;
  campaignId?: string;
  isScanned?: boolean;
  [key: string]: unknown;
}

/**
 * The SDK's payload types are tightened here to use our `ScannerSettings`
 * shape instead of the loose `Record<string, any>`.
 */
export type StandbyPayload = Omit<SdkStandbyPayload, 'settings'> & {
  settings: ScannerSettings;
};
export type ScanPayload = Omit<SdkScanPayload, 'settings'> & {
  settings: ScannerSettings;
};
export type ErrorPayload = Omit<SdkErrorPayload, 'settings'> & {
  settings: ScannerSettings;
};

export type { Settings };

/**
 * Event map used to type the `WebApp` instance. Extends the SDK's defaults
 * with this example's outbound `ready` event.
 */
export type ScannerEvents = {
  scan: ScanPayload;
  standby: StandbyPayload;
  error: ErrorPayload;
  navigate: { url: string };
  settings: { settings: Partial<Settings> };
  ready: { status?: string };
};

/**
 * Single SDK instance shared across the page entry, screens, and debug
 * panel. The native bridge injects `window.atw` via
 * `injectedJavaScriptBeforeContentLoaded`, so the bridge is always in
 * place by the time this module evaluates inside the WebView.
 *
 * Note: unlike `webview-spa`, this example imports `WebApp` from the main
 * `@basetime/a2w-scanner-ts` entry and uses it directly. The `/react`
 * subpath (with `useEvent` / `useWebApp` hooks) is intentionally not used.
 */
export const webApp = new WebApp<ScannerEvents>();
