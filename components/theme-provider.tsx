/**
 * THEME PROVIDER - Light/Dark Mode Wrapper
 *
 * Wraps the next-themes ThemeProvider to provide light/dark mode support.
 * Must be a client component ("use client") because next-themes uses React context
 * and browser APIs (localStorage, matchMedia) to detect and persist the theme.
 *
 * Used in: app/layout.tsx (wraps the entire app)
 * Configuration: attribute="class" adds/removes "dark" class on <html>
 */
'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
