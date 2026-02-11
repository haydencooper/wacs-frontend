"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MatchCard } from "@/components/match-card"
import type { Match } from "@/lib/types"
import { Search, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { PAGE_SIZE } from "@/lib/constants"

const ITEMS_PER_PAGE = PAGE_SIZE
const STAGGER_CLASSES = [
  "", "stagger-1", "stagger-2", "stagger-3", "stagger-4",
  "stagger-5", "stagger-6", "stagger-7", "stagger-8",
]

type StatusFilter = "all" | "completed" | "cancelled" | "live"

interface MatchesViewProps {
  matches: Match[]
  /** When true, state is managed locally without syncing to URL search params. */
  disableUrlSync?: boolean
}

export function MatchesView({ matches, disableUrlSync = false }: MatchesViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(disableUrlSync ? "" : (searchParams.get("q") ?? ""))
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    disableUrlSync ? "all" : ((searchParams.get("status") as StatusFilter) || "all")
  )
  const [page, setPage] = useState(disableUrlSync ? 1 : (Number(searchParams.get("page")) || 1))
  const searchRef = useRef<HTMLInputElement>(null)

  // Sync state to URL
  const updateUrl = useCallback((q: string, status: StatusFilter, p: number) => {
    if (disableUrlSync) return
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    if (status !== "all") params.set("status", status)
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    router.replace(`/matches${qs ? `?${qs}` : ""}`, { scroll: false })
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
    let result = [...matches]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (m) =>
          m.team1_string.toLowerCase().includes(q) ||
          m.team2_string.toLowerCase().includes(q) ||
          m.id.toString().includes(q)
      )
    }

    switch (statusFilter) {
      case "completed":
        result = result.filter((m) => (m.winner !== null || m.end_time !== null) && !m.cancelled && !m.forfeit)
        break
      case "cancelled":
        result = result.filter((m) => m.cancelled)
        break
      case "live":
        result = result.filter((m) => m.winner === null && m.end_time === null && !m.cancelled && !m.forfeit)
        break
    }

    return result
  }, [matches, search, statusFilter])

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
        updateUrl(search, statusFilter, newPage)
      }
      if (e.key === "ArrowRight" && currentPage < totalPages) {
        e.preventDefault()
        const newPage = currentPage + 1
        setPage(newPage)
        updateUrl(search, statusFilter, newPage)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [currentPage, totalPages, search, statusFilter, updateUrl])

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
    updateUrl(value, statusFilter, 1)
  }

  function handleFilterChange(key: StatusFilter) {
    setStatusFilter(key)
    setPage(1)
    updateUrl(search, key, 1)
  }

  function handlePageChange(p: number) {
    setPage(p)
    updateUrl(search, statusFilter, p)
  }

  const filterOptions: { key: StatusFilter; label: string; activeClass?: string }[] = [
    { key: "all", label: "All" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
    { key: "live", label: "Live", activeClass: "bg-live text-background" },
  ]

  return (
    <>
      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search matches or teams..."
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
            <Filter className="h-3.5 w-3.5" />
            Status:
          </span>
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleFilterChange(opt.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === opt.key
                  ? (opt.activeClass ?? "bg-primary text-primary-foreground")
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Search className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">No matches found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginated.map((match, i) => (
              <div
                key={match.id}
                className={`animate-fade-in-up ${STAGGER_CLASSES[Math.min(i, STAGGER_CLASSES.length - 1)]}`}
              >
                <MatchCard match={match} />
              </div>
            ))}
          </div>

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
                matches
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
