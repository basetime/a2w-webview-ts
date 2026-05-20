import type { Pass } from '@basetime/a2w-api-ts';

/**
 * Represents information about a scanner device.
 */
export interface ScannerDeviceInfo {
  /**
   * The actual device manufacturer of the product or hardware.
   * This value of this field may be `null` if it cannot be determined.
   */
  manufacturer: string | null;

  /**
   * The human-friendly name of the device model. This is the name
   * that people would typically use to refer to the device rather
   * than a programmatic model identifier.
   *
   * This value of this field may be `null` if it cannot be determined.
   */
  model: string | null;

  /**
   * The human-readable OS version string. Note that the version
   * string may not always contain three numbers separated by dots.
   */
  osVersion: string | null;

  /**
   * The human-readable name of the device, which may be set
   * by the device's user. If the device name is unavailable,
   * particularly on web, this value is `null`.
   */
  deviceName: string | null;
}

/**
 * Payload for the 'scan' event.
 */
export interface ScanPayload {
  /**
   * The ID of the scanner.
   */
  scanner: string;

  /**
   * The barcode of the scanned pass.
   */
  barcode: string;

  /**
   * The location of the device as "latitude,longitude".
   */
  location: string;

  /**
   * Whether the pass was found or not.
   */
  found: boolean;

  /**
   * The height of the scanner webview.
   */
  webviewHeight: number;

  /**
   * The width of the scanner webview.
   */
  webviewWidth: number;

  /**
   * The pass object.
   * 
   * Will be null when a non-a2w barcode was scanned.
   */
  pass: Pass | null;

  /**
   * The tags associated with the scanner.
   */
  tags: string[];

  /**
   * A password used to authenticate the request.
   */
  password: string;

  /**
   * Additional settings for the scanner.
   */
  settings: Record<string, any>;

  /**
   * The device information.
   */
  device: ScannerDeviceInfo;
}

/**
 * Payload for the 'standby' event.
 */
export interface StandbyPayload {
  /**
   * The ID of the scanner.
   */
  scanner: string;

  /**
   * The location of the device as "latitude,longitude".
   */
  location: string;

  /**
   * The height of the scanner webview.
   */
  webviewHeight: number;

  /**
   * The width of the scanner webview.
   */
  webviewWidth: number;

  /**
   * A password used to authenticate the request.
   */
  password: string;

  /**
   * Additional settings for the scanner.
   */
  settings: Record<string, any>;

  /**
   * The device information.
   */
  device: ScannerDeviceInfo;
}

/**
 * Payload for the 'error' event.
 */
export interface ErrorPayload {
  /**
 * The ID of the scanner.
 */
  scanner: string;

  /**
   * The location of the device as "latitude,longitude".
   */
  location: string;

  /**
   * The height of the scanner webview.
   */
  webviewHeight: number;

  /**
   * The width of the scanner webview.
   */
  webviewWidth: number;

  /**
   * A password used to authenticate the request.
   */
  password: string;

  /**
   * Additional settings for the scanner.
   */
  settings: Record<string, any>;

  /**
   * The device information.
   */
  device: ScannerDeviceInfo;

  /**
   * The error message.
   */
  errorMessage: string;

  /**
   * The error code.
   */
  errorCode: number;
}

/**
 * Payload for the 'navigate' event.
 */
export interface NavigatePayload {
  /**
   * The URL to navigate to.
   */
  url: string;
}

/**
 * Payload for the synthetic 'boot' event.
 *
 * The `boot` event is emitted by the SDK itself (not by the native
 * bridge) once it has determined whether `window.atw` is or will become
 * available. It fires exactly once per `WebApp` instance and is
 * replayed for listeners that subscribe after it has already fired.
 */
export interface BootPayload {
  /**
   * Whether the app is embedded inside the atw scanner webview, i.e.
   * whether the native bridge (`window.atw`) is available.
   */
  isEmbedded: boolean;
}

export type LogLevel = 'debug' | 'info' | 'error';

/**
 * Settings for the scanner.
 */
export interface Settings {
  /**
   * The base url of the api.
   */
  baseUrl: string;

  /**
   * The pin that unlocks the settings screen.
   */
  pin: string;

  /**
   * The brand color.
   */
  brandColor: string;

  /**
   * The brand logo URL.
   */
  brandLogoUrl: string;

  /**
   * The tags associated with the scanner.
   */
  tags: string[];

  /**
   * The url of the persistent single-page-app webview that is loaded once at
   * app boot and reused across screens via events instead of being reloaded.
   * When empty, the per-screen webviews above are used as before.
   */
  webviewSpaUrl: string;

  /**
   * The url of the page to display in the scan webview.
   */
  webviewScanUrl: string;

  /**
   * The url of the page to display in the pass standby webview.
   */
  webviewStandbyUrl: string;

  /**
   * The url of the page to display in the error webview.
   */
  webviewErrorUrl: string;

  /**
   * The password to use to access the webview.
   */
  webviewPassword: string;

  /**
   * Whether or not to hide the scan button on the home screen.
   */
  isKioskMode: boolean;

  /**
   * Whether or not to enable debug mode for the webviews.
   */
  debugWebviews: boolean;

  /**
   * Minimum log severity: debug logs everything; info logs info and errors; error only errors.
   */
  logLevel: LogLevel;

  /**
   * Additional settings.
   */
  additionalSettings: Record<string, any>;
}

/**
 * Payload for the 'settings' event.
 */
export interface SettingsPayload {
  /**
   * The settings to update.
   */
  settings: Partial<Settings>;
}

/**
 * The event message.
 *
 * `payload` is required when the event's payload type cannot be
 * `undefined` (e.g. `boot`, `scan`, `navigate`), and optional when the
 * event declares its payload as `undefined` or `T | undefined` (e.g.
 * `ready`). This lets consumers dot into `payload.foo` directly for
 * events that always carry one, without a redundant nullish check.
 */
export type Message<E extends Record<string, unknown>, K extends keyof E> =
  undefined extends E[K]
    ? {
        /**
         * The action that was triggered.
         */
        action: K;

        /**
         * The payload of the event.
         */
        payload?: E[K];
      }
    : {
        /**
         * The action that was triggered.
         */
        action: K;

        /**
         * The payload of the event.
         */
        payload: E[K];
      };

/**
 * The events that can be triggered.
 */
export type AppEvents = {
  /**
   * Synthetic, SDK-emitted event that fires once per `WebApp` instance
   * after the native bridge readiness has been resolved (either the
   * bridge appeared, or the SDK timed out waiting for it). Subscribers
   * registered after the event has already fired receive the cached
   * payload via microtask.
   *
   * Unlike the native bridge events, `boot` is **not** included in the
   * `'*'` wildcard fan-out.
   */
  boot: BootPayload;

  /**
   * Triggered when the scanner scans a pass.
   */
  scan: ScanPayload;

  /**
   * Triggered when the scanner is on the home screen.
   */
  standby: StandbyPayload;

  /**
   * Triggered when an error occurs.
   */
  error: ErrorPayload;

  /**
   * Triggered to tell the scanner to navigate to a URL.
   */
  navigate: NavigatePayload;

  /**
   * Triggered when the webview is ready. This event carries no
   * payload; callers should invoke `send('ready')` with no second
   * argument.
   */
  ready: undefined;

  /**
   * Triggered to tell the scanner to update the settings.
   */
  settings: SettingsPayload;
};

/**
 * Runtime list of the SDK's built-in *native* `AppEvents` keys. Used by
 * `WebApp.on('*', ...)` to fan a wildcard subscription out to each
 * known event, since the underlying native bridge requires explicit
 * per-event subscriptions.
 *
 * The synthetic `boot` event is intentionally excluded; it is emitted
 * by the SDK itself rather than by the native bridge and would never
 * be observed by a wildcard listener that proxies "scanner traffic".
 */
export const APP_EVENT_NAMES = [
  'scan',
  'standby',
  'error',
  'navigate',
  'ready',
  'settings',
] as const satisfies readonly Exclude<keyof AppEvents, 'boot'>[];
