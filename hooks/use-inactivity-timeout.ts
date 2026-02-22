"use client"

import { useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const INACTIVITY_TIMEOUT = 10 * 60 * 1000 // 10 minutes
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "pointerdown",
] as const

export function useInactivityTimeout() {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLoggedOutRef = useRef(false)

  const handleLogout = useCallback(async () => {
    if (isLoggedOutRef.current) return
    isLoggedOutRef.current = true

    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/auth/login?reason=inactive")
  }, [router])

  const resetTimer = useCallback(() => {
    if (isLoggedOutRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT)
  }, [handleLogout])

  useEffect(() => {
    // Only start tracking if user is authenticated
    const supabase = createClient()
    let mounted = true

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted || !user) return

      // Start the inactivity timer
      resetTimer()

      // Reset timer on any user activity
      for (const event of ACTIVITY_EVENTS) {
        window.addEventListener(event, resetTimer, { passive: true })
      }
    })

    return () => {
      mounted = false
      if (timerRef.current) clearTimeout(timerRef.current)
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer)
      }
    }
  }, [resetTimer])
}
