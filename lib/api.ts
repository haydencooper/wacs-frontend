import { readFileSync } from "fs"
import { join } from "path"
import type { PlayerStat, Match, MapStat, Server, Season } from "./types"

// ── Config ───────────────────────────────────────────────

interface AppConfig {
  admin_steam_ids?: string[]
  discord: {
    token: string
    guild_id: string
    channel_id: string
  }
  game: {
    maps: {
      competitive: Record<string, string>
      wingman: Record<string, string>
    }
  }
  web: {
    base_url: string
    api_key: string
  }
  db: {
    user: string
    password: string
    database: string
    host: string
    port: string
  }
}

function loadConfig(): AppConfig | null {
  try {
    const configPath = join(process.cwd(), "config.json")
    const raw = readFileSync(configPath, "utf-8")
    return JSON.parse(raw) as AppConfig
  } catch {
    return null
  }
}

let _config: AppConfig | null | undefined
function getConfig(): AppConfig | null {
  if (_config === undefined) {
    _config = loadConfig()
  }
  return _config
}

function getBaseUrl(): string {
  const raw = getConfig()?.web.base_url ?? ""
  return raw.replace(/\/+$/, "")
}

function getApiKey(): string {
  return getConfig()?.web.api_key ?? ""
}

export function getAdminSteamIds(): string[] {
  return getConfig()?.admin_steam_ids ?? []
}

export function mapG5Error(error: unknown): { message: string; status: number } {
  if (error instanceof Error) {
    const match = error.message.match(/G5API error: (\d+)/)
    if (match) {
      return { message: error.message, status: Number(match[1]) }
    }
    return { message: error.message, status: 502 }
  }
  return { message: "Unknown error", status: 500 }
}

// ── Fetcher ──────────────────────────────────────────────

interface FetchOptions {
  method?: string
  body?: unknown
  revalidate?: number
}

export async function g5Fetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = "GET", body, revalidate } = options

  const baseUrl = getBaseUrl()
  const apiKey = getApiKey()

  if (!baseUrl) {
    throw new Error("G5API base_url is not configured in config.json")
  }

  const url = `${baseUrl}${path}`

  const headers: Record<string, string> = {
    "user-api": apiKey,
    "Content-Type": "application/json",
  }

  const fetchOptions: RequestInit & { next?: { revalidate?: number } } = {
    method,
    headers,
    redirect: "manual",
  }

  if (body) {
    fetchOptions.body = JSON.stringify(body)
  }

  if (revalidate !== undefined) {
    fetchOptions.next = { revalidate }
  }

  const res = await fetch(url, fetchOptions)

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location") ?? ""
    throw new Error(
      `G5API redirected (${res.status}) for ${path} -> ${location}. Check that api_key in config.json is correct.`
    )
  }

  // G5API returns 404 for "no data found" — treat as empty rather than error
  if (res.status === 404) {
    return null as T
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(
      `G5API error: ${res.status} ${res.statusText} for ${path}${text ? ` — ${text.slice(0, 200)}` : ""}`
    )
  }

  const contentType = res.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) {
    const text = await res.text()
    throw new Error(
      `G5API returned non-JSON response for ${path}: ${text.slice(0, 200)}`
    )
  }

  return res.json() as Promise<T>
}

// ── Response Unwrappers ──────────────────────────────────
// G5API wraps all responses in an object like { matches: [...] } or { match: {...} }
// These helpers extract the actual data.

function unwrapArray(data: unknown, ...keys: string[]): Record<string, unknown>[] {
  if (!data || typeof data !== "object") return []
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  const obj = data as Record<string, unknown>
  for (const key of keys) {
    const val = obj[key]
    if (Array.isArray(val)) return val as Record<string, unknown>[]
  }
  return []
}

function unwrapObject(data: unknown, ...keys: string[]): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null
  if (Array.isArray(data)) return (data[0] as Record<string, unknown>) ?? null
  const obj = data as Record<string, unknown>
  for (const key of keys) {
    const val = obj[key]
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return val as Record<string, unknown>
    }
  }
  // If no key matched, the object itself might be the data (e.g. single player stat)
  return obj
}

// ── Rating Calculation (HLTV Rating 1.0) ─────────────────
// Mirrors G5API's Utils.getRating()
function computeRating(
  kills: number,
  roundsPlayed: number,
  deaths: number,
  k1: number,
  k2: number,
  k3: number,
  k4: number,
  k5: number
): number {
  if (roundsPlayed === 0) return 0
  const killRating = kills / roundsPlayed / 0.679
  const survivalRating = (roundsPlayed - deaths) / roundsPlayed / 0.317
  const multiKillBonus =
    (k1 + 4 * k2 + 9 * k3 + 16 * k4 + 25 * k5) / roundsPlayed / 1.277
  return (killRating + 0.7 * survivalRating + multiKillBonus) / 2.7
}

// ── Normalizers ──────────────────────────────────────────

function normalizePlayer(raw: Record<string, unknown>): PlayerStat {
  const kills = Number(raw.kills ?? 0)
  const deaths = Number(raw.deaths ?? 0)
  const assists = Number(raw.assists ?? 0)
  const roundsplayed = Number(raw.roundsplayed ?? raw.rounds_played ?? 0)
  const hsk = Number(raw.headshot_kills ?? raw.hsk ?? 0)
  const k1 = Number(raw.k1 ?? 0)
  const k2 = Number(raw.k2 ?? 0)
  const k3 = Number(raw.k3 ?? 0)
  const k4 = Number(raw.k4 ?? 0)
  const k5 = Number(raw.k5 ?? 0)

  // G5API leaderboard returns hsp as pre-calculated, but per-match stats don't
  let hsp = Number(raw.hsp ?? 0)
  if (hsp === 0 && kills > 0 && hsk > 0) {
    hsp = (hsk / kills) * 100
  }

  // G5API leaderboard returns average_rating pre-computed. Per-match raw stats
  // don't have it, so we calculate it using the HLTV Rating 1.0 formula.
  let avgRating = Number(raw.average_rating ?? raw.rating ?? 0)
  if (avgRating === 0 && roundsplayed > 0) {
    avgRating = computeRating(kills, roundsplayed, deaths, k1, k2, k3, k4, k5)
  }

  return {
    steamId: String(raw.steamId ?? raw.steam_id ?? ""),
    name: String(raw.name ?? "Unknown"),
    kills,
    deaths,
    assists,
    roundsplayed,
    k1,
    k2,
    k3,
    k4,
    k5,
    v1: Number(raw.v1 ?? 0),
    v2: Number(raw.v2 ?? 0),
    v3: Number(raw.v3 ?? 0),
    v4: Number(raw.v4 ?? 0),
    v5: Number(raw.v5 ?? 0),
    hsk,
    hsp,
    average_rating: avgRating,
    wins: Number(raw.wins ?? 0),
    total_maps: Number(raw.total_maps ?? raw.totalMaps ?? 0),
    points: Number(raw.points ?? 1000),
  }
}

function normalizeMatch(raw: Record<string, unknown>): Match {
  const team1Id = Number(raw.team1_id ?? 0)
  const team2Id = Number(raw.team2_id ?? 0)
  const rawWinner = raw.winner !== null && raw.winner !== undefined
    ? Number(raw.winner)
    : null

  // G5API stores winner as team_id. Normalize to 1 (team1) or 2 (team2).
  let winner: number | null = null
  if (rawWinner !== null && rawWinner !== 0) {
    if (rawWinner === team1Id) {
      winner = 1
    } else if (rawWinner === team2Id) {
      winner = 2
    } else {
      // If winner doesn't match team IDs, it might already be 1/2
      winner = rawWinner
    }
  }

  // G5API list endpoint JOINs map_stats and returns team1_mapscore/team2_mapscore
  // (round-level scores). For BO1 the series score (team1_score/team2_score) is
  // just 0 or 1, so we prefer the mapscore when available.
  const team1Mapscore = raw.team1_mapscore != null ? Number(raw.team1_mapscore) : null
  const team2Mapscore = raw.team2_mapscore != null ? Number(raw.team2_mapscore) : null

  // If end_time is set but winner is not, derive winner from scores.
  // G5API may return null, "", or "0000-00-00 00:00:00" for unfinished matches.
  const rawEndTime = raw.end_time ? String(raw.end_time) : null
  const endTime = rawEndTime && rawEndTime !== "0000-00-00 00:00:00" ? rawEndTime : null
  if (winner === null && endTime !== null && !Boolean(raw.cancelled ?? false) && !Boolean(raw.forfeit ?? false)) {
    // Try to derive from mapscore first, then series score
    const s1 = team1Mapscore ?? Number(raw.team1_score ?? 0)
    const s2 = team2Mapscore ?? Number(raw.team2_score ?? 0)
    if (s1 > s2) winner = 1
    else if (s2 > s1) winner = 2
  }

  return {
    id: Number(raw.id ?? 0),
    team1_id: team1Id,
    team2_id: team2Id,
    winner,
    team1_score: Number(raw.team1_score ?? 0),
    team2_score: Number(raw.team2_score ?? 0),
    team1_mapscore: team1Mapscore,
    team2_mapscore: team2Mapscore,
    team1_string: String(raw.team1_string ?? raw.team1_name ?? "Team 1"),
    team2_string: String(raw.team2_string ?? raw.team2_name ?? "Team 2"),
    cancelled: Boolean(raw.cancelled ?? false),
    forfeit: Boolean(raw.forfeit ?? false),
    start_time: String(raw.start_time ?? ""),
    end_time: endTime,
    title: String(raw.title ?? ""),
    max_maps: Number(raw.max_maps ?? 1),
    season_id: raw.season_id !== null && raw.season_id !== undefined ? Number(raw.season_id) : null,
    is_pug: Boolean(raw.is_pug ?? true),
  }
}

function normalizeMapStat(
  raw: Record<string, unknown>,
  match?: Match | null
): MapStat {
  const rawWinner = raw.winner !== null && raw.winner !== undefined && raw.winner !== 0
    ? Number(raw.winner)
    : null

  // Normalize winner from team_id to 1/2 like we do for matches
  let winner: number | null = null
  if (rawWinner !== null && match) {
    if (rawWinner === match.team1_id) {
      winner = 1
    } else if (rawWinner === match.team2_id) {
      winner = 2
    } else {
      winner = rawWinner
    }
  } else {
    winner = rawWinner
  }

  return {
    id: Number(raw.id ?? 0),
    match_id: Number(raw.match_id ?? 0),
    winner,
    map_number: Number(raw.map_number ?? 0),
    map_name: String(raw.map_name ?? ""),
    team1_score: Number(raw.team1_score ?? 0),
    team2_score: Number(raw.team2_score ?? 0),
    start_time: String(raw.start_time ?? ""),
    end_time: raw.end_time ? String(raw.end_time) : null,
  }
}

function normalizeServer(raw: Record<string, unknown>): Server {
  return {
    id: Number(raw.id ?? 0),
    ip_string: String(raw.ip_string ?? ""),
    port: Number(raw.port ?? 0),
    gotv_port: Number(raw.gotv_port ?? 0),
    display_name: String(raw.display_name ?? ""),
    flag: String(raw.flag ?? ""),
    public_server: Boolean(raw.public_server ?? false),
    in_use: Boolean(raw.in_use ?? false),
  }
}

// ── API Helpers ──────────────────────────────────────────

export async function fetchLeaderboard(): Promise<PlayerStat[]> {
  try {
    const data = await g5Fetch<unknown>("/api/leaderboard/players/pug", {
      revalidate: 60,
    })
    const raw = unwrapArray(data, "leaderboard")
    return raw.map(normalizePlayer)
  } catch (e) {
    console.error("fetchLeaderboard error:", e)
    return []
  }
}

export async function fetchPlayerStats(
  steamId: string
): Promise<PlayerStat | null> {
  try {
    const data = await g5Fetch<unknown>(`/api/playerstats/${steamId}/pug`, {
      revalidate: 60,
    })
    if (!data) return null
    // G5API responds: { playerstats: PlayerObject } (single object, not array)
    const raw = unwrapObject(data, "playerstats", "playerStats")
    if (!raw) return null
    return normalizePlayer(raw)
  } catch (e) {
    console.error("fetchPlayerStats error:", e)
    return null
  }
}

export async function fetchMatches(): Promise<Match[]> {
  try {
    const data = await g5Fetch<unknown>("/api/matches", { revalidate: 30 })
    const raw = unwrapArray(data, "matches")
    return raw.map(normalizeMatch)
  } catch (e) {
    console.error("fetchMatches error:", e)
    return []
  }
}

export async function fetchMatch(matchId: string): Promise<Match | null> {
  try {
    const data = await g5Fetch<unknown>(`/api/matches/${matchId}`, {
      revalidate: 30,
    })
    if (!data) return null
    // G5API responds: { match: MatchData } (single object)
    const raw = unwrapObject(data, "match")
    if (!raw) return null
    return normalizeMatch(raw)
  } catch (e) {
    console.error("fetchMatch error:", e)
    return null
  }
}

export async function fetchMapStats(
  matchId: string,
  match?: Match | null
): Promise<MapStat[]> {
  try {
    const data = await g5Fetch<unknown>(`/api/mapstats/${matchId}`, {
      revalidate: 60,
    })
    // G5API responds: { mapstats: MapStatsData[] }
    const raw = unwrapArray(data, "mapstats")
    return raw.map((r) => normalizeMapStat(r, match))
  } catch (e) {
    console.error("fetchMapStats error:", e)
    return []
  }
}

export async function fetchMatchPlayerStats(
  matchId: string,
  match?: Match | null
): Promise<{ team1: PlayerStat[]; team2: PlayerStat[] }> {
  try {
    const data = await g5Fetch<unknown>(
      `/api/playerstats/match/${matchId}`,
      { revalidate: 60 }
    )
    // G5API responds: { playerstats: PlayerStats[] } — raw per-map rows
    const raw = unwrapArray(data, "playerstats", "playerStats")
    if (raw.length === 0) return { team1: [], team2: [] }

    // The raw data contains per-map rows. We need to aggregate per player
    // and split by team. Each row has team_id which corresponds to
    // match.team1_id or match.team2_id.
    const team1Id = match?.team1_id ?? 0
    const team2Id = match?.team2_id ?? 0

    // Aggregate stats by steam_id
    const playerMap = new Map<string, { raw: Record<string, unknown>[], teamId: number }>()
    for (const row of raw) {
      const steamId = String(row.steam_id ?? row.steamId ?? "")
      const teamId = Number(row.team_id ?? 0)
      if (!steamId) continue
      const existing = playerMap.get(steamId)
      if (existing) {
        existing.raw.push(row)
      } else {
        playerMap.set(steamId, { raw: [row], teamId })
      }
    }

    const team1: PlayerStat[] = []
    const team2: PlayerStat[] = []

    for (const [steamId, { raw: rows, teamId }] of playerMap) {
      // Sum numeric fields across maps (for BO1 there's only 1 row per player)
      const aggregated: Record<string, unknown> = {
        steam_id: steamId,
        steamId: steamId,
        name: String(rows[0].name ?? "Unknown"),
        kills: rows.reduce((s, r) => s + Number(r.kills ?? 0), 0),
        deaths: rows.reduce((s, r) => s + Number(r.deaths ?? 0), 0),
        assists: rows.reduce((s, r) => s + Number(r.assists ?? 0), 0),
        roundsplayed: rows.reduce((s, r) => s + Number(r.roundsplayed ?? r.rounds_played ?? 0), 0),
        k1: rows.reduce((s, r) => s + Number(r.k1 ?? 0), 0),
        k2: rows.reduce((s, r) => s + Number(r.k2 ?? 0), 0),
        k3: rows.reduce((s, r) => s + Number(r.k3 ?? 0), 0),
        k4: rows.reduce((s, r) => s + Number(r.k4 ?? 0), 0),
        k5: rows.reduce((s, r) => s + Number(r.k5 ?? 0), 0),
        v1: rows.reduce((s, r) => s + Number(r.v1 ?? 0), 0),
        v2: rows.reduce((s, r) => s + Number(r.v2 ?? 0), 0),
        v3: rows.reduce((s, r) => s + Number(r.v3 ?? 0), 0),
        v4: rows.reduce((s, r) => s + Number(r.v4 ?? 0), 0),
        v5: rows.reduce((s, r) => s + Number(r.v5 ?? 0), 0),
        headshot_kills: rows.reduce((s, r) => s + Number(r.headshot_kills ?? r.hsk ?? 0), 0),
        hsp: 0,
        // average_rating intentionally 0 so normalizePlayer computes it via roundsplayed
        average_rating: 0,
        wins: 0,
        total_maps: rows.length,
        points: 0,
      }

      const player = normalizePlayer(aggregated)

      // Assign to team based on team_id matching the match's team IDs
      if (team1Id && teamId === team1Id) {
        team1.push(player)
      } else if (team2Id && teamId === team2Id) {
        team2.push(player)
      } else {
        // Fallback: assign alternately
        if (team1.length <= team2.length) {
          team1.push(player)
        } else {
          team2.push(player)
        }
      }
    }

    // Sort each team by kills descending
    team1.sort((a, b) => b.kills - a.kills)
    team2.sort((a, b) => b.kills - a.kills)

    return { team1, team2 }
  } catch (e) {
    console.error("fetchMatchPlayerStats error:", e)
    return { team1: [], team2: [] }
  }
}

export async function fetchPlayerRecentMatches(
  steamId: string
): Promise<Match[]> {
  try {
    // Strategy 1: Try G5API /api/users/:steamId/recent first.
    // This only works for players with a `user` row, but it's fast and accurate.
    try {
      const data = await g5Fetch<unknown>(`/api/users/${steamId}/recent`, {
        revalidate: 60,
      })
      const raw = unwrapArray(data, "matches")
      if (raw.length > 0) {
        // users/recent returned matches
        const fullMatches = await Promise.all(
          raw.map((r) => fetchMatch(String(r.id)))
        )
        const result = fullMatches.filter((m): m is Match => m !== null)
        if (result.length > 0) return result
      }
    } catch {
      // G5API may 404 or error for unknown users — fall through to strategy 2
    }

    // Strategy 2: Fetch all matches and scan for player participation.
    // We check ALL non-cancelled matches (sorted newest first) in batches.
    const allMatches = await fetchMatches()
    // strategy 2: scan all matches
    if (allMatches.length === 0) return []

    const candidates = allMatches
      .filter((m) => !m.cancelled)
      .sort((a, b) => b.id - a.id)

    const found: Match[] = []
    const BATCH_SIZE = 10
    for (let i = 0; i < candidates.length && found.length < 5; i += BATCH_SIZE) {
      const batch = candidates.slice(i, i + BATCH_SIZE)
      const results = await Promise.all(
        batch.map(async (match) => {
          try {
            const data = await g5Fetch<unknown>(
              `/api/playerstats/match/${match.id}`,
              { revalidate: 120 }
            )
            const stats = unwrapArray(data, "playerstats", "playerStats")
            const participated = stats.some(
              (s) => String(s.steam_id ?? s.steamId ?? "") === steamId
            )
            return participated ? match : null
          } catch {
            return null
          }
        })
      )
      for (const m of results) {
        if (m && found.length < 5) found.push(m)
      }
    }

    // found matches via strategy 2
    return found
  } catch (e) {
    console.error("fetchPlayerRecentMatches error:", e)
    return []
  }
}

export async function fetchSeasons(): Promise<Season[]> {
  try {
    const data = await g5Fetch<unknown>("/api/seasons", { revalidate: 300 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = unwrapArray(data, "seasons")
    return raw.map((s: Record<string, unknown>) => ({
      id: Number(s.id),
      name: String(s.name ?? `Season ${s.id}`),
      start_date: String(s.start_date ?? ""),
      end_date: s.end_date ? String(s.end_date) : null,
    }))
  } catch (e) {
    console.error("fetchSeasons error:", e)
    return []
  }
}

export async function fetchServers(): Promise<Server[]> {
  try {
    // Use /api/servers/myservers for authenticated server list
    const data = await g5Fetch<unknown>("/api/servers/myservers", {
      revalidate: 15,
    })
    // G5API responds: { servers: ServerData[] }
    const raw = unwrapArray(data, "servers")
    return raw.map(normalizeServer)
  } catch (e) {
    console.error("fetchServers error:", e)
    return []
  }
}
