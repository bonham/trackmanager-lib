import { describe, test, expect, vi, beforeEach } from 'vitest'
import { MarkerOnTrack } from '@bonham/track-map-utils'
import type { Coordinate } from 'ol/coordinate'

const { mockClear, mockAddFeature, MockVectorSource, MockPoint, MockFeature } = vi.hoisted(() => {
  const mockClear = vi.fn()
  const mockAddFeature = vi.fn()
  const MockVectorSource = vi.fn(() => ({ clear: mockClear, addFeature: mockAddFeature }))
  const MockPoint = vi.fn()
  const MockFeature = vi.fn()
  return { mockClear, mockAddFeature, MockVectorSource, MockPoint, MockFeature }
})

vi.mock('ol/source/Vector', () => ({ default: MockVectorSource }))
vi.mock('ol/Feature', () => ({ default: MockFeature }))
vi.mock('ol/geom/Point', () => ({ default: MockPoint }))

describe('MarkerOnTrack', () => {
  let source: ReturnType<typeof MockVectorSource>
  let marker: MarkerOnTrack

  beforeEach(() => {
    vi.clearAllMocks()
    source = MockVectorSource()
    marker = new MarkerOnTrack(source as never)
  })

  test('constructor stores the vector source', () => {
    expect(marker.markerSource).toBe(source)
  })

  test('coordinates are null initially', () => {
    expect(marker.coordinates).toBeNull()
  })

  describe('setCoordinates', () => {
    test('stores the coordinate array', () => {
      const coords: Coordinate[] = [[1, 2], [3, 4]]
      marker.setCoordinates(coords)
      expect(marker.coordinates).toEqual([[1, 2], [3, 4]])
    })
  })

  describe('clear', () => {
    test('calls markerSource.clear()', () => {
      marker.clear()
      expect(mockClear).toHaveBeenCalledOnce()
    })
  })

  describe('setByIndex', () => {
    const coords: Coordinate[] = [[10, 20], [30, 40], [50, 60]]

    beforeEach(() => {
      marker.setCoordinates(coords)
    })

    test('clears source and adds a Feature at the given index', () => {
      marker.setByIndex(1)
      expect(mockClear).toHaveBeenCalled()
      expect(MockPoint).toHaveBeenCalledWith([30, 40])
      expect(MockFeature).toHaveBeenCalled()
      expect(mockAddFeature).toHaveBeenCalledOnce()
    })

    test('works for index 0', () => {
      marker.setByIndex(0)
      expect(MockPoint).toHaveBeenCalledWith([10, 20])
    })

    test('silent no-op when coordinates are not set', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      const noCoordMarker = new MarkerOnTrack(source as never)
      noCoordMarker.setByIndex(0)
      expect(mockAddFeature).not.toHaveBeenCalled()
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    test('silent no-op when index is out of bounds', () => {
      marker.setByIndex(99)
      expect(mockAddFeature).not.toHaveBeenCalled()
    })
  })
})
