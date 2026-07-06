/** 한글 초성 추출 — ㄲ→ㄱ 등 쌍자음 병합, 14그룹 */
const CHO = [
  "ㄱ", "ㄱ", "ㄴ", "ㄷ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅂ",
  "ㅅ", "ㅅ", "ㅇ", "ㅈ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

export const CHOSUNG_GROUPS = [
  "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

export function chosungOf(name: string): string {
  const code = name.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return "#";
  return CHO[Math.floor(code / 588)];
}

export function groupByChosung<T extends { name: string }>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const g of CHOSUNG_GROUPS) groups.set(g, []);
  groups.set("#", []);
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  for (const item of sorted) {
    groups.get(chosungOf(item.name))!.push(item);
  }
  return [...groups.entries()].filter(([, v]) => v.length > 0);
}
