import { fetchSeasons, fetchMatches, fetchLeaderboard } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Calendar, Trophy, Swords, Users, ArrowRight } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

function formatDate(iso: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default async function SeasonsPage() {
  const [seasons, allMatches, leaderboard] = await Promise.all([
    fetchSeasons(),
    fetchMatches(),
    fetchLeaderboard(),
  ])

  // Group matches by season_id
  const matchesBySeason = new Map<number | null, typeof allMatches>()
  for (const match of allMatches) {
    const sid = match.season_id
    if (!matchesBySeason.has(sid)) matchesBySeason.set(sid, [])
    matchesBySeason.get(sid)!.push(match)
  }

  // Determine active season
  const now = new Date()
  const activeSeason = seasons.find(
    (s) => new Date(s.start_date) <= now && (!s.end_date || new Date(s.end_date) >= now)
  )

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <section className="mb-8 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              Seasons
            </h1>
            <p className="text-sm text-muted-foreground">
              Competitive season history and standings
            </p>
          </div>
        </div>
      </section>

      {/* Active Season Highlight */}
      {activeSeason && (
        <section className="mb-8 animate-fade-in-up stagger-1">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Active Season
              </span>
            </div>
            <h2 className="mb-2 font-heading text-2xl font-semibold text-foreground">
              {activeSeason.name}
            </h2>
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(activeSeason.start_date)} — {activeSeason.end_date ? formatDate(activeSeason.end_date) : "Ongoing"}
              </span>
              <span className="flex items-center gap-1.5">
                <Swords className="h-3.5 w-3.5" />
                {matchesBySeason.get(activeSeason.id)?.length ?? 0} matches
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {leaderboard.length} players
              </span>
            </div>

            {/* Season progress bar */}
            {activeSeason.end_date && (
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>
                    {Math.min(
                      100,
                      Math.round(
                        ((now.getTime() - new Date(activeSeason.start_date).getTime()) /
                          (new Date(activeSeason.end_date).getTime() - new Date(activeSeason.start_date).getTime())) *
                          100
                      )
                    )}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        ((now.getTime() - new Date(activeSeason.start_date).getTime()) /
                          (new Date(activeSeason.end_date).getTime() - new Date(activeSeason.start_date).getTime())) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <Link
                href="/leaderboard"
                className="group flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                View Leaderboard
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* All Seasons Grid */}
      <section className="animate-fade-in-up stagger-2">
        <h2 className="mb-4 font-heading text-lg font-medium text-foreground">
          All Seasons
        </h2>
        {seasons.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No seasons yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Seasons will appear here once configured.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {seasons.map((season) => {
              const seasonMatches = matchesBySeason.get(season.id) ?? []
              const completedMatches = seasonMatches.filter(
                (m) => m.winner !== null || m.end_time !== null
              )
              const isActive = activeSeason?.id === season.id
              const isEnded = season.end_date && new Date(season.end_date) < now

              return (
                <div
                  key={season.id}
                  className={cn(
                    "flex flex-col rounded-xl border bg-card p-5 transition-all",
                    isActive
                      ? "border-primary/30 shadow-sm shadow-primary/5"
                      : "border-border"
                  )}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{season.id}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : isEnded
                          ? "bg-secondary text-muted-foreground"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {isActive ? "Active" : isEnded ? "Ended" : "Upcoming"}
                    </span>
                  </div>

                  <h3 className="mb-1 font-heading text-lg font-semibold text-foreground">
                    {season.name}
                  </h3>

                  <p className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(season.start_date)}
                    {season.end_date && ` — ${formatDate(season.end_date)}`}
                  </p>

                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-secondary/50 p-3 text-center">
                      <div className="font-mono text-lg font-bold text-foreground">
                        {seasonMatches.length}
                      </div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Matches
                      </div>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3 text-center">
                      <div className="font-mono text-lg font-bold text-foreground">
                        {completedMatches.length}
                      </div>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Completed
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Unassigned Matches Summary */}
      {(matchesBySeason.get(null)?.length ?? 0) > 0 && (
        <section className="mt-8 animate-fade-in-up stagger-3">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-sm font-medium text-foreground">
                  Unassigned Matches
                </h3>
                <p className="text-xs text-muted-foreground">
                  {matchesBySeason.get(null)?.length} matches not assigned to any season
                </p>
              </div>
              <Link
                href="/matches"
                className="group flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                View all
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
