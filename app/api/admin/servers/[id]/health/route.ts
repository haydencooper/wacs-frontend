import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { g5Fetch, mapG5Error } from "@/lib/api"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid server ID" }, { status: 400 })
  }

  try {
    const data = await g5Fetch<unknown>(`/api/servers/${id}/status`)
    return NextResponse.json({ healthy: true, data })
  } catch (error) {
    console.error(`Server ${id} health check error:`, error)
    const { message, status } = mapG5Error(error)
    return NextResponse.json({ healthy: false, error: message }, { status })
  }
}
