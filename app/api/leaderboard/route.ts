import { NextRequest, NextResponse } from "next/server"
import { g5Fetch, mapG5Error } from "@/lib/api"
import { normalizePlayer, unwrapArray } from "@/lib/normalizers"
import { rateLimit } from "@/lib/rate-limit"
import type { PlayerStat } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown"
  const { allowed } = rateLimit(ip)
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  try {
    const data = await g5Fetch<unknown>("/api/leaderboard/players/pug")

    const players = unwrapArray(data, "leaderboard", "players").map(normalizePlayer)

    // Sort by points descending
    players.sort((a: PlayerStat, b: PlayerStat) => b.points - a.points)

    return NextResponse.json(players)
  } catch (error) {
    console.error("Leaderboard fetch error:", error)
    const { message, status } = mapG5Error(error)
    return NextResponse.json({ error: message }, { status })
  }
}
