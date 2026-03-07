"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLoggedOutRef = useRef(false)

  useEffect(() => {
    // Only run on client after mount
    if (typeof window === "undefined") return

    const handleLogout = async () => {
      if (isLoggedOutRef.current) return
      isLoggedOutRef.current = true

      const supabase = createClient()
      await supabase.auth.signOut()
      // Use window.location instead of router to avoid initialization issues
      window.location.href = "/auth/login?reason=inactive"
    }

    const resetTimer = () => {
      if (isLoggedOutRef.current) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT)
    }

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
  }, [])
}
