'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/624842741_1371641018091166_602435888905857230_n-zmxJHx1nC7bk50pE1cVCtAcRUpzAeC.jpg"
          alt="ScholarMe Community"
          fill
          className="object-cover"
          priority
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 sm:px-8">
        <div className="max-w-3xl text-center">
          <div className="mb-6 inline-block rounded-full bg-accent/20 px-4 py-2 backdrop-blur-sm border border-accent/30">
            <span className="text-sm font-medium text-accent">Join a thriving learning community</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Elevate Your <span className="text-accent">Learning Journey</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Connect with expert tutors, celebrate achievements together, and transform your educational experience with ScholarMe
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground h-12 px-8 text-base">
              <Link href="/auth/signup">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base border-white/30 text-white hover:bg-white/10">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}
