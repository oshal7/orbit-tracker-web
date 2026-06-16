import React, { useState, useCallback } from 'react';
import { Satellite, MapPin, Compass } from 'lucide-react';
import LocationRequest from '@/components/LocationRequest';
import SkyDome from '@/components/SkyDome';
import { SatelliteDetail, SatelliteList } from '@/components/SatelliteList';
import { useSatelliteData, type UserLocation, type SatelliteData } from '@/hooks/useSatelliteData';

export default function Index() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [facingDirection, setFacingDirection] = useState(0);
  const [selectedSat, setSelectedSat] = useState<SatelliteData | null>(null);

  const { satellites, loading, error } = useSatelliteData(location);

  const handleComplete = useCallback((loc: UserLocation, dir: number) => {
    setLocation(loc);
    setFacingDirection(dir);
  }, []);

  const handleSelectSat = useCallback((sat: SatelliteData) => {
    setSelectedSat(sat);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedSat(null);
  }, []);

  if (!location) {
    return <LocationRequest onComplete={handleComplete} />;
  }

  const visibleCount = satellites.filter(s => s.isVisible).length;
  const dirLabel = ['N','NE','E','SE','S','SW','W','NW'][Math.round(facingDirection / 45) % 8];

  return (
    <div className="h-screen bg-[#000308] flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-gray-900 bg-[#020710]/80 backdrop-blur-sm shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Satellite className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">SkyTracker</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${visibleCount > 0 ? 'bg-cyan-400 shadow-[0_0_6px_rgba(0,229,255,0.8)]' : 'bg-gray-700'}`} />
            <span className={visibleCount > 0 ? 'text-cyan-400' : 'text-gray-600'}>
              {visibleCount} visible
            </span>
          </div>

          <div className="flex items-center gap-1 text-gray-600">
            <Compass className="w-3 h-3" />
            <span>{dirLabel} ({facingDirection}°)</span>
          </div>

          <div className="flex items-center gap-1 text-gray-700">
            <MapPin className="w-3 h-3" />
            <span>{location.lat.toFixed(2)}°, {location.lng.toFixed(2)}°</span>
          </div>
        </div>
      </header>

      {/* ── 3D Sky Dome ── */}
      <div className="relative flex-1 min-h-0">
        <SkyDome
          satellites={satellites}
          facingDirection={facingDirection}
          loading={loading}
          error={error}
          onSelectSatellite={handleSelectSat}
        />

        {/* Satellite detail drawer */}
        {selectedSat && (
          <SatelliteDetail satellite={selectedSat} onClose={handleCloseDetail} />
        )}
      </div>

      {/* ── Satellite list strip ── */}
      <div className="shrink-0 border-t border-gray-900 bg-[#020710]/80 py-3">
        <SatelliteList satellites={satellites} onSelect={handleSelectSat} />
      </div>
    </div>
  );
}
