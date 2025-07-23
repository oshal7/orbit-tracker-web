import React, { useState } from 'react';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LocationRequestProps {
  onLocationReceived: (location: { lat: number; lng: number }) => void;
}

const LocationRequest: React.FC<LocationRequestProps> = ({ onLocationReceived }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = () => {
    setIsRequesting(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setIsRequesting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationReceived({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsRequesting(false);
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setError(errorMessage);
        setIsRequesting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-cosmic">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-stellar/20 rounded-full flex items-center justify-center mb-4">
            <Navigation className="w-8 h-8 text-stellar" />
          </div>
          <CardTitle className="text-2xl">SkyTracker</CardTitle>
          <p className="text-muted-foreground">
            Track visible satellites passing overhead
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <MapPin className="w-8 h-8 mx-auto text-nebula" />
            <h3 className="text-lg font-semibold">Location Required</h3>
            <p className="text-sm text-muted-foreground">
              We need your location to calculate which satellites are visible from your position.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={requestLocation}
            disabled={isRequesting}
            className="w-full bg-stellar hover:bg-stellar/90 text-primary-foreground shadow-stellar"
          >
            {isRequesting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Getting Location...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Enable Location
              </>
            )}
          </Button>

          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>• Your location is used only for satellite calculations</p>
            <p>• No data is stored or transmitted to external servers</p>
            <p>• Works best with clear night skies</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationRequest;