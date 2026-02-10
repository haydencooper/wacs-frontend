/** CS2 map display names and accent colors for visual distinction */

export const MAP_DISPLAY: Record<string, string> = {
  de_inferno: "Inferno",
  de_mirage: "Mirage",
  de_anubis: "Anubis",
  de_dust2: "Dust II",
  de_nuke: "Nuke",
  de_overpass: "Overpass",
  de_vertigo: "Vertigo",
  de_ancient: "Ancient",
  de_train: "Train",
  de_cache: "Cache",
  de_cobblestone: "Cobblestone",
  de_tuscan: "Tuscan",
  de_mills: "Mills",
}

/**
 * Each map gets a distinct accent color (oklch) and a short 2-letter code
 * used in map thumbnail badges.
 */
export const MAP_META: Record<string, { color: string; code: string }> = {
  de_inferno:    { color: "oklch(0.65 0.18 40)",  code: "IF" },  // warm orange
  de_mirage:     { color: "oklch(0.65 0.15 70)",  code: "MR" },  // sandy gold
  de_anubis:     { color: "oklch(0.60 0.15 280)", code: "AN" },  // deep blue
  de_dust2:      { color: "oklch(0.70 0.12 80)",  code: "D2" },  // desert tan
  de_nuke:       { color: "oklch(0.60 0.16 155)", code: "NK" },  // industrial green
  de_overpass:   { color: "oklch(0.60 0.14 200)", code: "OV" },  // teal
  de_vertigo:    { color: "oklch(0.60 0.14 240)", code: "VT" },  // sky blue
  de_ancient:    { color: "oklch(0.55 0.13 160)", code: "AC" },  // forest green
  de_train:      { color: "oklch(0.58 0.12 25)",  code: "TR" },  // rust red
  de_cache:      { color: "oklch(0.55 0.10 100)", code: "CA" },  // olive
  de_cobblestone:{ color: "oklch(0.50 0.08 50)",  code: "CB" },  // stone brown
  de_tuscan:     { color: "oklch(0.62 0.14 55)",  code: "TU" },  // terracotta
  de_mills:      { color: "oklch(0.58 0.10 120)", code: "ML" },  // sage
}

/** Get display name for a map, handling unknown maps gracefully */
export function getMapDisplayName(mapName: string | null | undefined): string | null {
  if (!mapName) return null
  return (
    MAP_DISPLAY[mapName] ??
    (mapName.startsWith("de_")
      ? mapName.replace("de_", "").replace(/^\w/, (c) => c.toUpperCase())
      : null)
  )
}

/** Get the meta info (color + code) for a map, with a fallback */
export function getMapMeta(mapName: string | null | undefined): { color: string; code: string } {
  if (!mapName) return { color: "oklch(0.55 0 0)", code: "??" }
  return MAP_META[mapName] ?? { color: "oklch(0.55 0 0)", code: mapName.replace("de_", "").slice(0, 2).toUpperCase() }
}
