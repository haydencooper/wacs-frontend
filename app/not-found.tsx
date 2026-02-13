import Link from "next/link"
import { Crosshair, ArrowLeft, Trophy, Swords, BarChart3 } from "lucide-react"

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 py-20">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <Crosshair className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="mt-6 text-6xl font-bold tracking-tight text-foreground">
          404
        </h1>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved. It
          might have been a match that was cancelled or a player who changed
          their name.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Quick navigation */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <span className="text-xs text-muted-foreground">Or go to:</span>
          {[
            { href: "/matches", label: "Matches", icon: Swords },
            { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
            { href: "/stats", label: "Stats", icon: BarChart3 },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <link.icon className="h-3 w-3" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
