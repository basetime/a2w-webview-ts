import type { Addtowallet } from './Addtowallet';
import { APP_EVENT_NAMES, type AppEvents, type BootPayload, type Message } from './types';

const BRIDGE_POLL_INTERVAL_MS = 50;
const BRIDGE_POLL_TIMEOUT_MS = 10000;

type BridgeState = 'pending' | 'ready' | 'unavailable';

interface PendingSubscription<E extends Record<string, unknown>> {
  event: string;
  callback: (message: Message<E, any>) => void;
  attached: boolean;
}

interface BootListener<E extends Record<string, unknown>> {
  callback: (message: Message<E, any>) => void;
}

interface QueuedMessage {
  action: string;
  payload: unknown;
}

/**
 * Provides two way communication with the atw scanner.
 */
export default class WebApp<E extends Record<string, unknown> = AppEvents> {
  /**
   * Is the app embedded in the atw scanner webview?
   *
   * @deprecated Subscribe to the synthetic `boot` event instead. On older
   * Android WebView runtimes the native bridge (`window.atw`) can be
   * injected after this class is constructed, so a synchronous check
   * may return `false` even when the app is genuinely embedded. The
   * `boot` event fires once the SDK has finished waiting for the bridge.
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
   * Current readiness of the native bridge. `pending` means the SDK is
   * still waiting for `window.atw` to appear; transitions to `ready`
   * when it does or `unavailable` after the poll times out (or when
   * the environment is clearly not embedded).
   */
  private bridgeState: BridgeState;

  /**
   * Cached `boot` payload. Set on transition to `ready`/`unavailable`
   * (or synchronously in the constructor when the outcome is already
   * known). Used to replay the `boot` event for subscribers that
   * register after it has fired.
   */
  private bootPayload?: BootPayload;

  /**
   * Listeners waiting for the synthetic `boot` event.
   */
  private bootListeners: Array<BootListener<E>> = [];

  /**
   * Native-event subscriptions that arrived while the bridge was still
   * `pending`. Attached in bulk on transition to `ready`, dropped on
   * transition to `unavailable`.
   */
  private pendingSubscriptions: Array<PendingSubscription<E>> = [];

  /**
   * Outbound messages that arrived while the bridge was still
   * `pending`. Flushed in order on transition to `ready`, dropped on
   * transition to `unavailable`.
   */
  private sendQueue: QueuedMessage[] = [];

  /**
   * Handle for the shared bridge-readiness probe timer.
   */
  private probeTimer?: ReturnType<typeof setTimeout>;

  /**
   * Wall-clock time when the probe started, used to enforce
   * `BRIDGE_POLL_TIMEOUT_MS`.
   */
  private probeStartedAt = 0;

  /**
   * Whether `ensureProbeStarted` has already armed the probe loop.
   */
  private probeStarted = false;

  constructor() {
    if (typeof window === 'undefined' || window.ReactNativeWebView === undefined) {
      this.bridgeState = 'unavailable';
      this.bootPayload = { isEmbedded: false };
      return;
    }

    if (window.atw !== undefined) {
      this.bridgeState = 'ready';
      this.bootPayload = { isEmbedded: true };
      return;
    }

    this.bridgeState = 'pending';
  }

  /**
   * Returns the current native bridge if it exists. The bridge can be
   * injected after this class is constructed on older Android WebView
   * runtimes, so we intentionally avoid caching it in the constructor.
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
   * Live-checks for the bridge and promotes the state machine to
   * `ready` if it has appeared since the last probe tick. Called
   * opportunistically from `send` and `on` so that user-driven actions
   * don't have to wait for the next 50ms tick when the bridge is
   * already present.
   */
  private checkBridge = (): void => {
    if (this.bridgeState !== 'pending') {
      return;
    }
    const bridge = this.getBridge();
    if (bridge) {
      this.transitionToReady(bridge);
    }
  };

  /**
   * Arms the shared probe loop if the SDK is still waiting for the
   * bridge. Triggered lazily by the first `send` / `on(nativeEvent)` /
   * `on('boot')` call so that environments that never use the SDK
   * don't pay for a background poll.
   */
  private ensureProbeStarted = (): void => {
    if (this.bridgeState !== 'pending' || this.probeStarted) {
      return;
    }
    this.probeStarted = true;
    this.probeStartedAt = Date.now();
    this.probeTimer = setTimeout(this.runProbe, BRIDGE_POLL_INTERVAL_MS);
  };

  /**
   * One tick of the shared probe loop. Resolves the state machine if
   * the bridge has appeared or the timeout has elapsed; otherwise
   * re-arms itself for another interval.
   */
  private runProbe = (): void => {
    this.probeTimer = undefined;
    if (this.bridgeState !== 'pending') {
      return;
    }

    const bridge = this.getBridge();
    if (bridge) {
      this.transitionToReady(bridge);
      return;
    }

    if (Date.now() - this.probeStartedAt >= BRIDGE_POLL_TIMEOUT_MS) {
      this.transitionToUnavailable();
      return;
    }

    this.probeTimer = setTimeout(this.runProbe, BRIDGE_POLL_INTERVAL_MS);
  };

  /**
   * Transition `pending` -> `ready`. Flushes queued sends, attaches
   * pending subscriptions, fires `boot` listeners.
   */
  private transitionToReady = (bridge: Addtowallet): void => {
    if (this.probeTimer !== undefined) {
      clearTimeout(this.probeTimer);
      this.probeTimer = undefined;
    }
    this.bridgeState = 'ready';
    this.bootPayload = { isEmbedded: true };

    const queued = this.sendQueue;
    this.sendQueue = [];
    for (const message of queued) {
      bridge.send(message);
    }

    const pending = this.pendingSubscriptions;
    this.pendingSubscriptions = [];
    for (const sub of pending) {
      bridge.on(sub.event, sub.callback);
      sub.attached = true;
    }

    this.fireBoot(this.bootPayload);
  };

  /**
   * Transition `pending` -> `unavailable`. Drops queued sends and
   * pending subscriptions, warns the consumer, fires `boot` listeners
   * with `isEmbedded: false`.
   */
  private transitionToUnavailable = (): void => {
    if (this.probeTimer !== undefined) {
      clearTimeout(this.probeTimer);
      this.probeTimer = undefined;
    }
    const droppedSends = this.sendQueue.length;
    const droppedSubs = this.pendingSubscriptions.length;
    this.bridgeState = 'unavailable';
    this.bootPayload = { isEmbedded: false };
    this.sendQueue = [];
    this.pendingSubscriptions = [];

    console.warn(
      `[a2w-webview-ts] window.atw did not appear within ${BRIDGE_POLL_TIMEOUT_MS}ms; ` +
        `dropping ${droppedSends} queued message(s) and ${droppedSubs} pending subscription(s).`,
    );

    this.fireBoot(this.bootPayload);
  };

  /**
   * Dispatches the `boot` event to every currently-registered listener
   * and then clears the listener list (the event is one-shot per
   * instance; late subscribers are handled by `subscribeBoot` via
   * `bootPayload` replay instead).
   */
  private fireBoot = (payload: BootPayload): void => {
    const listeners = this.bootListeners;
    this.bootListeners = [];
    const message = { action: 'boot' as keyof E, payload: payload as unknown as E[keyof E] };
    for (const listener of listeners) {
      try {
        listener.callback(message);
      } catch (err) {
        console.error('[a2w-webview-ts] boot listener threw:', err);
      }
    }
  };

  /**
   * Implements `on('boot', cb)`. If the bridge state has already been
   * resolved, the listener is invoked asynchronously (via `setTimeout`
   * so consumers don't accidentally observe synchronous fan-out and so
   * fake timers can drive the test suite). Otherwise the listener is
   * parked until the next state transition.
   */
  private subscribeBoot = (
    callback: (message: Message<E, any>) => void,
  ): (() => void) => {
    if (this.bootPayload !== undefined) {
      const payload = this.bootPayload;
      let cancelled = false;
      const timer = setTimeout(() => {
        if (cancelled) {
          return;
        }
        callback({
          action: 'boot' as keyof E,
          payload: payload as unknown as E[keyof E],
        });
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    const entry: BootListener<E> = { callback };
    this.bootListeners.push(entry);
    this.ensureProbeStarted();
    return () => {
      const idx = this.bootListeners.indexOf(entry);
      if (idx !== -1) {
        this.bootListeners.splice(idx, 1);
      }
    };
  };

  /**
   * Implements `on(nativeEvent, cb)`. Attaches to the bridge
   * immediately when `ready`, queues the subscription when `pending`,
   * or returns a no-op disposer when `unavailable`.
   */
  private subscribeNativeEvent = (
    event: string,
    callback: (message: Message<E, any>) => void,
  ): (() => void) => {
    this.checkBridge();

    if (this.bridgeState === 'ready') {
      const bridge = this.getBridge();
      bridge?.on(event, callback);
      return () => {
        this.getBridge()?.off(event, callback);
      };
    }

    if (this.bridgeState === 'unavailable') {
      return () => {};
    }

    const entry: PendingSubscription<E> = { event, callback, attached: false };
    this.pendingSubscriptions.push(entry);
    this.ensureProbeStarted();
    return () => {
      if (entry.attached) {
        this.getBridge()?.off(entry.event, entry.callback);
        return;
      }
      const idx = this.pendingSubscriptions.indexOf(entry);
      if (idx !== -1) {
        this.pendingSubscriptions.splice(idx, 1);
      }
    };
  };

  /**
   * Sends a message to the scanner.
   *
   * If the native bridge has not been injected yet, the message is
   * queued and flushed once the bridge appears. If the bridge never
   * appears (poll timeout, or the app is not embedded at all), the
   * message is dropped silently.
   *
   * @param event The event to post.
   * @param payload The message to post.
   */
  public send = <K extends keyof E>(event: K, payload?: E[K]): void => {
    this.checkBridge();

    const message: QueuedMessage = {
      action: event.toString(),
      payload: payload ?? ({} as E[K]),
    };

    if (this.bridgeState === 'ready') {
      this.getBridge()?.send(message);
      return;
    }

    if (this.bridgeState === 'unavailable') {
      return;
    }

    this.sendQueue.push(message);
    this.ensureProbeStarted();
  };

  /**
   * Receives a message from the webview.
   *
   * Returns a function that removes the event listener.
   *
   * Pass `'*'` as the event name to subscribe to every built-in
   * `AppEvents` key (`scan`, `standby`, `error`, `navigate`, `ready`,
   * `settings`). The callback receives messages whose `action` field
   * is the actual event name (e.g. `'scan'`), not `'*'`. The synthetic
   * `'boot'` event is **not** included in the wildcard fan-out.
   *
   * Pass `'boot'` to receive a single notification once the SDK has
   * resolved whether the native bridge is available. Subscribers that
   * register after the event has already fired receive the cached
   * payload asynchronously (replay semantics).
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

    if (event === 'boot') {
      return this.subscribeBoot(callback);
    }

    return this.subscribeNativeEvent(event.toString(), callback);
  }

  /**
   * Removes an event listener.
   *
   * Pass `'*'` to remove a wildcard listener previously registered via
   * `on('*', cb)`. If the callback was never registered as a wildcard
   * listener, this is a no-op.
   *
   * Pass `'boot'` to remove a `boot` listener that hasn't fired yet.
   * Once the event has fired the listener has already been released,
   * so this becomes a no-op.
   *
   * For native events, this also cancels a subscription that is still
   * queued waiting for the bridge to appear, so calling `off()` before
   * the bridge arrives reliably prevents the subscription from ever
   * being attached.
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

    if (event === 'boot') {
      const idx = this.bootListeners.findIndex((l) => l.callback === callback);
      if (idx !== -1) {
        this.bootListeners.splice(idx, 1);
      }
      return;
    }

    const eventName = event.toString();
    this.pendingSubscriptions = this.pendingSubscriptions.filter(
      (sub) => !(sub.event === eventName && sub.callback === callback),
    );

    this.getBridge()?.off(eventName, callback);
  }
}
