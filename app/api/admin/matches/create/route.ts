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
    const payload: Record<string, unknown> = {
      server_id: Number(body.server_id),
      team1_name: body.team1_name,
      team2_name: body.team2_name,
      max_maps: body.max_maps ?? 1,
      is_pug: true,
    }

    const data = await g5Fetch<unknown>("/api/matches", {
      method: "POST",
      body: payload,
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error("Admin create match error:", error)
    const { message, status } = mapG5Error(error)
    return NextResponse.json({ error: message }, { status })
  }
}
