const GENERATION_MODES = [
  "flashcard",
  "multiple_choice",
  "true_false",
  "identification",
  "matching",
  "mixed",
] as const

export function toGenerationMode(type?: string | null): string {
  if (type && (GENERATION_MODES as readonly string[]).includes(type)) {
    return type
  }
  return "flashcard"
}

export function buildStudySetInsert(
  userId: string,
  fields: {
    title: string
    description?: string | null
    type?: string | null
    is_public?: boolean
    source_type?: string
    source_resource_id?: string | null
  }
) {
  return {
    user_id: userId,
    owner_id: userId,
    title: fields.title,
    description: fields.description ?? null,
    generation_mode: toGenerationMode(fields.type),
    is_public: fields.is_public ?? false,
    source_type: fields.source_type ?? "manual",
    source_resource_id: fields.source_resource_id ?? null,
  }
}

export function buildStudySetItemInsert(
  studySetId: string,
  item: {
    question: string
    answer: string
    options?: unknown
    item_type?: string
  },
  index: number
) {
  const rawType = item.item_type === "mixed" ? "flashcard" : item.item_type
  const itemType = rawType || "flashcard"
  return {
    study_set_id: studySetId,
    question: item.question,
    prompt: item.question,
    answer: item.answer,
    options: item.options ?? null,
    item_type: itemType,
    order_index: index,
    display_order: index,
  }
}

export const STUDY_SET_LIST_SELECT = `
  *,
  type:generation_mode,
  study_set_items(count),
  profiles:user_id(full_name, avatar_url)
`

export const STUDY_SET_DETAIL_SELECT = `
  *,
  type:generation_mode,
  study_set_items(*),
  profiles:user_id(full_name, avatar_url)
`
