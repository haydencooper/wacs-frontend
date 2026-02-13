import type { Metadata } from "next"
import { fetchPlayerStats, fetchLeaderboard, fetchPlayerRecentMatches, fetchPlayerTeamInMatches, fetchSeasons, fetchMatches, fetchMatchPlayerStats, fetchMapStats, g5Fetch, unwrapArray, computeRating } from "@/lib/api"
import { fetchSteamAvatar } from "@/lib/steam"
import { deriveCompetitionWinner, getCompetitionStatus } from "@/lib/competitions"
import { MatchCardWithOutcome } from "@/components/match-card-with-outcome"
import { SteamAvatar } from "@/components/steam-avatar"
import { PlayerBadges } from "@/components/player-badges"
import { RecentForm } from "@/components/recent-form"
import { computeRecentForm } from "@/lib/recent-form"
import { PlayerMapStats, type MapPerformance } from "@/components/player-map-stats"
import { RatingSparkline, type RatingPoint } from "@/components/rating-sparkline"
import { cn } from "@/lib/utils"
import {
  Crosshair,
  Target,
  Skull,
  Hand,
  Trophy,
  TrendingUp,
  Zap,
  Crown,
  GitCompare,
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ShareButton } from "@/components/share-button"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ steamId: string }> }): Promise<Metadata> {
  const { steamId } = await params
  try {
    const player = await fetchPlayerStats(steamId)
    const name = player.name || `Player ${steamId}`
    const kd = player.deaths > 0 ? (player.kills / player.deaths).toFixed(2) : "N/A"
    return {
      title: name,
      description: `${name}'s WACS profile -- ${player.wins}W/${player.losses}L, ${kd} K/D across ${player.totalMatches ?? player.wins + player.losses} matches.`,
      openGraph: {
        title: `${name} - WACS Player Profile`,
        description: `${player.wins} wins, ${player.losses} losses, ${kd} K/D ratio.`,
      },
    }
  } catch {
    return { title: "Player Profile" }
  }
}

function StatBlock({
  label,
  value,
  icon: Icon,
  highlight = false,
  color,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  highlight?: boolean
  color?: "win" | "loss" | "primary"
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-border/80">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
      </div>
      <span className={cn(
        "font-heading text-xl font-semibold",
        color === "win" ? "text-win"
          : color === "loss" ? "text-loss"
          : "text-foreground"
      )}>
        {value}
      </span>
    </div>
  )
}

function ProgressBar({
  label,
  value,
  max,
  color = "primary",
}: {
  label: string
  value: number
  max: number
  color?: "primary" | "muted"
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-card/80">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              color === "primary" ? "bg-foreground" : "bg-muted-foreground/50"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-8 text-right font-mono text-sm font-semibold text-foreground">
          {value}
        </span>
      </div>
    </div>
  )
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ steamId: string }>
}) {
  const { steamId } = await params
  const [player, leaderboard, recentMatches, seasons, allMatches] = await Promise.all([
    fetchPlayerStats(steamId),
    fetchLeaderboard(),
    fetchPlayerRecentMatches(steamId),
    fetchSeasons(),
    fetchMatches(),
  ])

  if (!player) notFound()

  // Fetch Steam avatar and player team info for recent matches
  const playerTeamsPromise = recentMatches.length > 0
    ? fetchPlayerTeamInMatches(steamId, recentMatches)
    : Promise.resolve(new Map<number, number | null>())
  const [avatarUrl, playerTeams] = await Promise.all([
    fetchSteamAvatar(steamId),
    playerTeamsPromise,
  ])

  // Compute recent form (W/L/D/C) from recent matches
  const recentForm = computeRecentForm(
    recentMatches.sort((a, b) => b.id - a.id),
    playerTeams,
    5
  )

  const rank = leaderboard.findIndex((p) => p.steamId === steamId) + 1

  // Compute competition wins for this player
  const matchesBySeason = new Map<number | null, typeof allMatches>()
  for (const m of allMatches) {
    const sid = m.season_id
    if (!matchesBySeason.has(sid)) matchesBySeason.set(sid, [])
    matchesBySeason.get(sid)!.push(m)
  }

  let competitionWins = 0
  // For each ended competition, check if this player was on the winning team
  const compChecks: Promise<void>[] = []
  for (const season of seasons) {
    if (getCompetitionStatus(season) !== "Ended") continue
    const seasonMatches = matchesBySeason.get(season.id) ?? []
    const winner = deriveCompetitionWinner(seasonMatches)
    if (!winner) continue

    // Find a completed match where the winning team played
    const winnerMatch = seasonMatches.find(
      (m) =>
        m.winner !== null &&
        !m.cancelled &&
        !m.forfeit &&
        (m.team1_string === winner.teamName || m.team2_string === winner.teamName),
    )
    if (!winnerMatch) continue

    compChecks.push(
      fetchMatchPlayerStats(String(winnerMatch.id), winnerMatch)
        .then(({ team1, team2 }) => {
          const isTeam1 = winnerMatch.team1_string === winner.teamName
          const roster = isTeam1 ? team1 : team2
          if (roster.some((p) => p.steamId === steamId)) {
            competitionWins++
          }
        })
        .catch(() => {}),
    )
  }
  await Promise.allSettled(compChecks)

  // Compute per-map stats and per-match rating from recent matches
  const mapPerf = new Map<string, { played: number; wins: number; kills: number; deaths: number; rounds: number; k1: number; k2: number; k3: number; k4: number; k5: number }>()
  const ratingPoints: RatingPoint[] = []

  // Fetch map stats and player stats for each recent match
  const mapStatsPromises = recentMatches.map(async (match) => {
    try {
      const [maps, pData] = await Promise.all([
        fetchMapStats(String(match.id), match),
        g5Fetch<unknown>(`/api/playerstats/match/${match.id}`, { revalidate: 120 }),
      ])
      const pRows = unwrapArray(pData, "playerstats", "playerStats")
      const playerRows = pRows.filter(
        (r) => String(r.steam_id ?? r.steamId ?? "") === steamId
      )
      const pTeam = playerTeams.get(match.id)

      for (const map of maps) {
        // Find the player's stats for this specific map (by map_number)
        const pRow = playerRows.find(
          (r) => Number(r.map_id ?? r.map_number ?? 0) === map.map_number
        ) ?? playerRows[0] // fallback for BO1 where there's only one row

        if (!pRow) continue

        const existing = mapPerf.get(map.map_name) ?? { played: 0, wins: 0, kills: 0, deaths: 0, rounds: 0, k1: 0, k2: 0, k3: 0, k4: 0, k5: 0 }
        existing.played += 1
        if (map.winner !== null && pTeam !== null && pTeam !== undefined && map.winner === pTeam) {
          existing.wins += 1
        }
        existing.kills += Number(pRow.kills ?? 0)
        existing.deaths += Number(pRow.deaths ?? 0)
        existing.rounds += Number(pRow.roundsplayed ?? pRow.rounds_played ?? 0)
        existing.k1 += Number(pRow.k1 ?? 0)
        existing.k2 += Number(pRow.k2 ?? 0)
        existing.k3 += Number(pRow.k3 ?? 0)
        existing.k4 += Number(pRow.k4 ?? 0)
        existing.k5 += Number(pRow.k5 ?? 0)
        mapPerf.set(map.map_name, existing)
      }

      // Compute overall per-match rating from all player rows
      const totalKills = playerRows.reduce((s, r) => s + Number(r.kills ?? 0), 0)
      const totalDeaths = playerRows.reduce((s, r) => s + Number(r.deaths ?? 0), 0)
      const totalRounds = playerRows.reduce((s, r) => s + Number(r.roundsplayed ?? r.rounds_played ?? 0), 0)
      const tK1 = playerRows.reduce((s, r) => s + Number(r.k1 ?? 0), 0)
      const tK2 = playerRows.reduce((s, r) => s + Number(r.k2 ?? 0), 0)
      const tK3 = playerRows.reduce((s, r) => s + Number(r.k3 ?? 0), 0)
      const tK4 = playerRows.reduce((s, r) => s + Number(r.k4 ?? 0), 0)
      const tK5 = playerRows.reduce((s, r) => s + Number(r.k5 ?? 0), 0)
      if (totalRounds > 0) {
        const matchRating = computeRating(totalKills, totalRounds, totalDeaths, tK1, tK2, tK3, tK4, tK5)
        ratingPoints.push({
          matchId: match.id,
          rating: matchRating,
          date: match.start_time,
        })
      }
    } catch {
      // skip failed fetches
    }
  })
  await Promise.allSettled(mapStatsPromises)

  // Sort rating points oldest-first for the sparkline
  ratingPoints.sort((a, b) => a.matchId - b.matchId)

  const mapPerformances: MapPerformance[] = []
  for (const [mapName, data] of mapPerf) {
    const rating = data.rounds > 0
      ? computeRating(data.kills, data.rounds, data.deaths, data.k1, data.k2, data.k3, data.k4, data.k5)
      : 0
    mapPerformances.push({
      mapName,
      played: data.played,
      wins: data.wins,
      kills: data.kills,
      deaths: data.deaths,
      rating,
    })
  }

  const kd = player.deaths > 0 ? (player.kills / player.deaths).toFixed(2) : "0.00"
  const winPct = player.total_maps > 0 ? ((player.wins / player.total_maps) * 100).toFixed(1) : "0.0"
  const losses = player.total_maps - player.wins

  const clutchStats = [
    { label: "1v1", value: player.v1 },
    { label: "1v2", value: player.v2 },
    { label: "1v3", value: player.v3 },
    { label: "1v4", value: player.v4 },
    { label: "1v5", value: player.v5 },
  ]

  const multiKills = [
    { label: "3K", value: player.k3 },
    { label: "4K", value: player.k4 },
    { label: "5K (Ace)", value: player.k5 },
  ]

  const clutchMax = Math.max(player.v1, 1)
  const mkMax = Math.max(player.k3, 1)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/" },
        { label: "Leaderboard", href: "/leaderboard" },
        { label: player.name },
      ]} />

      {/* Player Header - Hero */}
      <div className="relative mb-8 overflow-hidden rounded-xl border border-border bg-card p-8 animate-fade-in-up">
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <SteamAvatar
              avatarUrl={avatarUrl}
              name={player.name}
              size="xl"
              className="rounded-xl"
            />
            <div>
              <h1 className="font-heading text-2xl font-semibold text-foreground lg:text-3xl">{player.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {rank > 0 && (
                  <span className="flex items-center gap-1">
                    {rank <= 3 ? (
                      <Crown className="h-3.5 w-3.5 text-foreground" />
                    ) : (
                      <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="font-semibold text-foreground">Rank #{rank}</span>
                  </span>
                )}
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="font-mono text-xs">{player.steamId}</span>
                {recentForm.length > 0 && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <RecentForm results={recentForm} size="md" />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Key stats */}
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="font-mono text-3xl font-bold text-foreground">{player.points}</div>
              <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">ELO</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                {player.wins}<span className="text-muted-foreground/50">-</span>{losses}
              </div>
              <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">W-L</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className={cn(
                "text-3xl font-bold",
                parseFloat(winPct) >= 55 ? "text-win" : parseFloat(winPct) >= 45 ? "text-foreground" : "text-loss"
              )}>
                {winPct}%
              </div>
              <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Win Rate</div>
            </div>
          </div>
        </div>

        {/* Compare link */}
        <div className="relative mt-6 flex items-center gap-3 border-t border-border/50 pt-5">
          <Link
            href={`/compare?player1=${player.steamId}`}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-muted-foreground/30 hover:text-foreground"
          >
            <GitCompare className="h-4 w-4" />
            Compare with another player
          </Link>
          <ShareButton />
        </div>
      </div>

      {/* Core Stats Grid */}
      <section className="mb-8 animate-fade-in-up stagger-1">
        <h2 className="mb-4 font-heading text-lg font-medium text-foreground">Performance</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatBlock label="ELO" value={player.points} icon={TrendingUp} highlight />
          <StatBlock
            label="Rating"
            value={player.average_rating.toFixed(2)}
            icon={Zap}
            color={player.average_rating >= 1.1 ? "win" : player.average_rating >= 1.0 ? undefined : "loss"}
          />
          <StatBlock label="Kills" value={player.kills.toLocaleString()} icon={Crosshair} />
          <StatBlock label="Deaths" value={player.deaths.toLocaleString()} icon={Skull} />
          <StatBlock label="Assists" value={player.assists.toLocaleString()} icon={Hand} />
          <StatBlock
            label="K/D Ratio"
            value={kd}
            icon={Target}
            color={parseFloat(kd) >= 1.2 ? "win" : parseFloat(kd) >= 1.0 ? undefined : "loss"}
          />
          <StatBlock label="Headshots" value={player.hsk.toLocaleString()} icon={Crosshair} />
          <StatBlock label="HS%" value={`${player.hsp.toFixed(1)}%`} icon={Target} />
        </div>
      </section>

      {/* Rating Trend */}
      {ratingPoints.length >= 2 && (
        <section className="mb-8 animate-fade-in-up stagger-1">
          <RatingSparkline data={ratingPoints} />
        </section>
      )}

      {/* Achievements / Badges */}
      <section className="mb-8">
        <PlayerBadges player={player} rank={rank} competitionWins={competitionWins} />
      </section>

      {/* Advanced Stats */}
      <div className="grid gap-8 md:grid-cols-2 animate-fade-in-up stagger-2">
        <section>
          <h2 className="mb-4 font-heading text-lg font-medium text-foreground">Multi-Kills</h2>
          <div className="flex flex-col gap-2">
            {multiKills.map((mk) => (
              <ProgressBar key={mk.label} label={mk.label} value={mk.value} max={mkMax} color="primary" />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-heading text-lg font-medium text-foreground">Clutches</h2>
          <div className="flex flex-col gap-2">
            {clutchStats.map((clutch) => (
              <ProgressBar key={clutch.label} label={clutch.label} value={clutch.value} max={clutchMax} color="muted" />
            ))}
          </div>
        </section>
      </div>

      {/* Map Performance */}
      {mapPerformances.length > 0 && (
        <section className="mt-8 animate-fade-in-up stagger-3">
          <h2 className="mb-4 font-heading text-lg font-medium text-foreground">Map Performance</h2>
          <PlayerMapStats maps={mapPerformances} />
        </section>
      )}

      {/* Win/Loss Record */}
      <section className="mt-8 animate-fade-in-up stagger-3">
        <h2 className="mb-4 font-heading text-lg font-medium text-foreground">Record</h2>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-win">{player.wins}</div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Wins</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-loss">{losses}</div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Losses</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">{player.total_maps}</div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Maps</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">Win Rate</span>
              <span className="font-mono font-semibold">{winPct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  parseFloat(winPct) >= 55 ? "bg-win" : parseFloat(winPct) >= 45 ? "bg-foreground" : "bg-loss"
                )}
                style={{ width: player.total_maps > 0 ? `${(player.wins / player.total_maps) * 100}%` : "0%" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <section className="mt-8 animate-fade-in-up stagger-4">
          <h2 className="mb-4 font-heading text-lg font-medium text-foreground">Recent Matches</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentMatches.map((match) => (
              <MatchCardWithOutcome
                key={match.id}
                match={match}
                playerTeam={playerTeams.get(match.id) ?? null}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
