const RU_VOWELS = new Set("аеёиоуыэюя");

const EN_VOWEL_GROUPS = /[aeiouy]+/gi;

const EN_SILENT_E = /[^aeiou]e$/i;

export function countSyllablesRu(word: string): number {
  const lower = word.toLowerCase();
  let count = 0;
  for (const ch of lower) {
    if (RU_VOWELS.has(ch)) count++;
  }
  return Math.max(count, word.length > 0 ? 1 : 0);
}

export function countSyllablesEn(word: string): number {
  const lower = word.trim().toLowerCase();
  if (!lower) return 0;

  const matches = lower.match(EN_VOWEL_GROUPS);
  if (!matches) return 1;

  let count = matches.length;

  if (EN_SILENT_E.test(lower) && count > 1) {
    count--;
  }

  return Math.max(count, 1);
}

export function countSyllables(word: string, lang: "ru" | "en" | "auto" = "auto"): number {
  if (!word.trim()) return 0;

  if (lang === "ru") return countSyllablesRu(word);
  if (lang === "en") return countSyllablesEn(word);

  const hasCyrillic = /[а-яё]/i.test(word);
  return hasCyrillic ? countSyllablesRu(word) : countSyllablesEn(word);
}

export function countLineSyllables(line: string, lang: "ru" | "en" | "auto" = "auto"): number {
  const words = line.split(/\s+/).filter((w) => w.length > 0);
  let total = 0;
  for (const word of words) {
    total += countSyllables(word, lang);
  }
  return total;
}

export function countAllSyllables(lyrics: string, lang: "ru" | "en" | "auto" = "auto"): number {
  const lines = lyrics.split("\n").filter((l) => l.trim().length > 0);
  let total = 0;
  for (const line of lines) {
    total += countLineSyllables(line, lang);
  }
  return total;
}
