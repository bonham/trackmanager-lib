import KDBush from 'kdbush';
import { around } from 'geokdbush';

/** Maximum search radius in km; Infinity means no limit. */
const MAXDISTANCE = Infinity
const DEBUG = false

/** A geographic point in WGS-84 (EPSG:4326). */
interface Point {
  lon: number;
  lat: number;
}

/**
 * Spatial index over a fixed array of WGS-84 coordinates.
 *
 * Wraps [KDBush](https://github.com/mourner/kdbush) with a
 * [geokdbush](https://github.com/mourner/geokdbush) nearest-neighbour query,
 * giving O(log n) look-up instead of a linear scan.
 *
 * The index is immutable after construction — create a new instance if the
 * point array changes.
 *
 * @example
 * ```ts
 * const index = new TrackPointIndex(trackPoints)
 * const nearestIdx = index.getNearestIndex({ lon: 8.67, lat: 49.41 })
 * ```
 */
export class TrackPointIndex {
  index: KDBush;
  coordinates: Point[];
  debug: boolean = DEBUG

  /**
   * Build the spatial index.
   * @param points  Array of WGS-84 coordinates to index (order is preserved — indices match).
   */
  constructor(points: Point[]) {
    this.coordinates = points
    this.index = new KDBush(points.length)

    points.forEach(tp => {
      const addIdx = this.index.add(tp.lon, tp.lat);
      if (this.debug) console.log("Add ", addIdx, tp.lon, tp.lat)
    })
    if (this.debug) console.log("Points in index: ", points)

    this.index.finish()
  }

  /**
   * Return the array index of the point closest to `lookupPoint`.
   * @param lookupPoint  WGS-84 coordinate to search from.
   * @returns  Array index, or null when the index is empty.
   */
  getNearestIndex(lookupPoint: Point): number | null {
    const nearest = around(
      this.index,
      lookupPoint.lon,
      lookupPoint.lat,
      1, // return at most 1 result
      MAXDISTANCE
    )

    if (!Array.isArray(nearest)) {
      console.warn("Geokdbush did not return array")
      return null
    }

    if (nearest.length === 0) {
      if (this.debug) console.log("Nearest array is zero")
      return null
    }

    if (this.debug) console.log("Lookup: ", lookupPoint, " Nearest", nearest[0], this.coordinates[nearest[0] as number])

    return Number(nearest[0])
  }

  /**
   * Return the point closest to `lookupPoint`.
   * @param lookupPoint  WGS-84 coordinate to search from.
   * @returns  The nearest point, or null when the index is empty.
   */
  getNearestPoint(lookupPoint: Point): Point | null {
    const nidx = this.getNearestIndex(lookupPoint)
    if (nidx === null) return null
    return this.coordinates[nidx] ?? null
  }
}
