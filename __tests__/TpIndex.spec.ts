import { describe, test, expect } from 'vitest'
import { TrackPointIndex } from '@la-rampa/track-map-utils'

describe("TrackPointIndex", () => {
  test("first", () => {

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
})

