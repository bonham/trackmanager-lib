import { ZoomPanState, type DataInterval } from "./ZoomState";
import Chart from 'chart.js/auto';

const VERBOSELOG = false

/** Callback invoked with the new data interval after each transform frame. */
type UpdateCallBack = (obj: DataInterval) => void

/**
 * Handles mouse wheel events for chart zooming.
 *
 * Applies the wheel delta to `zoomPanState` and schedules a single animation frame
 * to batch rapid wheel events before calling `updateChartCallbackFn`.
 *
 * @param deltaY                 Raw `WheelEvent.deltaY`.
 * @param xPosition              Chart x-axis value at the pointer location (zoom centre).
 * @param zoomPanState           Mutable zoom/pan state object.
 * @param updateChartCallbackFn  Called with the new {@link DataInterval} once per frame.
 */
function wheelEventHandler(
  deltaY: number,
  xPosition: number,
  zoomPanState: ZoomPanState,
  updateChartCallbackFn: UpdateCallBack,
) {
  if (VERBOSELOG) console.log("wheel delta", deltaY)
  zoomPanState.zoomTransformation(deltaY, xPosition)
  processTransform(zoomPanState, updateChartCallbackFn)
}

/**
 * Handles mouse drag (pan) events.
 *
 * Applies the horizontal shift to `zoomPanState` and schedules a frame update.
 *
 * @param shiftX                 Shift in chart x-axis units (negative = pan left).
 * @param zoomPanState           Mutable zoom/pan state object.
 * @param updateChartCallbackFn  Called with the new {@link DataInterval} once per frame.
 */
function panEventHandler(
  shiftX: number,
  zoomPanState: ZoomPanState,
  updateChartCallbackFn: UpdateCallBack,
) {
  if (VERBOSELOG) console.log("Pan shiftX", shiftX)
  zoomPanState.panTransformation(shiftX)
  processTransform(zoomPanState, updateChartCallbackFn)
}

/**
 * Handles touch pinch-zoom events.
 *
 * Applies a pre-computed `newInterval` (from `TransformPixelScale2ChartScale`) to
 * `zoomPanState` and schedules a frame update.
 */
function touchEventHandler(
  newInterval: DataInterval,
  zoomPanState: ZoomPanState,
  updateChartCallbackFn: UpdateCallBack,
) {
  zoomPanState.setIntervalTransformation(newInterval)
  processTransform(zoomPanState, updateChartCallbackFn)
}

/**
 * Schedules a single `requestAnimationFrame` to process accumulated transform state.
 *
 * If a frame is already scheduled (`transformInProgress === true`) the call is ignored
 * and the accumulated state will be consumed in the pending frame instead.
 */
function processTransform(zoomPanState: ZoomPanState, updateChartCallbackFn: UpdateCallBack) {
  if (zoomPanState.transformNotInProgress()) {
    requestAnimationFrame(() => {
      if (zoomPanState.transformInProgress()) {
        console.log("Transform already in progress")
        return
      };
      if (zoomPanState.hasNotChanged()) {
        console.log("No change to process. Returning")
      }
      const stretched = zoomPanState.getTransformedInterval()
      zoomPanState.setHasChanged(false)
      zoomPanState.setZoomInProgress(true)
      updateChartCallbackFn(stretched)
      zoomPanState.setZoomInProgress(false)
    });
  } else {
    console.log("Transform is in progress doing nothing")
  }
}

/**
 * Converts a viewport-relative `clientX` pixel position to the corresponding
 * x-axis data value on the Chart.js chart.
 *
 * @param clientX               Mouse `clientX` coordinate (viewport-relative).
 * @param chartInstance         The Chart.js instance.
 * @param leftCanvasCoordinate  Left edge of the canvas in viewport coordinates.
 * @returns The x-axis value, or undefined when the chart has no x-scale.
 */
function calcXPosition(
  clientX: number,
  chartInstance: Chart<'line', number[], string>,
  leftCanvasCoordinate: number,
): number | undefined {
  const canvasPixelX = clientX - leftCanvasCoordinate
  let xValue: number | undefined
  if (chartInstance) {
    xValue = chartInstance.scales['x']!.getValueForPixel(canvasPixelX)
  }
  return xValue
}

export { calcXPosition, wheelEventHandler, panEventHandler, touchEventHandler, type UpdateCallBack }
