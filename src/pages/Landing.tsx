import { Link } from 'react-router-dom';
import { ArrowRight, Radar, Clock, Orbit, MoonStar } from 'lucide-react';
import SkyDome from '@/components/SkyDome';
import SatelliteIllustration from '@/components/SatelliteIllustration';
import type { SatelliteData } from '@/hooks/useSatelliteData';
import { usePrefersDark } from '@/hooks/usePrefersDark';

/** Static, illustrative data for the hero dome — not live tracking (the landing page has no location yet). */
function buildDemoSatellites(): SatelliteData[] {
  const now = Date.now();
  return [
    {
      id: '25544',
      name: 'ISS (ZARYA)',
      type: 'Space Station',
      color: '#FF7A3D',
      description: '',
      azimuth: 118,
      elevation: 52,
      range: 420,
      velocity: 7.66,
      magnitude: -2.4,
      isVisible: true,
      altitudeKm: 419,
      periodMin: 93,
      inclinationDeg: 51.6,
      nextPass: {
        aosTime: new Date(now - 3 * 60_000),
        losTime: new Date(now + 4 * 60_000),
        maxElTime: new Date(now),
        maxEl: 62,
        aosAz: 205,
        losAz: 30,
        peakAz: 118,
        durationSec: 420,
      },
    },
    {
      id: '48280',
      name: 'STARLINK-2565',
      type: 'Communications',
      color: '#5B9EFF',
      description: '',
      azimuth: 0,
      elevation: -12,
      range: 0,
      velocity: 0,
      magnitude: 4.5,
      isVisible: false,
      altitudeKm: 550,
      periodMin: 95.5,
      inclinationDeg: 53.2,
      nextPass: {
        aosTime: new Date(now + 14 * 60_000),
        losTime: new Date(now + 20 * 60_000),
        maxElTime: new Date(now + 17 * 60_000),
        maxEl: 38,
        aosAz: 260,
        losAz: 95,
        peakAz: 178,
        durationSec: 360,
      },
    },
    {
      id: '20580',
      name: 'HUBBLE SPACE TELESCOPE',
      type: 'Observatory',
      color: '#3DD6A8',
      description: '',
      azimuth: 0,
      elevation: -20,
      range: 0,
      velocity: 0,
      magnitude: 2.5,
      isVisible: false,
      altitudeKm: 537,
      periodMin: 95.4,
      inclinationDeg: 28.5,
      nextPass: {
        aosTime: new Date(now + 48 * 60_000),
        losTime: new Date(now + 55 * 60_000),
        maxElTime: new Date(now + 51 * 60_000),
        maxEl: 71,
        aosAz: 340,
        losAz: 150,
        peakAz: 45,
        durationSec: 420,
      },
    },
  ];
}

const DEMO_SATS = buildDemoSatellites();

const FEATURES = [
  {
    icon: Radar,
    title: 'Real-time overhead tracking',
    body: "See exactly which satellites are above you right now — live azimuth, elevation, range, and speed.",
  },
  {
    icon: Clock,
    title: 'Predicted upcoming passes',
    body: 'Know when the next satellite rises, how high it climbs, and which way it crosses the sky.',
  },
  {
    icon: Orbit,
    title: 'Real orbital mechanics',
    body: 'Live TLE data and SGP4 propagation — not a guess. Altitude, period, and inclination for every pass.',
  },
  {
    icon: MoonStar,
    title: 'Automatic day / night theme',
    body: "The interface matches the actual sky at your location, computed from the sun's position.",
  },
];

export default function Landing() {
  const isDark = usePrefersDark();

  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="landing-wordmark">ORBIT WATCH</span>
        <Link to="/app" className="landing-nav-cta">
          Launch <ArrowRight size={13} />
        </Link>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">REAL-TIME SATELLITE TRACKER</p>
          <h1>Know what&rsquo;s flying over your head, right now.</h1>
          <p className="landing-sub">
            Orbit Watch shows you the satellites currently overhead and predicts exactly when the next ones will
            rise — using real orbital data, computed live for your location.
          </p>
          <div className="landing-cta-row">
            <Link to="/app" className="landing-cta-primary">
              Check it out <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div className="landing-hero-visual">
          <div className="landing-floating-icon a">
            <SatelliteIllustration type="Communications" color="#5B9EFF" isDark={isDark} />
          </div>
          <div className="landing-floating-icon b">
            <SatelliteIllustration type="Observatory" color="#3DD6A8" isDark={isDark} />
          </div>
          <SkyDome isDark={isDark} satellites={DEMO_SATS} selectedId="25544" onSelect={() => {}} />
        </div>
      </section>

      <section className="landing-features">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div className="landing-feature-card" key={title}>
            <div className="landing-feature-icon">
              <Icon size={22} strokeWidth={1.6} />
            </div>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </section>

      <section className="landing-cta-band">
        <h2>See it for yourself.</h2>
        <Link to="/app" className="landing-cta-primary">
          Check it out <ArrowRight size={15} />
        </Link>
      </section>

      <footer className="landing-footer">
        <p className="landing-footer-title">DATA &amp; ATTRIBUTION</p>
        <ul className="landing-footer-list">
          <li>
            Orbital data (TLE):{' '}
            <a href="https://celestrak.org/" target="_blank" rel="noreferrer">
              Celestrak
            </a>
            , via the tle.ivanstanojevic.me API
          </li>
          <li>
            Orbit propagation:{' '}
            <a href="https://github.com/shashwatak/satellite-js" target="_blank" rel="noreferrer">
              satellite.js
            </a>{' '}
            (SGP4/SDP4)
          </li>
          <li>
            Location lookup:{' '}
            <a href="https://nominatim.org/" target="_blank" rel="noreferrer">
              OpenStreetMap Nominatim
            </a>
            , © OpenStreetMap contributors
          </li>
          <li>
            Typefaces:{' '}
            <a href="https://fonts.google.com/specimen/DM+Sans" target="_blank" rel="noreferrer">
              DM Sans
            </a>{' '}
            &amp;{' '}
            <a href="https://fonts.google.com/specimen/Space+Mono" target="_blank" rel="noreferrer">
              Space Mono
            </a>
            , via Google Fonts
          </li>
        </ul>
        <p className="landing-footer-small">
          Orbit Watch is an independent, open-source project — not affiliated with NASA, ESA, SpaceX, or any
          satellite operator.
        </p>
      </footer>
    </div>
  );
}
