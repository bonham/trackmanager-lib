import { type DataInterval } from "./ZoomState";

/**
 * Converts pixel-space pinch-zoom gestures into a chart data-space interval.
 *
 * On `touchstart` the caller records the initial pixel and chart intervals;
 * on each `touchmove` it records the new pinch pixel interval.
 * `getChartPinchedInterval()` then derives the resulting chart interval by
 * computing the zoom factor and pan delta from the pixel deltas.
 *
 * @example
 * ```ts
 * const tpc = new TransformPixelScale2ChartScale()
 * // touchstart:
 * tpc.setPoints(p0, x0, p1, x1)               // pixel↔chart calibration points
 * tpc.setChartStartInterval(zoomState.getCurrentInterval())
 * tpc.setPixelStartInterval({ start: t[0].clientX, end: t[1].clientX })
 * // touchmove:
 * tpc.setPixelPinchedInterval({ start: t[0].clientX, end: t[1].clientX })
 * const newInterval = tpc.getChartPinchedInterval()
 * ```
 */
export class TransformPixelScale2ChartScale {

  /** Minimum chart-data-unit span of the resulting interval. */
  MIN_INTERVAL_LENGTH = 20

  /** Two reference points mapping pixel coordinates to chart axis values. */
  pixelChartScalePoints: {
    p0: number; // pixel coordinate of reference point 0
    x0: number; // chart value at reference point 0
    p1: number; // pixel coordinate of reference point 1
    x1: number; // chart value at reference point 1
  }

  /** Pixel interval at the moment the touch gesture started. */
  pixelStartInterval: number[]
  /** Chart interval at the moment the touch gesture started. */
  chartStartInterval: number[]
  /** Current pinched pixel interval (updated each touchmove). */
  pixelPinchedInterval: number[]

  // Diagnostics — populated by getChartPinchedInterval
  scaleFactor: number
  pixelPanDelta: number
  chartpanDelta: number
  zoomFactor: number
  chartPincedMid: number

  constructor() {
    this.pixelChartScalePoints = { p0: 0, x0: 0, p1: 0, x1: 0 }
    this.pixelStartInterval = [0, 0]
    this.chartStartInterval = [0, 0]
    this.pixelPinchedInterval = [0, 0]
    this.scaleFactor = 0
    this.pixelPanDelta = 0
    this.chartpanDelta = 0
    this.zoomFactor = 0
    this.chartPincedMid = 0
  }

  /** Record two reference points used to compute the pixel→chart scale factor. */
  setPoints(p0: number, x0: number, p1: number, x1: number) {
    this.pixelChartScalePoints = { p0, x0, p1, x1 }
  }

  setChartStartInterval(startInterval: DataInterval) {
    this.chartStartInterval = [startInterval.start, startInterval.end]
  }

  setPixelStartInterval(startInterval: DataInterval) {
    this.pixelStartInterval = [startInterval.start, startInterval.end]
  }

  setPixelPinchedInterval(pinchedInterval: DataInterval) {
    this.pixelPinchedInterval = [pinchedInterval.start, pinchedInterval.end]
  }

  /**
   * Derives the chart data interval from the current pinch state.
   *
   * Computes:
   * 1. The pixel→chart scale factor from the calibration points.
   * 2. The zoom factor from the ratio of pinch distances.
   * 3. The pan delta from the midpoint shift in pixel space.
   *
   * @returns The resulting {@link DataInterval} in chart data coordinates.
   */
  getChartPinchedInterval(): DataInterval {
    const scaleFactor = this.pix2ChartScaleFactor()
    this.scaleFactor = scaleFactor

    const midPixelStart = intervalMidPoint(this.pixelStartInterval)
    const midPixelPinched = intervalMidPoint(this.pixelPinchedInterval)
    const pixelPanDelta = midPixelPinched - midPixelStart
    this.pixelPanDelta = pixelPanDelta

    const pixelStartLength = this.pixelStartInterval[1]! - this.pixelStartInterval[0]!
    const pixelPinchedLength = this.pixelPinchedInterval[1]! - this.pixelPinchedInterval[0]!
    const chartStartLength = this.chartStartInterval[1]! - this.chartStartInterval[0]!

    let zoomFactor = pixelStartLength / pixelPinchedLength
    // Cap zoom-in factor so the chart interval never falls below MIN_INTERVAL_LENGTH
    if (zoomFactor < 1) {
      const minFactorLimit = this.MIN_INTERVAL_LENGTH / chartStartLength
      zoomFactor = Math.max(minFactorLimit, zoomFactor)
    }
    this.zoomFactor = zoomFactor

    const chartPinchedLength = chartStartLength * zoomFactor
    const chartStartMid = intervalMidPoint(this.chartStartInterval)
    // Positive pixel pan → move x-scale in the negative direction
    const chartPanDelta = pixelPanDelta * scaleFactor * zoomFactor
    this.chartpanDelta = chartPanDelta
    const chartPinchedMid = chartStartMid - chartPanDelta
    this.chartPincedMid = chartPinchedMid

    return {
      start: chartPinchedMid - chartPinchedLength / 2,
      end: chartPinchedMid + chartPinchedLength / 2,
    }
  }

  /** Computes the pixel-to-chart-axis scale factor from the two calibration points. */
  pix2ChartScaleFactor(): number {
    const { p0, x0, p1, x1 } = this.pixelChartScalePoints
    const pixelDiff = p1 - p0
    const chartScaleDiff = x1 - x0
    if (pixelDiff === 0) return 1 // guard against division by zero
    return chartScaleDiff / pixelDiff
  }
}

/** Returns the arithmetic midpoint of a two-element array [lo, hi]. */
function intervalMidPoint(interval: number[]): number {
  return (interval[0]! + interval[1]!) / 2
}
