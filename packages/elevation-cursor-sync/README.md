# @la-rampa/elevation-cursor-sync

Distance-based cursor synchronisation composable for Vue 3 track visualisation.

One `CursorSync` instance is shared between all components (map, elevation chart, table). Any component can set the cursor by distance; all others react via the same reactive state.

## Installation

```bash
npm install @la-rampa/elevation-cursor-sync
```

**Peer dependencies:** `vue ^3.5`

## Core concepts

- **Distance-based sync** — the cursor is a distance value in metres, not an array index. This decouples components that may display the track at different resolutions.
- **Single source of truth** — create one `CursorSync` per track view in the parent component; pass it as a prop to all children.
- **Resampling is caller's responsibility** — pass equidistant, sorted `TrackPoint[]` arrays to get consistent index resolution.

## API

### `TrackPoint`

```ts
interface TrackPoint {
  distance: number // cumulative metres from track start (monotonically increasing)
  elevation: number // metres above sea level
  lon: number // WGS-84 longitude
  lat: number // WGS-84 latitude
}
```

### `CursorSync`

```ts
interface CursorSync {
  distance: Readonly<Ref<number | null>> // current cursor distance
  nearestIndex: Readonly<ComputedRef<number | null>> // index into the points array
  setByDistance(d: number): void
  clear(): void
}
```

### `useCursorSync(points)`

Creates a `CursorSync` instance.

```ts
import { useCursorSync } from '@la-rampa/elevation-cursor-sync'

// In App.vue setup:
const cursor = useCursorSync(trackPoints) // trackPoints: ComputedRef<TrackPoint[]>
// Pass to children:
// <ElevationChart :cursor="cursor" ... />
// <MapView        :cursor="cursor" ... />
```

### `cursorToInterval(cursor, intervals)`

Maps the cursor index to a 1-based climb/interval ID, or `null` when outside all intervals.

```ts
import { cursorToInterval } from '@la-rampa/elevation-cursor-sync'

// slopeIntervals: Ref<[startIdx, endIdx][]>
const activeInterval = cursorToInterval(cursor, slopeIntervals)
// activeInterval.value === 2 → cursor is inside the second climb
```

## Full example

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useCursorSync, cursorToInterval } from '@la-rampa/elevation-cursor-sync'
import type { TrackPoint } from '@la-rampa/elevation-cursor-sync'

const trackPoints = computed<TrackPoint[]>(() =>
  mySegment.map((p) => ({
    distance: p.distanceFromStart,
    elevation: p.elevation,
    lon: p.lon,
    lat: p.lat,
  })),
)

const cursor = useCursorSync(trackPoints)
const activeClimbId = cursorToInterval(cursor, climbIntervals)
</script>

<template>
  <ElevationChart :cursor="cursor" :points="trackPoints" />
  <MapView :cursor="cursor" :points="trackPoints" />
  <p>Active climb: {{ activeClimbId }}</p>
</template>
```
