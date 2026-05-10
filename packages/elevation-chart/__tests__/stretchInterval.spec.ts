import { describe, test, expect } from 'vitest'
import { stretchInterval } from '@trackmanager-lib/elevation-chart'

describe('AppHelpers', () => {
  test('stretch_interval1', () => {
    const k = 40
    const l = 50
    const m = 45
    const f = 1.3
    const { start, end } = stretchInterval(k, l, m, f)
    expect(start).toEqual(38.5)
    expect(end).toEqual(51.5)
  })

  test('stretch_interval 2', () => {
    const k = 0
    const l = 9
    const m = 5
    const f = 1
    const i_min = 0
    const i_max = 9

    const { start, end } = stretchInterval(k, l, m, f, i_min, i_max)
    expect(start).toEqual(0)
    expect(end).toEqual(9)
  })

  test('stretch_interval hits default min limit of 20', () => {
    const k = 0
    const l = 100
    const m = 10
    const f = 0.133

    const { start, end } = stretchInterval(k, l, m, f)
    expect(end - start).toEqual(20)
  })

  test('stretch_interval overcome min limit', () => {
    const k = 0
    const l = 100
    const m = 10
    const f = 0.133

    const { start, end } = stretchInterval(k, l, m, f, undefined, undefined, 1)
    expect(end - start).toBeCloseTo(13.3)
    expect(start).toBeCloseTo(8.67)
    expect(end).toBeCloseTo(21.97)
  })

  test('zoom in when interval smaller than min interval - do nothing', () => {
    const k = 2
    const l = 10
    const m = 4
    const f = 0.5

    const { start, end } = stretchInterval(k, l, m, f)
    expect(start).toEqual(2)
    expect(end).toEqual(10)
  })

  test('zoom in with m not in center and start not zero', () => {
    const k = 100
    const l = 500
    const m = 150
    const f = 0.8

    const { start, end } = stretchInterval(k, l, m, f)
    expect(start).toEqual(110)
    expect(end).toEqual(430)
    expect(end - start).toEqual(320)
  })
})
