import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="flex flex-col items-center gap-6 px-6 py-24 text-center">
      <h2 className="max-w-xl text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
        Ready to start your learning journey?
      </h2>
      <p className="max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
        Join ScholarMe today and connect with expert tutors who can help you reach your academic goals.
      </p>
      <Button asChild size="lg" className="mt-2 gap-2 px-8">
        <Link href="/auth/sign-up">
          Get Started Now
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </section>
  )
}
