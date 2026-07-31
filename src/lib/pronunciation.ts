export type PronWord = {
  kr: string;
  romanization: string;
  en: string;
};

export type SoundGroup = {
  key: string;
  title: string;
  /** English explanation of how to make the sound */
  tip: string;
  items: PronWord[];
};

export const SOUND_GROUPS: SoundGroup[] = [
  {
    key: "rieul",
    title: "ㄹ — the Korean R/L",
    tip: "Not an English R and not quite an L. Tap the tip of your tongue once against the ridge behind your top teeth — closer to the soft 'tt' in American 'butter'. At the end of a syllable it relaxes into an L.",
    items: [
      { kr: "라면", romanization: "ramyeon", en: "instant noodles" },
      { kr: "사랑", romanization: "sarang", en: "love" },
      { kr: "빨리", romanization: "ppalli", en: "quickly" },
      { kr: "일요일", romanization: "iryoil", en: "Sunday" },
      { kr: "노래", romanization: "norae", en: "song" },
    ],
  },
  {
    key: "tense",
    title: "ㄲ ㄸ ㅃ ㅆ ㅉ — tense consonants",
    tip: "Tighten your throat and hold the sound in before releasing it — no puff of air at all. Think of the tight, clipped 'k' in 'sky' rather than the breathy 'k' in 'key'.",
    items: [
      { kr: "꽃", romanization: "kkot", en: "flower" },
      { kr: "딸기", romanization: "ttalgi", en: "strawberry" },
      { kr: "빵", romanization: "ppang", en: "bread" },
      { kr: "싸요", romanization: "ssayo", en: "it's cheap" },
      { kr: "짜요", romanization: "jjayo", en: "it's salty" },
    ],
  },
  {
    key: "aspirated",
    title: "ㅋ ㅌ ㅍ ㅊ — aspirated consonants",
    tip: "The opposite of tense: push a strong puff of air out. Hold a sheet of paper in front of your mouth — it should flutter every time.",
    items: [
      { kr: "커피", romanization: "keopi", en: "coffee" },
      { kr: "토마토", romanization: "tomato", en: "tomato" },
      { kr: "포도", romanization: "podo", en: "grapes" },
      { kr: "치즈", romanization: "chijeu", en: "cheese" },
      { kr: "카페", romanization: "kape", en: "cafe" },
    ],
  },
  {
    key: "eo-o",
    title: "ㅓ vs ㅗ — eo and o",
    tip: "ㅓ is an open, unrounded 'uh' with a relaxed jaw. ㅗ is rounded — push your lips forward into a small circle like 'oh'. Mixing them turns 정말 into 종말.",
    items: [
      { kr: "머리", romanization: "meori", en: "head / hair" },
      { kr: "모리", romanization: "mori", en: "(name) Mori" },
      { kr: "정말", romanization: "jeongmal", en: "really" },
      { kr: "동생", romanization: "dongsaeng", en: "younger sibling" },
      { kr: "서울", romanization: "seoul", en: "Seoul" },
    ],
  },
  {
    key: "eu-u",
    title: "ㅡ vs ㅜ — eu and u",
    tip: "ㅡ has spread, smiling lips with the tongue pulled back — no rounding at all. ㅜ is fully rounded like 'oo' in 'food'. English speakers usually over-round ㅡ.",
    items: [
      { kr: "그림", romanization: "geurim", en: "picture" },
      { kr: "구름", romanization: "gureum", en: "cloud" },
      { kr: "음악", romanization: "eumak", en: "music" },
      { kr: "우유", romanization: "uyu", en: "milk" },
      { kr: "슈퍼", romanization: "syupeo", en: "supermarket" },
    ],
  },
  {
    key: "batchim",
    title: "받침 — final consonants",
    tip: "Final consonants are stopped, not released. Your mouth closes on the sound and holds it — 밥 ends with the lips shut and no 'buh' after it.",
    items: [
      { kr: "밥", romanization: "bap", en: "rice / meal" },
      { kr: "책", romanization: "chaek", en: "book" },
      { kr: "곧", romanization: "got", en: "soon" },
      { kr: "옷", romanization: "ot", en: "clothes" },
      { kr: "학교", romanization: "hakgyo", en: "school" },
    ],
  },
  {
    key: "linking",
    title: "연음 — linking sounds",
    tip: "When a syllable ends in a consonant and the next starts with 이/아/어, the consonant slides over. 한국어 sounds like 한구거, not 한국·어.",
    items: [
      { kr: "한국어", romanization: "hangugeo", en: "Korean language" },
      { kr: "음악이", romanization: "eumagi", en: "the music (subject)" },
      { kr: "맛있어요", romanization: "masisseoyo", en: "it's delicious" },
      { kr: "책을", romanization: "chaegeul", en: "book (object)" },
      { kr: "발음", romanization: "bareum", en: "pronunciation" },
    ],
  },
  {
    key: "nasal",
    title: "비음화 — nasal assimilation",
    tip: "A stop before a nasal becomes a nasal itself. 감사합니다 is really 감사함니다, and 국물 comes out as 궁물. Let your nose do the work.",
    items: [
      { kr: "감사합니다", romanization: "gamsahamnida", en: "thank you" },
      { kr: "국물", romanization: "gungmul", en: "broth" },
      { kr: "십만", romanization: "simman", en: "one hundred thousand" },
      { kr: "믿는", romanization: "minneun", en: "believing" },
      { kr: "작년", romanization: "jangnyeon", en: "last year" },
    ],
  },
];

export function groupByKey(key: string) {
  return SOUND_GROUPS.find((g) => g.key === key);
}
