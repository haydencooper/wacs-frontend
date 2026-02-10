import { NextResponse } from "next/server"
import { g5Fetch, mapG5Error } from "@/lib/api"
import { normalizeMatch, unwrapArray } from "@/lib/normalizers"
import type { Match } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET() {
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
