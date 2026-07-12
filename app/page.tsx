"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  Menu,
  X,
  Star,
  BookOpen,
  Clock,
  Users,
  Award,
  ChevronRight,
  Zap,
  Shield,
  BarChart3,
  CheckCircle,
  ArrowRight,
  GraduationCap,
  Target,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { FeedbackButton } from "@/components/feedback-button";
import { HonorSocietyLogo } from "@/components/honsoc-logo";
import { TosLink, PrivacyLink } from "@/components/legal-modals";
import { OrganizationSettings } from "@/lib/types";

const GALLERY_IMAGES = [
  {
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/475194059_1086604756594795_793853421411451570_n-AZme6bacaABEhTFvYDoIjoOEOPxzOf.jpg",
    alt: "Collaborative Learning Session",
    title: "Learning Together",
    tag: "Peer Tutoring",
  },
  {
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/624842741_1371641018091166_602435888905857230_n-zmxJHx1nC7bk50pE1cVCtAcRUpzAeC.jpg",
    alt: "Honor Society Achievement",
    title: "Excellence",
    tag: "Awards",
  },
  {
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/474966194_1086604766594794_2924190371366556402_n-mYd1rzEIF11ueti67NUpRV750BHtFE.jpg",
    alt: "Certificate Awards",
    title: "Recognition",
    tag: "Ceremonies",
  },
];

const STATS = [
  { value: "60+", label: "Elite Peer Tutors", icon: GraduationCap },
  { value: "1,200+", label: "Mentoring Hours", icon: Clock },
  { value: "500+", label: "Students Helped", icon: Users },
  { value: "98%", label: "Satisfaction Rate", icon: Star },
];

const FEATURES = [
  {
    icon: BookOpen,
    title: "Smart Study Matching",
    desc: "Get instantly paired with Honor Society tutors who excel in your exact course subjects.",
    color: "from-amber-500/20 to-yellow-500/10",
    border: "border-amber-500/30",
  },
  {
    icon: Zap,
    title: "Live Session Tracking",
    desc: "Digital QR ID scanning confirms attendance. Every session is logged and verified automatically.",
    color: "from-blue-500/20 to-indigo-500/10",
    border: "border-blue-500/30",
  },
  {
    icon: Shield,
    title: "Verified Tutors Only",
    desc: "Every tutor is a vetted member of the CIT-U Honor Society — scholastic excellence is a prerequisite.",
    color: "from-green-500/20 to-emerald-500/10",
    border: "border-green-500/30",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    desc: "Track your tutoring history, session logs, and academic improvement over time on your dashboard.",
    color: "from-purple-500/20 to-violet-500/10",
    border: "border-purple-500/30",
  },
  {
    icon: Award,
    title: "Gamified Learning",
    desc: "Earn XP, level up, and compete on the scholastic leaderboard as you complete sessions.",
    color: "from-orange-500/20 to-red-500/10",
    border: "border-orange-500/30",
  },
  {
    icon: Target,
    title: "Goal-Oriented Paths",
    desc: "Set academic targets, get personalized tutor recommendations, and track milestones.",
    color: "from-teal-500/20 to-cyan-500/10",
    border: "border-teal-500/30",
  },
];

const TESTIMONIALS = [
  {
    name: "Maria Santos",
    program: "BS Computer Engineering",
    text: "ScholarMe helped me pass Calculus 2. My tutor from HonSoc explained concepts in ways my professors never did.",
    rating: 5,
    avatar: "M",
  },
  {
    name: "Jericho Lim",
    program: "BS Information Technology",
    text: "The session tracking and QR system is so smooth. I can see my learning progress clearly every week.",
    rating: 5,
    avatar: "J",
  },
  {
    name: "Alyssa Cruz",
    program: "BS Electronics Engineering",
    text: "Being a HonSoc tutor has been incredibly rewarding. The platform makes it easy to manage my schedule and students.",
    rating: 5,
    avatar: "A",
  },
];

const STEPS = [
  {
    num: "01",
    icon: Users,
    title: "Create Your Profile",
    desc: "Sign up, set your course priorities, and choose your learning goals. It takes under 2 minutes.",
  },
  {
    num: "02",
    icon: GraduationCap,
    title: "Match With a Tutor",
    desc: "Browse verified Honor Society peer mentors filtered by subject, availability, and specialization.",
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "Excel Academically",
    desc: "Book sessions, log progress via digital ID scan, earn XP, and rise through the leaderboard.",
  },
];

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, start]);
  return count;
}

function AnimatedStat({
  value,
  label,
  icon: Icon,
  animate,
}: {
  value: string;
  label: string;
  icon: React.ElementType;
  animate: boolean;
}) {
  const numericPart = parseInt(value.replace(/[^0-9]/g, ""));
  const suffix = value.replace(/[0-9]/g, "");
  const count = useCountUp(numericPart, 1800, animate);
  const display = isNaN(numericPart) ? value : `${count}${suffix}`;

  return (
    <div className="group text-center p-6 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="text-3xl lg:text-4xl font-black text-primary mb-1 tabular-nums">
        {display}
      </div>
      <p className="text-xs text-muted-foreground font-semibold tracking-wide uppercase">
        {label}
      </p>
    </div>
  );
}

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings | null>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();

    const fetchOrgSettings = async () => {
      const supabase = createClient();
      const { data: settings } = await supabase
        .from("organization_settings")
        .select("*")
        .limit(1)
        .single();
      
      if (settings) {
        setOrgSettings(settings);
      }
    };
    fetchOrgSettings();

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 },
    );
    if (statsRef.current) observer.observe(statsRef.current);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-hidden">
      {orgSettings?.primary_color && (
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --primary: ${orgSettings.primary_color};
          }
        `}} />
      )}
      {/* ── NAV ── */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 bg-zinc-950 dark:bg-zinc-900 border border-primary/40 group-hover:border-primary rounded-xl flex items-center justify-center shadow-md transition-all duration-300 group-hover:shadow-[0_0_12px_hsl(var(--primary)/0.3)]">
              <HonorSocietyLogo variant="gold" className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">
              ScholarMe{" "}
              <span className="text-[10px] text-primary font-bold hidden sm:inline tracking-widest uppercase ml-1 opacity-70">
                HonSoc
              </span>
            </span>
          </Link>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-secondary/40 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Features
            </a>
            <a
              href="#community"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Community
            </a>
            <a
              href="#how"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              How It Works
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <FeedbackButton />
            <ThemeToggle />
            <Link
              href={isLoggedIn ? "/dashboard" : "/auth/login"}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors duration-200 px-4 py-2"
            >
              {isLoggedIn ? "Dashboard" : "Sign in"}
            </Link>
            <Link
              href={isLoggedIn ? "/dashboard" : "/auth/sign-up"}
              className="text-sm font-bold px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all duration-200 shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
            <div className="px-6 py-5 space-y-4 text-sm font-semibold">
              <a
                href="#features"
                className="block text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#community"
                className="block text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Community
              </a>
              <a
                href="#how"
                className="block text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <div className="border-t border-border/20 pt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Feedback</span>
                <FeedbackButton />
              </div>
              <div className="pt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Appearance
                </span>
                <ThemeToggle />
              </div>
              <Link
                href={isLoggedIn ? "/dashboard" : "/auth/sign-up"}
                className="block text-center px-4 py-3 bg-primary text-primary-foreground rounded-xl font-extrabold"
                onClick={() => setMobileMenuOpen(false)}
              >
                {isLoggedIn ? "Go to Dashboard" : "Get Started Free"}
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main>
        {/* ── HERO ── */}
        <section className="relative pt-32 pb-24 px-6 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-primary/10 dark:from-[#FFD700]/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary/5 dark:bg-primary/5 rounded-full blur-2xl" />
            <div className="absolute top-40 right-1/4 w-96 h-96 bg-primary/5 dark:bg-primary/5 rounded-full blur-3xl" />
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            {/* Top badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest animate-fade-in-up">
                <Sparkles className="h-3.5 w-3.5" />
                CIT-U Honor Society Official Platform
              </div>
            </div>

            {/* Headline */}
            <div className="text-center max-w-4xl mx-auto mb-10 space-y-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight animate-fade-in-up">
                <span className="bg-gradient-to-br from-foreground via-foreground to-amber-600/80 dark:to-[#FFD700] bg-clip-text text-transparent">
                  {orgSettings?.hero_title || "Ace Your Courses"}
                </span>
                <br />
                <span className="text-foreground">{orgSettings?.hero_subtitle || "With Elite Peer Tutors"}</span>
              </h1>
              <p
                className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto animate-fade-in-up"
                style={{ animationDelay: "0.05s" }}
              >
                Connect with verified CIT-U Honor Society scholars who&apos;ve
                already mastered your subjects. Free, flexible, and built for
                Technologians.
              </p>
            </div>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              <Link
                href={isLoggedIn ? "/dashboard" : "/auth/sign-up"}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-extrabold text-base shadow-xl hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5"
              >
                {isLoggedIn ? "Go to Dashboard" : "Start Learning Free"}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                href="#how"
                className="inline-flex items-center gap-2 px-8 py-4 border border-border hover:border-primary/60 rounded-2xl font-bold text-base bg-background/50 backdrop-blur-sm hover:bg-secondary/30 transition-all duration-300"
              >
                See how it works
                <ChevronRight className="h-4 w-4 opacity-60" />
              </Link>
            </div>

            {/* Trust signals */}
            <div
              className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground animate-fade-in-up"
              style={{ animationDelay: "0.15s" }}
            >
              {[
                "✓ 100% Free for CIT-U Students",
                "✓ Verified Honor Society Tutors",
                "✓ Flexible Scheduling",
              ].map((item, i) => (
                <span key={i} className="flex items-center gap-1.5 font-medium">
                  {item}
                </span>
              ))}
            </div>

            {/* Hero image strip */}
            <div
              className="mt-16 grid grid-cols-3 gap-3 sm:gap-4 rounded-2xl overflow-hidden shadow-2xl border border-border/30 max-h-64 sm:max-h-96 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              {GALLERY_IMAGES.map((img, i) => (
                <div key={i} className="relative overflow-hidden group">
                  <Image
                    src={img.url}
                    alt={img.alt}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    priority={i === 0}
                    sizes="33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-3">
                    <span className="text-[9px] sm:text-[10px] text-primary font-bold uppercase tracking-wider">
                      {img.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section
          className="py-16 px-6 border-y border-border/40 bg-secondary/10"
          ref={statsRef}
        >
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <AnimatedStat key={i} {...stat} animate={statsVisible} />
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-24 px-6 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                Platform Features
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                Everything you need to{" "}
                <span className="text-primary">excel academically</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                ScholarMe isn&apos;t just a tutoring app — it&apos;s a complete
                academic excellence ecosystem.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feat, i) => (
                <div
                  key={i}
                  className={`group p-6 rounded-2xl border ${feat.border} bg-gradient-to-br ${feat.color} backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-background/60 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <feat.icon className="h-5 w-5 text-foreground" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF ── */}
        <section
          className="py-24 px-6 bg-secondary/20 border-y border-border/40"
          id="community"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                Student Stories
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Real results from real Technologians
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Hundreds of CIT-U students have already leveled up their
                academics through ScholarMe.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star
                        key={j}
                        className="h-4 w-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5 italic">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.program}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Photo gallery grid */}
            <div className="grid grid-cols-3 gap-3 rounded-2xl overflow-hidden border border-border/30">
              {GALLERY_IMAGES.map((img, i) => (
                <div
                  key={i}
                  className="relative h-48 sm:h-60 overflow-hidden group cursor-pointer"
                >
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <div className="p-4 w-full">
                      <p className="text-primary font-bold text-xs uppercase tracking-wider">
                        {img.title}
                      </p>
                      <p className="text-white/80 text-xs mt-0.5">{img.alt}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how" className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-64 bg-amber-500/5 dark:bg-[#FFD700]/3 blur-3xl" />
          </div>

          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                Simple Process
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Get tutored in 3 easy steps
              </h2>
              <p className="text-muted-foreground">
                From sign-up to your first session — seamless and fast.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-transparent via-amber-500/30 dark:via-[#FFD700]/30 to-transparent" />

              {STEPS.map((step, i) => (
                <div key={i} className="group relative text-center">
                  <div className="relative inline-flex mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-amber-500/20 dark:group-hover:bg-[#FFD700]/20 transition-colors duration-300 group-hover:scale-110 transition-transform">
                      <step.icon className="h-7 w-7 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zinc-950 dark:bg-[#FFD700] text-white dark:text-black text-[10px] font-black flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARISON / VALUE PROP ── */}
        <section className="py-16 px-6 bg-secondary/15 border-y border-border/40">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">
                Why ScholarMe beats the rest
              </h2>
              <p className="text-muted-foreground">
                We&apos;re not just another tutoring platform.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
                <h3 className="font-bold text-red-500 mb-4 flex items-center gap-2">
                  <X className="h-5 w-5" /> Without ScholarMe
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {[
                    "Random online tutors with no academic accountability",
                    "No session verification or hour tracking",
                    "Expensive private tutoring costs",
                    "No connection to your school community",
                    "Generic study resources not tied to your curriculum",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5 shrink-0">✗</span>{" "}
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 rounded-2xl border border-primary/30 bg-amber-500/5 dark:bg-[#FFD700]/5">
                <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" /> With ScholarMe
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {[
                    "Verified CIT-U Honor Society tutors only",
                    "Digital QR session tracking & automated logs",
                    "Completely free for all Technologians",
                    "Built specifically for CIT-U students & curriculum",
                    "Leaderboard, XP, and gamified academic progress",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 shrink-0">✓</span>{" "}
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA SECTION ── */}
        <section className="py-28 px-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 via-transparent to-yellow-500/5 dark:from-[#FFD700]/8 dark:to-yellow-400/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 blur-3xl rounded-full" />
          </div>

          <div className="max-w-3xl mx-auto text-center relative z-10 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 dark:bg-[#FFD700]/10 border border-amber-500/30 dark:border-[#FFD700]/25 text-primary text-xs font-bold uppercase tracking-widest">
                Join ScholarMe Today
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
                Your academic breakthrough{" "}
                <span className="text-primary">starts here.</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Join hundreds of CIT-U students already excelling with Honor
                Society mentorship. It&apos;s free, verified, and built for you.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={isLoggedIn ? "/dashboard" : "/auth/sign-up"}
                className="group inline-flex items-center justify-center gap-2 px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-extrabold text-base shadow-xl hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                {isLoggedIn ? "Go to Dashboard" : "Get Started — It's Free"}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                href={isLoggedIn ? "/dashboard" : "/auth/login"}
                className="inline-flex items-center justify-center gap-2 px-10 py-4 border border-border hover:border-primary/50 rounded-2xl font-bold text-base hover:bg-secondary/30 transition-all duration-300"
              >
                {isLoggedIn ? "View Profile" : "Sign In"}
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">
              No credit card required · Free for all CIT-U students · Cancel
              anytime
            </p>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-secondary/20 px-6 pt-16 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-zinc-950 dark:bg-zinc-900 border border-primary/40 rounded-xl flex items-center justify-center">
                  <HonorSocietyLogo variant="gold" className="h-4 w-4" />
                </div>
                <span className="font-extrabold tracking-tight">ScholarMe</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                The official tutoring and academic recognition system for the
                CIT-U Honor Society.
              </p>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                ))}
                <span className="text-xs text-muted-foreground ml-1">
                  5.0 rated
                </span>
              </div>
            </div>

            {[
              {
                title: "Community",
                links: [
                  "Honor Society",
                  "CIT University",
                  "Student Success Office",
                  "Alumni Network",
                ],
              },
              {
                title: "Platform",
                links: [
                  "Peer Tutors",
                  "Session Booking",
                  "Timesheets",
                  "Leaderboard",
                  "Voting",
                ],
              },
            ].map((col, i) => (
              <div key={i}>
                <h3 className="font-bold mb-4 text-xs uppercase tracking-wider text-primary">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a
                        href="#"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h3 className="font-bold mb-4 text-xs uppercase tracking-wider text-primary">
                Support
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="#"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <TosLink className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 text-left" />
                </li>
                <li>
                  <PrivacyLink className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 text-left" />
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; 2026 CIT-U Honor Society. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Built with <span className="text-primary">♥</span> for
              Technologians
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
