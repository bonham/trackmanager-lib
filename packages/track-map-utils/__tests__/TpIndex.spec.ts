import { describe, test, expect } from 'vitest'
import { TrackPointIndex } from '@bonham/track-map-utils'

describe('TrackPointIndex', () => {
  test('first', () => {
    const p1 = {
      lon: 21.648141756981374,
      lat: 4.337979124072646
    }
    const p2 = {
      lon: 21.680449411286418,
      lat: 4.34016985133006
    }

    // p3 is nearer p1
    const p3 = {
      lon: 21.663143757903242,
      lat: 4.333632961409833
    }

    const pointList = [p1, p2]

    const tpi = new TrackPointIndex(pointList)
    const foundIdx = tpi.getNearestIndex(p3)

    expect(foundIdx).toBe(0)
  })

  test('getNearestIndex returns null for empty index', () => {
    const tpi = new TrackPointIndex([])
    const result = tpi.getNearestIndex({ lon: 10, lat: 50 })
    expect(result).toBeNull()
  })

  test('getNearestPoint returns the point object for the nearest index', () => {
    const p1 = { lon: 8.0, lat: 48.0 }
    const p2 = { lon: 9.0, lat: 49.0 }
    const tpi = new TrackPointIndex([p1, p2])
    const result = tpi.getNearestPoint({ lon: 8.1, lat: 48.1 })
    expect(result).toEqual(p1)
  })

  test('getNearestPoint returns null for empty index', () => {
    const tpi = new TrackPointIndex([])
    const result = tpi.getNearestPoint({ lon: 10, lat: 50 })
    expect(result).toBeNull()
  })
})
