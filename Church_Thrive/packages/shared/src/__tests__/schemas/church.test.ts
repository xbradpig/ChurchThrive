import { describe, it, expect } from 'vitest';
import {
  churchSchema,
  announcementSchema,
  cellGroupSchema,
  organizationSchema,
} from '../../schemas/church';

describe('church schemas', () => {
  describe('churchSchema', () => {
    it('should validate complete church data', () => {
      const validData = {
        name: '사랑의교회',
        denomination: '예장통합',
        address: '서울시 강남구',
        phone: '02-1234-5678',
        senior_pastor: '김목사',
        founded_year: 1980,
      };
      expect(() => churchSchema.parse(validData)).not.toThrow();
    });

    it('should validate minimal required data', () => {
      const validData = {
        name: '사랑의교회',
      };
      expect(() => churchSchema.parse(validData)).not.toThrow();
    });

    it('should reject short church name', () => {
      const invalidData = {
        name: '교',
      };
      expect(() => churchSchema.parse(invalidData)).toThrow('교회명은 2자 이상 입력해주세요');
    });

    it('should reject long church name', () => {
      const invalidData = {
        name: '가'.repeat(51),
      };
      expect(() => churchSchema.parse(invalidData)).toThrow();
    });

    it('should accept empty string for optional fields', () => {
      const validData = {
        name: '사랑의교회',
        denomination: '',
        address: '',
        phone: '',
        senior_pastor: '',
      };
      expect(() => churchSchema.parse(validData)).not.toThrow();
    });

    it('should validate founded_year as integer', () => {
      const validData = {
        name: '사랑의교회',
        founded_year: 1980,
      };
      expect(() => churchSchema.parse(validData)).not.toThrow();

      const invalidData = {
        name: '사랑의교회',
        founded_year: 1980.5,
      };
      expect(() => churchSchema.parse(invalidData)).toThrow();
    });

    it('should accept null for founded_year', () => {
      const validData = {
        name: '사랑의교회',
        founded_year: null,
      };
      expect(() => churchSchema.parse(validData)).not.toThrow();
    });
  });

  describe('announcementSchema', () => {
    it('should validate complete announcement data', () => {
      const validData = {
        title: '주일 예배 안내',
        content: '이번 주 주일 예배는 오전 10시에 있습니다.',
        target_groups: ['all', 'adults'],
        is_pinned: true,
        is_published: true,
      };
      expect(() => announcementSchema.parse(validData)).not.toThrow();
    });

    it('should validate minimal required data', () => {
      const validData = {
        title: '공지사항',
        content: '내용입니다.',
      };
      const result = announcementSchema.parse(validData);
      expect(result.is_pinned).toBe(false);
      expect(result.is_published).toBe(false);
    });

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        content: '내용입니다.',
      };
      expect(() => announcementSchema.parse(invalidData)).toThrow('제목을 입력해주세요');
    });

    it('should reject long title', () => {
      const invalidData = {
        title: '가'.repeat(201),
        content: '내용입니다.',
      };
      expect(() => announcementSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty content', () => {
      const invalidData = {
        title: '공지사항',
        content: '',
      };
      expect(() => announcementSchema.parse(invalidData)).toThrow('내용을 입력해주세요');
    });

    it('should validate target_groups as array', () => {
      const validData = {
        title: '공지사항',
        content: '내용입니다.',
        target_groups: ['youth', 'young_adults', 'seniors'],
      };
      expect(() => announcementSchema.parse(validData)).not.toThrow();
    });

    it('should default boolean fields to false', () => {
      const data = {
        title: '공지사항',
        content: '내용입니다.',
      };
      const result = announcementSchema.parse(data);
      expect(result.is_pinned).toBe(false);
      expect(result.is_published).toBe(false);
    });
  });

  describe('cellGroupSchema', () => {
    it('should validate complete cell group data', () => {
      const validData = {
        name: '1구역',
        leader_id: '123e4567-e89b-12d3-a456-426614174000',
        description: '청년 구역',
        meeting_day: '토요일',
        meeting_time: '오후 7시',
        meeting_place: '김철수 집사님 댁',
      };
      expect(() => cellGroupSchema.parse(validData)).not.toThrow();
    });

    it('should validate minimal required data', () => {
      const validData = {
        name: '1구역',
      };
      expect(() => cellGroupSchema.parse(validData)).not.toThrow();
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
      };
      expect(() => cellGroupSchema.parse(invalidData)).toThrow('구역명을 입력해주세요');
    });

    it('should reject long name', () => {
      const invalidData = {
        name: '가'.repeat(51),
      };
      expect(() => cellGroupSchema.parse(invalidData)).toThrow();
    });

    it('should accept empty string for optional fields', () => {
      const validData = {
        name: '1구역',
        description: '',
        meeting_day: '',
        meeting_time: '',
        meeting_place: '',
      };
      expect(() => cellGroupSchema.parse(validData)).not.toThrow();
    });

    it('should validate leader_id as UUID', () => {
      const validData = {
        name: '1구역',
        leader_id: '123e4567-e89b-12d3-a456-426614174000',
      };
      expect(() => cellGroupSchema.parse(validData)).not.toThrow();

      const invalidData = {
        name: '1구역',
        leader_id: 'not-a-uuid',
      };
      expect(() => cellGroupSchema.parse(invalidData)).toThrow();
    });

    it('should accept null for leader_id', () => {
      const validData = {
        name: '1구역',
        leader_id: null,
      };
      expect(() => cellGroupSchema.parse(validData)).not.toThrow();
    });
  });

  describe('organizationSchema', () => {
    it('should validate complete organization data', () => {
      const validData = {
        name: '교육부',
        type: 'department' as const,
        parent_id: '123e4567-e89b-12d3-a456-426614174000',
        description: '교회 교육을 담당하는 부서',
        sort_order: 1,
      };
      expect(() => organizationSchema.parse(validData)).not.toThrow();
    });

    it('should validate minimal required data', () => {
      const validData = {
        name: '교육부',
        type: 'department' as const,
      };
      const result = organizationSchema.parse(validData);
      expect(result.sort_order).toBe(0);
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        type: 'department' as const,
      };
      expect(() => organizationSchema.parse(invalidData)).toThrow('조직명을 입력해주세요');
    });

    it('should reject long name', () => {
      const invalidData = {
        name: '가'.repeat(51),
        type: 'department' as const,
      };
      expect(() => organizationSchema.parse(invalidData)).toThrow();
    });

    it('should validate type enum', () => {
      const validTypes = ['committee', 'department', 'group', 'team'];
      validTypes.forEach((type) => {
        const data = { name: '조직', type };
        expect(() => organizationSchema.parse(data)).not.toThrow();
      });

      const invalidData = {
        name: '조직',
        type: 'invalid',
      };
      expect(() => organizationSchema.parse(invalidData)).toThrow();
    });

    it('should validate parent_id as UUID', () => {
      const validData = {
        name: '교육부',
        type: 'department' as const,
        parent_id: '123e4567-e89b-12d3-a456-426614174000',
      };
      expect(() => organizationSchema.parse(validData)).not.toThrow();

      const invalidData = {
        name: '교육부',
        type: 'department' as const,
        parent_id: 'not-a-uuid',
      };
      expect(() => organizationSchema.parse(invalidData)).toThrow();
    });

    it('should accept null for parent_id', () => {
      const validData = {
        name: '교육부',
        type: 'department' as const,
        parent_id: null,
      };
      expect(() => organizationSchema.parse(validData)).not.toThrow();
    });

    it('should accept empty string for description', () => {
      const validData = {
        name: '교육부',
        type: 'department' as const,
        description: '',
      };
      expect(() => organizationSchema.parse(validData)).not.toThrow();
    });

    it('should default sort_order to 0', () => {
      const data = {
        name: '교육부',
        type: 'department' as const,
      };
      const result = organizationSchema.parse(data);
      expect(result.sort_order).toBe(0);
    });

    it('should validate sort_order as integer', () => {
      const validData = {
        name: '교육부',
        type: 'department' as const,
        sort_order: 5,
      };
      expect(() => organizationSchema.parse(validData)).not.toThrow();

      const invalidData = {
        name: '교육부',
        type: 'department' as const,
        sort_order: 5.5,
      };
      expect(() => organizationSchema.parse(invalidData)).toThrow();
    });
  });
});
