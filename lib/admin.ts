import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { getAdminSteamIds } from "@/lib/api"

function getSteamIdFromSession(session: unknown): string | null {
  const s = session as { user?: { steam?: { steamid?: string } } } | null
  return s?.user?.steam?.steamid ?? null
}

export function isAdmin(session: unknown): boolean {
  const steamId = getSteamIdFromSession(session)
  if (!steamId) return false
  return getAdminSteamIds().includes(steamId)
}

/**
 * Guard for admin API routes. Returns a NextResponse error if not admin, or null if authorized.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(getAuthOptions())
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}
