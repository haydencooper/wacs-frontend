"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { LeaderboardTable } from "@/components/leaderboard-table"
import type { PlayerStat, Season, Match } from "@/lib/types"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, GitCompare, Calendar } from "lucide-react"
import { PAGE_SIZE } from "@/lib/constants"

const ITEMS_PER_PAGE = PAGE_SIZE

type SortKey = "points" | "average_rating" | "kills" | "kd" | "winPct"
type SortDir = "asc" | "desc"

interface LeaderboardViewProps {
  players: PlayerStat[]
  avatars?: Record<string, string>
  seasons?: Season[]
  matches?: Match[]
  /** Pre-select a season on mount (used when embedded in competition detail). */
  initialSeason?: number
  /** When true, state is managed locally without syncing to URL search params. */
  disableUrlSync?: boolean
  /** When true, the season filter buttons are hidden (useful when already scoped to a competition). */
  hideSeasonFilter?: boolean
  /**
   * Pre-computed list of steam IDs that participated in the season.
   * When provided, this bypasses the name-matching heuristic for season filtering.
   * Useful when team names don't contain individual player names.
   */
  participantSteamIds?: string[]
}

export function LeaderboardView({
  players,
  avatars = {},
  seasons = [],
  matches = [],
  initialSeason,
  disableUrlSync = false,
  hideSeasonFilter = false,
  participantSteamIds,
}: LeaderboardViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(disableUrlSync ? "" : (searchParams.get("q") ?? ""))
  const [sortKey, setSortKey] = useState<SortKey>(
    disableUrlSync ? "points" : ((searchParams.get("sort") as SortKey) || "points")
  )
  const [sortDir, setSortDir] = useState<SortDir>(
    disableUrlSync ? "desc" : ((searchParams.get("dir") as SortDir) || "desc")
  )
  const [page, setPage] = useState(disableUrlSync ? 1 : (Number(searchParams.get("page")) || 1))
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [selectedSeason, setSelectedSeason] = useState<number | null>(
    initialSeason ?? (disableUrlSync ? null : (searchParams.get("season") ? Number(searchParams.get("season")) : null))
  )
  const searchRef = useRef<HTMLInputElement>(null)

  // Build a set of player steamIds that participated in the selected season.
  // If participantSteamIds is provided (pre-computed from actual match rosters),
  // use it directly — this is more reliable than the name-matching heuristic
  // because team names may not contain individual player names.
  const seasonPlayerIds = useMemo(() => {
    if (selectedSeason === null) return null

    // Use pre-computed steam IDs when available (bypasses name-matching heuristic)
    if (participantSteamIds && participantSteamIds.length > 0) {
      return new Set(participantSteamIds)
    }

    // Fallback: name-matching heuristic for PUG-style team strings
    const ids = new Set<string>()
    const seasonMatches = matches.filter((m) => m.season_id === selectedSeason && !m.cancelled)
    for (const m of seasonMatches) {
      const t1Lower = m.team1_string.toLowerCase()
      const t2Lower = m.team2_string.toLowerCase()
      for (const p of players) {
        const nameLower = p.name.toLowerCase()
        if (t1Lower.includes(nameLower) || t2Lower.includes(nameLower)) {
          ids.add(p.steamId)
        }
      }
    }
    return ids
  }, [selectedSeason, matches, players, participantSteamIds])

  // Sync state to URL
  const updateUrl = useCallback((q: string, sort: SortKey, dir: SortDir, p: number, season: number | null) => {
    if (disableUrlSync) return
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    if (sort !== "points") params.set("sort", sort)
    if (dir !== "desc") params.set("dir", dir)
    if (p > 1) params.set("page", String(p))
    if (season !== null) params.set("season", String(season))
    const qs = params.toString()
    router.replace(`/leaderboard${qs ? `?${qs}` : ""}`, { scroll: false })
  }, [router, disableUrlSync])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === "INPUT" || tag === "TEXTAREA") return
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const filtered = useMemo(() => {
    let result = [...players]

    // Filter by season
    if (seasonPlayerIds !== null) {
      result = result.filter((p) => seasonPlayerIds.has(p.steamId))
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.steamId.includes(q)
      )
    }

    result.sort((a, b) => {
      let aVal: number
      let bVal: number

      switch (sortKey) {
        case "points":
          aVal = a.points; bVal = b.points; break
        case "average_rating":
          aVal = a.average_rating; bVal = b.average_rating; break
        case "kills":
          aVal = a.kills; bVal = b.kills; break
        case "kd":
          aVal = a.deaths > 0 ? a.kills / a.deaths : a.kills
          bVal = b.deaths > 0 ? b.kills / b.deaths : b.kills
          break
        case "winPct":
          aVal = a.total_maps > 0 ? a.wins / a.total_maps : 0
          bVal = b.total_maps > 0 ? b.wins / b.total_maps : 0
          break
        default:
          aVal = a.points; bVal = b.points
      }

      return sortDir === "desc" ? bVal - aVal : aVal - bVal
    })

    return result
  }, [players, search, sortKey, sortDir, seasonPlayerIds])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Keyboard shortcuts for pagination
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return
      if (e.key === "ArrowLeft" && currentPage > 1) {
        e.preventDefault()
        const newPage = currentPage - 1
        setPage(newPage)
        updateUrl(search, sortKey, sortDir, newPage, selectedSeason)
      }
      if (e.key === "ArrowRight" && currentPage < totalPages) {
        e.preventDefault()
        const newPage = currentPage + 1
        setPage(newPage)
        updateUrl(search, sortKey, sortDir, newPage, selectedSeason)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [currentPage, totalPages, search, sortKey, sortDir, selectedSeason, updateUrl])

  function handleSortChange(key: SortKey) {
    let newDir: SortDir = "desc"
    if (sortKey === key) {
      newDir = sortDir === "desc" ? "asc" : "desc"
      setSortDir(newDir)
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
    setPage(1)
    updateUrl(search, key, newDir, 1, selectedSeason)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
    updateUrl(value, sortKey, sortDir, 1, selectedSeason)
  }

  function handlePageChange(p: number) {
    setPage(p)
    updateUrl(search, sortKey, sortDir, p, selectedSeason)
  }

  function handleSeasonChange(seasonId: number | null) {
    setSelectedSeason(seasonId)
    setPage(1)
    updateUrl(search, sortKey, sortDir, 1, seasonId)
  }

  function handleCompareToggle(steamId: string) {
    setCompareIds((prev) => {
      if (prev.includes(steamId)) {
        return prev.filter((id) => id !== steamId)
      }
      if (prev.length >= 2) {
        return [prev[1], steamId]
      }
      return [...prev, steamId]
    })
  }

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "points", label: "ELO" },
    { key: "average_rating", label: "Rating" },
    { key: "kills", label: "Kills" },
    { key: "kd", label: "K/D" },
    { key: "winPct", label: "Win%" },
  ]

  return (
    <>
      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              /
            </kbd>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort by:
            </span>
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleSortChange(opt.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  sortKey === opt.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {opt.label}
                {sortKey === opt.key && (
                  <span className="ml-1">{sortDir === "desc" ? "\u2193" : "\u2191"}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Season filter */}
        {seasons.length > 0 && !hideSeasonFilter && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Season:
            </span>
            <button
              onClick={() => handleSeasonChange(null)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedSeason === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              All Seasons
            </button>
            {seasons.map((season) => (
              <button
                key={season.id}
                onClick={() => handleSeasonChange(season.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedSeason === season.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {season.name}
              </button>
            ))}
            {selectedSeason !== null && seasonPlayerIds !== null && (
              <span className="ml-1 text-[11px] text-muted-foreground">
                {seasonPlayerIds.size} player{seasonPlayerIds.size !== 1 ? "s" : ""} found
              </span>
            )}
          </div>
        )}
      </div>

      {/* Compare bar */}
      {compareIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 animate-fade-in">
          <div className="flex items-center gap-2 text-sm">
            <GitCompare className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">
              {compareIds.length}/2 players selected
            </span>
            {compareIds.length === 2 && (
              <span className="text-muted-foreground">- Ready to compare</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompareIds([])}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear
            </button>
            {compareIds.length === 2 && (
              <Link
                href={`/compare?player1=${compareIds[0]}&player2=${compareIds[1]}`}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Compare
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Search className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">No players found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedSeason !== null
              ? "No players found for this season. Try selecting a different season."
              : "Try adjusting your search query."}
          </p>
        </div>
      ) : (
        <>
          <LeaderboardTable
            players={paginated}
            avatars={avatars}
            showFullStats
            startRank={(currentPage - 1) * ITEMS_PER_PAGE + 1}
            compareIds={compareIds}
            onCompareToggle={handleCompareToggle}
          />

          {totalPages > 1 && (
            <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-foreground">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">{filtered.length}</span>{" "}
                players
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {(() => {
                  const pages: (number | "...")[] = []
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i)
                  } else {
                    pages.push(1)
                    if (currentPage > 3) pages.push("...")
                    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                      pages.push(i)
                    }
                    if (currentPage < totalPages - 2) pages.push("...")
                    pages.push(totalPages)
                  }
                  return pages.map((p, idx) =>
                    p === "..." ? (
                      <span key={`ellipsis-${idx}`} className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                          p === currentPage
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-card text-foreground hover:bg-secondary"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )
                })()}
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
