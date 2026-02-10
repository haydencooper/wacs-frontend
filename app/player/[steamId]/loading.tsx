import { Skeleton } from "@/components/skeleton"

export default function PlayerLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <Skeleton className="mb-6 h-5 w-36" />

      {/* Player Header */}
      <Skeleton className="mb-8 h-32 rounded-lg" />

      {/* Performance Grid */}
      <Skeleton className="mb-4 h-6 w-28" />
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>

      {/* Advanced Stats */}
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <Skeleton className="mb-4 h-6 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-12 rounded-lg" />
          ))}
        </div>
        <div>
          <Skeleton className="mb-4 h-6 w-20" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-12 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Record */}
      <Skeleton className="mt-8 h-40 rounded-lg" />
    </div>
  )
}
