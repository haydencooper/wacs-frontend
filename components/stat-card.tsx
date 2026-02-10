import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  className?: string
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-5 transition-all duration-300 hover:border-border/80 hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <div className="flex items-end gap-2">
        <span className="font-heading text-2xl font-semibold tracking-tight text-foreground">{value}</span>
        {trend && (
          <span className="mb-0.5 text-xs font-medium text-muted-foreground">
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}
