import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Sermon extends Model {
  static table = 'sermons';

  @field('church_id') churchId!: string;
  @field('title') title!: string;
  @field('preacher') preacher!: string;
  @field('date') date!: string;
  @field('bible_passage') biblePassage?: string;
  @field('audio_url') audioUrl?: string;
  @field('video_url') videoUrl?: string;
  @field('transcript') transcript?: string;
  @field('server_updated_at') serverUpdatedAt!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
