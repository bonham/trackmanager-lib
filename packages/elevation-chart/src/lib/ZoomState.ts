import { stretchInterval } from './stretchInterval';
const { ceil, floor } = Math

/** A closed numeric interval [start, end]. */
interface DataInterval {
  start: number,
  end: number
}

/** Minimum number of data points the visible window must span. */
const MIN_STRETCH_INTERVAL_LENGTH = 5

const VERBOSE = false

/**
 * Manages the visible data window (zoom + pan state) of the elevation chart.
 *
 * Owns a _base interval_ (the full data range) and a _current interval_ (the visible slice).
 * Transformations such as wheel-zoom or drag-pan narrow or shift the current interval.
 * The `getTransformedInterval` method snaps the floating-point result to integer indices
 * so the Chart.js `min`/`max` x-axis options can be set directly.
 *
 * ## Typical usage
 * ```ts
 * const zs = new ZoomPanState(0.001, { start: 0, end: points.length - 1 })
 *
 * // on wheel event:
 * zs.zoomTransformation(event.deltaY, xPosition)
 * const newInterval = zs.getTransformedInterval()
 * // → set chart x-axis min/max to newInterval.start / newInterval.end
 * ```
 */
class ZoomPanState {
  _zoomInProgress: boolean = false

  _zoomSensitivity: number
  _baseInterval: DataInterval
  _currentInterval: DataInterval

  /** Set to true whenever the interval changes but hasn't been consumed yet. */
  _hasChanged = false

  constructor(sensitivity: number, baseInterval: DataInterval) {
    this._zoomSensitivity = sensitivity
    this._baseInterval = baseInterval
    this._currentInterval = baseInterval
  }

  /**
   * Applies a wheel-based zoom transformation.
   *
   * Converts `delta` to a stretch factor via `exp(delta * sensitivity)` then delegates
   * to {@link stretchInterval}, clamping to the base interval and the minimum length.
   *
   * @param delta     Raw `WheelEvent.deltaY` value.
   * @param midPoint  Chart x-axis value at the pointer position (zoom centre).
   */
  zoomTransformation(delta: number, midPoint: number) {
    if (VERBOSE) console.log("Transform", delta)
    const zoomFactor = Math.exp(delta * this._zoomSensitivity)
    const stretchedFloat = stretchInterval(
      this._currentInterval.start,
      this._currentInterval.end,
      midPoint,
      zoomFactor,
      this._baseInterval.start,
      this._baseInterval.end,
      MIN_STRETCH_INTERVAL_LENGTH
    )
    this._currentInterval = stretchedFloat
    this._hasChanged = true
  }

  /**
   * Shifts the current interval by `shiftX` data units, clamped to the base interval.
   *
   * @param shiftX  Horizontal shift in chart x-axis units (positive = shift right).
   */
  panTransformation(shiftX: number) {
    const I_min = this._baseInterval.start
    const I_max = this._baseInterval.end
    const current_start = this._currentInterval.start
    const current_end = this._currentInterval.end
    let newStart = current_start + shiftX
    let newEnd = current_end + shiftX

    // Clamp to base interval while preserving window width
    if (newStart < I_min) {
      newStart = I_min
      newEnd = newStart + (current_end - current_start)
    }
    if (newEnd > I_max) {
      newEnd = I_max
      newStart = newEnd - (current_end - current_start)
    }
    this._currentInterval = { start: newStart, end: newEnd }
    this._hasChanged = true
  }

  /**
   * Replaces the current interval with `newInterval`, clamped to the base interval.
   * Used by touch-based pinch zoom.
   */
  setIntervalTransformation(newInterval: DataInterval) {
    const B_min = this._baseInterval.start
    const B_max = this._baseInterval.end

    let newStart = Math.round(newInterval.start)
    let newEnd = Math.round(newInterval.end)
    const newLength = newEnd - newStart

    if (newStart < B_min) {
      newStart = B_min
      newEnd = newStart + newLength
    }
    if (newEnd > B_max) {
      newEnd = B_max
      newStart = newEnd - newLength
    }

    this._currentInterval = { start: newStart, end: newEnd }
    this._hasChanged = true
  }

  /**
   * Snaps the current floating-point interval to integer boundaries and returns it.
   * Uses `floor` / `ceil` so that even sub-pixel zoom increments produce a visible change.
   * Also writes the snapped value back to `_currentInterval` as the new baseline.
   */
  getTransformedInterval(): DataInterval {
    const roundedStretched = {
      start: floor(this._currentInterval.start),
      end: ceil(this._currentInterval.end)
    }
    this._currentInterval = roundedStretched
    return roundedStretched
  }

  setHasChanged(b: boolean) {
    if (VERBOSE) console.log("HasChanged", b)
    this._hasChanged = b
  }

  setZoomInProgress(b: boolean) {
    if (VERBOSE) console.log("Zoominprogress", b)
    this._zoomInProgress = b
  }

  hasChanged() {
    return this._hasChanged
  }

  hasNotChanged() {
    return !this._hasChanged
  }

  transformInProgress(): boolean {
    return this._zoomInProgress
  }

  transformNotInProgress(): boolean {
    return !this._zoomInProgress
  }

  getCurrentInterval() {
    return this._currentInterval
  }

  setCurrentInterval(current: DataInterval) {
    this._currentInterval = current
    this._hasChanged = true
  }
}

export { ZoomPanState, type DataInterval }
