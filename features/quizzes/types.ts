/** Quizzes feature type definitions - matches database schema */

export type StudySetType = "flashcard" | "multiple_choice" | "true_false" | "mixed"
export type SourceType = "manual" | "resource" | "upload"

export interface StudySet {
  id: string
  user_id: string
  title: string
  description: string | null
  type: StudySetType
  is_public: boolean
  source_type: SourceType
  source_resource_id: string | null
  created_at: string
  updated_at: string
  // Joined fields
  study_set_items?: StudySetItem[]
  profiles?: {
    full_name: string
    avatar_url: string | null
  }
}

export interface StudySetItem {
  id: string
  study_set_id: string
  question: string
  answer: string
  options: string[] | null
  item_type: "flashcard" | "multiple_choice" | "true_false"
  order_index: number
  created_at: string
}

export interface QuizAttempt {
  id: string
  user_id: string
  study_set_id: string
  score: number
  total_questions: number
  answers: Record<string, string>
  time_spent_seconds: number | null
  completed_at: string
  created_at: string
  // Joined fields
  study_sets?: {
    title: string
    type: StudySetType
  }
}

// Form types for creating study sets
export interface CreateStudySetForm {
  title: string
  description: string
  type: StudySetType
  is_public: boolean
  source_type: SourceType
  source_resource_id?: string
  items: CreateStudySetItemForm[]
}

export interface CreateStudySetItemForm {
  question: string
  answer: string
  options?: string[]
  item_type: "flashcard" | "multiple_choice" | "true_false"
}
