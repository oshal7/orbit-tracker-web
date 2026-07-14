import { useCallback, useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import type { UserLocation } from '@/hooks/useSatelliteData';

interface LocationRequestProps {
  onComplete: (location: UserLocation) => void;
}

export default function LocationRequest({ onComplete }: LocationRequestProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by this browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onComplete({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        const msgs: Record<number, string> = {
          [err.PERMISSION_DENIED]: 'Location access denied. Please allow it in your browser settings.',
          [err.POSITION_UNAVAILABLE]: 'Location unavailable. Please check your device.',
          [err.TIMEOUT]: 'Location request timed out. Try again.',
        };
        setLocationError(msgs[err.code] ?? 'Failed to get location.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }, [onComplete]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A0A0A',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}>
        <p
          style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: 9,
            letterSpacing: '0.14em',
            fontFamily: 'Space Mono, monospace',
            marginBottom: 10,
          }}
        >
          ORBIT WATCH
        </p>
        <MapPin size={30} color="#5B9EFF" style={{ marginBottom: 14 }} />
        <h1 style={{ fontSize: 21, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Your Location</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
          We need your GPS coordinates to work out which satellites are overhead and predict upcoming passes.
        </p>

        {locationError && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
              backgroundColor: 'rgba(255,80,80,0.08)',
              border: '1px solid rgba(255,80,80,0.25)',
              borderRadius: 12,
              padding: 12,
              marginTop: 18,
              textAlign: 'left',
              color: '#ff8080',
              fontSize: 12.5,
            }}
          >
            <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>{locationError}</span>
          </div>
        )}

        <button
          onClick={requestLocation}
          disabled={isLocating}
          style={{
            width: '100%',
            marginTop: 22,
            padding: '13px 0',
            backgroundColor: isLocating ? 'rgba(91,158,255,0.35)' : '#5B9EFF',
            color: '#0A0A0A',
            fontWeight: 600,
            fontSize: 13.5,
            border: 'none',
            borderRadius: 12,
            cursor: isLocating ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {isLocating ? (
            <>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: '2px solid #0A0A0A',
                  borderTopColor: 'transparent',
                  display: 'inline-block',
                  animation: 'orbit-spin 0.8s linear infinite',
                }}
              />
              Locating…
            </>
          ) : (
            <>
              <MapPin size={15} />
              Allow Location Access
            </>
          )}
        </button>

        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10.5, marginTop: 14 }}>
          Location is used only for orbital calculations and never stored.
        </p>
      </div>
      <style>{`@keyframes orbit-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
