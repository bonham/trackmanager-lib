import { describe, test, expect } from 'vitest'
import { stretchInterval } from '@la-rampa/elevation-chart';
import { SegmentTransformManager } from '@/lib/app/transformHelpers';
import type { TrackSegmentWithDistance } from '@/lib/TrackData';
import { TrackSegmentIndexed } from "@/lib/TrackData"


describe("AppHelpers", () => {
  test("stretch_interval1", () => {
    const k = 40;
    const l = 50;
    const m = 45;
    const f = 1.3;
    const { start, end } = stretchInterval(k, l, m, f);
    expect(start).toEqual(38.5);
    expect(end).toEqual(51.5);
  })

  test("stretch_interval 2", () => {
    const k = 0;
    const l = 9;
    const m = 5;
    const f = 1;
    const i_min = 0;
    const i_max = 9

    const { start, end } = stretchInterval(k, l, m, f, i_min, i_max);
    expect(start).toEqual(0);
    expect(end).toEqual(9);
  })

  test("stretch_interval hits default min limit of 20", () => {
    const k = 0;
    const l = 100;
    const m = 10;
    const f = 0.133;

    const { start, end } = stretchInterval(k, l, m, f);
    expect(end - start).toEqual(20);
  })

  test("stretch_interval overcome min limit", () => {
    const k = 0;
    const l = 100;
    const m = 10;
    const f = 0.133;

    const { start, end } = stretchInterval(k, l, m, f, undefined, undefined, 1);
    expect(end - start).toBeCloseTo(13.3);
    expect(start).toBeCloseTo(8.67)
    expect(end).toBeCloseTo(21.97)
  })

  test("zoom in when interval smaller than min interval - do nothing", () => {
    const k = 2;
    const l = 10;
    const m = 4;
    const f = 0.5;

    const { start, end } = stretchInterval(k, l, m, f);
    expect(start).toEqual(2);
    expect(end).toEqual(10);
  })

  test("zoom in with m not in center and start not zero", () => {
    const k = 100;
    const l = 500;
    const m = 150;
    const f = 0.8;

    const { start, end } = stretchInterval(k, l, m, f);
    expect(start).toEqual(110);
    expect(end).toEqual(430);
    expect(end - start).toEqual(320)
  })

})

describe("Zoom Manager", () => {
  let track1: TrackSegmentWithDistance
  let tsi: TrackSegmentIndexed

  beforeEach(() => {
    track1 = [
      { lat: 1, lon: 1.2, elevation: 10, distanceFromStart: 0 },    // 0 index
      { lat: 2, lon: 2.2, elevation: 20, distanceFromStart: 100 },  // 1
      { lat: 3, lon: 3.2, elevation: 30, distanceFromStart: 200 },  // 2
      { lat: 4, lon: 4.2, elevation: 40, distanceFromStart: 300 },  // 3
      { lat: 5, lon: 5.2, elevation: 50, distanceFromStart: 400 },  // 4
      { lat: 6, lon: 6.2, elevation: 60, distanceFromStart: 500 },  // 5
      { lat: 7, lon: 7.2, elevation: 70, distanceFromStart: 600 },  // 6
      { lat: 8, lon: 8.2, elevation: 80, distanceFromStart: 700 },  // 7
      { lat: 9, lon: 9.2, elevation: 90, distanceFromStart: 800 },  // 8
      { lat: 10, lon: 2, elevation: 100, distanceFromStart: 900 }   // 9
    ]
    tsi = new TrackSegmentIndexed(track1, 100)
  })


  test("Factor 1 yields same", () => {
    const zm = new SegmentTransformManager(tsi)
    const zoomedSegment = zm.applyFactor(3, 1)
    expect(zoomedSegment.length()).toEqual(10)
    expect(zoomedSegment.getSegment()).toEqual(track1)
  })

  test("Other center", () => {
    const zm = new SegmentTransformManager(tsi)
    const zoomedSegment = zm.applyFactor(5, 1)
    expect(zoomedSegment.length()).toEqual(10)
    expect(zoomedSegment.getSegment()).toEqual(track1)

  })

})
