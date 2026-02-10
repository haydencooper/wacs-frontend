import { fetchLeaderboard, fetchMatches, fetchBulkMapStats } from "@/lib/api"
import { StatCard } from "@/components/stat-card"
import { SteamAvatar } from "@/components/steam-avatar"
import { fetchSteamAvatars } from "@/lib/steam"
import { getMapDisplayName, getMapMeta } from "@/lib/maps"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Users,
  Swords,
  Target,
  Crosshair,
  Skull,
  Hand,
  Trophy,
  Crown,
  Zap,
  MapPin,
} from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Community Stats - WACS",
  description: "Aggregate community statistics for the WACS CS2 PUG community.",
}

export default async function StatsPage() {
  const [leaderboard, allMatches] = await Promise.all([
    fetchLeaderboard(),
    fetchMatches(),
  ])

  // Get completed matches
  const completedMatches = allMatches.filter(
    (m) => (m.winner !== null || m.end_time !== null) && !m.cancelled && !m.forfeit
  )

  // Fetch actual map stats from completed matches (up to 50 most recent) for map name data
  const [mapStatsAll, avatars] = await Promise.all([
    fetchBulkMapStats(
      [...completedMatches].sort((a, b) => b.id - a.id),
      50
    ),
    fetchSteamAvatars(leaderboard.slice(0, 5).map((p) => p.steamId)),
  ])

  const cancelledMatches = allMatches.filter((m) => m.cancelled)
  const liveMatches = allMatches.filter(
    (m) => m.winner === null && m.end_time === null && !m.cancelled && !m.forfeit
  )

  // Aggregate player stats
  const totalPlayers = leaderboard.length
  const totalMatches = allMatches.length
  const totalKills = leaderboard.reduce((s, p) => s + p.kills, 0)
  const totalDeaths = leaderboard.reduce((s, p) => s + p.deaths, 0)
  const totalAssists = leaderboard.reduce((s, p) => s + p.assists, 0)
  const totalHeadshots = leaderboard.reduce((s, p) => s + p.hsk, 0)
  const avgHSPercent =
    totalKills > 0 ? ((totalHeadshots / totalKills) * 100).toFixed(1) : "0.0"
  const communityKD =
    totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : "0.00"
  const avgRating =
    leaderboard.length > 0
      ? (
          leaderboard.reduce((s, p) => s + p.average_rating, 0) /
          leaderboard.length
        ).toFixed(2)
      : "0.00"

  // Total rounds: compute from match scores (more reliable than leaderboard roundsplayed)
  // Each match score pair represents total rounds played in that match
  const totalRoundsFromMatches = completedMatches.reduce((s, m) => {
    const s1 = m.team1_mapscore ?? m.team1_score
    const s2 = m.team2_mapscore ?? m.team2_score
    return s + s1 + s2
  }, 0)
  // Also check leaderboard roundsplayed as fallback
  const totalRoundsFromLeaderboard = leaderboard.reduce((s, p) => s + p.roundsplayed, 0)
  const totalRounds = Math.max(totalRoundsFromMatches, totalRoundsFromLeaderboard)

  // Map popularity: use actual map_name from map stats data (not match.title)
  const mapCounts: Record<string, number> = {}
  for (const ms of mapStatsAll) {
    if (ms.map_name) {
      mapCounts[ms.map_name] = (mapCounts[ms.map_name] || 0) + 1
    }
  }
  const sortedMaps = Object.entries(mapCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  const maxMapCount = sortedMaps.length > 0 ? sortedMaps[0][1] : 1

  // Top clutchers (by total clutch rounds)
  const topClutchers = [...leaderboard]
    .map((p) => ({
      ...p,
      totalClutches: p.v1 + p.v2 + p.v3 + p.v4 + p.v5,
    }))
    .sort((a, b) => b.totalClutches - a.totalClutches)
    .slice(0, 5)

  // Top aimers (by HS%)
  const topAimers = [...leaderboard]
    .filter((p) => p.kills >= 50)
    .sort((a, b) => b.hsp - a.hsp)
    .slice(0, 5)

  // Top K/D
  const topKD = [...leaderboard]
    .filter((p) => p.total_maps >= 3)
    .map((p) => ({
      ...p,
      kd: p.deaths > 0 ? p.kills / p.deaths : p.kills,
    }))
    .sort((a, b) => b.kd - a.kd)
    .slice(0, 5)

  // Ace kings (most 5Ks)
  const aceKings = [...leaderboard]
    .filter((p) => p.k5 > 0)
    .sort((a, b) => b.k5 - a.k5)
    .slice(0, 5)

  // Average rounds per match
  const matchScores = completedMatches
    .map((m) => {
      const s1 = m.team1_mapscore ?? m.team1_score
      const s2 = m.team2_mapscore ?? m.team2_score
      return s1 + s2
    })
    .filter((s) => s > 0)
  const avgTotalRoundsPerMatch =
    matchScores.length > 0
      ? (matchScores.reduce((s, v) => s + v, 0) / matchScores.length).toFixed(1)
      : "0"

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <section className="mb-10 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              Community Stats
            </h1>
            <p className="text-sm text-muted-foreground">
              Aggregate statistics across all WACS matches and players
            </p>
          </div>
        </div>
      </section>

      {/* Overview Cards */}
      <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4 animate-fade-in-up stagger-1">
        <StatCard label="Players" value={totalPlayers} icon={Users} />
        <StatCard label="Matches Played" value={completedMatches.length} icon={Swords} />
        <StatCard label="Total Rounds" value={totalRounds > 0 ? totalRounds.toLocaleString() : "N/A"} icon={Target} />
        <StatCard label="Avg Rating" value={avgRating} icon={Zap} />
      </section>

      {/* Kill/Death/Assist Row */}
      <section className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-5 animate-fade-in-up stagger-2">
        <StatCard label="Total Kills" value={totalKills.toLocaleString()} icon={Crosshair} />
        <StatCard label="Total Deaths" value={totalDeaths.toLocaleString()} icon={Skull} />
        <StatCard label="Total Assists" value={totalAssists.toLocaleString()} icon={Hand} />
        <StatCard label="Community K/D" value={communityKD} icon={Target} />
        <StatCard label="Avg HS%" value={`${avgHSPercent}%`} icon={Crosshair} />
      </section>

      {/* Match Stats */}
      <section className="mb-10 animate-fade-in-up stagger-3">
        <h2 className="mb-4 font-heading text-lg font-medium text-foreground">
          Match Breakdown
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-5 text-center">
            <div className="font-heading text-2xl font-semibold text-foreground">{totalMatches}</div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 text-center">
            <div className="font-heading text-2xl font-semibold text-win">{completedMatches.length}</div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Completed</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 text-center">
            <div className="font-heading text-2xl font-semibold text-live">{liveMatches.length}</div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Live Now</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 text-center">
            <div className="font-heading text-2xl font-semibold text-foreground">{avgTotalRoundsPerMatch}</div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Avg Rounds/Match</div>
          </div>
        </div>
      </section>

      {/* Two column grid: Map Popularity + Top Lists */}
      <div className="grid gap-8 lg:grid-cols-2 animate-fade-in-up stagger-4">
        {/* Map Popularity */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-medium text-foreground">
            Most Played Maps
          </h2>
          {sortedMaps.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <MapPin className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No map data yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedMaps.map(([mapKey, count]) => {
                const meta = getMapMeta(mapKey)
                const pct = (count / maxMapCount) * 100
                return (
                  <div
                    key={mapKey}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-card/80"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-bold text-card"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.code}
                    </span>
                    <span className="w-20 text-sm font-medium text-foreground">
                      {getMapDisplayName(mapKey) || mapKey}
                    </span>
                    <div className="flex-1">
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>
                    </div>
                    <span className="w-8 text-right font-mono text-sm font-semibold text-foreground">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Top Clutchers */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-medium text-foreground">
            Top Clutchers
          </h2>
          <div className="flex flex-col gap-2">
            {topClutchers.map((player, i) => (
              <Link
                key={player.steamId}
                href={`/player/${player.steamId}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary/50"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary font-mono text-[11px] font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <SteamAvatar
                  avatarUrl={avatars[player.steamId]}
                  name={player.name}
                  size="sm"
                />
                <span className="flex-1 text-sm font-medium text-foreground">{player.name}</span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {player.totalClutches}
                </span>
                <span className="text-[10px] text-muted-foreground">clutches</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom grid: Top Aimers + Top K/D + Ace Kings */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3 animate-fade-in-up stagger-5">
        {/* Top HS% */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-medium text-foreground">
            Best Aimers (HS%)
          </h2>
          <div className="flex flex-col gap-2">
            {topAimers.map((player, i) => (
              <Link
                key={player.steamId}
                href={`/player/${player.steamId}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary/50"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary font-mono text-[11px] font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-foreground">{player.name}</span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {player.hsp.toFixed(1)}%
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Top K/D */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-medium text-foreground">
            Best K/D Ratio
          </h2>
          <div className="flex flex-col gap-2">
            {topKD.map((player, i) => (
              <Link
                key={player.steamId}
                href={`/player/${player.steamId}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary/50"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary font-mono text-[11px] font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-foreground">{player.name}</span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {player.kd.toFixed(2)}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Ace Kings */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-medium text-foreground">
            Ace Kings (5K)
          </h2>
          {aceKings.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <Crown className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No aces recorded yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {aceKings.map((player, i) => (
                <Link
                  key={player.steamId}
                  href={`/player/${player.steamId}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary/50"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary font-mono text-[11px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium text-foreground">{player.name}</span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    {player.k5}
                  </span>
                  <span className="text-[10px] text-muted-foreground">aces</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
