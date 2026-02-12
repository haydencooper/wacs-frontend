/** Default items per page for public-facing paginated lists */
export const PAGE_SIZE = 12

/** Items per page for admin tables (denser layout) */
export const ADMIN_PAGE_SIZE = 15

/** Batch size for parallel G5API requests */
export const API_BATCH_SIZE = 10

/** Bulk map stats batch size (slightly larger, read-only) */
export const BULK_BATCH_SIZE = 15

/** Admin panel live-match polling interval (ms) */
export const ADMIN_POLL_INTERVAL_MS = 20_000

/** Live match detail auto-refresh interval (seconds) */
export const LIVE_REFRESH_INTERVAL_S = 15

/** Player search debounce (ms) */
export const SEARCH_DEBOUNCE_MS = 250

/** Minimum search query length */
export const MIN_SEARCH_LENGTH = 2

/** Max recent matches shown on player profile */
export const MAX_RECENT_MATCHES = 5

/** Dashboard recent matches shown */
export const DASHBOARD_RECENT_MATCHES = 6

/** Revalidation times (seconds) for Next.js fetch cache */
export const REVALIDATE = {
  matches: 30,
  players: 60,
  mapStats: 60,
  seasons: 300,
  servers: 15,
  steamAvatars: 300,
  playerRecentMatches: 120,
} as const
