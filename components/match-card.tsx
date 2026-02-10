import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Match } from "@/lib/types"
import { RelativeTime } from "@/components/relative-time"
import { getMapDisplayName, getMapMeta } from "@/lib/maps"

function MatchStatus({ match }: { match: Match }) {
  if (match.cancelled) {
    return (
      <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-destructive">
        Cancelled
      </span>
    )
  }
  if (match.forfeit) {
    return (
      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Forfeit
      </span>
    )
  }
  const isCompleted = match.winner !== null || match.end_time !== null
  if (isCompleted) {
    return (
      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Completed
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-live/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-live">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live" />
      </span>
      Live
    </span>
  )
}

export function MatchCard({ match }: { match: Match }) {
  const team1Won = match.winner === 1
  const team2Won = match.winner === 2
  const isLive = match.winner === null && match.end_time === null && !match.cancelled && !match.forfeit
  const displayScore1 = match.team1_mapscore ?? match.team1_score
  const displayScore2 = match.team2_mapscore ?? match.team2_score

  // Extract map name from title if it matches a known map
  const mapName = getMapDisplayName(match.title)
  const mapMeta = getMapMeta(match.title)

  return (
    <Link
      href={`/matches/${match.id}`}
      className={cn(
        "group relative flex flex-col gap-4 overflow-hidden rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md",
        isLive
          ? "border-live/30 animate-pulse-glow hover:border-live/50"
          : "border-border hover:border-primary/30 hover:shadow-primary/5"
      )}
    >

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">
            {"#"}{match.id}
          </span>
          {mapName && (
            <>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className="flex h-4 w-4 items-center justify-center rounded text-[7px] font-bold text-card"
                  style={{ backgroundColor: mapMeta.color }}
                >
                  {mapMeta.code}
                </span>
                {mapName}
              </span>
            </>
          )}
        </div>
        <MatchStatus match={match} />
      </div>

      {/* Score area */}
      <div className="flex items-center gap-4">
        <div className="flex flex-1 flex-col items-end gap-0.5">
          <span
            className={cn(
              "text-[13px] font-semibold leading-tight",
              team1Won ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {match.team1_string}
          </span>
          {team1Won && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-win">Winner</span>
          )}
        </div>

        <div className="flex items-baseline gap-1.5 rounded-lg bg-secondary/60 px-4 py-2">
          <span
            className={cn(
              "font-mono text-2xl font-bold leading-none tabular-nums",
              team1Won ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {displayScore1}
          </span>
          <span className="font-mono text-base text-muted-foreground/40">:</span>
          <span
            className={cn(
              "font-mono text-2xl font-bold leading-none tabular-nums",
              team2Won ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {displayScore2}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-0.5">
          <span
            className={cn(
              "text-[13px] font-semibold leading-tight",
              team2Won ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {match.team2_string}
          </span>
          {team2Won && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-win">Winner</span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
        <RelativeTime date={match.start_time} />
        <div className="flex items-center gap-2">
          {match.is_pug && (
            <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-medium">
              PUG
            </span>
          )}
          {match.max_maps > 1 && (
            <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-medium">
              BO{match.max_maps}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
