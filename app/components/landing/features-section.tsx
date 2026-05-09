'use client';

import Image from 'next/image';
import { BookOpen, Users, Trophy, MessageSquare } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: Users,
      title: 'Expert Tutors',
      description: 'Connect with qualified tutors specializing in your subjects',
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/475194059_1086604756594795_793853421411451570_n-AZme6bacaABEhTFvYDoIjoOEOPxzOf.jpg',
    },
    {
      icon: Trophy,
      title: 'Celebrate Wins',
      description: 'Track progress and celebrate every milestone with your community',
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/624842741_1371641018091166_602435888905857230_n-zmxJHx1nC7bk50pE1cVCtAcRUpzAeC.jpg',
    },
    {
      icon: MessageSquare,
      title: 'Live Messaging',
      description: 'Real-time communication with tutors and peer learners',
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/641699815_1390651206190147_3711048706711808050_n-gzF9By3pn77bIJZNUWNruqgpiFIdt2.jpg',
    },
    {
      icon: BookOpen,
      title: 'Rich Resources',
      description: 'Access curated learning materials and study guides',
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/474966194_1086604766594794_2924190371366556402_n-mYd1rzEIF11ueti67NUpRV750BHtFE.jpg',
    },
  ];

  return (
    <section className="py-20 px-6 sm:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Why Choose ScholarMe?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need for academic success and personal growth
          </p>
        </div>

        {/* Feature Grid with Images */}
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            const isEven = idx % 2 === 0;

            return (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 hover:border-accent/50 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row h-full">
                  {/* Content */}
                  <div className="p-8 md:p-10 flex flex-col justify-center md:w-1/2 order-2 md:order-1">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20 group-hover:bg-accent/30 transition-colors">
                      <Icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>

                  {/* Image */}
                  <div className="relative h-64 md:h-auto md:w-1/2 order-1 md:order-2 overflow-hidden">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/20" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
