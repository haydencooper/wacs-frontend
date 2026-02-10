import { Skeleton } from "@/components/skeleton"

export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      {/* Hero */}
      <div className="mb-10 animate-fade-in-up">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-5 w-96" />
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4 animate-fade-in-up stagger-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="mt-3 h-7 w-20" />
          </div>
        ))}
      </div>

      {/* Top player highlight */}
      <div className="mb-10 animate-fade-in-up stagger-1">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex flex-1 items-center gap-4 rounded-lg border border-border bg-card p-5">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-1.5 h-5 w-32" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="flex flex-1 items-center gap-4 rounded-lg border border-border bg-card p-5">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-1.5 h-5 w-28" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-8 lg:grid-cols-3 animate-fade-in-up stagger-2">
        <div className="lg:col-span-2">
          <Skeleton className="mb-4 h-6 w-32" />
          <div className="rounded-xl border border-border">
            <div className="border-b border-border bg-secondary/40 px-4 py-3">
              <Skeleton className="h-4 w-full" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-border/30 px-4 py-3 last:border-0">
                <Skeleton className="h-7 w-7 rounded-md" />
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <div className="ml-auto flex gap-4">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="mb-4 h-6 w-24" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Matches */}
      <div className="mt-10 animate-fade-in-up stagger-3">
        <Skeleton className="mb-4 h-6 w-36" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="ml-auto h-4 w-20" />
                <Skeleton className="h-10 w-24 rounded-lg" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="mt-4 border-t border-border/50 pt-3">
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
