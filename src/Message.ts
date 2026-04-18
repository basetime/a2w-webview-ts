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
  device: string | null;

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
   */
  pass: Pass;

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
 * The event message.
 */
export type Message<E extends Record<string, unknown>, K extends keyof E> = {
  /**
   * The action that was triggered.
   */
  action: K;

  /**
   * The payload of the event.
   */
  payload?: E[K];
};

/**
 * The events that can be triggered.
 */
export type AppEvents = {
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
};
