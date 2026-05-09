'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Menu, X, GraduationCap } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';


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
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/20' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">ScholarMe</span>
          </Link>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#community" className="text-sm hover:text-blue-600 transition">Community</a>
            <a href="#how" className="text-sm hover:text-blue-600 transition">How It Works</a>
            <a href="#tutors" className="text-sm hover:text-blue-600 transition">Tutors</a>
            <ThemeToggle />
          </div>

          <Link 
            href={isLoggedIn ? '/dashboard' : '/auth/login'}
            className="hidden md:inline text-sm font-medium hover:text-blue-600 transition"
          >
            {isLoggedIn ? 'Dashboard' : 'Sign in'}
          </Link>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/20 bg-white dark:bg-slate-950">
            <div className="px-6 py-4 space-y-4">
              <a href="#community" className="block text-sm hover:text-blue-600">Community</a>
              <a href="#how" className="block text-sm hover:text-blue-600">How It Works</a>
              <a href="#tutors" className="block text-sm hover:text-blue-600">Tutors</a>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Appearance</span>
                <ThemeToggle />
              </div>
              <Link href={isLoggedIn ? '/dashboard' : '/auth/login'} className="block text-sm font-medium hover:text-blue-600">
                {isLoggedIn ? 'Dashboard' : 'Sign in'}
              </Link>
            </div>
          </div>
        )}

      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                  Learn from the best
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-400">
                  Connect with expert tutors. Master any subject. Achieve your goals.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={isLoggedIn ? '/dashboard' : '/auth/sign-up'}
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition text-center"
                >
                  Get started
                </Link>
                <Link
                  href="#community"
                  className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 dark:border-slate-700 hover:border-blue-600 rounded-lg font-medium transition text-center"
                >
                  Explore community
                </Link>
              </div>

              <div className="pt-8 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <p className="flex items-center gap-2">
                  <span className="inline-block w-1 h-1 bg-blue-600 rounded-full"></span>
                  500+ verified tutors
                </p>
                <p className="flex items-center gap-2">
                  <span className="inline-block w-1 h-1 bg-blue-600 rounded-full"></span>
                  2,500+ active learners
                </p>
                <p className="flex items-center gap-2">
                  <span className="inline-block w-1 h-1 bg-blue-600 rounded-full"></span>
                  92% achieve their goals
                </p>
              </div>
            </div>

            {/* Right - Hero Image */}
            <div className="relative h-96 lg:h-full min-h-96 rounded-2xl overflow-hidden">
              <Image
                src={GALLERY_IMAGES[0].url}
                alt="Students learning together"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Gallery */}
      <section id="community" className="py-20 px-6 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Our Community</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">Real students. Real success.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GALLERY_IMAGES.map((image, index) => (
              <div
                key={index}
                className="group relative h-72 rounded-xl overflow-hidden cursor-pointer"
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-6 w-full">
                    <p className="text-white font-semibold">{image.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">How it works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'Create Profile', desc: 'Sign up and tell us about your learning goals' },
              { step: '02', title: 'Find Tutor', desc: 'Browse verified tutors matched to your needs' },
              { step: '03', title: 'Start Learning', desc: 'Schedule sessions and achieve your goals' },
            ].map((item, i) => (
              <div key={i} className="space-y-4">
                <div className="text-5xl font-bold text-blue-600/20">{item.step}</div>
                <h3 className="text-2xl font-bold">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '500+', label: 'Tutors' },
              { num: '2.5K+', label: 'Students' },
              { num: '92%', label: 'Success Rate' },
              { num: '4.9/5', label: 'Rating' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-blue-600 mb-2">{stat.num}</div>
                <p className="text-slate-600 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold">Ready to start learning?</h2>
          <p className="text-xl text-slate-600 dark:text-slate-400">Join thousands of students achieving their goals</p>
          <Link
            href={isLoggedIn ? '/dashboard' : '/auth/sign-up'}
            className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-12 px-6 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">ScholarMe</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Connecting learners with expert tutors</p>
          </div>
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Security'] },
            { title: 'Company', links: ['About', 'Blog', 'Careers'] },
            { title: 'Support', links: ['Help', 'Contact', 'FAQ'] },
          ].map((col, i) => (
            <div key={i}>
              <h3 className="font-semibold mb-4">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a href="#" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800 mt-8 pt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>&copy; 2026 ScholarMe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
