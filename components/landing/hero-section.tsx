import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="flex flex-col items-center gap-8 px-6 py-24 text-center md:py-32 lg:py-40">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-secondary-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Trusted by 500+ students and tutors
      </div>

      <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground text-balance sm:text-5xl md:text-6xl">
        Your Path to Academic Excellence
      </h1>

      <p className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
        ScholarMe connects learners with expert tutors. Book sessions, access curated resources, and track your progress -- all in one place.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="gap-2 px-8">
          <Link href="/auth/sign-up">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="px-8">
          <Link href="/auth/login">Sign In</Link>
        </Button>
      </div>
    </section>
  )
}
