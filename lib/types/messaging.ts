/** Feature types: messaging — conversations and messages */

import type { Profile } from "./auth"

export interface ConversationParticipant {
  profile_id: string
  profiles?: Profile
}

export interface Conversation {
  id: string
  title?: string | null
  participant_id?: string
  conversation_participants?: ConversationParticipant[]
  messages?: ConversationMessage[]
  profiles?: Profile
  created_at: string
  updated_at: string
}

export interface ConversationMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: Profile
  profiles?: Profile
}

/** Alias for backward compatibility — prefer ConversationMessage for new code */
export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  profiles?: { id: string; full_name: string; avatar_url: string | null } | null
}
