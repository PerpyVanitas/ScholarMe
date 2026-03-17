export type GenerationMode = "flashcard" | "multiple_choice" | "true_false" | "identification" | "matching" | "mixed";
export type Difficulty = "easy" | "medium" | "hard";
export type Visibility = "private" | "shared";
export type ItemType = "flashcard" | "multiple_choice" | "true_false" | "identification" | "matching";
export type SourceType = "resource" | "upload";

export interface StudySet {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  source_type: SourceType;
  source_id?: string;
  visibility: Visibility;
  generation_mode: GenerationMode;
  difficulty: Difficulty;
  question_count: number;
  tags: string[];
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudySetItem {
  id: string;
  study_set_id: string;
  item_type: ItemType;
  prompt: string;
  answer: string;
  options?: string[] | null;
  explanation?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  study_set_id: string;
  score: number;
  total_items: number;
  answers: Record<string, {
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
  completed_at: string;
  created_at: string;
}

export interface UserUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  extracted_content: string;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
}
