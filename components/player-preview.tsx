"use client"

import { cn } from "@/lib/utils"

/**
 * Displays a player/team name. Simple inline text for now.
 * In the admin panel this provides consistent styling for team names.
 */
export function PlayerPreview({
  name,
  inline = false,
  className,
}: {
  name: string
  inline?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "font-medium text-foreground",
        inline && "inline",
        className
      )}
    >
      {name}
    </span>
  )
}
