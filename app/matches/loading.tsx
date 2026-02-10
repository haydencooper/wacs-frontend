import { Skeleton } from "@/components/skeleton"

export default function MatchesLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-5 w-64" />
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fade-in-up stagger-1">
        <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-md" />
          ))}
        </div>
      </div>

      {/* Match cards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-fade-in-up stagger-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-1 flex-col items-end gap-1">
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-10 w-24 rounded-lg" />
              <div className="flex flex-1 flex-col gap-1">
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="mt-4 border-t border-border/50 pt-3">
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
