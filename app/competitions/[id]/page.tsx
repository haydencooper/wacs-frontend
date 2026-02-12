import { fetchSeasons, fetchMatches, fetchSeasonPlayerStats } from "@/lib/api"
import { fetchSteamAvatars } from "@/lib/steam"
import {
  deriveCompetitionWinner,
  getCompetitionStatus,
  getTeamStandings,
} from "@/lib/competitions"
import { cn } from "@/lib/utils"
import { Calendar, Swords, Trophy, Crown } from "lucide-react"
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { CompetitionTabs } from "@/components/competition-tabs"
import { LeaderboardView } from "@/components/leaderboard-view"
import { MatchesView } from "@/components/matches-view"

export const dynamic = "force-dynamic"

function formatDate(iso: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [seasons, allMatches] = await Promise.all([
    fetchSeasons(),
    fetchMatches(),
  ])

  const season = seasons.find((s) => s.id === Number(id))
  if (!season) notFound()

  const seasonMatches = allMatches.filter((m) => m.season_id === season.id)
  const completedMatches = seasonMatches.filter(
    (m) => (m.winner !== null || m.end_time !== null) && !m.cancelled && !m.forfeit,
  )
  const status = getCompetitionStatus(season)
  const isActive = status === "Active"
  const isEnded = status === "Ended"
  const winner = deriveCompetitionWinner(seasonMatches)
  const standings = getTeamStandings(seasonMatches)

  // Fetch competition-specific player stats (aggregated from all season matches)
  const seasonPlayers = await fetchSeasonPlayerStats(completedMatches)

  // Fetch Steam avatars for all participants
  const avatars = await fetchSteamAvatars(seasonPlayers.map((p) => p.steamId))

  const now = new Date()

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Competitions", href: "/competitions" },
          { label: season.name },
        ]}
      />

      {/* Competition Header */}
      <div
        className={cn(
          "relative mb-8 overflow-hidden rounded-xl border bg-card p-8 animate-fade-in-up",
          isActive ? "border-primary/30" : "border-border",
        )}
      >
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-b from-primary/3 to-transparent" />
        )}

        <div className="relative">
          <div className="mb-4 flex items-center gap-3">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                isActive
                  ? "bg-primary/10 text-primary"
                  : isEnded
                    ? "bg-secondary text-muted-foreground"
                    : "bg-secondary text-muted-foreground",
              )}
            >
              {status}
            </span>
            <span className="font-mono text-xs text-muted-foreground">#{season.id}</span>
          </div>

          <h1 className="mb-2 font-heading text-3xl font-semibold text-foreground">
            {season.name}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(season.start_date)}
              {season.end_date && ` — ${formatDate(season.end_date)}`}
            </span>
            <span className="flex items-center gap-1.5">
              <Swords className="h-3.5 w-3.5" />
              {seasonMatches.length} matches ({completedMatches.length} completed)
            </span>
          </div>

          {/* Progress bar for active competitions with end date */}
          {isActive && season.end_date && (
            <div className="mt-4 max-w-md">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>
                  {Math.min(
                    100,
                    Math.round(
                      ((now.getTime() - new Date(season.start_date).getTime()) /
                        (new Date(season.end_date).getTime() -
                          new Date(season.start_date).getTime())) *
                        100,
                    ),
                  )}
                  %
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      ((now.getTime() - new Date(season.start_date).getTime()) /
                        (new Date(season.end_date).getTime() -
                          new Date(season.start_date).getTime())) *
                        100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Winner / Leader Highlight */}
      {winner && (
        <div className="mb-8 animate-fade-in-up stagger-1">
          <div
            className={cn(
              "flex items-center gap-4 rounded-lg border px-5 py-4",
              isEnded
                ? "border-primary/20 bg-primary/5"
                : "border-border bg-card",
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-lg",
                isEnded ? "bg-primary/10" : "bg-secondary",
              )}
            >
              {isEnded ? (
                <Trophy className="h-6 w-6 text-primary" />
              ) : (
                <Crown className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-widest",
                  isEnded ? "text-primary/70" : "text-muted-foreground",
                )}
              >
                {isEnded ? "Competition Winner" : "Current Leader"}
              </p>
              <p className="text-lg font-bold text-foreground">{winner.teamName}</p>
            </div>
            <div className="flex items-center gap-6 text-right">
              <div>
                <p className="font-mono text-lg font-bold text-foreground">
                  <span className="text-win">{winner.matchWins}W</span>
                  <span className="text-muted-foreground/50">-</span>
                  <span className="text-loss">{winner.matchLosses}L</span>
                </p>
                <p className="text-[10px] text-muted-foreground">Record</p>
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-primary">
                  {winner.totalMatches > 0
                    ? ((winner.matchWins / winner.totalMatches) * 100).toFixed(0)
                    : 0}
                  %
                </p>
                <p className="text-[10px] text-muted-foreground">Win Rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Standings + Player Stats + Matches Tabs */}
      <section className="animate-fade-in-up stagger-2">
        <CompetitionTabs
          standingsContent={
            standings.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <Trophy className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium text-foreground">No standings yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Standings will appear once matches are completed.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-secondary/40">
                        <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          Team
                        </th>
                        <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          W
                        </th>
                        <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          L
                        </th>
                        <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          Matches
                        </th>
                        <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          Win%
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((team) => (
                        <tr
                          key={team.teamName}
                          className={cn(
                            "border-b border-border/30 transition-colors last:border-0 hover:bg-secondary/20",
                            team.rank === 1 && "bg-primary/3",
                          )}
                        >
                          <td className="px-4 py-3">
                            <div className="flex h-7 w-7 items-center justify-center">
                              {team.rank === 1 ? (
                                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15">
                                  <Crown className="h-4 w-4 text-primary" />
                                </div>
                              ) : (
                                <span className="font-mono text-xs text-muted-foreground">
                                  {team.rank}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold text-foreground">
                              {team.teamName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-win">
                            {team.wins}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm text-loss">
                            {team.losses}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm text-foreground">
                            {team.totalMatches}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-secondary">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    team.winPct >= 55
                                      ? "bg-win"
                                      : team.winPct >= 45
                                        ? "bg-primary"
                                        : "bg-loss",
                                  )}
                                  style={{ width: `${team.winPct}%` }}
                                />
                              </div>
                              <span
                                className={cn(
                                  "font-mono text-sm",
                                  team.winPct >= 55
                                    ? "text-win"
                                    : team.winPct >= 45
                                      ? "text-foreground"
                                      : "text-loss",
                                )}
                              >
                                {team.winPct.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="flex flex-col gap-3 md:hidden">
                  {standings.map((team) => (
                    <div
                      key={team.teamName}
                      className={cn(
                        "rounded-xl border border-border bg-card p-4",
                        team.rank === 1 && "border-primary/20 bg-primary/3",
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {team.rank === 1 ? (
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15">
                              <Crown className="h-4 w-4 text-primary" />
                            </div>
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center">
                              <span className="font-mono text-xs text-muted-foreground">
                                {team.rank}
                              </span>
                            </div>
                          )}
                          <span className="text-sm font-semibold text-foreground">
                            {team.teamName}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Record
                          </div>
                          <div className="font-mono text-sm">
                            <span className="font-semibold text-win">{team.wins}W</span>
                            <span className="text-muted-foreground/50">-</span>
                            <span className="text-loss">{team.losses}L</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Matches
                          </div>
                          <div className="font-mono text-sm text-foreground">
                            {team.totalMatches}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Win%
                          </div>
                          <div
                            className={cn(
                              "font-mono text-sm",
                              team.winPct >= 55
                                ? "text-win"
                                : team.winPct >= 45
                                  ? "text-foreground"
                                  : "text-loss",
                            )}
                          >
                            {team.winPct.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          }
          playerStatsContent={
            <LeaderboardView
              players={seasonPlayers}
              avatars={avatars}
              disableUrlSync
              hideSeasonFilter
            />
          }
          matchesContent={
            seasonMatches.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <Swords className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium text-foreground">No matches yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Matches will appear here once scheduled.
                </p>
              </div>
            ) : (
              <MatchesView matches={seasonMatches} disableUrlSync />
            )
          }
        />
      </section>
    </div>
  )
}
