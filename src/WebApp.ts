import type { Addtowallet } from './Addtowallet';
import { APP_EVENT_NAMES, type AppEvents, type Message } from './types';

const BRIDGE_POLL_INTERVAL_MS = 50;
const BRIDGE_POLL_TIMEOUT_MS = 10000;

/**
 * Provides two way communication with the atw scanner.
 */
export default class WebApp<E extends Record<string, unknown> = AppEvents> {
  /**
   * Is the app embedded in the atw scanner webview?
   */
  public get isEmbedded(): boolean {
    return this.getBridge() !== undefined;
  }

  /**
   * Tracks the per-event removers created when subscribing via the
   * wildcard event `'*'`, keyed by the user-supplied callback so that
   * `off('*', cb)` can find and invoke them.
   */
  private readonly wildcardRemovers = new Map<Function, Array<() => void>>();

  /**
   * Constructor.
   */
  constructor() {}

  /**
   * Returns the current native bridge if it exists. The bridge can be injected
   * after this class is constructed on older Android WebView runtimes, so we
   * intentionally avoid caching it in the constructor.
   */
  private getBridge = (): Addtowallet | undefined => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (window.ReactNativeWebView === undefined || window.atw === undefined) {
      return undefined;
    }

    return window.atw;
  };

  /**
   * Subscribes once the native bridge exists. In normal browsers this remains
   * a no-op; in React Native WebView it waits briefly for `window.atw`.
   */
  private subscribeWhenBridgeReady = (
    event: string,
    callback: (message: Message<E, any>) => void,
  ): (() => void) => {
    let attached = false;
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const attach = () => {
      if (cancelled) {
        return;
      }

      const bridge = this.getBridge();
      if (bridge) {
        bridge.on(event, callback);
        attached = true;
        return;
      }

      if (typeof window === 'undefined' || window.ReactNativeWebView === undefined) {
        return;
      }

      if (Date.now() - startedAt >= BRIDGE_POLL_TIMEOUT_MS) {
        return;
      }

      timeout = setTimeout(attach, BRIDGE_POLL_INTERVAL_MS);
    };

    attach();

    return () => {
      cancelled = true;

      if (timeout) {
        clearTimeout(timeout);
      }

      if (attached) {
        this.getBridge()?.off(event, callback);
      }
    };
  };

  /**
   * Sends a message to the scanner.
   *
   * @param event The event to post.
   * @param payload The message to post.
   */
  public send = <K extends keyof E>(event: K, payload?: E[K]): void => {
    this.getBridge()?.send({
      action: event.toString(),
      payload: payload ?? ({} as E[K]),
    });
  };

  /**
   * Receives a message from the webview.
   *
   * Returns a function that removes the event listener.
   *
   * Pass `'*'` as the event name to subscribe to every built-in
   * `AppEvents` key (`scan`, `standby`, `error`, `navigate`, `ready`,
   * `settings`). The callback receives messages whose `action` field
   * is the actual event name (e.g. `'scan'`), not `'*'`.
   *
   * @param event The event to listen to, or `'*'` for all events.
   * @param callback The callback to call when a message is received.
   */
  public on(event: '*', callback: (message: Message<E, keyof E>) => void): () => void;
  public on<K extends keyof E>(
    event: K,
    callback: (message: Message<E, K>) => void,
  ): () => void;
  public on(
    event: '*' | keyof E,
    callback: (message: Message<E, any>) => void,
  ): () => void {
    if (event === '*') {
      const removers = APP_EVENT_NAMES.map((name) =>
        this.on(name as keyof E, callback as (m: Message<E, keyof E>) => void),
      );
      this.wildcardRemovers.set(callback, removers);
      return () => {
        removers.forEach((r) => r());
        this.wildcardRemovers.delete(callback);
      };
    }
    return this.subscribeWhenBridgeReady(event.toString(), callback);
  }

  /**
   * Removes an event listener.
   *
   * Pass `'*'` to remove a wildcard listener previously registered via
   * `on('*', cb)`. If the callback was never registered as a wildcard
   * listener, this is a no-op.
   *
   * @param event The event to remove, or `'*'` for a wildcard listener.
   * @param callback The callback to remove.
   */
  public off(event: '*', callback: (message: Message<E, keyof E>) => void): void;
  public off<K extends keyof E>(event: K, callback: (message: Message<E, K>) => void): void;
  public off(
    event: '*' | keyof E,
    callback: (message: Message<E, any>) => void,
  ): void {
    if (event === '*') {
      const removers = this.wildcardRemovers.get(callback);
      if (removers) {
        removers.forEach((r) => r());
        this.wildcardRemovers.delete(callback);
      }
      return;
    }
    this.getBridge()?.off(event.toString(), callback);
  }
}
