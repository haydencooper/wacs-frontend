import { NextResponse } from "next/server"
import { g5Fetch, mapG5Error } from "@/lib/api"
import { normalizeMapStat, unwrapArray } from "@/lib/normalizers"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params

  if (!/^\d+$/.test(matchId)) {
    return NextResponse.json(
      { error: "Invalid match ID format" },
      { status: 400 }
    )
  }

  try {
    const data = await g5Fetch<unknown>(`/api/mapstats/${matchId}`)

    const mapStats = unwrapArray(data, "mapstats", "map_stats").map(normalizeMapStat)

    return NextResponse.json(mapStats)
  } catch (error) {
    console.error(`MapStats ${matchId} fetch error:`, error)
    const { message, status } = mapG5Error(error)
    return NextResponse.json({ error: message }, { status })
  }
}
