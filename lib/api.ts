import type { PlayerStat, Match, MapStat, Server, Season } from "./types"

// ── Config ───────────────────────────────────────────────

function getBaseUrl(): string {
  const raw = process.env.G5API_BASE_URL ?? ""
  return raw.replace(/\/+$/, "")
}

function getApiKey(): string {
  return process.env.G5API_KEY ?? ""
}

export function getAdminSteamIds(): string[] {
  const raw = process.env.ADMIN_STEAM_IDS ?? ""
  return raw.split(",").map((s) => s.trim()).filter(Boolean)
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
  /** Send body as application/x-www-form-urlencoded instead of JSON. Required by some G5API POST endpoints. */
  formEncoded?: boolean
  revalidate?: number
}

export async function g5Fetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = "GET", body, formEncoded = false, revalidate } = options

  const baseUrl = getBaseUrl()
  const apiKey = getApiKey()

  if (!baseUrl) {
    throw new Error("G5API_BASE_URL environment variable is not set")
  }

  const url = `${baseUrl}${path}`

  const contentType = formEncoded
    ? "application/x-www-form-urlencoded"
    : "application/json"

  const headers: Record<string, string> = {
    "user-api": apiKey,
    "Content-Type": contentType,
  }

  const fetchOptions: RequestInit & { next?: { revalidate?: number } } = {
    method,
    headers,
    redirect: "manual",
  }

  if (body) {
    if (formEncoded && typeof body === "object" && body !== null) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      }
      fetchOptions.body = params.toString()
    } else {
      fetchOptions.body = JSON.stringify(body)
    }
  }

  if (revalidate !== undefined) {
    fetchOptions.next = { revalidate }
  }

  const res = await fetch(url, fetchOptions)

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location") ?? ""
    throw new Error(
      `G5API redirected (${res.status}) for ${path} -> ${location}. Check that G5API_KEY env var is correct.`
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

  const resContentType = res.headers.get("content-type") ?? ""
  if (!resContentType.includes("application/json")) {
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

export function unwrapArray(data: unknown, ...keys: string[]): Record<string, unknown>[] {
  if (!data || typeof data !== "object") return []
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  const obj = data as Record<string, unknown>
  for (const key of keys) {
    const val = obj[key]
    if (Array.isArray(val)) return val as Record<string, unknown>[]
  }
  return []
}

export function unwrapObject(data: unknown, ...keys: string[]): Record<string, unknown> | null {
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
export function computeRating(
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

export function normalizePlayer(raw: Record<string, unknown>): PlayerStat {
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

/**
 * Normalize a G5API winner value to 1 (team1) or 2 (team2), or null if unknown.
 *
 * G5API stores winner as a team_id (e.g., 47, 48) rather than 1/2.
 * For standard matches, we map via team1_id/team2_id.
 * For PUG matches (team IDs may be 0), we fall back to comparing scores.
 *
 * Priority:
 *   1. Direct team_id match against team1_id/team2_id
 *   2. Already normalized (rawWinner is 1 or 2)
 *   3. Score comparison fallback
 */
export function deriveWinner(
  rawWinner: number | null,
  team1Id: number,
  team2Id: number,
  score1: number,
  score2: number,
): number | null {
  if (rawWinner === null || rawWinner === 0) {
    // No winner declared — try score fallback
    if (score1 > score2) return 1
    if (score2 > score1) return 2
    return null
  }
  if (rawWinner === team1Id && team1Id !== 0) return 1
  if (rawWinner === team2Id && team2Id !== 0) return 2
  if (rawWinner === 1 || rawWinner === 2) return rawWinner
  // Unresolvable team_id — score fallback
  if (score1 > score2) return 1
  if (score2 > score1) return 2
  return null
}

export function normalizeMatch(raw: Record<string, unknown>): Match {
  const team1Id = Number(raw.team1_id ?? 0)
  const team2Id = Number(raw.team2_id ?? 0)
  const rawWinner = raw.winner !== null && raw.winner !== undefined
    ? Number(raw.winner)
    : null

  // G5API list endpoint JOINs map_stats and returns team1_mapscore/team2_mapscore
  // (round-level scores). For BO1 the series score (team1_score/team2_score) is
  // just 0 or 1, so we prefer the mapscore when available.
  const team1Mapscore = raw.team1_mapscore != null ? Number(raw.team1_mapscore) : null
  const team2Mapscore = raw.team2_mapscore != null ? Number(raw.team2_mapscore) : null
  const score1 = team1Mapscore ?? Number(raw.team1_score ?? 0)
  const score2 = team2Mapscore ?? Number(raw.team2_score ?? 0)

  let winner = deriveWinner(rawWinner, team1Id, team2Id, score1, score2)

  // If end_time is set but winner is still null, try score-based derivation.
  // G5API may return null, "", or "0000-00-00 00:00:00" for unfinished matches.
  const rawEndTime = raw.end_time ? String(raw.end_time) : null
  const endTime = rawEndTime && rawEndTime !== "0000-00-00 00:00:00" ? rawEndTime : null
  if (winner === null && endTime !== null && !Boolean(raw.cancelled ?? false) && !Boolean(raw.forfeit ?? false)) {
    if (score1 > score2) winner = 1
    else if (score2 > score1) winner = 2
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

export function normalizeMapStat(
  raw: Record<string, unknown>,
  match?: Match | null
): MapStat {
  const rawWinner = raw.winner !== null && raw.winner !== undefined
    ? Number(raw.winner)
    : null
  const team1Id = match?.team1_id ?? 0
  const team2Id = match?.team2_id ?? 0
  const score1 = Number(raw.team1_score ?? 0)
  const score2 = Number(raw.team2_score ?? 0)
  const winner = deriveWinner(rawWinner, team1Id, team2Id, score1, score2)

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

export function normalizeServer(raw: Record<string, unknown>): Server {
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
  const data = await g5Fetch<unknown>("/api/leaderboard/players/pug", {
    revalidate: 60,
  })
  const raw = unwrapArray(data, "leaderboard")
  return raw.map(normalizePlayer)
}

export async function fetchPlayerStats(
  steamId: string
): Promise<PlayerStat | null> {
  const data = await g5Fetch<unknown>(`/api/playerstats/${steamId}/pug`, {
    revalidate: 60,
  })
  if (!data) return null
  // G5API responds: { playerstats: PlayerObject } (single object, not array)
  const raw = unwrapObject(data, "playerstats", "playerStats")
  if (!raw) return null
  return normalizePlayer(raw)
}

export async function fetchMatches(): Promise<Match[]> {
  const data = await g5Fetch<unknown>("/api/matches", { revalidate: 30 })
  const raw = unwrapArray(data, "matches")
  return raw.map(normalizeMatch)
}

export async function fetchMatch(matchId: string): Promise<Match | null> {
  const data = await g5Fetch<unknown>(`/api/matches/${matchId}`, {
    revalidate: 30,
  })
  if (!data) return null
  // G5API responds: { match: MatchData } (single object)
  const raw = unwrapObject(data, "match")
  if (!raw) return null
  return normalizeMatch(raw)
}

export async function fetchMapStats(
  matchId: string,
  match?: Match | null
): Promise<MapStat[]> {
  const data = await g5Fetch<unknown>(`/api/mapstats/${matchId}`, {
    revalidate: 60,
  })
  // G5API responds: { mapstats: MapStatsData[] }
  const raw = unwrapArray(data, "mapstats")
  return raw.map((r) => normalizeMapStat(r, match))
}

export async function fetchMatchPlayerStats(
  matchId: string,
  match?: Match | null
): Promise<{ team1: PlayerStat[]; team2: PlayerStat[] }> {
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
      console.warn(
        `[fetchMatchPlayerStats] Could not match team_id ${teamId} to team1=${team1Id} or team2=${team2Id} for player ${steamId} in match ${matchId}. Using round-robin fallback.`
      )
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
}

/**
 * Fetch and aggregate player stats across all matches in a season.
 * Makes one API call per match to `/api/playerstats/match/:id`, then
 * sums stats per player across all matches to produce competition-specific
 * PlayerStat objects. Also tracks wins per player based on match outcomes.
 *
 * Returns an array of PlayerStat sorted by average_rating descending.
 * Individual match failures are silently skipped.
 */
export async function fetchSeasonPlayerStats(
  matches: Match[],
): Promise<PlayerStat[]> {
  // Accumulator: steamId → { name, per-field sums, matchWins, mapsPlayed }
  const accum = new Map<
    string,
    {
      name: string
      kills: number
      deaths: number
      assists: number
      roundsplayed: number
      k1: number; k2: number; k3: number; k4: number; k5: number
      v1: number; v2: number; v3: number; v4: number; v5: number
      headshot_kills: number
      mapsPlayed: number
      matchWins: number
    }
  >()

  function ensurePlayer(steamId: string, name: string) {
    if (!accum.has(steamId)) {
      accum.set(steamId, {
        name,
        kills: 0, deaths: 0, assists: 0, roundsplayed: 0,
        k1: 0, k2: 0, k3: 0, k4: 0, k5: 0,
        v1: 0, v2: 0, v3: 0, v4: 0, v5: 0,
        headshot_kills: 0, mapsPlayed: 0, matchWins: 0,
      })
    }
  }

  await Promise.allSettled(
    matches.map(async (m) => {
      const data = await g5Fetch<unknown>(
        `/api/playerstats/match/${m.id}`,
        { revalidate: 300 },
      )
      const rows = unwrapArray(data, "playerstats", "playerStats")

      // Determine which team_id won this match
      const winningTeamId =
        m.winner === 1 ? m.team1_id :
        m.winner === 2 ? m.team2_id :
        null

      // Track which steamIds are on the winning team for this match
      const winnerSteamIds = new Set<string>()

      for (const row of rows) {
        const steamId = String(row.steam_id ?? row.steamId ?? "")
        if (!steamId) continue
        const name = String(row.name ?? "Unknown")
        const teamId = Number(row.team_id ?? 0)

        ensurePlayer(steamId, name)
        const p = accum.get(steamId)!

        // Update name to most recent
        if (name !== "Unknown") p.name = name

        p.kills += Number(row.kills ?? 0)
        p.deaths += Number(row.deaths ?? 0)
        p.assists += Number(row.assists ?? 0)
        p.roundsplayed += Number(row.roundsplayed ?? row.rounds_played ?? 0)
        p.k1 += Number(row.k1 ?? 0)
        p.k2 += Number(row.k2 ?? 0)
        p.k3 += Number(row.k3 ?? 0)
        p.k4 += Number(row.k4 ?? 0)
        p.k5 += Number(row.k5 ?? 0)
        p.v1 += Number(row.v1 ?? 0)
        p.v2 += Number(row.v2 ?? 0)
        p.v3 += Number(row.v3 ?? 0)
        p.v4 += Number(row.v4 ?? 0)
        p.v5 += Number(row.v5 ?? 0)
        p.headshot_kills += Number(row.headshot_kills ?? row.hsk ?? 0)
        p.mapsPlayed += 1

        if (winningTeamId !== null && teamId === winningTeamId) {
          winnerSteamIds.add(steamId)
        }
      }

      // Credit match wins (once per match, not per map row).
      // Since raw data may have multiple rows per player (one per map),
      // we use the winnerSteamIds set which is already deduplicated.
      for (const steamId of winnerSteamIds) {
        const p = accum.get(steamId)
        if (p) p.matchWins += 1
      }
    }),
  )

  // Convert accumulated data into PlayerStat objects via normalizePlayer
  const result: PlayerStat[] = []
  for (const [steamId, p] of accum) {
    const stat = normalizePlayer({
      steamId,
      steam_id: steamId,
      name: p.name,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      roundsplayed: p.roundsplayed,
      k1: p.k1, k2: p.k2, k3: p.k3, k4: p.k4, k5: p.k5,
      v1: p.v1, v2: p.v2, v3: p.v3, v4: p.v4, v5: p.v5,
      headshot_kills: p.headshot_kills,
      hsp: 0,
      average_rating: 0,
      wins: p.matchWins,
      total_maps: p.mapsPlayed,
      points: 0,
    })
    result.push(stat)
  }

  // Sort by rating descending
  result.sort((a, b) => b.average_rating - a.average_rating)

  return result
}

export async function fetchPlayerRecentMatches(
  steamId: string
): Promise<Match[]> {
  // Strategy 1: Try G5API /api/users/:steamId/recent first.
  // This only works for players with a `user` row, but it's fast and accurate.
  try {
    const data = await g5Fetch<unknown>(`/api/users/${steamId}/recent`, {
      revalidate: 60,
    })
    const raw = unwrapArray(data, "matches")
    if (raw.length > 0) {
      // Deduplicate by match ID (users/recent may return per-map rows)
      const uniqueIds = [...new Set(raw.map((r) => String(r.id ?? r.match_id ?? "")))]
        .filter(Boolean)
        .slice(0, 10)
      const fullMatches = await Promise.all(
        uniqueIds.map((id) => fetchMatch(id))
      )
      const result = fullMatches.filter((m): m is Match => m !== null)
      // Further deduplicate just in case
      const seen = new Set<number>()
      const deduped = result.filter((m) => {
        if (seen.has(m.id)) return false
        seen.add(m.id)
        return true
      })
      if (deduped.length > 0) return deduped.slice(0, 5)
    }
  } catch {
    // G5API may 404 or error for unknown users — fall through to strategy 2
  }

  // Strategy 2: Fetch all matches and scan for player participation.
  // We check ALL non-cancelled matches (sorted newest first) in batches.
  const allMatches = await fetchMatches()
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

  return found
}

/**
 * For each match, determine which team a player was on by checking match player stats.
 * Returns a map of matchId -> teamNumber (1 or 2) or null if unknown.
 */
export async function fetchPlayerTeamInMatches(
  steamId: string,
  matches: Match[]
): Promise<Map<number, number | null>> {
  const result = new Map<number, number | null>()
  
  await Promise.all(
    matches.map(async (match) => {
      try {
        const data = await g5Fetch<unknown>(
          `/api/playerstats/match/${match.id}`,
          { revalidate: 120 }
        )
        const stats = unwrapArray(data, "playerstats", "playerStats")
        
        // Collect all team IDs from player stats for this match
        const teamIds = new Set<number>()
        for (const s of stats) {
          const tid = Number(s.team_id ?? 0)
          if (tid > 0) teamIds.add(tid)
        }
        
        // Build team_id -> team number mapping
        let teamIdToNumber: Map<number, number>
        if (match.team1_id > 0 && match.team2_id > 0) {
          teamIdToNumber = new Map([
            [match.team1_id, 1],
            [match.team2_id, 2],
          ])
        } else if (teamIds.size === 2) {
          // PUG match: infer teams from player stats
          const sorted = [...teamIds].sort((a, b) => a - b)
          teamIdToNumber = new Map([
            [sorted[0], 1],
            [sorted[1], 2],
          ])
        } else {
          result.set(match.id, null)
          return
        }
        
        const playerRow = stats.find(
          (s) => String(s.steam_id ?? s.steamId ?? "") === steamId
        )
        if (playerRow) {
          const teamId = Number(playerRow.team_id ?? 0)
          const teamNum = teamIdToNumber.get(teamId)
          result.set(match.id, teamNum ?? null)
        } else {
          result.set(match.id, null)
        }
      } catch {
        result.set(match.id, null)
      }
    })
  )
  
  return result
}

/**
 * Fetch map stats for multiple matches in batched parallel. Returns a flat array of all MapStat entries.
 * Used by the community stats page to get map name data.
 * Processes in batches of 15 to avoid overwhelming the API.
 */
export async function fetchBulkMapStats(
  matches: Match[],
  limit = 50
): Promise<MapStat[]> {
  const batch = matches.slice(0, limit)
  const allResults: MapStat[] = []
  const BATCH_SIZE = 15
  
  for (let i = 0; i < batch.length; i += BATCH_SIZE) {
    const chunk = batch.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(
      chunk.map((m) => fetchMapStats(String(m.id), m))
    )
    allResults.push(...results.flat())
  }
  
  return allResults
}

export async function fetchSeasons(): Promise<Season[]> {
  const data = await g5Fetch<unknown>("/api/seasons", { revalidate: 300 })
  const raw = unwrapArray(data, "seasons")
  return raw.map((s: Record<string, unknown>) => ({
    id: Number(s.id),
    name: String(s.name ?? `Season ${s.id}`),
    start_date: String(s.start_date ?? ""),
    end_date: s.end_date ? String(s.end_date) : null,
  }))
}

export async function fetchServers(): Promise<Server[]> {
  // Use /api/servers/myservers for authenticated server list
  const data = await g5Fetch<unknown>("/api/servers/myservers", {
    revalidate: 15,
  })
  // G5API responds: { servers: ServerData[] }
  const raw = unwrapArray(data, "servers")
  return raw.map(normalizeServer)
}
