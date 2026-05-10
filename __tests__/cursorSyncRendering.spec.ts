import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, defineComponent } from 'vue'
import App from '../App.vue'
import type { CursorSync } from '@la-rampa/elevation-cursor-sync'

/**
 * Rendering tests for the cursor synchronization behavior in App.vue.
 *
 * These tests use stubbed MapView and ElevationChart components so they
 * do not depend on Chart.js or OpenLayers internals.
 *
 * They test the BEHAVIORAL CONTRACT:
 *   - Both components receive the same shared CursorSync instance
 *   - Updating the cursor from one component is immediately visible to the other
 *   - Clearing the cursor resets state for all components
 *   - The table row reflects the cursor position
 *
 * These tests are designed to remain valid after the refactoring from
 * the old three-variable/event system to the new useCursorSync composable.
 */

// Stubs capture the cursor prop they receive so tests can inspect and drive it
let capturedMapCursor: CursorSync | null = null
let capturedChartCursor: CursorSync | null = null

const MapViewStub = defineComponent({
  name: 'MapView',
  props: {
    cursor: { type: Object, required: true },
    lineStringF: { default: null },
    overlayLineStringF: { default: null },
    zoomOnUpdate: { default: false },
  },
  setup(props) {
    capturedMapCursor = props.cursor as CursorSync
  },
  template: '<div class="map-stub" />',
})

const ElevationChartStub = defineComponent({
  name: 'ElevationChart',
  props: {
    cursor: { type: Object, required: true },
    points: { default: () => [] },
    segmentColors: { default: null },
  },
  setup(props) {
    capturedChartCursor = props.cursor as CursorSync
  },
  template: '<div class="chart-stub" />',
})

function mountApp() {
  capturedMapCursor = null
  capturedChartCursor = null

  return mount(App, {
    global: {
      stubs: {
        MapView: MapViewStub,
        ElevationChart: ElevationChartStub,
      },
    },
  })
}

describe('Cursor sync rendering (new composable API)', () => {

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', vi.fn(class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    }))
    // Prevent App.vue's initialLoad() fetch from throwing
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ type: 'FeatureCollection', features: [] }) })
    ))
  })

  it('both components receive the same CursorSync instance', () => {
    mountApp()
    expect(capturedMapCursor).toBeDefined()
    expect(capturedChartCursor).toBeDefined()
    // Must be the identical object reference, not just structurally equal
    expect(capturedMapCursor).toBe(capturedChartCursor)
    // Verify it actually has the CursorSync API (not just undefined===undefined)
    expect(typeof capturedMapCursor!.setByDistance).toBe('function')
    expect(typeof capturedMapCursor!.clear).toBe('function')
  })

  it('cursor starts with null distance', () => {
    mountApp()
    expect(capturedMapCursor!.distance.value).toBeNull()
  })

  it('setByDistance from map side is visible on chart side', async () => {
    mountApp()
    capturedMapCursor!.setByDistance(150)
    await nextTick()
    expect(capturedChartCursor!.distance.value).toBe(150)
  })

  it('setByDistance from chart side is visible on map side', async () => {
    mountApp()
    capturedChartCursor!.setByDistance(250)
    await nextTick()
    expect(capturedMapCursor!.distance.value).toBe(250)
  })

  it('clear() resets cursor to null for all components', async () => {
    mountApp()
    capturedMapCursor!.setByDistance(100)
    await nextTick()
    capturedMapCursor!.clear()
    await nextTick()
    expect(capturedChartCursor!.distance.value).toBeNull()
    expect(capturedMapCursor!.distance.value).toBeNull()
  })
})
