import { Suspense } from "react"
import { fetchLeaderboard, fetchMatches, g5Fetch, unwrapArray } from "@/lib/api"
import { fetchSteamAvatars } from "@/lib/steam"
import { PlayerComparison } from "@/components/player-comparison"
import { GitCompare } from "lucide-react"
import type { Match } from "@/lib/types"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Compare Players - WACS",
  description: "Compare two players head-to-head across all stats.",
}

function ComparisonLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 lg:px-8">
      <div className="flex flex-col items-center gap-4 py-24">
        <GitCompare className="h-8 w-8 animate-pulse text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading player data...</p>
      </div>
    </div>
  )
}

/** 
 * Pre-compute head-to-head data for all completed matches.
 * Returns a map: matchId -> Set of steamIds that played in it, plus which team each was on.
 */
async function computeMatchParticipants(
  matches: Match[]
): Promise<Map<number, Map<string, number>>> {
  const result = new Map<number, Map<string, number>>()
  
  // Check all completed non-cancelled matches for accurate H2H data
  const candidates = matches
    .filter((m) => m.winner !== null && !m.cancelled)
    .sort((a, b) => b.id - a.id)
  
  const BATCH_SIZE = 10
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(async (match) => {
        try {
          const data = await g5Fetch<unknown>(
            `/api/playerstats/match/${match.id}`,
            { revalidate: 120 }
          )
          if (!data) return
          const arr = unwrapArray(data, "playerstats", "playerStats")
          // First pass: collect all unique team_ids from player stats
          const rawTeamData: { steamId: string; teamId: number }[] = []
          for (const row of arr as Record<string, unknown>[]) {
            const steamId = String(row.steam_id ?? row.steamId ?? "")
            const teamId = Number(row.team_id ?? 0)
            if (steamId && teamId > 0) {
              rawTeamData.push({ steamId, teamId })
            }
          }
          
          if (rawTeamData.length === 0) return
          
          // Get unique team IDs from player stats
          const uniqueTeamIds = [...new Set(rawTeamData.map((r) => r.teamId))]
          
          // Build a mapping from raw team_id -> team number (1 or 2)
          let teamIdToNumber: Map<number, number>
          
          if (match.team1_id > 0 && match.team2_id > 0) {
            // Match has valid team IDs - map directly
            teamIdToNumber = new Map([
              [match.team1_id, 1],
              [match.team2_id, 2],
            ])
          } else if (uniqueTeamIds.length === 2) {
            // PUG match: team1_id/team2_id are 0, but player stats have 2 distinct team_ids
            // Map the lower team_id to team 1, higher to team 2 (consistent ordering)
            const sorted = [...uniqueTeamIds].sort((a, b) => a - b)
            teamIdToNumber = new Map([
              [sorted[0], 1],
              [sorted[1], 2],
            ])
          } else {
            // Can't determine teams
            return
          }
          
          const playerTeamMap = new Map<string, number>()
          for (const { steamId, teamId } of rawTeamData) {
            const teamNum = teamIdToNumber.get(teamId)
            if (teamNum) {
              playerTeamMap.set(steamId, teamNum)
            }
          }
          
          // For PUG matches where match.winner might be a raw team_id (not 1 or 2),
          // re-derive the winning team number from the team mapping
          if (playerTeamMap.size > 0) {
            // Store a special key "__winner" with the winning team number
            if (match.winner !== null) {
              // match.winner is already 1 or 2 if normalizeMatch could map it
              if (match.winner === 1 || match.winner === 2) {
                playerTeamMap.set("__winner", match.winner)
              } else {
                // winner is a raw team_id, map it through our teamIdToNumber
                const winnerTeamNum = teamIdToNumber.get(match.winner)
                if (winnerTeamNum) {
                  playerTeamMap.set("__winner", winnerTeamNum)
                }
              }
            }
            // Also try to derive winner from match scores as ultimate fallback
            if (!playerTeamMap.has("__winner")) {
              const s1 = match.team1_mapscore ?? match.team1_score
              const s2 = match.team2_mapscore ?? match.team2_score
              if (s1 > s2) playerTeamMap.set("__winner", 1)
              else if (s2 > s1) playerTeamMap.set("__winner", 2)
            }
            
            result.set(match.id, playerTeamMap)
          }
        } catch {
          // skip
        }
      })
    )
  }
  
  return result
}

export interface H2HData {
  matchCount: number
  player1Wins: number
  player2Wins: number
}

async function ComparisonContent() {
  const [players, matches] = await Promise.all([
    fetchLeaderboard(),
    fetchMatches(),
  ])
  const steamIds = players.map((p) => p.steamId)
  const avatars = await fetchSteamAvatars(steamIds)

  // Pre-compute match participants for h2h
  const matchParticipants = await computeMatchParticipants(matches)
  
  // Serialize the match participants for the client component
  const serializedParticipants: Record<number, Record<string, number>> = {}
  for (const [matchId, playerMap] of matchParticipants) {
    const obj: Record<string, number> = {}
    for (const [sid, team] of playerMap) {
      obj[sid] = team
    }
    serializedParticipants[matchId] = obj
  }

  return (
    <PlayerComparison 
      players={players} 
      avatars={avatars} 
      matches={matches} 
      matchParticipants={serializedParticipants}
    />
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<ComparisonLoading />}>
      <ComparisonContent />
    </Suspense>
  )
}
