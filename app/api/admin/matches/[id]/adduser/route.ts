import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { g5Fetch, mapG5Error } from "@/lib/api"

export const dynamic = "force-dynamic"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid match ID" }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const steamId = body?.steam_id
  const teamId = body?.team_id
  const nickname = body?.nickname

  if (!steamId || !teamId || !nickname) {
    return NextResponse.json(
      { error: "steam_id, team_id, and nickname are required" },
      { status: 400 }
    )
  }

  if (!["team1", "team2", "spec"].includes(teamId)) {
    return NextResponse.json(
      { error: "team_id must be team1, team2, or spec" },
      { status: 400 }
    )
  }

  const endpoint = teamId === "spec" ? "addspec" : "adduser"

  try {
    const data = await g5Fetch<unknown>(`/api/matches/${id}/${endpoint}`, {
      method: "PUT",
      body: [{ steam_id: steamId, team_id: teamId, nickname }],
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error(`Admin add user to match ${id} error:`, error)
    const { message, status } = mapG5Error(error)
    return NextResponse.json({ error: message }, { status })
  }
}
