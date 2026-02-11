import { NextRequest, NextResponse } from "next/server"
import { g5Fetch, mapG5Error } from "@/lib/api"
import { normalizeMatch, unwrapArray } from "@/lib/normalizers"
import { rateLimit } from "@/lib/rate-limit"
import type { Match } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown"
  const { allowed } = rateLimit(ip)
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  try {
    const data = await g5Fetch<unknown>("/api/matches")

    const matches = unwrapArray(data, "matches").map(normalizeMatch)

    // Sort by start_time descending (most recent first)
    matches.sort(
      (a: Match, b: Match) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    )

    return NextResponse.json(matches)
  } catch (error) {
    console.error("Matches fetch error:", error)
    const { message, status } = mapG5Error(error)
    return NextResponse.json({ error: message }, { status })
  }
}
