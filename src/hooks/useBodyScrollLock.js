import { useEffect } from 'react';

let activeLocks = 0;
let previousBodyStyles = null;

export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return undefined;

    if (activeLocks === 0) {
      previousBodyStyles = {
        overflow: document.body.style.overflow,
        paddingRight: document.body.style.paddingRight,
      };
      document.body.style.overflow = 'hidden';

      const scrollbarWidth = typeof window === 'undefined'
        ? 0
        : window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    activeLocks += 1;

    return () => {
      activeLocks = Math.max(0, activeLocks - 1);
      if (activeLocks !== 0 || !previousBodyStyles) return;

      document.body.style.overflow = previousBodyStyles.overflow;
      document.body.style.paddingRight = previousBodyStyles.paddingRight;
      previousBodyStyles = null;
    };
  }, [locked]);
}
