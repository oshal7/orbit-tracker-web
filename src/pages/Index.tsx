import React, { useState } from 'react';
import { Satellite, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LocationRequest from '@/components/LocationRequest';
import SkyMap from '@/components/SkyMap';
import SatelliteList from '@/components/SatelliteList';
import { useSatelliteData } from '@/hooks/useSatelliteData';

const Index = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { satellites, loading, error } = useSatelliteData(userLocation);

  const handleLocationReceived = (location: { lat: number; lng: number }) => {
    setUserLocation(location);
  };

  if (!userLocation) {
    return <LocationRequest onLocationReceived={handleLocationReceived} />;
  }

  const visibleCount = satellites.filter(sat => sat.isVisible && sat.elevation > 0).length;
  const isNightTime = () => {
    const hour = new Date().getHours();
    return hour < 6 || hour > 20;
  };

  return (
    <div className="min-h-screen bg-cosmic">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stellar/20 rounded-full flex items-center justify-center">
                <Satellite className="w-6 h-6 text-stellar" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">SkyTracker</h1>
                <p className="text-sm text-muted-foreground">
                  {userLocation.lat.toFixed(4)}°, {userLocation.lng.toFixed(4)}°
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {!isNightTime() && (
                <Badge variant="outline" className="border-nebula text-nebula">
                  Daytime - Limited Visibility
                </Badge>
              )}
              
              <Badge 
                variant={visibleCount > 0 ? "default" : "secondary"}
                className={visibleCount > 0 ? "bg-stellar" : ""}
              >
                {visibleCount} Visible
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                className="border-stellar/50 hover:border-stellar"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            Error: {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sky Map */}
          <div className="lg:col-span-1">
            <SkyMap satellites={satellites} userLocation={userLocation} />
          </div>

          {/* Satellite List */}
          <div className="lg:col-span-1">
            <SatelliteList satellites={satellites} />
          </div>
        </div>

        {/* Quick Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card/50 rounded-lg p-4 text-center border">
            <div className="text-2xl font-bold text-stellar">{satellites.length}</div>
            <div className="text-sm text-muted-foreground">Tracked Satellites</div>
          </div>
          <div className="bg-card/50 rounded-lg p-4 text-center border">
            <div className="text-2xl font-bold text-nebula">{visibleCount}</div>
            <div className="text-sm text-muted-foreground">Currently Visible</div>
          </div>
          <div className="bg-card/50 rounded-lg p-4 text-center border">
            <div className="text-2xl font-bold text-accent">
              {satellites.filter(s => s.nextPass).length}
            </div>
            <div className="text-sm text-muted-foreground">Upcoming Passes</div>
          </div>
        </div>

        {/* Night Sky Tips */}
        {!isNightTime() && (
          <div className="mt-6 bg-muted/30 rounded-lg p-4 border-l-4 border-l-nebula">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Best Viewing Tips
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Wait for darker skies (after sunset, before sunrise)</li>
              <li>• Find an area with minimal light pollution</li>
              <li>• Look for moving "stars" - satellites appear as steady moving points</li>
              <li>• ISS and bright Starlink satellites are easiest to spot</li>
              <li>• Use the sky map to know where to look</li>
            </ul>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Real-time satellite tracking • Updated every 30 seconds</p>
          <p className="mt-1">Data from open astronomical sources</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
