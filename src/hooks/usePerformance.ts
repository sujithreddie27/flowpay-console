import { useCallback, useRef, useMemo, useState, useEffect } from 'react';

/**
 * Returns a stable callback reference that always calls the latest version.
 * Useful for event handlers passed to memoized children.
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback((...args: any[]) => callbackRef.current(...args), []) as T;
}

/**
 * Debounces a value - only updates the returned value after the specified delay.
 * Useful for search inputs that trigger API calls.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedValue(value), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Memoizes expensive computations with a custom comparator for complex dependencies.
 */
export function useDeepMemo<T>(factory: () => T, deps: any[]): T {
  const prevDeps = useRef<any[]>();
  const prevValue = useRef<T>();

  if (!prevDeps.current || !shallowArrayEqual(prevDeps.current, deps)) {
    prevDeps.current = deps;
    prevValue.current = factory();
  }

  return prevValue.current as T;
}

function shallowArrayEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

/**
 * Returns a memoized formatter for currency values - avoids creating
 * Intl.NumberFormat instances on every render.
 */
export function useCurrencyFormatter(currency: string = 'INR', locale: string = 'en-IN') {
  return useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [currency, locale]
  );
}

/**
 * Returns a memoized date formatter to avoid recreating on each render.
 */
export function useDateFormatter(options?: Intl.DateTimeFormatOptions, locale: string = 'en-IN') {
  const optionsKey = options ? JSON.stringify(options, Object.keys(options).sort()) : '';
  return useMemo(
    () => new Intl.DateTimeFormat(locale, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, optionsKey]
  );
}
