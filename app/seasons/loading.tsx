import { Skeleton } from "@/components/skeleton"

export default function SeasonsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="mt-1 h-4 w-56" />
          </div>
        </div>
      </div>

      {/* Active Season Highlight */}
      <div className="mb-8 animate-fade-in-up stagger-1">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="mb-2 h-7 w-48" />
          <div className="flex flex-wrap items-center gap-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      </div>

      {/* All Seasons Grid */}
      <div className="animate-fade-in-up stagger-2">
        <Skeleton className="mb-4 h-6 w-28" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col rounded-xl border border-border bg-card p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="mb-1 h-6 w-36" />
              <Skeleton className="mb-4 h-3 w-44" />
              <div className="mt-auto grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-secondary/50 p-3 text-center">
                  <Skeleton className="mx-auto h-6 w-8" />
                  <Skeleton className="mx-auto mt-1 h-3 w-14" />
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 text-center">
                  <Skeleton className="mx-auto h-6 w-8" />
                  <Skeleton className="mx-auto mt-1 h-3 w-14" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
