import { cn } from "@/lib/utils"

export type FormResult = "W" | "L" | "D" | "C"

interface RecentFormProps {
  results: FormResult[]
  /** Number of results to show (default 5). */
  count?: number
  size?: "sm" | "md"
}

const resultConfig: Record<FormResult, { label: string; bg: string; text: string }> = {
  W: { label: "Win", bg: "bg-win", text: "text-card" },
  L: { label: "Loss", bg: "bg-loss", text: "text-card" },
  D: { label: "Draw", bg: "bg-muted-foreground", text: "text-card" },
  C: { label: "Cancelled", bg: "bg-muted", text: "text-muted-foreground" },
}

export function RecentForm({ results, count = 5, size = "sm" }: RecentFormProps) {
  const displayed = results.slice(0, count)

  if (displayed.length === 0) return null

  const sizeClass = size === "md" ? "h-5 w-5 text-[9px]" : "h-4 w-4 text-[8px]"

  return (
    <div className="flex items-center gap-0.5" aria-label={`Recent form: ${displayed.join(", ")}`}>
      {displayed.map((result, i) => {
        const config = resultConfig[result]
        return (
          <span
            key={i}
            className={cn(
              "flex items-center justify-center rounded-sm font-mono font-bold leading-none",
              sizeClass,
              config.bg,
              config.text
            )}
            title={config.label}
          >
            {result}
          </span>
        )
      })}
    </div>
  )
}
