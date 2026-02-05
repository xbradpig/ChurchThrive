import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    // Sermon Notes - Personal data, offline-first
    tableSchema({
      name: 'sermon_notes',
      columns: [
        { name: 'sermon_id', type: 'string', isIndexed: true },
        { name: 'member_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'audio_url', type: 'string', isOptional: true },
        { name: 'local_audio_path', type: 'string', isOptional: true },
        { name: 'tags', type: 'string', isOptional: true }, // JSON array
        { name: 'is_favorite', type: 'boolean' },
        { name: 'sync_status', type: 'string' }, // 'synced', 'pending', 'conflict'
        { name: 'server_updated_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Attendance Records - Bidirectional sync
    tableSchema({
      name: 'attendance_records',
      columns: [
        { name: 'member_id', type: 'string', isIndexed: true },
        { name: 'service_id', type: 'string', isIndexed: true },
        { name: 'date', type: 'string', isIndexed: true },
        { name: 'status', type: 'string' }, // 'present', 'absent', 'excused'
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'recorded_by', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string' },
        { name: 'server_updated_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Members - Read-only cache (server wins)
    tableSchema({
      name: 'members',
      columns: [
        { name: 'church_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'photo_url', type: 'string', isOptional: true },
        { name: 'role', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'groups', type: 'string', isOptional: true }, // JSON array
        { name: 'server_updated_at', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Sermons - Read-only cache
    tableSchema({
      name: 'sermons',
      columns: [
        { name: 'church_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'preacher', type: 'string' },
        { name: 'date', type: 'string', isIndexed: true },
        { name: 'bible_passage', type: 'string', isOptional: true },
        { name: 'audio_url', type: 'string', isOptional: true },
        { name: 'video_url', type: 'string', isOptional: true },
        { name: 'transcript', type: 'string', isOptional: true },
        { name: 'server_updated_at', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Announcements - Read-only cache
    tableSchema({
      name: 'announcements',
      columns: [
        { name: 'church_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'is_pinned', type: 'boolean' },
        { name: 'is_published', type: 'boolean' },
        { name: 'author_id', type: 'string' },
        { name: 'server_updated_at', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
