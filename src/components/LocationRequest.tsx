import React, { useState, useCallback } from 'react';
import { MapPin, Compass, Navigation, AlertCircle, ChevronRight } from 'lucide-react';
import { useCompassDirection } from '@/hooks/useCompassDirection';
import type { UserLocation } from '@/hooks/useSatelliteData';

const DIRECTIONS = [
  { label: 'N',  deg: 0   },
  { label: 'NE', deg: 45  },
  { label: 'E',  deg: 90  },
  { label: 'SE', deg: 135 },
  { label: 'S',  deg: 180 },
  { label: 'SW', deg: 225 },
  { label: 'W',  deg: 270 },
  { label: 'NW', deg: 315 },
];

function CompassPicker({ selected, onChange }: { selected: number; onChange: (d: number) => void }) {
  const radius = 90;
  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Outer ring */}
      <div className="w-full h-full rounded-full border border-cyan-500/40 bg-cyan-950/20" />
      {/* Inner ring */}
      <div className="absolute inset-4 rounded-full border border-cyan-500/20" />

      {/* Direction buttons */}
      {DIRECTIONS.map(({ label, deg }) => {
        const rad = (deg - 90) * (Math.PI / 180);
        const x = 50 + (radius / 2) * Math.cos(rad);
        const y = 50 + (radius / 2) * Math.sin(rad);
        const isSelected = Math.abs(selected - deg) < 25 || (selected > 337 && deg === 0);
        return (
          <button
            key={deg}
            onClick={() => onChange(deg)}
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            className={`absolute text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(0,255,255,0.6)]'
                : 'text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-900/40'
            }`}
          >
            {label}
          </button>
        );
      })}

      {/* Needle */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ transform: `rotate(${selected}deg)`, transition: 'transform 0.3s ease' }}
      >
        <div className="absolute left-1/2 top-1/2 w-0.5 h-[46%] -translate-x-1/2 -translate-y-full bg-gradient-to-t from-cyan-400 to-transparent rounded-full" />
      </div>

      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
      </div>
    </div>
  );
}

function LiveCompass({ heading, direction, onConfirm }: {
  heading: number;
  direction: number;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-6 text-center">
      <p className="text-gray-400 text-sm">
        Hold your phone level and point it toward north, or just confirm your current direction.
      </p>

      <div className="relative w-36 h-36 mx-auto">
        <div className="w-full h-full rounded-full border border-cyan-500/40 bg-cyan-950/20" />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `rotate(${-heading}deg)`, transition: 'transform 0.2s' }}
        >
          <div className="w-0.5 h-14 bg-gradient-to-t from-transparent to-cyan-400 rounded-full mb-auto mt-3" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-cyan-300">{heading}°</span>
        </div>
      </div>

      <p className="text-white font-medium">
        Facing: <span className="text-cyan-400">{DIRECTIONS.reduce((best, d) => {
          return Math.abs(((heading - d.deg + 540) % 360) - 180) < Math.abs(((heading - best.deg + 540) % 360) - 180) ? d : best;
        }).label}</span>
      </p>

      <button
        onClick={onConfirm}
        className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        Confirm Direction <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

interface LocationRequestProps {
  onComplete: (location: UserLocation, facingDirection: number) => void;
}

type Step = 'location' | 'direction';

export default function LocationRequest({ onComplete }: LocationRequestProps) {
  const [step, setStep] = useState<Step>('location');
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualDirection, setManualDirection] = useState(0);

  const compass = useCompassDirection();

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
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        setIsLocating(false);
        setStep('direction');
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
  }, []);

  const confirmDirection = useCallback((deg: number) => {
    if (location) onComplete(location, deg);
  }, [location, onComplete]);

  const handleIOSPermission = useCallback(async () => {
    await compass.requestPermission();
  }, [compass]);

  return (
    <div className="min-h-screen bg-[#000510] flex items-center justify-center p-4">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,200,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo / title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-4">
            <Navigation className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">SkyTracker</h1>
          <p className="text-gray-500 mt-1 text-sm">Identify satellites passing overhead</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8 px-4">
          {(['location', 'direction'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 ${step === s ? 'text-cyan-400' : step === 'direction' && s === 'location' ? 'text-cyan-600' : 'text-gray-600'}`}>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s ? 'border-cyan-400 bg-cyan-400/10' :
                  step === 'direction' && s === 'location' ? 'border-cyan-600 bg-cyan-600/10' :
                  'border-gray-700'
                }`}>
                  {i + 1}
                </div>
                <span className="text-xs font-medium capitalize">{s}</span>
              </div>
              {i === 0 && <div className="flex-1 h-px bg-gray-700" />}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-[#080f1a] border border-gray-800 rounded-2xl p-6 shadow-xl">

          {step === 'location' && (
            <div className="space-y-6">
              <div className="text-center">
                <MapPin className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
                <h2 className="text-xl font-semibold text-white">Your Location</h2>
                <p className="text-gray-400 text-sm mt-2">
                  We need your GPS coordinates to calculate which satellites are visible from where you are.
                </p>
              </div>

              {locationError && (
                <div className="flex gap-2 items-start bg-red-950/40 border border-red-800/50 rounded-xl p-3 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{locationError}</span>
                </div>
              )}

              <button
                onClick={requestLocation}
                disabled={isLocating}
                className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-900 disabled:text-cyan-600 text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isLocating ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    Locating...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    Allow Location Access
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-600">
                Location is used only for orbital calculations and never stored.
              </p>
            </div>
          )}

          {step === 'direction' && (
            <div className="space-y-6">
              <div className="text-center">
                <Compass className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
                <h2 className="text-xl font-semibold text-white">Which Way Are You Facing?</h2>
                <p className="text-gray-400 text-sm mt-2">
                  We'll highlight satellites in your line of sight.
                </p>
              </div>

              {compass.isSupported && !compass.timedOut ? (
                compass.needsPermission && compass.heading === null ? (
                  <div className="space-y-4 text-center">
                    <p className="text-gray-400 text-sm">iOS requires permission to access the compass sensor.</p>
                    <button
                      onClick={handleIOSPermission}
                      className="w-full py-3 bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 text-cyan-300 font-medium rounded-xl transition-colors"
                    >
                      Allow Compass Access
                    </button>
                    <button
                      onClick={() => confirmDirection(manualDirection)}
                      className="w-full py-2 text-gray-500 hover:text-gray-400 text-sm transition-colors"
                    >
                      Skip — use manual direction instead
                    </button>
                  </div>
                ) : compass.heading !== null ? (
                  <LiveCompass
                    heading={compass.heading}
                    direction={compass.heading}
                    onConfirm={() => confirmDirection(compass.heading!)}
                  />
                ) : (
                  // Sensor available but no reading yet
                  <div className="space-y-4 text-center">
                    <div className="text-gray-400 text-sm">
                      <span className="w-4 h-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin inline-block mr-2" />
                      Reading compass…
                    </div>
                    <button
                      onClick={() => confirmDirection(manualDirection)}
                      className="w-full py-2 text-gray-500 hover:text-gray-400 text-sm transition-colors"
                    >
                      Skip — use manual direction instead
                    </button>
                  </div>
                )
              ) : (
                // Desktop, no sensor, or the compass never reported a reading — manual picker
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm text-center">
                    {compass.timedOut
                      ? "We couldn't read your compass. Tap a direction to set where you're facing."
                      : "Tap a direction to set where you're facing."}
                  </p>
                  <CompassPicker selected={manualDirection} onChange={setManualDirection} />
                  <p className="text-center text-white font-medium">
                    Facing: <span className="text-cyan-400">
                      {DIRECTIONS.reduce((best, d) => {
                        return Math.abs(((manualDirection - d.deg + 540) % 360) - 180) < Math.abs(((manualDirection - best.deg + 540) % 360) - 180) ? d : best;
                      }).label}
                    </span> ({manualDirection}°)
                  </p>
                  <button
                    onClick={() => confirmDirection(manualDirection)}
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    Start Tracking <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Skip */}
              {compass.isSupported && compass.heading !== null && (
                <button
                  onClick={() => confirmDirection(0)}
                  className="w-full py-2 text-gray-600 hover:text-gray-400 text-xs transition-colors"
                >
                  Skip — default to North
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
