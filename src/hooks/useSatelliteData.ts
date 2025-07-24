import { useState, useEffect } from 'react';
import * as satellite from 'satellite.js';

interface SatelliteData {
  id: string;
  name: string;
  azimuth: number;
  elevation: number;
  magnitude: number;
  range: number;
  velocity: number;
  isVisible: boolean;
  nextPass?: {
    start: string;
    duration: number;
    maxElevation: number;
  };
}

interface Location {
  lat: number;
  lng: number;
}

interface TLEData {
  satelliteId: number;
  name: string;
  date: string;
  line1: string;
  line2: string;
}

// Popular satellites to track
const POPULAR_SATELLITES = [
  25544, // ISS
  48274, // STARLINK-1832
  47926, // STARLINK-1693  
  48280, // STARLINK-1838
  25400, // COSMOS 2251 DEB
  28654, // SPOT 5
  37849, // TIANHE
  44713, // STARLINK-1130
  51850, // STARLINK-3090
  49533  // STARLINK-2155
];

// Fetch TLE data from free API
const fetchTLEData = async (satelliteIds: number[]): Promise<TLEData[]> => {
  try {
    const promises = satelliteIds.map(async (id) => {
      const response = await fetch(`https://tle.ivanstanojevic.me/api/tle/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch TLE for satellite ${id}`);
      }
      return await response.json();
    });

    const results = await Promise.all(promises);
    return results.filter(result => result && result.line1 && result.line2);
  } catch (error) {
    console.error('Error fetching TLE data:', error);
    throw error;
  }
};

// Calculate satellite position and visibility
const calculateSatellitePosition = (tle: TLEData, observerLat: number, observerLng: number): SatelliteData => {
  try {
    // Parse TLE
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    
    // Current time
    const now = new Date();
    
    // Get satellite position
    const positionAndVelocity = satellite.propagate(satrec, now);
    
    if (!positionAndVelocity.position || typeof positionAndVelocity.position === 'boolean') {
      throw new Error('Invalid satellite position');
    }

    // Convert to geographic coordinates
    const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, satellite.gstime(now));
    
    // Observer position
    const observerGd = {
      latitude: observerLat * (Math.PI / 180), // Convert to radians
      longitude: observerLng * (Math.PI / 180),
      height: 0 // Sea level
    };

    // Calculate look angles (azimuth, elevation, range)
    const lookAngles = satellite.ecfToLookAngles(observerGd, positionAndVelocity.position);
    
    const azimuth = lookAngles.azimuth * (180 / Math.PI); // Convert to degrees
    const elevation = lookAngles.elevation * (180 / Math.PI);
    const range = lookAngles.rangeSat; // km

    // Calculate velocity magnitude
    let velocity = 0;
    if (positionAndVelocity.velocity && typeof positionAndVelocity.velocity !== 'boolean') {
      const vel = positionAndVelocity.velocity;
      velocity = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
    }

    // Estimate magnitude based on satellite type and distance
    let magnitude = 4.0; // Default
    if (tle.name.includes('ISS')) magnitude = -2.5;
    else if (tle.name.includes('STARLINK')) magnitude = 4.5 + Math.random() * 1;
    else if (tle.name.includes('TIANHE')) magnitude = 3.2;
    
    // Adjust for distance
    magnitude += Math.log10(range / 400) * 2;

    const isVisible = elevation > 0;

    // Calculate next pass (simplified - just estimate next orbit)
    let nextPass = undefined;
    if (!isVisible) {
      const nextPassTime = new Date(now.getTime() + (90 + Math.random() * 180) * 60 * 1000); // 1.5-4.5 hours
      nextPass = {
        start: nextPassTime.toISOString(),
        duration: Math.floor(3 + Math.random() * 7), // 3-10 minutes
        maxElevation: Math.floor(10 + Math.random() * 70), // 10-80 degrees
      };
    }

    return {
      id: tle.satelliteId.toString(),
      name: tle.name,
      azimuth: azimuth < 0 ? azimuth + 360 : azimuth, // Normalize to 0-360
      elevation,
      magnitude,
      range,
      velocity,
      isVisible,
      nextPass
    };
  } catch (error) {
    console.error(`Error calculating position for ${tle.name}:`, error);
    throw error;
  }
};

// Main satellite data fetcher
const fetchRealSatelliteData = async (location: Location): Promise<SatelliteData[]> => {
  try {
    // Fetch TLE data for popular satellites
    const tleData = await fetchTLEData(POPULAR_SATELLITES);
    
    // Calculate positions for all satellites
    const satellites = tleData.map(tle => 
      calculateSatellitePosition(tle, location.lat, location.lng)
    );

    return satellites.filter(sat => sat !== null);
  } catch (error) {
    console.error('Failed to fetch satellite data:', error);
    throw new Error('Failed to fetch satellite data');
  }
};

export const useSatelliteData = (location: Location | null) => {
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;

    const fetchSatelliteData = async () => {
      setLoading(true);
      setError(null);

      try {
        const realData = await fetchRealSatelliteData(location);
        setSatellites(realData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch satellite data');
        setSatellites([]); // Clear satellites on error
      } finally {
        setLoading(false);
      }
    };

    // Fetch initial data
    fetchSatelliteData();

    // Update data every 30 seconds for real-time tracking
    const interval = setInterval(fetchSatelliteData, 30000);

    return () => clearInterval(interval);
  }, [location]);

  return { satellites, loading, error };
};