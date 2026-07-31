export type Jamo = {
  char: string;
  rom: string;
  /** Korean name of the letter, e.g. 기역 */
  name: string;
  /** English sound hint, e.g. "g as in go" */
  hint: string;
  example: { kr: string; rom: string; en: string };
};

export const BASIC_CONSONANTS: Jamo[] = [
  { char: "ㄱ", rom: "g / k", name: "기역", hint: "g as in go (k at the end of a syllable)", example: { kr: "가방", rom: "gabang", en: "bag" } },
  { char: "ㄴ", rom: "n", name: "니은", hint: "n as in now", example: { kr: "나무", rom: "namu", en: "tree" } },
  { char: "ㄷ", rom: "d / t", name: "디귿", hint: "d as in door", example: { kr: "다리", rom: "dari", en: "leg, bridge" } },
  { char: "ㄹ", rom: "r / l", name: "리을", hint: "between r and l — tap it like Spanish r", example: { kr: "라면", rom: "ramyeon", en: "ramen" } },
  { char: "ㅁ", rom: "m", name: "미음", hint: "m as in mom", example: { kr: "머리", rom: "meori", en: "head" } },
  { char: "ㅂ", rom: "b / p", name: "비읍", hint: "b as in bed", example: { kr: "바다", rom: "bada", en: "sea" } },
  { char: "ㅅ", rom: "s", name: "시옷", hint: "s as in sun (sh before i)", example: { kr: "사과", rom: "sagwa", en: "apple" } },
  { char: "ㅇ", rom: "– / ng", name: "이응", hint: "silent at the start, ng as in sing at the end", example: { kr: "아기", rom: "agi", en: "baby" } },
  { char: "ㅈ", rom: "j", name: "지읒", hint: "j as in jam", example: { kr: "자동차", rom: "jadongcha", en: "car" } },
  { char: "ㅊ", rom: "ch", name: "치읓", hint: "ch as in chair, with a puff of air", example: { kr: "책", rom: "chaek", en: "book" } },
  { char: "ㅋ", rom: "k", name: "키읔", hint: "k as in kite, strongly aspirated", example: { kr: "커피", rom: "keopi", en: "coffee" } },
  { char: "ㅌ", rom: "t", name: "티읕", hint: "t as in top, strongly aspirated", example: { kr: "토마토", rom: "tomato", en: "tomato" } },
  { char: "ㅍ", rom: "p", name: "피읖", hint: "p as in pen, strongly aspirated", example: { kr: "포도", rom: "podo", en: "grape" } },
  { char: "ㅎ", rom: "h", name: "히읗", hint: "h as in hat", example: { kr: "하늘", rom: "haneul", en: "sky" } },
];

export const DOUBLE_CONSONANTS: Jamo[] = [
  { char: "ㄲ", rom: "kk", name: "쌍기역", hint: "tense ㄱ — like the k in sky, no puff of air", example: { kr: "꽃", rom: "kkot", en: "flower" } },
  { char: "ㄸ", rom: "tt", name: "쌍디귿", hint: "tense ㄷ — like the t in stop", example: { kr: "딸기", rom: "ttalgi", en: "strawberry" } },
  { char: "ㅃ", rom: "pp", name: "쌍비읍", hint: "tense ㅂ — like the p in spy", example: { kr: "빵", rom: "ppang", en: "bread" } },
  { char: "ㅆ", rom: "ss", name: "쌍시옷", hint: "tense ㅅ — a sharp, hissed s", example: { kr: "쌀", rom: "ssal", en: "uncooked rice" } },
  { char: "ㅉ", rom: "jj", name: "쌍지읒", hint: "tense ㅈ — a tight, pinched j", example: { kr: "짜다", rom: "jjada", en: "to be salty" } },
];

export const BASIC_VOWELS: Jamo[] = [
  { char: "ㅏ", rom: "a", name: "아", hint: "a as in father", example: { kr: "아빠", rom: "appa", en: "dad" } },
  { char: "ㅑ", rom: "ya", name: "야", hint: "ya as in yard", example: { kr: "야구", rom: "yagu", en: "baseball" } },
  { char: "ㅓ", rom: "eo", name: "어", hint: "u as in sun", example: { kr: "어머니", rom: "eomeoni", en: "mother" } },
  { char: "ㅕ", rom: "yeo", name: "여", hint: "yu as in young", example: { kr: "여름", rom: "yeoreum", en: "summer" } },
  { char: "ㅗ", rom: "o", name: "오", hint: "o as in more", example: { kr: "오이", rom: "oi", en: "cucumber" } },
  { char: "ㅛ", rom: "yo", name: "요", hint: "yo as in yoga", example: { kr: "교실", rom: "gyosil", en: "classroom" } },
  { char: "ㅜ", rom: "u", name: "우", hint: "oo as in moon", example: { kr: "우유", rom: "uyu", en: "milk" } },
  { char: "ㅠ", rom: "yu", name: "유", hint: "you", example: { kr: "유리", rom: "yuri", en: "glass" } },
  { char: "ㅡ", rom: "eu", name: "으", hint: "like the oo in good, but with lips spread wide", example: { kr: "그림", rom: "geurim", en: "picture" } },
  { char: "ㅣ", rom: "i", name: "이", hint: "ee as in see", example: { kr: "기차", rom: "gicha", en: "train" } },
];

export const COMPOUND_VOWELS: Jamo[] = [
  { char: "ㅐ", rom: "ae", name: "애", hint: "e as in bed", example: { kr: "개", rom: "gae", en: "dog" } },
  { char: "ㅒ", rom: "yae", name: "얘", hint: "ye as in yes", example: { kr: "얘기", rom: "yaegi", en: "story, chat" } },
  { char: "ㅔ", rom: "e", name: "에", hint: "e as in bed — modern Korean barely separates it from ㅐ", example: { kr: "베개", rom: "begae", en: "pillow" } },
  { char: "ㅖ", rom: "ye", name: "예", hint: "ye as in yellow", example: { kr: "예수", rom: "yesu", en: "Jesus" } },
  { char: "ㅘ", rom: "wa", name: "와", hint: "wa as in water — ㅗ + ㅏ", example: { kr: "사과", rom: "sagwa", en: "apple" } },
  { char: "ㅙ", rom: "wae", name: "왜", hint: "we as in wet — ㅗ + ㅐ", example: { kr: "왜", rom: "wae", en: "why" } },
  { char: "ㅚ", rom: "oe", name: "외", hint: "we as in wet — ㅗ + ㅣ", example: { kr: "외국", rom: "oeguk", en: "foreign country" } },
  { char: "ㅝ", rom: "wo", name: "워", hint: "wo as in wonder — ㅜ + ㅓ", example: { kr: "원", rom: "won", en: "won (currency)" } },
  { char: "ㅞ", rom: "we", name: "웨", hint: "we as in wet — ㅜ + ㅔ", example: { kr: "웨이터", rom: "weiteo", en: "waiter" } },
  { char: "ㅟ", rom: "wi", name: "위", hint: "wee — ㅜ + ㅣ", example: { kr: "귀", rom: "gwi", en: "ear" } },
  { char: "ㅢ", rom: "ui", name: "의", hint: "ㅡ then ㅣ, said quickly — often just 'e' in speech", example: { kr: "의자", rom: "uija", en: "chair" } },
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
