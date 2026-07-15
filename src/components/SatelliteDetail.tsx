import { ArrowLeft } from 'lucide-react';
import type { SatelliteData } from '@/hooks/useSatelliteData';
import SatelliteIllustration from '@/components/SatelliteIllustration';
import { passDirectionLabel, formatDirection } from '@/lib/satelliteMath';
import {
  formatTime,
  formatDuration,
  formatMagnitude,
  formatAltitude,
  formatPeriod,
  formatInclination,
} from '@/lib/format';

interface SatelliteDetailProps {
  satellite: SatelliteData;
  isDark: boolean;
  onBack: () => void;
}

export default function SatelliteDetail({ satellite: sat, isDark, onBack }: SatelliteDetailProps) {
  const bg = isDark ? '#0A0A0A' : '#F4F2ED';
  const fg = isDark ? '#FFFFFF' : '#0A0A0A';
  const muted = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
  const divider = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const mono = 'Space Mono, monospace';
  const pass = sat.nextPass;

  const dataRow = (label: string, value: string) => (
    <div
      key={label}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: `1px solid ${divider}`,
      }}
    >
      <span style={{ fontSize: 12.5, color: muted }}>{label}</span>
      <span style={{ fontSize: 12.5, fontFamily: mono, color: fg }}>{value}</span>
    </div>
  );

  const sectionLabel = (text: string) => (
    <p
      key={text}
      style={{
        color: muted,
        fontSize: 9,
        letterSpacing: '0.13em',
        fontFamily: mono,
        marginTop: 18,
        marginBottom: 8,
      }}
    >
      {text}
    </p>
  );

  return (
    <div
      style={{
        backgroundColor: bg,
        color: fg,
        height: '100%',
        fontFamily: "'DM Sans', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <div style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 24px)', paddingLeft: 22, paddingRight: 22, paddingBottom: 10 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: muted,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            padding: 0,
            marginBottom: 16,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div
            style={{
              width: 3,
              height: 36,
              borderRadius: 2,
              backgroundColor: sat.color,
              flexShrink: 0,
              marginTop: 3,
              boxShadow: `0 0 10px ${sat.color}88`,
            }}
          />
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: '-0.025em' }}>{sat.name}</h1>
            <p style={{ color: muted, fontSize: 9.5, letterSpacing: '0.1em', fontFamily: mono, marginTop: 5 }}>
              NORAD #{sat.id} &nbsp;·&nbsp; {sat.type.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '10px 22px 14px',
          borderBottom: `1px solid ${divider}`,
        }}
      >
        <div style={{ position: 'relative', width: 258, height: 126 }}>
          <SatelliteIllustration type={sat.type} color={sat.color} isDark={isDark} />
        </div>
      </div>

      <div style={{ paddingLeft: 22, paddingRight: 22, paddingBottom: 8, paddingTop: 16 }}>
        <p style={{ color: muted, fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>{sat.description}</p>
      </div>

      <div style={{ paddingLeft: 22, paddingRight: 22, paddingBottom: 28 }}>
        {sat.isVisible && (
          <>
            {sectionLabel('OVERHEAD NOW')}
            {dataRow('Direction', `${formatDirection(sat.azimuth)} (${sat.azimuth.toFixed(0)}°)`)}
            {dataRow('Elevation', `${sat.elevation.toFixed(1)}°`)}
            {dataRow('Range', `${sat.range.toFixed(0)} km`)}
            {dataRow('Speed', `${sat.velocity.toFixed(2)} km/s`)}
          </>
        )}

        {pass && (
          <>
            {sectionLabel(sat.isVisible ? 'CURRENT PASS' : 'NEXT PASS')}
            {dataRow('AOS', formatTime(pass.aosTime))}
            {dataRow('LOS', formatTime(pass.losTime))}
            {dataRow('Duration', formatDuration(pass.durationSec))}
            {dataRow('Max elevation', `${Math.round(pass.maxEl)}°`)}
            {dataRow('Direction', passDirectionLabel(pass.aosAz, pass.losAz))}
          </>
        )}

        {sectionLabel('ORBIT')}
        {dataRow('Altitude', formatAltitude(sat.altitudeKm))}
        {dataRow('Period', formatPeriod(sat.periodMin))}
        {dataRow('Inclination', formatInclination(sat.inclinationDeg))}
        {dataRow('Brightness', formatMagnitude(sat.magnitude))}
      </div>
    </div>
  );
}
