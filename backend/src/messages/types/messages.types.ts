export interface ChatConversationEntity {
  id: string;
  property_id: string | null;
  guest_id: string;
  host_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface ChatMessageEntity {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string | null;
}

export interface ChatReportEntity {
  id: string;
  reporter_id: string | null;
  reported_id: string | null;
  conversation_id: string | null;
  reason: string;
  description?: string | null;
  details?: string | null;
  status: string | null;
  created_at: string | null;
  updated_at?: string | null;
}

export interface ProfileSummary {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string | null;
}

export interface PropertySummary {
  id: string;
  title: string;
  images: string[] | null;
}

export interface EnrichedConversation extends ChatConversationEntity {
  guest?: ProfileSummary | null;
  host?: ProfileSummary | null;
  other_user?: ProfileSummary | null;
  property?: PropertySummary | null;
  last_message?: ChatMessageEntity | null;
  unread_count: number;
}
