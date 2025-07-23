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

// Mock satellite data generator for demonstration
const generateMockSatelliteData = (location: Location, currentTime: Date): SatelliteData[] => {
  const isNightTime = () => {
    const hour = currentTime.getHours();
    return hour < 6 || hour > 20;
  };

  const satellites = [
    { id: '25544', name: 'ISS (ZARYA)', magnitude: -2.5 },
    { id: '40128', name: 'STARLINK-1007', magnitude: 4.2 },
    { id: '43013', name: 'STARLINK-1130', magnitude: 3.8 },
    { id: '25400', name: 'COSMOS 2251 DEB', magnitude: 5.1 },
    { id: '28654', name: 'SPOT 5', magnitude: 4.5 },
    { id: '39166', name: 'GAOFEN 7', magnitude: 4.8 },
    { id: '37849', name: 'TIANHE', magnitude: 3.2 },
    { id: '43596', name: 'STARLINK-1662', magnitude: 4.1 },
  ];

  return satellites.map((sat, index) => {
    // Generate realistic orbital positions
    const timeOffset = (currentTime.getTime() / 1000 + index * 1000) / 5000; // Orbital motion
    const baseAzimuth = (timeOffset * 50 + index * 45) % 360;
    const baseElevation = Math.sin(timeOffset + index) * 60 + 30;
    
    // Simulate visibility conditions
    const isCurrentlyVisible = isNightTime() && 
                              baseElevation > 10 && 
                              Math.random() > 0.6; // Only some satellites visible

    // Generate next pass time (1-6 hours from now)
    const nextPassTime = new Date(currentTime.getTime() + (1 + Math.random() * 5) * 60 * 60 * 1000);
    
    return {
      id: sat.id,
      name: sat.name,
      azimuth: baseAzimuth,
      elevation: isCurrentlyVisible ? Math.max(10, baseElevation) : -10,
      magnitude: sat.magnitude + (Math.random() - 0.5),
      range: 400 + Math.random() * 800, // km
      velocity: 7.5 + Math.random() * 0.5, // km/s
      isVisible: isCurrentlyVisible,
      nextPass: !isCurrentlyVisible ? {
        start: nextPassTime.toISOString(),
        duration: Math.floor(2 + Math.random() * 6), // 2-8 minutes
        maxElevation: Math.floor(20 + Math.random() * 70), // degrees
      } : undefined,
    };
  });
};

export const useSatelliteData = (location: Location | null) => {
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;

    const fetchSatelliteData = () => {
      setLoading(true);
      setError(null);

      try {
        // In a real app, this would fetch from APIs like:
        // - N2YO.com API for satellite tracking
        // - CelesTrak for TLE data
        // - Custom calculation engine for visibility
        
        const mockData = generateMockSatelliteData(location, new Date());
        setSatellites(mockData);
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