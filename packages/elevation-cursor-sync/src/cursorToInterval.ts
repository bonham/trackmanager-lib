import { computed, unref } from 'vue'
import type { MaybeRef, ComputedRef } from 'vue'
import type { CursorSync } from './types'

/**
 * Maps the cursor's `nearestIndex` to a 1-based interval ID.
 *
 * Returns null when the cursor is outside all provided intervals, allowing
 * components to selectively highlight only the interval under the cursor.
 *
 * @param cursor     Shared CursorSync instance.
 * @param intervals  Index-based intervals `[startIdx, endIdx][]` (e.g. as produced by analyzeAscent).
 *                   Both bounds are inclusive.
 * @returns          ComputedRef resolving to a 1-based interval ID, or null when the cursor is
 *                   not inside any interval.
 *
 * @example
 * ```ts
 * const activeInterval = cursorToInterval(cursor, slopeIntervals)
 * // activeInterval.value === 2 → cursor is inside the second detected climb
 * ```
 */
export function cursorToInterval(
  cursor: CursorSync,
  intervals: MaybeRef<[number, number][]>,
): ComputedRef<number | null> {
  return computed<number | null>(() => {
    const idx = cursor.nearestIndex.value
    if (idx === null) return null

    const ivs = unref(intervals)
    const found = ivs.findIndex(([start, end]) => idx >= start && idx <= end)
    return found >= 0 ? found + 1 : null  // 1-based ID
  })
}
