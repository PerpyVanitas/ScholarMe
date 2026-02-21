import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Users, Calendar } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">ScholarMe</span>
        </div>
        <Button asChild>
          <Link href="/auth/login">Sign In</Link>
        </Button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-12 px-6 py-16">
        <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground text-balance sm:text-5xl">
            Your path to academic success starts here
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground text-pretty">
            ScholarMe connects struggling students with dedicated tutors. Book sessions, access resources, and track your learning journey.
          </p>
          <Button asChild size="lg" className="mt-4">
            <Link href="/auth/login">Get Started</Link>
          </Button>
        </div>

        <div className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<Users className="h-5 w-5 text-primary" />}
            title="Expert Tutors"
            description="Browse tutor profiles, view specializations, and find the perfect match for your needs."
          />
          <FeatureCard
            icon={<Calendar className="h-5 w-5 text-primary" />}
            title="Easy Scheduling"
            description="Book sessions based on tutor availability. Manage your schedule with ease."
          />
          <FeatureCard
            icon={<BookOpen className="h-5 w-5 text-primary" />}
            title="Resource Library"
            description="Access study materials, guides, and resources shared by tutors."
          />
        </div>
      </main>

      <footer className="border-t border-border/60 px-6 py-6 text-center text-sm text-muted-foreground">
        ScholarMe - Empowering academic excellence
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <h3 className="font-semibold text-card-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
