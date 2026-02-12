import { describe, it, expect } from "vitest"
import {
  deriveCompetitionWinner,
  getCompetitionStatus,
  getTeamStandings,
} from "../competitions"
import type { Match, Season } from "../types"

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 1,
    team1_id: 10,
    team2_id: 20,
    winner: null,
    team1_score: 0,
    team2_score: 0,
    team1_mapscore: null,
    team2_mapscore: null,
    team1_string: "Team Alpha",
    team2_string: "Team Bravo",
    cancelled: false,
    forfeit: false,
    start_time: "2025-01-10T12:00:00Z",
    end_time: null,
    title: "Match 1",
    max_maps: 1,
    season_id: 1,
    is_pug: false,
    ...overrides,
  }
}

function makeSeason(overrides: Partial<Season> = {}): Season {
  return {
    id: 1,
    name: "Season 1",
    start_date: "2025-01-01T00:00:00Z",
    end_date: "2025-06-01T00:00:00Z",
    ...overrides,
  }
}

describe("getCompetitionStatus", () => {
  it('returns "Upcoming" for a season that has not started', () => {
    const season = makeSeason({
      start_date: "2099-01-01T00:00:00Z",
      end_date: "2099-06-01T00:00:00Z",
    })
    expect(getCompetitionStatus(season)).toBe("Upcoming")
  })

  it('returns "Active" for a season currently in progress', () => {
    const now = new Date()
    const season = makeSeason({
      start_date: new Date(now.getTime() - 86400000).toISOString(),
      end_date: new Date(now.getTime() + 86400000).toISOString(),
    })
    expect(getCompetitionStatus(season)).toBe("Active")
  })

  it('returns "Active" for a season with no end date', () => {
    const now = new Date()
    const season = makeSeason({
      start_date: new Date(now.getTime() - 86400000).toISOString(),
      end_date: null,
    })
    expect(getCompetitionStatus(season)).toBe("Active")
  })

  it('returns "Ended" for a season that has ended', () => {
    const season = makeSeason({
      start_date: "2020-01-01T00:00:00Z",
      end_date: "2020-06-01T00:00:00Z",
    })
    expect(getCompetitionStatus(season)).toBe("Ended")
  })
})

describe("getTeamStandings", () => {
  it("returns empty array for no matches", () => {
    expect(getTeamStandings([])).toEqual([])
  })

  it("ignores cancelled and forfeit matches", () => {
    const matches = [
      makeMatch({ id: 1, winner: 1, cancelled: true }),
      makeMatch({ id: 2, winner: 2, forfeit: true }),
    ]
    expect(getTeamStandings(matches)).toEqual([])
  })

  it("ignores matches with no winner", () => {
    const matches = [makeMatch({ id: 1, winner: null })]
    expect(getTeamStandings(matches)).toEqual([])
  })

  it("correctly counts wins and losses", () => {
    const matches = [
      makeMatch({ id: 1, winner: 1 }), // Alpha wins
      makeMatch({ id: 2, winner: 1 }), // Alpha wins
      makeMatch({ id: 3, winner: 2 }), // Bravo wins
    ]
    const standings = getTeamStandings(matches)
    expect(standings).toHaveLength(2)
    expect(standings[0]).toMatchObject({
      rank: 1,
      teamName: "Team Alpha",
      wins: 2,
      losses: 1,
      totalMatches: 3,
    })
    expect(standings[1]).toMatchObject({
      rank: 2,
      teamName: "Team Bravo",
      wins: 1,
      losses: 2,
      totalMatches: 3,
    })
  })

  it("handles multiple teams", () => {
    const matches = [
      makeMatch({
        id: 1,
        winner: 1,
        team1_string: "Team Alpha",
        team2_string: "Team Bravo",
      }),
      makeMatch({
        id: 2,
        winner: 2,
        team1_string: "Team Alpha",
        team2_string: "Team Charlie",
      }),
      makeMatch({
        id: 3,
        winner: 1,
        team1_string: "Team Bravo",
        team2_string: "Team Charlie",
      }),
    ]
    const standings = getTeamStandings(matches)
    expect(standings).toHaveLength(3)
    // Alpha: 1W-1L, Bravo: 1W-1L, Charlie: 0W-2L
    // Tie between Alpha and Bravo (both 1W), differential both 0, sorted by name
    expect(standings[0].teamName).toBe("Team Alpha")
    expect(standings[1].teamName).toBe("Team Bravo")
    expect(standings[2].teamName).toBe("Team Charlie")
  })

  it("uses win-loss differential as tiebreaker", () => {
    const matches = [
      // Alpha vs Bravo: Alpha wins
      makeMatch({ id: 1, winner: 1, team1_string: "Team Alpha", team2_string: "Team Bravo" }),
      // Charlie vs Delta: Charlie wins
      makeMatch({ id: 2, winner: 1, team1_string: "Team Charlie", team2_string: "Team Delta" }),
      // Alpha vs Charlie: Alpha wins
      makeMatch({ id: 3, winner: 1, team1_string: "Team Alpha", team2_string: "Team Charlie" }),
    ]
    const standings = getTeamStandings(matches)
    // Alpha: 2W-0L (diff: +2), Charlie: 1W-1L (diff: 0), Bravo: 0W-1L (diff: -1), Delta: 0W-1L (diff: -1)
    expect(standings[0].teamName).toBe("Team Alpha")
    expect(standings[1].teamName).toBe("Team Charlie")
    // Bravo and Delta both 0W-1L, sorted alphabetically
    expect(standings[2].teamName).toBe("Team Bravo")
    expect(standings[3].teamName).toBe("Team Delta")
  })

  it("calculates win percentage correctly", () => {
    const matches = [
      makeMatch({ id: 1, winner: 1 }),
      makeMatch({ id: 2, winner: 1 }),
      makeMatch({ id: 3, winner: 2 }),
      makeMatch({ id: 4, winner: 1 }),
    ]
    const standings = getTeamStandings(matches)
    expect(standings[0].winPct).toBe(75) // Alpha: 3W/4 = 75%
    expect(standings[1].winPct).toBe(25) // Bravo: 1W/4 = 25%
  })
})

describe("deriveCompetitionWinner", () => {
  it("returns null for no matches", () => {
    expect(deriveCompetitionWinner([])).toBeNull()
  })

  it("returns null when all matches are cancelled", () => {
    const matches = [
      makeMatch({ id: 1, winner: 1, cancelled: true }),
      makeMatch({ id: 2, winner: 2, cancelled: true }),
    ]
    expect(deriveCompetitionWinner(matches)).toBeNull()
  })

  it("returns the team with the most wins", () => {
    const matches = [
      makeMatch({ id: 1, winner: 1 }), // Alpha wins
      makeMatch({ id: 2, winner: 1 }), // Alpha wins
      makeMatch({ id: 3, winner: 2 }), // Bravo wins
    ]
    const winner = deriveCompetitionWinner(matches)
    expect(winner).toMatchObject({
      teamName: "Team Alpha",
      matchWins: 2,
      matchLosses: 1,
      totalMatches: 3,
    })
  })

  it("returns a winner from a single match", () => {
    const matches = [makeMatch({ id: 1, winner: 2 })]
    const winner = deriveCompetitionWinner(matches)
    expect(winner).toMatchObject({
      teamName: "Team Bravo",
      matchWins: 1,
      matchLosses: 0,
    })
  })

  it("returns the correct winner when all matches are won by same team", () => {
    const matches = [
      makeMatch({ id: 1, winner: 2 }),
      makeMatch({ id: 2, winner: 2 }),
      makeMatch({ id: 3, winner: 2 }),
    ]
    const winner = deriveCompetitionWinner(matches)
    expect(winner).toMatchObject({
      teamName: "Team Bravo",
      matchWins: 3,
      matchLosses: 0,
    })
  })
})
