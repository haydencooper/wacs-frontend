"use client"

import Link from "next/link"
import Image from "next/image"
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
  BarChart3,
  X,
} from "lucide-react"
import { useState, useEffect, useRef, useCallback } from "react"
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
  { href: "/stats", label: "Stats", icon: BarChart3 },
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

/* -- Mobile Slide-Out Drawer -------------------------------- */
function MobileDrawer({
  items,
  open,
  onClose,
}: {
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[]
  open: boolean
  onClose: () => void
}) {
  const pathname = usePathname()

  // Close on route change
  useEffect(() => {
    onClose()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-border bg-card shadow-xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-label="Navigation menu"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-heading text-sm font-semibold text-foreground">Menu</span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search (visible on mobile) */}
        <div className="border-b border-border px-4 py-3">
          <PlayerSearch />
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
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

        {/* Theme toggle at bottom */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  )
}

/* -- Desktop Nav Dropdown ----------------------------------- */
function NavMenu({ items }: { items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(ref, close)

  // close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <div ref={ref} className="relative hidden md:block">
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
        <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <nav className="py-1">
            {items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
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
          </nav>
        </div>
      )}
    </div>
  )
}

/* -- User Menu ---------------------------------------------- */
function UserMenu() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(ref, close)

  if (status === "loading") {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
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
          "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
          open ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-border"
        )}
        aria-label="User menu"
      >
        {steam?.avatarmedium ? (
          <Image
            src={steam.avatarmedium}
            alt={steam.personaname ?? "Avatar"}
            width={32}
            height={32}
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
                  onClick={close}
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
                close()
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

/* -- Header ------------------------------------------------- */
export function SiteHeader() {
  const { data: session } = useSession()
  const [showAdmin, setShowAdmin] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

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

  const allNavItems = [
    ...navItems,
    ...(showAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ]

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          {/* Left: Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Crosshair className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
              WACS
            </span>
          </Link>

          {/* Right: Search + Theme + User + Nav */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <PlayerSearch />
            </div>
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            <UserMenu />
            {/* Desktop dropdown nav */}
            <NavMenu items={allNavItems} />
            {/* Mobile hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <MobileDrawer items={allNavItems} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
