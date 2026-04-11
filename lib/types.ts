/**
 * Central type definitions -- backward compatibility layer.
 * Types are now organized by feature in /features/*/types.ts
 * This file re-exports everything for existing imports.
 */

// Re-export shared types
export * from "@/shared/types"

// Re-export feature types
export * from "@/features/auth/types"
export * from "@/features/tutors/types"
export * from "@/features/sessions/types"
export * from "@/features/resources/types"
export * from "@/features/quizzes/types"
export * from "@/features/admin/types"
