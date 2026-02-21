const stats = [
  { value: "500+", label: "Active Students" },
  { value: "50+", label: "Expert Tutors" },
  { value: "2,000+", label: "Sessions Completed" },
  { value: "4.8/5", label: "Average Rating" },
]

export function StatsSection() {
  return (
    <section className="border-y border-border bg-secondary/50 px-6 py-16">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-8 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
            <span className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {stat.value}
            </span>
            <span className="text-sm text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
