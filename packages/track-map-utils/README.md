# @la-rampa/track-map-utils

OpenLayers utilities for GPS track visualisation: spatial indexing, GeoJSON conversion, layer factories, and zoom helpers.

These are framework-agnostic (no Vue dependency) building blocks for OpenLayers-based map components that display GPS tracks with interactive cursor sync.

## Installation

```bash
npm install @la-rampa/track-map-utils
```

**Peer dependencies:** `ol ^10.6`, `kdbush ^4.0.2`, `geokdbush ^2.0.1`

## API

### `TrackPointIndex`

Spatial index for fast nearest-track-point lookup (O(log n) via KDBush).

```ts
import { TrackPointIndex } from '@la-rampa/track-map-utils'

// Build index from WGS-84 points (once per track load)
const index = new TrackPointIndex(latLonPoints) // [{ lon, lat }]

// On pointer move:
const nearestIdx = index.getNearestIndex({ lon: 8.67, lat: 49.41 })
```

### `getMapElements()`

Factory that creates the three pre-configured OpenLayers vector layers needed for track display.

```ts
import { getMapElements } from '@la-rampa/track-map-utils'

const {
  baseTrackVectorSource,
  baseTrackVectorLayer, // blue, 4 px
  overlayVectorSource,
  overlayVectorLayer, // red, 3 px
  markerSource,
  markerLayer, // red circle
} = getMapElements()

const map = new Map({
  layers: [tileLayer, baseTrackVectorLayer, overlayVectorLayer, markerLayer],
  // ...
})
```

Default colours: base track `#37a3eb` (blue 4 px), overlay `#dc3912` (red 3 px), marker red circle radius 6.

### `MarkerOnTrack`

Manages a single position marker on the map.

```ts
import { MarkerOnTrack } from '@la-rampa/track-map-utils'

const marker = new MarkerOnTrack(markerSource)

// After track loads — supply EPSG:3857 coordinates:
marker.setCoordinates(geometry.getCoordinates())

// On cursor change:
marker.setByIndex(nearestIndex) // move marker
marker.clear() // hide marker
```

### `geojsonLineString2OpenLayersLineString(feature)`

Converts a GeoJSON LineString (EPSG:4326) to an OpenLayers Feature (EPSG:3857).

```ts
import { geojsonLineString2OpenLayersLineString } from '@la-rampa/track-map-utils'

const olFeature = geojsonLineString2OpenLayersLineString(geojsonLineString)
baseTrackVectorSource.addFeature(olFeature)
```

### `geojsonMultiLineString2OpenLayersMultiLineString(feature)`

Same as above but for MultiLineString features (e.g. multi-segment climb overlays).

### `zoomToTrack(map, source)`

Fits the map view to the extent of a track source with animation.

```ts
import { zoomToTrack } from '@la-rampa/track-map-utils'

zoomToTrack(map, baseTrackVectorSource)
```

## Building a custom MapView

The `track` prop is a GeoJSON `Feature<LineString>` (EPSG:4326) — e.g. loaded from a GPX file and
converted via `Track2GeoJson`. The `points` prop is a plain `{ lon, lat }[]` array of the same
coordinates, used to build the spatial index for pointer-move lookup.

```vue
<script setup lang="ts">
import Map from 'ol/Map'
import View from 'ol/View'
import { Tile as TileLayer } from 'ol/layer'
import { OSM } from 'ol/source'
import { fromLonLat, transform } from 'ol/proj'
import { onMounted } from 'vue'
import type { Feature } from 'geojson'
import {
  TrackPointIndex,
  MarkerOnTrack,
  getMapElements,
  geojsonLineString2OpenLayersLineString,
  zoomToTrack,
} from '@la-rampa/track-map-utils'

const props = defineProps<{
  track: Feature                          // GeoJSON LineString (EPSG:4326)
  points: { lon: number; lat: number }[]  // same coordinates for spatial lookup
}>()

const { baseTrackVectorSource, baseTrackVectorLayer, markerSource, markerLayer } = getMapElements()
const marker = new MarkerOnTrack(markerSource)
let tpIndex: TrackPointIndex | undefined

onMounted(() => {
  const map = new Map({
    layers: [new TileLayer({ source: new OSM() }), baseTrackVectorLayer, markerLayer],
    view: new View({ center: fromLonLat([0, 0]), zoom: 4 }),
  })

  const olFeature = geojsonLineString2OpenLayersLineString(props.track)
  baseTrackVectorSource.addFeature(olFeature)
  marker.setCoordinates(olFeature.getGeometry()!.getCoordinates())
  tpIndex = new TrackPointIndex(props.points)
  zoomToTrack(map, baseTrackVectorSource)

  map.on('pointermove', (evt) => {
    const [lon, lat] = transform(
      map.getCoordinateFromPixel(evt.pixel),
      'EPSG:3857',
      'EPSG:4326',
    ) as [number, number]
    const idx = tpIndex?.getNearestIndex({ lon, lat })
    idx == null ? marker.clear() : marker.setByIndex(idx)
  })
})
</script>
```

## Adding cursor sync with an elevation chart

To synchronise the map marker with an external elevation chart, add the
[`@la-rampa/elevation-cursor-sync`](https://github.com/bonham/elevation-cursor-sync) package.
`CursorSync` is a shared reactive state created by `useCursorSync()` in the parent and passed as a
prop to both the map and the chart component.

The `points` prop must then be a `TrackPoint[]` (which extends `{ lon, lat }` with `distance` and
`elevation`) so that `setByDistance` can map the pointer position back to a chart distance.

```vue
<script setup lang="ts">
import Map from 'ol/Map'
import View from 'ol/View'
import { Tile as TileLayer } from 'ol/layer'
import { OSM } from 'ol/source'
import { fromLonLat, transform } from 'ol/proj'
import { onMounted, watch } from 'vue'
import type { Feature } from 'geojson'
import {
  TrackPointIndex,
  MarkerOnTrack,
  getMapElements,
  geojsonLineString2OpenLayersLineString,
  zoomToTrack,
} from '@la-rampa/track-map-utils'
import type { CursorSync, TrackPoint } from '@la-rampa/elevation-cursor-sync'

const props = defineProps<{
  track: Feature
  points: TrackPoint[]   // carries .distance — required for cursor.setByDistance()
  cursor: CursorSync     // shared with the elevation chart via useCursorSync()
}>()

const { baseTrackVectorSource, baseTrackVectorLayer, markerSource, markerLayer } = getMapElements()
const marker = new MarkerOnTrack(markerSource)
let tpIndex: TrackPointIndex | undefined

onMounted(() => {
  const map = new Map({
    layers: [new TileLayer({ source: new OSM() }), baseTrackVectorLayer, markerLayer],
    view: new View({ center: fromLonLat([0, 0]), zoom: 4 }),
  })

  const olFeature = geojsonLineString2OpenLayersLineString(props.track)
  baseTrackVectorSource.addFeature(olFeature)
  marker.setCoordinates(olFeature.getGeometry()!.getCoordinates())
  tpIndex = new TrackPointIndex(props.points)
  zoomToTrack(map, baseTrackVectorSource)

  // pointer move → notify chart via shared cursor
  map.on('pointermove', (evt) => {
    const [lon, lat] = transform(
      map.getCoordinateFromPixel(evt.pixel),
      'EPSG:3857',
      'EPSG:4326',
    ) as [number, number]
    const idx = tpIndex?.getNearestIndex({ lon, lat })
    if (idx != null) props.cursor.setByDistance(props.points[idx]!.distance)
  })

  // chart cursor change → move map marker
  watch(
    () => props.cursor.nearestIndex.value,
    (idx) => {
      idx == null ? marker.clear() : marker.setByIndex(idx)
    },
  )
})
</script>
```
