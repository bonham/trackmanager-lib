import { detectEqualElements } from "@/lib/InterpolateSegment";
import { describe, test, expect } from 'vitest'

describe("detectEqualElements", () => {
  test("Empty", () => {
    const input: number[] = []
    const o = detectEqualElements(input)
    expect(o).toEqual([])
  })
  test("One", () => {
    const input = [1, 4, 7, 7, 9]
    const o = detectEqualElements(input)
    expect(o).toEqual([3])
  })
  test("Multiple", () => {
    const input = [1, 1, 4, 7, 7, 9, 9, 2, 2, 2]
    const o = detectEqualElements(input)
    expect(o).toEqual([1, 4, 6, 8, 9])
  })
}) 