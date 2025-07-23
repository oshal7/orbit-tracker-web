import React, { useState, useEffect } from 'react';
import { Settings, Key, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Check for stored API key
    const storedKey = localStorage.getItem('n2yo_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setIsValid(true);
      onApiKeySet(storedKey);
    }
  }, [onApiKeySet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('n2yo_api_key', apiKey.trim());
      setIsValid(true);
      onApiKeySet(apiKey.trim());
    }
  };

  const handleSkip = () => {
    // Use fallback data
    localStorage.setItem('use_fallback_data', 'true');
    onApiKeySet('FALLBACK_MODE');
  };

  if (isValid) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Key className="w-4 h-4 text-stellar" />
        <span>API Key configured</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            localStorage.removeItem('n2yo_api_key');
            localStorage.removeItem('use_fallback_data');
            setIsValid(false);
            setApiKey('');
          }}
        >
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-stellar/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Key className="w-6 h-6 text-stellar" />
          </div>
          <CardTitle>Real Satellite Data</CardTitle>
          <CardDescription>
            To access real-time satellite tracking data, you'll need an API key from N2YO.com
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-muted/30 rounded-lg p-3 text-sm">
            <p className="font-medium mb-2 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Get your free API key:
            </p>
            <ol className="text-muted-foreground space-y-1 text-xs">
              <li>1. Visit <a href="https://www.n2yo.com/api/" target="_blank" rel="noopener noreferrer" className="text-stellar hover:underline">N2YO.com/api</a></li>
              <li>2. Sign up for a free account</li>
              <li>3. Get your API key from the dashboard</li>
              <li>4. Enter it below</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="apiKey">N2YO API Key</Label>
              <Input
                id="apiKey"
                type="text"
                placeholder="Enter your N2YO API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={!apiKey.trim()}>
              <Key className="w-4 h-4 mr-2" />
              Use Real Data
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={handleSkip}
            className="w-full"
          >
            <Settings className="w-4 h-4 mr-2" />
            Use Demo Data
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            <Badge variant="outline" className="text-xs">
              Demo mode shows simulated satellite positions
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeyInput;