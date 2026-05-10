import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { withSetup } from './testUtils'
import { useCursorSync } from '@la-rampa/elevation-cursor-sync'
import { cursorToInterval } from '@la-rampa/elevation-cursor-sync'
import type { TrackPoint } from '@la-rampa/elevation-cursor-sync'

/**
 * Tests for cursorToInterval helper.
 *
 * cursorToInterval maps the cursor's nearestIndex to a 1-based interval ID,
 * or null when the cursor is not inside any interval.
 *
 * These tests describe the contract between the cursor sync state and the
 * climb table row highlighting behavior, independent of how the sync is wired.
 */

// 10 equidistant points at 100m intervals (indices 0–9)
const points: TrackPoint[] = Array.from({ length: 10 }, (_, i) => ({
  distance: i * 100,
  elevation: 100 + i * 2,
  lon: 11.57 + i * 0.001,
  lat: 48.137 + i * 0.001,
}))

// intervals: index-based [startIdx, endIdx][], as produced by analyzeAscent
const intervals: [number, number][] = [
  [2, 4],  // id 1
  [6, 8],  // id 2
]

describe('cursorToInterval', () => {

  it('returns null when cursor has not been set', () => {
    const cursor = withSetup(() => useCursorSync(points))
    const active = cursorToInterval(cursor, ref(intervals))
    expect(active.value).toBeNull()
  })

  it('returns 1-based id 1 when cursor is inside the first interval', () => {
    const cursor = withSetup(() => useCursorSync(points))
    cursor.setByDistance(300) // → nearestIndex = 3, which is in [2,4]
    const active = cursorToInterval(cursor, ref(intervals))
    expect(active.value).toBe(1)
  })

  it('returns 1-based id 2 when cursor is inside the second interval', () => {
    const cursor = withSetup(() => useCursorSync(points))
    cursor.setByDistance(700) // → nearestIndex = 7, which is in [6,8]
    const active = cursorToInterval(cursor, ref(intervals))
    expect(active.value).toBe(2)
  })

  it('returns null when cursor index is between intervals', () => {
    const cursor = withSetup(() => useCursorSync(points))
    cursor.setByDistance(500) // → nearestIndex = 5, between [2,4] and [6,8]
    const active = cursorToInterval(cursor, ref(intervals))
    expect(active.value).toBeNull()
  })

  it('returns null when cursor index is before all intervals', () => {
    const cursor = withSetup(() => useCursorSync(points))
    cursor.setByDistance(0) // → nearestIndex = 0, before [2,4]
    const active = cursorToInterval(cursor, ref(intervals))
    expect(active.value).toBeNull()
  })

  it('returns null when cursor index is after all intervals', () => {
    const cursor = withSetup(() => useCursorSync(points))
    cursor.setByDistance(900) // → nearestIndex = 9, after [6,8]
    const active = cursorToInterval(cursor, ref(intervals))
    expect(active.value).toBeNull()
  })

  it('returns null when interval list is empty', () => {
    const cursor = withSetup(() => useCursorSync(points))
    cursor.setByDistance(300)
    const active = cursorToInterval(cursor, ref([]))
    expect(active.value).toBeNull()
  })

  it('is reactive: updates when cursor changes to a different interval', () => {
    const cursor = withSetup(() => useCursorSync(points))
    const active = cursorToInterval(cursor, ref(intervals))

    cursor.setByDistance(300) // → index 3 → interval 1
    expect(active.value).toBe(1)

    cursor.setByDistance(700) // → index 7 → interval 2
    expect(active.value).toBe(2)

    cursor.clear()
    expect(active.value).toBeNull()
  })

  it('is reactive: updates when intervals change', () => {
    const cursor = withSetup(() => useCursorSync(points))
    cursor.setByDistance(300) // → index 3

    const liveIntervals = ref<[number, number][]>([[2, 4]])
    const active = cursorToInterval(cursor, liveIntervals)
    expect(active.value).toBe(1)

    // Remove the interval — cursor is now outside all intervals
    liveIntervals.value = []
    expect(active.value).toBeNull()
  })
})
