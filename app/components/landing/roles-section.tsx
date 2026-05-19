'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { GraduationCap, BookMarked, Users } from 'lucide-react';

export function RolesSection() {
  const roles = [
    {
      icon: GraduationCap,
      title: 'For Learners',
      description: 'Get personalized tutoring and connect with mentors',
      features: [
        'One-on-one tutoring sessions',
        'Progress tracking and insights',
        'Personalized study plans',
        'Community support network',
      ],
    },
    {
      icon: BookMarked,
      title: 'For Tutors',
      description: 'Share expertise and earn while making impact',
      features: [
        'Create your tutor profile',
        'Set your own rates',
        'Manage flexible schedules',
        'Build your reputation',
      ],
    },
    {
      icon: Users,
      title: 'For Communities',
      description: 'Build learning networks and celebrate together',
      features: [
        'Community events',
        'Group learning sessions',
        'Achievement celebrations',
        'Collaborative resources',
      ],
    },
  ];

  return (
    <section className="py-20 px-6 sm:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            For Everyone
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you&apos;re learning, teaching, or building community, ScholarMe has a place for you
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {roles.map((role, idx) => {
            const Icon = role.icon;
            return (
              <Card
                key={idx}
                className="group relative overflow-hidden border border-border/50 hover:border-accent/50 hover:shadow-lg transition-all duration-300"
              >
                <CardHeader>
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-accent/20 group-hover:bg-accent/30 transition-colors">
                    <Icon className="h-7 w-7 text-accent" />
                  </div>
                  <CardTitle className="text-2xl">{role.title}</CardTitle>
                  <CardDescription className="text-base">{role.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {role.features.map((feature, featureIdx) => (
                      <li key={featureIdx} className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full mt-6 bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
