/** Quizzes feature type definitions */

export type QuizType = "flashcard" | "multiple_choice" | "true_false"
export type QuizDifficulty = "easy" | "medium" | "hard"
export type QuizVisibility = "private" | "shared"

export interface Quiz {
  id: string
  owner_id: string
  title: string
  description: string | null
  quiz_type: QuizType
  difficulty: QuizDifficulty
  visibility: QuizVisibility
  question_count: number
  created_at: string
  updated_at: string
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question: string
  answer: string
  options?: string[] // For multiple choice
  order_index: number
  created_at: string
}

export interface QuizAttempt {
  id: string
  user_id: string
  quiz_id: string
  score: number
  total_items: number
  answers: Record<string, string>
  completed_at: string | null
  created_at: string
}
