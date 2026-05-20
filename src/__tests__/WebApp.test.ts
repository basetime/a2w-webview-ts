/**
 * @file Unit tests for `WebApp`.
 *
 * The default jest environment for this project is `node`, so there is
 * no real `window` global. We install a minimal stub before each test
 * and tear it down afterwards so individual cases can choose whether
 * `window.atw` and `window.ReactNativeWebView` are present.
 */
import type { Addtowallet } from '../Addtowallet';
import {
  APP_EVENT_NAMES,
  type AppEvents,
  type Message,
  type ScanPayload,
} from '../types';
import WebApp from '../WebApp';

/**
 * Builds a fresh jest-mocked `Addtowallet` for each test.
 */
function createMockAtw(): jest.Mocked<Addtowallet> {
  return {
    send: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  };
}

/**
 * Installs `window.atw` and `window.ReactNativeWebView` on the global
 * scope. `WebApp` looks these up lazily on every bridge access, so
 * calling this between operations simulates the native runtime
 * injecting the bridge after construction. Pass `undefined` for either
 * to simulate the non-embedded case.
 */
function installWindow(opts: {
  atw?: Addtowallet;
  reactNativeWebView?: unknown;
}): void {
  (globalThis as any).window = {
    atw: opts.atw,
    ReactNativeWebView: opts.reactNativeWebView,
  };
}


/**
 * Bridge poll timeout, mirrored from `WebApp.ts`. Hard-coded here so a
 * regression in the SDK's constant is caught by these tests rather
 * than silently re-baselined.
 */
const BRIDGE_POLL_TIMEOUT_MS = 10000;

let warnSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;

beforeEach(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
  errorSpy.mockRestore();
  delete (globalThis as any).window;
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('WebApp', () => {
  describe('constructor / isEmbedded', () => {
    it('is embedded when both window.atw and window.ReactNativeWebView are defined', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });

      const app = new WebApp();

      expect(app.isEmbedded).toBe(true);
    });

    it('is not embedded when window.ReactNativeWebView is missing', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: undefined });

      const app = new WebApp();

      expect(app.isEmbedded).toBe(false);
    });

    it('is not embedded when window.atw is missing', () => {
      installWindow({ atw: undefined, reactNativeWebView: {} });

      const app = new WebApp();

      expect(app.isEmbedded).toBe(false);
    });

    it('is not embedded when both are missing', () => {
      installWindow({});

      const app = new WebApp();

      expect(app.isEmbedded).toBe(false);
    });

    it('live-flips from false to true when the bridge is injected after construction', () => {
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();
      expect(app.isEmbedded).toBe(false);

      installWindow({ atw: createMockAtw(), reactNativeWebView: {} });

      expect(app.isEmbedded).toBe(true);
    });
  });

  describe('send', () => {
    it('forwards the action and payload to atw.send', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp();

      const payload = { url: 'https://example.test' };
      app.send('navigate', payload);

      expect(atw.send).toHaveBeenCalledTimes(1);
      expect(atw.send).toHaveBeenCalledWith({
        action: 'navigate',
        payload,
      });
    });

    it('substitutes an empty object when payload is omitted', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp();

      app.send('ready');

      expect(atw.send).toHaveBeenCalledWith({
        action: 'ready',
        payload: {},
      });
    });

    it('coerces the event key to a string when it is a symbol-like value', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp<{ scan: ScanPayload }>();

      app.send('scan', { found: true } as unknown as ScanPayload);

      expect(atw.send).toHaveBeenCalledWith({
        action: 'scan',
        payload: { found: true },
      });
    });

    it('does not throw when atw is unavailable', () => {
      installWindow({});
      const app = new WebApp();

      expect(() => app.send('ready')).not.toThrow();
    });

    it('uses the current bridge when it becomes available after construction', () => {
      const atw = createMockAtw();
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();

      installWindow({ atw, reactNativeWebView: {} });
      app.send('navigate', { url: 'https://example.test' });

      expect(atw.send).toHaveBeenCalledWith({
        action: 'navigate',
        payload: { url: 'https://example.test' },
      });
    });

    it('is bound to the instance and can be passed as a callback', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp();

      const detached = app.send;
      detached('navigate', { url: 'https://example.test' });

      expect(atw.send).toHaveBeenCalledWith({
        action: 'navigate',
        payload: { url: 'https://example.test' },
      });
    });

    it('queues messages until the bridge appears and flushes them in order', () => {
      jest.useFakeTimers();
      const atw = createMockAtw();
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();

      app.send('navigate', { url: 'https://first.test' });
      app.send('navigate', { url: 'https://second.test' });
      app.send('settings', { settings: { pin: '1234' } });
      expect(atw.send).not.toHaveBeenCalled();

      installWindow({ atw, reactNativeWebView: {} });
      jest.advanceTimersByTime(50);

      expect(atw.send).toHaveBeenCalledTimes(3);
      expect(atw.send.mock.calls[0][0]).toEqual({
        action: 'navigate',
        payload: { url: 'https://first.test' },
      });
      expect(atw.send.mock.calls[1][0]).toEqual({
        action: 'navigate',
        payload: { url: 'https://second.test' },
      });
      expect(atw.send.mock.calls[2][0]).toEqual({
        action: 'settings',
        payload: { settings: { pin: '1234' } },
      });
    });

    it('drops queued messages and warns when the bridge poll times out', () => {
      jest.useFakeTimers();
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();

      app.send('ready');
      app.send('navigate', { url: 'https://example.test' });

      jest.advanceTimersByTime(BRIDGE_POLL_TIMEOUT_MS);

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(
        /window\.atw did not appear within 10000ms/,
      );
      expect(warnSpy.mock.calls[0][0]).toMatch(/2 queued message\(s\)/);

      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      app.send('ready');
      expect(atw.send).not.toHaveBeenCalled();
    });

    it('drops messages silently when the SDK is not in a WebView at all', () => {
      installWindow({});
      const app = new WebApp();

      app.send('ready');

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('on (single event)', () => {
    it('subscribes to the event via atw.on', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      app.on('scan', cb);

      expect(atw.on).toHaveBeenCalledTimes(1);
      expect(atw.on).toHaveBeenCalledWith('scan', cb);
    });

    it('returns a disposer that calls atw.off with the same arguments', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      const off = app.on('ready', cb);
      expect(atw.off).not.toHaveBeenCalled();

      off();

      expect(atw.off).toHaveBeenCalledTimes(1);
      expect(atw.off).toHaveBeenCalledWith('ready', cb);
    });

    it('returns a no-op disposer when atw is unavailable', () => {
      installWindow({});
      const app = new WebApp();
      const cb = jest.fn();

      const off = app.on('navigate', cb);

      expect(() => off()).not.toThrow();
    });

    it('waits for atw when ReactNativeWebView exists before the bridge is injected', () => {
      jest.useFakeTimers();
      const atw = createMockAtw();
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      app.on('standby', cb);
      expect(atw.on).not.toHaveBeenCalled();

      installWindow({ atw, reactNativeWebView: {} });
      jest.advanceTimersByTime(50);

      expect(atw.on).toHaveBeenCalledTimes(1);
      expect(atw.on).toHaveBeenCalledWith('standby', cb);
      jest.useRealTimers();
    });

    it('does not subscribe if disposed before the delayed bridge appears', () => {
      jest.useFakeTimers();
      const atw = createMockAtw();
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      const off = app.on('scan', cb);
      off();

      installWindow({ atw, reactNativeWebView: {} });
      jest.advanceTimersByTime(50);

      expect(atw.on).not.toHaveBeenCalled();
      expect(atw.off).not.toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('app.off() cancels a pending poll subscription before the bridge appears', () => {
      jest.useFakeTimers();
      const atw = createMockAtw();
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      app.on('scan', cb);
      app.off('scan', cb);

      installWindow({ atw, reactNativeWebView: {} });
      jest.advanceTimersByTime(50);

      expect(atw.on).not.toHaveBeenCalled();
    });

    it('app.off() leaves unrelated pending subscriptions intact', () => {
      jest.useFakeTimers();
      const atw = createMockAtw();
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();
      const scanCb = jest.fn();
      const standbyCb = jest.fn();

      app.on('scan', scanCb);
      app.on('standby', standbyCb);
      app.off('scan', scanCb);

      installWindow({ atw, reactNativeWebView: {} });
      jest.advanceTimersByTime(50);

      expect(atw.on).toHaveBeenCalledTimes(1);
      expect(atw.on).toHaveBeenCalledWith('standby', standbyCb);
    });
  });

  describe('on (wildcard)', () => {
    it('subscribes to every built-in AppEvents key', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      app.on('*', cb);

      expect(atw.on).toHaveBeenCalledTimes(APP_EVENT_NAMES.length);
      const subscribedEvents = atw.on.mock.calls.map((call) => call[0]);
      expect(new Set(subscribedEvents)).toEqual(new Set(APP_EVENT_NAMES));
      atw.on.mock.calls.forEach((call) => {
        expect(call[1]).toBe(cb);
      });
    });

    it('invokes the callback when any subscribed event fires', () => {
      const atw = createMockAtw();
      const handlers = new Map<string, (m: Message<AppEvents, any>) => void>();
      atw.on.mockImplementation((event, callback) => {
        handlers.set(event, callback);
      });
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      app.on('*', cb);

      const scanMessage: Message<AppEvents, 'scan'> = {
        action: 'scan',
        payload: { found: true } as unknown as ScanPayload,
      };
      handlers.get('scan')!(scanMessage);
      handlers.get('ready')!({ action: 'ready' });

      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb).toHaveBeenNthCalledWith(1, scanMessage);
      expect(cb).toHaveBeenNthCalledWith(2, { action: 'ready' });
    });

    it('disposer removes every per-event subscription it created', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      const off = app.on('*', cb);

      expect(atw.off).not.toHaveBeenCalled();
      off();

      expect(atw.off).toHaveBeenCalledTimes(APP_EVENT_NAMES.length);
      const offEvents = atw.off.mock.calls.map((call) => call[0]);
      expect(new Set(offEvents)).toEqual(new Set(APP_EVENT_NAMES));
      atw.off.mock.calls.forEach((call) => {
        expect(call[1]).toBe(cb);
      });
    });

    it('disposer is idempotent and forgets the wildcard registration', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      const off = app.on('*', cb);
      off();
      atw.off.mockClear();

      app.off('*', cb);

      expect(atw.off).not.toHaveBeenCalled();
    });

    it('tracks multiple wildcard callbacks independently', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp();
      const cb1 = jest.fn();
      const cb2 = jest.fn();

      const offA = app.on('*', cb1);
      app.on('*', cb2);

      expect(atw.on).toHaveBeenCalledTimes(APP_EVENT_NAMES.length * 2);

      offA();

      expect(atw.off).toHaveBeenCalledTimes(APP_EVENT_NAMES.length);
      atw.off.mock.calls.forEach((call) => {
        expect(call[1]).toBe(cb1);
      });
    });
  });

  describe('off (single event)', () => {
    it('forwards the unsubscribe to atw.off', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      app.off('settings', cb);

      expect(atw.off).toHaveBeenCalledTimes(1);
      expect(atw.off).toHaveBeenCalledWith('settings', cb);
    });

    it('does not throw when atw is unavailable', () => {
      installWindow({});
      const app = new WebApp();
      const cb = jest.fn();

      expect(() => app.off('settings', cb)).not.toThrow();
    });
  });

  describe('off (wildcard)', () => {
    it('removes a previously registered wildcard listener', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      app.on('*', cb);
      app.off('*', cb);

      expect(atw.off).toHaveBeenCalledTimes(APP_EVENT_NAMES.length);
      const offEvents = atw.off.mock.calls.map((call) => call[0]);
      expect(new Set(offEvents)).toEqual(new Set(APP_EVENT_NAMES));
    });

    it('is a no-op when the callback was never registered as a wildcard', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      app.off('*', cb);

      expect(atw.off).not.toHaveBeenCalled();
    });

    it('is a no-op when called twice for the same callback', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      app.on('*', cb);
      app.off('*', cb);
      atw.off.mockClear();

      app.off('*', cb);

      expect(atw.off).not.toHaveBeenCalled();
    });
  });

  describe('boot event', () => {
    it('fires asynchronously with isEmbedded: true when both globals are present at construction', () => {
      jest.useFakeTimers();
      installWindow({ atw: createMockAtw(), reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      app.on('boot', cb);
      expect(cb).not.toHaveBeenCalled();

      jest.advanceTimersByTime(0);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith({
        action: 'boot',
        payload: { isEmbedded: true },
      });
    });

    it('fires asynchronously with isEmbedded: false when ReactNativeWebView is missing', () => {
      jest.useFakeTimers();
      installWindow({});
      const app = new WebApp();
      const cb = jest.fn();

      app.on('boot', cb);
      jest.advanceTimersByTime(0);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith({
        action: 'boot',
        payload: { isEmbedded: false },
      });
    });

    it('fires once with isEmbedded: true after the bridge is injected mid-poll', () => {
      jest.useFakeTimers();
      const atw = createMockAtw();
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      app.on('boot', cb);
      expect(cb).not.toHaveBeenCalled();

      installWindow({ atw, reactNativeWebView: {} });
      jest.advanceTimersByTime(50);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith({
        action: 'boot',
        payload: { isEmbedded: true },
      });
    });

    it('fires with isEmbedded: false after the poll timeout', () => {
      jest.useFakeTimers();
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      app.on('boot', cb);
      jest.advanceTimersByTime(BRIDGE_POLL_TIMEOUT_MS);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith({
        action: 'boot',
        payload: { isEmbedded: false },
      });
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('replays the cached payload for late subscribers', () => {
      jest.useFakeTimers();
      const atw = createMockAtw();
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();
      const earlyCb = jest.fn();

      app.on('boot', earlyCb);
      installWindow({ atw, reactNativeWebView: {} });
      jest.advanceTimersByTime(50);
      expect(earlyCb).toHaveBeenCalledTimes(1);

      const lateCb = jest.fn();
      app.on('boot', lateCb);
      expect(lateCb).not.toHaveBeenCalled();

      jest.advanceTimersByTime(0);
      expect(lateCb).toHaveBeenCalledTimes(1);
      expect(lateCb).toHaveBeenCalledWith({
        action: 'boot',
        payload: { isEmbedded: true },
      });
    });

    it('disposer prevents the deferred replay from firing', () => {
      jest.useFakeTimers();
      installWindow({ atw: createMockAtw(), reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      const off = app.on('boot', cb);
      off();
      jest.advanceTimersByTime(0);

      expect(cb).not.toHaveBeenCalled();
    });

    it('disposer removes a parked listener before the bridge transition', () => {
      jest.useFakeTimers();
      const atw = createMockAtw();
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      const off = app.on('boot', cb);
      off();

      installWindow({ atw, reactNativeWebView: {} });
      jest.advanceTimersByTime(50);

      expect(cb).not.toHaveBeenCalled();
    });

    it('app.off("boot", cb) removes a parked listener', () => {
      jest.useFakeTimers();
      const atw = createMockAtw();
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      app.on('boot', cb);
      app.off('boot', cb);

      installWindow({ atw, reactNativeWebView: {} });
      jest.advanceTimersByTime(50);

      expect(cb).not.toHaveBeenCalled();
    });

    it("is not invoked by the '*' wildcard fan-out", () => {
      jest.useFakeTimers();
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp();
      const cb = jest.fn();

      app.on('*', cb);

      expect(atw.on).toHaveBeenCalledTimes(APP_EVENT_NAMES.length);
      const subscribedEvents = atw.on.mock.calls.map((c) => c[0]);
      expect(subscribedEvents).not.toContain('boot');

      jest.advanceTimersByTime(0);
      expect(cb).not.toHaveBeenCalled();
    });

    it('continues invoking other listeners when one throws', () => {
      jest.useFakeTimers();
      const atw = createMockAtw();
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();
      const cbA = jest.fn(() => {
        throw new Error('listener exploded');
      });
      const cbB = jest.fn();

      app.on('boot', cbA);
      app.on('boot', cbB);

      installWindow({ atw, reactNativeWebView: {} });
      jest.advanceTimersByTime(50);

      expect(cbA).toHaveBeenCalledTimes(1);
      expect(cbB).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('bridge poll timeout', () => {
    it('emits console.warn exactly once', () => {
      jest.useFakeTimers();
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();
      app.on('scan', jest.fn());

      jest.advanceTimersByTime(BRIDGE_POLL_TIMEOUT_MS);

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(
        /window\.atw did not appear within 10000ms/,
      );
    });

    it('reports the count of dropped messages and subscriptions in the warning', () => {
      jest.useFakeTimers();
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();

      app.on('scan', jest.fn());
      app.on('standby', jest.fn());
      app.send('ready');
      app.send('navigate', { url: '/' });
      app.send('settings', { settings: {} });

      jest.advanceTimersByTime(BRIDGE_POLL_TIMEOUT_MS);

      expect(warnSpy.mock.calls[0][0]).toMatch(/3 queued message\(s\)/);
      expect(warnSpy.mock.calls[0][0]).toMatch(/2 pending subscription\(s\)/);
    });

    it('subsequent on/send calls after timeout do not re-warn', () => {
      jest.useFakeTimers();
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();

      app.on('scan', jest.fn());
      jest.advanceTimersByTime(BRIDGE_POLL_TIMEOUT_MS);
      expect(warnSpy).toHaveBeenCalledTimes(1);

      app.on('standby', jest.fn());
      app.send('ready');

      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('custom event maps', () => {
    interface CustomEvents extends Record<string, unknown> {
      ping: { id: number };
      pong: { id: number };
    }

    it('supports user-defined event names through the generic parameter', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp<CustomEvents>();
      const cb = jest.fn();

      app.send('ping', { id: 1 });
      const off = app.on('pong', cb);
      off();

      expect(atw.send).toHaveBeenCalledWith({ action: 'ping', payload: { id: 1 } });
      expect(atw.on).toHaveBeenCalledWith('pong', cb);
      expect(atw.off).toHaveBeenCalledWith('pong', cb);
    });
  });
});
