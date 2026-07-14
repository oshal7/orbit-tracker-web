import { useEffect, useState } from 'react';
import { isNightAt } from '@/lib/sunPosition';
import type { UserLocation } from '@/hooks/useSatelliteData';

const RECHECK_MS = 60_000;

/** Whether it's currently dark at the user's location — drives the auto light/dark theme. */
export function useDayNight(location: UserLocation | null): boolean {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (!location) return;
    const update = () => setIsDark(isNightAt(location.lat, location.lng));
    update();
    const interval = setInterval(update, RECHECK_MS);
    return () => clearInterval(interval);
  }, [location]);

  return isDark;
}
