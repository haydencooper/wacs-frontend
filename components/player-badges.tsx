import type { PlayerStat } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Trophy,
  Crown,
  Flame,
  Zap,
  Target,
  Crosshair,
  Shield,
  Skull,
  Star,
  Swords,
  Medal,
  Sparkles,
} from "lucide-react"

export interface Badge {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  tier: "bronze" | "silver" | "gold" | "diamond"
}

const tierOrder = { diamond: 0, gold: 1, silver: 2, bronze: 3 }

function computeBadges(player: PlayerStat, rank: number): Badge[] {
  const badges: Badge[] = []
  const kd = player.deaths > 0 ? player.kills / player.deaths : 0
  const winPct = player.total_maps > 0 ? (player.wins / player.total_maps) * 100 : 0
  const totalClutches = player.v1 + player.v2 + player.v3 + player.v4 + player.v5
  const totalMultiKills = player.k3 + player.k4 + player.k5

  // ── Rank-based badges ──
  if (rank === 1) {
    badges.push({
      id: "rank-1",
      label: "Champion",
      description: "Rank #1 on the leaderboard",
      icon: Crown,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10 border-amber-400/20",
      tier: "diamond",
    })
  } else if (rank === 2) {
    badges.push({
      id: "rank-2",
      label: "Runner-Up",
      description: "Rank #2 on the leaderboard",
      icon: Medal,
      color: "text-slate-300",
      bgColor: "bg-slate-300/10 border-slate-300/20",
      tier: "gold",
    })
  } else if (rank === 3) {
    badges.push({
      id: "rank-3",
      label: "Third Place",
      description: "Rank #3 on the leaderboard",
      icon: Medal,
      color: "text-amber-600",
      bgColor: "bg-amber-600/10 border-amber-600/20",
      tier: "gold",
    })
  }

  // ── K/D badges ──
  if (kd >= 2.0) {
    badges.push({
      id: "kd-diamond",
      label: "Lethal Force",
      description: `K/D ratio of ${kd.toFixed(2)} — truly elite`,
      icon: Crosshair,
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10 border-cyan-400/20",
      tier: "diamond",
    })
  } else if (kd >= 1.5) {
    badges.push({
      id: "kd-gold",
      label: "Sharpshooter",
      description: `K/D ratio of ${kd.toFixed(2)}`,
      icon: Crosshair,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10 border-amber-400/20",
      tier: "gold",
    })
  } else if (kd >= 1.2) {
    badges.push({
      id: "kd-silver",
      label: "Marksman",
      description: `K/D ratio of ${kd.toFixed(2)}`,
      icon: Crosshair,
      color: "text-slate-300",
      bgColor: "bg-slate-300/10 border-slate-300/20",
      tier: "silver",
    })
  }

  // ── Win rate badges ──
  if (winPct >= 70 && player.total_maps >= 10) {
    badges.push({
      id: "wr-diamond",
      label: "Unstoppable",
      description: `${winPct.toFixed(1)}% win rate across ${player.total_maps} maps`,
      icon: Trophy,
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10 border-cyan-400/20",
      tier: "diamond",
    })
  } else if (winPct >= 60 && player.total_maps >= 5) {
    badges.push({
      id: "wr-gold",
      label: "Dominant",
      description: `${winPct.toFixed(1)}% win rate`,
      icon: Trophy,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10 border-amber-400/20",
      tier: "gold",
    })
  } else if (winPct >= 55 && player.total_maps >= 5) {
    badges.push({
      id: "wr-silver",
      label: "Consistent",
      description: `${winPct.toFixed(1)}% win rate`,
      icon: Trophy,
      color: "text-slate-300",
      bgColor: "bg-slate-300/10 border-slate-300/20",
      tier: "silver",
    })
  }

  // ── Rating badge ──
  if (player.average_rating >= 1.3) {
    badges.push({
      id: "rating-diamond",
      label: "Superstar",
      description: `Average rating of ${player.average_rating.toFixed(2)}`,
      icon: Star,
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10 border-cyan-400/20",
      tier: "diamond",
    })
  } else if (player.average_rating >= 1.15) {
    badges.push({
      id: "rating-gold",
      label: "Impact Player",
      description: `Average rating of ${player.average_rating.toFixed(2)}`,
      icon: Star,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10 border-amber-400/20",
      tier: "gold",
    })
  } else if (player.average_rating >= 1.05) {
    badges.push({
      id: "rating-silver",
      label: "Above Average",
      description: `Average rating of ${player.average_rating.toFixed(2)}`,
      icon: Star,
      color: "text-slate-300",
      bgColor: "bg-slate-300/10 border-slate-300/20",
      tier: "silver",
    })
  }

  // ── Headshot badges ──
  if (player.hsp >= 60) {
    badges.push({
      id: "hs-gold",
      label: "Headhunter",
      description: `${player.hsp.toFixed(1)}% headshot percentage`,
      icon: Target,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10 border-amber-400/20",
      tier: "gold",
    })
  } else if (player.hsp >= 50) {
    badges.push({
      id: "hs-silver",
      label: "Precise",
      description: `${player.hsp.toFixed(1)}% headshot percentage`,
      icon: Target,
      color: "text-slate-300",
      bgColor: "bg-slate-300/10 border-slate-300/20",
      tier: "silver",
    })
  }

  // ── Clutch badges ──
  if (player.v5 >= 1) {
    badges.push({
      id: "clutch-v5",
      label: "The Impossible",
      description: `Won ${player.v5} 1v5 clutch${player.v5 > 1 ? "es" : ""}`,
      icon: Sparkles,
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10 border-cyan-400/20",
      tier: "diamond",
    })
  }
  if (player.v4 >= 2) {
    badges.push({
      id: "clutch-v4",
      label: "Clutch Master",
      description: `Won ${player.v4} 1v4 clutches`,
      icon: Flame,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10 border-amber-400/20",
      tier: "gold",
    })
  }
  if (totalClutches >= 20) {
    badges.push({
      id: "clutch-total",
      label: "Ice Cold",
      description: `${totalClutches} total clutch rounds won`,
      icon: Shield,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10 border-amber-400/20",
      tier: "gold",
    })
  } else if (totalClutches >= 10) {
    badges.push({
      id: "clutch-total-silver",
      label: "Cool Under Pressure",
      description: `${totalClutches} total clutch rounds won`,
      icon: Shield,
      color: "text-slate-300",
      bgColor: "bg-slate-300/10 border-slate-300/20",
      tier: "silver",
    })
  }

  // ── Multi-kill badges ──
  if (player.k5 >= 3) {
    badges.push({
      id: "ace-master",
      label: "Ace Machine",
      description: `${player.k5} aces`,
      icon: Zap,
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10 border-cyan-400/20",
      tier: "diamond",
    })
  } else if (player.k5 >= 1) {
    badges.push({
      id: "ace",
      label: "Ace",
      description: `Achieved ${player.k5} ace${player.k5 > 1 ? "s" : ""}`,
      icon: Zap,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10 border-amber-400/20",
      tier: "gold",
    })
  }
  if (totalMultiKills >= 30) {
    badges.push({
      id: "multi-gold",
      label: "One-Man Army",
      description: `${totalMultiKills} multi-kill rounds (3K+)`,
      icon: Swords,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10 border-amber-400/20",
      tier: "gold",
    })
  } else if (totalMultiKills >= 10) {
    badges.push({
      id: "multi-silver",
      label: "Fragger",
      description: `${totalMultiKills} multi-kill rounds (3K+)`,
      icon: Swords,
      color: "text-slate-300",
      bgColor: "bg-slate-300/10 border-slate-300/20",
      tier: "silver",
    })
  }

  // ── Kill milestone badges ──
  if (player.kills >= 5000) {
    badges.push({
      id: "kills-5k",
      label: "5K Club",
      description: `${player.kills.toLocaleString()} total kills`,
      icon: Skull,
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10 border-cyan-400/20",
      tier: "diamond",
    })
  } else if (player.kills >= 2000) {
    badges.push({
      id: "kills-2k",
      label: "Veteran",
      description: `${player.kills.toLocaleString()} total kills`,
      icon: Skull,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10 border-amber-400/20",
      tier: "gold",
    })
  } else if (player.kills >= 500) {
    badges.push({
      id: "kills-500",
      label: "Battle-Tested",
      description: `${player.kills.toLocaleString()} total kills`,
      icon: Skull,
      color: "text-slate-300",
      bgColor: "bg-slate-300/10 border-slate-300/20",
      tier: "silver",
    })
  } else if (player.kills >= 100) {
    badges.push({
      id: "kills-100",
      label: "Rookie",
      description: `${player.kills.toLocaleString()} total kills`,
      icon: Skull,
      color: "text-amber-700",
      bgColor: "bg-amber-700/10 border-amber-700/20",
      tier: "bronze",
    })
  }

  // ── Match milestone badges ──
  if (player.total_maps >= 100) {
    badges.push({
      id: "maps-100",
      label: "Centurion",
      description: `${player.total_maps} maps played`,
      icon: Flame,
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10 border-cyan-400/20",
      tier: "diamond",
    })
  } else if (player.total_maps >= 50) {
    badges.push({
      id: "maps-50",
      label: "Dedicated",
      description: `${player.total_maps} maps played`,
      icon: Flame,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10 border-amber-400/20",
      tier: "gold",
    })
  } else if (player.total_maps >= 20) {
    badges.push({
      id: "maps-20",
      label: "Regular",
      description: `${player.total_maps} maps played`,
      icon: Flame,
      color: "text-slate-300",
      bgColor: "bg-slate-300/10 border-slate-300/20",
      tier: "silver",
    })
  }

  // Sort by tier (diamond first, then gold, silver, bronze)
  badges.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier])

  return badges
}

function TierLabel({ tier }: { tier: Badge["tier"] }) {
  const styles = {
    diamond: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
    gold: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    silver: "bg-slate-300/10 text-slate-300 border-slate-300/20",
    bronze: "bg-amber-700/10 text-amber-700 border-amber-700/20",
  }

  return (
    <span
      className={cn(
        "rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
        styles[tier]
      )}
    >
      {tier}
    </span>
  )
}

export function PlayerBadges({
  player,
  rank,
}: {
  player: PlayerStat
  rank: number
}) {
  const badges = computeBadges(player, rank)

  if (badges.length === 0) {
    return (
      <section className="animate-fade-in-up stagger-1">
        <h2 className="mb-4 font-heading text-lg font-medium text-foreground">
          Achievements
        </h2>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Star className="mx-auto h-8 w-8 text-muted-foreground/30" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            No achievements yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Play more matches to unlock badges
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="animate-fade-in-up stagger-1">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-medium text-foreground">
          Achievements
        </h2>
        <span className="text-xs font-medium text-muted-foreground">
          {badges.length} badge{badges.length !== 1 ? "s" : ""} earned
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={cn(
              "group flex items-start gap-3 rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-sm",
              badge.bgColor
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                badge.bgColor
              )}
            >
              <badge.icon className={cn("h-5 w-5", badge.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {badge.label}
                </span>
                <TierLabel tier={badge.tier} />
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {badge.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
