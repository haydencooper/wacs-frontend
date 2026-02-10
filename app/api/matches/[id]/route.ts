import { NextResponse } from "next/server"
import { g5Fetch, mapG5Error } from "@/lib/api"
import { normalizeMatch, unwrapObject } from "@/lib/normalizers"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { error: "Invalid match ID format" },
      { status: 400 }
    )
  }

  try {
    const data = await g5Fetch<unknown>(`/api/matches/${id}`)

    const raw = unwrapObject(data, "match")
    if (!raw) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      )
    }

    const match = normalizeMatch(raw)

    return NextResponse.json(match)
  } catch (error) {
    console.error(`Match ${id} fetch error:`, error)
    const { message, status } = mapG5Error(error)
    return NextResponse.json({ error: message }, { status })
  }
}
