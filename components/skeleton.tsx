import { cn } from "@/lib/utils"

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-secondary", className)}
      {...props}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-1 flex-col items-end gap-1">
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-12 w-24 rounded-lg" />
        <div className="flex flex-1 flex-col gap-1">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border/50 pt-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-10 rounded" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-border last:border-b-0">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <Skeleton className="h-4 w-full max-w-[120px]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-7 w-20" />
    </div>
  )
}

export function SkeletonLeaderboard({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3"
        >
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonMatchDetail() {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="mb-6 flex items-center justify-center gap-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-1 w-1 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-center">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-16 w-32 rounded-xl" />
          <Skeleton className="h-7 w-36" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonPlayerProfile() {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="space-y-1 text-center">
              <Skeleton className="mx-auto h-9 w-16" />
              <Skeleton className="mx-auto h-3 w-8" />
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="space-y-1 text-center">
              <Skeleton className="mx-auto h-9 w-16" />
              <Skeleton className="mx-auto h-3 w-8" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
    </div>
  )
}
