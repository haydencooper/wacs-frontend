import { describe, it, expect } from "vitest"
import { deriveWinner, normalizePlayer, computeRating } from "../api"

describe("deriveWinner", () => {
  it("returns 1 when rawWinner matches team1_id", () => {
    expect(deriveWinner(47, 47, 48, 0, 0)).toBe(1)
  })

  it("returns 2 when rawWinner matches team2_id", () => {
    expect(deriveWinner(48, 47, 48, 0, 0)).toBe(2)
  })

  it("returns rawWinner when already 1 or 2", () => {
    expect(deriveWinner(1, 0, 0, 0, 0)).toBe(1)
    expect(deriveWinner(2, 0, 0, 0, 0)).toBe(2)
  })

  it("returns null for null rawWinner with tied scores", () => {
    expect(deriveWinner(null, 47, 48, 5, 5)).toBeNull()
  })

  it("derives from scores when rawWinner is 0", () => {
    expect(deriveWinner(0, 0, 0, 13, 7)).toBe(1)
    expect(deriveWinner(0, 0, 0, 7, 13)).toBe(2)
  })

  it("uses score fallback when rawWinner is unmappable", () => {
    // rawWinner=99 doesn't match team1_id=47, team2_id=48, and is not 1 or 2
    expect(deriveWinner(99, 47, 48, 13, 7)).toBe(1)
    expect(deriveWinner(99, 47, 48, 7, 13)).toBe(2)
  })

  it("returns null when rawWinner is unmappable and scores are tied", () => {
    expect(deriveWinner(99, 47, 48, 10, 10)).toBeNull()
  })
})

describe("normalizePlayer", () => {
  it("normalizes basic player fields", () => {
    const raw = {
      steam_id: "76561198000000000",
      name: "TestPlayer",
      kills: 100,
      deaths: 50,
      assists: 30,
      roundsplayed: 200,
      k1: 10, k2: 5, k3: 2, k4: 1, k5: 0,
      v1: 3, v2: 2, v3: 1, v4: 0, v5: 0,
      headshot_kills: 40,
      wins: 7,
      total_maps: 10,
      points: 1200,
    }
    const player = normalizePlayer(raw)
    expect(player.steamId).toBe("76561198000000000")
    expect(player.name).toBe("TestPlayer")
    expect(player.kills).toBe(100)
    expect(player.deaths).toBe(50)
    expect(player.hsk).toBe(40)
    expect(player.points).toBe(1200)
  })

  it("computes HSP when not provided", () => {
    const raw = {
      steam_id: "123",
      name: "Test",
      kills: 100,
      deaths: 50,
      headshot_kills: 40,
      roundsplayed: 200,
      hsp: 0,
    }
    const player = normalizePlayer(raw)
    expect(player.hsp).toBe(40) // (40/100)*100
  })

  it("uses provided HSP when available", () => {
    const raw = {
      steam_id: "123",
      name: "Test",
      kills: 100,
      deaths: 50,
      headshot_kills: 40,
      roundsplayed: 200,
      hsp: 55.5,
    }
    const player = normalizePlayer(raw)
    expect(player.hsp).toBe(55.5)
  })

  it("defaults points to 1000", () => {
    const player = normalizePlayer({ steam_id: "123", name: "Test" })
    expect(player.points).toBe(1000)
  })
})

describe("computeRating", () => {
  it("returns 0 when roundsPlayed is 0", () => {
    expect(computeRating(10, 0, 5, 1, 0, 0, 0, 0)).toBe(0)
  })

  it("computes a positive rating for normal stats", () => {
    const rating = computeRating(20, 30, 15, 10, 5, 2, 1, 0)
    expect(rating).toBeGreaterThan(0)
    expect(rating).toBeLessThan(3)
  })

  it("returns higher rating for better performance", () => {
    const goodRating = computeRating(30, 20, 5, 15, 8, 3, 1, 0)
    const badRating = computeRating(5, 20, 18, 2, 0, 0, 0, 0)
    expect(goodRating).toBeGreaterThan(badRating)
  })
})
