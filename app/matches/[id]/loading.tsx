import { Skeleton } from "@/components/skeleton"

export default function MatchDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <Skeleton className="mb-6 h-5 w-32" />
      <Skeleton className="mb-8 h-48 rounded-lg" />
      <Skeleton className="mb-4 h-6 w-28" />
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <Skeleton className="mb-4 h-6 w-28" />
      <Skeleton className="mb-6 h-56 rounded-lg" />
      <Skeleton className="h-56 rounded-lg" />
    </div>
  )
}
