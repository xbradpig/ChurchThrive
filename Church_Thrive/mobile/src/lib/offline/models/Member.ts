import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Member extends Model {
  static table = 'members';

  @field('church_id') churchId!: string;
  @field('user_id') userId?: string;
  @field('name') name!: string;
  @field('email') email?: string;
  @field('phone') phone?: string;
  @field('photo_url') photoUrl?: string;
  @field('role') role!: string;
  @field('status') status!: string;
  @field('groups') groups?: string; // JSON string
  @field('server_updated_at') serverUpdatedAt!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  get groupList(): string[] {
    return this.groups ? JSON.parse(this.groups) : [];
  }
}
