import { db, type OfflineNote, type OfflineAttendance } from './db';
import { createClient } from '@/lib/supabase/client';

export class SyncManager {
  private supabase = createClient();

  async syncNotes(): Promise<{ synced: number; failed: number }> {
    const pendingNotes = await db.notes.where('syncStatus').equals('pending').toArray();
    let synced = 0;
    let failed = 0;

    for (const note of pendingNotes) {
      try {
        const { error } = await this.supabase.from('sermon_notes').upsert({
          id: note.id,
          title: note.title,
          content: note.content,
          sermon_id: note.sermonId || null,
          is_shared: note.isShared,
        });

        if (error) throw error;

        // Upload audio if exists
        if (note.audioChunks && note.audioChunks.length > 0) {
          const audioBlob = new Blob(note.audioChunks, { type: 'audio/webm' });
          const filePath = `notes/${note.id}/audio.webm`;
          await this.supabase.storage.from('audio').upload(filePath, audioBlob, { upsert: true });

          const { data: urlData } = this.supabase.storage.from('audio').getPublicUrl(filePath);
          await this.supabase.from('sermon_notes').update({ audio_url: urlData.publicUrl }).eq('id', note.id);
        }

        await db.notes.update(note.id, { syncStatus: 'synced' });
        synced++;
      } catch (err) {
        console.error('Failed to sync note:', note.id, err);
        failed++;
      }
    }

    return { synced, failed };
  }

  async syncAttendances(): Promise<{ synced: number; failed: number }> {
    const pending = await db.attendances.where('syncStatus').equals('pending').toArray();
    let synced = 0;
    let failed = 0;

    for (const att of pending) {
      try {
        const { error } = await this.supabase.from('attendances').upsert({
          id: att.id,
          member_id: att.memberId,
          event_type: att.eventType,
          event_date: att.eventDate,
          status: att.status,
        });

        if (error) throw error;
        await db.attendances.update(att.id, { syncStatus: 'synced' });
        synced++;
      } catch (err) {
        console.error('Failed to sync attendance:', att.id, err);
        failed++;
      }
    }

    return { synced, failed };
  }

  async syncAll(): Promise<void> {
    const [noteResult, attResult] = await Promise.all([
      this.syncNotes(),
      this.syncAttendances(),
    ]);
    console.log('Sync complete:', { notes: noteResult, attendances: attResult });
  }

  async cacheMembersForOffline(): Promise<number> {
    const { data: members, error } = await this.supabase
      .from('members')
      .select('id, name, name_chosung, phone, position, role, status, photo_url')
      .eq('status', 'active')
      .order('name');

    if (error || !members) return 0;

    const now = new Date().toISOString();
    await db.members.clear();
    await db.members.bulkAdd(
      members.map(m => ({
        id: m.id,
        name: m.name,
        nameChosung: m.name_chosung || '',
        phone: m.phone || '',
        position: m.position || '',
        role: m.role,
        status: m.status,
        photoUrl: m.photo_url,
        syncStatus: 'synced' as const,
        cachedAt: now,
      }))
    );

    return members.length;
  }
}

export const syncManager = new SyncManager();
