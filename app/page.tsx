import { createClient } from "@/lib/supabase/create-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, Star, Users, Zap, CheckCircle2, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";

const TUTOR_IMAGES = [
  {
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/475194059_1086604756594795_793853421411451570_n-AZme6bacaABEhTFvYDoIjoOEOPxzOf.jpg",
    alt: "Collaborative Learning Session",
    caption: "Real students, real results",
  },
  {
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/624842741_1371641018091166_602435888905857230_n-zmxJHx1nC7bk50pE1cVCtAcRUpzAeC.jpg",
    alt: "Honor Society Achievement",
    caption: "Excellence recognized",
  },
  {
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/474966194_1086604766594794_2924190371366556402_n-mYd1rzEIF11ueti67NUpRV750BHtFE.jpg",
    alt: "Certificate Awards",
    caption: "Celebrating success",
  },
  {
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/475704423_1090339316221339_7132123293738001513_n-BFujLtZylDMNsmvykPecgQPcD7tPls.jpg",
    alt: "Award Ceremony",
    caption: "Community recognition",
  },
  {
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/481080709_1106087701313167_2684223903692983762_n-FChO431uiIzUga9C6B29Jlul19PzpI.jpg",
    alt: "PMA Graduation Celebration",
    caption: "Together we succeed",
  },
];

const STATS = [
  { number: "500+", label: "Active Tutors", icon: Users },
  { number: "2.5K+", label: "Students Learning", icon: GraduationCap },
  { number: "4.9/5", label: "Average Rating", icon: Star },
  { number: "92%", label: "Goal Achievement", icon: TrendingUp },
];

export default async function HomePage() {
  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch {
    // If auth check fails, show the landing page as logged out
  }

  return (
    <div id="top" className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/40 bg-background/95 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <a href="#top" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              ScholarMe
            </span>
          </a>
          <ThemeToggle />
        </div>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            How It Works
          </a>
          <a href="#tutors" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Find Tutors
          </a>
          <a href="#success" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Success Stories
          </a>
        </nav>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href={isLoggedIn ? "/dashboard" : "/auth/login"}>
            {isLoggedIn ? "Dashboard" : "Sign In"}
          </Link>
        </Button>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] overflow-hidden px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center min-h-[600px]">
            {/* Left: Content */}
            <div className="flex flex-col justify-center space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-900/30 px-4 py-2">
                  <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Join 2,500+ successful students
                  </span>
                </div>
                
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                  <span className="text-foreground">Transform Your</span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    Learning
                  </span>
                </h1>
                
                <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                  Connect with expert tutors who are committed to your success. Personalized guidance, proven results, and a community that celebrates your achievements.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-base font-semibold">
                  <Link href="/auth/signup">
                    Start Learning Free
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base font-semibold">
                  <Link href="#how-it-works">
                    Explore Tutors
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-col gap-3 pt-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">No credit card required</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">92% of students achieve their goals</span>
                </div>
              </div>
            </div>

            {/* Right: Featured Image */}
            <div className="relative h-full min-h-[500px] hidden lg:block">
              <div className="relative h-full rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={TUTOR_IMAGES[0].url}
                  alt={TUTOR_IMAGES[0].alt}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-lg font-semibold">{TUTOR_IMAGES[0].caption}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 sm:px-8 bg-white/50 dark:bg-slate-900/50 border-y border-border/40">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-3">
                  <stat.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-foreground">{stat.number}</div>
                <div className="text-sm text-muted-foreground mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">How ScholarMe Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes. Connect with your tutor, set goals, and begin your learning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Create Your Profile", desc: "Tell us your learning goals and preferred subjects" },
              { step: "2", title: "Browse Tutors", desc: "Find verified tutors with 4.9★ average rating" },
              { step: "3", title: "Start Learning", desc: "Schedule sessions and achieve your goals" },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="absolute -left-6 top-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
                  {item.step}
                </div>
                <div className="pl-12 pt-2">
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Gallery */}
      <section id="success" className="py-20 px-6 sm:px-8 bg-white/50 dark:bg-slate-900/50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Real Students, Real Success</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join a thriving community celebrating achievements together
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TUTOR_IMAGES.map((image, idx) => (
              <div
                key={idx}
                className="group relative h-64 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-white font-semibold text-lg">{image.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 px-6 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Why ScholarMe Stands Out</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { icon: Users, title: "Expert Tutors", desc: "Verified educators with proven track records" },
              { icon: TrendingUp, title: "Guaranteed Progress", desc: "92% of students achieve their learning goals" },
              { icon: Star, title: "Personalized Approach", desc: "Custom learning plans tailored to your pace" },
              { icon: GraduationCap, title: "Real Community", desc: "Learn alongside peers and celebrate wins" },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 p-6 rounded-xl border border-border/40 hover:border-blue-400/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all">
                <div className="flex-shrink-0">
                  <item.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 sm:px-8 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto">
            Join thousands of students already achieving their educational goals with ScholarMe.
          </p>
          <Button asChild size="lg" variant="secondary" className="h-12 px-10 text-base font-semibold">
            <Link href="/auth/signup">
              Get Started Free
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30 px-6 py-12 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Find Tutors</Link></li>
                <li><Link href="#" className="hover:text-foreground">How It Works</Link></li>
                <li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Learn</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground">Resources</Link></li>
                <li><Link href="#" className="hover:text-foreground">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/40 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 sm:mb-0">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <span className="font-bold">ScholarMe</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 ScholarMe. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
