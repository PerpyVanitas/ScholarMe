/** Root layout -- fonts, theme provider, analytics, and global styles. Build v2. */
import "@/lib/env";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PwaRegistration } from "@/components/pwa-registration";

import "./globals.css";

// Per SSD Section 7.0: Inter font family, responsive sizing
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: { default: "ScholarMe", template: "%s | ScholarMe" },
  description:
    "Tutoring management platform -- connecting learners with tutors for academic success.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ScholarMe",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0f4ff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a2744" },
  ],
  userScalable: true,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") || undefined;
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      nonce={nonce}
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={0}>
            {children}

            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
        <PwaRegistration />
        <Analytics />
      </body>
    </html>
  );
}
