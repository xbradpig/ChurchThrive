import type { Database } from './database';

export type Sermon = Database['public']['Tables']['sermons']['Row'];
export type SermonInsert = Database['public']['Tables']['sermons']['Insert'];
export type SermonNote = Database['public']['Tables']['sermon_notes']['Row'];
export type SermonNoteInsert = Database['public']['Tables']['sermon_notes']['Insert'];
export type NoteFeedback = Database['public']['Tables']['note_feedbacks']['Row'];

export type ServiceType = 'sunday_morning' | 'sunday_evening' | 'wednesday' | 'friday' | 'dawn' | 'special' | 'other';
export type SttStatus = 'pending' | 'processing' | 'completed' | 'failed';

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  sunday_morning: '주일 오전',
  sunday_evening: '주일 오후',
  wednesday: '수요예배',
  friday: '금요예배',
  dawn: '새벽예배',
  special: '특별예배',
  other: '기타',
};

export interface NoteContentBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'bullet' | 'numbered' | 'quote' | 'bible_verse' | 'highlight';
  content: string;
  metadata?: {
    level?: number;
    verseRef?: string;
    color?: string;
  };
}

export interface NoteListFilter {
  search?: string;
  sermonId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  sortBy?: 'created_at' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface SermonNoteWithDetails extends SermonNote {
  sermon?: Sermon | null;
  member?: { id: string; name: string; photo_url: string | null };
  feedbacks?: NoteFeedback[];
}
