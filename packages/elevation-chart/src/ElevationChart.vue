<template>
  <div class="chart-container px-1">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, watchEffect, computed } from 'vue';
import { createVerticalLinePlugin } from './lib/VerticalLinePlugin';
import { ZoomPanState, type DataInterval } from './lib/ZoomState';
import { wheelEventHandler, panEventHandler, calcXPosition, touchEventHandler } from './lib/eventHandlers';
import { TransformPixelScale2ChartScale } from './lib/TransformPixelScale2ChartScale';
import type { TrackPoint, CursorSync } from '@la-rampa/elevation-cursor-sync';

import { Chart } from 'chart.js/auto';

type TType = 'line';
type TLabel = string;
type TData = number[];

/** Wheel-zoom sensitivity: larger = faster zoom. */
const ZOOM_SENSITIVITY = 0.001

const props = defineProps<{
  /** Track points (distance + elevation + lat/lon). Drives the chart dataset. */
  points: TrackPoint[] | null;
  /** Index-based intervals to highlight in the overlay colour (e.g. detected climbs). */
  overlayIntervals: number[][];
  /** Shared cursor instance — receives hover distance, drives the vertical line. */
  cursor: CursorSync;
}>();

// Derived elevation array (y-values) for the chart datasets
const elevationData = computed(() => props.points?.map(p => p.elevation) ?? null)

// Full data range; resets zoom state when a new track is loaded
const baseInterval = computed((): DataInterval | null => {
  const edata = elevationData.value
  if (edata === null) return null
  return { start: 0, end: edata.length - 1 }
})

/****** Refs *****/
const canvasRef   = ref<HTMLCanvasElement | null>(null);
/** Currently visible slice of the data; null = show everything. */
const viewPortRef = ref<DataInterval | null>(null)

let chartInstance: Chart<TType, TData, TLabel> | null = null;


/**
 * Reactive watcher: updates chart data, overlay, and x/y scales whenever
 * elevation data, overlay intervals, or the viewport changes.
 *
 * Defers the very first update to the next animation frame so the canvas
 * has finished layout before Chart.js measures it.
 */
let initialUpdateRun = true
watchEffect(
  async () => {
    const overlayIntervals = props.overlayIntervals

    if (elevationData.value === null) {
      console.log("Elevation data is null")
      return
    }

    if (viewPortRef.value === null) {
      viewPortRef.value = { start: 0, end: elevationData.value.length - 1 }
    }

    if (chartInstance === null) {
      console.log("chartInstance is null, cannot update chart")
      return
    }

    if (chartInstance.data.datasets[0] === undefined || chartInstance.data.datasets[1] === undefined) {
      console.log("Chart has not sufficient datasets")
      return
    }

    chartInstance.data.datasets[0].data = elevationData.value
    chartInstance.data.labels = calcLabels()

    const overlayLineData = genOverlayData(elevationData.value, overlayIntervals)
    chartInstance.data.datasets[1].data = overlayLineData

    if (chartInstance.options.scales !== undefined) {
      chartInstance.options.scales['x'] = getScaleX(viewPortRef.value.start, viewPortRef.value.end)
    }

    const maxY = Math.max(...elevationData.value)
    const minY = Math.min(...elevationData.value)
    if (chartInstance.options.scales !== undefined) {
      chartInstance.options.scales['y'] = getScaleY(minY, maxY)
    }

    if (initialUpdateRun) {
      requestAnimationFrame(() => chartInstance && chartInstance.update('none'))
      console.log("initial run")
      initialUpdateRun = false
    } else {
      chartInstance.update('none')
    }
  },
  { flush: 'post' }  // ensure DOM is updated before measuring canvas
);

/** Builds x-axis labels from point distances in km. */
function calcLabels(): string[] {
  if (!props.points) return []
  return props.points.map(p => (p.distance / 1000).toFixed(1))
}

/**
 * Builds a sparse elevation array for the overlay dataset.
 *
 * Only positions within `intervals` are filled; all other positions are NaN so
 * Chart.js draws nothing (because `spanGaps: false` is set on the dataset).
 *
 * @param baseData  Full elevation array.
 * @param intervals Index-based [start, end] pairs to highlight.
 */
function genOverlayData(baseData: number[], intervals: number[][]): number[] {
  const sourceLength = baseData.length
  const resultArray: number[] = Array(sourceLength).fill(NaN)

  let maxEnd = 0

  for (const interval of intervals) {
    const [start, end] = interval
    if (start === undefined) { console.error(`Start is not defined`); return [] }
    if (end   === undefined) { console.error(`End is not defined`);   return [] }
    if (start >= sourceLength) { console.error(`Interval start ${start} out of bounds`); return [] }
    if (end   >= sourceLength) { console.error(`Interval end ${end} out of bounds`);     return [] }
    if (start >= end)          { console.error(`start ${start} not < end ${end}`);       return [] }
    for (let i = start; i <= end; i++) {
      resultArray[i] = baseData[i]!
    }
    maxEnd = Math.max(maxEnd, end)
  }
  return resultArray.slice(0, maxEnd + 1)
}

const verticalLinePlugin = createVerticalLinePlugin()

function getScaleX(min: number | undefined, max: number | undefined) {
  return {
    title: { display: true, text: 'Distance (km)' },
    min: min ?? undefined,
    max: max ?? undefined,
  }
}

/**
 * Computes y-axis bounds with 10 % padding above and below,
 * rounded outward to the nearest 10 m boundary.
 */
function getScaleY(dataMin: number | undefined, dataMax: number | undefined) {
  let minMaxOpts = {}
  if (dataMin !== undefined && dataMax !== undefined) {
    const range   = dataMax - dataMin
    const padding = range * 0.1
    const minY = Math.floor((dataMin - padding) / 10) * 10
    const maxY = Math.ceil( (dataMax + padding) / 10) * 10
    minMaxOpts = { min: minY, max: maxY }
  }
  return { title: { display: true, text: 'Elevation (m)' }, ...minMaxOpts }
}

// Initialize chart once on mount
onMounted(() => {

  const scales = {
    x: getScaleX(undefined, undefined),
    y: getScaleY(undefined, undefined),
  }

  const canvas = canvasRef.value;
  if (!canvas) { console.warn('Canvas unavailable after mount.'); return; }

  chartInstance = new Chart(canvas, {
    type: 'line' as TType,
    data: {
      labels: [],
      datasets: [
        {
          borderColor: '#37a3eb',   // blue — elevation baseline
          label: 'Elevation (m)',
          data: [] as TData,
          fill: false,
          order: 1,
          pointStyle: false,
        },
        {
          borderColor: '#dc3912',   // red — overlay (climbs)
          data: [] as TData,
          fill: false,
          spanGaps: false,          // gaps between intervals are intentional NaNs
          order: 0,
          pointStyle: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales,
      plugins: {
        tooltip: { enabled: false },
        legend:  { display: false },
      },
      elements: {
        point: { radius: 2, pointStyle: 'circle' },
        line:  { tension: 0.2 },
      },
      transitions: {
        scroll_update: { animation: { duration: 0 } },
      },
    },
    plugins: [verticalLinePlugin],
  });

  // ─────────────── drag-to-pan state ──────────────────────────────────────
  let isDragging  = false
  let scaleXStart: number | undefined = undefined

  canvas.addEventListener('mousedown', (event) => {
    isDragging  = true
    scaleXStart = clientXtoChartX(canvas, event.clientX)
  })

  canvas.addEventListener('mouseup', () => {
    isDragging  = false
    scaleXStart = undefined
  })

  // ─────────────── zoom/pan: re-register handlers when data changes ────────
  function updateChartFn(obj: DataInterval): void {
    if (viewPortRef.value !== undefined) viewPortRef.value = obj
  }

  let oldWheelHandler:     ((event: WheelEvent) => void) | undefined
  let oldMouseMoveHandler: ((event: MouseEvent) => void) | undefined

  watch(baseInterval, (newInterval) => {
    if (newInterval === null) return

    // Remove stale event handlers from the previous track
    if (oldWheelHandler)     canvas.removeEventListener('wheel',     oldWheelHandler)
    if (oldMouseMoveHandler) canvas.removeEventListener('mousemove', oldMouseMoveHandler)

    // Reset visible range to show the full new track
    if (elevationData.value) {
      viewPortRef.value = { start: 0, end: elevationData.value.length - 1 }
    }
    const zoomState = new ZoomPanState(ZOOM_SENSITIVITY, newInterval)

    const newWheelHandler = (event: WheelEvent) => {
      event.preventDefault()
      if (chartInstance === null) throw new Error("chart instance is null while running wheel handler")
      const xPosition = calcXPosition(event.clientX, chartInstance, canvas.getBoundingClientRect().left)
      if (xPosition === undefined) { console.log("xPosition undefined in wheel handler"); return }
      wheelEventHandler(event.deltaY, xPosition, zoomState, updateChartFn)
    }
    canvas.addEventListener('wheel', newWheelHandler)

    const newMouseMoveHandler = (event: MouseEvent) => {
      if (isDragging) {
        if (!chartInstance) return
        const scaleXCurrent = clientXtoChartX(canvas, event.clientX)
        if (scaleXCurrent === undefined) { console.log("Cannot get scaleXCurrent"); return }
        if (scaleXStart   === undefined) { console.log("pixelXStart is undefined");  return }
        const shiftX = scaleXCurrent - scaleXStart
        panEventHandler(-shiftX, zoomState, updateChartFn) // negate: mouse right = pan left
      } else {
        event.stopPropagation()
        notifyCursor(canvas, event.clientX)
      }
    }
    canvas.addEventListener('mousemove', newMouseMoveHandler)

    oldWheelHandler     = newWheelHandler
    oldMouseMoveHandler = newMouseMoveHandler

    // ─────────────── touch (pinch-zoom + single-finger hover) ────────────
    const tpc = new TransformPixelScale2ChartScale()

    canvas.addEventListener('touchstart', (event) => {
      event.preventDefault()
      if (event.touches.length === 1) {
        notifyCursor(canvas, event.touches[0]!.clientX)
      } else if (event.touches.length === 2) {
        if (!chartInstance || !chartInstance.data.labels) return
        tpc.setChartStartInterval(zoomState.getCurrentInterval())
        const x0 = 0
        const p0 = chartInstance.scales['x']!.getPixelForValue(x0)
        const x1 = chartInstance.options.scales!['x']!.max as number
        const p1 = chartInstance.scales['x']!.getPixelForValue(x1)
        tpc.setPoints(p0, x0, p1, x1)
        tpc.setPixelStartInterval({ start: event.touches[0]!.clientX, end: event.touches[1]!.clientX })
      }
    })

    canvas.addEventListener('touchend', () => { /* noop */ })

    canvas.addEventListener('touchmove', (event) => {
      if (event.touches.length === 1) {
        notifyCursor(canvas, event.touches[0]!.clientX)
      } else if (event.touches.length === 2) {
        event.preventDefault()
        tpc.setPixelPinchedInterval({ start: event.touches[0]!.clientX, end: event.touches[1]!.clientX })
        const newInterval = tpc.getChartPinchedInterval()
        touchEventHandler(newInterval, zoomState, updateChartFn)
      }
    })
  })

  // ─────────────── cursor → vertical line (from external hover, e.g. map) ─
  /**
   * Watches external cursor changes (e.g. map hover) and repositions the vertical line.
   * `cursor.nearestIndex` is the index in `props.points` closest to `cursor.distance`.
   */
  watch(
    () => props.cursor.nearestIndex.value,
    (newIndex) => {
      if (newIndex === null) return
      if (
        chartInstance &&
        chartInstance.data.labels &&
        chartInstance.data.labels.length > 0 &&
        chartInstance.config.plugins
      ) {
        const pixelX = chartInstance.scales['x']!.getPixelForValue(newIndex);
        verticalLinePlugin.mouseX = pixelX;
        chartInstance.update('none');
      }
    }
  )

});

/**
 * Converts a clientX pixel position to a chart x-axis index, then pushes
 * the corresponding track distance into the shared cursor.
 */
function notifyCursor(canvas: HTMLCanvasElement, clientX: number) {
  const idx = clientXtoChartX(canvas, clientX)
  if (idx !== undefined && props.points) {
    const pt = props.points[Math.round(idx)]
    if (pt !== undefined) {
      props.cursor.setByDistance(pt.distance)
    }
  }
}

/**
 * Converts a viewport-relative clientX to the corresponding Chart.js x-axis value.
 *
 * @param canvas   The chart canvas element.
 * @param clientX  Mouse/touch x coordinate relative to the viewport.
 * @returns The x-axis index, or undefined when the scale is not yet ready.
 */
function clientXtoChartX(canvas: HTMLCanvasElement, clientX: number): number | undefined {
  const rect = canvas.getBoundingClientRect();
  const x    = clientX - rect.left;
  let xValue: number | undefined;
  if (chartInstance) {
    xValue = chartInstance.scales['x']!.getValueForPixel(x);
  }
  if (xValue === undefined) {
    console.warn(`Unable to get xValue from pixel position ${x}`);
    return;
  }
  return xValue;
}
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 250px;
}

canvas {
  width: 100%;
  height: 100%;
}
</style>
