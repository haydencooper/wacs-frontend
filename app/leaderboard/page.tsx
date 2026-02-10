import { fetchLeaderboard, fetchSeasons, fetchMatches } from "@/lib/api"
import { fetchSteamAvatars } from "@/lib/steam"
import { LeaderboardView } from "@/components/leaderboard-view"

export const dynamic = "force-dynamic"

export default async function LeaderboardPage() {
  const [players, seasons, matches] = await Promise.all([
    fetchLeaderboard(),
    fetchSeasons(),
    fetchMatches(),
  ])
  const steamIds = players.map((p) => p.steamId)
  const avatars = await fetchSteamAvatars(steamIds)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <section className="mb-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-balance text-3xl font-semibold tracking-tight text-foreground">
            Leaderboard
          </h1>
          {players.length > 0 && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {players.length} players
            </span>
          )}
        </div>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
          Player rankings sorted by ELO points. Click any player to view their
          full profile.
        </p>
      </section>

      <div className="animate-fade-in-up stagger-1">
        <LeaderboardView players={players} avatars={avatars} seasons={seasons} matches={matches} />
      </div>
    </div>
  )
}
