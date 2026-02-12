"use client"

import { useState, type ReactNode } from "react"
import { Trophy, Users, Swords } from "lucide-react"

interface CompetitionTabsProps {
  standingsContent: ReactNode
  playerStatsContent: ReactNode
  matchesContent: ReactNode
}

const tabs = [
  { key: "standings", label: "Standings", icon: Trophy },
  { key: "players", label: "Player Stats", icon: Users },
  { key: "matches", label: "Matches", icon: Swords },
] as const

type TabKey = (typeof tabs)[number]["key"]

export function CompetitionTabs({
  standingsContent,
  playerStatsContent,
  matchesContent,
}: CompetitionTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("standings")

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === "standings" && standingsContent}
      {activeTab === "players" && playerStatsContent}
      {activeTab === "matches" && matchesContent}
    </div>
  )
}
