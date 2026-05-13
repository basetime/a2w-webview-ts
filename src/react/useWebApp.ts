import { useMemo } from 'react';

import type { AppEvents } from '../types';
import WebApp from '../WebApp';

/**
 * Returns a memoized `WebApp` instance that is stable across renders.
 *
 * The instance is created lazily on first render and reused for the
 * lifetime of the component, so it can be safely passed to other hooks
 * (such as `useEvent`) as a dependency.
 */
export function useWebApp<E extends Record<string, unknown> = AppEvents>(): WebApp<E> {
  return useMemo(() => new WebApp<E>(), []);
}
