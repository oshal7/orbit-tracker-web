# SkyTracker — Orbit Tracker Web

Track real satellites passing overhead, rendered as a live 3D sky dome above your location.

**Live app**: https://oshal7.github.io/orbit-tracker-web/
**Repository**: https://github.com/oshal7/orbit-tracker-web

## What it does

1. Asks for your GPS location and which direction you're facing (via device compass, or a manual picker on desktop / unsupported devices).
2. Fetches real Two-Line Element (TLE) orbital data for satellites from [Celestrak](https://celestrak.org/).
3. Uses [`satellite.js`](https://github.com/shashwatak/satellite-js) to propagate each satellite's orbit and compute its azimuth/elevation relative to your location, in real time.
4. Renders the satellites currently visible above your horizon as glowing markers with motion trails on an interactive 3D sky dome (zenith at center, horizon at the rim, compass directions around the edge) — built with [Three.js](https://threejs.org/) via [react-three-fiber](https://github.com/pmndrs/react-three-fiber).
5. Tap a satellite to see its name, elevation, azimuth, range, velocity, and brightness.

## Tech stack

- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [React](https://react.dev/)
- [react-three-fiber](https://github.com/pmndrs/react-three-fiber) / [drei](https://github.com/pmndrs/drei) (Three.js)
- [satellite.js](https://github.com/shashwatak/satellite-js) (orbital propagation)
- [shadcn-ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

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
