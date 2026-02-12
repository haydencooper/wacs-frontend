import type { Match } from "./types"
import type { FormResult } from "@/components/recent-form"

/**
 * Determine the recent form (last N results) for a player given their matches
 * and which team they were on in each match.
 *
 * @param matches - Matches sorted newest-first
 * @param playerTeams - Map of matchId -> team number (1 or 2) the player was on
 * @param count - Number of results to return (default 5)
 */
export function computeRecentForm(
  matches: Match[],
  playerTeams: Map<number, number | null>,
  count = 5
): FormResult[] {
  const results: FormResult[] = []

  for (const match of matches) {
    if (results.length >= count) break
    if (match.cancelled) {
      results.push("C")
      continue
    }

    const playerTeam = playerTeams.get(match.id)
    if (playerTeam === null || playerTeam === undefined) continue

    if (match.winner === null) continue // ongoing match

    if (match.winner === playerTeam) {
      results.push("W")
    } else if (match.winner === 0) {
      results.push("D")
    } else {
      results.push("L")
    }
  }

  return results
}
