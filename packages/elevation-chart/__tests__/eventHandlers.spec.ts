import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { ZoomPanState } from '@bonham/elevation-chart'
import { wheelEventHandler, panEventHandler, touchEventHandler, calcXPosition } from '@bonham/elevation-chart'
import type { DataInterval, UpdateCallBack } from '@bonham/elevation-chart'

vi.mock('chart.js/auto', () => ({
  default: vi.fn(),
}))

describe('eventHandlers', () => {
  let zs: ZoomPanState
  let callback: UpdateCallBack
  let capturedInterval: DataInterval | null

  beforeEach(() => {
    capturedInterval = null
    callback = vi.fn((interval: DataInterval) => { capturedInterval = interval })
    zs = new ZoomPanState(0.001, { start: 0, end: 100 })

    // Make requestAnimationFrame synchronous
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 0
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('wheelEventHandler', () => {
    test('calls callback with new interval after zoom', () => {
      wheelEventHandler(200, 50, zs, callback)
      expect(callback).toHaveBeenCalledOnce()
      expect(capturedInterval).not.toBeNull()
    })

    test('resulting interval is narrower after negative deltaY (zoom in)', () => {
      wheelEventHandler(-500, 50, zs, callback)
      const interval = capturedInterval!
      expect(interval.end - interval.start).toBeLessThan(100)
    })
  })

  describe('panEventHandler', () => {
    test('calls callback with shifted interval', () => {
      // Use a wider base so there is room to shift right
      const zs2 = new ZoomPanState(0.001, { start: 0, end: 200 })
      zs2.setCurrentInterval({ start: 0, end: 100 })
      panEventHandler(20, zs2, callback)
      expect(callback).toHaveBeenCalledOnce()
      expect(capturedInterval!.start).toBe(20)
    })
  })

  describe('touchEventHandler', () => {
    test('calls callback with provided interval', () => {
      touchEventHandler({ start: 10, end: 60 }, zs, callback)
      expect(callback).toHaveBeenCalledOnce()
      const interval = capturedInterval!
      expect(interval.start).toBe(10)
      expect(interval.end).toBe(60)
    })
  })

  describe('processTransform — already-in-progress guard', () => {
    test('does not call callback when transform is already in progress', () => {
      // Make RAF not execute immediately so we can set the in-progress flag
      vi.stubGlobal('requestAnimationFrame', (() => 0) as typeof requestAnimationFrame)
      zs.setZoomInProgress(true)
      wheelEventHandler(200, 50, zs, callback)
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('calcXPosition', () => {
    test('returns value from chart x scale', () => {
      const mockChart = {
        scales: {
          x: { getValueForPixel: vi.fn().mockReturnValue(42) },
        },
      } as unknown as import('chart.js').Chart<'line', number[], string>

      const result = calcXPosition(150, mockChart, 100)
      expect(result).toBe(42)
      expect(mockChart.scales['x']!.getValueForPixel).toHaveBeenCalledWith(50)
    })
  })
})
