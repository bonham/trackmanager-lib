import { describe, test, expect, beforeEach } from 'vitest'
import { TrackData, TrackSegmentIndexed } from "@/lib/TrackData"
import type { TrackSegmentWithDistance } from '@/lib/TrackData';

describe("Simple", () => {
  test("Simple", () => {

    const track = new TrackData();

    // Add a segment
    track.addSegment([
      { lat: 48.1374, lon: 11.5755, elevation: 520 },
      { lat: 48.1375, lon: 11.5756, elevation: 2 }
    ]);

    // Add another point to segment 0
    track.addPointToSegment(0, 48.1376, 11.5757, 522);

    const segments = track.getSegments()
    expect(segments).toHaveLength(1)

  })
})

describe("TrackSegmentIndexed", () => {

  let track1: TrackSegmentWithDistance

  beforeEach(() => {
    track1 = [
      { lat: 1, lon: 1.2, elevation: 10, distanceFromStart: 0 },
      { lat: 2, lon: 2.2, elevation: 20, distanceFromStart: 100 },
      { lat: 3, lon: 3.2, elevation: 30, distanceFromStart: 200 },
      { lat: 4, lon: 4.2, elevation: 40, distanceFromStart: 300 },
      { lat: 5, lon: 5.2, elevation: 50, distanceFromStart: 400 },
      { lat: 6, lon: 6.2, elevation: 60, distanceFromStart: 500 },
      { lat: 7, lon: 7.2, elevation: 70, distanceFromStart: 600 },
      { lat: 8, lon: 8.2, elevation: 80, distanceFromStart: 700 },
      { lat: 9, lon: 9.2, elevation: 90, distanceFromStart: 800 },
      { lat: 10, lon: 2, elevation: 100, distanceFromStart: 900 }
    ]
  })

  test("Standard", () => {
    const tsi = new TrackSegmentIndexed(track1, 100)
    expect(tsi.getSegment()).toHaveLength(10)
    expect(tsi.getSegment()[0]!.distanceFromStart).toBe(0)
    expect(tsi.getSegment()[9]!.distanceFromStart).toBe(900)
    expect(tsi.minIndex()).toBe(0)
    expect(tsi.maxIndex()).toBe(9)
    expect(tsi.get(2)).toEqual({ lat: 3, lon: 3.2, elevation: 30, distanceFromStart: 200 })
    expect(tsi.indexList()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(tsi.get(10)).toBeUndefined()

  })

  test("Slice", () => {
    const initial = new TrackSegmentIndexed(track1, 100)
    const tsi = initial.slice(2, 5)
    expect(tsi.getSegment()).toHaveLength(3)
    expect(tsi.getSegment()[0]!.distanceFromStart).toBe(200)

    expect(tsi.minIndex()).toBe(2)
    expect(tsi.maxIndex()).toBe(4)
    expect(tsi.get(2)).toEqual({ lat: 3, lon: 3.2, elevation: 30, distanceFromStart: 200 })
    expect(tsi.indexList()).toEqual([2, 3, 4])
    expect(tsi.get(1)).toBeUndefined()
    expect(tsi.get(5)).toBeUndefined()

  })

  test("Slice 2", () => {
    const initial = new TrackSegmentIndexed(track1, 100)
    const tsi = initial.slice(0, 0)
    expect(tsi.length()).toBe(0)
    expect(tsi.indexList()).toEqual([])
    expect(tsi.getSegment()).toEqual([])
  })

  test("Slice throw", () => {
    const initial = new TrackSegmentIndexed(track1, 100)
    expect(() => initial.slice(0, 11)).toThrow(/bounds/)
    expect(() => initial.slice(-1, 11)).toThrow(/bounds/)
  })

  test("Startindex", () => {
    const tsi = new TrackSegmentIndexed(track1, 100, 11)

    expect(tsi.getSegment()).toHaveLength(10)
    expect(tsi.minIndex()).toBe(11)
    expect(tsi.maxIndex()).toBe(20)
    expect(tsi.get(13)).toEqual({ lat: 3, lon: 3.2, elevation: 30, distanceFromStart: 200 })
    expect(tsi.indexList()).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
    expect(tsi.get(21)).toBeUndefined()
    expect(tsi.get(10)).toBeUndefined()
  })

  test("Slice by internal index", () => {
    const initial = new TrackSegmentIndexed(track1, 100, 11)
    const tsi = initial.sliceByInternalIndex(2, 5)
    expect(tsi.minIndex()).toBe(13)
    expect(tsi.maxIndex()).toBe(15)
    expect(tsi.indexList()).toEqual([13, 14, 15])
    expect(tsi.get(13)).toEqual({ lat: 3, lon: 3.2, elevation: 30, distanceFromStart: 200 })
    expect(tsi.get(12)).toBeUndefined()
    expect(tsi.get(16)).toBeUndefined()
  })

  test("Zoom 1", () => {
    const initial = new TrackSegmentIndexed(track1, 100)
    const zoomed = initial.zoom(3, 1)
    const zoomedIndex = zoomed.indexList()
    expect(zoomedIndex).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  test("Zoom 0.6", () => {
    const initial = new TrackSegmentIndexed(track1, 100)
    const zoomed = initial.zoom(3, 0.6)
    const zoomedIndex = zoomed.indexList()
    expect(zoomedIndex).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

})