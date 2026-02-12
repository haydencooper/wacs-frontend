"use client"

import { cn } from "@/lib/utils"

export interface RatingPoint {
  matchId: number
  rating: number
  date: string
}

interface RatingSparklineProps {
  data: RatingPoint[]
  className?: string
  height?: number
  width?: number
}

/**
 * A minimal SVG sparkline that shows rating progression over recent matches.
 * No external chart library needed.
 */
export function RatingSparkline({ data, className, height = 80, width = 320 }: RatingSparklineProps) {
  if (data.length < 2) return null

  const ratings = data.map((d) => d.rating)
  const min = Math.min(...ratings)
  const max = Math.max(...ratings)
  const range = max - min || 0.1 // avoid division by zero
  const padding = 4

  const effectiveWidth = width - padding * 2
  const effectiveHeight = height - padding * 2

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * effectiveWidth
    const y = padding + effectiveHeight - ((d.rating - min) / range) * effectiveHeight
    return { x, y, ...d }
  })

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ")

  // Gradient fill under line
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`

  // Determine if trend is up, down, or flat
  const first = ratings[0]
  const last = ratings[ratings.length - 1]
  const trendUp = last > first
  const trendFlat = Math.abs(last - first) < 0.02

  const strokeColor = trendFlat
    ? "oklch(0.55 0 0)"
    : trendUp
      ? "oklch(0.65 0.17 155)"
      : "oklch(0.60 0.18 25)"

  const fillId = `sparkline-grad-${data[0]?.matchId ?? "x"}`

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-card p-4", className)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Rating Trend
        </span>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-muted-foreground">{first.toFixed(2)}</span>
          <svg className="h-3 w-4 text-muted-foreground" viewBox="0 0 16 12" fill="none">
            <path d="M1 6h14m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span
            className={cn(
              "font-mono font-semibold",
              trendFlat
                ? "text-foreground"
                : trendUp
                  ? "text-win"
                  : "text-loss"
            )}
          >
            {last.toFixed(2)}
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Rating trend from ${first.toFixed(2)} to ${last.toFixed(2)} over ${data.length} matches`}
      >
        <defs>
          <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Reference line at 1.0 */}
        {min < 1.0 && max > 1.0 && (
          <line
            x1={padding}
            x2={width - padding}
            y1={padding + effectiveHeight - ((1.0 - min) / range) * effectiveHeight}
            y2={padding + effectiveHeight - ((1.0 - min) / range) * effectiveHeight}
            stroke="currentColor"
            strokeDasharray="4 4"
            className="text-border"
            strokeWidth="0.5"
          />
        )}
        <path d={areaD} fill={`url(#${fillId})`} />
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Current value dot */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3"
          fill={strokeColor}
        />
      </svg>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{data.length} matches ago</span>
        <span>Latest</span>
      </div>
    </div>
  )
}
