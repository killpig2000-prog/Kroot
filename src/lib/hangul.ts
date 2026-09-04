export type Jamo = {
  char: string;
  rom: string;
  /** English sound hint, e.g. "g as in go" */
  hint: string;
  example: { kr: string; rom: string; en: string };
};

export const BASIC_CONSONANTS: Jamo[] = [
  { char: "ㄱ", rom: "g / k", hint: "g as in go (k at the end of a syllable)", example: { kr: "가방", rom: "gabang", en: "bag" } },
  { char: "ㄴ", rom: "n", hint: "n as in now", example: { kr: "나무", rom: "namu", en: "tree" } },
  { char: "ㄷ", rom: "d / t", hint: "d as in door", example: { kr: "다리", rom: "dari", en: "leg, bridge" } },
  { char: "ㄹ", rom: "r / l", hint: "between r and l — tap it like Spanish r", example: { kr: "라면", rom: "ramyeon", en: "ramen" } },
  { char: "ㅁ", rom: "m", hint: "m as in mom", example: { kr: "머리", rom: "meori", en: "head" } },
  { char: "ㅂ", rom: "b / p", hint: "b as in bed", example: { kr: "바다", rom: "bada", en: "sea" } },
  { char: "ㅅ", rom: "s", hint: "s as in sun (sh before i)", example: { kr: "사과", rom: "sagwa", en: "apple" } },
  { char: "ㅇ", rom: "– / ng", hint: "silent at the start, ng as in sing at the end", example: { kr: "아기", rom: "agi", en: "baby" } },
  { char: "ㅈ", rom: "j", hint: "j as in jam", example: { kr: "자동차", rom: "jadongcha", en: "car" } },
  { char: "ㅊ", rom: "ch", hint: "ch as in chair, with a puff of air", example: { kr: "책", rom: "chaek", en: "book" } },
  { char: "ㅋ", rom: "k", hint: "k as in kite, strongly aspirated", example: { kr: "커피", rom: "keopi", en: "coffee" } },
  { char: "ㅌ", rom: "t", hint: "t as in top, strongly aspirated", example: { kr: "토마토", rom: "tomato", en: "tomato" } },
  { char: "ㅍ", rom: "p", hint: "p as in pen, strongly aspirated", example: { kr: "포도", rom: "podo", en: "grape" } },
  { char: "ㅎ", rom: "h", hint: "h as in hat", example: { kr: "하늘", rom: "haneul", en: "sky" } },
];

export const DOUBLE_CONSONANTS: Jamo[] = [
  { char: "ㄲ", rom: "kk", hint: "tense ㄱ — like the k in sky, no puff of air", example: { kr: "꽃", rom: "kkot", en: "flower" } },
  { char: "ㄸ", rom: "tt", hint: "tense ㄷ — like the t in stop", example: { kr: "딸기", rom: "ttalgi", en: "strawberry" } },
  { char: "ㅃ", rom: "pp", hint: "tense ㅂ — like the p in spy", example: { kr: "빵", rom: "ppang", en: "bread" } },
  { char: "ㅆ", rom: "ss", hint: "tense ㅅ — a sharp, hissed s", example: { kr: "쌀", rom: "ssal", en: "uncooked rice" } },
  { char: "ㅉ", rom: "jj", hint: "tense ㅈ — a tight, pinched j", example: { kr: "짜다", rom: "jjada", en: "to be salty" } },
];

export const BASIC_VOWELS: Jamo[] = [
  { char: "ㅏ", rom: "a", hint: "a as in father", example: { kr: "아빠", rom: "appa", en: "dad" } },
  { char: "ㅑ", rom: "ya", hint: "ya as in yard", example: { kr: "야구", rom: "yagu", en: "baseball" } },
  { char: "ㅓ", rom: "eo", hint: "u as in sun", example: { kr: "어머니", rom: "eomeoni", en: "mother" } },
  { char: "ㅕ", rom: "yeo", hint: "yu as in young", example: { kr: "여름", rom: "yeoreum", en: "summer" } },
  { char: "ㅗ", rom: "o", hint: "o as in more", example: { kr: "오이", rom: "oi", en: "cucumber" } },
  { char: "ㅛ", rom: "yo", hint: "yo as in yoga", example: { kr: "교실", rom: "gyosil", en: "classroom" } },
  { char: "ㅜ", rom: "u", hint: "oo as in moon", example: { kr: "우유", rom: "uyu", en: "milk" } },
  { char: "ㅠ", rom: "yu", hint: "you", example: { kr: "유리", rom: "yuri", en: "glass" } },
  { char: "ㅡ", rom: "eu", hint: "like the oo in good, but with lips spread wide", example: { kr: "그림", rom: "geurim", en: "picture" } },
  { char: "ㅣ", rom: "i", hint: "ee as in see", example: { kr: "기차", rom: "gicha", en: "train" } },
];

export const COMPOUND_VOWELS: Jamo[] = [
  { char: "ㅐ", rom: "ae", hint: "e as in bed", example: { kr: "개", rom: "gae", en: "dog" } },
  { char: "ㅒ", rom: "yae", hint: "ye as in yes", example: { kr: "얘기", rom: "yaegi", en: "story, chat" } },
  { char: "ㅔ", rom: "e", hint: "e as in bed — modern Korean barely separates it from ㅐ", example: { kr: "베개", rom: "begae", en: "pillow" } },
  { char: "ㅖ", rom: "ye", hint: "ye as in yellow", example: { kr: "예수", rom: "yesu", en: "Jesus" } },
  { char: "ㅘ", rom: "wa", hint: "wa as in water — ㅗ + ㅏ", example: { kr: "사과", rom: "sagwa", en: "apple" } },
  { char: "ㅙ", rom: "wae", hint: "we as in wet — ㅗ + ㅐ", example: { kr: "왜", rom: "wae", en: "why" } },
  { char: "ㅚ", rom: "oe", hint: "we as in wet — ㅗ + ㅣ", example: { kr: "외국", rom: "oeguk", en: "foreign country" } },
  { char: "ㅝ", rom: "wo", hint: "wo as in wonder — ㅜ + ㅓ", example: { kr: "원", rom: "won", en: "won (currency)" } },
  { char: "ㅞ", rom: "we", hint: "we as in wet — ㅜ + ㅔ", example: { kr: "웨이터", rom: "weiteo", en: "waiter" } },
  { char: "ㅟ", rom: "wi", hint: "wee — ㅜ + ㅣ", example: { kr: "귀", rom: "gwi", en: "ear" } },
  { char: "ㅢ", rom: "ui", hint: "ㅡ then ㅣ, said quickly — often just 'e' in speech", example: { kr: "의자", rom: "uija", en: "chair" } },
];

/** Initial consonants (초성) in Unicode order — index feeds Hangul composition. */
export const CHO = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ",
  "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

/** Medial vowels (중성) in Unicode order. */
export const JUNG = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ",
  "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ",
] as const;

export function composeSyllable(choIndex: number, jungIndex: number, jongIndex = 0): string {
  return String.fromCharCode(0xac00 + (choIndex * 21 + jungIndex) * 28 + jongIndex);
}

export const ROM_BY_JAMO: Record<string, string> = Object.fromEntries(
  [...BASIC_CONSONANTS, ...DOUBLE_CONSONANTS, ...BASIC_VOWELS, ...COMPOUND_VOWELS].map((j) => [
    j.char,
    j.rom.split(" / ")[0],
  ])
);

export type PracticeWord = { kr: string; rom: string; en: string };

export const PRACTICE_WORDS: PracticeWord[] = [
  { kr: "나", rom: "na", en: "I, me" },
  { kr: "너", rom: "neo", en: "you" },
  { kr: "우유", rom: "uyu", en: "milk" },
  { kr: "바나나", rom: "banana", en: "banana" },
  { kr: "커피", rom: "keopi", en: "coffee" },
  { kr: "고기", rom: "gogi", en: "meat" },
  { kr: "사자", rom: "saja", en: "lion" },
  { kr: "머리", rom: "meori", en: "head" },
  { kr: "구두", rom: "gudu", en: "dress shoes" },
  { kr: "지도", rom: "jido", en: "map" },
  { kr: "허리", rom: "heori", en: "waist" },
  { kr: "포도", rom: "podo", en: "grape" },
];
