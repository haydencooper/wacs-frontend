"use client"

import { AlertTriangle, RotateCcw } from "lucide-react"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 py-20">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-foreground">
          Something went wrong
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  )
}
