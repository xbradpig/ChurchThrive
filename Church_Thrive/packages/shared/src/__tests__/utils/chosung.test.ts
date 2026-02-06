import { describe, it, expect } from 'vitest';
import { getChosung, isChosungOnly, matchesChosung, computeChosung } from '../../utils/chosung';

describe('chosung utilities', () => {
  describe('getChosung', () => {
    it('should extract chosung from Korean characters', () => {
      expect(getChosung('김철수')).toBe('ㄱㅊㅊ');
      expect(getChosung('이영희')).toBe('ㅇㅇㅎ');
      expect(getChosung('박민수')).toBe('ㅂㅁㅅ');
    });

    it('should preserve non-Korean characters', () => {
      expect(getChosung('John Kim')).toBe('John ㄱ');
      expect(getChosung('김철수123')).toBe('ㄱㅊㅊ123');
      expect(getChosung('test테스트')).toBe('testㅌㅅㅌ');
    });

    it('should handle empty string', () => {
      expect(getChosung('')).toBe('');
    });

    it('should handle strings with spaces', () => {
      expect(getChosung('김 철 수')).toBe('ㄱ ㅊ ㅅ');
    });

    it('should handle complex Korean names', () => {
      expect(getChosung('홍길동')).toBe('ㅎㄱㄷ');
      expect(getChosung('선우은숙')).toBe('ㅅㅇㅇㅅ');
    });
  });

  describe('isChosungOnly', () => {
    it('should return true for strings containing only chosung', () => {
      expect(isChosungOnly('ㄱㅊㅊ')).toBe(true);
      expect(isChosungOnly('ㅇㅇㅎ')).toBe(true);
      expect(isChosungOnly('ㄱ')).toBe(true);
    });

    it('should return false for strings with Korean characters', () => {
      expect(isChosungOnly('김철수')).toBe(false);
      expect(isChosungOnly('ㄱ김')).toBe(false);
    });

    it('should return false for strings with Latin characters', () => {
      expect(isChosungOnly('abc')).toBe(false);
      expect(isChosungOnly('ㄱabc')).toBe(false);
    });

    it('should return false for strings with numbers', () => {
      expect(isChosungOnly('123')).toBe(false);
      expect(isChosungOnly('ㄱ123')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isChosungOnly('')).toBe(false);
    });

    it('should return false for strings with spaces', () => {
      expect(isChosungOnly('ㄱ ㅊ')).toBe(false);
    });
  });

  describe('matchesChosung', () => {
    it('should match when query is empty', () => {
      expect(matchesChosung('김철수', '')).toBe(true);
      expect(matchesChosung('이영희', '')).toBe(true);
    });

    it('should match chosung queries', () => {
      expect(matchesChosung('김철수', 'ㄱㅊㅊ')).toBe(true);
      expect(matchesChosung('김철수', 'ㄱㅊ')).toBe(true);
      expect(matchesChosung('김철수', 'ㄱ')).toBe(true);
      expect(matchesChosung('이영희', 'ㅇㅇ')).toBe(true);
    });

    it('should not match incorrect chosung queries', () => {
      expect(matchesChosung('김철수', 'ㅂㅁ')).toBe(false);
      expect(matchesChosung('김철수', 'ㅊㄱ')).toBe(false);
      expect(matchesChosung('이영희', 'ㄱㅊ')).toBe(false);
    });

    it('should match full text queries (case-insensitive)', () => {
      expect(matchesChosung('김철수', '김철')).toBe(true);
      expect(matchesChosung('김철수', '철수')).toBe(true);
      expect(matchesChosung('John Kim', 'john')).toBe(true);
      expect(matchesChosung('John Kim', 'JOHN')).toBe(true);
    });

    it('should not match non-matching text queries', () => {
      expect(matchesChosung('김철수', '이영희')).toBe(false);
      expect(matchesChosung('김철수', '박민수')).toBe(false);
    });

    it('should handle mixed Korean-English names', () => {
      expect(matchesChosung('John 김', 'ㄱ')).toBe(false); // chosung search doesn't start with ㄱ
      expect(matchesChosung('John 김', 'john')).toBe(true);
      expect(matchesChosung('John 김', '김')).toBe(true);
    });
  });

  describe('computeChosung', () => {
    it('should be an alias for getChosung', () => {
      expect(computeChosung('김철수')).toBe(getChosung('김철수'));
      expect(computeChosung('이영희')).toBe(getChosung('이영희'));
      expect(computeChosung('John Kim')).toBe(getChosung('John Kim'));
    });
  });
});
