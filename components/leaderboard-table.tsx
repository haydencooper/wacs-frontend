"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { PlayerStat } from "@/lib/types"
import { SteamAvatar } from "@/components/steam-avatar"
import { Trophy, Crown, Medal, GitCompare } from "lucide-react"

const STAGGER_CLASSES = [
  "", "stagger-1", "stagger-2", "stagger-3", "stagger-4",
  "stagger-5", "stagger-6", "stagger-7", "stagger-8", "stagger-9", "stagger-10",
]

interface LeaderboardTableProps {
  players: PlayerStat[]
  avatars?: Record<string, string>
  limit?: number
  showFullStats?: boolean
  startRank?: number
  compareIds?: string[]
  onCompareToggle?: (steamId: string) => void
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15">
        <Crown className="h-4 w-4 text-primary" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted-foreground/10">
        <Medal className="h-4 w-4 text-muted-foreground" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted-foreground/8">
        <Trophy className="h-4 w-4 text-muted-foreground/70" />
      </div>
    )
  }
  return (
    <div className="flex h-7 w-7 items-center justify-center">
      <span className="font-mono text-xs text-muted-foreground">{rank}</span>
    </div>
  )
}

function WinRateBar({ wins, total }: { wins: number; total: number }) {
  const pct = total > 0 ? (wins / total) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 55 ? "bg-win" : pct >= 45 ? "bg-primary" : "bg-loss"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn(
        "font-mono text-sm",
        pct >= 55 ? "text-win" : pct >= 45 ? "text-foreground" : "text-loss"
      )}>
        {pct.toFixed(0)}%
      </span>
    </div>
  )
}

function WinLossRecord({ wins, total }: { wins: number; total: number }) {
  const losses = total - wins
  return (
    <span className="font-mono text-sm">
      <span className="text-win">{wins}W</span>
      <span className="text-muted-foreground/50">-</span>
      <span className="text-loss">{losses}L</span>
    </span>
  )
}

export function LeaderboardTable({
  players,
  avatars = {},
  limit,
  showFullStats = false,
  startRank = 1,
  compareIds,
  onCompareToggle,
}: LeaderboardTableProps) {
  const displayed = limit ? players.slice(0, limit) : players
  const showCompare = Boolean(onCompareToggle)

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              {showCompare && (
                <th className="w-10 px-3 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <GitCompare className="mx-auto h-3.5 w-3.5" />
                </th>
              )}
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Player
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                ELO
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Rating
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                K/D
              </th>
              {showFullStats && (
                <>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    HS%
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Kills
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Deaths
                  </th>
                </>
              )}
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Record
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Win%
              </th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((player, index) => {
              const rank = startRank + index
              const kd = (
                player.deaths > 0
                  ? player.kills / player.deaths
                  : player.kills
              ).toFixed(2)
              const isSelected = compareIds?.includes(player.steamId)

              return (
                <tr
                  key={player.steamId}
                  className={cn(
                    "group border-b border-border/30 transition-colors last:border-0 hover:bg-secondary/20 animate-fade-in-up",
                    rank === 1 && "bg-primary/3",
                    isSelected && "bg-primary/5",
                    STAGGER_CLASSES[Math.min(index, STAGGER_CLASSES.length - 1)]
                  )}
                >
                  {showCompare && (
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => onCompareToggle?.(player.steamId)}
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-transparent hover:border-muted-foreground/40"
                        )}
                        aria-label={`${isSelected ? "Remove" : "Add"} ${player.name} for comparison`}
                      >
                        {isSelected && (
                          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <RankBadge rank={rank} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/player/${player.steamId}`}
                      className="flex items-center gap-2.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
                    >
                      <SteamAvatar
                        avatarUrl={avatars[player.steamId]}
                        name={player.name}
                        size="sm"
                      />
                      {player.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm font-semibold text-primary">
                      {player.points}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "font-mono text-sm font-medium",
                        player.average_rating >= 1.1
                          ? "text-win"
                          : player.average_rating >= 1.0
                            ? "text-foreground"
                            : "text-loss"
                      )}
                    >
                      {player.average_rating.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-foreground">
                    {kd}
                  </td>
                  {showFullStats && (
                    <>
                      <td className="px-4 py-3 text-right font-mono text-sm text-foreground">
                        {player.hsp.toFixed(0)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-foreground">
                        {player.kills.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-foreground">
                        {player.deaths.toLocaleString()}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3 text-right">
                    <WinLossRecord wins={player.wins} total={player.total_maps} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <WinRateBar wins={player.wins} total={player.total_maps} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {displayed.map((player, index) => {
          const rank = startRank + index
          const kd = (
            player.deaths > 0
              ? player.kills / player.deaths
              : player.kills
          ).toFixed(2)
          const winPct =
            player.total_maps > 0
              ? ((player.wins / player.total_maps) * 100).toFixed(0)
              : "0"
          const isSelected = compareIds?.includes(player.steamId)

          return (
            <div
              key={player.steamId}
              className={cn(
                "animate-fade-in-up",
                STAGGER_CLASSES[Math.min(index, STAGGER_CLASSES.length - 1)]
              )}
            >
              <div
                className={cn(
                  "rounded-xl border border-border bg-card p-4 transition-colors",
                  rank === 1 && "border-primary/20 bg-primary/3",
                  isSelected && "border-primary/30 bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <Link
                    href={`/player/${player.steamId}`}
                    className="flex items-center gap-3"
                  >
                    <RankBadge rank={rank} />
                    <SteamAvatar
                      avatarUrl={avatars[player.steamId]}
                      name={player.name}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {player.name}
                    </span>
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-primary">
                      {player.points}
                    </span>
                    {showCompare && (
                      <button
                        onClick={() => onCompareToggle?.(player.steamId)}
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-transparent hover:border-muted-foreground/40"
                        )}
                        aria-label={`${isSelected ? "Remove" : "Add"} ${player.name} for comparison`}
                      >
                        {isSelected && (
                          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Rating</div>
                    <div
                      className={cn(
                        "font-mono text-sm font-medium",
                        player.average_rating >= 1.1
                          ? "text-win"
                          : player.average_rating >= 1.0
                            ? "text-foreground"
                            : "text-loss"
                      )}
                    >
                      {player.average_rating.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">K/D</div>
                    <div className="font-mono text-sm text-foreground">{kd}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Record</div>
                    <WinLossRecord wins={player.wins} total={player.total_maps} />
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Win%</div>
                    <div
                      className={cn(
                        "font-mono text-sm",
                        parseInt(winPct) >= 55
                          ? "text-win"
                          : parseInt(winPct) >= 45
                            ? "text-foreground"
                            : "text-loss"
                      )}
                    >
                      {winPct}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
