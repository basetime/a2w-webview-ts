import type { Pass } from '@basetime/a2w-api-ts';

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
   * Triggered to tell the scanner to navigate to a URL.
   */
  navigate: NavigatePayload;
};
