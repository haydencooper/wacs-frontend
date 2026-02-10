import { NextRequest, NextResponse } from "next/server"
import { fetchLeaderboard } from "@/lib/api"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase()

  if (!q || q.length < 2) {
    return NextResponse.json({ players: [] })
  }

  try {
    const leaderboard = await fetchLeaderboard()
    const matches = leaderboard
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 8)
      .map((p) => ({
        steamId: p.steamId,
        name: p.name,
        points: p.points,
        average_rating: p.average_rating,
      }))

    return NextResponse.json({ players: matches })
  } catch {
    return NextResponse.json({ players: [] }, { status: 500 })
  }
}
