import { ref, computed, readonly, unref } from 'vue'
import type { MaybeRef, ComputedRef } from 'vue'
import type { TrackPoint, CursorSync } from './types'

/**
 * Binary search: find the index of the point whose distance is closest to `target`.
 * Assumes `points` is sorted by `distance` in ascending order.
 * Ties (equidistant neighbours) resolve to the lower index.
 *
 * @param points  Sorted array of TrackPoints.
 * @param target  Distance in metres to search for.
 * @returns Index of the nearest point, or null when the array is empty.
 */
function findNearestIndex(points: TrackPoint[], target: number): number | null {
  if (points.length === 0) return null

  let lo = 0
  let hi = points.length - 1

  // Binary search: find the first index where points[lo].distance >= target
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (points[mid]!.distance < target) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }

  // Compare with predecessor to pick the closer candidate (lower index on ties)
  if (lo > 0 && (target - points[lo - 1]!.distance) <= (points[lo]!.distance - target)) {
    return lo - 1
  }
  return lo
}

/**
 * Composable that holds a single shared cursor position (distance along the track).
 *
 * Create one instance per track view and pass it to all consumers (ElevationChart, MapView,
 * table helpers). The instance is the single source of truth; all consumers react to the
 * same reactive state via `distance` and `nearestIndex`.
 *
 * **Design principles:**
 * - Resampling is the caller's responsibility — pass already equidistant points.
 * - Sync is distance-based (not index-based), so it works across different point spacings.
 * - The cursor object is intentionally opaque; consumers call `setByDistance` / `clear`
 *   and read `distance` / `nearestIndex` without knowing about each other.
 *
 * @param points  TrackPoint array (or a ref/computed wrapping one). Must be sorted by distance.
 * @returns A {@link CursorSync} instance.
 *
 * @example
 * ```ts
 * // In App.vue setup:
 * const cursor = useCursorSync(trackPoints)
 * ```
 */
export function useCursorSync(points: MaybeRef<TrackPoint[]>): CursorSync {
  const _distance = ref<number | null>(null)

  const nearestIndex = computed<number | null>(() => {
    if (_distance.value === null) return null
    return findNearestIndex(unref(points), _distance.value)
  })

  return {
    distance: readonly(_distance),
    nearestIndex: readonly(nearestIndex) as Readonly<ComputedRef<number | null>>,
    setByDistance(d: number) {
      _distance.value = d
    },
    clear() {
      _distance.value = null
    },
  }
}
