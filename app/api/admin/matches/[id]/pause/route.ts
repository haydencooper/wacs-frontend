import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { g5Fetch, mapG5Error } from "@/lib/api"

export const dynamic = "force-dynamic"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid match ID" }, { status: 400 })
  }

  try {
    const data = await g5Fetch<unknown>(`/api/matches/${id}/pause`)
    return NextResponse.json(data)
  } catch (error) {
    console.error(`Admin pause match ${id} error:`, error)
    const { message, status } = mapG5Error(error)
    return NextResponse.json({ error: message }, { status })
  }
}
