'use client';

import Image from 'next/image';

export function CommunityGallery() {
  const images = [
    {
      src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/475194059_1086604756594795_793853421411451570_n-AZme6bacaABEhTFvYDoIjoOEOPxzOf.jpg',
      alt: 'Collaborative Learning Session',
      caption: 'Collaborative Learning',
      span: 'col-span-2 row-span-1',
    },
    {
      src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/474966194_1086604766594794_2924190371366556402_n-mYd1rzEIF11ueti67NUpRV750BHtFE.jpg',
      alt: 'Achievement Celebration',
      caption: 'Celebrating Success',
      span: 'col-span-1 row-span-2',
    },
    {
      src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/475704423_1090339316221339_7132123293738001513_n-BFujLtZylDMNsmvykPecgQPcD7tPls.jpg',
      alt: 'Awards Ceremony',
      caption: 'Recognition & Awards',
      span: 'col-span-1 row-span-1',
    },
    {
      src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/641699815_1390651206190147_3711048706711808050_n-gzF9By3pn77bIJZNUWNruqgpiFIdt2.jpg',
      alt: 'Game Night Events',
      caption: 'Community Fun',
      span: 'col-span-1 row-span-1',
    },
    {
      src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/481080709_1106087701313167_2684223903692983762_n-FChO431uiIzUga9C6B29Jlul19PzpI.jpg',
      alt: 'PMA Graduation',
      caption: 'Grand Achievements',
      span: 'col-span-2 row-span-1',
    },
  ];

  return (
    <section className="py-20 px-6 sm:px-8 bg-muted/40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Our Community in Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real students. Real achievements. Real friendships. See the ScholarMe difference.
          </p>
        </div>

        {/* Masonry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[300px]">
          {images.map((image, idx) => (
            <div
              key={idx}
              className={`relative group overflow-hidden rounded-xl bg-muted ${image.span} cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white font-semibold text-lg">{image.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
