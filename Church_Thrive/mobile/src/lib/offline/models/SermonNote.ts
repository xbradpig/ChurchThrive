import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class SermonNote extends Model {
  static table = 'sermon_notes';

  @field('sermon_id') sermonId!: string;
  @field('member_id') memberId!: string;
  @field('title') title!: string;
  @field('content') content!: string;
  @field('audio_url') audioUrl?: string;
  @field('local_audio_path') localAudioPath?: string;
  @field('tags') tags?: string; // JSON string
  @field('is_favorite') isFavorite!: boolean;
  @field('sync_status') syncStatus!: 'synced' | 'pending' | 'conflict';
  @field('server_updated_at') serverUpdatedAt?: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  get tagList(): string[] {
    return this.tags ? JSON.parse(this.tags) : [];
  }
}
