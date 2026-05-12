import { useEffect, useRef } from 'react';

import type { AppEvents, Message } from '../Message';
import { useWebApp } from './useWebApp';

/**
 * Subscribes to a `WebApp` event for the lifetime of the component.
 *
 * Internally obtains a stable `WebApp` instance via {@link useWebApp},
 * so consumers don't need to pass one in. The `callback` is wrapped in
 * a ref so passing an inline function does not resubscribe on every
 * render; the latest callback is always invoked when the event fires.
 *
 * @param event The event name to listen for.
 * @param callback Invoked with the event message when the event fires.
 */
export function useEvent<
  E extends Record<string, unknown> = AppEvents,
  K extends keyof E = keyof E,
>(event: K, callback: (message: Message<E, K>) => void): void {
  const app = useWebApp<E>();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return app.on(event, (message) => callbackRef.current(message));
  }, [app, event]);
}
