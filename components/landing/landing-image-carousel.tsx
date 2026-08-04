"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { HONSOC_PHOTOS } from "@/app/landing-data";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Sparkles,
  Maximize2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function LandingImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % HONSOC_PHOTOS.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? HONSOC_PHOTOS.length - 1 : prevIndex - 1
    );
  }, []);

  useEffect(() => {
    if (isPaused || lightboxOpen) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, isPaused, lightboxOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
    touchStartX.current = null;
  };

  const currentPhoto = HONSOC_PHOTOS[currentIndex];

  return (
    <section className="relative w-full max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Life at CIT-U Honor Society</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Empowered Community & Peer Learning
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Explore moments of academic excellence, leadership, social responsibility, and vibrant student life inside the Peer Learning Center.
        </p>
      </div>

      <div
        className="relative group rounded-2xl overflow-hidden border border-border/60 bg-card shadow-2xl transition-all duration-300"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Main Display Image */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-muted overflow-hidden">
          {HONSOC_PHOTOS.map((photo, index) => (
            <div
              key={photo.url}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <Image
                src={photo.url}
                alt={photo.alt}
                fill
                priority={index === 0}
                className="object-cover object-center transform transition-transform duration-1000 scale-105 group-hover:scale-100"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>
          ))}

          {/* Glassmorphic Info Card Overlay */}
          <div className="absolute bottom-4 left-4 right-4 sm:left-8 sm:right-8 sm:bottom-6 z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-4 p-4 sm:p-6 rounded-xl bg-background/40 backdrop-blur-md border border-white/10 text-white shadow-xl">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-[11px] px-2.5 py-0.5">
                  {currentPhoto.tag}
                </Badge>
                <span className="text-xs text-white/80 font-medium">
                  {currentPhoto.category}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-snug drop-shadow-sm">
                {currentPhoto.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/90 line-clamp-2">
                {currentPhoto.description}
              </p>
            </div>

            {/* Lightbox Action & Play/Pause */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                onClick={() => setIsPaused(!isPaused)}
                aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
              >
                {isPaused ? <Play className="h-4 w-4 fill-white" /> : <Pause className="h-4 w-4 fill-white" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                onClick={() => setLightboxOpen(true)}
                aria-label="View full image"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Previous / Next Arrow Controls */}
          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/60 hover:scale-105"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/60 hover:scale-105"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Thumbnail Navigation Row */}
        <div className="p-3 bg-card border-t border-border/50 flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto">
          {HONSOC_PHOTOS.map((photo, index) => (
            <button
              key={photo.url}
              onClick={() => setCurrentIndex(index)}
              className={`relative h-12 w-20 sm:h-14 sm:w-24 rounded-lg overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                index === currentIndex
                  ? "border-amber-500 ring-2 ring-amber-500/40 scale-105"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
              aria-label={`Go to slide ${index + 1}: ${photo.title}`}
            >
              <Image
                src={photo.url}
                alt={photo.title}
                fill
                className="object-cover"
                sizes="96px"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full h-10 w-10 z-50"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="relative max-w-5xl max-h-[85vh] w-full h-full flex flex-col items-center justify-center">
            <Image
              src={currentPhoto.url}
              alt={currentPhoto.alt}
              fill
              className="object-contain"
              sizes="100vw"
            />
            <div className="absolute bottom-4 p-4 rounded-xl bg-black/60 backdrop-blur-md text-white text-center max-w-xl">
              <p className="font-bold text-sm">{currentPhoto.title}</p>
              <p className="text-xs text-white/80">{currentPhoto.description}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
