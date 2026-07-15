import issPhoto from '@/assets/satellites/iss.png';
import hubblePhoto from '@/assets/satellites/hubble.png';
import goesPhoto from '@/assets/satellites/goes.png';
import iridiumPhoto from '@/assets/satellites/iridium.png';
import genericPhoto from '@/assets/satellites/generic.png';

const PHOTO_BY_TYPE: Record<string, string> = {
  'Space Station': issPhoto,
  Observatory: hubblePhoto,
  'Weather Sat.': goesPhoto,
  Communications: iridiumPhoto,
  Satellite: genericPhoto,
};

/** Simple tumbled-rocket-body silhouette — no photo reference exists for generic orbital debris. */
function DebrisArt({ color }: { color: string }) {
  return (
    <svg width={258} height={126} viewBox="0 0 258 126" style={{ position: 'absolute', inset: 0 }}>
      <g transform="rotate(18 129 60)">
        <path d="M 96 48 h 50 l 10 12 l -10 12 h -50 l -8 -12 Z" fill={color} />
        <line x1={146} y1={60} x2={168} y2={60} stroke={color} strokeWidth={1.6} />
        <circle cx={170} cy={60} r={2.2} fill={color} />
      </g>
    </svg>
  );
}

interface SatelliteIllustrationProps {
  type: string;
  color: string;
  isDark: boolean;
}

export default function SatelliteIllustration({ type, color }: SatelliteIllustrationProps) {
  const photo = PHOTO_BY_TYPE[type];

  if (!photo) {
    return <DebrisArt color={color} />;
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={photo}
        alt=""
        style={{
          maxHeight: 94,
          maxWidth: 216,
          width: 'auto',
          height: 'auto',
          filter: `drop-shadow(0 10px 16px ${color}66) drop-shadow(0 3px 10px rgba(0,0,0,0.5))`,
        }}
      />
    </div>
  );
}
