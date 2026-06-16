import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { SatelliteData, TrailPoint } from '@/hooks/useSatelliteData';

const DOME_RADIUS = 2;

// Convert azimuth (0=N, 90=E) + elevation (0=horizon, 90=zenith) to 3D scene coordinates.
// Convention: North = -Z, East = +X, Up = +Y
function azElTo3D(azimuth: number, elevation: number, r = DOME_RADIUS): [number, number, number] {
  const azRad = azimuth * (Math.PI / 180);
  const elRad = elevation * (Math.PI / 180);
  const cosEl = Math.cos(elRad);
  return [
    r * cosEl * Math.sin(azRad),
    r * Math.sin(elRad),
    -r * cosEl * Math.cos(azRad),
  ];
}

function makeRingPoints(elevation: number, r = DOME_RADIUS, segments = 128): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    pts.push(azElTo3D((i / segments) * 360, elevation, r));
  }
  return pts;
}

// ── Dome hemisphere mesh ───────────────────────────────────────────────────
function DomeMesh() {
  return (
    <>
      {/* Filled semi-transparent dome */}
      <mesh>
        <sphereGeometry args={[DOME_RADIUS, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#040c1a"
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Wireframe grid overlay for digital look */}
      <mesh>
        <sphereGeometry args={[DOME_RADIUS * 1.001, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#0f2a4a" wireframe transparent opacity={0.18} />
      </mesh>
    </>
  );
}

// ── Ground disc ────────────────────────────────────────────────────────────
function GroundDisc() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
      <circleGeometry args={[DOME_RADIUS, 64]} />
      <meshBasicMaterial color="#060e1a" transparent opacity={0.6} />
    </mesh>
  );
}

// ── Horizon ring ───────────────────────────────────────────────────────────
function HorizonRing() {
  const pts = useMemo(() => makeRingPoints(0, DOME_RADIUS + 0.01), []);
  return <Line points={pts} color="#00e5ff" lineWidth={2} transparent opacity={0.7} />;
}

// ── Elevation reference rings ──────────────────────────────────────────────
function ElevationRings() {
  const ring30 = useMemo(() => makeRingPoints(30, DOME_RADIUS - 0.01), []);
  const ring60 = useMemo(() => makeRingPoints(60, DOME_RADIUS - 0.01), []);
  return (
    <>
      <Line points={ring30} color="#1a4060" lineWidth={1} transparent opacity={0.4} />
      <Line points={ring60} color="#1a4060" lineWidth={1} transparent opacity={0.4} />
    </>
  );
}

// ── Zenith marker ──────────────────────────────────────────────────────────
function ZenithMarker() {
  return (
    <Html position={[0, DOME_RADIUS - 0.05, 0]} center>
      <span className="text-cyan-400/60 text-[10px] font-mono select-none">↑ zenith</span>
    </Html>
  );
}

// ── Compass labels ─────────────────────────────────────────────────────────
const COMPASS_DIRS = [
  { label: 'N', az: 0 },
  { label: 'NE', az: 45 },
  { label: 'E', az: 90 },
  { label: 'SE', az: 135 },
  { label: 'S', az: 180 },
  { label: 'SW', az: 225 },
  { label: 'W', az: 270 },
  { label: 'NW', az: 315 },
];

function CompassLabels() {
  return (
    <>
      {COMPASS_DIRS.map(({ label, az }) => {
        const pos = azElTo3D(az, -2, DOME_RADIUS * 1.1);
        return (
          <Html key={az} position={pos} center>
            <span className={`select-none font-bold text-[11px] ${
              ['N','S','E','W'].includes(label) ? 'text-cyan-300/80' : 'text-cyan-600/60'
            }`}>
              {label}
            </span>
          </Html>
        );
      })}
    </>
  );
}

// ── Elevation degree labels ────────────────────────────────────────────────
function ElevationLabels() {
  return (
    <>
      <Html position={azElTo3D(90, 30, DOME_RADIUS - 0.05)} center>
        <span className="text-[9px] text-cyan-700/60 select-none">30°</span>
      </Html>
      <Html position={azElTo3D(90, 60, DOME_RADIUS - 0.05)} center>
        <span className="text-[9px] text-cyan-700/60 select-none">60°</span>
      </Html>
    </>
  );
}

// ── User facing direction sector ───────────────────────────────────────────
function DirectionSector({ direction }: { direction: number }) {
  const arcPts = useMemo(() => {
    const spread = 25;
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 32; i++) {
      const az = direction - spread + (i / 32) * spread * 2;
      pts.push(azElTo3D(az, 1, DOME_RADIUS * 0.99));
    }
    return pts;
  }, [direction]);

  const center: [number, number, number] = [0, 0.01, 0];
  const tip = azElTo3D(direction, 1, DOME_RADIUS * 0.98);

  return (
    <>
      {/* Sector arc */}
      <Line points={arcPts} color="#fbbf24" lineWidth={2.5} transparent opacity={0.85} />
      {/* Center line toward facing direction */}
      <Line points={[center, tip]} color="#fbbf24" lineWidth={1.5} transparent opacity={0.5} />
      {/* Label */}
      <Html position={azElTo3D(direction, 12, DOME_RADIUS * 0.75)} center>
        <span className="text-yellow-400 text-[10px] font-semibold select-none bg-black/30 px-1 rounded">
          You →
        </span>
      </Html>
    </>
  );
}

// ── Individual satellite marker + trail ────────────────────────────────────
function SatelliteMarker({
  sat,
  onSelect,
}: {
  sat: SatelliteData;
  onSelect: (s: SatelliteData) => void;
}) {
  const el = Math.max(sat.elevation, 0.5);
  const pos = useMemo(() => azElTo3D(sat.azimuth, el), [sat.azimuth, el]);

  const isBright = sat.magnitude < 3;
  const color = isBright ? '#00e5ff' : '#a78bfa';
  const glowColor = isBright ? '#006080' : '#4b2080';
  const dotSize = Math.max(0.015, 0.04 - sat.magnitude * 0.004);

  // Split trail into past (solid) and future (dim)
  const validTrail = useMemo(
    () => sat.trail.filter((p: TrailPoint) => p.elevation > -5),
    [sat.trail]
  );
  const pastPts = useMemo(
    () => validTrail.slice(0, 4).map((p: TrailPoint) => azElTo3D(p.azimuth, Math.max(p.elevation, 0))),
    [validTrail]
  );
  const futurePts = useMemo(
    () => validTrail.slice(3).map((p: TrailPoint) => azElTo3D(p.azimuth, Math.max(p.elevation, 0))),
    [validTrail]
  );

  return (
    <group>
      {/* Past trail */}
      {pastPts.length >= 2 && (
        <Line points={pastPts} color={color} lineWidth={1.5} transparent opacity={0.5} />
      )}
      {/* Future trail (dimmer) */}
      {futurePts.length >= 2 && (
        <Line points={futurePts} color={color} lineWidth={1} transparent opacity={0.2} />
      )}

      {/* Glow halo */}
      <mesh position={pos as any}>
        <sphereGeometry args={[dotSize * 3, 8, 8]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.2} />
      </mesh>

      {/* Main dot */}
      <mesh position={pos as any} onClick={() => onSelect(sat)}>
        <sphereGeometry args={[dotSize, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Name label */}
      <Html position={[pos[0], pos[1] + dotSize * 3.5, pos[2]]} center distanceFactor={10}>
        <span
          className="text-white text-[10px] font-mono bg-black/40 px-1 rounded cursor-pointer select-none hover:bg-black/70 whitespace-nowrap"
          onClick={() => onSelect(sat)}
        >
          {sat.name.length > 14 ? sat.name.substring(0, 12) + '…' : sat.name}
        </span>
      </Html>
    </group>
  );
}

// ── Loading / error overlay ────────────────────────────────────────────────
function StatusOverlay({ loading, error, count }: { loading: boolean; error: string | null; count: number }) {
  if (!loading && !error) return null;
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
      {loading && (
        <div className="flex items-center gap-2 bg-black/70 text-cyan-400 text-xs px-3 py-1.5 rounded-full border border-cyan-500/30">
          <span className="w-3 h-3 rounded-full border border-cyan-400 border-t-transparent animate-spin" />
          Loading satellite data…
        </div>
      )}
      {error && (
        <div className="bg-red-950/80 text-red-300 text-xs px-3 py-1.5 rounded-full border border-red-700/40">
          {error}
        </div>
      )}
    </div>
  );
}

// ── 3D Scene ───────────────────────────────────────────────────────────────
function DomeScene({
  satellites,
  facingDirection,
  onSelectSatellite,
}: {
  satellites: SatelliteData[];
  facingDirection: number;
  onSelectSatellite: (s: SatelliteData) => void;
}) {
  const visibleSats = satellites.filter(s => s.elevation > 0);

  return (
    <>
      <Stars radius={30} depth={60} count={4000} factor={3.5} saturation={0} fade speed={0} />
      <ambientLight intensity={0.04} color="#4488ff" />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#00aaff" decay={2} />

      <DomeMesh />
      <GroundDisc />
      <HorizonRing />
      <ElevationRings />
      <CompassLabels />
      <ElevationLabels />
      <ZenithMarker />
      <DirectionSector direction={facingDirection} />

      {visibleSats.map(sat => (
        <SatelliteMarker key={sat.id} sat={sat} onSelect={onSelectSatellite} />
      ))}
    </>
  );
}

// ── Public component ───────────────────────────────────────────────────────
interface SkyDomeProps {
  satellites: SatelliteData[];
  facingDirection: number;
  loading: boolean;
  error: string | null;
  onSelectSatellite: (sat: SatelliteData) => void;
}

export default function SkyDome({
  satellites,
  facingDirection,
  loading,
  error,
  onSelectSatellite,
}: SkyDomeProps) {
  return (
    <div className="relative w-full h-full bg-[#000308]">
      <StatusOverlay loading={loading} error={error} count={satellites.filter(s => s.isVisible).length} />

      <Canvas
        camera={{ position: [0, 2.5, 4], fov: 58, near: 0.01, far: 200 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#000308' }}
      >
        <DomeScene
          satellites={satellites}
          facingDirection={facingDirection}
          onSelectSatellite={onSelectSatellite}
        />
      </Canvas>
    </div>
  );
}
