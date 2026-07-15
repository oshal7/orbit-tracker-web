interface ArtProps {
  color: string;
}

/** Bold outlined solar-panel wing: hollow segments with thick dividers, like a cut sheet of cells. */
function Wing({
  x,
  y,
  w,
  h,
  cols,
  color,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  cols: number;
  color: string;
}) {
  const cellW = w / cols;
  const dividers = [];
  for (let i = 1; i < cols; i++) {
    const lx = x + i * cellW;
    dividers.push(<line key={i} x1={lx} y1={y} x2={lx} y2={y + h} stroke={color} strokeWidth={1.4} />);
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      {dividers}
    </g>
  );
}

/** Thin antenna stem ending in a solid ball, like the reference icon. */
function Antenna({ x, y, length, color }: { x: number; y: number; length: number; color: string }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + length} stroke={color} strokeWidth={1.6} />
      <circle cx={x} cy={y + length} r={2.6} fill={color} />
    </g>
  );
}

function CommsArt({ color }: ArtProps) {
  return (
    <g>
      <Wing x={40} y={40} w={60} h={30} cols={3} color={color} />
      <Wing x={158} y={40} w={60} h={30} cols={3} color={color} />
      {/* Stepped bus, solid */}
      <path
        d="M 111 47 h 20 v 8 h 6 v 8 h -6 v 8 h -20 v -8 h -6 v -8 h 6 Z"
        fill={color}
        stroke={color}
        strokeLinejoin="round"
      />
      <rect x={124} y={33} width={10} height={10} rx={2} fill={color} />
      {/* Dish */}
      <ellipse cx={129} cy={82} rx={16} ry={6} fill={color} />
      <Antenna x={129} y={88} length={16} color={color} />
    </g>
  );
}

function SpaceStationArt({ color }: ArtProps) {
  return (
    <g>
      <line x1={30} y1={62} x2={228} y2={62} stroke={color} strokeWidth={1.6} />
      <Wing x={34} y={40} w={30} h={16} cols={3} color={color} />
      <Wing x={34} y={68} w={30} h={16} cols={3} color={color} />
      <Wing x={194} y={40} w={30} h={16} cols={3} color={color} />
      <Wing x={194} y={68} w={30} h={16} cols={3} color={color} />
      {/* Module cluster, solid */}
      <rect x={100} y={52} width={58} height={20} rx={10} fill={color} />
      <rect x={122} y={36} width={16} height={18} rx={5} fill={color} />
      <rect x={122} y={30} width={8} height={8} fill={color} />
    </g>
  );
}

function ObservatoryArt({ color }: ArtProps) {
  return (
    <g>
      <rect x={70} y={44} width={130} height={26} rx={13} fill={color} />
      <circle cx={70} cy={57} r={13} fill="none" stroke={color} strokeWidth={2} />
      <circle cx={70} cy={57} r={6} fill={color} />
      <Wing x={104} y={16} w={44} h={16} cols={4} color={color} />
      <Wing x={104} y={82} w={44} h={16} cols={4} color={color} />
    </g>
  );
}

function WeatherArt({ color }: ArtProps) {
  return (
    <g>
      <Wing x={54} y={44} w={46} h={26} cols={3} color={color} />
      <Wing x={158} y={44} w={46} h={26} cols={3} color={color} />
      <rect x={108} y={40} width={42} height={30} rx={4} fill={color} />
      <ellipse cx={150} cy={55} rx={12} ry={12} fill="none" stroke={color} strokeWidth={2} />
      <Antenna x={129} y={70} length={14} color={color} />
    </g>
  );
}

function DebrisArt({ color }: ArtProps) {
  return (
    <g transform="rotate(18 129 60)">
      <path d="M 96 48 h 50 l 10 12 l -10 12 h -50 l -8 -12 Z" fill={color} />
      <line x1={146} y1={60} x2={168} y2={60} stroke={color} strokeWidth={1.6} />
      <circle cx={170} cy={60} r={2.2} fill={color} />
    </g>
  );
}

interface SatelliteIllustrationProps {
  type: string;
  color: string;
  isDark: boolean;
}

export default function SatelliteIllustration({ type, color }: SatelliteIllustrationProps) {
  let art: JSX.Element;
  switch (type) {
    case 'Space Station':
      art = <SpaceStationArt color={color} />;
      break;
    case 'Communications':
      art = <CommsArt color={color} />;
      break;
    case 'Observatory':
      art = <ObservatoryArt color={color} />;
      break;
    case 'Weather Sat.':
      art = <WeatherArt color={color} />;
      break;
    case 'Debris':
      art = <DebrisArt color={color} />;
      break;
    default:
      art = <CommsArt color={color} />;
  }

  return (
    <svg
      width={258}
      height={126}
      viewBox="0 0 258 126"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {art}
    </svg>
  );
}
