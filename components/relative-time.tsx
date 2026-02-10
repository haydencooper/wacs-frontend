"use client"

import { useState, useEffect } from "react"

function getRelativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then

  if (diff < 0) return "just now"

  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "just now"

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function formatTitle(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export function RelativeTime({
  date,
  className,
}: {
  date: string
  className?: string
}) {
  const [text, setText] = useState(() => getRelativeTime(date))
  const [title, setTitle] = useState<string | undefined>(undefined)

  useEffect(() => {
    setTitle(formatTitle(date))
    const interval = setInterval(() => {
      setText(getRelativeTime(date))
    }, 60_000)
    return () => clearInterval(interval)
  }, [date])

  return (
    <time
      dateTime={date}
      title={title}
      className={className}
    >
      {text}
    </time>
  )
}
