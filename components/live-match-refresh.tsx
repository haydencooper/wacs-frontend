"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { LIVE_REFRESH_INTERVAL_S } from "@/lib/constants"

interface LiveMatchRefreshProps {
  isLive: boolean
  interval?: number
}

export function LiveMatchRefresh({ isLive, interval = LIVE_REFRESH_INTERVAL_S }: LiveMatchRefreshProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(interval)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const refresh = useCallback(() => {
    setRefreshing(true)
    router.refresh()
    setTimeout(() => {
      setRefreshing(false)
      setCountdown(interval)
      setLastUpdated(new Date())
    }, 500)
  }, [router, interval])

  useEffect(() => {
    if (!isLive) return

    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) return 0
        return c - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isLive, interval])

  useEffect(() => {
    if (countdown === 0 && isLive) {
      refresh()
    }
  }, [countdown, isLive, refresh])

  if (!isLive) return null

  const timeStr = lastUpdated.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return (
    <div className="flex items-center gap-3 rounded-lg border border-live/20 bg-live/5 px-3 py-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
      </span>
      <span className="text-xs font-medium text-live">LIVE</span>
      <span className="text-[10px] text-muted-foreground">
        Updated {timeStr}
      </span>
      <button
        onClick={refresh}
        disabled={refreshing}
        className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-live/80 transition-colors hover:bg-live/10 hover:text-live"
      >
        <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
        {refreshing ? "..." : `${countdown}s`}
      </button>
    </div>
  )
}
