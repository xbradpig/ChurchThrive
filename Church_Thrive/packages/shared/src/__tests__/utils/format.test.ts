import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatPhone,
  normalizePhone,
  formatDate,
  formatNumber,
  truncate,
  getInitials,
} from '../../utils/format';

describe('format utilities', () => {
  describe('formatPhone', () => {
    it('should format 11-digit phone numbers', () => {
      expect(formatPhone('01012345678')).toBe('010-1234-5678');
      expect(formatPhone('01098765432')).toBe('010-9876-5432');
    });

    it('should format 10-digit phone numbers', () => {
      expect(formatPhone('0212345678')).toBe('021-234-5678');
      expect(formatPhone('0319876543')).toBe('031-987-6543');
    });

    it('should handle already formatted numbers', () => {
      expect(formatPhone('010-1234-5678')).toBe('010-1234-5678');
      expect(formatPhone('021-234-5678')).toBe('021-234-5678');
    });

    it('should handle numbers with spaces or other non-digit characters', () => {
      expect(formatPhone('010 1234 5678')).toBe('010-1234-5678');
      expect(formatPhone('010.1234.5678')).toBe('010-1234-5678');
    });

    it('should return original input for invalid lengths', () => {
      expect(formatPhone('123')).toBe('123');
      expect(formatPhone('0101234')).toBe('0101234');
    });

    it('should handle empty string', () => {
      expect(formatPhone('')).toBe('');
    });
  });

  describe('normalizePhone', () => {
    it('should remove all non-digit characters', () => {
      expect(normalizePhone('010-1234-5678')).toBe('01012345678');
      expect(normalizePhone('010 1234 5678')).toBe('01012345678');
      expect(normalizePhone('010.1234.5678')).toBe('01012345678');
    });

    it('should handle already normalized numbers', () => {
      expect(normalizePhone('01012345678')).toBe('01012345678');
    });

    it('should handle empty string', () => {
      expect(normalizePhone('')).toBe('');
    });
  });

  describe('formatDate', () => {
    beforeEach(() => {
      // Mock current date to ensure consistent relative time tests
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-02-05T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format dates in short format', () => {
      expect(formatDate('2024-02-05', 'short')).toBe('2024.02.05');
      expect(formatDate('2023-12-25', 'short')).toBe('2023.12.25');
    });

    it('should format dates in long format', () => {
      expect(formatDate('2024-02-05', 'long')).toBe('2024년 2월 5일');
      expect(formatDate('2023-12-25', 'long')).toBe('2023년 12월 25일');
    });

    it('should format dates in relative format', () => {
      // Just now
      expect(formatDate('2024-02-05T11:59:30Z', 'relative')).toBe('방금 전');

      // Minutes ago
      expect(formatDate('2024-02-05T11:30:00Z', 'relative')).toBe('30분 전');

      // Hours ago
      expect(formatDate('2024-02-05T10:00:00Z', 'relative')).toBe('2시간 전');

      // Days ago
      expect(formatDate('2024-02-03T12:00:00Z', 'relative')).toBe('2일 전');
    });

    it('should default to short format', () => {
      expect(formatDate('2024-02-05')).toBe('2024.02.05');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with thousand separators', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
      expect(formatNumber(123456789)).toBe('123,456,789');
    });

    it('should handle small numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(100)).toBe('100');
      expect(formatNumber(999)).toBe('999');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1000)).toBe('-1,000');
      expect(formatNumber(-123456)).toBe('-123,456');
    });

    it('should handle decimal numbers', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
    });
  });

  describe('truncate', () => {
    it('should truncate strings longer than maxLength', () => {
      expect(truncate('안녕하세요 반갑습니다', 10)).toBe('안녕하세요 반갑...');
      expect(truncate('Hello World', 5)).toBe('Hello...');
    });

    it('should not truncate strings shorter than or equal to maxLength', () => {
      expect(truncate('안녕하세요', 10)).toBe('안녕하세요');
      expect(truncate('Hello', 5)).toBe('Hello');
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(truncate('', 10)).toBe('');
    });

    it('should handle maxLength of 0', () => {
      expect(truncate('Hello', 0)).toBe('...');
    });
  });

  describe('getInitials', () => {
    it('should get initials from single Korean name', () => {
      expect(getInitials('김철수')).toBe('김철');
      expect(getInitials('이영희')).toBe('이영');
    });

    it('should get initials from multi-word names', () => {
      expect(getInitials('John Smith')).toBe('JS');
      expect(getInitials('John Paul Jones')).toBe('JP');
    });

    it('should handle single character names', () => {
      expect(getInitials('김')).toBe('김');
      expect(getInitials('A')).toBe('A');
    });

    it('should handle empty or whitespace strings', () => {
      expect(getInitials('')).toBe('?');
      expect(getInitials('   ')).toBe('?');
    });

    it('should limit to 2 characters', () => {
      expect(getInitials('John Paul George Ringo')).toBe('JP');
    });

    it('should handle names with extra spaces', () => {
      expect(getInitials('John   Smith')).toBe('JS');
      expect(getInitials('  John  Smith  ')).toBe('JS');
    });
  });
});
