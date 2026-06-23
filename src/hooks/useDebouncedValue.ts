import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value`, updating only after `delayMs` elapses
 * without further changes. Initialises to the current value so first paint
 * isn't delayed.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
