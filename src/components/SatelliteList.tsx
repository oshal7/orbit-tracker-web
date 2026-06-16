import React from 'react';
import { X, Satellite, Eye, EyeOff } from 'lucide-react';
import type { SatelliteData } from '@/hooks/useSatelliteData';

// ── Satellite detail drawer (shown when a satellite is tapped) ─────────────
interface SatelliteDetailProps {
  satellite: SatelliteData;
  onClose: () => void;
}

function formatDirection(azimuth: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(azimuth / 22.5) % 16];
}

function brightnessLabel(mag: number): { label: string; cls: string } {
  if (mag < 0) return { label: 'Very Bright', cls: 'text-yellow-300' };
  if (mag < 2) return { label: 'Bright', cls: 'text-cyan-300' };
  if (mag < 4) return { label: 'Moderate', cls: 'text-gray-300' };
  return { label: 'Dim', cls: 'text-gray-500' };
}

export function SatelliteDetail({ satellite: sat, onClose }: SatelliteDetailProps) {
  const bright = brightnessLabel(sat.magnitude);
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 animate-in slide-in-from-bottom duration-300">
      <div className="bg-[#060e1a]/95 backdrop-blur-md border-t border-cyan-500/20 rounded-t-2xl p-5 shadow-2xl">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">{sat.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {sat.isVisible ? (
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-gray-500" />
              )}
              <span className={`text-xs font-medium ${sat.isVisible ? 'text-cyan-400' : 'text-gray-500'}`}>
                {sat.isVisible ? 'Visible now' : 'Below horizon'}
              </span>
              <span className="text-gray-600">·</span>
              <span className={`text-xs font-medium ${bright.cls}`}>{bright.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Direction', value: `${formatDirection(sat.azimuth)} (${sat.azimuth.toFixed(0)}°)` },
            { label: 'Elevation', value: `${sat.elevation.toFixed(1)}°` },
            { label: 'Distance', value: `${sat.range.toFixed(0)} km` },
            { label: 'Speed', value: `${sat.velocity.toFixed(2)} km/s` },
            { label: 'Magnitude', value: sat.magnitude > 0 ? `+${sat.magnitude.toFixed(1)}` : `${sat.magnitude.toFixed(1)}` },
            { label: 'NORAD ID', value: `#${sat.id}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#0a1628] rounded-xl p-3 border border-gray-800">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</div>
              <div className="text-sm font-semibold text-white">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Compact satellite list below the dome ──────────────────────────────────
interface SatelliteListProps {
  satellites: SatelliteData[];
  onSelect: (sat: SatelliteData) => void;
}

export function SatelliteList({ satellites, onSelect }: SatelliteListProps) {
  const visible = satellites.filter(s => s.isVisible);
  const nearHorizon = satellites.filter(s => !s.isVisible && s.elevation > -5);

  if (visible.length === 0 && nearHorizon.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-gray-600 text-sm">
        <Satellite className="w-4 h-4" />
        <span>No satellites above horizon right now</span>
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-4 scrollbar-none">
      {visible.map(sat => (
        <button
          key={sat.id}
          onClick={() => onSelect(sat)}
          className="shrink-0 flex flex-col items-start bg-[#060e1a] border border-cyan-500/20 rounded-xl px-3 py-2.5 hover:border-cyan-400/50 transition-colors min-w-[130px]"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,229,255,0.8)]" />
            <span className="text-white text-xs font-semibold truncate max-w-[100px]">{sat.name}</span>
          </div>
          <div className="text-gray-400 text-[10px]">
            {formatDirection(sat.azimuth)} · {sat.elevation.toFixed(0)}° up
          </div>
        </button>
      ))}

      {nearHorizon.slice(0, 3).map(sat => (
        <button
          key={sat.id}
          onClick={() => onSelect(sat)}
          className="shrink-0 flex flex-col items-start bg-[#06091a] border border-gray-800 rounded-xl px-3 py-2.5 hover:border-gray-600 transition-colors min-w-[130px] opacity-60"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-gray-600" />
            <span className="text-gray-400 text-xs font-medium truncate max-w-[100px]">{sat.name}</span>
          </div>
          <div className="text-gray-600 text-[10px]">
            {sat.elevation.toFixed(0)}° · rising soon
          </div>
        </button>
      ))}
    </div>
  );
}
