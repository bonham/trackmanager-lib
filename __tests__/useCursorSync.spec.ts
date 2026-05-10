import { describe, it, expect } from 'vitest'
import { withSetup } from './testUtils'
import { useCursorSync } from '@la-rampa/elevation-cursor-sync'
import type { TrackPoint } from '@la-rampa/elevation-cursor-sync'

/**
 * Tests for the useCursorSync composable.
 *
 * These tests document the CursorSync contract and serve as validation for the
 * refactoring from the old three-variable event-based sync to the new composable.
 * They are implementation-independent: they test observable state, not internal wiring.
 */

const points: TrackPoint[] = [
  { distance: 0, elevation: 100, lon: 11.5750, lat: 48.1370 },
  { distance: 100, elevation: 110, lon: 11.5760, lat: 48.1380 },
  { distance: 200, elevation: 120, lon: 11.5770, lat: 48.1390 },
  { distance: 300, elevation: 115, lon: 11.5780, lat: 48.1400 },
  { distance: 400, elevation: 108, lon: 11.5790, lat: 48.1410 },
]

describe('useCursorSync', () => {

  it('initializes with null distance and null nearestIndex', () => {
    const cursor = withSetup(() => useCursorSync(points))
    expect(cursor.distance.value).toBeNull()
    expect(cursor.nearestIndex.value).toBeNull()
  })

  it('setByDistance sets the distance', () => {
    const cursor = withSetup(() => useCursorSync(points))
    cursor.setByDistance(150)
    expect(cursor.distance.value).toBe(150)
  })

  it('setByDistance at exact point distance maps to that point index', () => {
    const cursor = withSetup(() => useCursorSync(points))
    cursor.setByDistance(200)
    expect(cursor.nearestIndex.value).toBe(2)
  })

  it('nearestIndex finds closest point when between two points', () => {
    const cursor = withSetup(() => useCursorSync(points))
    // distance=80: |100-80|=20 vs |0-80|=80 → index 1 is closer
    cursor.setByDistance(80)
    expect(cursor.nearestIndex.value).toBe(1)
  })

  it('nearestIndex picks first point when distance is closer to 0', () => {
    const cursor = withSetup(() => useCursorSync(points))
    // distance=30: |0-30|=30 vs |100-30|=70 → index 0 is closer
    cursor.setByDistance(30)
    expect(cursor.nearestIndex.value).toBe(0)
  })

  it('nearestIndex picks last point at max distance', () => {
    const cursor = withSetup(() => useCursorSync(points))
    cursor.setByDistance(400)
    expect(cursor.nearestIndex.value).toBe(4)
  })

  it('nearestIndex reacts to distance changes', () => {
    const cursor = withSetup(() => useCursorSync(points))
    // Tie-breaking: lower index wins when both neighbours are equidistant
    cursor.setByDistance(50)  // |50-0|=50 vs |100-50|=50 → lower index 0 wins
    expect(cursor.nearestIndex.value).toBe(0)
    cursor.setByDistance(350) // |350-300|=50 vs |400-350|=50 → lower index 3 wins
    expect(cursor.nearestIndex.value).toBe(3)
  })

  it('clear() resets distance to null', () => {
    const cursor = withSetup(() => useCursorSync(points))
    cursor.setByDistance(200)
    cursor.clear()
    expect(cursor.distance.value).toBeNull()
  })

  it('clear() resets nearestIndex to null', () => {
    const cursor = withSetup(() => useCursorSync(points))
    cursor.setByDistance(200)
    cursor.clear()
    expect(cursor.nearestIndex.value).toBeNull()
  })

  it('distance is readonly — external mutation is silently discarded', () => {
    const cursor = withSetup(() => useCursorSync(points))
    cursor.setByDistance(100)
    try {
      // @ts-expect-error TypeScript prevents this; Vue warns at runtime and discards the write
      cursor.distance.value = 999
    } catch { /* some environments throw, others just warn — both are acceptable */ }
    // The stored value must be unchanged regardless of whether an error was thrown
    expect(cursor.distance.value).toBe(100)
  })
})
