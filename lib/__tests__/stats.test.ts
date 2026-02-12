import { describe, it, expect } from "vitest"
import { calcKD, calcKDNumeric, calcWinPct, calcWinPctNumeric } from "../stats"

describe("calcKD", () => {
  it("returns formatted K/D ratio", () => {
    expect(calcKD(20, 10)).toBe("2.00")
  })

  it("returns 0.00 for zero deaths", () => {
    expect(calcKD(5, 0)).toBe("0.00")
  })

  it("handles fractional K/D", () => {
    expect(calcKD(7, 3)).toBe("2.33")
  })
})

describe("calcKDNumeric", () => {
  it("returns numeric K/D ratio", () => {
    expect(calcKDNumeric(20, 10)).toBe(2)
  })

  it("returns 0 for zero deaths", () => {
    expect(calcKDNumeric(5, 0)).toBe(0)
  })
})

describe("calcWinPct", () => {
  it("returns win percentage string", () => {
    expect(calcWinPct(7, 10)).toBe("70%")
  })

  it("returns 0% for zero total maps", () => {
    expect(calcWinPct(0, 0)).toBe("0%")
  })

  it("returns 100% for all wins", () => {
    expect(calcWinPct(5, 5)).toBe("100%")
  })
})

describe("calcWinPctNumeric", () => {
  it("returns numeric win percentage", () => {
    expect(calcWinPctNumeric(3, 4)).toBe(75)
  })

  it("returns 0 for zero total maps", () => {
    expect(calcWinPctNumeric(0, 0)).toBe(0)
  })
})
