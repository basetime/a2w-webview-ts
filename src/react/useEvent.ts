import { useEffect, useRef } from 'react';

import type { AppEvents, Message } from '../types';
import { useWebApp } from './useWebApp';

/**
 * Subscribes to a `WebApp` event for the lifetime of the component.
 *
 * Internally obtains a stable `WebApp` instance via {@link useWebApp},
 * so consumers don't need to pass one in. The `callback` is wrapped in
 * a ref so passing an inline function does not resubscribe on every
 * render; the latest callback is always invoked when the event fires.
 *
 * Pass `'*'` as the event name to subscribe to every built-in
 * `AppEvents` key (`scan`, `standby`, `error`, `navigate`, `ready`,
 * `settings`). The callback receives messages whose `action` field is
 * the actual event name (e.g. `'scan'`), not `'*'`.
 *
 * @param event The event name to listen for, or `'*'` for all events.
 * @param callback Invoked with the event message when the event fires.
 */
export function useEvent<E extends Record<string, unknown> = AppEvents>(
  event: '*',
  callback: (message: Message<E, keyof E>) => void,
): void;
export function useEvent<
  E extends Record<string, unknown> = AppEvents,
  K extends keyof E = keyof E,
>(event: K, callback: (message: Message<E, K>) => void): void;
export function useEvent<E extends Record<string, unknown> = AppEvents>(
  event: '*' | keyof E,
  callback: (message: Message<E, any>) => void,
): void {
  /**
   * A stable `WebApp` instance.
   */
  const app = useWebApp<E>();

  /**
   * A ref to the callback function.
   */
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  /**
   * Subscribes to the event and invokes the callback when the event fires.
   */
  useEffect(() => {
    return app.on(event, (message) => callbackRef.current(message));
  }, [app, event]);
}
