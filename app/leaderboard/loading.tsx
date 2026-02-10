import { Skeleton } from "@/components/skeleton"

export default function LeaderboardLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-5 w-80" />
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fade-in-up stagger-1">
        <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-md" />
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="hidden rounded-xl border border-border md:block animate-fade-in-up stagger-2">
        {/* Header row */}
        <div className="flex items-center gap-4 border-b border-border bg-secondary/40 px-4 py-3">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-24" />
          <div className="ml-auto flex gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-12" />
            ))}
          </div>
        </div>
        {/* Data rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border/30 px-4 py-3 last:border-0">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <div className="ml-auto flex gap-6">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
        ))}
      </div>

      {/* Mobile skeleton */}
      <div className="flex flex-col gap-3 md:hidden animate-fade-in-up stagger-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-7 rounded-md" />
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="text-center">
                  <Skeleton className="mx-auto h-3 w-10" />
                  <Skeleton className="mx-auto mt-1 h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
