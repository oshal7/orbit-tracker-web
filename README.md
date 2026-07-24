# Orbit Watch — Orbit Tracker Web

Track real satellites overhead and see predicted upcoming passes, rendered as a 2D sky dome above your location.

**Live app**: https://oshal7.github.io/orbit-tracker-web/
**Repository**: https://github.com/oshal7/orbit-tracker-web

## What it does

1. Asks for your GPS location.
2. Fetches real Two-Line Element (TLE) orbital data for the full active-satellite catalog (~8,000 objects) from [Celestrak](https://celestrak.org/) in one request, cached locally for a couple of hours. Falls back to a small curated list via the `tle.ivanstanojevic.me` API if the bulk fetch fails.
3. Uses [`satellite.js`](https://github.com/shashwatak/satellite-js) to propagate every satellite's orbit and compute live azimuth/elevation/range/velocity relative to your location, updating every 5 seconds.
4. Predicting upcoming passes for the *entire* catalog on every tick isn't cheap, so it's tiered: a coarse, sparse-step scan across the whole catalog every 5 minutes ranks satellites by how high they'll climb soon; full precise AOS/LOS pass prediction (30-second-step scan) then runs only on whatever's currently overhead plus the top-ranked candidates from that ranking (capped), recomputed every minute.
5. Renders satellites currently overhead as live glowing dots, and upcoming passes as arcs from rise to set, on a sky dome (zenith at center, horizon at the rim, compass directions around the edge).
6. Automatically switches between a light and dark theme based on whether it's day or night at your location (using solar elevation, no manual toggle).
7. Tap a satellite in the list to see full detail: live position (if overhead), next pass timing, and orbital parameters (altitude, period, inclination, brightness). Tapping a dot/arc on the dome itself just highlights it with a name tooltip.

The app lives at `/app`; `/` is a landing page introducing it.

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
