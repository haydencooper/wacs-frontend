const store = new Map<string, { count: number; resetAt: number }>()

/**
 * Simple in-memory rate limiter using a fixed-window counter per IP.
 * Not suitable for multi-instance deployments — use Redis-backed limiter instead.
 */
export function rateLimit(
  ip: string,
  { limit = 30, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  entry.count++
  const remaining = Math.max(0, limit - entry.count)
  return { allowed: entry.count <= limit, remaining }
}
