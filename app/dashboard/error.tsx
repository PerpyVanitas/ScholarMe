"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // If the stale SSR chunk crashes, redirect to the real dashboard page
    router.replace("/dashboard/home")
  }, [router])

  return null
}
