import { Suspense } from "react"
import { fetchLeaderboard } from "@/lib/api"
import { fetchSteamAvatars } from "@/lib/steam"
import { PlayerComparison } from "@/components/player-comparison"
import { GitCompare } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Compare Players - WACS",
  description: "Compare two players head-to-head across all stats.",
}

function ComparisonLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 lg:px-8">
      <div className="flex flex-col items-center gap-4 py-24">
        <GitCompare className="h-8 w-8 animate-pulse text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading player data...</p>
      </div>
    </div>
  )
}

async function ComparisonContent() {
  const players = await fetchLeaderboard()
  const steamIds = players.map((p) => p.steamId)
  const avatars = await fetchSteamAvatars(steamIds)

  return <PlayerComparison players={players} avatars={avatars} />
}

export default function ComparePage() {
  return (
    <Suspense fallback={<ComparisonLoading />}>
      <ComparisonContent />
    </Suspense>
  )
}
