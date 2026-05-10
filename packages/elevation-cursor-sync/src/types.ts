import type { Ref, ComputedRef } from 'vue'

/**
 * A single point on a resampled (equidistant) GPS track.
 *
 * All coordinates are in WGS-84 (EPSG:4326).
 * `distance` is the cumulative arc-length from the track start in metres.
 */
export interface TrackPoint {
  /** Cumulative distance from track start in metres. Must be monotonically increasing. */
  distance: number
  /** Elevation in metres above sea level. */
  elevation: number
  /** Longitude in WGS-84 (EPSG:4326). */
  lon: number
  /** Latitude in WGS-84 (EPSG:4326). */
  lat: number
}

/**
 * Shared cursor state passed between visualisation components (map, chart, table).
 *
 * One instance is created by `useCursorSync` and handed to every consumer as a prop.
 * Any component can call `setByDistance` or `clear`; all others react via `distance` / `nearestIndex`.
 *
 * @example
 * ```ts
 * const cursor = useCursorSync(trackPoints)
 * // in parent template:
 * // <ElevationChart :cursor="cursor" ... />
 * // <MapView        :cursor="cursor" ... />
 * ```
 */
export interface CursorSync {
  /** Current cursor position in metres along the track. Readonly — mutate via setByDistance/clear. */
  distance: Readonly<Ref<number | null>>
  /** Index of the nearest point in the points array for the current distance. Derived reactively. */
  nearestIndex: Readonly<ComputedRef<number | null>>
  /** Set cursor to the given cumulative distance in metres. */
  setByDistance(d: number): void
  /** Clear the cursor (sets distance to null). */
  clear(): void
}
