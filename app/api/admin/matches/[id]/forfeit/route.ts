import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { g5Fetch, mapG5Error } from "@/lib/api"

export const dynamic = "force-dynamic"

export async function POST(
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
  const winner = body?.winner
  if (winner !== 1 && winner !== 2) {
    return NextResponse.json(
      { error: "winner must be 1 or 2" },
      { status: 400 }
    )
  }

  try {
    const data = await g5Fetch<unknown>(`/api/matches/${id}/forfeit/${winner}`)
    return NextResponse.json(data)
  } catch (error) {
    console.error(`Admin forfeit match ${id} error:`, error)
    const { message, status } = mapG5Error(error)
    return NextResponse.json({ error: message }, { status })
  }
}
