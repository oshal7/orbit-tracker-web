# Orbit Watch — Orbit Tracker Web

Track real satellites overhead and see predicted upcoming passes, rendered as a 2D sky dome above your location.

**Live app**: https://oshal7.github.io/orbit-tracker-web/
**Repository**: https://github.com/oshal7/orbit-tracker-web

## What it does

1. Asks for your GPS location.
2. Fetches real Two-Line Element (TLE) orbital data for a set of well-known satellites from [Celestrak](https://celestrak.org/) (via the `tle.ivanstanojevic.me` API).
3. Uses [`satellite.js`](https://github.com/shashwatak/satellite-js) to propagate each satellite's orbit and compute its live azimuth/elevation/range/velocity relative to your location, updating every few seconds.
4. Scans each orbit forward in time to predict upcoming passes — rise (AOS) and set (LOS) times, duration, max elevation, and direction — recomputed every minute.
5. Renders satellites currently overhead as live glowing dots, and upcoming passes as arcs from rise to set, on a sky dome (zenith at center, horizon at the rim, compass directions around the edge).
6. Automatically switches between a light and dark theme based on whether it's day or night at your location (using solar elevation, no manual toggle).
7. Tap a satellite to see full detail: live position (if overhead), next pass timing, and orbital parameters (altitude, period, inclination, brightness).

## Tech stack

- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [React](https://react.dev/)
- [satellite.js](https://github.com/shashwatak/satellite-js) (orbital propagation & pass prediction)

## Running locally

Requires Node.js & npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
# Clone the repository
git clone https://github.com/oshal7/orbit-tracker-web.git
cd orbit-tracker-web

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Other scripts:

```sh
npm run build    # production build
npm run preview  # preview the production build locally
npm run lint      # lint the codebase
```

## Deployment

Pushes to `main` are automatically built and deployed to GitHub Pages via the workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
