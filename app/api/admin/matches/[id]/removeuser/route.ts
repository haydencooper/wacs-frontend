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

  if (!steamId) {
    return NextResponse.json(
      { error: "steam_id is required" },
      { status: 400 }
    )
  }

  try {
    const data = await g5Fetch<unknown>(`/api/matches/${id}/removeuser`, {
      method: "PUT",
      body: [{ steam_id: steamId }],
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error(`Admin remove user from match ${id} error:`, error)
    const { message, status } = mapG5Error(error)
    return NextResponse.json({ error: message }, { status })
  }
}
