export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  room_id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to: string | null;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  is_archived?: boolean;
}

export interface Document {
  id: string;
  room_id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  is_archived?: boolean;
}

export interface Note {
  id: string;
  room_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  archived_at?: string | null;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  ai_processed: boolean;
}

export interface Decision {
  id: string;
  room_id: string;
  title: string;
  content: string;
  status: string;
  confidence: number;
  participants: string[];
  messagesSinceCandidate?: number;
  created_at: string;
  updated_at: string;
}
