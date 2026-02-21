import { GraduationCap, BookMarked, Settings } from "lucide-react"

const roles = [
  {
    icon: GraduationCap,
    role: "Learner",
    description:
      "Browse tutors, book sessions, rate your experience, and access a growing library of study resources.",
    features: [
      "Search tutors by subject",
      "Book sessions instantly",
      "Rate and review sessions",
      "Access shared resources",
    ],
  },
  {
    icon: BookMarked,
    role: "Tutor",
    description:
      "Manage your availability, conduct sessions, share resources, and build your reputation through ratings.",
    features: [
      "Set weekly availability",
      "Manage session requests",
      "Upload study materials",
      "Track your ratings",
    ],
  },
  {
    icon: Settings,
    role: "Administrator",
    description:
      "Oversee the entire platform -- manage users, issue authentication cards, and monitor analytics.",
    features: [
      "User management",
      "Issue auth cards",
      "Monitor all sessions",
      "View platform analytics",
    ],
  },
]

export function RolesSection() {
  return (
    <section className="flex flex-col items-center gap-12 px-6 py-24">
      <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
          Built for every role
        </h2>
        <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
          Whether you are a student seeking help, a tutor sharing knowledge, or an admin managing the platform.
        </p>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {roles.map((item) => (
          <div
            key={item.role}
            className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground">{item.role}</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {item.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
