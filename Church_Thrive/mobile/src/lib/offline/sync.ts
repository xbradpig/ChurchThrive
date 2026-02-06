import { supabase } from '@/lib/supabase/client';
import NetInfo from '@react-native-community/netinfo';
import { database } from './database';
import { Q } from '@nozbe/watermelondb';
import SermonNote from './models/SermonNote';
import AttendanceRecord from './models/AttendanceRecord';
import Member from './models/Member';
import Sermon from './models/Sermon';
import Announcement from './models/Announcement';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncResult {
  synced: number;
  failed: number;
  conflicts: number;
}

export interface SyncState {
  status: SyncStatus;
  lastSync: Date | null;
  error: string | null;
}

export class MobileSyncManager {
  private syncState: SyncState = {
    status: 'idle',
    lastSync: null,
    error: null,
  };

  private listeners: Array<(state: SyncState) => void> = [];

  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private updateState(partial: Partial<SyncState>) {
    this.syncState = { ...this.syncState, ...partial };
    this.listeners.forEach((l) => l(this.syncState));
  }

  async isConnected(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  }

  /**
   * Sync sermon notes (client wins for conflicts on personal notes)
   */
  async syncPendingNotes(): Promise<SyncResult> {
    if (!(await this.isConnected())) return { synced: 0, failed: 0, conflicts: 0 };

    const result: SyncResult = { synced: 0, failed: 0, conflicts: 0 };

    try {
      const notesCollection = database.get<SermonNote>('sermon_notes');
      const pendingNotes = await notesCollection
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      for (const note of pendingNotes) {
        try {
          // Check if exists on server
          const { data: serverNote } = await supabase
            .from('sermon_notes')
            .select('*')
            .eq('id', note.id)
            .single();

          if (serverNote) {
            // Update existing (client wins)
            const { error } = await supabase
              .from('sermon_notes')
              .update({
                title: note.title,
                content: note.content,
                audio_url: note.audioUrl,
                tags: note.tags ? JSON.parse(note.tags) : [],
                is_favorite: note.isFavorite,
                updated_at: new Date(note.updatedAt).toISOString(),
              })
              .eq('id', note.id);

            if (error) throw error;
          } else {
            // Insert new
            const { error } = await supabase.from('sermon_notes').insert({
              id: note.id,
              sermon_id: note.sermonId,
              member_id: note.memberId,
              title: note.title,
              content: note.content,
              audio_url: note.audioUrl,
              tags: note.tags ? JSON.parse(note.tags) : [],
              is_favorite: note.isFavorite,
              created_at: new Date(note.createdAt).toISOString(),
              updated_at: new Date(note.updatedAt).toISOString(),
            });

            if (error) throw error;
          }

          // Mark as synced locally
          await database.write(async () => {
            await note.update((n) => {
              n.syncStatus = 'synced';
              n.serverUpdatedAt = Date.now();
            });
          });

          result.synced++;
        } catch (err) {
          console.error('Failed to sync note:', note.id, err);
          result.failed++;
        }
      }
    } catch (err) {
      console.error('Note sync error:', err);
    }

    return result;
  }

  /**
   * Sync attendance records (server wins for conflicts on admin data)
   */
  async syncPendingAttendances(): Promise<SyncResult> {
    if (!(await this.isConnected())) return { synced: 0, failed: 0, conflicts: 0 };

    const result: SyncResult = { synced: 0, failed: 0, conflicts: 0 };

    try {
      const attendanceCollection = database.get<AttendanceRecord>('attendance_records');
      const pendingRecords = await attendanceCollection
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      for (const record of pendingRecords) {
        try {
          // Check if exists on server
          const { data: serverRecord } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('id', record.id)
            .single();

          if (serverRecord) {
            // Conflict: server wins for admin data
            const serverUpdated = new Date(serverRecord.updated_at).getTime();
            const localUpdated = new Date(record.updatedAt).getTime();

            if (serverUpdated > localUpdated) {
              // Server is newer, update local
              await database.write(async () => {
                await record.update((r) => {
                  r.status = serverRecord.status;
                  r.notes = serverRecord.notes;
                  r.syncStatus = 'synced';
                  r.serverUpdatedAt = serverUpdated;
                });
              });
              result.conflicts++;
            } else {
              // Local is newer or equal, push to server
              const { error } = await supabase
                .from('attendance_records')
                .update({
                  status: record.status,
                  notes: record.notes,
                  updated_at: new Date(record.updatedAt).toISOString(),
                })
                .eq('id', record.id);

              if (error) throw error;

              await database.write(async () => {
                await record.update((r) => {
                  r.syncStatus = 'synced';
                  r.serverUpdatedAt = Date.now();
                });
              });
              result.synced++;
            }
          } else {
            // Insert new
            const { error } = await supabase.from('attendance_records').insert({
              id: record.id,
              member_id: record.memberId,
              service_id: record.serviceId,
              date: record.date,
              status: record.status,
              notes: record.notes,
              recorded_by: record.recordedBy,
              created_at: new Date(record.createdAt).toISOString(),
              updated_at: new Date(record.updatedAt).toISOString(),
            });

            if (error) throw error;

            await database.write(async () => {
              await record.update((r) => {
                r.syncStatus = 'synced';
                r.serverUpdatedAt = Date.now();
              });
            });
            result.synced++;
          }
        } catch (err) {
          console.error('Failed to sync attendance:', record.id, err);
          result.failed++;
        }
      }
    } catch (err) {
      console.error('Attendance sync error:', err);
    }

    return result;
  }

  /**
   * Pull read-only data from server (members, sermons, announcements)
   */
  async pullServerData(churchId: string): Promise<void> {
    if (!(await this.isConnected())) return;

    try {
      // Pull members
      const { data: members } = await supabase
        .from('members')
        .select('*')
        .eq('church_id', churchId)
        .eq('status', 'active');

      if (members) {
        await database.write(async () => {
          const membersCollection = database.get<Member>('members');
          for (const m of members) {
            const existing = await membersCollection.find(m.id).catch(() => null);
            if (existing) {
              await existing.update((member) => {
                member.name = m.name;
                member.email = m.email;
                member.phone = m.phone;
                member.photoUrl = m.photo_url;
                member.role = m.role;
                member.status = m.status;
                member.groups = JSON.stringify(m.groups || []);
                member.serverUpdatedAt = new Date(m.updated_at).getTime();
              });
            } else {
              await membersCollection.create((member) => {
                (member as any)._raw.id = m.id;
                member.churchId = m.church_id;
                member.userId = m.user_id;
                member.name = m.name;
                member.email = m.email;
                member.phone = m.phone;
                member.photoUrl = m.photo_url;
                member.role = m.role;
                member.status = m.status;
                member.groups = JSON.stringify(m.groups || []);
                member.serverUpdatedAt = new Date(m.updated_at).getTime();
              });
            }
          }
        });
      }

      // Pull sermons (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: sermons } = await supabase
        .from('sermons')
        .select('*')
        .eq('church_id', churchId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (sermons) {
        await database.write(async () => {
          const sermonsCollection = database.get<Sermon>('sermons');
          for (const s of sermons) {
            const existing = await sermonsCollection.find(s.id).catch(() => null);
            if (existing) {
              await existing.update((sermon) => {
                sermon.title = s.title;
                sermon.preacher = s.preacher;
                sermon.date = s.date;
                sermon.biblePassage = s.bible_passage;
                sermon.audioUrl = s.audio_url;
                sermon.videoUrl = s.video_url;
                sermon.transcript = s.transcript;
                sermon.serverUpdatedAt = new Date(s.updated_at).getTime();
              });
            } else {
              await sermonsCollection.create((sermon) => {
                (sermon as any)._raw.id = s.id;
                sermon.churchId = s.church_id;
                sermon.title = s.title;
                sermon.preacher = s.preacher;
                sermon.date = s.date;
                sermon.biblePassage = s.bible_passage;
                sermon.audioUrl = s.audio_url;
                sermon.videoUrl = s.video_url;
                sermon.transcript = s.transcript;
                sermon.serverUpdatedAt = new Date(s.updated_at).getTime();
              });
            }
          }
        });
      }

      // Pull announcements (last 14 days)
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .eq('church_id', churchId)
        .eq('is_published', true)
        .gte('created_at', fourteenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (announcements) {
        await database.write(async () => {
          const announcementsCollection = database.get<Announcement>('announcements');
          for (const a of announcements) {
            const existing = await announcementsCollection.find(a.id).catch(() => null);
            if (existing) {
              await existing.update((announcement) => {
                announcement.title = a.title;
                announcement.content = a.content;
                announcement.isPinned = a.is_pinned;
                announcement.isPublished = a.is_published;
                announcement.authorId = a.author_id;
                announcement.serverUpdatedAt = new Date(a.updated_at).getTime();
              });
            } else {
              await announcementsCollection.create((announcement) => {
                (announcement as any)._raw.id = a.id;
                announcement.churchId = a.church_id;
                announcement.title = a.title;
                announcement.content = a.content;
                announcement.isPinned = a.is_pinned;
                announcement.isPublished = a.is_published;
                announcement.authorId = a.author_id;
                announcement.serverUpdatedAt = new Date(a.updated_at).getTime();
              });
            }
          }
        });
      }
    } catch (err) {
      console.error('Pull server data error:', err);
      throw err;
    }
  }

  /**
   * Full bidirectional sync
   */
  async syncAll(churchId?: string): Promise<void> {
    if (this.syncState.status === 'syncing') {
      console.log('Sync already in progress');
      return;
    }

    this.updateState({ status: 'syncing', error: null });

    try {
      const [noteResult, attResult] = await Promise.all([
        this.syncPendingNotes(),
        this.syncPendingAttendances(),
      ]);

      if (churchId) {
        await this.pullServerData(churchId);
      }

      this.updateState({
        status: 'success',
        lastSync: new Date(),
      });

      console.log('Mobile sync complete:', {
        notes: noteResult,
        attendances: attResult,
      });
    } catch (err) {
      console.error('Sync error:', err);
      this.updateState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown sync error',
      });
    }
  }
}

export const mobileSyncManager = new MobileSyncManager();
