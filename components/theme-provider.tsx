"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark")
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark")

  const applyTheme = useCallback((t: Theme) => {
    const resolved = t === "system" ? getSystemTheme() : t
    setResolvedTheme(resolved)
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(resolved)
  }, [])

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t)
      localStorage.setItem("wacs-theme", t)
      applyTheme(t)
    },
    [applyTheme]
  )

  useEffect(() => {
    const stored = localStorage.getItem("wacs-theme") as Theme | null
    const initial = stored || "dark"
    setThemeState(initial)
    applyTheme(initial)

    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const current = localStorage.getItem("wacs-theme") as Theme | null
      if (current === "system") {
        applyTheme("system")
      }
    }
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [applyTheme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
