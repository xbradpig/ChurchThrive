import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { migrations } from './migrations';
import {
  SermonNote,
  AttendanceRecord,
  Member,
  Sermon,
  Announcement,
} from './models';

// Create the SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true, // JSI mode for better performance on newer React Native
  onSetUpError: (error) => {
    console.error('WatermelonDB setup error:', error);
  },
});

// Create the database
export const database = new Database({
  adapter,
  modelClasses: [SermonNote, AttendanceRecord, Member, Sermon, Announcement],
});
