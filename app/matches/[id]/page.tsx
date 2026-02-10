import { fetchMatch, fetchMapStats, fetchMatchPlayerStats } from "@/lib/api"
import { fetchSteamAvatars } from "@/lib/steam"
import { cn } from "@/lib/utils"
import { SteamAvatar } from "@/components/steam-avatar"
import { Clock, MapPin, Swords, Trophy } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MatchScoreboard } from "@/components/match-scoreboard"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ShareButton } from "@/components/share-button"
import { LiveMatchRefresh } from "@/components/live-match-refresh"
import { getMapDisplayName, getMapMeta } from "@/lib/maps"

export const dynamic = "force-dynamic"

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getDuration(start: string, end: string | null) {
  if (!end) return "In progress"
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const minutes = Math.floor(ms / 60000)
  return `${minutes} min`
}



export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const match = await fetchMatch(id)

  if (!match) notFound()

  const [maps, playerStats] = await Promise.all([
    fetchMapStats(id, match),
    fetchMatchPlayerStats(id, match),
  ])

  let displayScore1 = match.team1_mapscore ?? match.team1_score
  let displayScore2 = match.team2_mapscore ?? match.team2_score
  if (match.team1_mapscore == null && maps.length === 1) {
    displayScore1 = maps[0].team1_score
    displayScore2 = maps[0].team2_score
  }

  let team1Won = match.winner === 1
  let team2Won = match.winner === 2
  if (!team1Won && !team2Won && match.end_time && !match.cancelled && !match.forfeit) {
    if (displayScore1 > displayScore2) {
      team1Won = true
    } else if (displayScore2 > displayScore1) {
      team2Won = true
    }
  }

  const isLive = !match.end_time && !match.cancelled && !match.forfeit && match.winner === null

  const team1Players = playerStats.team1
  const team2Players = playerStats.team2

  // Find MVP (highest rated player)
  const allPlayers = [...team1Players, ...team2Players]

  // Fetch Steam avatars for all players
  const allSteamIds = allPlayers.map((p) => p.steamId).filter(Boolean)
  const avatars = await fetchSteamAvatars(allSteamIds)
  const mvp = allPlayers.length > 0
    ? allPlayers.reduce((a, b) => a.average_rating > b.average_rating ? a : b)
    : null

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/" },
        { label: "Matches", href: "/matches" },
        { label: `Match #${match.id}` },
      ]} />

      {/* Live auto-refresh for in-progress matches */}
      {isLive && (
        <div className="mb-6">
          <LiveMatchRefresh isLive={isLive} interval={15} />
        </div>
      )}

      {/* Match Header - Hero */}
      <div className={cn(
        "relative mb-8 overflow-hidden rounded-xl border bg-card p-8 animate-fade-in-up",
        isLive ? "border-live/30" : "border-border"
      )}>
        {/* Subtle accent glow */}
        {(team1Won || team2Won) && (
          <div className="absolute inset-0 bg-gradient-to-b from-primary/3 to-transparent" />
        )}
        {isLive && (
          <div className="absolute inset-0 bg-gradient-to-b from-live/5 to-transparent" />
        )}

        <div className="relative">
          <div className="mb-6 flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono">{"#"}{match.id}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>{match.is_pug ? "PUG Match" : "Team Match"}</span>
            {isLive && (
              <>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="flex items-center gap-1.5 font-semibold text-live">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live" />
                  </span>
                  LIVE
                </span>
              </>
            )}
            {match.cancelled && (
              <>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="font-semibold text-destructive">Cancelled</span>
              </>
            )}
          </div>

          {/* Score display */}
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-center">
            <div className="flex flex-1 flex-col items-center gap-2 md:items-end">
              <span className={cn(
                "font-heading text-xl font-semibold md:text-2xl",
                team1Won ? "text-win" : "text-foreground"
              )}>
                {match.team1_string}
              </span>
              {team1Won && (
                <span className="flex items-center gap-1 text-xs font-semibold text-win">
                  <Trophy className="h-3 w-3" />
                  Winner
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3 rounded-xl bg-secondary/60 px-8 py-4">
              <span className={cn(
                "font-mono text-5xl font-bold leading-none tracking-tight",
                team1Won ? "text-win" : "text-foreground"
              )}>
                {displayScore1}
              </span>
              <span className="font-mono text-2xl text-muted-foreground/40">:</span>
              <span className={cn(
                "font-mono text-5xl font-bold leading-none tracking-tight",
                team2Won ? "text-win" : "text-foreground"
              )}>
                {displayScore2}
              </span>
            </div>

            <div className="flex flex-1 flex-col items-center gap-2 md:items-start">
              <span className={cn(
                "font-heading text-xl font-semibold md:text-2xl",
                team2Won ? "text-win" : "text-foreground"
              )}>
                {match.team2_string}
              </span>
              {team2Won && (
                <span className="flex items-center gap-1 text-xs font-semibold text-win">
                  <Trophy className="h-3 w-3" />
                  Winner
                </span>
              )}
            </div>
          </div>

          {/* Match meta */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <ShareButton className="text-xs" />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDateTime(match.start_time)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Swords className="h-3.5 w-3.5" />
              <span>{getDuration(match.start_time, match.end_time)}</span>
            </div>
            {match.title && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>{match.title}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MVP Highlight */}
      {mvp && mvp.average_rating > 0 && !isLive && (
        <div className="mb-8 animate-fade-in-up stagger-1">
          <Link
            href={`/player/${mvp.steamId}`}
            className="group flex items-center gap-4 rounded-lg border border-primary/20 bg-primary/5 px-5 py-4 transition-all hover:border-primary/40 hover:bg-primary/10"
          >
            <SteamAvatar
              avatarUrl={avatars[mvp.steamId]}
              name={mvp.name}
              size="lg"
            />
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70">
                Match MVP
              </p>
              <p className="text-sm font-bold text-foreground">{mvp.name}</p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="font-mono text-lg font-bold text-primary">{mvp.average_rating.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">Rating</p>
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-foreground">{mvp.kills}/{mvp.deaths}</p>
                <p className="text-[10px] text-muted-foreground">K/D</p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Map Stats */}
      {maps.length > 0 && (
        <section className="mb-8 animate-fade-in-up stagger-1">
          <h2 className="mb-4 font-heading text-lg font-medium text-foreground">
            {maps.length === 1 ? "Map" : "Map Results"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {maps.map((map) => {
              const mapWinner = map.winner
              const mapMeta = getMapMeta(map.map_name)
              return (
                <div key={map.id} className={cn(
                  "relative overflow-hidden rounded-lg border bg-card p-5",
                  mapWinner ? "border-border" : "border-border"
                )}>
                  {/* Map color accent bar */}
                  <div
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ backgroundColor: mapMeta.color }}
                  />
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded text-[9px] font-bold text-card"
                        style={{ backgroundColor: mapMeta.color }}
                      >
                        {mapMeta.code}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {getMapDisplayName(map.map_name) || map.map_name}
                      </span>
                    </div>
                    {match.max_maps > 1 && (
                      <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                        Map {map.map_number}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-secondary/60 px-4 py-3">
                    <span className="text-xs font-medium text-muted-foreground">{match.team1_string}</span>
                    <div className="flex items-baseline gap-2">
                      <span className={cn(
                        "font-mono text-xl font-bold",
                        mapWinner === 1 ? "text-win" : "text-foreground"
                      )}>
                        {map.team1_score}
                      </span>
                      <span className="font-mono text-sm text-muted-foreground/40">:</span>
                      <span className={cn(
                        "font-mono text-xl font-bold",
                        mapWinner === 2 ? "text-win" : "text-foreground"
                      )}>
                        {map.team2_score}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{match.team2_string}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Scoreboard */}
      <section className="animate-fade-in-up stagger-2">
        <h2 className="mb-4 font-heading text-lg font-medium text-foreground">Scoreboard</h2>
        {team1Players.length === 0 && team2Players.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <Swords className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No player stats available</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Player statistics will appear once the match data is recorded.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <MatchScoreboard teamName={match.team1_string} players={team1Players} isWinner={team1Won} avatars={avatars} />
            <MatchScoreboard teamName={match.team2_string} players={team2Players} isWinner={team2Won} avatars={avatars} />
          </div>
        )}
      </section>
    </div>
  )
}
