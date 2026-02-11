import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { fetchLeaderboard } from "@/lib/api"
import { rateLimit } from "@/lib/rate-limit"

const searchSchema = z.object({
  q: z.string().min(2).max(64),
})

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown"
  const { allowed } = rateLimit(ip)
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const parsed = searchSchema.safeParse({
    q: req.nextUrl.searchParams.get("q") ?? "",
  })
  if (!parsed.success) {
    return NextResponse.json({ players: [] })
  }

  const q = parsed.data.q.trim().toLowerCase()

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
