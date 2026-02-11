import { fetchPlayerStats, fetchLeaderboard, fetchPlayerRecentMatches, fetchPlayerTeamInMatches, fetchSeasons, fetchMatches, fetchMatchPlayerStats } from "@/lib/api"
import { fetchSteamAvatar } from "@/lib/steam"
import { deriveCompetitionWinner, getCompetitionStatus } from "@/lib/competitions"
import { MatchCardWithOutcome } from "@/components/match-card-with-outcome"
import { SteamAvatar } from "@/components/steam-avatar"
import { PlayerBadges } from "@/components/player-badges"
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
