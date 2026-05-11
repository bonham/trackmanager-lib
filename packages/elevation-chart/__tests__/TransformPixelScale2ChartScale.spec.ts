import { describe, test, expect, beforeEach } from 'vitest'
import { TransformPixelScale2ChartScale } from '@bonham/elevation-chart'

describe('TransformPixelScale2ChartScale', () => {
  let tpc: TransformPixelScale2ChartScale

  beforeEach(() => {
    tpc = new TransformPixelScale2ChartScale()
  })

  describe('constructor', () => {
    test('initialises all numeric fields to 0', () => {
      expect(tpc.scaleFactor).toBe(0)
      expect(tpc.pixelPanDelta).toBe(0)
      expect(tpc.chartpanDelta).toBe(0)
      expect(tpc.zoomFactor).toBe(0)
      expect(tpc.chartPincedMid).toBe(0)
    })

    test('initialises interval arrays to [0, 0]', () => {
      expect(tpc.pixelStartInterval).toEqual([0, 0])
      expect(tpc.chartStartInterval).toEqual([0, 0])
      expect(tpc.pixelPinchedInterval).toEqual([0, 0])
    })
  })

  describe('pix2ChartScaleFactor', () => {
    test('returns correct ratio', () => {
      // 0px→0 chart, 100px→200 chart  → scale = 200/100 = 2
      tpc.setPoints(0, 0, 100, 200)
      expect(tpc.pix2ChartScaleFactor()).toBeCloseTo(2)
    })

    test('returns 1 when pixelDiff is 0 (division-by-zero guard)', () => {
      tpc.setPoints(50, 0, 50, 100)
      expect(tpc.pix2ChartScaleFactor()).toBe(1)
    })

    test('negative scale (reversed pixel order)', () => {
      tpc.setPoints(100, 0, 0, 200)
      expect(tpc.pix2ChartScaleFactor()).toBeCloseTo(-2)
    })
  })

  describe('getChartPinchedInterval', () => {
    beforeEach(() => {
      // 1 pixel = 1 chart unit
      tpc.setPoints(0, 0, 100, 100)
      // Chart shows [0, 100], fingers start at pixels 20–80
      tpc.setChartStartInterval({ start: 0, end: 100 })
      tpc.setPixelStartInterval({ start: 20, end: 80 })
    })

    test('no zoom, no pan → interval unchanged', () => {
      tpc.setPixelPinchedInterval({ start: 20, end: 80 })
      const result = tpc.getChartPinchedInterval()
      expect(result.start).toBeCloseTo(0)
      expect(result.end).toBeCloseTo(100)
    })

    test('zoom out (fingers spread): zoomFactor < 1, interval narrows', () => {
      // Fingers spread: start interval 20–80 (60px), pinched 10–90 (80px)
      // zoomFactor = 60/80 = 0.75 → chartLength = 100 * 0.75 = 75
      tpc.setPixelPinchedInterval({ start: 10, end: 90 })
      const result = tpc.getChartPinchedInterval()
      expect(result.end - result.start).toBeCloseTo(75)
    })

    test('zoom in (fingers pinch): zoomFactor > 1, interval widens', () => {
      // Fingers pinch: start 20–80 (60px), pinched 30–70 (40px)
      // zoomFactor = 60/40 = 1.5 → chartLength = 100 * 1.5 = 150
      tpc.setPixelPinchedInterval({ start: 30, end: 70 })
      const result = tpc.getChartPinchedInterval()
      expect(result.end - result.start).toBeCloseTo(150)
    })

    test('MIN_INTERVAL_LENGTH cap prevents over-zoom-out', () => {
      // chartStartLength = 100, fingers spread hugely (zoomFactor would be 0.1)
      // minFactorLimit = 20/100 = 0.2, so capped at 0.2 → length = 20
      tpc.setPixelPinchedInterval({ start: 20, end: 80 })
      // Override: start 10px, pinched 10–610 (600px vs 60px → zoomFactor = 0.1)
      tpc.setPixelStartInterval({ start: 10, end: 70 })  // 60px
      tpc.setPixelPinchedInterval({ start: 10, end: 610 }) // 600px → factor 0.1
      const result = tpc.getChartPinchedInterval()
      expect(result.end - result.start).toBeCloseTo(20)
    })

    test('pan without zoom: midpoint shifts by pan delta', () => {
      // Same finger distance (no zoom), but midpoint moves +20px
      // start mid = (20+80)/2 = 50px, pinched mid = (40+100)/2 = 70px → panDelta = +20
      // chartPanDelta = 20 * 1 * 1 = 20, chartPinchedMid = 50 - 20 = 30
      tpc.setPixelPinchedInterval({ start: 40, end: 100 })
      const result = tpc.getChartPinchedInterval()
      expect(tpc.chartPincedMid).toBeCloseTo(30)
      expect(result.start).toBeCloseTo(30 - 50)
      expect(result.end).toBeCloseTo(30 + 50)
    })

    test('sets diagnostic properties after call', () => {
      tpc.setPixelPinchedInterval({ start: 20, end: 80 })
      tpc.getChartPinchedInterval()
      expect(tpc.scaleFactor).not.toBe(0)
      expect(tpc.zoomFactor).not.toBe(0)
    })
  })
})
