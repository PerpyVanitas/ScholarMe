"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return <Button disabled>Loading...</Button>
  }

  return (
    <Button asChild>
      <Link href={isLoggedIn ? "/dashboard" : "/auth/login"}>
        {isLoggedIn ? "Dashboard" : "Sign In"}
      </Link>
    </Button>
  )
}
