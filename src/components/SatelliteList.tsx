import React from 'react';
import { Satellite, Clock, Eye, Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface SatelliteListProps {
  satellites: SatelliteData[];
}

const SatelliteList: React.FC<SatelliteListProps> = ({ satellites }) => {
  const visibleSatellites = satellites.filter(sat => sat.isVisible && sat.elevation > 0);
  const upcomingSatellites = satellites.filter(sat => !sat.isVisible && sat.nextPass);

  const formatDirection = (azimuth: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(azimuth / 22.5) % 16;
    return directions[index];
  };

  const getBrightnessLabel = (magnitude: number): string => {
    if (magnitude < 0) return 'Very Bright';
    if (magnitude < 2) return 'Bright';
    if (magnitude < 4) return 'Moderate';
    return 'Dim';
  };

  const getBrightnessColor = (magnitude: number): string => {
    if (magnitude < 0) return 'bg-stellar text-primary-foreground';
    if (magnitude < 2) return 'bg-primary text-primary-foreground';
    if (magnitude < 4) return 'bg-accent text-accent-foreground';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Currently Visible Satellites */}
      <Card className="shadow-cosmic">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-stellar" />
            Currently Visible ({visibleSatellites.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visibleSatellites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Satellite className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No satellites visible right now</p>
              <p className="text-sm">Wait for darker skies or check upcoming passes</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {visibleSatellites.map(satellite => (
                <div 
                  key={satellite.id}
                  className="flex items-start justify-between p-4 rounded-lg bg-muted/50 border hover:bg-muted transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{satellite.name}</h3>
                      <Badge className={getBrightnessColor(satellite.magnitude)}>
                        {getBrightnessLabel(satellite.magnitude)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>Direction:</span>
                        <span className="text-foreground font-medium">
                          {formatDirection(satellite.azimuth)} ({satellite.azimuth.toFixed(0)}°)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Elevation:</span>
                        <span className="text-foreground font-medium">{satellite.elevation.toFixed(0)}°</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Range:</span>
                        <span className="text-foreground font-medium">{satellite.range.toFixed(0)} km</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        <span className="text-foreground font-medium">{satellite.velocity.toFixed(1)} km/s</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    <div className="text-xs text-muted-foreground">Magnitude</div>
                    <div className="text-lg font-bold text-stellar">
                      {satellite.magnitude > 0 ? '+' : ''}{satellite.magnitude.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Passes */}
      <Card className="shadow-cosmic">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-nebula" />
            Upcoming Passes ({upcomingSatellites.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingSatellites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming passes calculated</p>
              <p className="text-sm">Refresh to load prediction data</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {upcomingSatellites.slice(0, 5).map(satellite => (
                <div 
                  key={satellite.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border-l-2 border-l-nebula"
                >
                  <div>
                    <h4 className="font-medium">{satellite.name}</h4>
                    {satellite.nextPass && (
                      <div className="text-sm text-muted-foreground">
                        Pass starts: {new Date(satellite.nextPass.start).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    {satellite.nextPass && (
                      <>
                        <div className="text-muted-foreground">Duration</div>
                        <div className="font-medium">{satellite.nextPass.duration}min</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SatelliteList;