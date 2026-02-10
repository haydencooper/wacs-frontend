"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchResult {
  steamId: string
  name: string
  points: number
  average_rating: number
}

export function PlayerSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    // Cancel any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      const res = await fetch(
        `/api/players/search?q=${encodeURIComponent(q.trim())}`,
        { signal: controller.signal }
      )
      const data = await res.json()
      setResults(data.players ?? [])
      setSelectedIndex(-1)
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setResults([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const timeout = setTimeout(() => search(query), 250)
    return () => clearTimeout(timeout)
  }, [query, search])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function navigate(steamId: string) {
    setOpen(false)
    setQuery("")
    setResults([])
    router.push(`/player/${steamId}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => (i > 0 ? i - 1 : results.length - 1))
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      navigate(results[selectedIndex].steamId)
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const showDropdown = open && (results.length > 0 || loading || query.trim().length >= 2)

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search players..."
          className="h-8 w-40 rounded-md border border-border bg-card pl-8 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 sm:w-52"
          aria-label="Search players"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("")
              setResults([])
              inputRef.current?.focus()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {loading && results.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              Searching...
            </div>
          )}
          {!loading && results.length === 0 && query.trim().length >= 2 && (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              No players found
            </div>
          )}
          {results.length > 0 && (
            <ul className="py-1" role="listbox">
              {results.map((player, i) => (
                <li key={player.steamId} role="option" aria-selected={i === selectedIndex}>
                  <button
                    onClick={() => navigate(player.steamId)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                      i === selectedIndex
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/50"
                    )}
                  >
                    <div className="flex-1 truncate">
                      <span className="font-medium text-foreground">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-live">
                        <Trophy className="h-3 w-3" />
                        {player.points}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {player.average_rating.toFixed(2)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
