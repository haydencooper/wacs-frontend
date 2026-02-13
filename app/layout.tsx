import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "@/components/session-provider"
import { ScrollToTop } from "@/components/scroll-to-top"
import { AppToaster } from "@/components/app-toaster"
import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help"
import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

export const metadata: Metadata = {
  title: {
    default: "WACS - CS2 PUG System",
    template: "%s | WACS",
  },
  description:
    "Player leaderboards, match history, and stats for the WACS competitive Counter-Strike PUG community.",
  openGraph: {
    title: "WACS - CS2 PUG System",
    description:
      "Player leaderboards, match history, and stats for the WACS competitive Counter-Strike PUG community.",
    siteName: "WACS",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "WACS - CS2 PUG System",
    description:
      "Player leaderboards, match history, and stats for the WACS competitive Counter-Strike PUG community.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(getAuthOptions())
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("wacs-theme");var d=t==="system"||!t?window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light":t;document.documentElement.classList.remove("light","dark");document.documentElement.classList.add(d)}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <SessionProvider session={session}>
          <ThemeProvider>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
            <ScrollToTop />
            <AppToaster />
            <KeyboardShortcutsHelp />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
