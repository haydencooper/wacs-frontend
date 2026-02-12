import { describe, it, expect } from "vitest"
import { getMapDisplayName, getMapMeta } from "../maps"

describe("getMapDisplayName", () => {
  it("returns known map display name", () => {
    expect(getMapDisplayName("de_inferno")).toBe("Inferno")
    expect(getMapDisplayName("de_dust2")).toBe("Dust II")
    expect(getMapDisplayName("de_mirage")).toBe("Mirage")
  })

  it("capitalizes unknown de_ maps", () => {
    expect(getMapDisplayName("de_newmap")).toBe("Newmap")
  })

  it("returns null for non-map strings", () => {
    expect(getMapDisplayName("something")).toBeNull()
  })

  it("returns null for null/undefined input", () => {
    expect(getMapDisplayName(null)).toBeNull()
    expect(getMapDisplayName(undefined)).toBeNull()
  })
})

describe("getMapMeta", () => {
  it("returns meta for known maps", () => {
    const meta = getMapMeta("de_inferno")
    expect(meta.code).toBe("IF")
    expect(meta.color).toContain("oklch")
  })

  it("returns fallback for unknown maps", () => {
    const meta = getMapMeta("de_newmap")
    expect(meta.code).toBe("NE")
    expect(meta.color).toContain("oklch")
  })

  it("returns fallback for null/undefined", () => {
    const meta = getMapMeta(null)
    expect(meta.code).toBe("??")
  })
})
