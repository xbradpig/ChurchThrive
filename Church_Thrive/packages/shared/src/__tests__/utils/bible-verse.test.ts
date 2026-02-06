import { describe, it, expect } from 'vitest';
import { detectBibleVerses, formatVerseRef, type BibleVerseRef } from '../../utils/bible-verse';

describe('bible-verse utilities', () => {
  describe('detectBibleVerses', () => {
    it('should detect single verse references', () => {
      const verses = detectBibleVerses('오늘의 본문은 요 3:16입니다.');
      expect(verses).toHaveLength(1);
      expect(verses[0]).toMatchObject({
        book: '요',
        fullBook: '요한복음',
        chapter: 3,
        verseStart: 16,
        verseEnd: null,
      });
    });

    it('should detect verse range references', () => {
      const verses = detectBibleVerses('본문: 마 5:3-10');
      expect(verses).toHaveLength(1);
      expect(verses[0]).toMatchObject({
        book: '마',
        fullBook: '마태복음',
        chapter: 5,
        verseStart: 3,
        verseEnd: 10,
      });
    });

    it('should detect multiple verse references', () => {
      const verses = detectBibleVerses('요 3:16, 롬 8:28, 빌 4:13을 읽으세요');
      expect(verses).toHaveLength(3);
      expect(verses[0].fullBook).toBe('요한복음');
      expect(verses[1].fullBook).toBe('로마서');
      expect(verses[2].fullBook).toBe('빌립보서');
    });

    it('should detect full book names', () => {
      const verses = detectBibleVerses('창세기 1:1, 출애굽기 20:3');
      expect(verses).toHaveLength(2);
      expect(verses[0]).toMatchObject({
        book: '창세기',
        fullBook: '창세기',
        chapter: 1,
        verseStart: 1,
      });
      expect(verses[1]).toMatchObject({
        book: '출애굽기',
        fullBook: '출애굽기',
      });
    });

    it('should detect abbreviated book names', () => {
      const verses = detectBibleVerses('창 1:1에서 시작합니다');
      expect(verses).toHaveLength(1);
      expect(verses[0]).toMatchObject({
        book: '창',
        fullBook: '창세기',
        chapter: 1,
        verseStart: 1,
      });
    });

    it('should handle verse ranges with tilde', () => {
      const verses = detectBibleVerses('시 23:1~6을 암송하세요');
      expect(verses).toHaveLength(1);
      expect(verses[0]).toMatchObject({
        chapter: 23,
        verseStart: 1,
        verseEnd: 6,
      });
    });

    it('should handle Old Testament books', () => {
      const testCases = [
        { text: '창 1:1', book: '창세기' },
        { text: '출 20:3', book: '출애굽기' },
        { text: '시 23:1', book: '시편' },
        { text: '잠 3:5', book: '잠언' },
        { text: '사 40:31', book: '이사야' },
      ];

      testCases.forEach(({ text, book }) => {
        const verses = detectBibleVerses(text);
        expect(verses).toHaveLength(1);
        expect(verses[0].fullBook).toBe(book);
      });
    });

    it('should handle New Testament books', () => {
      const testCases = [
        { text: '마 5:3', book: '마태복음' },
        { text: '막 1:1', book: '마가복음' },
        { text: '눅 2:1', book: '누가복음' },
        { text: '요 3:16', book: '요한복음' },
        { text: '행 1:8', book: '사도행전' },
        { text: '롬 8:28', book: '로마서' },
        { text: '고전 13:4', book: '고린도전서' },
        { text: '갈 5:22', book: '갈라디아서' },
        { text: '엡 2:8', book: '에베소서' },
        { text: '빌 4:13', book: '빌립보서' },
        { text: '계 21:1', book: '요한계시록' },
      ];

      testCases.forEach(({ text, book }) => {
        const verses = detectBibleVerses(text);
        expect(verses).toHaveLength(1);
        expect(verses[0].fullBook).toBe(book);
      });
    });

    it('should return empty array when no verses found', () => {
      expect(detectBibleVerses('오늘의 설교')).toEqual([]);
      expect(detectBibleVerses('')).toEqual([]);
      expect(detectBibleVerses('123:456')).toEqual([]);
    });

    it('should preserve the raw matched text', () => {
      const verses = detectBibleVerses('본문: 요 3:16');
      expect(verses[0].raw).toBe('요 3:16');
    });

    it('should handle verses with whitespace variations', () => {
      const testCases = [
        '요 3:16',
        '요  3:16',
        '요3:16',
        '요 3 : 16',
      ];

      testCases.forEach((text) => {
        const verses = detectBibleVerses(text);
        expect(verses).toHaveLength(1);
        expect(verses[0].chapter).toBe(3);
        expect(verses[0].verseStart).toBe(16);
      });
    });
  });

  describe('formatVerseRef', () => {
    it('should format single verse references', () => {
      const ref: BibleVerseRef = {
        book: '요',
        fullBook: '요한복음',
        chapter: 3,
        verseStart: 16,
        verseEnd: null,
        raw: '요 3:16',
      };
      expect(formatVerseRef(ref)).toBe('요한복음 3:16');
    });

    it('should format verse range references', () => {
      const ref: BibleVerseRef = {
        book: '마',
        fullBook: '마태복음',
        chapter: 5,
        verseStart: 3,
        verseEnd: 10,
        raw: '마 5:3-10',
      };
      expect(formatVerseRef(ref)).toBe('마태복음 5:3-10');
    });

    it('should use full book name', () => {
      const ref: BibleVerseRef = {
        book: '창',
        fullBook: '창세기',
        chapter: 1,
        verseStart: 1,
        verseEnd: null,
        raw: '창 1:1',
      };
      expect(formatVerseRef(ref)).toBe('창세기 1:1');
    });

    it('should handle large chapter and verse numbers', () => {
      const ref: BibleVerseRef = {
        book: '시',
        fullBook: '시편',
        chapter: 119,
        verseStart: 105,
        verseEnd: 176,
        raw: '시 119:105-176',
      };
      expect(formatVerseRef(ref)).toBe('시편 119:105-176');
    });
  });

  describe('integration tests', () => {
    it('should detect and format multiple verses from sermon text', () => {
      const sermonText = `
        오늘의 본문은 요 3:16입니다.
        또한 롬 8:28-30과 빌 4:13도 함께 읽어보시기 바랍니다.
        창세기 1:1에서 시작하여 계 22:21까지 하나님의 계획이 펼쳐집니다.
      `;

      const verses = detectBibleVerses(sermonText);
      expect(verses.length).toBeGreaterThanOrEqual(4);

      const formatted = verses.map(formatVerseRef);
      expect(formatted).toContain('요한복음 3:16');
      expect(formatted).toContain('로마서 8:28-30');
      expect(formatted).toContain('빌립보서 4:13');
      expect(formatted).toContain('창세기 1:1');
    });

    it('should handle sermon title with verses', () => {
      const title = '사랑의 능력 (고전 13:1-13, 요일 4:7-12)';
      const verses = detectBibleVerses(title);

      expect(verses).toHaveLength(2);
      expect(verses[0].fullBook).toBe('고린도전서');
      expect(verses[0].verseEnd).toBe(13);
      expect(verses[1].fullBook).toBe('요한일서');
      expect(verses[1].verseEnd).toBe(12);
    });
  });
});
