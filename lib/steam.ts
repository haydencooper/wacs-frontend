const STEAM_API_KEY = process.env.STEAM_SECRET ?? ""

export interface SteamProfile {
  steamid: string
  personaname: string
  avatarfull: string
  avatar: string
  avatarmedium: string
}

/**
 * Fetch Steam player summaries for a list of Steam IDs (max 100 per call).
 * Returns a map of steamId -> avatar URL (medium size, 64x64).
 */
export async function fetchSteamAvatars(
  steamIds: string[]
): Promise<Record<string, string>> {
  if (!STEAM_API_KEY || steamIds.length === 0) return {}

  // Steam API supports up to 100 IDs per request
  const batches: string[][] = []
  for (let i = 0; i < steamIds.length; i += 100) {
    batches.push(steamIds.slice(i, i + 100))
  }

  const result: Record<string, string> = {}

  for (const batch of batches) {
    try {
      const ids = batch.join(",")
      const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${ids}`
      const res = await fetch(url, { next: { revalidate: 300 } }) // Cache for 5 minutes
      if (!res.ok) continue

      const data = await res.json()
      const players: SteamProfile[] = data?.response?.players ?? []

      for (const player of players) {
        result[player.steamid] = player.avatarmedium
      }
    } catch {
      // Silently fail - avatars are non-critical
    }
  }

  return result
}

/**
 * Fetch a single Steam player's avatar.
 */
export async function fetchSteamAvatar(
  steamId: string
): Promise<string | null> {
  const avatars = await fetchSteamAvatars([steamId])
  return avatars[steamId] ?? null
}
