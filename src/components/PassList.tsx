import { ChevronRight } from 'lucide-react';
import type { SatelliteData } from '@/hooks/useSatelliteData';
import { formatCountdown } from '@/lib/format';

interface PassListProps {
  satellites: SatelliteData[];
  isDark: boolean;
  selectedId: string | null;
  onSelect: (sat: SatelliteData) => void;
}

export default function PassList({ satellites, isDark, selectedId, onSelect }: PassListProps) {
  const fg = isDark ? '#FFFFFF' : '#0A0A0A';
  const muted = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
  const divider = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const mono = 'Space Mono, monospace';
  const now = Date.now();

  if (satellites.length === 0) {
    return (
      <p style={{ color: muted, fontSize: 12, textAlign: 'center', padding: '20px 0', fontFamily: "'DM Sans', sans-serif" }}>
        No satellites overhead or rising soon
      </p>
    );
  }

  return (
    <div>
      {satellites.map(sat => {
        const isSelected = selectedId === sat.id;
        const rightLabel = sat.isVisible
          ? 'now'
          : sat.nextPass
            ? formatCountdown(sat.nextPass.aosTime.getTime() - now)
            : '';
        const metaLabel = sat.isVisible
          ? `${sat.elevation.toFixed(0)}° up now`
          : sat.nextPass
            ? `${Math.round(sat.nextPass.maxEl)}° max`
            : '';

        return (
          <button
            key={sat.id}
            onClick={() => onSelect(sat)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: `1px solid ${divider}`,
              cursor: 'pointer',
              textAlign: 'left',
              color: fg,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: sat.color,
                  display: 'inline-block',
                  flexShrink: 0,
                  opacity: isSelected || sat.isVisible ? 1 : 0.55,
                  boxShadow: isSelected || sat.isVisible ? `0 0 7px ${sat.color}` : 'none',
                }}
              />
              <div>
                <p style={{ fontSize: 13, fontWeight: isSelected ? 500 : 400, margin: 0 }}>{sat.name}</p>
                <p style={{ fontSize: 10.5, color: muted, fontFamily: mono, margin: '2px 0 0', letterSpacing: '0.02em' }}>
                  {metaLabel}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: mono,
                  color: sat.isVisible ? sat.color : isSelected ? sat.color : fg,
                  opacity: isSelected || sat.isVisible ? 1 : 0.8,
                }}
              >
                {rightLabel}
              </span>
              <ChevronRight size={12} color={muted} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
