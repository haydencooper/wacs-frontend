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
  X,
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

function UserMenu() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))

  if (status === "loading") {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
  }

  if (!session?.user) {
    return (
      <button
        onClick={() => signIn("steam")}
        className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <LogIn className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Sign in</span>
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
          "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
          open
            ? "ring-2 ring-primary"
            : "hover:ring-2 hover:ring-border"
        )}
        aria-label="User menu"
      >
        {steam?.avatarmedium ? (
          <img
            src={steam.avatarmedium}
            alt={steam.personaname ?? "Avatar"}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
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
              <div className="border-t border-border py-1">
                <Link
                  href={`/player/${steam.steamid}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <User className="h-4 w-4" />
                  View Profile
                </Link>
              </div>
            </>
          )}
          <div className="border-t border-border py-1">
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
  const pathname = usePathname()
  const { data: session } = useSession()
  const [showAdmin, setShowAdmin] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileRef = useRef<HTMLDivElement>(null)
  useClickOutside(mobileRef, () => setMobileOpen(false))

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const allNavItems = [
    ...navItems,
    ...(showAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 lg:px-8">
        {/* Left: Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Crosshair className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
            WACS
          </span>
        </Link>

        {/* Center: Desktop nav links */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {allNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
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
        </nav>

        {/* Right: Search + User + Theme + Mobile toggle */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <PlayerSearch />
          </div>
          <ThemeToggle />
          <UserMenu />
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <div ref={mobileRef} className="border-t border-border bg-background px-4 py-3 lg:hidden">
          <div className="mb-3 sm:hidden">
            <PlayerSearch />
          </div>
          <nav className="flex flex-col gap-0.5">
            {allNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
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
          </nav>
        </div>
      )}
    </header>
  )
}
