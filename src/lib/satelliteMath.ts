import * as satellite from 'satellite.js';

export interface ObserverGd {
  latitude: number;
  longitude: number;
  height: number;
}

export interface LookAngles {
  azimuth: number;
  elevation: number;
  range: number;
}

export interface PassEvent {
  aosTime: Date;
  losTime: Date;
  maxElTime: Date;
  maxEl: number;
  aosAz: number;
  losAz: number;
  peakAz: number;
  durationSec: number;
}

export interface OrbitalParams {
  inclinationDeg: number;
  periodMin: number;
  altitudeKm: number;
}

const EARTH_MU = 398600.4418; // km^3/s^2, standard gravitational parameter
const EARTH_RADIUS_KM = 6378.137;

/** Azimuth/elevation/range of a satellite as seen from an observer at a given instant. */
export function computeLookAngles(
  satrec: satellite.SatRec,
  observerGd: ObserverGd,
  time: Date
): LookAngles | null {
  const pv = satellite.propagate(satrec, time);
  if (!pv.position || typeof pv.position === 'boolean') return null;

  const gmst = satellite.gstime(time);
  const positionEcf = satellite.eciToEcf(pv.position as satellite.EciVec3<number>, gmst);
  const look = satellite.ecfToLookAngles(observerGd, positionEcf);

  let az = look.azimuth * (180 / Math.PI);
  if (az < 0) az += 360;
  const el = look.elevation * (180 / Math.PI);

  return { azimuth: az, elevation: el, range: look.rangeSat };
}

/**
 * Scan forward in time to find AOS/LOS pass windows.
 * Starts slightly before `from` so a pass already in progress is captured
 * (with its true AOS), not just passes that haven't risen yet.
 */
export function findPasses(
  satrec: satellite.SatRec,
  observerGd: ObserverGd,
  from: Date,
  horizonHours = 8,
  stepSeconds = 30,
  lookbackMinutes = 20
): PassEvent[] {
  const passes: PassEvent[] = [];
  const start = new Date(from.getTime() - lookbackMinutes * 60 * 1000);
  const totalSteps = Math.ceil(((horizonHours * 60 + lookbackMinutes) * 60) / stepSeconds);

  let current: { aosTime: Date; aosAz: number; maxEl: number; maxElTime: Date; peakAz: number } | null = null;

  for (let i = 0; i <= totalSteps; i++) {
    const t = new Date(start.getTime() + i * stepSeconds * 1000);
    const look = computeLookAngles(satrec, observerGd, t);
    if (!look) continue;
    const { azimuth, elevation } = look;

    if (elevation > 0 && current === null) {
      current = { aosTime: t, aosAz: azimuth, maxEl: elevation, maxElTime: t, peakAz: azimuth };
    } else if (elevation > 0 && current) {
      if (elevation > current.maxEl) {
        current.maxEl = elevation;
        current.maxElTime = t;
        current.peakAz = azimuth;
      }
    } else if (elevation <= 0 && current) {
      passes.push({
        aosTime: current.aosTime,
        losTime: t,
        maxElTime: current.maxElTime,
        maxEl: current.maxEl,
        aosAz: current.aosAz,
        losAz: azimuth,
        peakAz: current.peakAz,
        durationSec: (t.getTime() - current.aosTime.getTime()) / 1000,
      });
      current = null;
    }
  }

  // Drop passes that already fully ended before `from`.
  return passes.filter(p => p.losTime.getTime() >= from.getTime());
}

/**
 * Cheap forward scan that returns just the highest elevation a satellite reaches within a
 * window — not full pass boundaries. Used to rank a large catalog by "will this be worth a
 * closer look soon" before running the expensive findPasses() on the promising candidates.
 */
export function estimateMaxElevationSoon(
  satrec: satellite.SatRec,
  observerGd: ObserverGd,
  from: Date,
  horizonHours = 6,
  stepMinutes = 15
): number {
  let maxEl = -90;
  const steps = Math.ceil((horizonHours * 60) / stepMinutes);
  for (let i = 0; i <= steps; i++) {
    const t = new Date(from.getTime() + i * stepMinutes * 60_000);
    const look = computeLookAngles(satrec, observerGd, t);
    if (look && look.elevation > maxEl) maxEl = look.elevation;
  }
  return maxEl;
}

/** Parses inclination + mean motion from TLE line 2, derives period and mean altitude. */
export function parseOrbitalParams(line2: string): OrbitalParams {
  const inclinationDeg = parseFloat(line2.substring(8, 16));
  const meanMotionRevPerDay = parseFloat(line2.substring(52, 63));
  const periodMin = 1440 / meanMotionRevPerDay;
  const periodSec = periodMin * 60;
  const semiMajorAxisKm = Math.cbrt((EARTH_MU * periodSec * periodSec) / (4 * Math.PI * Math.PI));
  const altitudeKm = semiMajorAxisKm - EARTH_RADIUS_KM;
  return { inclinationDeg, periodMin, altitudeKm };
}

export function estimateMagnitude(name: string, range: number): number {
  let mag = 4.0;
  const n = name.toUpperCase();
  if (n.includes('ISS') || n.includes('ZARYA')) mag = -2.5;
  else if (n.includes('TIANHE') || n.includes('CSS')) mag = 3.2;
  else if (n.includes('HUBBLE') || n.includes('HST')) mag = 2.5;
  else if (n.includes('STARLINK')) mag = 4.5;
  else if (n.includes('NOAA') || n.includes('GOES') || n.includes('SUOMI')) mag = 4.5;
  if (range > 0) mag += Math.log10(range / 400) * 2;
  return parseFloat(mag.toFixed(1));
}

const FALLBACK_PALETTE = ['#FF7A3D', '#5B9EFF', '#3DD6A8', '#B89EFF', '#FFC93D', '#FF6B9D', '#6BFFB8'];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export interface SatelliteClass {
  type: string;
  color: string;
  description: string;
}

const TYPE_DESCRIPTIONS: Record<string, string> = {
  'Space Station': 'A continuously crewed research outpost, home to rotating crews conducting science in microgravity.',
  Observatory: 'A space-based telescope observing the universe from above the distortion of Earth’s atmosphere.',
  Communications: 'Part of a satellite constellation relaying communications or broadband internet from low Earth orbit.',
  'Weather Sat.': 'Monitors Earth’s atmosphere, oceans, and land to support weather forecasting and climate research.',
  Debris: 'A spent rocket stage or inactive object left in orbit after launch, tracked to avoid collisions.',
  Satellite: 'An artificial satellite orbiting Earth, tracked here using publicly available orbital data.',
};

/** Best-effort classification of a satellite's kind, display color, and description from its TLE name. */
export function classifySatellite(name: string, noradId: string): SatelliteClass {
  const n = name.toUpperCase();
  if (n.includes('ISS') || n.includes('ZARYA')) {
    return {
      type: 'Space Station',
      color: '#FF7A3D',
      description:
        'The International Space Station orbits Earth roughly every 93 minutes, hosting astronauts from multiple space agencies conducting research in microgravity.',
    };
  }
  if (n.includes('TIANHE') || n.includes('CSS')) {
    return {
      type: 'Space Station',
      color: '#FFC93D',
      description: 'Tianhe is the core module of China’s Tiangong space station, housing life support and crew quarters.',
    };
  }
  if (n.includes('HUBBLE') || n.includes('HST')) {
    return {
      type: 'Observatory',
      color: '#3DD6A8',
      description:
        'The Hubble Space Telescope has observed the universe in visible, ultraviolet, and near-infrared light since 1990.',
    };
  }
  if (n.includes('STARLINK')) {
    return {
      type: 'Communications',
      color: '#5B9EFF',
      description:
        'Part of SpaceX’s Starlink constellation, delivering broadband internet from low Earth orbit alongside thousands of sister satellites.',
    };
  }
  if (n.includes('ONEWEB')) {
    return {
      type: 'Communications',
      color: '#5B9EFF',
      description: 'Part of the OneWeb constellation, delivering broadband internet from low Earth orbit.',
    };
  }
  if (n.includes('IRIDIUM')) {
    return {
      type: 'Communications',
      color: '#5B9EFF',
      description: 'Part of the Iridium constellation, providing global satellite phone and data coverage.',
    };
  }
  if (n.includes('NOAA') || n.includes('GOES') || n.includes('SUOMI') || n.includes('METOP')) {
    return { type: 'Weather Sat.', color: '#B89EFF', description: TYPE_DESCRIPTIONS['Weather Sat.'] };
  }
  if (n.includes('R/B') || n.includes('DEB') || n.includes('ROCKET BODY')) {
    return { type: 'Debris', color: '#8A8A8A', description: TYPE_DESCRIPTIONS.Debris };
  }
  return {
    type: 'Satellite',
    color: FALLBACK_PALETTE[hashString(noradId) % FALLBACK_PALETTE.length],
    description: TYPE_DESCRIPTIONS.Satellite,
  };
}

const COMPASS_16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

export function formatDirection(azimuth: number): string {
  return COMPASS_16[Math.round(azimuth / 22.5) % 16];
}

/** e.g. "NW → SE" from AOS/LOS azimuths. */
export function passDirectionLabel(aosAz: number, losAz: number): string {
  return `${formatDirection(aosAz)} → ${formatDirection(losAz)}`;
}
