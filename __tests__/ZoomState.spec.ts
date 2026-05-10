import { ZoomPanState } from "@la-rampa/elevation-chart";
import { beforeEach, describe, test, expect } from "vitest";

describe("ZoomState", () => {
  let zs: ZoomPanState
  beforeEach(() => {
    zs = new ZoomPanState(Math.log(2), { start: 0, end: 10 })
  })
  test("Initial state", () => {
    expect(zs.hasChanged()).toBeFalsy()
  })
})