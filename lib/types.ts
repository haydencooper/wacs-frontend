export interface PlayerStat {
  steamId: string
  name: string
  kills: number
  deaths: number
  assists: number
  roundsplayed: number
  k1: number
  k2: number
  k3: number
  k4: number
  k5: number
  v1: number
  v2: number
  v3: number
  v4: number
  v5: number
  hsk: number
  hsp: number
  average_rating: number
  wins: number
  total_maps: number
  points: number
}

export interface Match {
  id: number
  team1_id: number
  team2_id: number
  winner: number | null
  /** Series score (maps won). For BO1 this is 0 or 1. */
  team1_score: number
  team2_score: number
  /** Round score from the first map (joined from map_stats). Available on list endpoint. */
  team1_mapscore: number | null
  team2_mapscore: number | null
  team1_string: string
  team2_string: string
  cancelled: boolean
  forfeit: boolean
  start_time: string
  end_time: string | null
  title: string
  max_maps: number
  season_id: number | null
  is_pug: boolean
}

export interface MapStat {
  id: number
  match_id: number
  winner: number | null
  map_number: number
  map_name: string
  team1_score: number
  team2_score: number
  start_time: string
  end_time: string | null
}

export interface Server {
  id: number
  ip_string: string
  port: number
  gotv_port: number
  display_name: string
  flag: string
  public_server: boolean
  in_use: boolean
}

export interface Team {
  id: number
  name: string
  tag: string
  flag: string
  logo: string | null
}

export interface Season {
  id: number
  name: string
  start_date: string
  end_date: string | null
}
