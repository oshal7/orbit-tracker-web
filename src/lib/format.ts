export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  return `${Math.round(seconds / 60)} min`;
}

/** "4 min", "1h 12m", or "now" for a countdown given in milliseconds. */
export function formatCountdown(ms: number): string {
  if (ms <= 30_000) return 'now';
  const totalMin = Math.round(ms / 60_000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatMagnitude(mag: number): string {
  return mag > 0 ? `+${mag.toFixed(1)} mag` : `${mag.toFixed(1)} mag`;
}

export function formatAltitude(km: number): string {
  return `${Math.round(km)} km`;
}

export function formatPeriod(min: number): string {
  return `${min.toFixed(1)} min`;
}

export function formatInclination(deg: number): string {
  return `${deg.toFixed(1)}°`;
}

export function formatCoords(lat: number, lng: number): string {
  const latLabel = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
  const lngLabel = `${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`;
  return `${latLabel}  ${lngLabel}`;
}
