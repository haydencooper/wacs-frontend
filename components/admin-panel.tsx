"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Match, Server } from "@/lib/types"
import { AdminMatchActions } from "@/components/admin-match-actions"
import { RelativeTime } from "@/components/relative-time"
import { PlayerPreview } from "@/components/player-preview"
import {
  Search,
  Swords,
  Server as ServerIcon,
  ChevronLeft,
  ChevronRight,
  Circle,
  RefreshCw,
  Plus,
  Loader2,
  Activity,
  Wifi,
  WifiOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Tab = "matches" | "servers"
type StatusFilter = "all" | "live" | "completed" | "cancelled"

const ITEMS_PER_PAGE = 15
const POLL_INTERVAL = 20_000

function getMatchStatus(match: Match): { label: string; className: string } {
  if (match.cancelled) return { label: "Cancelled", className: "text-muted-foreground bg-secondary" }
  if (match.forfeit) return { label: "Forfeit", className: "text-orange-500 bg-orange-500/10" }
  if (match.winner !== null || match.end_time !== null) return { label: "Completed", className: "text-green-500 bg-green-500/10" }
  return { label: "Live", className: "text-red-500 bg-red-500/10 animate-pulse" }
}

function isLive(match: Match): boolean {
  return match.winner === null && match.end_time === null && !match.cancelled && !match.forfeit
}

const CS2_COMPETITIVE_MAPS = [
  "de_dust2",
  "de_mirage",
  "de_inferno",
  "de_nuke",
  "de_ancient",
  "de_anubis",
  "de_overpass",
] as const

function CreateMatchDialog({ servers, onClose, onSuccess }: { servers: Server[]; onClose: () => void; onSuccess: () => void }) {
  const [team1Name, setTeam1Name] = useState("")
  const [team2Name, setTeam2Name] = useState("")
  const [maxMaps, setMaxMaps] = useState<1 | 3 | 5>(1)
  const [serverId, setServerId] = useState("")
  const [mapPool, setMapPool] = useState<string[]>([...CS2_COMPETITIVE_MAPS].slice(0, 7))
  const [playersPerTeam, setPlayersPerTeam] = useState(5)
  const [loading, setLoading] = useState(false)
  const availableServers = servers.filter((s) => !s.in_use)

  function toggleMap(mapName: string) {
    setMapPool((prev) =>
      prev.includes(mapName)
        ? prev.filter((m) => m !== mapName)
        : [...prev, mapName]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mapPool.length < maxMaps) {
      toast.error("Not enough maps selected", { description: `You need at least ${maxMaps} map${maxMaps > 1 ? "s" : ""} for a BO${maxMaps} series.` })
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/admin/matches/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team1_name: team1Name,
          team2_name: team2Name,
          max_maps: maxMaps,
          server_id: serverId || undefined,
          veto_mappool: mapPool.join(" "),
          players_per_team: playersPerTeam,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success("Match created successfully")
        onSuccess()
      } else {
        toast.error("Failed to create match", { description: data.error || "Unknown error" })
      }
    } catch {
      toast.error("Failed to create match", { description: "Network error" })
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-semibold text-foreground">Create Match</h3>
        <p className="mb-6 text-sm text-muted-foreground">Set up a new match between two teams.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Team 1 Name</label>
              <input type="text" value={team1Name} onChange={(e) => setTeam1Name(e.target.value)} placeholder="Team Alpha" required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Team 2 Name</label>
              <input type="text" value={team2Name} onChange={(e) => setTeam2Name(e.target.value)} placeholder="Team Bravo" required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Series Type</label>
              <div className="flex gap-2">
                {([1, 3, 5] as const).map((n) => (
                  <button key={n} type="button" onClick={() => setMaxMaps(n)} className={cn("flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors", maxMaps === n ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-secondary")}>
                    BO{n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Players per Team</label>
              <div className="flex gap-2">
                {[1, 2, 3, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setPlayersPerTeam(n)} className={cn("flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors", playersPerTeam === n ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-secondary")}>
                    {n}v{n}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Server</label>
            <div className="relative">
              <select value={serverId} onChange={(e) => setServerId(e.target.value)} required className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select a server...</option>
                {availableServers.map((s) => (
                  <option key={s.id} value={s.id}>{s.display_name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            {availableServers.length === 0 && (
              <p className="mt-1 text-xs text-destructive">No servers available -- all servers are in use</p>
            )}
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Map Pool</label>
              <span className="text-xs text-muted-foreground">{mapPool.length} selected</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CS2_COMPETITIVE_MAPS.map((mapName) => {
                const selected = mapPool.includes(mapName)
                return (
                  <button key={mapName} type="button" onClick={() => toggleMap(mapName)} className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors", selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-secondary")}>
                    {mapName.replace("de_", "")}
                  </button>
                )
              })}
            </div>
            {mapPool.length < maxMaps && (
              <p className="mt-1 text-xs text-destructive">Select at least {maxMaps} maps for a BO{maxMaps} series</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={loading || mapPool.length < maxMaps} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Match
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MobileMatchCard({ match, onActionComplete }: { match: Match; onActionComplete: () => void }) {
  const status = getMatchStatus(match)
  const live = isLive(match)
  return (
    <div className={cn("rounded-xl border bg-card p-4", live ? "border-red-500/30" : "border-border")}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">#{match.id}</span>
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>{status.label}</span>
      </div>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex-1 text-right">
          <span className="text-sm font-medium text-foreground">{match.team1_string}</span>
        </div>
        <div className="flex items-baseline gap-1 rounded-lg bg-secondary/60 px-3 py-1.5">
          <span className="font-mono text-lg font-bold text-foreground">{match.team1_score}</span>
          <span className="font-mono text-sm text-muted-foreground/40">:</span>
          <span className="font-mono text-lg font-bold text-foreground">{match.team2_score}</span>
        </div>
        <div className="flex-1">
          <span className="text-sm font-medium text-foreground">{match.team2_string}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <RelativeTime date={match.start_time} className="text-xs text-muted-foreground" />
        <AdminMatchActions match={match} onActionComplete={onActionComplete} />
      </div>
    </div>
  )
}

function ServerHealthIndicator({ server }: { server: Server }) {
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle")

  async function checkHealth() {
    setChecking(true)
    setStatus("idle")
    try {
      const res = await fetch(`/api/admin/servers/${server.id}/health`)
      if (res.ok) {
        setStatus("ok")
        toast.success(`${server.display_name} is healthy`)
      } else {
        setStatus("error")
        toast.error(`${server.display_name} health check failed`)
      }
    } catch {
      setStatus("error")
      toast.error(`Cannot reach ${server.display_name}`)
    }
    setChecking(false)
  }

  return (
    <button
      onClick={checkHealth}
      disabled={checking}
      title="Check server health"
      className={cn(
        "rounded-md p-1.5 transition-colors",
        status === "ok" ? "text-green-500 hover:bg-green-500/10" :
        status === "error" ? "text-red-500 hover:bg-red-500/10" :
        "text-muted-foreground hover:bg-secondary"
      )}
    >
      {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
       status === "ok" ? <Wifi className="h-3.5 w-3.5" /> :
       status === "error" ? <WifiOff className="h-3.5 w-3.5" /> :
       <Activity className="h-3.5 w-3.5" />}
    </button>
  )
}

export function AdminPanel({ matches: initialMatches, servers: initialServers }: { matches: Match[]; servers: Server[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("matches")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)
  const [polling, setPolling] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  useEffect(() => {
    if (!polling) return
    const hasLive = initialMatches.some(isLive)
    if (!hasLive) return
    const interval = setInterval(handleRefresh, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [polling, initialMatches, handleRefresh])

  const liveCount = useMemo(() => initialMatches.filter(isLive).length, [initialMatches])

  const filteredMatches = useMemo(() => {
    let result = [...initialMatches]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((m) => m.team1_string.toLowerCase().includes(q) || m.team2_string.toLowerCase().includes(q) || m.id.toString().includes(q))
    }
    switch (statusFilter) {
      case "live": result = result.filter(isLive); break
      case "completed": result = result.filter((m) => (m.winner !== null || m.end_time !== null) && !m.cancelled && !m.forfeit); break
      case "cancelled": result = result.filter((m) => m.cancelled || m.forfeit); break
    }
    return result
  }, [initialMatches, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredMatches.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedMatches = filteredMatches.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const tabs: { key: Tab; label: string; icon: typeof Swords; badge?: number }[] = [
    { key: "matches", label: "Matches", icon: Swords, badge: liveCount > 0 ? liveCount : undefined },
    { key: "servers", label: "Servers", icon: ServerIcon },
  ]

  const filterOptions: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "live", label: "Live" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1); setSearch("") }} className={cn("flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors", tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.badge && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{t.badge}</span>}
          </button>
        ))}
      </div>

      {tab === "matches" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Search by team or match ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {filterOptions.map((opt) => (
                <button key={opt.key} onClick={() => { setStatusFilter(opt.key); setPage(1) }} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", statusFilter === opt.key ? opt.key === "live" ? "bg-red-500 text-white" : "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {filteredMatches.length} match{filteredMatches.length !== 1 ? "es" : ""}
              {liveCount > 0 && <span className="ml-2 text-red-500">({liveCount} live)</span>}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPolling(!polling)} className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors", polling ? "bg-green-500/10 text-green-500" : "bg-secondary text-muted-foreground")} title={polling ? "Auto-refresh ON (20s)" : "Auto-refresh OFF"}>
                <Circle className={cn("h-2 w-2 fill-current", polling ? "text-green-500" : "text-muted-foreground")} />
                Auto
              </button>
              <button onClick={handleRefresh} className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary" title="Refresh now">
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                <Plus className="h-3.5 w-3.5" />
                New Match
              </button>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Teams</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMatches.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No matches found</td></tr>
                ) : (
                  paginatedMatches.map((match) => {
                    const status = getMatchStatus(match)
                    return (
                      <tr key={match.id} className="border-b border-border last:border-b-0 hover:bg-secondary/30">
                        <td className="px-4 py-3 font-mono text-foreground">#{match.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{match.team1_string}</span>
                            <span className="text-xs text-muted-foreground">vs {match.team2_string}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-foreground">{match.team1_score} - {match.team2_score}</td>
                        <td className="px-4 py-3"><span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>{status.label}</span></td>
                        <td className="px-4 py-3"><RelativeTime date={match.start_time} className="text-muted-foreground" /></td>
                        <td className="px-4 py-3 text-right"><AdminMatchActions match={match} onActionComplete={handleRefresh} /></td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {paginatedMatches.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">No matches found</div>
            ) : (
              paginatedMatches.map((match) => (
                <MobileMatchCard key={match.id} match={match} onActionComplete={handleRefresh} />
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "servers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{initialServers.length} server{initialServers.length !== 1 ? "s" : ""} ({initialServers.filter((s) => !s.in_use).length} available)</p>
            <button onClick={handleRefresh} className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary">
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Address</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">GOTV</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Health</th>
                </tr>
              </thead>
              <tbody>
                {initialServers.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No servers found</td></tr>
                ) : (
                  initialServers.map((server) => (
                    <tr key={server.id} className="border-b border-border last:border-b-0 hover:bg-secondary/30">
                      <td className="px-4 py-3 font-mono text-foreground">#{server.id}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{server.display_name}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{server.ip_string}:{server.port}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{server.gotv_port || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", server.in_use ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500")}>
                          <Circle className={cn("h-2 w-2 fill-current", server.in_use ? "text-red-500" : "text-green-500")} />
                          {server.in_use ? "In Use" : "Available"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right"><ServerHealthIndicator server={server} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {initialServers.map((server) => (
              <div key={server.id} className={cn("flex items-center justify-between rounded-xl border bg-card px-4 py-3", server.in_use ? "border-red-500/30" : "border-border")}>
                <div className="flex items-center gap-3">
                  <ServerIcon className={cn("h-4 w-4", server.in_use ? "text-red-500" : "text-muted-foreground/40")} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{server.display_name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{server.ip_string}:{server.port}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", server.in_use ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500")}>
                    <Circle className={cn("h-2 w-2 fill-current", server.in_use ? "text-red-500" : "text-green-500")} />
                    {server.in_use ? "In Use" : "Available"}
                  </span>
                  <ServerHealthIndicator server={server} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreate && <CreateMatchDialog servers={initialServers} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); handleRefresh() }} />}
    </div>
  )
}
