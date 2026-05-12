import { WebApp } from '@basetime/a2w-scanner-ts';
import type {
  ErrorPayload as SdkErrorPayload,
  ScanPayload as SdkScanPayload,
  Settings,
  StandbyPayload as SdkStandbyPayload,
} from '@basetime/a2w-scanner-ts/build/Message';
import { useEffect, useRef } from 'react';

/**
 * Subset of the host app's `Settings` slice that `useWebviewPayload`
 * surfaces in every event payload. The native side merges scanner-app
 * config with the dashboard's `additionalSettings` bag, so arbitrary
 * admin-defined keys may appear alongside the typed ones below.
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
 * `@basetime/a2w-api-ts`, but the SPA only needs a tiny subset.
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
 * with the SPA's outbound `ready` event (the native side flips its boot
 * spinner off when it sees this).
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
 * Single SDK instance shared by the whole SPA. The native bridge injects
 * `window.atw` via `injectedJavaScriptBeforeContentLoaded`, so the bridge
 * is always in place by the time this module evaluates inside the WebView.
 */
export const webApp = new WebApp<ScannerEvents>();

/**
 * React hook: subscribe to a scanner event for the lifetime of the
 * component. The callback receives the unwrapped payload; per the SDK's
 * `Message<E, K>` contract `payload` may be `undefined`.
 */
export const useWebAppEvent = <K extends keyof ScannerEvents>(
  event: K,
  callback: (payload: ScannerEvents[K] | undefined) => void,
): void => {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const remove = webApp.on(event, ({ payload }) => {
      cbRef.current(payload);
    });
    return () => {
      remove();
    };
  }, [event]);
};

/**
 * Type-safe wrapper around `webApp.send`. Native receives
 * `{ action, payload }` exactly as the SDK serializes it.
 */
export const webAppSend = <K extends keyof ScannerEvents>(
  action: K,
  payload: ScannerEvents[K],
): void => {
  webApp.send(action, payload);
};
