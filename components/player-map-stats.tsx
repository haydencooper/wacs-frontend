import { cn } from "@/lib/utils"
import { getMapDisplayName, getMapMeta } from "@/lib/maps"
import { MapPin } from "lucide-react"

export interface MapPerformance {
  mapName: string
  played: number
  wins: number
  kills: number
  deaths: number
  rating: number
}

interface PlayerMapStatsProps {
  maps: MapPerformance[]
}

export function PlayerMapStats({ maps }: PlayerMapStatsProps) {
  if (maps.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <MapPin className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No map data available</p>
      </div>
    )
  }

  const sorted = [...maps].sort((a, b) => b.played - a.played)
  const maxPlayed = sorted[0]?.played ?? 1

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((map) => {
        const meta = getMapMeta(map.mapName)
        const displayName = getMapDisplayName(map.mapName) || map.mapName
        const kd = map.deaths > 0 ? (map.kills / map.deaths).toFixed(2) : map.kills.toFixed(2)
        const winPct = map.played > 0 ? ((map.wins / map.played) * 100).toFixed(0) : "0"
        const playedPct = (map.played / maxPlayed) * 100

        return (
          <div
            key={map.mapName}
            className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-card/80"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-bold text-card"
                style={{ backgroundColor: meta.color }}
              >
                {meta.code}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{displayName}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {map.played} game{map.played !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${playedPct}%`, backgroundColor: meta.color }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Win%
                </div>
                <div
                  className={cn(
                    "font-mono text-sm font-semibold",
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
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  K/D
                </div>
                <div
                  className={cn(
                    "font-mono text-sm font-semibold",
                    parseFloat(kd) >= 1.2
                      ? "text-win"
                      : parseFloat(kd) >= 1.0
                        ? "text-foreground"
                        : "text-loss"
                  )}
                >
                  {kd}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Rating
                </div>
                <div
                  className={cn(
                    "font-mono text-sm font-semibold",
                    map.rating >= 1.1
                      ? "text-win"
                      : map.rating >= 1.0
                        ? "text-foreground"
                        : "text-loss"
                  )}
                >
                  {map.rating.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
