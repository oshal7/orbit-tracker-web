const RAD = Math.PI / 180;

/**
 * Approximate solar elevation angle (degrees) at a given lat/lon and instant.
 * Accurate to a fraction of a degree — plenty for a day/night theme switch.
 * Based on the simplified low-precision solar position algorithm (NOAA/USNO).
 */
export function solarElevationDeg(lat: number, lon: number, date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const d = jd - 2451545.0; // days since J2000.0

  const meanAnomaly = (357.529 + 0.98560028 * d) % 360;
  const meanLongitude = (280.459 + 0.98564736 * d) % 360;
  const eclipticLongitude =
    (meanLongitude + 1.915 * Math.sin(meanAnomaly * RAD) + 0.02 * Math.sin(2 * meanAnomaly * RAD)) % 360;
  const obliquity = 23.439 - 0.00000036 * d;

  const rightAscension =
    Math.atan2(Math.cos(obliquity * RAD) * Math.sin(eclipticLongitude * RAD), Math.cos(eclipticLongitude * RAD)) /
    RAD;
  const declination = Math.asin(Math.sin(obliquity * RAD) * Math.sin(eclipticLongitude * RAD)) / RAD;

  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const gmstHours = (6.697375 + 0.0657098242 * d + utcHours) % 24;
  let localSiderealHours = (gmstHours + lon / 15) % 24;
  if (localSiderealHours < 0) localSiderealHours += 24;

  const hourAngleDeg = localSiderealHours * 15 - rightAscension;

  const elevation =
    Math.asin(
      Math.sin(declination * RAD) * Math.sin(lat * RAD) +
        Math.cos(declination * RAD) * Math.cos(lat * RAD) * Math.cos(hourAngleDeg * RAD)
    ) / RAD;

  return elevation;
}

/** Whether it's currently dark enough at this location to use the dark theme. */
export function isNightAt(lat: number, lon: number, date: Date = new Date()): boolean {
  return solarElevationDeg(lat, lon, date) <= 0;
}
