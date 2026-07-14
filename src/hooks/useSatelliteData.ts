import { useState, useEffect, useRef, useCallback } from 'react';
import * as satellite from 'satellite.js';
import {
  computeLookAngles,
  findPasses,
  parseOrbitalParams,
  estimateMagnitude,
  classifySatellite,
  type PassEvent,
  type ObserverGd,
} from '@/lib/satelliteMath';

export interface SatelliteData {
  id: string;
  name: string;
  type: string;
  color: string;
  azimuth: number;
  elevation: number;
  range: number;
  velocity: number;
  magnitude: number;
  isVisible: boolean;
  altitudeKm: number;
  periodMin: number;
  inclinationDeg: number;
  nextPass: PassEvent | null;
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

interface TrackedSatellite {
  id: string;
  name: string;
  type: string;
  color: string;
  satrec: satellite.SatRec;
  altitudeKm: number;
  periodMin: number;
  inclinationDeg: number;
}

// Satellites to track (NORAD IDs of commonly visible satellites)
const SATELLITE_IDS = [
  25544, // ISS (ZARYA)
  48274, // CSS (TIANHE) - Chinese Space Station
  20580, // HST (Hubble Space Telescope)
  25338, // NOAA 15
  28654, // NOAA 18
  37849, // SUOMI NPP
  43013, // NOAA 20
  51850, // GOES 18
  44713, // STARLINK-1007
  48280, // STARLINK-2565
  25400, // SL-16 R/B
];

const LIVE_INTERVAL_MS = 5_000;
const PASS_INTERVAL_MS = 60_000;
const PASS_HORIZON_HOURS = 6;

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

function buildTracked(tles: TLEEntry[]): TrackedSatellite[] {
  return tles.map(tle => {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const id = tle.line1.substring(2, 7).trim();
    const name = tle.name.trim();
    const { type, color } = classifySatellite(name, id);
    const { inclinationDeg, periodMin, altitudeKm } = parseOrbitalParams(tle.line2);
    return { id, name, type, color, satrec, altitudeKm, periodMin, inclinationDeg };
  });
}

export function useSatelliteData(location: UserLocation | null) {
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trackedRef = useRef<TrackedSatellite[]>([]);

  const recomputeLive = useCallback((observerGd: ObserverGd) => {
    const now = new Date();
    setSatellites(prev => {
      const nextPassById = new Map(prev.map(s => [s.id, s.nextPass]));
      return trackedRef.current.map((t): SatelliteData => {
        const look = computeLookAngles(t.satrec, observerGd, now);
        const base = {
          id: t.id,
          name: t.name,
          type: t.type,
          color: t.color,
          altitudeKm: t.altitudeKm,
          periodMin: t.periodMin,
          inclinationDeg: t.inclinationDeg,
          nextPass: nextPassById.get(t.id) ?? null,
        };
        if (!look) {
          return { ...base, azimuth: 0, elevation: -90, range: 0, velocity: 0, magnitude: 99, isVisible: false };
        }

        const pv = satellite.propagate(t.satrec, now);
        let velocity = 0;
        if (pv.velocity && typeof pv.velocity !== 'boolean') {
          const v = pv.velocity as satellite.EciVec3<number>;
          velocity = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        }

        return {
          ...base,
          azimuth: look.azimuth,
          elevation: look.elevation,
          range: look.range,
          velocity,
          magnitude: estimateMagnitude(t.name, look.range),
          isVisible: look.elevation > 0,
        };
      });
    });
  }, []);

  const recomputePasses = useCallback((observerGd: ObserverGd) => {
    const now = new Date();
    const passesById = new Map(
      trackedRef.current.map(t => [t.id, findPasses(t.satrec, observerGd, now, PASS_HORIZON_HOURS)[0] ?? null])
    );
    setSatellites(prev => prev.map(s => ({ ...s, nextPass: passesById.get(s.id) ?? null })));
  }, []);

  useEffect(() => {
    if (!location) return;

    const observerGd: ObserverGd = {
      latitude: location.lat * (Math.PI / 180),
      longitude: location.lng * (Math.PI / 180),
      height: 0,
    };

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        if (trackedRef.current.length === 0) {
          const tles = await fetchTLEsFromAPI();
          if (tles.length === 0) throw new Error('No satellite data available');
          trackedRef.current = buildTracked(tles);
        }
        recomputeLive(observerGd);
        recomputePasses(observerGd);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch satellite data');
      } finally {
        setLoading(false);
      }
    };

    run();
    const liveInterval = window.setInterval(() => recomputeLive(observerGd), LIVE_INTERVAL_MS);
    const passInterval = window.setInterval(() => recomputePasses(observerGd), PASS_INTERVAL_MS);
    return () => {
      window.clearInterval(liveInterval);
      window.clearInterval(passInterval);
    };
  }, [location, recomputeLive, recomputePasses]);

  return { satellites, loading, error };
}
