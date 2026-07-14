interface ArtProps {
  color: string;
  line: string;
}

function PanelGrid({
  x,
  y,
  w,
  h,
  cols,
  rows,
  color,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  cols: number;
  rows: number;
  color: string;
}) {
  const cellW = w / cols;
  const cellH = h / rows;
  const lines = [];
  for (let i = 1; i < cols; i++) {
    const lx = x + i * cellW;
    lines.push(<line key={`v${i}`} x1={lx} y1={y} x2={lx} y2={y + h} stroke={color} strokeWidth={0.5} opacity={0.7} />);
  }
  for (let j = 1; j < rows; j++) {
    const ly = y + j * cellH;
    lines.push(<line key={`h${j}`} x1={x} y1={ly} x2={x + w} y2={ly} stroke={color} strokeWidth={0.5} opacity={0.7} />);
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={color} opacity={0.1} stroke={color} strokeWidth={0.8} />
      {lines}
    </g>
  );
}

function SpaceStationArt({ color, line }: ArtProps) {
  return (
    <g>
      <line x1={40} y1={60} x2={218} y2={60} stroke={line} strokeWidth={1.2} />
      <PanelGrid x={44} y={40} w={34} h={16} cols={3} rows={2} color={color} />
      <PanelGrid x={44} y={64} w={34} h={16} cols={3} rows={2} color={color} />
      <PanelGrid x={180} y={40} w={34} h={16} cols={3} rows={2} color={color} />
      <PanelGrid x={180} y={64} w={34} h={16} cols={3} rows={2} color={color} />
      <rect x={108} y={51} width={42} height={18} rx={9} fill="none" stroke={line} strokeWidth={1.2} />
      <rect x={121} y={37} width={16} height={15} rx={6} fill="none" stroke={line} strokeWidth={1} />
      <circle cx={129} cy={44} r={1.8} fill={color} />
    </g>
  );
}

function CommsArt({ color, line }: ArtProps) {
  return (
    <g>
      <rect x={112} y={48} width={30} height={22} rx={3} fill="none" stroke={line} strokeWidth={1.2} />
      <PanelGrid x={144} y={38} w={68} h={40} cols={4} rows={4} color={color} />
      <line x1={112} y1={58} x2={86} y2={40} stroke={line} strokeWidth={1} />
      <circle cx={84} cy={38} r={2.3} fill={color} />
    </g>
  );
}

function ObservatoryArt({ color, line }: ArtProps) {
  return (
    <g>
      <rect x={68} y={48} width={122} height={24} rx={12} fill="none" stroke={line} strokeWidth={1.3} />
      <circle cx={68} cy={60} r={12} fill="none" stroke={line} strokeWidth={1.2} />
      <PanelGrid x={108} y={20} w={42} h={14} cols={4} rows={1} color={color} />
      <PanelGrid x={108} y={78} w={42} h={14} cols={4} rows={1} color={color} />
    </g>
  );
}

function WeatherArt({ color, line }: ArtProps) {
  return (
    <g>
      <rect x={112} y={46} width={34} height={28} rx={4} fill="none" stroke={line} strokeWidth={1.2} />
      <path d="M 146 50 A 16 16 0 0 1 146 70" fill="none" stroke={line} strokeWidth={1.2} />
      <PanelGrid x={62} y={50} w={40} h={20} cols={3} rows={2} color={color} />
      <PanelGrid x={156} y={50} w={40} h={20} cols={3} rows={2} color={color} />
    </g>
  );
}

function GenericArt({ color, line }: ArtProps) {
  return (
    <g transform="rotate(10 129 60)">
      <rect x={110} y={48} width={38} height={24} rx={3} fill="none" stroke={line} strokeWidth={1.2} />
      <PanelGrid x={66} y={52} w={36} h={16} cols={3} rows={2} color={color} />
      <PanelGrid x={156} y={52} w={36} h={16} cols={3} rows={2} color={color} />
    </g>
  );
}

interface SatelliteIllustrationProps {
  type: string;
  color: string;
  isDark: boolean;
}

export default function SatelliteIllustration({ type, color, isDark }: SatelliteIllustrationProps) {
  const line = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const props: ArtProps = { color, line };

  let art: JSX.Element;
  switch (type) {
    case 'Space Station':
      art = <SpaceStationArt {...props} />;
      break;
    case 'Communications':
      art = <CommsArt {...props} />;
      break;
    case 'Observatory':
      art = <ObservatoryArt {...props} />;
      break;
    case 'Weather Sat.':
      art = <WeatherArt {...props} />;
      break;
    default:
      art = <GenericArt {...props} />;
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
