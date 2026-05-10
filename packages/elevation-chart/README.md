# @la-rampa/elevation-chart

Interactive Vue 3 elevation profile chart with zoom, pan, two-finger pinch, and CursorSync integration.

Built on [Chart.js 4](https://www.chartjs.org/) with a fully custom interaction layer. Displays a distance/elevation line and an optional coloured overlay (e.g. detected climbs). Hover position is shared with other components via `@la-rampa/elevation-cursor-sync`.

## Installation

```bash
npm install @la-rampa/elevation-chart @la-rampa/elevation-cursor-sync
```

**Peer dependencies:** `vue ^3.5`, `chart.js ^4.5`

## Usage

### `ElevationChart` component

```vue
<script setup lang="ts">
import { ElevationChart } from '@la-rampa/elevation-chart'
import { useCursorSync } from '@la-rampa/elevation-cursor-sync'
import type { TrackPoint } from '@la-rampa/elevation-cursor-sync'

const trackPoints: TrackPoint[] = /* ... equidistant, sorted by distance */
const cursor = useCursorSync(trackPoints)
</script>

<template>
  <ElevationChart :points="trackPoints" :overlay-intervals="climbIntervals" :cursor="cursor" />
</template>
```

### Props

| Prop               | Type                   | Description                                                                |
| ------------------ | ---------------------- | -------------------------------------------------------------------------- |
| `points`           | `TrackPoint[] \| null` | Track points sorted by distance. Drives the elevation dataset.             |
| `overlayIntervals` | `number[][]`           | Index-based `[start, end]` pairs to highlight in the overlay colour (red). |
| `cursor`           | `CursorSync`           | Shared cursor — receives hover distance, moves the vertical line.          |

### Interactions

| Gesture             | Effect                         |
| ------------------- | ------------------------------ |
| Mouse hover         | Moves cursor and vertical line |
| Scroll wheel        | Zoom in/out around pointer     |
| Click + drag        | Pan left/right                 |
| Two-finger pinch    | Zoom in/out (mobile)           |
| Single-finger touch | Move cursor                    |

## Exported utilities

All internal helpers are also exported for consumers that want to build custom chart components:

```ts
import {
  ZoomPanState, // zoom/pan state machine
  stretchInterval, // interval stretch math
  createVerticalLinePlugin, // Chart.js plugin for the cursor line
  TransformPixelScale2ChartScale, // pixel→chart coordinate transformer
  wheelEventHandler, // wheel zoom handler factory
  panEventHandler, // drag pan handler factory
  touchEventHandler, // touch pinch handler factory
  calcXPosition, // clientX → chart x-axis value
} from '@la-rampa/elevation-chart'
```

### `stretchInterval(i_start, i_end, mid, factor, I_min?, I_max?, minLength?)`

Stretches or shrinks `[i_start, i_end]` around `mid` by `factor`. Result is clamped to `[I_min, I_max]` and will not shrink below `minLength`.

```ts
import { stretchInterval } from '@la-rampa/elevation-chart'

const { start, end } = stretchInterval(0, 100, 50, 0.5)
// → { start: 25, end: 75 }  (zoom-in by 2×, centred at 50)
```

### `ZoomPanState`

```ts
import { ZoomPanState } from '@la-rampa/elevation-chart'

const zs = new ZoomPanState(0.001, { start: 0, end: points.length - 1 })
zs.zoomTransformation(event.deltaY, xPosition)
const { start, end } = zs.getTransformedInterval()
// → set chart x-axis min/max
```
