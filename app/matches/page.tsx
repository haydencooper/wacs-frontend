import type { Metadata } from "next"
import { fetchMatches } from "@/lib/api"
import { MatchesView } from "@/components/matches-view"
import { Breadcrumbs } from "@/components/breadcrumbs"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Match History",
  description: "Browse all WACS CS2 PUG matches, results, and scoreboards.",
}

export default async function MatchesPage() {
  const matches = await fetchMatches()

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Matches" }]} />
      <section className="mb-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-balance text-3xl font-semibold tracking-tight text-foreground">
            Match History
          </h1>
          {matches.length > 0 && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {matches.length} matches
            </span>
          )}
        </div>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
          Browse all PUG and team matches.
        </p>
      </section>

      <div className="animate-fade-in-up stagger-1">
        <MatchesView matches={matches} />
      </div>
    </div>
  )
}
