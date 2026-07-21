import Link from "next/link";
import { GraduationCap, CheckCircle2 } from "lucide-react";

const FEATURES = [
  "Connect with verified expert tutors",
  "Book and manage sessions with ease",
  "Access shared learning resources",
  "Track your progress over time",
];

export function SignUpBrandingPanel() {
  return (
    <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] flex-col justify-between bg-sidebar p-10 text-sidebar-foreground">
      <Link href="/" className="flex items-center gap-2.5 w-fit">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent">
          <GraduationCap className="h-5 w-5 text-sidebar-accent-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight">ScholarMe</span>
      </Link>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-sidebar-foreground/55">
            Join thousands of learners
          </p>
          <h2 className="text-4xl font-bold leading-tight text-balance">
            Start your learning journey today
          </h2>
          <p className="text-base leading-relaxed text-sidebar-foreground/70">
            ScholarMe connects students with expert tutors for personalized,
            flexible learning — on your schedule.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {FEATURES.map((f) => (
            <li
              key={f}
              className="flex items-center gap-3 text-sm text-sidebar-foreground/80"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-sidebar-foreground/35">
        &copy; {new Date().getFullYear()} ScholarMe. All rights reserved.
      </p>
    </div>
  );
}
