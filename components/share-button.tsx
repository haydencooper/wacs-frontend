"use client"

import { useState } from "react"
import { Share2, Check, Link as LinkIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function ShareButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = window.location.href

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ url })
        return
      } catch {
        // User cancelled or not supported, fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore clipboard errors
    }
  }

  return (
    <button
      onClick={handleShare}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-muted-foreground/30 hover:text-foreground",
        copied && "border-win/30 text-win hover:border-win/30 hover:text-win",
        className
      )}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Link copied
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Share
        </>
      )}
    </button>
  )
}
