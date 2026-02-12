import "next-auth"
import "next-auth/jwt"
import type { SteamProfile } from "./steam"

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      steam?: SteamProfile
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    steam?: SteamProfile
  }
}
