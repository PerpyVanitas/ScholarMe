'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { HonorSocietyLogo } from '@/components/honsoc-logo';

const GALLERY_IMAGES = [
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/475194059_1086604756594795_793853421411451570_n-AZme6bacaABEhTFvYDoIjoOEOPxzOf.jpg',
    alt: 'Collaborative Learning Session',
    title: 'Learning Together',
  },
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/624842741_1371641018091166_602435888905857230_n-zmxJHx1nC7bk50pE1cVCtAcRUpzAeC.jpg',
    alt: 'Honor Society Achievement',
    title: 'Excellence',
  },
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/474966194_1086604766594794_2924190371366556402_n-mYd1rzEIF11ueti67NUpRV750BHtFE.jpg',
    alt: 'Certificate Awards',
    title: 'Recognition',
  },
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/475704423_1090339316221339_7132123293738001513_n-BFujLtZylDMNsmvykPecgQPcD7tPls.jpg',
    alt: 'Award Ceremony',
    title: 'Celebration',
  },
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/481080709_1106087701313167_2684223903692983762_n-FChO431uiIzUga9C6B29Jlul19PzpI.jpg',
    alt: 'PMA Graduation',
    title: 'Success',
  },
];

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 bg-zinc-950 border border-[#FFD700]/30 hover:border-[#FFD700] rounded-lg flex items-center justify-center shadow-lg transition-colors duration-300">
              <HonorSocietyLogo variant="gold" className="h-5.5 w-5.5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">
              ScholarMe <span className="text-xs text-amber-500 dark:text-[#FFD700] font-semibold hidden sm:inline tracking-wider uppercase ml-1">Honsoc</span>
            </span>
          </Link>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-1 rounded-md hover:bg-secondary/30 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 font-semibold text-sm">
            <a href="#community" className="hover:text-amber-500 dark:hover:text-[#FFD700] transition-colors duration-200">Community</a>
            <a href="#how" className="hover:text-amber-500 dark:hover:text-[#FFD700] transition-colors duration-200">How It Works</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link 
              href={isLoggedIn ? '/dashboard' : '/auth/login'}
              className="text-sm font-bold text-amber-600 dark:text-[#FFD700] hover:text-amber-700 dark:hover:text-yellow-400 transition-colors duration-200"
            >
              {isLoggedIn ? 'Dashboard' : 'Sign in'}
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-md">
            <div className="px-6 py-4 space-y-4 font-semibold text-sm">
              <a href="#community" className="block hover:text-amber-500 dark:hover:text-[#FFD700]" onClick={() => setMobileMenuOpen(false)}>Community</a>
              <a href="#how" className="block hover:text-amber-500 dark:hover:text-[#FFD700]" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
              <div className="flex items-center justify-between border-t border-border/20 pt-4">
                <span className="text-sm font-medium">Appearance</span>
                <ThemeToggle />
              </div>
              <Link href={isLoggedIn ? '/dashboard' : '/auth/login'} className="block text-sm font-bold text-amber-600 dark:text-[#FFD700] pt-2" onClick={() => setMobileMenuOpen(false)}>
                {isLoggedIn ? 'Dashboard' : 'Sign in'}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-20 px-6 relative overflow-hidden">
        {/* Subtle background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 dark:bg-[#FFD700]/5 blur-3xl pointer-events-none rounded-full"></div>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFD700]/10 text-amber-600 dark:text-[#FFD700] border border-[#FFD700]/20 text-xs font-semibold uppercase tracking-widest animate-fade-in-up">
                  CIT University Honor Society
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight animate-fade-in-up bg-gradient-to-r from-foreground via-foreground to-amber-600 dark:to-[#FFD700] bg-clip-text text-transparent">
                  Shaping the future through academic leadership
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed animate-fade-in-up">
                  Connect with the Cebu Institute of Technology - University Honor Society's premier peer tutors. Master your courses, foster scholastic integrity, and elevate your academic journey.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <Link
                  href={isLoggedIn ? '/dashboard' : '/auth/sign-up'}
                  className="inline-flex items-center justify-center px-6 py-3.5 bg-zinc-950 text-white dark:bg-[#FFD700] dark:text-black border border-[#FFD700]/30 hover:border-[#FFD700] dark:hover:bg-[#E5C100] rounded-xl font-extrabold transition-all duration-300 text-center shadow-xl hover:animate-gold-glow"
                >
                  Join as Student
                </Link>
                <Link
                  href="#community"
                  className="inline-flex items-center justify-center px-6 py-3.5 border border-border hover:border-amber-500 dark:hover:border-[#FFD700] rounded-xl font-bold transition-all duration-300 text-center bg-secondary/10"
                >
                  Explore community
                </Link>
              </div>

              <div className="pt-8 space-y-3 text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <p className="flex items-center gap-3">
                  <span className="inline-block w-2.5 h-2.5 bg-amber-500 dark:bg-[#FFD700] rounded-full shadow-md shadow-amber-500"></span>
                  Official Cebu Institute of Technology - University Honor Society Platform
                </p>
                <p className="flex items-center gap-3">
                  <span className="inline-block w-2.5 h-2.5 bg-amber-500 dark:bg-[#FFD700] rounded-full shadow-md shadow-amber-500"></span>
                  Free peer-to-peer mentoring and academic guidance for all Technologians
                </p>
                <p className="flex items-center gap-3">
                  <span className="inline-block w-2.5 h-2.5 bg-amber-500 dark:bg-[#FFD700] rounded-full shadow-md shadow-amber-500"></span>
                  Integrate timesheets, QR scanning, and verification of tutoring hours
                </p>
              </div>
            </div>

            {/* Right - Hero Image */}
            <div className="relative h-96 lg:h-[450px] rounded-2xl overflow-hidden shadow-2xl border border-[#FFD700]/20 hover:border-[#FFD700]/50 transition-all duration-500 group animate-float">
              <Image
                src={GALLERY_IMAGES[0].url}
                alt="Students learning together"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-[10px] font-bold tracking-widest text-[#FFD700] uppercase">PEER TUTORING IN ACTION</span>
                <h3 className="text-white text-xl font-bold mt-1">Collab Hub at Student Success Office</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Gallery */}
      <section id="community" className="py-24 px-6 bg-secondary/20 border-t border-b border-border/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">Our Active Community</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Honoring academic commitment, service, and excellence at Cebu Institute of Technology - University.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GALLERY_IMAGES.map((image, index) => (
              <div
                key={index}
                className="group relative h-72 rounded-2xl overflow-hidden cursor-pointer shadow-md border border-border/30 hover:border-[#FFD700]/40 transition-all duration-300"
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-6 w-full border-t border-[#FFD700]/20 bg-black/40 backdrop-blur-xs">
                    <p className="text-[#FFD700] font-bold tracking-wider text-sm uppercase">{image.title}</p>
                    <p className="text-white/90 text-xs mt-1.5 leading-snug">{image.alt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">How It Works</h2>
            <p className="text-muted-foreground text-lg">Simple steps to academic success</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'Create Profile', desc: 'Sign up and configure your course priorities, specialized subjects, and scholar status' },
              { step: '02', title: 'Find Honsoc Tutor', desc: 'Browse qualified Honor Society peer mentors ready to assist in your courses' },
              { step: '03', title: 'Collaborate & Excel', desc: 'Book study slots, log sessions via digital ID scanning, and build scholastic competence' },
            ].map((item, i) => (
              <div key={i} className="space-y-4 border-l-2 border-amber-500 dark:border-[#FFD700] pl-6 py-2 hover:border-amber-600 dark:hover:border-yellow-400 transition-colors duration-300">
                <div className="text-4xl font-black text-amber-500/10 dark:text-[#FFD700]/15 font-mono">{item.step}</div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 bg-secondary/20 border-y border-border/40">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { num: '60+', label: 'Honor Society Tutors' },
              { num: '1,200+', label: 'Mentoring Hours Logged' },
              { num: '100%', label: 'Scholastic Commitment' },
              { num: 'Black & Gold', label: 'Honor Society Identity' },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="text-3xl lg:text-4xl font-black text-amber-600 dark:text-[#FFD700] mb-2 transition-transform duration-300 group-hover:scale-110">{stat.num}</div>
                <p className="text-muted-foreground text-xs sm:text-sm font-semibold tracking-wide uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative overflow-hidden bg-gradient-to-b from-transparent to-secondary/10">
        <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
            Cultivate Excellence, Together
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Become a part of Cebu Institute of Technology - University's premier peer tutoring community.
          </p>
          <div className="pt-2">
            <Link
              href={isLoggedIn ? '/dashboard' : '/auth/sign-up'}
              className="inline-block px-8 py-4 bg-zinc-950 text-white dark:bg-[#FFD700] dark:text-black border border-[#FFD700]/30 hover:border-[#FFD700] dark:hover:bg-[#E5C100] rounded-xl font-extrabold transition-all duration-300 shadow-xl hover:animate-gold-glow"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-zinc-950 border border-[#FFD700]/30 rounded-lg flex items-center justify-center shadow-md">
                <HonorSocietyLogo variant="gold" className="h-4.5 w-4.5" />
              </div>
              <span className="font-extrabold tracking-tight">ScholarMe</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Official tutoring and session recognition system for the Cebu Institute of Technology - University Honor Society.
            </p>
          </div>
          {[
            { title: 'Community', links: ['Honor Society', 'CIT University', 'Student Success Office'] },
            { title: 'Platform', links: ['Peer Tutors', 'Timesheets', 'Voting'] },
            { title: 'Support', links: ['Help Center', 'Terms of Service', 'Privacy Policy'] },
          ].map((col, i) => (
            <div key={i}>
              <h3 className="font-bold mb-4 text-xs uppercase tracking-wider text-amber-600 dark:text-[#FFD700]">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a href="#" className="text-xs text-muted-foreground hover:text-amber-500 dark:hover:text-[#FFD700] transition-colors duration-200">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto border-t border-border/40 mt-12 pt-8 text-center text-xs text-muted-foreground">
          <p>&copy; 2026 Cebu Institute of Technology - University Honor Society. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
