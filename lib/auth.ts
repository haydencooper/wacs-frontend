import type { AuthOptions } from "next-auth"
import Steam, { STEAM_PROVIDER_ID } from "next-auth-steam"
import type { NextRequest } from "next/server"

export function getAuthOptions(req?: NextRequest): AuthOptions {
  // Build a request-like object that always uses NEXTAUTH_URL as the origin
  // so that Steam's OpenID callback uses http:// in development instead of
  // inheriting https:// from a reverse proxy / preview environment.
  let effectiveReq = req
  if (req && process.env.NEXTAUTH_URL) {
    try {
      const baseUrl = new URL(process.env.NEXTAUTH_URL)
      const originalUrl = new URL(req.url)
      // Replace the origin with NEXTAUTH_URL but keep the path/query
      const correctedUrl = new URL(
        originalUrl.pathname + originalUrl.search,
        baseUrl.origin
      )
      effectiveReq = new Request(correctedUrl.toString(), {
        method: req.method,
        headers: req.headers,
      }) as unknown as NextRequest
    } catch {
      // If URL parsing fails, fall through to the original request
      effectiveReq = req
    }
  }

  return {
    secret: process.env.NEXTAUTH_SECRET,
    providers: effectiveReq
      ? [
          Steam(effectiveReq, {
            clientSecret: process.env.STEAM_SECRET!,
          }),
        ]
      : [],
    callbacks: {
      jwt({ token, account, profile }) {
        if (account?.provider === STEAM_PROVIDER_ID) {
          token.steam = profile
        }
        return token
      },
      session({ session, token }) {
        if ("steam" in token) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(session.user as any).steam = token.steam
        }
        return session
      },
    },
  }
}
