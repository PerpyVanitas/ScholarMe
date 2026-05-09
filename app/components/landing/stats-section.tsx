'use client';

import { Users, Award, TrendingUp, Smile } from 'lucide-react';

export function StatsSection() {
  const stats = [
    {
      icon: Users,
      number: '5000+',
      label: 'Active Learners',
      description: 'Students transforming their education',
    },
    {
      icon: Award,
      number: '500+',
      label: 'Expert Tutors',
      description: 'Certified professionals ready to help',
    },
    {
      icon: TrendingUp,
      number: '95%',
      label: 'Success Rate',
      description: 'Students achieve their goals',
    },
    {
      icon: Smile,
      number: '4.9⭐',
      label: 'Average Rating',
      description: 'Highly trusted by our community',
    },
  ];

  return (
    <section className="py-20 px-6 sm:px-8 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-y border-border/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="group text-center p-6 rounded-xl hover:bg-background/50 transition-all duration-300"
              >
                <div className="flex justify-center mb-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 group-hover:bg-accent/30 transition-colors">
                    <Icon className="h-8 w-8 text-accent" />
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                  {stat.number}
                </div>
                <div className="text-sm font-semibold text-foreground mb-1">
                  {stat.label}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
