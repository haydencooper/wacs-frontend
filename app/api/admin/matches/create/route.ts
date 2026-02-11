import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/admin"
import { g5Fetch, mapG5Error } from "@/lib/api"
import { rateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

const createMatchSchema = z.object({
  team1_name: z.string().min(1, "Team 1 name is required").max(64),
  team2_name: z.string().min(1, "Team 2 name is required").max(64),
  max_maps: z.coerce.number().int().refine((v) => [1, 3, 5].includes(v), {
    message: "max_maps must be 1, 3, or 5",
  }).default(1),
  server_id: z.coerce.number().int().positive("server_id is required"),
  veto_mappool: z.string().max(500).optional(),
  players_per_team: z.coerce.number().int().min(1).max(5).default(5),
})

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  const { allowed } = rateLimit(ip, { limit: 10 })
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const denied = await requireAdmin()
  if (denied) return denied

  const body = await request.json().catch(() => null)
  const parsed = createMatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    )
  }

  const { team1_name, team2_name, max_maps, server_id, veto_mappool, players_per_team } = parsed.data

  try {
    // Step 1: Create teams in G5API (it expects team IDs, not names)
    const team1Res = await g5Fetch<{ id?: number; team?: { id?: number }; message?: string }>("/api/teams", {
      method: "POST",
      body: [{ name: team1_name, flag: "", logo: "", public_team: 1, is_pug: 1 }],
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
      body: [{ name: team2_name, flag: "", logo: "", public_team: 1, is_pug: 1 }],
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
      server_id,
      team1_id: team1Id,
      team2_id: team2Id,
      max_maps,
      title: `${team1_name} vs ${team2_name}`,
      skip_veto: false,
      is_pug: true,
      enforce_teams: 0,
      players_per_team,
    }

    if (veto_mappool) {
      matchPayload.veto_mappool = veto_mappool
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
