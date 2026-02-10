import { cn } from "@/lib/utils"
import type { Server } from "@/lib/types"
import { Server as ServerIcon } from "lucide-react"

interface ServerStatusProps {
  servers: Server[]
}

export function ServerStatus({ servers }: ServerStatusProps) {
  if (servers.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ServerIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">
          No servers configured
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Servers will appear here once added.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {servers.map((server) => (
        <div
          key={server.id}
          className={cn(
            "flex items-center justify-between rounded-lg border bg-card px-4 py-3.5 transition-all duration-200",
            server.in_use
              ? "border-live/30 shadow-sm shadow-live/5"
              : "border-border hover:border-border/80"
          )}
        >
          <div className="flex items-center gap-3">
            <ServerIcon className={cn(
              "h-4 w-4",
              server.in_use ? "text-live" : "text-muted-foreground/40"
            )} />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {server.display_name}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {server.flag}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {server.in_use && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
              )}
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  server.in_use ? "bg-live" : "bg-muted-foreground/40"
                )}
              />
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                server.in_use ? "text-live" : "text-muted-foreground"
              )}
            >
              {server.in_use ? "In Use" : "Available"}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
