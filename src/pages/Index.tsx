import { useCallback, useMemo, useState } from 'react';
import { Settings } from 'lucide-react';
import LocationRequest from '@/components/LocationRequest';
import SkyDome from '@/components/SkyDome';
import PassList from '@/components/PassList';
import SatelliteDetail from '@/components/SatelliteDetail';
import { useSatelliteData, type UserLocation, type SatelliteData } from '@/hooks/useSatelliteData';
import { useDayNight } from '@/hooks/useDayNight';
import { formatCoords } from '@/lib/format';

export default function Index() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { satellites, loading, error } = useSatelliteData(location);
  const isDark = useDayNight(location);

  const displaySats = useMemo(() => {
    return satellites
      .filter(s => s.isVisible || s.nextPass)
      .sort((a, b) => {
        if (a.isVisible !== b.isVisible) return a.isVisible ? -1 : 1;
        if (a.isVisible && b.isVisible) return b.elevation - a.elevation;
        return a.nextPass!.aosTime.getTime() - b.nextPass!.aosTime.getTime();
      });
  }, [satellites]);

  const detailSat = detailId ? (satellites.find(s => s.id === detailId) ?? null) : null;

  const handleSelect = useCallback((id: string) => setSelectedId(id), []);
  const handleOpenDetail = useCallback((sat: SatelliteData) => {
    setSelectedId(sat.id);
    setDetailId(sat.id);
  }, []);
  const handleBack = useCallback(() => setDetailId(null), []);
  const handleResetLocation = useCallback(() => {
    setLocation(null);
    setSelectedId(null);
    setDetailId(null);
  }, []);

  if (!location) {
    return <LocationRequest onComplete={setLocation} />;
  }

  if (detailSat) {
    return <SatelliteDetail satellite={detailSat} isDark={isDark} onBack={handleBack} />;
  }

  const bg = isDark ? '#0A0A0A' : '#F4F2ED';
  const fg = isDark ? '#FFFFFF' : '#0A0A0A';
  const muted = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';

  return (
    <div
      style={{
        backgroundColor: bg,
        color: fg,
        height: '100vh',
        fontFamily: "'DM Sans', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 24px)',
          paddingLeft: 22,
          paddingRight: 22,
          paddingBottom: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: muted, fontSize: 9, letterSpacing: '0.11em', fontFamily: 'Space Mono, monospace' }}>
              ORBIT WATCH
            </p>
            <p style={{ fontSize: 11.5, fontFamily: 'Space Mono, monospace', color: muted, marginTop: 3, letterSpacing: '0.03em' }}>
              {formatCoords(location.lat, location.lng)}
            </p>
          </div>
          <button
            onClick={handleResetLocation}
            style={{ color: muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}
            aria-label="Change location"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 14px 0' }}>
        <SkyDome
          isDark={isDark}
          satellites={displaySats}
          selectedId={selectedId}
          onSelect={handleSelect}
          loading={loading}
          error={error}
          size={272}
        />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingLeft: 22, paddingRight: 22, paddingBottom: 18, marginTop: 6 }}>
        <p style={{ color: muted, fontSize: 9, letterSpacing: '0.13em', fontFamily: 'Space Mono, monospace', marginBottom: 8 }}>
          OVERHEAD &amp; UPCOMING
        </p>
        <PassList satellites={displaySats} isDark={isDark} selectedId={selectedId} onSelect={handleOpenDetail} />
      </div>
    </div>
  );
}
