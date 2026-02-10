"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { PlayerStat } from "@/lib/types"
import { SteamAvatar } from "@/components/steam-avatar"
import { Search, GitCompare, ArrowLeft, ChevronDown, Swords } from "lucide-react"
import type { Match } from "@/lib/types"

interface PlayerComparisonProps {
  players: PlayerStat[]
  avatars: Record<string, string>
  matches?: Match[]
  /** matchId -> { steamId -> teamNumber (1 or 2) } */
  matchParticipants?: Record<number, Record<string, number>>
}

interface ComparisonStat {
  label: string
  key: string
  getValue: (p: PlayerStat) => number
  format: (v: number) => string
  higherIsBetter: boolean
}

const STATS: ComparisonStat[] = [
  {
    label: "ELO",
    key: "elo",
    getValue: (p) => p.points,
    format: (v) => v.toString(),
    higherIsBetter: true,
  },
  {
    label: "Rating",
    key: "rating",
    getValue: (p) => p.average_rating,
    format: (v) => v.toFixed(2),
    higherIsBetter: true,
  },
  {
    label: "K/D",
    key: "kd",
    getValue: (p) => p.deaths > 0 ? p.kills / p.deaths : p.kills,
    format: (v) => v.toFixed(2),
    higherIsBetter: true,
  },
  {
    label: "Kills",
    key: "kills",
    getValue: (p) => p.kills,
    format: (v) => v.toLocaleString(),
    higherIsBetter: true,
  },
  {
    label: "Deaths",
    key: "deaths",
    getValue: (p) => p.deaths,
    format: (v) => v.toLocaleString(),
    higherIsBetter: false,
  },
  {
    label: "Assists",
    key: "assists",
    getValue: (p) => p.assists,
    format: (v) => v.toLocaleString(),
    higherIsBetter: true,
  },
  {
    label: "HS%",
    key: "hsp",
    getValue: (p) => p.hsp,
    format: (v) => `${v.toFixed(1)}%`,
    higherIsBetter: true,
  },
  {
    label: "Win Rate",
    key: "winrate",
    getValue: (p) => p.total_maps > 0 ? (p.wins / p.total_maps) * 100 : 0,
    format: (v) => `${v.toFixed(1)}%`,
    higherIsBetter: true,
  },
  {
    label: "Wins",
    key: "wins",
    getValue: (p) => p.wins,
    format: (v) => v.toString(),
    higherIsBetter: true,
  },
  {
    label: "Maps Played",
    key: "maps",
    getValue: (p) => p.total_maps,
    format: (v) => v.toString(),
    higherIsBetter: true,
  },
  {
    label: "Rounds",
    key: "rounds",
    getValue: (p) => p.roundsplayed,
    format: (v) => v.toLocaleString(),
    higherIsBetter: true,
  },
  {
    label: "3K Rounds",
    key: "k3",
    getValue: (p) => p.k3,
    format: (v) => v.toString(),
    higherIsBetter: true,
  },
  {
    label: "4K Rounds",
    key: "k4",
    getValue: (p) => p.k4,
    format: (v) => v.toString(),
    higherIsBetter: true,
  },
  {
    label: "Aces (5K)",
    key: "k5",
    getValue: (p) => p.k5,
    format: (v) => v.toString(),
    higherIsBetter: true,
  },
  {
    label: "1v1 Clutches",
    key: "v1",
    getValue: (p) => p.v1,
    format: (v) => v.toString(),
    higherIsBetter: true,
  },
  {
    label: "1v2 Clutches",
    key: "v2",
    getValue: (p) => p.v2,
    format: (v) => v.toString(),
    higherIsBetter: true,
  },
]

function PlayerSelector({
  players,
  selected,
  onSelect,
  otherSelected,
  label,
  avatars,
  zIndex,
}: {
  players: PlayerStat[]
  selected: PlayerStat | null
  onSelect: (p: PlayerStat) => void
  otherSelected: PlayerStat | null
  label: string
  avatars: Record<string, string>
  zIndex: number
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const filtered = useMemo(() => {
    if (!search.trim()) return players
    const q = search.toLowerCase()
    return players.filter(
      (p) => p.name.toLowerCase().includes(q) || p.steamId.includes(q)
    )
  }, [players, search])

  return (
    <div ref={containerRef} className="relative" style={{ zIndex: open ? 50 : zIndex }}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-4 py-3 text-left transition-colors",
          selected ? "border-border" : "border-border hover:border-muted-foreground/30"
        )}
      >
        {selected ? (
          <div className="flex items-center gap-3">
            <SteamAvatar
              avatarUrl={avatars[selected.steamId]}
              name={selected.name}
              size="md"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">{selected.name}</p>
              <p className="text-[11px] text-muted-foreground">ELO: {selected.points}</p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{label}</span>
        )}
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search players..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-border bg-secondary/50 py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">No players found</p>
            ) : (
              filtered.map((player) => {
                const isOther = otherSelected?.steamId === player.steamId
                return (
                  <button
                    key={player.steamId}
                    onClick={() => { onSelect(player); setOpen(false); setSearch("") }}
                    disabled={isOther}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      isOther
                        ? "cursor-not-allowed opacity-40"
                        : selected?.steamId === player.steamId
                          ? "bg-secondary text-foreground"
                          : "text-foreground hover:bg-secondary"
                    )}
                  >
                    <SteamAvatar
                      avatarUrl={avatars[player.steamId]}
                      name={player.name}
                      size="sm"
                    />
                    <span className="font-medium">{player.name}</span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">{player.points}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ComparisonBar({
  stat,
  player1,
  player2,
}: {
  stat: ComparisonStat
  player1: PlayerStat
  player2: PlayerStat
}) {
  const v1 = stat.getValue(player1)
  const v2 = stat.getValue(player2)
  const total = v1 + v2
  const pct1 = total > 0 ? (v1 / total) * 100 : 50

  let winner: 0 | 1 | 2 = 0
  if (v1 !== v2) {
    if (stat.higherIsBetter) {
      winner = v1 > v2 ? 1 : 2
    } else {
      winner = v1 < v2 ? 1 : 2
    }
  }

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "font-mono text-sm font-bold",
            winner === 1 ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {stat.format(v1)}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {stat.label}
        </span>
        <span
          className={cn(
            "font-mono text-sm font-bold",
            winner === 2 ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {stat.format(v2)}
        </span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "rounded-l-full transition-all",
            winner === 1 ? "bg-foreground" : "bg-muted-foreground/20"
          )}
          style={{ width: `${pct1}%` }}
        />
        <div
          className={cn(
            "rounded-r-full transition-all",
            winner === 2 ? "bg-foreground" : "bg-muted-foreground/20"
          )}
          style={{ width: `${100 - pct1}%` }}
        />
      </div>
    </div>
  )
}

export function PlayerComparison({ players, avatars, matches = [], matchParticipants = {} }: PlayerComparisonProps) {
  const searchParams = useSearchParams()
  const initialId1 = searchParams.get("player1") ?? ""
  const initialId2 = searchParams.get("player2") ?? ""

  const initialPlayer1 = players.find((p) => p.steamId === initialId1) ?? null
  const initialPlayer2 = players.find((p) => p.steamId === initialId2) ?? null

  const [player1, setPlayer1] = useState<PlayerStat | null>(initialPlayer1)
  const [player2, setPlayer2] = useState<PlayerStat | null>(initialPlayer2)

  const bothSelected = player1 && player2

  // Count who wins more categories
  const score = useMemo(() => {
    if (!bothSelected) return { p1: 0, p2: 0 }
    let p1 = 0
    let p2 = 0
    for (const stat of STATS) {
      const v1 = stat.getValue(player1)
      const v2 = stat.getValue(player2)
      if (v1 === v2) continue
      if (stat.higherIsBetter) {
        if (v1 > v2) p1++; else p2++
      } else {
        if (v1 < v2) p1++; else p2++
      }
    }
    return { p1, p2 }
  }, [bothSelected, player1, player2])

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 lg:px-8">
      <Link
        href="/leaderboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to leaderboard
      </Link>

      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <GitCompare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">Player Comparison</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Select two players to compare their stats head-to-head.
            </p>
          </div>
        </div>
      </div>

      {/* Player selectors - z-40 ensures dropdowns layer above the content below */}
      <div className="relative z-40 mb-8 grid gap-4 md:grid-cols-2 animate-fade-in-up stagger-1">
        <div>
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Player 1
          </label>
          <PlayerSelector
            players={players}
            selected={player1}
            onSelect={setPlayer1}
            otherSelected={player2}
            label="Select first player..."
            avatars={avatars}
            zIndex={20}
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Player 2
          </label>
          <PlayerSelector
            players={players}
            selected={player2}
            onSelect={setPlayer2}
            otherSelected={player1}
            label="Select second player..."
            avatars={avatars}
            zIndex={10}
          />
        </div>
      </div>

      {/* Comparison results */}
      {bothSelected ? (
        <div className="relative z-0 animate-fade-in-up stagger-2">
          {/* Summary */}
          <div className="mb-8 rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href={`/player/${player1.steamId}`} className="group flex items-center gap-2">
                  <SteamAvatar
                    avatarUrl={avatars[player1.steamId]}
                    name={player1.name}
                    size="lg"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:underline">{player1.name}</p>
                    <p className="text-[11px] text-muted-foreground">{score.p1} categories won</p>
                  </div>
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <span className={cn("font-mono text-3xl font-bold", score.p1 > score.p2 ? "text-foreground" : "text-muted-foreground")}>
                  {score.p1}
                </span>
                <span className="text-lg text-muted-foreground/40">vs</span>
                <span className={cn("font-mono text-3xl font-bold", score.p2 > score.p1 ? "text-foreground" : "text-muted-foreground")}>
                  {score.p2}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Link href={`/player/${player2.steamId}`} className="group flex items-center gap-2">
                  <div>
                    <p className="text-right text-sm font-medium text-foreground group-hover:underline">{player2.name}</p>
                    <p className="text-right text-[11px] text-muted-foreground">{score.p2} categories won</p>
                  </div>
                  <SteamAvatar
                    avatarUrl={avatars[player2.steamId]}
                    name={player2.name}
                    size="lg"
                  />
                </Link>
              </div>
            </div>
          </div>

          {/* Head-to-Head Match Record */}
          {(() => {
            // Use pre-computed match participants to find matches where both
            // players participated on OPPOSING teams
            let p1Wins = 0
            let p2Wins = 0
            let h2hCount = 0

            for (const m of matches) {
              if (m.cancelled) continue
              const participants = matchParticipants[m.id]
              if (!participants) continue

              const p1Team = participants[player1.steamId]
              const p2Team = participants[player2.steamId]
              // __winner is a special key set by the server with the correct winning team number
              const winningTeam = participants["__winner"]

              // Both must be present and on different teams, and we need a winner
              if (!p1Team || !p2Team || p1Team === p2Team || !winningTeam) continue

              h2hCount++
              // Did player1's team win?
              if (winningTeam === p1Team) {
                p1Wins++
              } else if (winningTeam === p2Team) {
                p2Wins++
              }
            }

            if (h2hCount === 0) return null

            return (
              <div className="mb-8 rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <Swords className="h-3.5 w-3.5" />
                  Head-to-Head Record
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-center">
                    <div className={cn("font-mono text-2xl font-bold", p1Wins > p2Wins ? "text-win" : "text-foreground")}>
                      {p1Wins}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{player1.name}</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-xs text-muted-foreground">
                      {h2hCount} match{h2hCount !== 1 ? "es" : ""} on opposing teams
                    </div>
                    {/* Bar visualization */}
                    <div className="mx-auto mt-2 flex h-2 max-w-xs overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn("rounded-l-full", p1Wins > p2Wins ? "bg-win" : "bg-muted-foreground/30")}
                        style={{ width: `${h2hCount > 0 ? (p1Wins / h2hCount) * 100 : 50}%` }}
                      />
                      <div
                        className={cn("rounded-r-full", p2Wins > p1Wins ? "bg-win" : "bg-muted-foreground/30")}
                        style={{ width: `${h2hCount > 0 ? (p2Wins / h2hCount) * 100 : 50}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={cn("font-mono text-2xl font-bold", p2Wins > p1Wins ? "text-win" : "text-foreground")}>
                      {p2Wins}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{player2.name}</div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Stat-by-stat comparison */}
          <div className="rounded-xl border border-border bg-card px-6 divide-y divide-border/30">
            {STATS.map((stat) => (
              <ComparisonBar key={stat.key} stat={stat} player1={player1} player2={player2} />
            ))}
          </div>
        </div>
      ) : (
        <div className="relative z-0 animate-fade-in-up stagger-2 rounded-xl border border-border bg-card p-12 text-center">
          <GitCompare className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-4 font-heading text-base font-medium text-foreground">Select two players</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose both players to see a detailed stat-by-stat comparison.
          </p>
        </div>
      )}
    </div>
  )
}
