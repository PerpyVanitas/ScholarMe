import { createClient } from "@/lib/supabase/create-client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GraduationCap } from "lucide-react"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { StatsSection } from "@/components/landing/stats-section"
import { RolesSection } from "@/components/landing/roles-section"
import { CTASection } from "@/components/landing/cta-section"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function HomePage() {
  let isLoggedIn = false
  try {
    const supabase = await createClient()
    // Add timeout to prevent hanging if database is paused
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Auth check timeout")), 3000)
    )
    const authPromise = supabase.auth.getUser()
    const { data: { user } } = await Promise.race([authPromise, timeoutPromise]) as Awaited<typeof authPromise>
    isLoggedIn = !!user
  } catch {
    // If auth check fails or times out, show the landing page as logged out
  }

  return (
    <div id="top" className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <a href="#top" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              ScholarMe
            </span>
          </a>
          <ThemeToggle />
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#roles" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Roles
          </a>
        </nav>
        <Button asChild>
          <Link href={isLoggedIn ? "/panel" : "/auth/login"}>
            {isLoggedIn ? "Dashboard" : "Sign In"}
          </Link>
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col">
        <HeroSection />
        <StatsSection />
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="roles">
          <RolesSection />
        </div>
        <CTASection />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">ScholarMe</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Empowering academic excellence through personalized tutoring.
          </p>
        </div>
      </footer>
    </div>
  )
}
