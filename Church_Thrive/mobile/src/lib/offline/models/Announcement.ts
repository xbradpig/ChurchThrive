import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Announcement extends Model {
  static table = 'announcements';

  @field('church_id') churchId!: string;
  @field('title') title!: string;
  @field('content') content!: string;
  @field('is_pinned') isPinned!: boolean;
  @field('is_published') isPublished!: boolean;
  @field('author_id') authorId!: string;
  @field('server_updated_at') serverUpdatedAt!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
