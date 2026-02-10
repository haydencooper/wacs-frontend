"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Crosshair,
  Trophy,
  Swords,
  GitCompare,
  Calendar,
  Menu,
  Shield,
  LogOut,
  User,
  LogIn,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { PlayerSearch } from "@/components/player-search"

const navItems = [
  { href: "/", label: "Dashboard", icon: Crosshair },
  { href: "/matches", label: "Matches", icon: Swords },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/seasons", label: "Seasons", icon: Calendar },
  { href: "/compare", label: "Compare", icon: GitCompare },
]

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handler()
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [ref, handler])
}

function NavMenu({ showAdmin }: { showAdmin: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))

  const allItems = [
    ...navItems,
    ...(showAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
          open
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
        aria-label="Navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">Navigate</p>
          </div>
          <div className="py-1">
            {allItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function UserMenu() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))

  if (status === "loading") {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-secondary" />
  }

  if (!session?.user) {
    return (
      <button
        onClick={() => signIn("steam")}
        className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <LogIn className="h-3.5 w-3.5" />
        <span>Sign in</span>
      </button>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const steam = (session.user as any).steam as
    | { steamid?: string; personaname?: string; avatarmedium?: string }
    | undefined

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-9 items-center gap-2 rounded-md px-1.5 transition-colors",
          open
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
        aria-label="User menu"
      >
        {steam?.avatarmedium ? (
          <img
            src={steam.avatarmedium}
            alt={steam.personaname ?? "Avatar"}
            className="h-7 w-7 rounded-full"
          />
        ) : (
          <User className="h-5 w-5" />
        )}
        <span className="hidden text-sm font-medium sm:inline max-w-32 truncate">
          {steam?.personaname ?? "Player"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {steam?.steamid && (
            <>
              <div className="px-3 py-2.5">
                <p className="truncate text-sm font-medium text-foreground">
                  {steam.personaname ?? "Player"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {steam.steamid}
                </p>
              </div>
              <div className="border-t border-border" />
              <div className="py-1">
                <Link
                  href={`/player/${steam.steamid}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <User className="h-4 w-4" />
                  View Profile
                </Link>
              </div>
              <div className="border-t border-border" />
            </>
          )}
          <div className="py-1">
            <button
              onClick={() => {
                setOpen(false)
                signOut()
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function SiteHeader() {
  const { data: session } = useSession()
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    if (!session?.user) {
      setShowAdmin(false)
      return
    }
    fetch("/api/admin/check")
      .then((res) => res.json())
      .then((data) => setShowAdmin(data.isAdmin === true))
      .catch(() => setShowAdmin(false))
  }, [session])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Crosshair className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
            WACS
          </span>
        </Link>

        {/* Center: Search (hidden on small) */}
        <div className="hidden flex-1 justify-center px-4 sm:flex">
          <PlayerSearch />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="sm:hidden">
            <PlayerSearch />
          </div>
          <ThemeToggle />
          <UserMenu />
          <NavMenu showAdmin={showAdmin} />
        </div>
      </div>
    </header>
  )
}
