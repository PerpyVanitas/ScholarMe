import { createClient } from "@/lib/supabase/create-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { StatsSection } from "@/components/landing/stats-section"
import { RolesSection } from "@/components/landing/roles-section"
import { CTASection } from "@/components/landing/cta-section"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image";

export default async function HomePage() {
  let isLoggedIn = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {
    // If auth check fails, show the landing page as logged out
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
          <Link href={isLoggedIn ? "/dashboard" : "/auth/login"}>
            {isLoggedIn ? "Dashboard" : "Sign In"}
          </Link>
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col">
        <HeroSection />
        
        {/* Community Gallery Section */}
        <section className="py-20 px-6 sm:px-8 bg-muted/40">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                Our Community in Action
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Real students. Real achievements. Real friendships. See the ScholarMe difference.
              </p>
            </div>

            {/* Masonry Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[300px]">
              <div className="relative group overflow-hidden rounded-xl bg-muted col-span-2 row-span-1 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/475194059_1086604756594795_793853421411451570_n-AZme6bacaABEhTFvYDoIjoOEOPxzOf.jpg"
                  alt="Collaborative Learning Session"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white font-semibold text-lg">Collaborative Learning</p>
                </div>
              </div>

              <div className="relative group overflow-hidden rounded-xl bg-muted col-span-1 row-span-2 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/474966194_1086604766594794_2924190371366556402_n-mYd1rzEIF11ueti67NUpRV750BHtFE.jpg"
                  alt="Achievement Celebration"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white font-semibold text-lg">Celebrating Success</p>
                </div>
              </div>

              <div className="relative group overflow-hidden rounded-xl bg-muted col-span-1 row-span-1 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/475704423_1090339316221339_7132123293738001513_n-BFujLtZylDMNsmvykPecgQPcD7tPls.jpg"
                  alt="Awards Ceremony"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white font-semibold text-lg">Recognition & Awards</p>
                </div>
              </div>

              <div className="relative group overflow-hidden rounded-xl bg-muted col-span-1 row-span-1 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/641699815_1390651206190147_3711048706711808050_n-gzF9By3pn77bIJZNUWNruqgpiFIdt2.jpg"
                  alt="Game Night Events"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white font-semibold text-lg">Community Fun</p>
                </div>
              </div>

              <div className="relative group overflow-hidden rounded-xl bg-muted col-span-2 row-span-1 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/481080709_1106087701313167_2684223903692983762_n-FChO431uiIzUga9C6B29Jlul19PzpI.jpg"
                  alt="PMA Graduation"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white font-semibold text-lg">Grand Achievements</p>
                </div>
              </div>
            </div>
          </div>
        </section>

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
