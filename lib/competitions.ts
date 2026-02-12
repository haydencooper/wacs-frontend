import type { Match, Season } from "./types"

export interface CompetitionWinner {
  teamName: string
  matchWins: number
  matchLosses: number
  totalMatches: number
}

export interface TeamStanding {
  rank: number
  teamName: string
  wins: number
  losses: number
  totalMatches: number
  winPct: number
}

export type CompetitionStatus = "Active" | "Ended" | "Upcoming"

/**
 * Determine the status of a competition (season) based on its dates.
 */
export function getCompetitionStatus(season: Season): CompetitionStatus {
  const now = new Date()
  const start = new Date(season.start_date)
  if (start > now) return "Upcoming"
  if (!season.end_date) return "Active"
  const end = new Date(season.end_date)
  if (end >= now) return "Active"
  return "Ended"
}

/**
 * Build a sorted array of team standings from a season's matches.
 * Only considers completed, non-cancelled, non-forfeit matches.
 * Sorted by wins descending, then by win-loss differential as tiebreaker.
 */
export function getTeamStandings(seasonMatches: Match[]): TeamStanding[] {
  const completed = seasonMatches.filter(
    (m) => m.winner !== null && !m.cancelled && !m.forfeit,
  )

  // Count wins and losses per team name
  const teamMap = new Map<string, { wins: number; losses: number }>()

  function ensureTeam(name: string) {
    if (!teamMap.has(name)) teamMap.set(name, { wins: 0, losses: 0 })
  }

  for (const m of completed) {
    const winnerName = m.winner === 1 ? m.team1_string : m.team2_string
    const loserName = m.winner === 1 ? m.team2_string : m.team1_string

    ensureTeam(winnerName)
    ensureTeam(loserName)

    teamMap.get(winnerName)!.wins++
    teamMap.get(loserName)!.losses++
  }

  const standings: TeamStanding[] = Array.from(teamMap.entries()).map(
    ([name, record]) => {
      const total = record.wins + record.losses
      return {
        rank: 0, // filled below after sorting
        teamName: name,
        wins: record.wins,
        losses: record.losses,
        totalMatches: total,
        winPct: total > 0 ? (record.wins / total) * 100 : 0,
      }
    },
  )

  // Sort by wins desc, then win-loss differential desc, then name asc
  standings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    const aDiff = a.wins - a.losses
    const bDiff = b.wins - b.losses
    if (bDiff !== aDiff) return bDiff - aDiff
    return a.teamName.localeCompare(b.teamName)
  })

  // Assign ranks
  for (let i = 0; i < standings.length; i++) {
    standings[i].rank = i + 1
  }

  return standings
}

/**
 * Derive the competition winner (team with the most match wins).
 * Returns null if no completed matches exist.
 */
export function deriveCompetitionWinner(
  seasonMatches: Match[],
): CompetitionWinner | null {
  const standings = getTeamStandings(seasonMatches)
  if (standings.length === 0) return null

  const top = standings[0]
  return {
    teamName: top.teamName,
    matchWins: top.wins,
    matchLosses: top.losses,
    totalMatches: top.totalMatches,
  }
}
