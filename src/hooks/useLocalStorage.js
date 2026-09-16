import { useCallback, useState } from 'react';

function readStoredValue(key, initialValue) {
  if (typeof window === 'undefined') return initialValue;
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? initialValue : JSON.parse(stored);
  } catch {
    return initialValue;
  }
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => readStoredValue(key, initialValue));

  const setStoredValue = useCallback((nextValue) => {
    setValue((currentValue) => {
      const resolvedValue = typeof nextValue === 'function' ? nextValue(currentValue) : nextValue;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolvedValue));
      } catch {
        // Local storage is optional; the in-memory state remains usable.
      }
      return resolvedValue;
    });
  }, [key]);

  return [value, setStoredValue];
}
