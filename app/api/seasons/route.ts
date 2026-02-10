import { NextResponse } from "next/server"
import { g5Fetch, mapG5Error } from "@/lib/api"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await g5Fetch<unknown>("/api/seasons")
    return NextResponse.json(data)
  } catch (error) {
    console.error("Fetch seasons error:", error)
    const { message, status } = mapG5Error(error)
    return NextResponse.json({ error: message }, { status })
  }
}
