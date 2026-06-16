import { useState, useEffect, useRef, useCallback } from 'react';
import * as satellite from 'satellite.js';

export interface TrailPoint {
  azimuth: number;
  elevation: number;
}

export interface SatelliteData {
  id: string;
  name: string;
  azimuth: number;
  elevation: number;
  magnitude: number;
  range: number;
  velocity: number;
  isVisible: boolean;
  trail: TrailPoint[];
}

export interface UserLocation {
  lat: number;
  lng: number;
}

interface TLEEntry {
  name: string;
  line1: string;
  line2: string;
}

// Satellites to track (NORAD IDs of commonly visible satellites)
const SATELLITE_IDS = [
  25544,  // ISS (ZARYA)
  48274,  // CSS (TIANHE) - Chinese Space Station
  20580,  // HST (Hubble Space Telescope)
  25338,  // NOAA 15
  28654,  // NOAA 18
  37849,  // SUOMI NPP
  43013,  // NOAA 20
  51850,  // GOES 18
  44713,  // STARLINK-1007
  48280,  // STARLINK-2565
  25400,  // SL-16 R/B
];

async function fetchTLEsFromAPI(): Promise<TLEEntry[]> {
  const results = await Promise.allSettled(
    SATELLITE_IDS.map(async (id) => {
      const resp = await fetch(`https://tle.ivanstanojevic.me/api/tle/${id}`);
      if (!resp.ok) return null;
      const data = await resp.json();
      if (!data.line1 || !data.line2) return null;
      return { name: data.name as string, line1: data.line1 as string, line2: data.line2 as string };
    })
  );
  return results
    .filter((r): r is PromiseFulfilledResult<TLEEntry> => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value);
}

function computeLookAngles(
  satrec: satellite.SatRec,
  observerGd: { latitude: number; longitude: number; height: number },
  time: Date
): { azimuth: number; elevation: number; range: number } | null {
  const pv = satellite.propagate(satrec, time);
  if (!pv.position || typeof pv.position === 'boolean') return null;

  // Fix: propagate returns ECI coordinates; ecfToLookAngles needs ECF
  const gmst = satellite.gstime(time);
  const positionEcf = satellite.eciToEcf(pv.position as satellite.EciVec3<number>, gmst);
  const look = satellite.ecfToLookAngles(observerGd, positionEcf);

  let az = look.azimuth * (180 / Math.PI);
  if (az < 0) az += 360;
  const el = look.elevation * (180 / Math.PI);

  return { azimuth: az, elevation: el, range: look.rangeSat };
}

function estimateMagnitude(name: string, range: number): number {
  let mag = 4.0;
  const n = name.toUpperCase();
  if (n.includes('ISS') || n.includes('ZARYA')) mag = -2.5;
  else if (n.includes('TIANHE') || n.includes('CSS')) mag = 3.2;
  else if (n.includes('HUBBLE') || n.includes('HST')) mag = 2.5;
  else if (n.includes('STARLINK')) mag = 4.5;
  else if (n.includes('NOAA')) mag = 4.5;
  if (range > 0) mag += Math.log10(range / 400) * 2;
  return parseFloat(mag.toFixed(1));
}

// Trail offsets in minutes: 3 past, current, 3 future
const TRAIL_OFFSETS = [-6, -4, -2, 0, 2, 4, 6];

function processTLE(
  tle: TLEEntry,
  observerGd: { latitude: number; longitude: number; height: number },
  now: Date
): SatelliteData | null {
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

    const current = computeLookAngles(satrec, observerGd, now);
    if (!current || current.elevation <= -10) return null;

    // Velocity
    const pv = satellite.propagate(satrec, now);
    let velocity = 0;
    if (pv.velocity && typeof pv.velocity !== 'boolean') {
      const v = pv.velocity as satellite.EciVec3<number>;
      velocity = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    }

    // Compute trail
    const trail: TrailPoint[] = TRAIL_OFFSETS.map(offsetMin => {
      const t = new Date(now.getTime() + offsetMin * 60 * 1000);
      const pos = computeLookAngles(satrec, observerGd, t);
      return pos ? { azimuth: pos.azimuth, elevation: pos.elevation } : null;
    }).filter((p): p is TrailPoint => p !== null);

    const id = tle.line1.substring(2, 7).trim();

    return {
      id,
      name: tle.name.trim(),
      azimuth: current.azimuth,
      elevation: current.elevation,
      range: current.range,
      velocity,
      magnitude: estimateMagnitude(tle.name, current.range),
      isVisible: current.elevation > 0,
      trail,
    };
  } catch {
    return null;
  }
}

export function useSatelliteData(location: UserLocation | null) {
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tleCache = useRef<TLEEntry[]>([]);

  const recompute = useCallback(() => {
    if (!location || tleCache.current.length === 0) return;
    const observerGd = {
      latitude: location.lat * (Math.PI / 180),
      longitude: location.lng * (Math.PI / 180),
      height: 0,
    };
    const now = new Date();
    const computed = tleCache.current
      .map(tle => processTLE(tle, observerGd, now))
      .filter((s): s is SatelliteData => s !== null);
    setSatellites(computed);
  }, [location]);

  useEffect(() => {
    if (!location) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        if (tleCache.current.length === 0) {
          tleCache.current = await fetchTLEsFromAPI();
        }
        if (tleCache.current.length === 0) throw new Error('No satellite data available');
        recompute();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch satellite data');
      } finally {
        setLoading(false);
      }
    };

    run();
    // Recompute positions every 10s (TLE data is cached and reused)
    const interval = setInterval(recompute, 10000);
    return () => clearInterval(interval);
  }, [location, recompute]);

  return { satellites, loading, error };
}
