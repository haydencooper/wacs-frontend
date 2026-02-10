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

/**
 * Determines the player's outcome for a match:
 *   - "win" if the player's team won
 *   - "loss" if the player's team lost
 *   - null if undetermined (live, cancelled, etc.)
 */
function getOutcome(match: Match, playerTeam: number | null): "win" | "loss" | null {
  if (!playerTeam || match.cancelled || match.forfeit) return null
  if (match.winner === null) return null // live or unknown
  return match.winner === playerTeam ? "win" : "loss"
}

interface MatchCardWithOutcomeProps {
  match: Match
  /** Which team (1 or 2) the player was on, or null if unknown */
  playerTeam: number | null
}

export function MatchCardWithOutcome({ match, playerTeam }: MatchCardWithOutcomeProps) {
  const team1Won = match.winner === 1
  const team2Won = match.winner === 2
  const isLive = match.winner === null && match.end_time === null && !match.cancelled && !match.forfeit
  const displayScore1 = match.team1_mapscore ?? match.team1_score
  const displayScore2 = match.team2_mapscore ?? match.team2_score
  const outcome = getOutcome(match, playerTeam)
  const mapName = getMapDisplayName(match.title)
  const mapMeta = getMapMeta(match.title)

  return (
    <Link
      href={`/matches/${match.id}`}
      className={cn(
        "group relative flex flex-col gap-4 overflow-hidden rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md",
        isLive
          ? "border-live/30 animate-pulse-glow hover:border-live/50"
          : outcome === "win"
          ? "border-win/20 hover:border-win/40 hover:shadow-win/5"
          : outcome === "loss"
          ? "border-loss/20 hover:border-loss/40 hover:shadow-loss/5"
          : "border-border hover:border-primary/30 hover:shadow-primary/5"
      )}
    >
      {/* Outcome accent bar */}
      {outcome && (
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-0.5",
            outcome === "win" ? "bg-win" : "bg-loss"
          )}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">
            {"#"}{match.id}
          </span>
          {mapName && (
            <>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
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
        <div className="flex items-center gap-2">
          {outcome && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                outcome === "win"
                  ? "bg-win/10 text-win"
                  : "bg-loss/10 text-loss"
              )}
            >
              {outcome === "win" ? "W" : "L"}
            </span>
          )}
          <MatchStatus match={match} />
        </div>
      </div>

      {/* Score area */}
      <div className="flex items-center gap-4">
        <div className="flex flex-1 flex-col items-end gap-0.5">
          <span
            className={cn(
              "text-[13px] font-semibold leading-tight",
              team1Won ? "text-foreground" : "text-muted-foreground",
              playerTeam === 1 && "underline decoration-foreground/30 underline-offset-2"
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
              team2Won ? "text-foreground" : "text-muted-foreground",
              playerTeam === 2 && "underline decoration-foreground/30 underline-offset-2"
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
