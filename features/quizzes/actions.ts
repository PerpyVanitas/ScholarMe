"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { StudySet, StudySetItem, QuizAttempt } from "./types"

// ============================================
// Study Set CRUD Operations
// ============================================

export async function createStudySet(data: {
  title: string
  description?: string
  type: "flashcard" | "multiple_choice" | "true_false" | "mixed"
  is_public: boolean
  source_type: "manual" | "resource" | "upload"
  source_resource_id?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: studySet, error } = await supabase
    .from("study_sets")
    .insert({
      user_id: user.id,
      title: data.title,
      description: data.description || null,
      type: data.type,
      is_public: data.is_public,
      source_type: data.source_type,
      source_resource_id: data.source_resource_id || null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/quizzes")
  return { data: studySet }
}

export async function getMyStudySets() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: "Not authenticated", data: [] }
  }

  const { data, error } = await supabase
    .from("study_sets")
    .select(`
      *,
      study_set_items(count),
      profiles:user_id(full_name, avatar_url)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message, data: [] }
  }

  return { data: data || [] }
}

export async function getPublicStudySets() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("study_sets")
    .select(`
      *,
      study_set_items(count),
      profiles:user_id(full_name, avatar_url)
    `)
    .eq("is_public", true)
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message, data: [] }
  }

  return { data: data || [] }
}

export async function getStudySetById(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from("study_sets")
    .select(`
      *,
      study_set_items(*),
      profiles:user_id(full_name, avatar_url)
    `)
    .eq("id", id)
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  // Check access: owner or public
  if (!data.is_public && data.user_id !== user?.id) {
    return { error: "Access denied", data: null }
  }

  return { data }
}

export async function deleteStudySet(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("study_sets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/quizzes")
  return { success: true }
}

// ============================================
// Study Set Items Operations
// ============================================

export async function addStudySetItems(studySetId: string, items: Omit<StudySetItem, "id" | "study_set_id" | "created_at">[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: "Not authenticated" }
  }

  // Verify ownership
  const { data: studySet } = await supabase
    .from("study_sets")
    .select("user_id")
    .eq("id", studySetId)
    .single()

  if (!studySet || studySet.user_id !== user.id) {
    return { error: "Access denied" }
  }

  const itemsWithSetId = items.map((item, index) => ({
    ...item,
    study_set_id: studySetId,
    order_index: index,
  }))

  const { data, error } = await supabase
    .from("study_set_items")
    .insert(itemsWithSetId)
    .select()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/quizzes/study/${studySetId}`)
  return { data }
}

export async function updateStudySetItem(itemId: string, updates: Partial<StudySetItem>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("study_set_items")
    .update(updates)
    .eq("id", itemId)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function deleteStudySetItem(itemId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("study_set_items")
    .delete()
    .eq("id", itemId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// ============================================
// Quiz Attempt Operations
// ============================================

export async function submitQuizAttempt(data: {
  study_set_id: string
  score: number
  total_questions: number
  answers: Record<string, string>
  time_spent_seconds: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: attempt, error } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: user.id,
      study_set_id: data.study_set_id,
      score: data.score,
      total_questions: data.total_questions,
      answers: data.answers,
      time_spent_seconds: data.time_spent_seconds,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/quizzes/study/${data.study_set_id}`)
  return { data: attempt }
}

export async function getMyQuizAttempts(studySetId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: "Not authenticated", data: [] }
  }

  let query = supabase
    .from("quiz_attempts")
    .select(`
      *,
      study_sets(title, type)
    `)
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })

  if (studySetId) {
    query = query.eq("study_set_id", studySetId)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message, data: [] }
  }

  return { data: data || [] }
}
