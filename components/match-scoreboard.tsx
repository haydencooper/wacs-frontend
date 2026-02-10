import Link from "next/link"
import { cn } from "@/lib/utils"
import type { PlayerStat } from "@/lib/types"
import { SteamAvatar } from "@/components/steam-avatar"
import { Trophy } from "lucide-react"

interface MatchScoreboardProps {
  teamName: string
  players: PlayerStat[]
  isWinner: boolean
  avatars?: Record<string, string>
}

export function MatchScoreboard({
  teamName,
  players,
  isWinner,
  avatars = {},
}: MatchScoreboardProps) {
  // Find best rating player on this team
  const bestRating = players.length > 0
    ? Math.max(...players.map((p) => p.average_rating))
    : 0

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border",
        isWinner ? "border-win/25" : "border-border"
      )}
    >
      {/* Team header */}
      <div
        className={cn(
          "flex items-center justify-between px-5 py-3.5",
          isWinner ? "bg-win/8" : "bg-secondary/50"
        )}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "text-sm font-bold",
              isWinner ? "text-win" : "text-foreground"
            )}
          >
            {teamName}
          </span>
          {isWinner && (
            <span className="flex items-center gap-1 rounded-full bg-win/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-win">
              <Trophy className="h-3 w-3" />
              Win
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          {players.length} players
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/20">
              <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Player
              </th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                K
              </th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                A
              </th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                D
              </th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                K/D
              </th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                HS%
              </th>
              <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Rating
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => {
              const kdNum = player.deaths > 0
                ? player.kills / player.deaths
                : player.kills
              const kd = kdNum.toFixed(2)
              const hasRating = player.average_rating > 0
              const isMvp = hasRating && player.average_rating === bestRating && bestRating > 0
              return (
                <tr
                  key={player.steamId}
                  className={cn(
                    "border-b border-border/20 last:border-0 transition-colors hover:bg-secondary/20",
                    isMvp && "bg-primary/3"
                  )}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <SteamAvatar
                        avatarUrl={avatars[player.steamId]}
                        name={player.name}
                        size="sm"
                      />
                      <Link
                        href={`/player/${player.steamId}`}
                        className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                      >
                        {player.name}
                      </Link>
                      {isMvp && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                          MVP
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm font-medium text-foreground">
                    {player.kills}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm text-muted-foreground">
                    {player.assists}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm font-medium text-foreground">
                    {player.deaths}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span
                      className={cn(
                        "font-mono text-sm font-semibold",
                        kdNum >= 1.2
                          ? "text-win"
                          : kdNum >= 1.0
                            ? "text-foreground"
                            : "text-loss"
                      )}
                    >
                      {kd}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm text-foreground">
                    {player.hsp.toFixed(0)}%
                  </td>
                  <td className="px-5 py-3 text-right">
                    {hasRating ? (
                      <span
                        className={cn(
                          "font-mono text-sm font-bold",
                          player.average_rating >= 1.1
                            ? "text-win"
                            : player.average_rating >= 1.0
                              ? "text-foreground"
                              : "text-loss"
                        )}
                      >
                        {player.average_rating.toFixed(2)}
                      </span>
                    ) : (
                      <span className="font-mono text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="flex flex-col divide-y divide-border/20 md:hidden">
        {players.map((player) => {
          const kdNum = player.deaths > 0
            ? player.kills / player.deaths
            : player.kills
          const kd = kdNum.toFixed(2)
          const hasRating = player.average_rating > 0
          const isMvp = hasRating && player.average_rating === bestRating && bestRating > 0
          return (
            <Link
              key={player.steamId}
              href={`/player/${player.steamId}`}
              className={cn(
                "flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-secondary/20",
                isMvp && "bg-primary/3"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SteamAvatar
                    avatarUrl={avatars[player.steamId]}
                    name={player.name}
                    size="sm"
                  />
                  <span className="text-sm font-semibold text-foreground">
                    {player.name}
                  </span>
                  {isMvp && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                      MVP
                    </span>
                  )}
                </div>
                {hasRating ? (
                  <span
                    className={cn(
                      "font-mono text-sm font-bold",
                      player.average_rating >= 1.1
                        ? "text-win"
                        : player.average_rating >= 1.0
                          ? "text-foreground"
                          : "text-loss"
                    )}
                  >
                    {player.average_rating.toFixed(2)}
                  </span>
                ) : (
                  <span className="font-mono text-sm text-muted-foreground">-</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">K</div>
                  <div className="font-mono text-xs font-medium text-foreground">{player.kills}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">D</div>
                  <div className="font-mono text-xs font-medium text-foreground">{player.deaths}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">K/D</div>
                  <div className={cn(
                    "font-mono text-xs font-semibold",
                    kdNum >= 1.2 ? "text-win" : kdNum >= 1.0 ? "text-foreground" : "text-loss"
                  )}>
                    {kd}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">HS%</div>
                  <div className="font-mono text-xs text-foreground">{player.hsp.toFixed(0)}%</div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
