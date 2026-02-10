import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { getAdminSteamIds } from "@/lib/api"

function getSteamIdFromSession(session: unknown): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const steam = (session as any)?.user?.steam as
    | { steamid?: string }
    | undefined
  return steam?.steamid ?? null
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
