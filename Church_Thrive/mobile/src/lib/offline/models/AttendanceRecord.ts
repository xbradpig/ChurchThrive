import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class AttendanceRecord extends Model {
  static table = 'attendance_records';

  @field('member_id') memberId!: string;
  @field('service_id') serviceId!: string;
  @field('date') date!: string;
  @field('status') status!: 'present' | 'absent' | 'excused';
  @field('notes') notes?: string;
  @field('recorded_by') recordedBy?: string;
  @field('sync_status') syncStatus!: 'synced' | 'pending' | 'conflict';
  @field('server_updated_at') serverUpdatedAt?: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
