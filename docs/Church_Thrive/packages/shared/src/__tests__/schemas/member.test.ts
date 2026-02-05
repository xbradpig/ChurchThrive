import { describe, it, expect } from 'vitest';
import {
  memberSchema,
  memberSearchSchema,
  qrRegistrationSchema,
} from '../../schemas/member';

describe('member schemas', () => {
  describe('memberSchema', () => {
    it('should validate complete member data', () => {
      const validData = {
        name: '김철수',
        phone: '010-1234-5678',
        email: 'kim@example.com',
        address: '서울시 강남구',
        birth_date: '1990-01-01',
        gender: 'male' as const,
        baptism_date: '2010-05-01',
        position: 'deacon' as const,
        cell_group_id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'member' as const,
      };
      expect(() => memberSchema.parse(validData)).not.toThrow();
    });

    it('should validate minimal required data', () => {
      const validData = {
        name: '김철수',
        phone: '01012345678',
      };
      expect(() => memberSchema.parse(validData)).not.toThrow();
    });

    it('should reject short name', () => {
      const invalidData = {
        name: '김',
        phone: '010-1234-5678',
      };
      expect(() => memberSchema.parse(invalidData)).toThrow('이름은 2자 이상 입력해주세요');
    });

    it('should reject long name', () => {
      const invalidData = {
        name: '가'.repeat(21),
        phone: '010-1234-5678',
      };
      expect(() => memberSchema.parse(invalidData)).toThrow('이름은 20자 이하로 입력해주세요');
    });

    it('should validate various phone formats', () => {
      const validPhones = [
        '010-1234-5678',
        '01012345678',
        '010-123-4567',
        '011-1234-5678',
      ];

      validPhones.forEach((phone) => {
        const data = { name: '김철수', phone };
        expect(() => memberSchema.parse(data)).not.toThrow();
      });
    });

    it('should reject invalid phone format', () => {
      const invalidPhones = ['123-4567', '1234567890', '020-1234-5678'];

      invalidPhones.forEach((phone) => {
        const data = { name: '김철수', phone };
        expect(() => memberSchema.parse(data)).toThrow();
      });
    });

    it('should validate email format when provided', () => {
      const invalidData = {
        name: '김철수',
        phone: '010-1234-5678',
        email: 'invalid-email',
      };
      expect(() => memberSchema.parse(invalidData)).toThrow('올바른 이메일을 입력해주세요');
    });

    it('should accept empty string for optional fields', () => {
      const validData = {
        name: '김철수',
        phone: '010-1234-5678',
        email: '',
        address: '',
        birth_date: '',
        baptism_date: '',
      };
      expect(() => memberSchema.parse(validData)).not.toThrow();
    });

    it('should validate gender enum', () => {
      const validGenders = ['male', 'female', null];
      validGenders.forEach((gender) => {
        const data = { name: '김철수', phone: '010-1234-5678', gender };
        expect(() => memberSchema.parse(data)).not.toThrow();
      });

      const invalidData = {
        name: '김철수',
        phone: '010-1234-5678',
        gender: 'other',
      };
      expect(() => memberSchema.parse(invalidData)).toThrow();
    });

    it('should validate position enum', () => {
      const validPositions = ['elder', 'ordained_deacon', 'deacon', 'saint', null];
      validPositions.forEach((position) => {
        const data = { name: '김철수', phone: '010-1234-5678', position };
        expect(() => memberSchema.parse(data)).not.toThrow();
      });
    });

    it('should validate role enum', () => {
      const validRoles = ['admin', 'pastor', 'staff', 'leader', 'member'];
      validRoles.forEach((role) => {
        const data = { name: '김철수', phone: '010-1234-5678', role };
        expect(() => memberSchema.parse(data)).not.toThrow();
      });
    });

    it('should default role to member', () => {
      const data = { name: '김철수', phone: '010-1234-5678' };
      const result = memberSchema.parse(data);
      expect(result.role).toBe('member');
    });

    it('should validate UUID for cell_group_id', () => {
      const validData = {
        name: '김철수',
        phone: '010-1234-5678',
        cell_group_id: '123e4567-e89b-12d3-a456-426614174000',
      };
      expect(() => memberSchema.parse(validData)).not.toThrow();

      const invalidData = {
        name: '김철수',
        phone: '010-1234-5678',
        cell_group_id: 'not-a-uuid',
      };
      expect(() => memberSchema.parse(invalidData)).toThrow();
    });
  });

  describe('memberSearchSchema', () => {
    it('should validate with default values', () => {
      const result = memberSearchSchema.parse({});
      expect(result.sortBy).toBe('name');
      expect(result.sortOrder).toBe('asc');
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should validate complete search params', () => {
      const validData = {
        query: '김철수',
        position: 'elder' as const,
        role: 'pastor' as const,
        status: 'active' as const,
        cellGroupId: '123e4567-e89b-12d3-a456-426614174000',
        sortBy: 'joined_at' as const,
        sortOrder: 'desc' as const,
        page: 2,
        pageSize: 50,
      };
      expect(() => memberSearchSchema.parse(validData)).not.toThrow();
    });

    it('should validate position filter', () => {
      const validPositions = ['elder', 'ordained_deacon', 'deacon', 'saint', null];
      validPositions.forEach((position) => {
        expect(() => memberSearchSchema.parse({ position })).not.toThrow();
      });
    });

    it('should validate status filter', () => {
      const validStatuses = ['pending', 'active', 'inactive', 'transferred', null];
      validStatuses.forEach((status) => {
        expect(() => memberSearchSchema.parse({ status })).not.toThrow();
      });
    });

    it('should validate sortBy options', () => {
      const validSortBy = ['name', 'joined_at', 'created_at'];
      validSortBy.forEach((sortBy) => {
        expect(() => memberSearchSchema.parse({ sortBy })).not.toThrow();
      });
    });

    it('should reject invalid page number', () => {
      expect(() => memberSearchSchema.parse({ page: 0 })).toThrow();
      expect(() => memberSearchSchema.parse({ page: -1 })).toThrow();
      expect(() => memberSearchSchema.parse({ page: 1.5 })).toThrow();
    });

    it('should reject invalid pageSize', () => {
      expect(() => memberSearchSchema.parse({ pageSize: 0 })).toThrow();
      expect(() => memberSearchSchema.parse({ pageSize: 101 })).toThrow();
    });

    it('should validate cellGroupId as UUID', () => {
      const validData = {
        cellGroupId: '123e4567-e89b-12d3-a456-426614174000',
      };
      expect(() => memberSearchSchema.parse(validData)).not.toThrow();

      const invalidData = {
        cellGroupId: 'not-a-uuid',
      };
      expect(() => memberSearchSchema.parse(invalidData)).toThrow();
    });
  });

  describe('qrRegistrationSchema', () => {
    it('should validate complete registration data', () => {
      const validData = {
        name: '김철수',
        phone: '010-1234-5678',
        email: 'kim@example.com',
        birth_date: '1990-01-01',
        gender: 'male' as const,
        address: '서울시 강남구',
        how_did_you_hear: '친구 소개',
        prayer_request: '건강을 위해 기도해주세요',
      };
      expect(() => qrRegistrationSchema.parse(validData)).not.toThrow();
    });

    it('should validate minimal required data', () => {
      const validData = {
        name: '김철수',
        phone: '01012345678',
      };
      expect(() => qrRegistrationSchema.parse(validData)).not.toThrow();
    });

    it('should validate name requirements', () => {
      expect(() =>
        qrRegistrationSchema.parse({ name: '김', phone: '010-1234-5678' })
      ).toThrow('이름은 2자 이상 입력해주세요');
    });

    it('should validate phone format', () => {
      const validPhones = ['010-1234-5678', '01012345678', '011-123-4567'];
      validPhones.forEach((phone) => {
        expect(() => qrRegistrationSchema.parse({ name: '김철수', phone })).not.toThrow();
      });
    });

    it('should accept optional fields as empty string', () => {
      const validData = {
        name: '김철수',
        phone: '010-1234-5678',
        email: '',
        birth_date: '',
        address: '',
        how_did_you_hear: '',
        prayer_request: '',
      };
      expect(() => qrRegistrationSchema.parse(validData)).not.toThrow();
    });

    it('should validate email format when provided', () => {
      const invalidData = {
        name: '김철수',
        phone: '010-1234-5678',
        email: 'invalid-email',
      };
      expect(() => qrRegistrationSchema.parse(invalidData)).toThrow();
    });

    it('should validate gender options', () => {
      const validGenders = ['male', 'female', null];
      validGenders.forEach((gender) => {
        const data = { name: '김철수', phone: '010-1234-5678', gender };
        expect(() => qrRegistrationSchema.parse(data)).not.toThrow();
      });
    });
  });
});
