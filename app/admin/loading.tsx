import { Skeleton } from "@/components/skeleton"

export default function AdminLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-36" />
            <Skeleton className="mt-1 h-4 w-48" />
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-6 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-4 border-b border-border pb-3">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Controls bar */}
      <div className="mb-4 flex items-center justify-between animate-fade-in-up stagger-1">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden rounded-xl border border-border md:block animate-fade-in-up stagger-2">
        {/* Header row */}
        <div className="flex items-center gap-4 border-b border-border bg-secondary/40 px-4 py-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <div className="ml-auto flex gap-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border/30 px-4 py-3 last:border-0"
          >
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <div className="ml-auto flex gap-4">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3 md:hidden animate-fade-in-up stagger-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mb-2 h-4 w-48" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
