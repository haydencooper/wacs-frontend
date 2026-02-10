import { NextResponse } from "next/server"
import { g5Fetch, mapG5Error } from "@/lib/api"
import { normalizeServer, unwrapArray } from "@/lib/normalizers"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await g5Fetch<unknown>("/api/servers/myservers")

    const servers = unwrapArray(data, "servers").map(normalizeServer)

    return NextResponse.json(servers)
  } catch (error) {
    console.error("Servers fetch error:", error)
    const { message, status } = mapG5Error(error)
    return NextResponse.json({ error: message }, { status })
  }
}
