import { useEffect, useState } from 'react';

const QUERY = '(prefers-color-scheme: dark)';

/** OS/browser dark-mode preference, for pages (like the landing page) that don't yet have a location to derive real day/night from. */
export function usePrefersDark(): boolean {
  const [prefersDark, setPrefersDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const handler = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersDark;
}
