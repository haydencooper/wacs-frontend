import { Skeleton } from "@/components/skeleton"

export default function HallOfFameLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-10 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-1 h-4 w-64" />
          </div>
        </div>
      </div>

      {/* All-Time Titles */}
      <div className="mb-10 animate-fade-in-up stagger-1">
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-28 flex-1" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Champion Cards */}
      <div className="animate-fade-in-up stagger-2">
        <Skeleton className="mb-4 h-6 w-28" />
        <div className="flex flex-col gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              {/* Gradient banner */}
              <Skeleton className="h-1.5 w-full rounded-none" />

              <div className="p-5 sm:p-6">
                {/* Top row */}
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Skeleton className="mb-1 h-3 w-44" />
                    <Skeleton className="h-6 w-48" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="mt-1 h-3 w-12" />
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-6 w-10" />
                      <Skeleton className="mt-1 h-3 w-14" />
                    </div>
                  </div>
                </div>

                {/* Champion banner */}
                <div className="mb-5 flex items-center gap-3 rounded-lg bg-secondary/30 px-4 py-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="mt-1 h-5 w-36" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                </div>

                {/* MVP row */}
                <div className="mb-5 flex items-center gap-3 rounded-lg bg-secondary/20 px-4 py-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-2.5 w-10" />
                    <Skeleton className="mt-1 h-4 w-28" />
                  </div>
                  <div className="hidden gap-4 sm:flex">
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                </div>

                {/* Roster table */}
                <Skeleton className="mb-3 h-3 w-14" />
                <div className="hidden overflow-hidden rounded-lg border border-border sm:block">
                  {/* Header */}
                  <div className="flex items-center gap-4 border-b border-border bg-secondary/40 px-3 py-2">
                    <Skeleton className="h-3 w-20" />
                    <div className="ml-auto flex gap-6">
                      <Skeleton className="h-3 w-6" />
                      <Skeleton className="h-3 w-6" />
                      <Skeleton className="h-3 w-6" />
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                  {/* Rows */}
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div
                      key={j}
                      className="flex items-center gap-4 border-b border-border/30 px-3 py-2.5 last:border-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="h-6 w-6 rounded-md" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="ml-auto flex gap-6">
                        <Skeleton className="h-4 w-6" />
                        <Skeleton className="h-4 w-6" />
                        <Skeleton className="h-4 w-6" />
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-10" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
