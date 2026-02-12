import { fetchSeasons, fetchMatches, fetchMatchPlayerStats } from "@/lib/api"
import { fetchSteamAvatars } from "@/lib/steam"
import {
  deriveCompetitionWinner,
  getCompetitionStatus,
  getTeamStandings,
} from "@/lib/competitions"
import type { CompetitionWinner } from "@/lib/competitions"
import type { Season, Match } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Calendar, Crown, Star, Swords, Trophy } from "lucide-react"
import Link from "next/link"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { SteamAvatar } from "@/components/steam-avatar"

export const dynamic = "force-dynamic"

function formatDate(iso: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface RosterPlayer {
  steamId: string
  name: string
  kills: number
  deaths: number
  assists: number
  rating: number
  hsp: number
}

interface Champion {
  season: Season
  winner: CompetitionWinner
  totalTeams: number
  roster: RosterPlayer[]
  mvp: RosterPlayer | null
}

/**
 * Collect the winning team's player roster by iterating match-level
 * player stats and picking out players on the winning team side.
 */
async function buildRoster(
  seasonMatches: Match[],
  winnerTeamName: string,
): Promise<RosterPlayer[]> {
  const completed = seasonMatches.filter(
    (m) => m.winner !== null && !m.cancelled && !m.forfeit,
  )

  const playerMap = new Map<
    string,
    { name: string; kills: number; deaths: number; assists: number; rounds: number; hsk: number }
  >()

  await Promise.allSettled(
    completed.map(async (m) => {
      const isTeam1 = m.team1_string === winnerTeamName
      const isTeam2 = m.team2_string === winnerTeamName
      if (!isTeam1 && !isTeam2) return

      try {
        const { team1, team2 } = await fetchMatchPlayerStats(String(m.id), m)
        const winningPlayers = isTeam1 ? team1 : team2

        for (const p of winningPlayers) {
          const existing = playerMap.get(p.steamId)
          if (existing) {
            existing.kills += p.kills
            existing.deaths += p.deaths
            existing.assists += p.assists
            existing.rounds += p.roundsplayed
            existing.hsk += p.hsk
            if (p.name !== "Unknown") existing.name = p.name
          } else {
            playerMap.set(p.steamId, {
              name: p.name,
              kills: p.kills,
              deaths: p.deaths,
              assists: p.assists,
              rounds: p.roundsplayed,
              hsk: p.hsk,
            })
          }
        }
      } catch {
        // Skip failed match fetches
      }
    }),
  )

  const roster: RosterPlayer[] = []
  for (const [steamId, p] of playerMap) {
    const rating = p.rounds > 0 ? (p.kills + p.assists * 0.3) / p.rounds : 0
    const hsp = p.kills > 0 ? (p.hsk / p.kills) * 100 : 0

    roster.push({
      steamId,
      name: p.name,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      rating: Math.round(rating * 100) / 100,
      hsp: Math.round(hsp),
    })
  }

  roster.sort((a, b) => b.rating - a.rating)
  return roster
}

export default async function HallOfFamePage() {
  const [seasons, allMatches] = await Promise.all([
    fetchSeasons(),
    fetchMatches(),
  ])

  // Group matches by season_id
  const matchesBySeason = new Map<number | null, typeof allMatches>()
  for (const match of allMatches) {
    const sid = match.season_id
    if (!matchesBySeason.has(sid)) matchesBySeason.set(sid, [])
    matchesBySeason.get(sid)!.push(match)
  }

  // Build list of champions from ended competitions
  const champions: Champion[] = []
  const allRosterSteamIds = new Set<string>()

  for (const season of seasons) {
    if (getCompetitionStatus(season) !== "Ended") continue
    const seasonMatches = matchesBySeason.get(season.id) ?? []
    const winner = deriveCompetitionWinner(seasonMatches)
    if (!winner) continue
    const standings = getTeamStandings(seasonMatches)
    const roster = await buildRoster(seasonMatches, winner.teamName)
    const mvp = roster.length > 0 ? roster[0] : null

    for (const p of roster) allRosterSteamIds.add(p.steamId)

    champions.push({ season, winner, totalTeams: standings.length, roster, mvp })
  }

  // Most recent first
  champions.sort(
    (a, b) =>
      new Date(b.season.end_date!).getTime() -
      new Date(a.season.end_date!).getTime(),
  )

  // Fetch all avatars in one batch
  const avatars = await fetchSteamAvatars([...allRosterSteamIds])

  // Aggregate total titles per team
  const titlesByTeam = new Map<string, number>()
  for (const c of champions) {
    titlesByTeam.set(
      c.winner.teamName,
      (titlesByTeam.get(c.winner.teamName) ?? 0) + 1,
    )
  }

  const teamTitleRanking = Array.from(titlesByTeam.entries()).sort(
    (a, b) => b[1] - a[1],
  )

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <Breadcrumbs
        items={[{ label: "Dashboard", href: "/" }, { label: "Hall of Fame" }]}
      />

      {/* Header */}
      <section className="mb-10 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              Hall of Fame
            </h1>
            <p className="text-sm text-muted-foreground">
              Celebrating competition champions and their rosters
            </p>
          </div>
        </div>
      </section>

      {champions.length === 0 ? (
        <div className="animate-fade-in-up stagger-1 rounded-lg border border-border bg-card p-12 text-center">
          <Trophy className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">
            No champions yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Champions will appear here once a competition has ended.
          </p>
        </div>
      ) : (
        <>
          {/* Dynasty Leaderboard */}
          {teamTitleRanking.length > 0 && (
            <section className="mb-10 animate-fade-in-up stagger-1">
              <h2 className="mb-4 font-heading text-lg font-medium text-foreground">
                All-Time Titles
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {teamTitleRanking.map(([teamName, count], i) => (
                  <div
                    key={teamName}
                    className={cn(
                      "relative flex items-center gap-3 overflow-hidden rounded-xl border bg-card p-4 transition-all",
                      i === 0
                        ? "border-primary/30 shadow-sm shadow-primary/5"
                        : "border-border",
                    )}
                  >
                    {i === 0 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
                    )}
                    <div
                      className={cn(
                        "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold",
                        i === 0
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {i === 0 ? <Crown className="h-4 w-4" /> : i + 1}
                    </div>
                    <div className="relative min-w-0 flex-1">
                      <p className="truncate font-heading text-sm font-semibold text-foreground">
                        {teamName}
                      </p>
                    </div>
                    <div className="relative flex items-center gap-1.5 shrink-0">
                      <Trophy className="h-3.5 w-3.5 text-primary" />
                      <span className="font-mono text-sm font-bold text-foreground">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Champion Cards */}
          <section className="animate-fade-in-up stagger-2">
            <h2 className="mb-4 font-heading text-lg font-medium text-foreground">
              Champions
            </h2>
            <div className="flex flex-col gap-6">
              {champions.map((c, i) => (
                <div
                  key={c.season.id}
                  className={cn(
                    "relative overflow-hidden rounded-xl border bg-card transition-all",
                    i === 0
                      ? "border-primary/30 shadow-sm shadow-primary/5"
                      : "border-border",
                  )}
                >
                  {/* Decorative gradient banner */}
                  <div
                    className={cn(
                      "h-1.5",
                      i === 0
                        ? "bg-gradient-to-r from-primary/60 via-primary to-primary/60"
                        : "bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20",
                    )}
                  />

                  <div className="p-5 sm:p-6">
                    {/* Top: competition info + team record */}
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(c.season.start_date)}
                          {c.season.end_date &&
                            ` — ${formatDate(c.season.end_date)}`}
                        </p>
                        <Link
                          href={`/competitions/${c.season.id}`}
                          className="group inline-flex items-center gap-2"
                        >
                          <h3 className="font-heading text-xl font-semibold text-foreground transition-colors group-hover:text-primary">
                            {c.season.name}
                          </h3>
                          <Swords className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                        </Link>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-mono text-lg font-bold">
                            <span className="text-win">
                              {c.winner.matchWins}W
                            </span>
                            <span className="text-muted-foreground/50">-</span>
                            <span className="text-loss">
                              {c.winner.matchLosses}L
                            </span>
                          </p>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Record
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-lg font-bold text-primary">
                            {c.winner.totalMatches > 0
                              ? (
                                  (c.winner.matchWins / c.winner.totalMatches) *
                                  100
                                ).toFixed(0)
                              : 0}
                            %
                          </p>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Win Rate
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Champion team banner */}
                    <div className="mb-5 flex items-center gap-3 rounded-lg bg-primary/5 px-4 py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Crown className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">
                          Champion
                        </p>
                        <p className="truncate text-lg font-bold text-foreground">
                          {c.winner.teamName}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {c.totalTeams} teams competed
                      </span>
                    </div>

                    {/* MVP Highlight */}
                    {c.mvp && (
                      <div className="mb-5 flex items-center gap-3 rounded-lg border border-primary/10 bg-gradient-to-r from-primary/5 via-transparent to-transparent px-4 py-3">
                        <SteamAvatar
                          avatarUrl={avatars[c.mvp.steamId]}
                          name={c.mvp.name}
                          size="lg"
                          className="ring-2 ring-primary/20"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5 text-primary" />
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                              MVP
                            </p>
                          </div>
                          <Link
                            href={`/player/${c.mvp.steamId}`}
                            className="truncate text-sm font-bold text-foreground transition-colors hover:text-primary"
                          >
                            {c.mvp.name}
                          </Link>
                        </div>
                        <div className="hidden items-center gap-4 text-right sm:flex">
                          <div>
                            <p className="font-mono text-sm font-bold text-foreground">
                              {c.mvp.rating.toFixed(2)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Rating
                            </p>
                          </div>
                          <div>
                            <p className="font-mono text-sm font-bold text-foreground">
                              {c.mvp.deaths > 0
                                ? (c.mvp.kills / c.mvp.deaths).toFixed(2)
                                : c.mvp.kills.toFixed(2)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              K/D
                            </p>
                          </div>
                          <div>
                            <p className="font-mono text-sm font-bold text-foreground">
                              {c.mvp.hsp}%
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              HS%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Player Roster */}
                    {c.roster.length > 0 && (
                      <div>
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Roster
                        </p>

                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto rounded-lg border border-border sm:block">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-border bg-secondary/40">
                                <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  Player
                                </th>
                                <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  K
                                </th>
                                <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  D
                                </th>
                                <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  A
                                </th>
                                <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  K/D
                                </th>
                                <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  HS%
                                </th>
                                <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  Rating
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {c.roster.map((p, pi) => (
                                <tr
                                  key={p.steamId}
                                  className={cn(
                                    "border-b border-border/30 transition-colors last:border-0 hover:bg-secondary/20",
                                    pi === 0 && "bg-primary/3",
                                  )}
                                >
                                  <td className="px-3 py-2.5">
                                    <Link
                                      href={`/player/${p.steamId}`}
                                      className="flex items-center gap-2.5 transition-colors hover:text-primary"
                                    >
                                      <SteamAvatar
                                        avatarUrl={avatars[p.steamId]}
                                        name={p.name}
                                        size="sm"
                                      />
                                      <span className="text-sm font-medium text-foreground">
                                        {p.name}
                                      </span>
                                      {pi === 0 && (
                                        <Star className="h-3 w-3 text-primary" />
                                      )}
                                    </Link>
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-mono text-sm text-foreground">
                                    {p.kills}
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-mono text-sm text-muted-foreground">
                                    {p.deaths}
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-mono text-sm text-muted-foreground">
                                    {p.assists}
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-mono text-sm font-medium text-foreground">
                                    {p.deaths > 0
                                      ? (p.kills / p.deaths).toFixed(2)
                                      : p.kills.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-mono text-sm text-foreground">
                                    {p.hsp}%
                                  </td>
                                  <td
                                    className={cn(
                                      "px-3 py-2.5 text-right font-mono text-sm font-bold",
                                      p.rating >= 1.0
                                        ? "text-win"
                                        : "text-foreground",
                                    )}
                                  >
                                    {p.rating.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="flex flex-col gap-2 sm:hidden">
                          {c.roster.map((p, pi) => (
                            <Link
                              key={p.steamId}
                              href={`/player/${p.steamId}`}
                              className={cn(
                                "flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30",
                                pi === 0 && "border-primary/20 bg-primary/3",
                              )}
                            >
                              <SteamAvatar
                                avatarUrl={avatars[p.steamId]}
                                name={p.name}
                                size="md"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate text-sm font-semibold text-foreground">
                                    {p.name}
                                  </span>
                                  {pi === 0 && (
                                    <Star className="h-3 w-3 shrink-0 text-primary" />
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>
                                    <span className="font-mono font-medium text-foreground">
                                      {p.kills}
                                    </span>
                                    /{p.deaths}/{p.assists}
                                  </span>
                                  <span className="font-mono">{p.hsp}% HS</span>
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <p
                                  className={cn(
                                    "font-mono text-sm font-bold",
                                    p.rating >= 1.0
                                      ? "text-win"
                                      : "text-foreground",
                                  )}
                                >
                                  {p.rating.toFixed(2)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  Rating
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
