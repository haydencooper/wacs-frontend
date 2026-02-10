import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card/50 py-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-sm text-muted-foreground lg:flex-row lg:justify-between lg:w-full">
          <span className="font-heading font-medium">WACS - Western Australian PUG System</span>
          <nav className="flex items-center gap-6">
            <Link href="/" className="transition-colors hover:text-primary">Dashboard</Link>
            <Link href="/matches" className="transition-colors hover:text-primary">Matches</Link>
            <Link href="/leaderboard" className="transition-colors hover:text-primary">Leaderboard</Link>
            <Link href="/compare" className="transition-colors hover:text-primary">Compare</Link>
          </nav>
          <span>
            Powered by{" "}
            <a
              href="https://github.com/PhlexPlexico/G5API"
              className="font-medium text-primary transition-colors hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
            >
              G5API
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
