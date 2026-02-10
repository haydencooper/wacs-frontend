import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { isAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(getAuthOptions())
  return NextResponse.json({ isAdmin: isAdmin(session) })
}
