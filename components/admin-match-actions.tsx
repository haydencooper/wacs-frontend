"use client"

import { useState, useEffect, useRef } from "react"
import type { Match } from "@/lib/types"
import {
  XCircle,
  Flag,
  Pause,
  Play,
  RotateCcw,
  UserPlus,
  UserMinus,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface AdminMatchActionsProps {
  match: Match
  onActionComplete: () => void
}

function isLive(match: Match): boolean {
  return (
    match.winner === null &&
    match.end_time === null &&
    !match.cancelled &&
    !match.forfeit
  )
}

async function adminAction(
  url: string,
  method: string = "POST",
  body?: unknown
): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, message: data.error || `Error ${res.status}` }
  }
  return { ok: true, message: data.message || "Success" }
}

function ConfirmDialog({
  title,
  description,
  onConfirm,
  onCancel,
  loading,
  destructive,
}: {
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
  destructive?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              destructive ? "bg-destructive/10" : "bg-primary/10"
            )}
          >
            <AlertTriangle
              className={cn(
                "h-5 w-5",
                destructive ? "text-destructive" : "text-primary"
              )}
            />
          </div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

function AddPlayerDialog({
  matchId,
  onClose,
  onSuccess,
}: {
  matchId: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [steamId, setSteamId] = useState("")
  const [nickname, setNickname] = useState("")
  const [teamId, setTeamId] = useState<"team1" | "team2" | "spec">("team1")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await adminAction(
      `/api/admin/matches/${matchId}/adduser`,
      "PUT",
      { steam_id: steamId, team_id: teamId, nickname }
    )
    setLoading(false)
    if (result.ok) {
      toast.success(`Added ${nickname} to match #${matchId}`)
      onSuccess()
    } else {
      toast.error("Failed to add player", { description: result.message })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Add Player to Match #{matchId}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Steam ID</label>
            <input type="text" value={steamId} onChange={(e) => setSteamId(e.target.value)} placeholder="76561198012345678" required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Nickname</label>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Player name" required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Team</label>
            <select value={teamId} onChange={(e) => setTeamId(e.target.value as "team1" | "team2" | "spec")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="team1">Team 1</option>
              <option value="team2">Team 2</option>
              <option value="spec">Spectator</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Player
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RemovePlayerDialog({
  matchId,
  onClose,
  onSuccess,
}: {
  matchId: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [steamId, setSteamId] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await adminAction(
      `/api/admin/matches/${matchId}/removeuser`,
      "PUT",
      { steam_id: steamId }
    )
    setLoading(false)
    if (result.ok) {
      toast.success(`Removed player from match #${matchId}`)
      onSuccess()
    } else {
      toast.error("Failed to remove player", { description: result.message })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Remove Player from Match #{matchId}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Steam ID</label>
            <input type="text" value={steamId} onChange={(e) => setSteamId(e.target.value)} placeholder="76561198012345678" required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Remove Player
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AdminMatchActions({ match, onActionComplete }: AdminMatchActionsProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState<{ title: string; description: string; action: () => Promise<void>; destructive?: boolean } | null>(null)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [showRemovePlayer, setShowRemovePlayer] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const live = isLive(match)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) {
      document.addEventListener("mousedown", handleClick)
      return () => document.removeEventListener("mousedown", handleClick)
    }
  }, [open])

  async function handleAction(url: string, actionLabel: string, method: string = "POST", body?: unknown) {
    setLoading(true)
    const result = await adminAction(url, method, body)
    setLoading(false)
    setConfirm(null)
    if (result.ok) {
      toast.success(`${actionLabel} — Match #${match.id}`)
      onActionComplete()
      setOpen(false)
    } else {
      toast.error(`Failed: ${actionLabel}`, { description: result.message })
    }
  }

  if (!live) return null

  const actions = [
    { label: "Cancel", icon: XCircle, destructive: true, onClick: () => setConfirm({ title: "Cancel Match", description: `Are you sure you want to cancel match #${match.id}? This cannot be undone.`, action: () => handleAction(`/api/admin/matches/${match.id}/cancel`, "Cancelled"), destructive: true }) },
    { label: "Forfeit T1", icon: Flag, destructive: true, onClick: () => setConfirm({ title: "Forfeit — Team 2 Wins", description: `Forfeit match #${match.id} with ${match.team2_string} as the winner?`, action: () => handleAction(`/api/admin/matches/${match.id}/forfeit`, "Forfeit applied", "POST", { winner: 2 }), destructive: true }) },
    { label: "Forfeit T2", icon: Flag, destructive: true, onClick: () => setConfirm({ title: "Forfeit — Team 1 Wins", description: `Forfeit match #${match.id} with ${match.team1_string} as the winner?`, action: () => handleAction(`/api/admin/matches/${match.id}/forfeit`, "Forfeit applied", "POST", { winner: 1 }), destructive: true }) },
    { label: "Pause", icon: Pause, onClick: () => setConfirm({ title: "Pause Match", description: `Pause match #${match.id}?`, action: () => handleAction(`/api/admin/matches/${match.id}/pause`, "Paused") }) },
    { label: "Unpause", icon: Play, onClick: () => setConfirm({ title: "Unpause Match", description: `Unpause match #${match.id}?`, action: () => handleAction(`/api/admin/matches/${match.id}/unpause`, "Unpaused") }) },
    { label: "Restart", icon: RotateCcw, destructive: true, onClick: () => setConfirm({ title: "Restart Match", description: `Restart match #${match.id}? All current progress will be lost.`, action: () => handleAction(`/api/admin/matches/${match.id}/restart`, "Restarted"), destructive: true }) },
    { label: "Add Player", icon: UserPlus, onClick: () => { setShowAddPlayer(true); setOpen(false) } },
    { label: "Remove Player", icon: UserMinus, destructive: true, onClick: () => { setShowRemovePlayer(true); setOpen(false) } },
  ]

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary">
          Actions
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div className="absolute right-0 top-full z-40 mt-1 w-48 rounded-xl border border-border bg-card py-1 shadow-lg">
            {actions.map((action) => (
              <button key={action.label} onClick={() => { action.onClick(); if (!action.label.startsWith("Add") && !action.label.startsWith("Remove")) setOpen(false) }} disabled={loading} className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary disabled:opacity-50", action.destructive ? "text-destructive" : "text-foreground")}>
                <action.icon className="h-4 w-4" />
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {confirm && <ConfirmDialog title={confirm.title} description={confirm.description} onConfirm={confirm.action} onCancel={() => setConfirm(null)} loading={loading} destructive={confirm.destructive} />}
      {showAddPlayer && <AddPlayerDialog matchId={match.id} onClose={() => setShowAddPlayer(false)} onSuccess={() => { setShowAddPlayer(false); onActionComplete() }} />}
      {showRemovePlayer && <RemovePlayerDialog matchId={match.id} onClose={() => setShowRemovePlayer(false)} onSuccess={() => { setShowRemovePlayer(false); onActionComplete() }} />}
    </>
  )
}
