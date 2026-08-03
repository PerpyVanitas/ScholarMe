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
  Sparkles,
  Heart,
  Crown,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { FeedbackButton } from "@/components/feedback-button";
import { HonorSocietyLogo } from "@/components/honsoc-logo";
import { TosLink, PrivacyLink } from "@/components/legal-modals";
import { OrganizationSettings } from "@/lib/types";

import {
  HONSOC_PHOTOS,
  THREE_PILLARS,
  STATS,
  FEATURES,
  TESTIMONIALS,
  STEPS,
} from "./landing-data";

function getPrimaryForeground(color: string): "#111111" | "#ffffff" {
  const match = /^#([\da-f]{6})$/i.exec(color.trim());
  if (!match) return "#ffffff";

  const channels = [0, 2, 4].map((index) =>
    parseInt(match[1].slice(index, index + 2), 16) / 255,
  );
  const luminance = channels.reduce(
    (total, channel, index) =>
      total +
      [0.2126, 0.7152, 0.0722][index] *
        (channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4),
    0,
  );
  const darkContrast = (luminance + 0.05) / 0.05;
  const lightContrast = 1.05 / (luminance + 0.05);

  return darkContrast >= lightContrast ? "#111111" : "#ffffff";
}

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
  detail,
  icon: Icon,
  animate,
}: {
  value: string;
  label: string;
  detail: string;
  icon: React.ElementType;
  animate: boolean;
}) {
  const numericPart = parseInt(value.replace(/[^0-9]/g, ""));
  const suffix = value.replace(/[0-9]/g, "");
  const count = useCountUp(numericPart, 1800, animate);
  const display = isNaN(numericPart) ? value : `${count}${suffix}`;

  return (
    <div className="group text-center p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="text-3xl sm:text-4xl font-black text-primary mb-1 tabular-nums tracking-tight">
        {display}
      </div>
      <p className="text-xs text-foreground font-bold tracking-wide uppercase mb-1">
        {label}
      </p>
      <p className="text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState(0);
  const [activePhoto, setActivePhoto] = useState<(typeof HONSOC_PHOTOS)[0] | null>(null);
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings | null>(null);

  const primaryForeground = getPrimaryForeground(
    orgSettings?.primary_color ?? "",
  );
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
      { threshold: 0.2 },
    );
    if (statsRef.current) observer.observe(statsRef.current);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-500">
      {orgSettings?.primary_color && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
          :root {
            --primary: ${orgSettings.primary_color};
            --primary-foreground: ${primaryForeground};
          }
        `,
          }}
        />
      )}

      {/* ── NAV ── */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/85 backdrop-blur-xl border-b border-border/50 shadow-md"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 bg-primary border border-primary/40 group-hover:border-primary rounded-xl flex items-center justify-center shadow-md transition-all duration-300 group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.4)]">
              <HonorSocietyLogo variant="black" className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight leading-none flex items-center gap-1.5">
                ScholarMe
                <span className="text-[10px] text-primary font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                  HonSoc
                </span>
              </span>
              <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">
                CIT-U Honor Society
              </span>
            </div>
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
              href="#pillars"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Our 3 Pillars
            </a>
            <a
              href="#about"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              About HonSoc
            </a>
            <a
              href="#gallery"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Gallery & Community
            </a>
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Features
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
              className="text-sm font-bold px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-primary/20 hover:scale-[1.02]"
            >
              Get Started
            </Link>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
            <div className="px-6 py-5 space-y-4 text-sm font-semibold">
              <a
                href="#pillars"
                className="block text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Our 3 Pillars
              </a>
              <a
                href="#about"
                className="block text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                About HonSoc
              </a>
              <a
                href="#gallery"
                className="block text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Gallery & Community
              </a>
              <a
                href="#features"
                className="block text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
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
                className="block text-center px-4 py-3 bg-primary text-primary-foreground rounded-xl font-extrabold shadow-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                {isLoggedIn ? "Go to Dashboard" : "Get Started Free"}
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main>
        {/* ── HERO SECTION ── */}
        <section className="relative pt-36 pb-24 px-6 overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[650px] bg-gradient-to-b from-amber-500/15 via-yellow-500/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute top-32 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute top-48 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            {/* Top Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest shadow-sm hover:scale-105 transition-transform cursor-default">
                <Sparkles className="h-3.5 w-3.5" />
                Excellence in Academics, Leadership, and Social Responsibility 🎓✨
              </div>
            </div>

            {/* Main Headline */}
            <div className="text-center max-w-4xl mx-auto mb-10 space-y-6">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight">
                <span className="bg-gradient-to-br from-foreground via-foreground to-amber-500 bg-clip-text text-transparent">
                  Driven by Excellence in
                </span>
                <br />
                <span className="text-primary underline decoration-primary/40 underline-offset-8">
                  Academics, Leadership,
                </span>{" "}
                <br className="hidden sm:inline" />
                <span className="text-foreground">&amp; Social Responsibility</span>
              </h1>

              {/* Provided User Quote / Subtitle */}
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-medium">
                Driven by Excellence in Academics, Leadership, and Social Responsibility, the Honor Society is a collaborative community of responsible student leaders dedicated to making an impact inside and outside the classroom.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14">
              <Link
                href={isLoggedIn ? "/dashboard" : "/auth/sign-up"}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-extrabold text-base shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                {isLoggedIn ? "Go to Dashboard" : "Start Learning Free"}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <a
                href="#about"
                className="inline-flex items-center gap-2 px-8 py-4 border border-border/80 hover:border-primary/60 rounded-2xl font-bold text-base bg-card/60 backdrop-blur-md hover:bg-secondary/40 transition-all duration-300 shadow-sm"
              >
                Learn Our Mission
                <ChevronRight className="h-4 w-4 opacity-70" />
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              {[
                "✓ 400+ Tutors Over 4 Years",
                "✓ Peer Learning Center Hub",
                "✓ 100% Free for Technologians",
              ].map((item, i) => (
                <span key={i} className="flex items-center gap-1.5 font-semibold">
                  {item}
                </span>
              ))}
            </div>

            {/* Photo Strip Showcase */}
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-5 gap-3 rounded-2xl p-3 border border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl">
              {HONSOC_PHOTOS.map((photo, i) => (
                <div
                  key={i}
                  onClick={() => setActivePhoto(photo)}
                  className="group relative h-44 sm:h-52 rounded-xl overflow-hidden cursor-pointer border border-border/30 hover:border-primary/60 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <Image
                    src={photo.url}
                    alt={photo.alt}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 640px) 50vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-3 left-3 right-3 flex flex-col justify-end">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary mb-0.5">
                      {photo.tag}
                    </span>
                    <p className="text-white font-bold text-xs line-clamp-1 group-hover:text-amber-300 transition-colors">
                      {photo.title}
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CORE MISSION BANNER ── */}
        <section className="py-12 px-6">
          <div className="max-w-5xl mx-auto rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/5 backdrop-blur-xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 text-xs font-extrabold uppercase tracking-widest">
                  <Sparkles className="h-3.5 w-3.5" /> Core Mission Statement
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  Excellence in Academics, Leadership, and Social Responsibility 🎓✨
                </h2>
                <p className="text-muted-foreground leading-relaxed text-base">
                  This is the core mission of the Honor Society. We are a community of responsible, purpose-driven student leaders maximizing our potential both inside and outside the classroom.
                </p>
                <p className="text-sm font-medium text-foreground/90 leading-relaxed italic border-l-2 border-primary pl-4">
                  &ldquo;From running the campus institutional tutoring facility to bridging the gap between students and administration to leading impactful community outreach. Ready to grow with us?&rdquo;
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  href={isLoggedIn ? "/dashboard" : "/auth/sign-up"}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-extrabold rounded-2xl shadow-xl hover:scale-105 transition-all duration-300 text-sm whitespace-nowrap"
                >
                  Join the Mission <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── REAL HISTORICAL STATS ── */}
        <section
          className="py-16 px-6 border-y border-border/40 bg-secondary/10"
          ref={statsRef}
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Historical Impact &amp; Reach
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
                Empowering Technologians Year After Year
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STATS.map((stat, i) => (
                <AnimatedStat key={i} {...stat} animate={statsVisible} />
              ))}
            </div>
          </div>
        </section>

        {/* ── ABOUT HONSOC & THE 3 PILLARS ── */}
        <section id="pillars" className="py-24 px-6 relative">
          <div className="max-w-6xl mx-auto space-y-16">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                Our Three Foundations
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                The Three Pillars of the <span className="text-primary">Honor Society</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Transforming our three-part mission into action from our main hub at the Peer Learning Center.
              </p>
            </div>

            {/* 3 Pillars Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {THREE_PILLARS.map((pillar, i) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedPillar(i)}
                    className={`group relative p-8 rounded-3xl border transition-all duration-300 cursor-pointer bg-card/60 backdrop-blur-md flex flex-col justify-between ${
                      selectedPillar === i
                        ? `${pillar.border} shadow-2xl ${pillar.glow} scale-[1.02]`
                        : "border-border/50 hover:border-border hover:shadow-lg"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Icon className="h-7 w-7 text-primary" />
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${pillar.badgeColor}`}>
                          {pillar.badge}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold mb-2 text-foreground">
                        {pillar.title}
                      </h3>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                        {pillar.tagline}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                        {pillar.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border/30 space-y-2">
                      {pillar.highlights.map((item, j) => (
                        <div key={j} className="flex items-center gap-2 text-xs text-foreground font-medium">
                          <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── DETAILED ABOUT & PLC SECTION ── */}
        <section id="about" className="py-24 px-6 bg-secondary/20 border-y border-border/40 relative">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Comprehensive Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                Main Hub: Peer Learning Center
              </div>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Maximizing Potential Inside &amp; Outside the Classroom
              </h2>

              <div className="space-y-4 text-base text-muted-foreground leading-relaxed">
                <p>
                  Driven by a commitment to <strong className="text-foreground font-semibold">Excellence in Academics, Leadership, and Social Responsibility</strong>, the Honor Society is a top academic organization that transforms this three-part mission into action from its main hub in the <strong className="text-foreground font-semibold">Peer Learning Center</strong> — a collaborative environment designed for outspoken, responsible individuals looking to maximize their potential both inside and outside the classroom.
                </p>
                <div className="grid sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl border border-border/40 bg-card/60">
                    <GraduationCap className="h-5 w-5 text-amber-500 mb-2" />
                    <h4 className="font-bold text-sm text-foreground mb-1">In Academics</h4>
                    <p className="text-xs text-muted-foreground">Equips students to meet university standards by managing the campus institutional tutoring facility.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/40 bg-card/60">
                    <Crown className="h-5 w-5 text-purple-500 mb-2" />
                    <h4 className="font-bold text-sm text-foreground mb-1">In Leadership</h4>
                    <p className="text-xs text-muted-foreground">Serves as a vital communication medium between student body and administration while cultivating talent.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/40 bg-card/60">
                    <Heart className="h-5 w-5 text-emerald-500 mb-2" />
                    <h4 className="font-bold text-sm text-foreground mb-1">Social Responsibility</h4>
                    <p className="text-xs text-muted-foreground">Empowers members to lead and engage in campus events, community extensions, and outreach programs.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Featured Image Cards */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative h-72 rounded-2xl overflow-hidden border border-border/40 shadow-xl group">
                <Image
                  src="/images/honsoc/honsoc-group-formal.jpg"
                  alt="CIT-U Honor Society Leaders"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                    Official Representation
                  </span>
                  <p className="text-white font-bold text-base">CIT-U Honor Society Leaders</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative h-40 rounded-xl overflow-hidden border border-border/40 shadow-md group">
                  <Image
                    src="/images/honsoc/honsoc-group-hearts.jpg"
                    alt="Honor Society Members"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-3">
                    <p className="text-white font-bold text-xs">Collaborative Spirit</p>
                  </div>
                </div>

                <div className="relative h-40 rounded-xl overflow-hidden border border-border/40 shadow-md group">
                  <Image
                    src="/images/honsoc/friyay-game-recap.jpg"
                    alt="Friyay Nights Recap"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-3">
                    <p className="text-white font-bold text-xs">Friyay Game Nights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PHOTO GALLERY SHOWCASE ── */}
        <section id="gallery" className="py-24 px-6 relative">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                Life at HonSoc
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Authentic Community Moments
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Explore our moments in leadership, tutoring sessions, and social events at the Peer Learning Center.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {HONSOC_PHOTOS.map((photo, i) => (
                <div
                  key={i}
                  onClick={() => setActivePhoto(photo)}
                  className="group relative h-64 rounded-2xl overflow-hidden border border-border/40 bg-card/60 backdrop-blur-md cursor-pointer hover:shadow-xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <Image
                    src={photo.url}
                    alt={photo.alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300" />

                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <span className="text-[10px] text-primary font-extrabold uppercase tracking-widest mb-1">
                      {photo.category}
                    </span>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
                      {photo.title}
                    </h3>
                    <p className="text-xs text-white/80 line-clamp-2">
                      {photo.description}
                    </p>
                  </div>

                  <div className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Maximize2 className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PLATFORM FEATURES ── */}
        <section id="features" className="py-24 px-6 bg-secondary/15 border-y border-border/40">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                ScholarMe Platform
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                Everything you need to <span className="text-primary">excel academically</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Built specifically for CIT-U Technologians to manage tutoring, session logs, and academic milestones.
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

        {/* ── TESTIMONIALS ── */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                Student Testimonials
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Real results from real Technologians
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Hundreds of CIT-U students have already leveled up their academics through ScholarMe.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star
                          key={j}
                          className="h-4 w-4 fill-primary text-primary"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6 italic">
                      &ldquo;{t.text}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
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
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how" className="py-24 px-6 bg-secondary/10 border-y border-border/40 relative overflow-hidden">
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                Simple Process
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Get tutored in 3 easy steps
              </h2>
              <p className="text-muted-foreground">
                From sign-up to your first session at the Peer Learning Center — seamless and fast.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {STEPS.map((step, i) => (
                <div key={i} className="group relative text-center">
                  <div className="relative inline-flex mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <step.icon className="h-7 w-7 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shadow-md">
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

        {/* ── FINAL CTA SECTION ── */}
        <section className="py-28 px-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/15 blur-3xl rounded-full" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest">
                Join ScholarMe &amp; CIT-U Honor Society
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
                Your academic breakthrough <span className="text-primary">starts here.</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Connect with over 400+ Honor Society tutors, access free peer tutoring, and maximize your potential inside and outside the classroom.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={isLoggedIn ? "/dashboard" : "/auth/sign-up"}
                className="group inline-flex items-center justify-center gap-2 px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-extrabold text-base shadow-xl hover:scale-105 transition-all duration-300"
              >
                {isLoggedIn ? "Go to Dashboard" : "Get Started — It's Free"}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                href={isLoggedIn ? "/dashboard" : "/auth/login"}
                className="inline-flex items-center justify-center gap-2 px-10 py-4 border border-border hover:border-primary/50 rounded-2xl font-bold text-base bg-card/50 backdrop-blur-md hover:bg-secondary/40 transition-all duration-300"
              >
                {isLoggedIn ? "View Profile" : "Sign In"}
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">
              Free for all CIT-U students · Managed by the Honor Society Peer Learning Center
            </p>
          </div>
        </section>
      </main>

      {/* ── PHOTO LIGHTBOX MODAL ── */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-card border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative h-[55vh] sm:h-[65vh] w-full bg-black">
              <Image
                src={activePhoto.url}
                alt={activePhoto.alt}
                fill
                className="object-contain"
              />
            </div>

            <div className="p-6 bg-card border-t border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  {activePhoto.category}
                </span>
                <h3 className="text-xl font-bold text-foreground">
                  {activePhoto.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {activePhoto.description}
                </p>
              </div>
              <button
                onClick={() => setActivePhoto(null)}
                className="px-5 py-2.5 bg-secondary text-secondary-foreground font-bold text-xs rounded-xl hover:bg-secondary/80 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-secondary/20 px-6 pt-16 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-primary border border-primary/40 rounded-xl flex items-center justify-center">
                  <HonorSocietyLogo variant="black" className="h-4 w-4" />
                </div>
                <span className="font-extrabold tracking-tight">ScholarMe</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
                The official peer tutoring and student leadership system for the CIT-U Honor Society.
              </p>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                ))}
                <span className="text-xs text-muted-foreground ml-1">
                  5.0 rated by students
                </span>
              </div>
            </div>

            {[
              {
                title: "Organization",
                items: [
                  { label: "Our 3 Pillars", href: "#pillars" },
                  { label: "Peer Learning Center", href: "#about" },
                  { label: "Community Gallery", href: "#gallery" },
                  { label: "CIT University", href: "https://www.cit.edu" },
                ],
              },
              {
                title: "Platform",
                items: [
                  { label: "Peer Tutors", href: "/dashboard/network/tutors" },
                  { label: "Session Booking", href: "/dashboard/sessions" },
                  { label: "Timesheets", href: "/dashboard/timesheet" },
                  { label: "Leaderboard", href: "/dashboard/leaderboard" },
                ],
              },
            ].map((col, i) => (
              <div key={i}>
                <h3 className="font-bold mb-4 text-xs uppercase tracking-wider text-primary">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.items.map((item, j) => (
                    <li key={j}>
                      {item.href.startsWith("http") ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1"
                        >
                          {item.label} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="font-bold mb-4 text-xs uppercase tracking-wider text-primary">
                Legal &amp; Support
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/dashboard/wiki"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    Help Center
                  </Link>
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
              Driven by <span className="text-primary font-semibold">Excellence in Academics, Leadership, and Social Responsibility</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
