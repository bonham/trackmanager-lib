# trackmanager-lib

Vue 3 / OpenLayers monorepo for GPS track visualisation. Provides an interactive elevation profile chart, a distance-based cursor synchronisation composable, and OpenLayers map utilities — designed to work together or independently.

## Packages

### [@bonham/elevation-chart](packages/elevation-chart/README.md)

Interactive Vue 3 elevation profile chart with zoom, pan, two-finger pinch, and cursor sync integration. Built on Chart.js 4 with a fully custom interaction layer; displays a distance/elevation line and an optional coloured overlay (e.g. detected climbs).

### [@bonham/elevation-cursor-sync](packages/elevation-cursor-sync/README.md)

Distance-based cursor synchronisation composable for Vue 3. A single `CursorSync` instance (created via `useCursorSync()`) is shared between the map, elevation chart, and any other components so that hovering in one updates all others reactively.

### [@bonham/track-map-utils](packages/track-map-utils/README.md)

Framework-agnostic OpenLayers utilities for GPS track display: spatial indexing for fast nearest-point lookup (`TrackPointIndex`), pre-configured vector layer factories (`getMapElements`), GeoJSON ↔ OpenLayers feature converters, a position marker helper (`MarkerOnTrack`), and a `zoomToTrack` fit helper.

## Releasing

All packages are versioned in lockstep. Releases go through a pull request — no local tooling or bypass actors required.

1. Go to **Actions → Release → Run workflow** (select `main`)
2. Choose the increment: `patch` / `minor` / `major`
3. Click **Run workflow** — this opens a PR titled `chore: release vX.Y.Z`
4. Review and merge the PR

Merging the PR triggers:
- **Tag release** — automatically creates and pushes tag `vX.Y.Z`
- **Publish** — builds and publishes all packages to GitHub Packages
- **Docs** — rebuilds and deploys the API docs to GitHub Pages

## Github pages

https://bonham.github.io/trackmanager-lib/

## TypeScript configuration

Two tsconfig files exist at the root:

- **`tsconfig.json`** — project references entry point for the monorepo. It has `"files": []` and delegates to each package and to `tsconfig.node.json` via `references`. VS Code and `tsc --build` use this as the workspace root.
- **`tsconfig.node.json`** — covers root-level Node/tooling config files (`eslint.config.ts`, `vitest.config.ts`) that are not part of any package. Without it, the TypeScript language server cannot resolve module types for ESLint and Vitest plugins in those files.
