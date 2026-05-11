import { describe, test, expect, beforeEach } from 'vitest'
import { ZoomPanState } from '@bonham/elevation-chart'
import type { DataInterval } from '@bonham/elevation-chart'

describe('ZoomPanState', () => {
  let zs: ZoomPanState

  beforeEach(() => {
    zs = new ZoomPanState(0.001, { start: 0, end: 100 })
  })

  describe('constructor', () => {
    test('hasChanged is false initially', () => {
      expect(zs.hasChanged()).toBe(false)
    })

    test('hasNotChanged is true initially', () => {
      expect(zs.hasNotChanged()).toBe(true)
    })

    test('transformInProgress is false initially', () => {
      expect(zs.transformInProgress()).toBe(false)
    })

    test('transformNotInProgress is true initially', () => {
      expect(zs.transformNotInProgress()).toBe(true)
    })

    test('getCurrentInterval equals base interval', () => {
      expect(zs.getCurrentInterval()).toEqual({ start: 0, end: 100 })
    })
  })

  describe('zoomTransformation', () => {
    test('sets hasChanged to true', () => {
      zs.zoomTransformation(-200, 50)
      expect(zs.hasChanged()).toBe(true)
    })

    test('negative delta narrows the interval (zoom in)', () => {
      // exp(-0.5) ≈ 0.607 < 1 → stretchInterval shrinks the window
      zs.zoomTransformation(-500, 50)
      const { start, end } = zs.getCurrentInterval()
      expect(end - start).toBeLessThan(100)
    })

    test('positive delta widens the interval (zoom out)', () => {
      // Start with a narrowed window [20,80], then zoom out with positive delta
      const zs2 = new ZoomPanState(0.001, { start: 0, end: 100 })
      zs2.setCurrentInterval({ start: 20, end: 80 })
      zs2.zoomTransformation(500, 50)
      const { start, end } = zs2.getCurrentInterval()
      expect(end - start).toBeGreaterThan(60)
    })
  })

  describe('panTransformation', () => {
    test('sets hasChanged to true', () => {
      zs.panTransformation(10)
      expect(zs.hasChanged()).toBe(true)
    })

    test('positive shiftX moves interval right', () => {
      // Use a wider base so there is room to shift right
      const zs2 = new ZoomPanState(0.001, { start: 0, end: 200 })
      zs2.setCurrentInterval({ start: 0, end: 100 })
      zs2.panTransformation(20)
      const { start, end } = zs2.getCurrentInterval()
      expect(start).toBe(20)
      expect(end).toBe(120)
    })

    test('negative shiftX moves interval left', () => {
      // Start at 50-100 so there is room to shift left
      const zs2 = new ZoomPanState(0.001, { start: 0, end: 200 })
      zs2.setCurrentInterval({ start: 50, end: 150 })
      zs2.panTransformation(-30)
      const { start, end } = zs2.getCurrentInterval()
      expect(start).toBe(20)
      expect(end).toBe(120)
    })

    test('clamps at base start — preserves window width', () => {
      zs.panTransformation(-50)
      const { start, end } = zs.getCurrentInterval()
      expect(start).toBe(0)
      expect(end - start).toBe(100)
    })

    test('clamps at base end — preserves window width', () => {
      // Shift right by 50: [0,100] → [50,150] but base max is 100 → [0,100]
      zs.panTransformation(50)
      const { start, end } = zs.getCurrentInterval()
      expect(end).toBe(100)
      expect(start).toBe(0)
      expect(end - start).toBe(100)
    })
  })

  describe('setIntervalTransformation', () => {
    test('sets hasChanged to true', () => {
      zs.setIntervalTransformation({ start: 10, end: 60 })
      expect(zs.hasChanged()).toBe(true)
    })

    test('rounds fractional start/end', () => {
      zs.setIntervalTransformation({ start: 10.7, end: 60.2 })
      const { start, end } = zs.getCurrentInterval()
      expect(start).toBe(11)
      expect(end).toBe(60)
    })

    test('clamps start to base minimum', () => {
      zs.setIntervalTransformation({ start: -20, end: 50 })
      const { start } = zs.getCurrentInterval()
      expect(start).toBe(0)
    })

    test('clamps end to base maximum', () => {
      zs.setIntervalTransformation({ start: 60, end: 150 })
      const { end } = zs.getCurrentInterval()
      expect(end).toBe(100)
    })
  })

  describe('getTransformedInterval', () => {
    test('floors start and ceils end', () => {
      zs.zoomTransformation(100, 50)
      const result = zs.getTransformedInterval()
      expect(result.start).toBe(Math.floor(result.start))
      expect(result.end).toBe(Math.ceil(result.end))
    })

    test('returned interval matches getCurrentInterval after call', () => {
      zs.zoomTransformation(100, 50)
      const result = zs.getTransformedInterval()
      expect(zs.getCurrentInterval()).toEqual(result)
    })
  })

  describe('setHasChanged / hasChanged / hasNotChanged', () => {
    test('setHasChanged(true) makes hasChanged() true', () => {
      zs.setHasChanged(true)
      expect(zs.hasChanged()).toBe(true)
      expect(zs.hasNotChanged()).toBe(false)
    })

    test('setHasChanged(false) makes hasChanged() false', () => {
      zs.setHasChanged(true)
      zs.setHasChanged(false)
      expect(zs.hasChanged()).toBe(false)
      expect(zs.hasNotChanged()).toBe(true)
    })
  })

  describe('setZoomInProgress / transformInProgress / transformNotInProgress', () => {
    test('setZoomInProgress(true) makes transformInProgress() true', () => {
      zs.setZoomInProgress(true)
      expect(zs.transformInProgress()).toBe(true)
      expect(zs.transformNotInProgress()).toBe(false)
    })

    test('setZoomInProgress(false) makes transformInProgress() false', () => {
      zs.setZoomInProgress(true)
      zs.setZoomInProgress(false)
      expect(zs.transformInProgress()).toBe(false)
      expect(zs.transformNotInProgress()).toBe(true)
    })
  })

  describe('getCurrentInterval / setCurrentInterval', () => {
    test('setCurrentInterval updates the interval', () => {
      const newInterval: DataInterval = { start: 25, end: 75 }
      zs.setCurrentInterval(newInterval)
      expect(zs.getCurrentInterval()).toEqual(newInterval)
    })

    test('setCurrentInterval sets hasChanged to true', () => {
      zs.setCurrentInterval({ start: 10, end: 90 })
      expect(zs.hasChanged()).toBe(true)
    })
  })
})
