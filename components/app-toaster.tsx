"use client"

import { Toaster } from "sonner"

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        className:
          "!bg-card !text-foreground !border-border !shadow-lg",
        descriptionClassName: "!text-muted-foreground",
      }}
      richColors
      closeButton
    />
  )
}
