const CHOSUNG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

const HANGUL_START = 0xAC00;
const HANGUL_END = 0xD7A3;
const CHOSUNG_OFFSET = 588; // 21 * 28

export function getChosung(str: string): string {
  return str
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= HANGUL_START && code <= HANGUL_END) {
        const chosungIndex = Math.floor((code - HANGUL_START) / CHOSUNG_OFFSET);
        return CHOSUNG_LIST[chosungIndex];
      }
      return char;
    })
    .join('');
}

export function isChosungOnly(str: string): boolean {
  return str.split('').every((char) => CHOSUNG_LIST.includes(char));
}

export function matchesChosung(name: string, query: string): boolean {
  if (!query) return true;

  if (isChosungOnly(query)) {
    const nameChosung = getChosung(name);
    return nameChosung.startsWith(query);
  }

  return name.toLowerCase().includes(query.toLowerCase());
}

export function computeChosung(name: string): string {
  return getChosung(name);
}
