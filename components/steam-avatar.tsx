import Image from "next/image"
import { cn } from "@/lib/utils"

interface SteamAvatarProps {
  avatarUrl?: string | null
  name: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const SIZE_MAP = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
  xl: "h-14 w-14",
}

const PX_MAP = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 56,
}

const TEXT_MAP = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-lg",
}

export function SteamAvatar({
  avatarUrl,
  name,
  size = "md",
  className,
}: SteamAvatarProps) {
  const initial = name.charAt(0).toUpperCase()

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={PX_MAP[size]}
        height={PX_MAP[size]}
        className={cn(
          SIZE_MAP[size],
          "rounded-md object-cover",
          className
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        SIZE_MAP[size],
        "flex items-center justify-center rounded-md bg-secondary font-bold text-muted-foreground",
        TEXT_MAP[size],
        className
      )}
    >
      {initial}
    </div>
  )
}
