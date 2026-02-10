"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface AutoRefreshProps {
  interval?: number // seconds
}

export function AutoRefresh({ interval = 60 }: AutoRefreshProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(interval)
  const [refreshing, setRefreshing] = useState(false)
  const [paused, setPaused] = useState(false)

  const refresh = useCallback(() => {
    setRefreshing(true)
    router.refresh()
    setTimeout(() => {
      setRefreshing(false)
      setCountdown(interval)
    }, 500)
  }, [router, interval])

  useEffect(() => {
    if (paused) return

    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          return 0
        }
        return c - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [paused, interval])

  useEffect(() => {
    if (countdown === 0 && !paused) {
      refresh()
    }
  }, [countdown, paused, refresh])

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={refresh}
        disabled={refreshing}
        className={cn(
          "flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
          refreshing && "pointer-events-none"
        )}
        title="Refresh data"
      >
        <RefreshCw
          className={cn("h-3 w-3", refreshing && "animate-spin")}
        />
        <span className="hidden sm:inline">
          {refreshing ? "Refreshing..." : `${countdown}s`}
        </span>
      </button>
      <button
        onClick={() => setPaused((p) => !p)}
        className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title={paused ? "Resume auto-refresh" : "Pause auto-refresh"}
      >
        {paused ? "Resume" : "Pause"}
      </button>
    </div>
  )
}
