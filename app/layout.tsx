/**
 * ==========================================================================
 * ROOT LAYOUT - The Top-Level Layout for the Entire App
 * ==========================================================================
 *
 * PURPOSE: This is the ROOT layout that wraps EVERY page in the app.
 * It provides:
 * 1. Font loading (Geist + Geist Mono from Google Fonts)
 * 2. Global CSS (globals.css includes Tailwind + design tokens)
 * 3. Theme Provider (light/dark mode support via next-themes)
 * 4. Toast notifications (Sonner, positioned top-right)
 * 5. Vercel Analytics tracking
 *
 * METADATA:
 * - title.default: "ScholarMe" (shown on pages without their own title)
 * - title.template: "%s | ScholarMe" (child pages can set their own title)
 *
 * VIEWPORT:
 * - themeColor: Sets the browser toolbar color (different for light/dark)
 * - userScalable: true (accessible -- lets users zoom on mobile)
 *
 * THEME PROVIDER:
 * - attribute="class": Adds "dark" class to <html> for dark mode
 * - defaultTheme="system": Follows user's OS preference by default
 * - suppressHydrationWarning on <html>: Prevents React hydration warning
 *   caused by next-themes adding the "dark" class on the server
 * ==========================================================================
 */
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

// Load fonts -- the CSS variables are configured in globals.css via @theme
const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

/** SEO metadata -- Next.js automatically generates <head> tags from this */
export const metadata: Metadata = {
  title: {
    default: 'ScholarMe',
    template: '%s | ScholarMe',   // Child pages: export metadata = { title: "Dashboard" }
  },
  description: 'Tutoring management platform - connecting learners with tutors for academic success.',
}

/** Viewport configuration for mobile browsers */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f0f4ff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a2e' },
  ],
  userScalable: true,  // Accessibility: allow pinch-to-zoom
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {/* ThemeProvider wraps the app to provide light/dark mode context */}
        <ThemeProvider
          attribute="class"       // Adds class="dark" to <html> for dark mode
          defaultTheme="system"   // Use OS preference by default
          enableSystem            // Listen for OS theme changes
          disableTransitionOnChange  // Prevent flash when switching themes
        >
          {children}
          {/* Global toast notification container */}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        {/* Vercel Analytics -- automatically tracks page views */}
        <Analytics />
      </body>
    </html>
  )
}
