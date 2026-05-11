import { describe, test, expect, vi, beforeEach } from 'vitest'
import { getMapElements } from '@bonham/track-map-utils'

vi.mock('ol/source/Vector', () => ({
  default: vi.fn(() => ({ clear: vi.fn(), addFeature: vi.fn() })),
}))

vi.mock('ol/layer', () => ({
  Vector: vi.fn(() => ({})),
}))

vi.mock('ol/style/Style', () => ({
  default: vi.fn(() => ({})),
}))

vi.mock('ol/style/Stroke', () => ({
  default: vi.fn(() => ({})),
}))

vi.mock('ol/style/Fill', () => ({
  default: vi.fn(() => ({})),
}))

vi.mock('ol/style/Circle', () => ({
  default: vi.fn(() => ({})),
}))

describe('getMapElements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns all six expected keys', () => {
    const result = getMapElements()
    expect(result).toHaveProperty('baseTrackVectorSource')
    expect(result).toHaveProperty('baseTrackVectorLayer')
    expect(result).toHaveProperty('overlayVectorSource')
    expect(result).toHaveProperty('overlayVectorLayer')
    expect(result).toHaveProperty('markerSource')
    expect(result).toHaveProperty('markerLayer')
  })

  test('each call returns independent instances', () => {
    const a = getMapElements()
    const b = getMapElements()
    expect(a.baseTrackVectorSource).not.toBe(b.baseTrackVectorSource)
    expect(a.markerSource).not.toBe(b.markerSource)
  })

  test('baseTrackVectorSource and markerSource are distinct objects', () => {
    const { baseTrackVectorSource, markerSource } = getMapElements()
    expect(baseTrackVectorSource).not.toBe(markerSource)
  })
})
