import { Skeleton } from "@/components/skeleton"

export default function CompetitionDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Competition Header */}
      <div className="mb-8 animate-fade-in-up rounded-xl border border-border bg-card p-8">
        <div className="mb-4 flex items-center gap-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-8" />
        </div>
        <Skeleton className="mb-2 h-9 w-64" />
        <div className="flex flex-wrap items-center gap-6">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Winner Highlight */}
      <div className="mb-8 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-5 py-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-1 h-6 w-40" />
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="mt-1 h-3 w-10" />
            </div>
            <div className="text-right">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="mt-1 h-3 w-14" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="animate-fade-in-up stagger-2">
        <div className="mb-6 flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>

        {/* Standings table skeleton */}
        <div className="rounded-xl border border-border">
          <div className="border-b border-border bg-secondary/40 px-4 py-3">
            <div className="flex items-center gap-8">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-16" />
              <div className="ml-auto flex gap-8">
                <Skeleton className="h-3 w-6" />
                <Skeleton className="h-3 w-6" />
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-8 border-b border-border/30 px-4 py-3 last:border-0"
            >
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-4 w-32" />
              <div className="ml-auto flex items-center gap-8">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 w-6" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-1.5 w-14 rounded-full" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
