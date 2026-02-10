"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { LogIn, LogOut, User } from "lucide-react"
import Link from "next/link"

export function SteamAuthButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="h-8 w-8 animate-pulse rounded-md bg-secondary" />
    )
  }

  if (session?.user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const steam = (session.user as any).steam as
      | { steamid?: string; personaname?: string; avatarmedium?: string }
      | undefined

    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        {steam?.steamid && (
          <Link
            href={`/player/${steam.steamid}`}
            className="flex items-center gap-1.5 rounded-md px-1.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:gap-2 sm:px-2"
          >
            {steam.avatarmedium ? (
              <img
                src={steam.avatarmedium}
                alt={steam.personaname ?? "Avatar"}
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
            <span className="hidden xl:inline max-w-28 truncate">{steam.personaname ?? "Player"}</span>
          </Link>
        )}
        <button
          onClick={() => signOut()}
          className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:px-2.5"
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Sign out</span>
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn("steam")}
      className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <LogIn className="h-3.5 w-3.5" />
      <span>Sign in</span>
    </button>
  )
}
