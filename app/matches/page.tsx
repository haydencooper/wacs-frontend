import { fetchMatches } from "@/lib/api"
import { MatchesView } from "@/components/matches-view"

export const dynamic = "force-dynamic"

export default async function MatchesPage() {
  const matches = await fetchMatches()

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
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
