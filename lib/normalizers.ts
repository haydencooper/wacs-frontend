import type { PlayerStat, Match, MapStat, Server } from "./types"

// ── Response Unwrappers ──────────────────────────────────

/** Unwrap a G5API response that may be a raw array or wrapped in { key: [...] } */
export function unwrapArray(
  data: unknown,
  ...keys: string[]
): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>
    for (const key of keys) {
      if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[]
    }
  }
  return []
}

/** Unwrap a G5API response that may be a raw object or wrapped in { key: {...} } */
export function unwrapObject(
  data: unknown,
  ...keys: string[]
): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null
  const obj = data as Record<string, unknown>
  for (const key of keys) {
    if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      return obj[key] as Record<string, unknown>
    }
  }
  if (Array.isArray(data)) return (data as Record<string, unknown>[])[0] ?? null
  return obj
}

// ── Normalizers ──────────────────────────────────────────

export function normalizePlayer(raw: Record<string, unknown>): PlayerStat {
  return {
    steamId: String(raw.steam_id ?? raw.steamId ?? ""),
    name: String(raw.name ?? "Unknown"),
    kills: Number(raw.kills ?? 0),
    deaths: Number(raw.deaths ?? 0),
    assists: Number(raw.assists ?? 0),
    k1: Number(raw.k1 ?? 0),
    k2: Number(raw.k2 ?? 0),
    k3: Number(raw.k3 ?? 0),
    k4: Number(raw.k4 ?? 0),
    k5: Number(raw.k5 ?? 0),
    v1: Number(raw.v1 ?? 0),
    v2: Number(raw.v2 ?? 0),
    v3: Number(raw.v3 ?? 0),
    v4: Number(raw.v4 ?? 0),
    v5: Number(raw.v5 ?? 0),
    roundsplayed: Number(raw.roundsplayed ?? raw.rounds_played ?? 0),
    hsk: Number(raw.headshot_kills ?? raw.hsk ?? 0),
    hsp: Number(raw.hsp ?? raw.headshot_percentage ?? 0),
    average_rating: Number(raw.average_rating ?? raw.rating ?? 0),
    wins: Number(raw.wins ?? 0),
    total_maps: Number(raw.total_maps ?? 0),
    points: Number(raw.points ?? raw.elo ?? 1000),
  }
}

export function normalizeMatch(raw: Record<string, unknown>): Match {
  return {
    id: Number(raw.id ?? 0),
    team1_id: Number(raw.team1_id ?? 0),
    team2_id: Number(raw.team2_id ?? 0),
    winner:
      raw.winner !== null && raw.winner !== undefined
        ? Number(raw.winner)
        : null,
    team1_score: Number(raw.team1_score ?? 0),
    team2_score: Number(raw.team2_score ?? 0),
    team1_mapscore: raw.team1_mapscore !== null && raw.team1_mapscore !== undefined ? Number(raw.team1_mapscore) : null,
    team2_mapscore: raw.team2_mapscore !== null && raw.team2_mapscore !== undefined ? Number(raw.team2_mapscore) : null,
    team1_string: String(raw.team1_string ?? raw.team1_name ?? "Team 1"),
    team2_string: String(raw.team2_string ?? raw.team2_name ?? "Team 2"),
    cancelled: Boolean(raw.cancelled ?? false),
    forfeit: Boolean(raw.forfeit ?? false),
    start_time: String(raw.start_time ?? ""),
    end_time: raw.end_time ? String(raw.end_time) : null,
    title: String(raw.title ?? ""),
    max_maps: Number(raw.max_maps ?? 1),
    season_id:
      raw.season_id !== null && raw.season_id !== undefined
        ? Number(raw.season_id)
        : null,
    is_pug: Boolean(raw.is_pug ?? true),
  }
}

export function normalizeMapStat(raw: Record<string, unknown>): MapStat {
  return {
    id: Number(raw.id ?? 0),
    match_id: Number(raw.match_id ?? 0),
    winner:
      raw.winner !== null && raw.winner !== undefined
        ? Number(raw.winner)
        : null,
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
