import { StatCard } from "@/components/stat-card"
import { MatchCard } from "@/components/match-card"
import { LeaderboardTable } from "@/components/leaderboard-table"
import { ServerStatus } from "@/components/server-status"
import { AutoRefresh } from "@/components/auto-refresh"
import { SteamAvatar } from "@/components/steam-avatar"
import { fetchLeaderboard, fetchMatches, fetchServers, fetchMatchPlayerStats } from "@/lib/api"
import { fetchSteamAvatars } from "@/lib/steam"
import { Users, Swords, Trophy, Server, ArrowRight, Zap, TrendingUp, Star } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [leaderboard, recentMatches, servers] = await Promise.all([
    fetchLeaderboard(),
    fetchMatches(),
    fetchServers(),
  ])

  // Fetch Steam avatars for leaderboard players (top visible ones)
  const topSteamIds = leaderboard.slice(0, 10).map((p) => p.steamId)
  const avatars = await fetchSteamAvatars(topSteamIds)

  const totalPlayers = leaderboard.length
  const totalMatches = recentMatches.length
  const activeServers = servers.filter((s) => s.in_use).length
  const topRating = leaderboard.length > 0
    ? Math.max(...leaderboard.map((p) => p.average_rating)).toFixed(2)
    : "0.00"

  // Derive some highlights
  const topPlayer = leaderboard.length > 0 ? leaderboard.reduce((a, b) => a.points > b.points ? a : b) : null
  const liveMatches = recentMatches.filter(
    (m) => m.winner === null && m.end_time === null && !m.cancelled && !m.forfeit
  )

  // Player of the Week: highest average rating among players active in the last 7 days
  // We filter matches to the past week, fetch per-match player stats, and aggregate.
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const weeklyMatches = recentMatches.filter((m) => {
    if (!m.start_time || m.cancelled) return false
    const t = new Date(m.start_time)
    return t >= oneWeekAgo && m.winner !== null
  })

  let playerOfTheWeek: typeof leaderboard[number] | null = null

  if (weeklyMatches.length > 0) {
    // Aggregate per-player stats from this week's matches
    const weeklyAgg = new Map<string, { kills: number; deaths: number; rounds: number; maps: number; k1: number; k2: number; k3: number; k4: number; k5: number }>()

    const BATCH_SIZE = 10
    for (let i = 0; i < weeklyMatches.length; i += BATCH_SIZE) {
      const batch = weeklyMatches.slice(i, i + BATCH_SIZE)
      const results = await Promise.all(
        batch.map((m) => fetchMatchPlayerStats(String(m.id), m))
      )
      for (const { team1, team2 } of results) {
        for (const p of [...team1, ...team2]) {
          const existing = weeklyAgg.get(p.steamId)
          if (existing) {
            existing.kills += p.kills
            existing.deaths += p.deaths
            existing.rounds += p.roundsplayed
            existing.maps += 1
            existing.k1 += p.k1
            existing.k2 += p.k2
            existing.k3 += p.k3
            existing.k4 += p.k4
            existing.k5 += p.k5
          } else {
            weeklyAgg.set(p.steamId, {
              kills: p.kills,
              deaths: p.deaths,
              rounds: p.roundsplayed,
              maps: 1,
              k1: p.k1,
              k2: p.k2,
              k3: p.k3,
              k4: p.k4,
              k5: p.k5,
            })
          }
        }
      }
    }

    // Find the player with the highest HLTV rating this week (min 2 maps)
    let bestRating = 0
    let bestSteamId: string | null = null
    for (const [steamId, agg] of weeklyAgg) {
      if (agg.maps < 2 || agg.rounds === 0) continue
      const killRating = agg.kills / agg.rounds / 0.679
      const survivalRating = (agg.rounds - agg.deaths) / agg.rounds / 0.317
      const multiKillBonus =
        (agg.k1 + 4 * agg.k2 + 9 * agg.k3 + 16 * agg.k4 + 25 * agg.k5) / agg.rounds / 1.277
      const rating = (killRating + 0.7 * survivalRating + multiKillBonus) / 2.7
      if (rating > bestRating) {
        bestRating = rating
        bestSteamId = steamId
      }
    }

    if (bestSteamId) {
      // Use the leaderboard entry for display (has name, full stats, etc.)
      playerOfTheWeek = leaderboard.find((p) => p.steamId === bestSteamId) ?? null
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      {/* Hero */}
      <section className="mb-10 animate-fade-in-up">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-balance text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Dashboard
            </h1>
          </div>
          <AutoRefresh interval={60} />
        </div>

        {/* Live matches banner */}
        {liveMatches.length > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-live/20 bg-live/5 px-4 py-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
            </span>
            <span className="text-sm font-medium text-live">
              {liveMatches.length} match{liveMatches.length !== 1 ? "es" : ""} live now
            </span>
            <Link
              href="/matches"
              className="ml-auto text-xs font-medium text-live/80 transition-colors hover:text-live"
            >
              Watch
            </Link>
          </div>
        )}
      </section>

      {/* Stats Overview */}
      <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4 animate-fade-in-up stagger-1">
        <StatCard label="Players" value={totalPlayers} icon={Users} />
        <StatCard label="Matches" value={totalMatches} icon={Swords} />
        <StatCard
          label="Servers Active"
          value={`${activeServers}/${servers.length}`}
          icon={Server}
        />
        <StatCard label="Top Rating" value={topRating} icon={Trophy} />
      </section>

      {/* Highlights row */}
      {topPlayer && (
        <section className="mb-10 animate-fade-in-up stagger-1">
          <div className="flex flex-col gap-4 md:flex-row">
            <Link
              href={`/player/${topPlayer.steamId}`}
              className="group flex flex-1 items-center gap-4 rounded-lg border border-primary/20 bg-primary/5 p-5 transition-all hover:border-primary/40 hover:bg-primary/10"
            >
              <SteamAvatar
                avatarUrl={avatars[topPlayer.steamId]}
                name={topPlayer.name}
                size="lg"
                className="rounded-lg"
              />
              <div className="flex-1">
                <p className="text-[11px] font-medium uppercase tracking-widest text-primary/60">
                  Top Rated Player
                </p>
                <p className="mt-0.5 text-lg font-semibold text-foreground">{topPlayer.name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl font-bold text-primary">{topPlayer.points}</p>
                <p className="text-[11px] text-muted-foreground">ELO</p>
              </div>
            </Link>
            {leaderboard.length > 0 && (
              <div className="flex flex-1 items-center gap-4 rounded-lg border border-border bg-card p-5">
                <Zap className="h-5 w-5 text-muted-foreground/40" />
                <div className="flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Community
                  </p>
                  <p className="mt-0.5 text-lg font-semibold text-foreground">
                    {totalPlayers} Players
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold text-foreground">{totalMatches}</p>
                  <p className="text-[11px] text-muted-foreground">Matches Played</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Player of the Week */}
      {playerOfTheWeek && playerOfTheWeek.steamId !== topPlayer?.steamId && (
        <section className="mb-10 animate-fade-in-up stagger-1">
          <Link
            href={`/player/${playerOfTheWeek.steamId}`}
            className="group flex items-center gap-4 rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/20 hover:bg-primary/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Star className="h-5 w-5 text-foreground" />
            </div>
            <SteamAvatar
              avatarUrl={avatars[playerOfTheWeek.steamId]}
              name={playerOfTheWeek.name}
              size="lg"
              className="rounded-lg"
            />
            <div className="flex-1">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Player of the Week
              </p>
              <p className="mt-0.5 text-lg font-semibold text-foreground">{playerOfTheWeek.name}</p>
            </div>
            <div className="flex items-center gap-6 text-right">
              <div>
                <p className="font-mono text-2xl font-bold text-foreground">{playerOfTheWeek.average_rating.toFixed(2)}</p>
                <p className="text-[11px] text-muted-foreground">Rating</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-foreground">
                  {playerOfTheWeek.deaths > 0 ? (playerOfTheWeek.kills / playerOfTheWeek.deaths).toFixed(2) : "N/A"}
                </p>
                <p className="text-[11px] text-muted-foreground">K/D</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-foreground">{playerOfTheWeek.wins}</p>
                <p className="text-[11px] text-muted-foreground">Wins</p>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3 animate-fade-in-up stagger-2">
        {/* Leaderboard - takes 2 cols */}
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-medium text-foreground">
              Leaderboard
            </h2>
            <Link
              href="/leaderboard"
              className="group flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          {leaderboard.length > 0 ? (
            <LeaderboardTable players={leaderboard} avatars={avatars} limit={5} />
          ) : (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">No player data yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Rankings will appear once matches are played.</p>
            </div>
          )}
        </section>

        {/* Sidebar - Servers */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-medium text-foreground">
            Servers
          </h2>
          <ServerStatus servers={servers} />
        </section>
      </div>

      {/* Recent Matches */}
      <section className="mt-10 animate-fade-in-up stagger-3">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-medium text-foreground">
            Recent Matches
          </h2>
          <Link
            href="/matches"
            className="group flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        {recentMatches.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentMatches.slice(0, 6).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <Swords className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No matches yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Recent matches will show up here.</p>
          </div>
        )}
      </section>
    </div>
  )
}
