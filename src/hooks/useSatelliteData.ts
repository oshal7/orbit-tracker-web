import { useState, useEffect } from 'react';

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

// Real satellite data fetcher using N2YO API
const fetchRealSatelliteData = async (location: Location, apiKey?: string): Promise<SatelliteData[]> => {
  const API_KEY = apiKey || localStorage.getItem('n2yo_api_key') || '';
  
  // If no API key or using fallback/demo mode, use demo data
  if (!API_KEY || API_KEY === 'FALLBACK_MODE' || API_KEY === 'DEMO_MODE' || localStorage.getItem('use_fallback_data')) {
    return generateFallbackSatelliteData(location);
  }
  
  // Common satellite NORAD IDs for tracking
  const satelliteIds = [
    { id: '25544', name: 'ISS (ZARYA)' },
    { id: '48274', name: 'STARLINK-1832' },
    { id: '47926', name: 'STARLINK-1693' },
    { id: '48280', name: 'STARLINK-1838' },
    { id: '25400', name: 'COSMOS 2251 DEB' },
    { id: '28654', name: 'SPOT 5' },
    { id: '37849', name: 'TIANHE' },
    { id: '44713', name: 'STARLINK-1130' },
  ];

  try {
    const promises = satelliteIds.map(async (sat) => {
      // Fetch satellite position
      const positionResponse = await fetch(
        `https://api.n2yo.com/rest/v1/satellite/positions/${sat.id}/${location.lat}/${location.lng}/0/1/&apiKey=${API_KEY}`
      );
      
      if (!positionResponse.ok) {
        throw new Error(`Failed to fetch position for ${sat.name}`);
      }
      
      const positionData = await positionResponse.json();
      
      // Fetch next passes
      const passesResponse = await fetch(
        `https://api.n2yo.com/rest/v1/satellite/visualpasses/${sat.id}/${location.lat}/${location.lng}/0/3/300/&apiKey=${API_KEY}`
      );
      
      const passesData = passesResponse.ok ? await passesResponse.json() : null;
      
      const position = positionData.positions?.[0];
      if (!position) {
        return null;
      }
      
      const elevation = position.elevation || 0;
      const isVisible = elevation > 0;
      
      // Get next pass info
      let nextPass = undefined;
      if (passesData?.passes?.length > 0) {
        const pass = passesData.passes[0];
        nextPass = {
          start: new Date(pass.startUTC * 1000).toISOString(),
          duration: pass.duration,
          maxElevation: pass.maxElevation,
        };
      }
      
      const satelliteData: SatelliteData = {
        id: sat.id,
        name: sat.name,
        azimuth: position.azimuth || 0,
        elevation: elevation,
        magnitude: positionData.info?.satmag || 4.0,
        range: position.distance || 0,
        velocity: 7.5, // Average satellite velocity
        isVisible: isVisible,
        nextPass: !isVisible ? nextPass : undefined,
      };
      return satelliteData;
    });

    const results = await Promise.all(promises);
    return results.filter(sat => sat !== null) as SatelliteData[];
    
  } catch (error) {
    console.error('Failed to fetch real satellite data:', error);
    // Fallback to mock data if API fails
    return generateFallbackSatelliteData(location);
  }
};

// Fallback satellite data when API is unavailable
const generateFallbackSatelliteData = (location: Location): SatelliteData[] => {
  const currentTime = new Date();
  const satellites = [
    { id: '25544', name: 'ISS (ZARYA)', magnitude: -2.5 },
    { id: '48274', name: 'STARLINK-1832', magnitude: 4.2 },
    { id: '47926', name: 'STARLINK-1693', magnitude: 3.8 },
    { id: '48280', name: 'STARLINK-1838', magnitude: 5.1 },
    { id: '25400', name: 'COSMOS 2251 DEB', magnitude: 4.5 },
    { id: '28654', name: 'SPOT 5', magnitude: 4.8 },
    { id: '37849', name: 'TIANHE', magnitude: 3.2 },
    { id: '44713', name: 'STARLINK-1130', magnitude: 4.1 },
  ];

  return satellites.map((sat, index) => {
    // Generate realistic orbital positions
    const timeOffset = (currentTime.getTime() / 1000 + index * 1000) / 5000;
    const baseAzimuth = (timeOffset * 50 + index * 45) % 360;
    const baseElevation = Math.sin(timeOffset + index) * 90; // Full range -90 to 90
    
    // Show satellites regardless of time of day
    const isCurrentlyVisible = baseElevation > 0 && Math.random() > 0.4;

    // Generate next pass time (1-6 hours from now)
    const nextPassTime = new Date(currentTime.getTime() + (1 + Math.random() * 5) * 60 * 60 * 1000);
    
    return {
      id: sat.id,
      name: sat.name,
      azimuth: baseAzimuth,
      elevation: baseElevation,
      magnitude: sat.magnitude + (Math.random() - 0.5),
      range: 400 + Math.random() * 1200, // km
      velocity: 7.5 + Math.random() * 0.5, // km/s
      isVisible: isCurrentlyVisible,
      nextPass: !isCurrentlyVisible ? {
        start: nextPassTime.toISOString(),
        duration: Math.floor(2 + Math.random() * 8), // 2-10 minutes
        maxElevation: Math.floor(20 + Math.random() * 70), // degrees
      } : undefined,
    };
  });
};

export const useSatelliteData = (location: Location | null, apiKey?: string) => {
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;

    const fetchSatelliteData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try to fetch real satellite data first
        const realData = await fetchRealSatelliteData(location, apiKey);
        setSatellites(realData);
      } catch (err) {
        setError('Failed to fetch satellite data');
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