import { Suspense } from "react"
import { fetchLeaderboard, fetchMatches, g5Fetch } from "@/lib/api"
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
  
  // Only check completed non-cancelled matches, limit to most recent 100 for performance
  const candidates = matches
    .filter((m) => m.winner !== null && !m.cancelled)
    .sort((a, b) => b.id - a.id)
    .slice(0, 100)
  
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
          // unwrap manually to avoid circular import issues
          const arr = Array.isArray(data) 
            ? data 
            : Array.isArray((data as Record<string, unknown>).playerstats) 
              ? (data as Record<string, unknown>).playerstats as Record<string, unknown>[]
              : Array.isArray((data as Record<string, unknown>).playerStats)
                ? (data as Record<string, unknown>).playerStats as Record<string, unknown>[]
                : []
          const playerTeamMap = new Map<string, number>()
          for (const row of arr as Record<string, unknown>[]) {
            const steamId = String(row.steam_id ?? row.steamId ?? "")
            const teamId = Number(row.team_id ?? 0)
            if (steamId) {
              // Convert team_id to team number (1 or 2)
              if (teamId === match.team1_id) {
                playerTeamMap.set(steamId, 1)
              } else if (teamId === match.team2_id) {
                playerTeamMap.set(steamId, 2)
              }
            }
          }
          if (playerTeamMap.size > 0) {
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
