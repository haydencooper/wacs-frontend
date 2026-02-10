import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { g5Fetch, mapG5Error } from "@/lib/api"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await request.json().catch(() => null)
  if (!body?.team1_name || !body?.team2_name) {
    return NextResponse.json(
      { error: "team1_name and team2_name are required" },
      { status: 400 }
    )
  }
  if (!body.server_id) {
    return NextResponse.json(
      { error: "server_id is required — please select a server" },
      { status: 400 }
    )
  }

  try {
    // Step 1: Create teams in G5API (it expects team IDs, not names)
    const team1Res = await g5Fetch<{ id?: number; team?: { id?: number }; message?: string }>("/api/teams", {
      method: "POST",
      body: [{ name: body.team1_name, flag: "", logo: "", public_team: 1, is_pug: 1 }],
    })
    const team1Id = team1Res?.id ?? team1Res?.team?.id

    if (!team1Id) {
      return NextResponse.json(
        { error: `Failed to create team 1: ${JSON.stringify(team1Res)}` },
        { status: 502 }
      )
    }

    const team2Res = await g5Fetch<{ id?: number; team?: { id?: number }; message?: string }>("/api/teams", {
      method: "POST",
      body: [{ name: body.team2_name, flag: "", logo: "", public_team: 1, is_pug: 1 }],
    })
    const team2Id = team2Res?.id ?? team2Res?.team?.id

    if (!team2Id) {
      return NextResponse.json(
        { error: `Failed to create team 2: ${JSON.stringify(team2Res)}` },
        { status: 502 }
      )
    }

    // Step 2: Create the match with team IDs
    // G5API POST /api/matches expects req.body[0] (array-wrapped payload)
    const matchPayload: Record<string, unknown> = {
      server_id: Number(body.server_id),
      team1_id: team1Id,
      team2_id: team2Id,
      max_maps: body.max_maps ?? 1,
      title: `${body.team1_name} vs ${body.team2_name}`,
      skip_veto: false,
      is_pug: true,
      enforce_teams: 0,
      players_per_team: body.players_per_team ? Number(body.players_per_team) : 5,
    }

    if (body.veto_mappool) {
      matchPayload.veto_mappool = body.veto_mappool
    }


    const data = await g5Fetch<unknown>("/api/matches", {
      method: "POST",
      body: [matchPayload],
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Admin create match error:", error)
    const { message, status } = mapG5Error(error)
    return NextResponse.json({ error: message }, { status })
  }
}
