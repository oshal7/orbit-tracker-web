import React, { useEffect, useState, useRef } from 'react';
import { Satellite, Clock, Navigation, Star } from 'lucide-react';

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

interface SkyMapProps {
  satellites: SatelliteData[];
  userLocation: { lat: number; lng: number } | null;
}

const SkyMap: React.FC<SkyMapProps> = ({ satellites, userLocation }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const size = Math.min(canvas.offsetWidth, canvas.offsetHeight);
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw sky circle
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;

    // Create gradient for sky
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'hsl(220, 27%, 15%)');
    gradient.addColorStop(0.7, 'hsl(220, 27%, 10%)');
    gradient.addColorStop(1, 'hsl(220, 27%, 6%)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Draw horizon circle
    ctx.strokeStyle = 'hsl(217, 91%, 60%)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw compass directions
    ctx.fillStyle = 'hsl(210, 40%, 98%)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // N, S, E, W labels
    const directions = [
      { label: 'N', angle: -Math.PI / 2 },
      { label: 'E', angle: 0 },
      { label: 'S', angle: Math.PI / 2 },
      { label: 'W', angle: Math.PI },
    ];

    directions.forEach(({ label, angle }) => {
      const x = centerX + (radius + 15) * Math.cos(angle);
      const y = centerY + (radius + 15) * Math.sin(angle);
      ctx.fillText(label, x, y);
    });

    // Draw elevation circles (30°, 60°)
    ctx.strokeStyle = 'hsl(217, 91%, 60%, 0.3)';
    ctx.lineWidth = 1;
    [30, 60].forEach(elevation => {
      const elevationRadius = radius * (1 - elevation / 90);
      ctx.beginPath();
      ctx.arc(centerX, centerY, elevationRadius, 0, 2 * Math.PI);
      ctx.stroke();
    });

    // Draw satellites
    satellites.forEach(satellite => {
      if (!satellite.isVisible || satellite.elevation < 0) return;

      // Convert elevation and azimuth to canvas coordinates
      const elevationRadius = radius * (1 - satellite.elevation / 90);
      const azimuthRad = (satellite.azimuth - 90) * (Math.PI / 180); // Convert to radians, adjust for north

      const x = centerX + elevationRadius * Math.cos(azimuthRad);
      const y = centerY + elevationRadius * Math.sin(azimuthRad);

      // Draw satellite with glow effect
      const satelliteRadius = Math.max(4, 8 - satellite.magnitude);
      
      // Glow effect
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, satelliteRadius * 3);
      glowGradient.addColorStop(0, 'hsl(217, 91%, 60%, 0.8)');
      glowGradient.addColorStop(0.5, 'hsl(217, 91%, 60%, 0.3)');
      glowGradient.addColorStop(1, 'hsl(217, 91%, 60%, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(x, y, satelliteRadius * 3, 0, 2 * Math.PI);
      ctx.fill();

      // Satellite dot
      ctx.fillStyle = satellite.magnitude < 3 ? 'hsl(217, 91%, 60%)' : 'hsl(280, 80%, 50%)';
      ctx.beginPath();
      ctx.arc(x, y, satelliteRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Satellite name
      ctx.fillStyle = 'hsl(210, 40%, 98%)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(satellite.name.substring(0, 10), x, y - satelliteRadius - 8);
    });

    // Draw zenith indicator
    ctx.fillStyle = 'hsl(210, 40%, 98%)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ZENITH', centerX, centerY + 15);

  }, [satellites]);

  const visibleSatellites = satellites.filter(sat => sat.isVisible && sat.elevation > 0);

  return (
    <div className="bg-card rounded-xl border shadow-cosmic p-6">
      <div className="flex items-center gap-2 mb-4">
        <Navigation className="w-5 h-5 text-stellar" />
        <h2 className="text-xl font-semibold">Sky Map</h2>
        <div className="ml-auto text-sm text-muted-foreground">
          {currentTime.toLocaleTimeString()}
        </div>
      </div>
      
      <div className="relative">
        <canvas 
          ref={canvasRef}
          className="w-full h-80 md:h-96 max-w-md mx-auto block"
          style={{ aspectRatio: '1/1' }}
        />
        
        {visibleSatellites.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No visible satellites at this time</p>
              <p className="text-sm">Check back after sunset</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-muted-foreground text-center">
        <p>• Elevation circles: 30°, 60° • Zenith at center •</p>
        <p>Bright satellites: <span className="text-stellar">●</span> Dim satellites: <span className="text-nebula">●</span></p>
      </div>
    </div>
  );
};

export default SkyMap;