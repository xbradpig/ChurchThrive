import { describe, it, expect } from 'vitest';
import { loginSchema, signUpSchema, churchSearchSchema } from '../../schemas/auth';

describe('auth schemas', () => {
  describe('loginSchema', () => {
    it('should validate valid email login', () => {
      const validData = {
        email: 'user@example.com',
        password: 'password123',
      };
      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('should validate valid phone login', () => {
      const validData = {
        phone: '01012345678',
        password: 'password123',
      };
      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid phone format', () => {
      const invalidData = {
        phone: '1234567890', // doesn't start with 010/011/016/017/018/019
        password: 'password123',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'short',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow('비밀번호는 8자 이상 입력해주세요');
    });

    it('should require either email or phone', () => {
      const invalidData = {
        password: 'password123',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it('should accept both email and phone', () => {
      const validData = {
        email: 'user@example.com',
        phone: '01012345678',
        password: 'password123',
      };
      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('should validate various phone formats', () => {
      const validPhones = [
        '01012345678',
        '01112345678',
        '01612345678',
        '01712345678',
        '01812345678',
        '01912345678',
        '0101234567', // 10 digits
      ];

      validPhones.forEach((phone) => {
        const data = { phone, password: 'password123' };
        expect(() => loginSchema.parse(data)).not.toThrow();
      });
    });
  });

  describe('signUpSchema', () => {
    it('should validate complete signup data with email', () => {
      const validData = {
        name: '김철수',
        email: 'user@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
      };
      expect(() => signUpSchema.parse(validData)).not.toThrow();
    });

    it('should validate complete signup data with phone', () => {
      const validData = {
        name: '김철수',
        phone: '01012345678',
        password: 'password123',
        passwordConfirm: 'password123',
      };
      expect(() => signUpSchema.parse(validData)).not.toThrow();
    });

    it('should reject short name', () => {
      const invalidData = {
        name: '김',
        email: 'user@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
      };
      expect(() => signUpSchema.parse(invalidData)).toThrow('이름은 2자 이상 입력해주세요');
    });

    it('should reject long name', () => {
      const invalidData = {
        name: '가'.repeat(21),
        email: 'user@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
      };
      expect(() => signUpSchema.parse(invalidData)).toThrow();
    });

    it('should require password with letters', () => {
      const invalidData = {
        name: '김철수',
        email: 'user@example.com',
        password: '12345678',
        passwordConfirm: '12345678',
      };
      expect(() => signUpSchema.parse(invalidData)).toThrow('영문자를 포함해주세요');
    });

    it('should require password with numbers', () => {
      const invalidData = {
        name: '김철수',
        email: 'user@example.com',
        password: 'abcdefgh',
        passwordConfirm: 'abcdefgh',
      };
      expect(() => signUpSchema.parse(invalidData)).toThrow('숫자를 포함해주세요');
    });

    it('should validate password match', () => {
      const invalidData = {
        name: '김철수',
        email: 'user@example.com',
        password: 'password123',
        passwordConfirm: 'different123',
      };
      expect(() => signUpSchema.parse(invalidData)).toThrow('비밀번호가 일치하지 않습니다');
    });

    it('should require either email or phone', () => {
      const invalidData = {
        name: '김철수',
        password: 'password123',
        passwordConfirm: 'password123',
      };
      expect(() => signUpSchema.parse(invalidData)).toThrow();
    });

    it('should accept empty string for optional email/phone', () => {
      const validData = {
        name: '김철수',
        email: '',
        phone: '01012345678',
        password: 'password123',
        passwordConfirm: 'password123',
      };
      expect(() => signUpSchema.parse(validData)).not.toThrow();
    });

    it('should validate strong password requirements', () => {
      const testCases = [
        { password: 'Pass1234', shouldPass: true }, // valid
        { password: 'password', shouldPass: false }, // no numbers
        { password: '12345678', shouldPass: false }, // no letters
        { password: 'Pass123', shouldPass: false }, // too short
        { password: 'PASSWORD123', shouldPass: true }, // uppercase ok
        { password: 'p@ssw0rd', shouldPass: true }, // special chars ok
      ];

      testCases.forEach(({ password, shouldPass }) => {
        const data = {
          name: '김철수',
          email: 'user@example.com',
          password,
          passwordConfirm: password,
        };
        if (shouldPass) {
          expect(() => signUpSchema.parse(data)).not.toThrow();
        } else {
          expect(() => signUpSchema.parse(data)).toThrow();
        }
      });
    });
  });

  describe('churchSearchSchema', () => {
    it('should validate valid search query', () => {
      const validData = { query: '사랑의교회' };
      expect(() => churchSearchSchema.parse(validData)).not.toThrow();
    });

    it('should reject short query', () => {
      const invalidData = { query: '사' };
      expect(() => churchSearchSchema.parse(invalidData)).toThrow('검색어를 2자 이상 입력해주세요');
    });

    it('should reject empty query', () => {
      const invalidData = { query: '' };
      expect(() => churchSearchSchema.parse(invalidData)).toThrow();
    });

    it('should accept Korean and English queries', () => {
      const validQueries = ['사랑의교회', 'Church', '123교회', '온누리 교회'];
      validQueries.forEach((query) => {
        expect(() => churchSearchSchema.parse({ query })).not.toThrow();
      });
    });
  });
});
