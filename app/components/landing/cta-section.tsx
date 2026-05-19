'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';

export function CTASection() {
  return (
    <section className="relative py-20 px-6 sm:px-8 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 -z-10" />
      
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-6 inline-block rounded-full bg-accent/20 px-4 py-2 border border-accent/30">
          <span className="text-sm font-medium text-accent flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Limited Time Offer
          </span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
          Ready to Transform <span className="text-accent">Your Learning?</span>
        </h2>

        <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of students who are already achieving their academic goals with personalized tutoring and a supportive community.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground h-12 px-8 text-base group"
          >
            <Link href="/auth/signup" className="flex items-center gap-2">
              Start Learning Free <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 px-8 text-base"
          >
            <Link href="#features">Explore Features</Link>
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span>Free trial included</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}
