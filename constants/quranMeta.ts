import { SURAHS } from "./quranData";

export type RevelationType = "mecquoise" | "médinoise";

export const SURAH_JUZ: Record<number, number> = {
  1: 1, 2: 1, 3: 3, 4: 4, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10,
  10: 11, 11: 11, 12: 12, 13: 13, 14: 13, 15: 14, 16: 14,
  17: 15, 18: 15, 19: 16, 20: 16, 21: 17, 22: 17, 23: 18,
  24: 18, 25: 19, 26: 19, 27: 19, 28: 20, 29: 20, 30: 21,
  31: 21, 32: 21, 33: 21, 34: 22, 35: 22, 36: 22, 37: 23,
  38: 23, 39: 23, 40: 24, 41: 24, 42: 25, 43: 25, 44: 25,
  45: 25, 46: 26, 47: 26, 48: 26, 49: 26, 50: 26, 51: 26,
  52: 27, 53: 27, 54: 27, 55: 27, 56: 27, 57: 27, 58: 28,
  59: 28, 60: 28, 61: 28, 62: 28, 63: 28, 64: 28, 65: 28,
  66: 28, 67: 29, 68: 29, 69: 29, 70: 29, 71: 29, 72: 29,
  73: 29, 74: 29, 75: 29, 76: 29, 77: 29, 78: 30, 79: 30,
  80: 30, 81: 30, 82: 30, 83: 30, 84: 30, 85: 30, 86: 30,
  87: 30, 88: 30, 89: 30, 90: 30, 91: 30, 92: 30, 93: 30,
  94: 30, 95: 30, 96: 30, 97: 30, 98: 30, 99: 30, 100: 30,
  101: 30, 102: 30, 103: 30, 104: 30, 105: 30, 106: 30,
  107: 30, 108: 30, 109: 30, 110: 30, 111: 30, 112: 30,
  113: 30, 114: 30,
};

export const SURAH_TYPE: Record<number, RevelationType> = {
  1: "mecquoise", 2: "médinoise", 3: "médinoise", 4: "médinoise",
  5: "médinoise", 6: "mecquoise", 7: "mecquoise", 8: "médinoise",
  9: "médinoise", 10: "mecquoise", 11: "mecquoise", 12: "mecquoise",
  13: "médinoise", 14: "mecquoise", 15: "mecquoise", 16: "mecquoise",
  17: "mecquoise", 18: "mecquoise", 19: "mecquoise", 20: "mecquoise",
  21: "mecquoise", 22: "médinoise", 23: "mecquoise", 24: "médinoise",
  25: "mecquoise", 26: "mecquoise", 27: "mecquoise", 28: "mecquoise",
  29: "mecquoise", 30: "mecquoise", 31: "mecquoise", 32: "mecquoise",
  33: "médinoise", 34: "mecquoise", 35: "mecquoise", 36: "mecquoise",
  37: "mecquoise", 38: "mecquoise", 39: "mecquoise", 40: "mecquoise",
  41: "mecquoise", 42: "mecquoise", 43: "mecquoise", 44: "mecquoise",
  45: "mecquoise", 46: "mecquoise", 47: "médinoise", 48: "médinoise",
  49: "médinoise", 50: "mecquoise", 51: "mecquoise", 52: "mecquoise",
  53: "mecquoise", 54: "mecquoise", 55: "mecquoise", 56: "mecquoise",
  57: "médinoise", 58: "médinoise", 59: "médinoise", 60: "médinoise",
  61: "médinoise", 62: "médinoise", 63: "médinoise", 64: "médinoise",
  65: "médinoise", 66: "médinoise", 67: "mecquoise", 68: "mecquoise",
  69: "mecquoise", 70: "mecquoise", 71: "mecquoise", 72: "mecquoise",
  73: "mecquoise", 74: "mecquoise", 75: "mecquoise", 76: "médinoise",
  77: "mecquoise", 78: "mecquoise", 79: "mecquoise", 80: "mecquoise",
  81: "mecquoise", 82: "mecquoise", 83: "mecquoise", 84: "mecquoise",
  85: "mecquoise", 86: "mecquoise", 87: "mecquoise", 88: "mecquoise",
  89: "mecquoise", 90: "mecquoise", 91: "mecquoise", 92: "mecquoise",
  93: "mecquoise", 94: "mecquoise", 95: "mecquoise", 96: "mecquoise",
  97: "mecquoise", 98: "médinoise", 99: "médinoise", 100: "mecquoise",
  101: "mecquoise", 102: "mecquoise", 103: "mecquoise", 104: "mecquoise",
  105: "mecquoise", 106: "mecquoise", 107: "mecquoise", 108: "mecquoise",
  109: "mecquoise", 110: "médinoise", 111: "mecquoise", 112: "mecquoise",
  113: "mecquoise", 114: "mecquoise",
};

export const JUZ_NAMES: string[] = [
  "الجزء الأوّل", "الجزء الثاني", "الجزء الثالث", "الجزء الرابع",
  "الجزء الخامس", "الجزء السادس", "الجزء السابع", "الجزء الثامن",
  "الجزء التاسع", "الجزء العاشر", "الجزء الحادي عشر", "الجزء الثاني عشر",
  "الجزء الثالث عشر", "الجزء الرابع عشر", "الجزء الخامس عشر", "الجزء السادس عشر",
  "الجزء السابع عشر", "الجزء الثامن عشر", "الجزء التاسع عشر", "الجزء العشرون",
  "الجزء الحادي والعشرون", "الجزء الثاني والعشرون", "الجزء الثالث والعشرون",
  "الجزء الرابع والعشرون", "الجزء الخامس والعشرون", "الجزء السادس والعشرون",
  "الجزء السابع والعشرون", "الجزء الثامن والعشرون", "الجزء التاسع والعشرون",
  "الجزء الثلاثون",
];

export function getSurahsByJuz(juz: number) {
  return SURAHS.filter((s) => SURAH_JUZ[s.number] === juz);
}

const _cumulative: number[] = [];
export function getGlobalVerseNumber(surahNum: number, verseNum: number): number {
  if (_cumulative.length === 0) {
    let total = 0;
    for (const s of SURAHS) {
      _cumulative[s.number] = total;
      total += s.versesCount;
    }
  }
  return (_cumulative[surahNum] ?? 0) + verseNum;
}
