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
 * scope so the `WebApp` constructor can read them. Pass `undefined`
 * for either to simulate the non-embedded case.
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

afterEach(() => {
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

      expect(() => app.send('ready', { status: 'ok' })).not.toThrow();
    });

    it('uses the current bridge when it becomes available after construction', () => {
      const atw = createMockAtw();
      installWindow({ atw: undefined, reactNativeWebView: {} });
      const app = new WebApp();

      installWindow({ atw, reactNativeWebView: {} });
      app.send('ready', { status: 'ok' });

      expect(atw.send).toHaveBeenCalledWith({
        action: 'ready',
        payload: { status: 'ok' },
      });
    });

    it('is bound to the instance and can be passed as a callback', () => {
      const atw = createMockAtw();
      installWindow({ atw, reactNativeWebView: {} });
      const app = new WebApp();

      const detached = app.send;
      detached('ready', { status: 'ok' });

      expect(atw.send).toHaveBeenCalledWith({
        action: 'ready',
        payload: { status: 'ok' },
      });
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
      handlers.get('ready')!({ action: 'ready', payload: { status: 'ok' } });

      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb).toHaveBeenNthCalledWith(1, scanMessage);
      expect(cb).toHaveBeenNthCalledWith(2, {
        action: 'ready',
        payload: { status: 'ok' },
      });
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
