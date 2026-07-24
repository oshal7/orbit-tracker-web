import { useState, useEffect, useRef, useCallback } from 'react';
import * as satellite from 'satellite.js';
import {
  computeLookAngles,
  findPasses,
  estimateMaxElevationSoon,
  parseOrbitalParams,
  estimateMagnitude,
  classifySatellite,
  type PassEvent,
  type ObserverGd,
} from '@/lib/satelliteMath';
import { fetchBulkTles, type TLEEntry } from '@/lib/tleSource';

export interface SatelliteData {
  id: string;
  name: string;
  type: string;
  color: string;
  description: string;
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

interface TrackedSatellite {
  id: string;
  name: string;
  type: string;
  color: string;
  description: string;
  satrec: satellite.SatRec;
  altitudeKm: number;
  periodMin: number;
  inclinationDeg: number;
}

// Curated fallback if the bulk Celestrak catalog fetch fails for any reason (e.g. no CORS
// support on that endpoint) — a small set of commonly-visible satellites via a per-ID API.
const FALLBACK_SATELLITE_IDS = [
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
const COARSE_INTERVAL_MS = 5 * 60_000;
const PASS_INTERVAL_MS = 60_000;

const PASS_HORIZON_HOURS = 6;
const COARSE_HORIZON_HOURS = 6;
const COARSE_STEP_MINUTES = 15;
const MIN_CANDIDATE_ELEVATION_DEG = 15;
const CANDIDATE_LIMIT = 150;

async function fetchTLEsFromAPI(ids: number[]): Promise<TLEEntry[]> {
  const results = await Promise.allSettled(
    ids.map(async (id) => {
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
  const tracked: TrackedSatellite[] = [];
  for (const tle of tles) {
    try {
      const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
      const id = tle.line1.substring(2, 7).trim();
      const name = tle.name.trim();
      const { type, color, description } = classifySatellite(name, id);
      const { inclinationDeg, periodMin, altitudeKm } = parseOrbitalParams(tle.line2);
      tracked.push({ id, name, type, color, description, satrec, altitudeKm, periodMin, inclinationDeg });
    } catch {
      // Malformed element set somewhere in a catalog this large — skip it, not fatal.
    }
  }
  return tracked;
}

export function useSatelliteData(location: UserLocation | null) {
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trackedRef = useRef<TrackedSatellite[]>([]);
  const candidateIdsRef = useRef<Set<string>>(new Set());

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
          description: t.description,
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

  // Cheaply ranks the whole catalog by "will this climb worth-watching-high soon" so the
  // expensive precise pass computation only has to run on a bounded shortlist, not everyone.
  const recomputeCandidates = useCallback((observerGd: ObserverGd) => {
    const now = new Date();
    setSatellites(prev => {
      const visibleIds = new Set(prev.filter(s => s.isVisible).map(s => s.id));
      const ranked = trackedRef.current
        .filter(t => !visibleIds.has(t.id))
        .map(t => ({
          id: t.id,
          maxEl: estimateMaxElevationSoon(t.satrec, observerGd, now, COARSE_HORIZON_HOURS, COARSE_STEP_MINUTES),
        }))
        .filter(r => r.maxEl >= MIN_CANDIDATE_ELEVATION_DEG)
        .sort((a, b) => b.maxEl - a.maxEl)
        .slice(0, CANDIDATE_LIMIT);

      const newCandidateIds = new Set([...visibleIds, ...ranked.map(r => r.id)]);
      candidateIdsRef.current = newCandidateIds;

      // Clear pass data for anything that dropped out of tracking so it stops showing stale timing.
      return prev.map(s => (!newCandidateIds.has(s.id) && s.nextPass ? { ...s, nextPass: null } : s));
    });
  }, []);

  const recomputePasses = useCallback((observerGd: ObserverGd) => {
    const now = new Date();
    setSatellites(prev => {
      const targetIds = new Set(candidateIdsRef.current);
      for (const s of prev) if (s.isVisible) targetIds.add(s.id);

      const passesById = new Map<string, PassEvent | null>();
      for (const t of trackedRef.current) {
        if (!targetIds.has(t.id)) continue;
        passesById.set(t.id, findPasses(t.satrec, observerGd, now, PASS_HORIZON_HOURS)[0] ?? null);
      }

      return prev.map(s => (passesById.has(s.id) ? { ...s, nextPass: passesById.get(s.id) ?? null } : s));
    });
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
          let tles: TLEEntry[];
          try {
            tles = await fetchBulkTles();
          } catch {
            tles = await fetchTLEsFromAPI(FALLBACK_SATELLITE_IDS);
          }
          if (tles.length === 0) throw new Error('No satellite data available');
          trackedRef.current = buildTracked(tles);
        }
        recomputeLive(observerGd);
        recomputeCandidates(observerGd);
        recomputePasses(observerGd);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch satellite data');
      } finally {
        setLoading(false);
      }
    };

    run();
    const liveInterval = window.setInterval(() => recomputeLive(observerGd), LIVE_INTERVAL_MS);
    const coarseInterval = window.setInterval(() => recomputeCandidates(observerGd), COARSE_INTERVAL_MS);
    const passInterval = window.setInterval(() => recomputePasses(observerGd), PASS_INTERVAL_MS);
    return () => {
      window.clearInterval(liveInterval);
      window.clearInterval(coarseInterval);
      window.clearInterval(passInterval);
    };
  }, [location, recomputeLive, recomputeCandidates, recomputePasses]);

  return { satellites, loading, error };
}
