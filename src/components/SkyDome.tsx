import type { SatelliteData } from '@/hooks/useSatelliteData';

// Convention: azimuth in degrees from N, clockwise. Elevation 0 = horizon, 90 = zenith.
// A true circular (azimuthal) projection — no ellipse tilt.
type Pt = { x: number; y: number };

function project(az: number, el: number, cx: number, cy: number, R: number): Pt {
  const azRad = (az * Math.PI) / 180;
  const r = R * (1 - el / 90);
  return {
    x: cx + r * Math.sin(azRad),
    y: cy - r * Math.cos(azRad),
  };
}

function bezierCP(aos: Pt, peak: Pt, los: Pt): Pt {
  return {
    x: 2 * peak.x - (aos.x + los.x) / 2,
    y: 2 * peak.y - (aos.y + los.y) / 2,
  };
}

interface SkyDomeProps {
  isDark: boolean;
  satellites: SatelliteData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  size?: number;
}

export default function SkyDome({
  isDark,
  satellites,
  selectedId,
  onSelect,
  loading = false,
  error = null,
  size = 272,
}: SkyDomeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.44;

  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
  const grid = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const outline = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.14)';
  const labelColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
  const shadow = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)';
  const zenithColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const observerColor = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.65)';
  const observerCore = isDark ? '#0A0A0A' : '#F4F2ED';

  const suffix = isDark ? 'd' : 'l';
  const fadeId = `fade-${suffix}`;
  const maskId = `mask-${suffix}`;
  const glowId = `glow-${suffix}`;
  const innerGradId = `innerGrad-${suffix}`;
  const rimGradId = `rimGrad-${suffix}`;

  const compassLabels = [
    { az: 0, label: 'N' },
    { az: 90, label: 'E' },
    { az: 180, label: 'S' },
    { az: 270, label: 'W' },
  ].map(({ az, label }) => {
    const p = project(az, 0, cx, cy, R);
    const offset = 12;
    const azRad = (az * Math.PI) / 180;
    return {
      x: p.x + Math.sin(azRad) * offset,
      y: p.y - Math.cos(azRad) * offset,
      label,
    };
  });

  const withPass = satellites.filter(s => s.nextPass);

  return (
    <div className="orbit-dome-box" style={{ position: 'relative' }}>
      {(loading || error) && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            left: '50%',
            transform: 'translate(-50%, -100%)',
            whiteSpace: 'nowrap',
            fontSize: 9.5,
            fontFamily: 'Space Mono, monospace',
            letterSpacing: '0.05em',
            padding: '4px 10px',
            borderRadius: 20,
            color: error ? '#ff8080' : labelColor,
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          }}
        >
          {error ?? 'LOADING SATELLITE DATA…'}
        </div>
      )}
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
        <defs>
          {/* Horizon fade — content fades to transparent as it nears the rim */}
          <radialGradient id={fadeId} cx="50%" cy="50%" r="50%">
            <stop offset="45%" stopColor="white" stopOpacity="1" />
            <stop offset="88%" stopColor="white" stopOpacity="0.55" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id={maskId}>
            <circle cx={cx} cy={cy} r={R} fill={`url(#${fadeId})`} />
          </mask>

          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Spherical highlight — off-center light source, like a lit globe */}
          <radialGradient id={innerGradId} cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.75)'} />
            <stop offset="55%" stopColor={isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.15)'} />
            <stop offset="100%" stopColor={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'} />
          </radialGradient>

          {/* Rim shading — subtle limb-darkening for a spherical feel */}
          <radialGradient id={rimGradId} cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="black" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity={isDark ? 0.35 : 0.12} />
          </radialGradient>
        </defs>

        <ellipse cx={cx} cy={cy + R + 8} rx={R * 0.78} ry={R * 0.1} fill={shadow} />
        <circle cx={cx} cy={cy} r={R} fill={bg} />

        <g>
          {[30, 60].map(el => {
            const r = R * (1 - el / 90);
            return (
              <circle
                key={el}
                cx={cx}
                cy={cy}
                r={r}
                fill={el === 60 ? zenithColor : 'none'}
                stroke={grid}
                strokeWidth="0.7"
                strokeDasharray={el === 30 ? '3 3' : '2 3'}
              />
            );
          })}
          <line
            x1={project(0, 0, cx, cy, R).x}
            y1={project(0, 0, cx, cy, R).y}
            x2={project(180, 0, cx, cy, R).x}
            y2={project(180, 0, cx, cy, R).y}
            stroke={grid}
            strokeWidth="0.6"
            strokeDasharray="2 4"
          />
          <line
            x1={project(90, 0, cx, cy, R).x}
            y1={project(90, 0, cx, cy, R).y}
            x2={project(270, 0, cx, cy, R).x}
            y2={project(270, 0, cx, cy, R).y}
            stroke={grid}
            strokeWidth="0.6"
            strokeDasharray="2 4"
          />
        </g>

        {/* Pass arcs — purely visual, faded to the horizon */}
        <g mask={`url(#${maskId})`} style={{ pointerEvents: 'none' }}>
          {withPass.map(sat => {
            const pass = sat.nextPass!;
            const aos = project(pass.aosAz, 0, cx, cy, R);
            const peak = project(pass.peakAz, pass.maxEl, cx, cy, R);
            const los = project(pass.losAz, 0, cx, cy, R);
            const cp = bezierCP(aos, peak, los);
            const arcPath = `M ${aos.x.toFixed(2)} ${aos.y.toFixed(2)} Q ${cp.x.toFixed(2)} ${cp.y.toFixed(2)} ${los.x.toFixed(2)} ${los.y.toFixed(2)}`;

            const isSelected = selectedId === sat.id;
            const arcOpacity = isSelected ? 1 : 0.28;
            const strokeW = isSelected ? 1.8 : 1.0;

            return (
              <g key={sat.id}>
                {isSelected && (
                  <path
                    d={arcPath}
                    fill="none"
                    stroke={sat.color}
                    strokeWidth={strokeW + 3}
                    opacity={0.35}
                    filter={`url(#${glowId})`}
                    strokeLinecap="round"
                  />
                )}
                <path
                  d={arcPath}
                  fill="none"
                  stroke={sat.color}
                  strokeWidth={strokeW}
                  opacity={arcOpacity}
                  strokeLinecap="round"
                  strokeDasharray={isSelected ? 'none' : '5 4'}
                />
              </g>
            );
          })}
        </g>

        {/* Arc hit targets — generous, unmasked, always fully clickable */}
        <g>
          {withPass.map(sat => {
            const pass = sat.nextPass!;
            const aos = project(pass.aosAz, 0, cx, cy, R);
            const peak = project(pass.peakAz, pass.maxEl, cx, cy, R);
            const los = project(pass.losAz, 0, cx, cy, R);
            const cp = bezierCP(aos, peak, los);
            const arcPath = `M ${aos.x.toFixed(2)} ${aos.y.toFixed(2)} Q ${cp.x.toFixed(2)} ${cp.y.toFixed(2)} ${los.x.toFixed(2)} ${los.y.toFixed(2)}`;
            return (
              <path
                key={`hit-${sat.id}`}
                d={arcPath}
                fill="none"
                stroke="transparent"
                strokeWidth={16}
                strokeLinecap="round"
                style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                onClick={() => onSelect(sat.id)}
              />
            );
          })}
        </g>

        {/* Satellite markers — always on top of the mask */}
        {satellites.map(sat => {
          const isSelected = selectedId === sat.id;
          // Currently overhead satellites get a live dot at their real position;
          // satellites with an upcoming pass get a dot at their rise (AOS) point.
          const dot = sat.isVisible
            ? project(sat.azimuth, Math.max(sat.elevation, 0), cx, cy, R)
            : sat.nextPass
              ? project(sat.nextPass.aosAz, 0, cx, cy, R)
              : null;
          if (!dot) return null;

          const dotR = isSelected ? 5 : sat.isVisible ? 4 : 3.5;
          const dotOpacity = isSelected ? 1 : sat.isVisible ? 0.85 : 0.55;

          return (
            <g key={`dot-${sat.id}`} style={{ cursor: 'pointer' }} onClick={() => onSelect(sat.id)}>
              {isSelected && (
                <>
                  <circle cx={dot.x} cy={dot.y} r={11} fill="none" stroke={sat.color} strokeWidth="1" opacity="0.25" />
                  <circle cx={dot.x} cy={dot.y} r={7.5} fill="none" stroke={sat.color} strokeWidth="1.2" opacity="0.45" />
                </>
              )}
              {/* Generous invisible hit area for touch/click */}
              <circle cx={dot.x} cy={dot.y} r={13} fill="transparent" />
              <circle cx={dot.x} cy={dot.y} r={dotR} fill={sat.color} opacity={dotOpacity} />
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r={R} fill={`url(#${innerGradId})`} style={{ pointerEvents: 'none' }} />
        <circle cx={cx} cy={cy} r={R} fill={`url(#${rimGradId})`} style={{ pointerEvents: 'none' }} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={outline} strokeWidth="1.3" />

        {compassLabels.map(({ x, y, label }) => (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: 9, fill: labelColor, fontFamily: 'Space Mono, monospace', letterSpacing: '0.04em' }}
          >
            {label}
          </text>
        ))}

        {/* Observer marker — the zenith (dome center) is straight up from where you're standing */}
        <g style={{ pointerEvents: 'none' }}>
          <circle cx={cx} cy={cy} r={8} fill="none" stroke={observerColor} strokeWidth="1" opacity="0.3" />
          <circle cx={cx} cy={cy} r={3.4} fill={observerColor} />
          <circle cx={cx} cy={cy} r={1.3} fill={observerCore} />
          <text
            x={cx}
            y={cy + 15}
            textAnchor="middle"
            style={{
              fontSize: 7.5,
              fill: observerColor,
              fontFamily: 'Space Mono, monospace',
              letterSpacing: '0.08em',
              opacity: 0.7,
            }}
          >
            YOU
          </text>
        </g>
      </svg>
    </div>
  );
}
