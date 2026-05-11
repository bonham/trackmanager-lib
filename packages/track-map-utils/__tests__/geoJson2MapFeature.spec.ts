import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { geojsonLineString2OpenLayersLineString, geojsonMultiLineString2OpenLayersMultiLineString } from '@bonham/track-map-utils'
import type { Feature as GeoJsonFeature, LineString as GeoJsonLineString, MultiLineString as GeoJsonMultiLineString } from 'geojson'

const mockReadFeature = vi.fn()

vi.mock('ol/format/GeoJSON', () => ({
  default: vi.fn().mockImplementation(() => ({
    readFeature: mockReadFeature,
  })),
}))

vi.mock('ol/Feature', () => ({
  default: vi.fn(),
}))

describe('geoJson2MapFeature', () => {
  const mockOlFeature = { id: 'mock-feature' }

  beforeEach(() => {
    mockReadFeature.mockReturnValue(mockOlFeature)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('geojsonLineString2OpenLayersLineString', () => {
    const lineStringFeature: GeoJsonFeature<GeoJsonLineString> = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[8.0, 48.0], [8.1, 48.1]],
      },
      properties: null,
    }

    test('calls readFeature with correct projection options', () => {
      geojsonLineString2OpenLayersLineString(lineStringFeature)
      expect(mockReadFeature).toHaveBeenCalledWith(lineStringFeature, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      })
    })

    test('returns the result from readFeature', () => {
      const result = geojsonLineString2OpenLayersLineString(lineStringFeature)
      expect(result).toBe(mockOlFeature)
    })
  })

  describe('geojsonMultiLineString2OpenLayersMultiLineString', () => {
    const multiLineFeature: GeoJsonFeature<GeoJsonMultiLineString> = {
      type: 'Feature',
      geometry: {
        type: 'MultiLineString',
        coordinates: [[[8.0, 48.0], [8.1, 48.1]], [[9.0, 49.0], [9.1, 49.1]]],
      },
      properties: null,
    }

    test('calls readFeature with correct projection options', () => {
      geojsonMultiLineString2OpenLayersMultiLineString(multiLineFeature)
      expect(mockReadFeature).toHaveBeenCalledWith(multiLineFeature, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      })
    })

    test('returns the result from readFeature', () => {
      const result = geojsonMultiLineString2OpenLayersMultiLineString(multiLineFeature)
      expect(result).toBe(mockOlFeature)
    })
  })
})
