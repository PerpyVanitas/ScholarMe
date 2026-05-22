"use client"

import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from "react-error-boundary"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-destructive/10 text-destructive">
      <AlertTriangle className="h-8 w-8 mb-2" />
      <h3 className="font-semibold text-lg">Something went wrong</h3>
      <p className="text-sm opacity-80 mb-4">{errorMessage || "Failed to load this section."}</p>
      <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Retry
      </Button>
    </div>
  )
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary FallbackComponent={Fallback}>
      {children}
    </ReactErrorBoundary>
  )
}
