import { useState, useEffect, useCallback } from 'react';

export interface CompassState {
  heading: number | null;
  isSupported: boolean;
  needsPermission: boolean;
  timedOut: boolean;
  requestPermission: () => Promise<void>;
}

const READING_TIMEOUT_MS = 4000;

export function useCompassDirection(): CompassState {
  const [heading, setHeading] = useState<number | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const hasApi = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
  // iOS 13+ requires explicit permission request
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const needsPermission = hasApi && typeof (DeviceOrientationEvent as any).requestPermission === 'function';
  const isSupported = hasApi;

  const startListening = useCallback(() => {
    const handler = (event: DeviceOrientationEvent) => {
      // webkitCompassHeading is more reliable on iOS (true north, corrected)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const webkit = (event as any).webkitCompassHeading as number | undefined;
      const raw = event.alpha;
      const h = webkit ?? raw;
      if (h !== null && h !== undefined) {
        setHeading(Math.round(h) % 360);
      }
    };
    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
  }, []);

  // Auto-start on non-iOS (no permission needed)
  useEffect(() => {
    if (!isSupported || needsPermission) return;
    return startListening();
  }, [isSupported, needsPermission, startListening]);

  // Auto-start after iOS permission granted
  useEffect(() => {
    if (!needsPermission || !permissionGranted) return;
    return startListening();
  }, [needsPermission, permissionGranted, startListening]);

  // If we're actively listening but never receive a reading, give up after a
  // few seconds so the UI can fall back to a manual picker instead of
  // spinning forever (some browsers expose DeviceOrientationEvent but never
  // actually fire it, e.g. when sensor permissions are blocked).
  useEffect(() => {
    const listening = isSupported && (!needsPermission || permissionGranted);
    if (!listening || heading !== null) {
      setTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setTimedOut(true), READING_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isSupported, needsPermission, permissionGranted, heading]);

  const requestPermission = useCallback(async () => {
    if (!needsPermission) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (DeviceOrientationEvent as any).requestPermission();
      if (result === 'granted') {
        setPermissionGranted(true);
      }
    } catch {
      // Silently ignore — user denied or feature unavailable
    }
  }, [needsPermission]);

  return { heading, isSupported, needsPermission, timedOut, requestPermission };
}
