import { Users, Calendar, BookOpen, Star, Shield, BarChart3 } from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Expert Tutors",
    description:
      "Browse verified tutor profiles, view specializations and ratings, and find the perfect match for your learning goals.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Book sessions based on real-time tutor availability. Manage upcoming and past sessions with ease.",
  },
  {
    icon: BookOpen,
    title: "Resource Library",
    description:
      "Access curated study materials, guides, and practice sets shared by tutors in organized repositories.",
  },
  {
    icon: Star,
    title: "Session Ratings",
    description:
      "Rate completed sessions and read reviews from other students to make informed tutor choices.",
  },
  {
    icon: Shield,
    title: "Dual Authentication",
    description:
      "Secure access with email and password or institution-issued Card ID and PIN for quick, safe login.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description:
      "Monitor your session history, track hours studied, and visualize your academic growth over time.",
  },
]

export function FeaturesSection() {
  return (
    <section className="flex flex-col items-center gap-12 px-6 py-24">
      <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
          Everything you need to succeed
        </h2>
        <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
          A complete platform designed around the needs of students, tutors, and administrators.
        </p>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30 hover:bg-card/80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
              <feature.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-card-foreground">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
