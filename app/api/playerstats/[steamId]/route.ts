import { NextResponse } from "next/server"
import { g5Fetch, mapG5Error } from "@/lib/api"
import { normalizePlayer, unwrapObject } from "@/lib/normalizers"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ steamId: string }> }
) {
  const { steamId } = await params

  if (!/^\d{17}$/.test(steamId)) {
    return NextResponse.json(
      { error: "Invalid Steam ID format" },
      { status: 400 }
    )
  }

  try {
    const data = await g5Fetch<unknown>(`/api/playerstats/${steamId}/pug`)

    const raw = unwrapObject(data, "player", "playerstats")
    if (!raw) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      )
    }

    const player = normalizePlayer(raw)

    // Ensure the steamId is set if the API didn't return it
    if (!player.steamId) {
      player.steamId = steamId
    }

    return NextResponse.json(player)
  } catch (error) {
    console.error(`PlayerStats ${steamId} fetch error:`, error)
    const { message, status } = mapG5Error(error)
    return NextResponse.json({ error: message }, { status })
  }
}
