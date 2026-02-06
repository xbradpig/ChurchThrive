import Dexie, { type Table } from 'dexie';

export interface OfflineNote {
  id: string;
  title: string;
  content: any;
  sermonId?: string;
  audioChunks?: Blob[];
  isShared: boolean;
  syncStatus: 'pending' | 'synced' | 'conflict';
  createdAt: string;
  updatedAt: string;
}

export interface OfflineMember {
  id: string;
  name: string;
  nameChosung: string;
  phone: string;
  position: string;
  role: string;
  status: string;
  photoUrl?: string;
  syncStatus: 'synced' | 'stale';
  cachedAt: string;
}

export interface OfflineAttendance {
  id: string;
  memberId: string;
  eventType: string;
  eventDate: string;
  status: 'present' | 'absent' | 'late';
  syncStatus: 'pending' | 'synced';
  createdAt: string;
}

export class ChurchThriveDB extends Dexie {
  notes!: Table<OfflineNote, string>;
  members!: Table<OfflineMember, string>;
  attendances!: Table<OfflineAttendance, string>;

  constructor() {
    super('ChurchThriveDB');
    this.version(1).stores({
      notes: 'id, syncStatus, createdAt, updatedAt',
      members: 'id, name, nameChosung, syncStatus, cachedAt',
      attendances: 'id, memberId, eventDate, syncStatus',
    });
  }
}

export const db = new ChurchThriveDB();
