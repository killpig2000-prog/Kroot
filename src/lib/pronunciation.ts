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
      { kr: "다리", romanization: "dari", en: "leg / bridge" },
      { kr: "물", romanization: "mul", en: "water" },
      { kr: "여러분", romanization: "yeoreobun", en: "everyone" },
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
      { kr: "꿈", romanization: "kkum", en: "dream" },
      { kr: "뽀뽀", romanization: "ppoppo", en: "a peck / kiss" },
      { kr: "쓰다", romanization: "sseuda", en: "to write / to be bitter" },
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
      { kr: "친구", romanization: "chingu", en: "friend" },
      { kr: "택시", romanization: "taeksi", en: "taxi" },
      { kr: "피아노", romanization: "piano", en: "piano" },
    ],
  },
  {
    key: "triplet-k",
    title: "가 · 카 · 까 — the ㄱ triplet",
    tip: "Three different letters, one place in the mouth. 가 is plain and soft with almost no air, 카 explodes with breath, 까 is squeezed tight and clipped. Say them in a row until you hear three distinct sounds.",
    items: [
      { kr: "감", romanization: "gam", en: "persimmon" },
      { kr: "캄캄하다", romanization: "kamkamhada", en: "to be pitch dark" },
      { kr: "깜빡", romanization: "kkamppak", en: "a blink / forgetting" },
      { kr: "개", romanization: "gae", en: "dog" },
      { kr: "캐다", romanization: "kaeda", en: "to dig up" },
      { kr: "깨", romanization: "kkae", en: "sesame" },
      { kr: "굴", romanization: "gul", en: "oyster" },
      { kr: "꿀", romanization: "kkul", en: "honey" },
    ],
  },
  {
    key: "triplet-t",
    title: "다 · 타 · 따 — the ㄷ triplet",
    tip: "Same tongue position, three levels of pressure. 달 (moon) is gentle, 탈 (mask) comes with a burst of air, 딸 (daughter) is tight and sharp. Mixing them up changes the word completely.",
    items: [
      { kr: "달", romanization: "dal", en: "moon" },
      { kr: "탈", romanization: "tal", en: "mask" },
      { kr: "딸", romanization: "ttal", en: "daughter" },
      { kr: "도", romanization: "do", en: "also" },
      { kr: "토요일", romanization: "toyoil", en: "Saturday" },
      { kr: "또", romanization: "tto", en: "again" },
      { kr: "다리", romanization: "dari", en: "leg" },
      { kr: "따로", romanization: "ttaro", en: "separately" },
    ],
  },
  {
    key: "triplet-p",
    title: "바 · 파 · 빠 — the ㅂ triplet",
    tip: "Lips together for all three. 불 (fire) is soft, 풀 (grass) sprays air, 뿔 (horn) pops out under pressure. English 'b' and 'p' sit between the Korean sounds, so aim past them in both directions.",
    items: [
      { kr: "불", romanization: "bul", en: "fire" },
      { kr: "풀", romanization: "pul", en: "grass / glue" },
      { kr: "뿔", romanization: "ppul", en: "horn" },
      { kr: "방", romanization: "bang", en: "room" },
      { kr: "팡", romanization: "pang", en: "pop (sound)" },
      { kr: "빵", romanization: "ppang", en: "bread" },
      { kr: "비", romanization: "bi", en: "rain" },
      { kr: "삐다", romanization: "ppida", en: "to sprain" },
    ],
  },
  {
    key: "triplet-s",
    title: "사 · 싸 — plain vs tense ㅅ",
    tip: "ㅅ alone is light, almost breathy. ㅆ is pressed hard with a tight throat and no air escaping around it. 사다 means to buy, 싸다 means to be cheap — worth getting right at the register.",
    items: [
      { kr: "사다", romanization: "sada", en: "to buy" },
      { kr: "싸다", romanization: "ssada", en: "to be cheap" },
      { kr: "살", romanization: "sal", en: "flesh / years old" },
      { kr: "쌀", romanization: "ssal", en: "uncooked rice" },
      { kr: "시", romanization: "si", en: "poem / o'clock" },
      { kr: "씨", romanization: "ssi", en: "seed / Mr., Ms." },
      { kr: "손", romanization: "son", en: "hand" },
      { kr: "쓴맛", romanization: "sseunmat", en: "bitter taste" },
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
      { kr: "거기", romanization: "geogi", en: "there" },
      { kr: "고기", romanization: "gogi", en: "meat" },
      { kr: "설", romanization: "seol", en: "Lunar New Year" },
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
      { kr: "느낌", romanization: "neukkim", en: "feeling" },
      { kr: "누나", romanization: "nuna", en: "older sister (of a male)" },
      { kr: "즐겁다", romanization: "jeulgeopda", en: "to be enjoyable" },
    ],
  },
  {
    key: "ae-e",
    title: "ㅐ vs ㅔ — ae and e",
    tip: "In careful speech ㅐ is a wider, flatter 'a' as in 'cat' and ㅔ is tighter, like 'bed'. Most Seoul speakers now merge them, so listeners rely on context — 개 (dog) and 게 (crab) sound nearly identical.",
    items: [
      { kr: "개", romanization: "gae", en: "dog" },
      { kr: "게", romanization: "ge", en: "crab" },
      { kr: "내", romanization: "nae", en: "my" },
      { kr: "네", romanization: "ne", en: "yes / your" },
      { kr: "새", romanization: "sae", en: "bird" },
      { kr: "세", romanization: "se", en: "three" },
      { kr: "애기", romanization: "aegi", en: "baby (colloquial)" },
      { kr: "에어컨", romanization: "eeokeon", en: "air conditioner" },
    ],
  },
  {
    key: "y-vowels",
    title: "ㅑ ㅕ ㅛ ㅠ ㅒ ㅖ — glide vowels",
    tip: "Each of these is a quick 'y' sliding straight into the base vowel — one smooth beat, not two syllables. 여기 is 'yuh-gi', never 'ee-uh-gi'.",
    items: [
      { kr: "여기", romanization: "yeogi", en: "here" },
      { kr: "야채", romanization: "yachae", en: "vegetables" },
      { kr: "요리", romanization: "yori", en: "cooking" },
      { kr: "유리", romanization: "yuri", en: "glass" },
      { kr: "예약", romanization: "yeyak", en: "reservation" },
      { kr: "얘기", romanization: "yaegi", en: "story, talk" },
      { kr: "겨울", romanization: "gyeoul", en: "winter" },
      { kr: "병원", romanization: "byeongwon", en: "hospital" },
    ],
  },
  {
    key: "ui",
    title: "ㅢ — the tricky ui",
    tip: "Three pronunciations, one letter. At the start of a word it's a true glide from ㅡ to ㅣ (의사). Elsewhere it flattens to 이 (회의 → 회이), and as the possessive particle it is said 에 (나의 → 나에).",
    items: [
      { kr: "의사", romanization: "uisa", en: "doctor" },
      { kr: "의자", romanization: "uija", en: "chair" },
      { kr: "회의", romanization: "hoei", en: "meeting" },
      { kr: "주의", romanization: "jui", en: "caution" },
      { kr: "나의 꿈", romanization: "na-e kkum", en: "my dream" },
      { kr: "민주주의", romanization: "minjujui", en: "democracy" },
      { kr: "의미", romanization: "uimi", en: "meaning" },
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
      { kr: "산", romanization: "san", en: "mountain" },
      { kr: "봄", romanization: "bom", en: "spring" },
      { kr: "강", romanization: "gang", en: "river" },
    ],
  },
  {
    key: "batchim-seven",
    title: "받침 대표음 — seven final sounds",
    tip: "Twenty-seven possible 받침 collapse into just seven sounds: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅇ. So ㅅ ㅆ ㅈ ㅊ ㅌ all land on a held ㄷ, and ㅍ lands on ㅂ — 잎 is said 입.",
    items: [
      { kr: "낮", romanization: "nat", en: "daytime" },
      { kr: "낫", romanization: "nat", en: "sickle" },
      { kr: "꽃", romanization: "kkot", en: "flower" },
      { kr: "부엌", romanization: "bueok", en: "kitchen" },
      { kr: "잎", romanization: "ip", en: "leaf" },
      { kr: "밖", romanization: "bak", en: "outside" },
      { kr: "히읗", romanization: "hieut", en: "the letter ㅎ" },
    ],
  },
  {
    key: "double-batchim",
    title: "겹받침 — double final consonants",
    tip: "When two consonants share a 받침 slot, only one is pronounced before a pause. 값 is 갑, 앉다 is 안따, 읽다 is 익따 — but the silent one wakes up when a vowel follows (값이 → 갑씨).",
    items: [
      { kr: "값", romanization: "gap", en: "price" },
      { kr: "값이", romanization: "gapssi", en: "the price (subject)" },
      { kr: "앉다", romanization: "antta", en: "to sit" },
      { kr: "읽다", romanization: "iktta", en: "to read" },
      { kr: "읽어요", romanization: "ilgeoyo", en: "(I) read" },
      { kr: "닭", romanization: "dak", en: "chicken" },
      { kr: "삶", romanization: "sam", en: "life" },
      { kr: "없어요", romanization: "eopsseoyo", en: "there isn't any" },
    ],
  },
  {
    key: "linking",
    title: "연음 — linking sounds",
    tip: "When a syllable ends in a consonant and the next starts with a vowel, the consonant slides over. 한국어 sounds like 한구거, not 한국·어.",
    items: [
      { kr: "한국어", romanization: "hangugeo", en: "Korean language" },
      { kr: "음악이", romanization: "eumagi", en: "the music (subject)" },
      { kr: "맛있어요", romanization: "masisseoyo", en: "it's delicious" },
      { kr: "책을", romanization: "chaegeul", en: "book (object)" },
      { kr: "발음", romanization: "bareum", en: "pronunciation" },
      { kr: "옷이", romanization: "osi", en: "the clothes (subject)" },
      { kr: "집에", romanization: "jibe", en: "to/at home" },
      { kr: "직업", romanization: "jigeop", en: "occupation" },
    ],
  },
  {
    key: "hieut",
    title: "받침 ㅎ — the disappearing h",
    tip: "ㅎ rarely survives contact. Before a vowel it vanishes (좋아요 → 조아요); before ㄱ ㄷ ㅈ it merges into an aspirated sound (좋다 → 조타, 많고 → 만코).",
    items: [
      { kr: "좋아요", romanization: "joayo", en: "it's good / I like it" },
      { kr: "좋다", romanization: "jota", en: "to be good" },
      { kr: "많이", romanization: "mani", en: "a lot" },
      { kr: "많고", romanization: "manko", en: "many, and…" },
      { kr: "싫어요", romanization: "sireoyo", en: "I don't like it" },
      { kr: "놓다", romanization: "nota", en: "to put down" },
      { kr: "괜찮아요", romanization: "gwaenchanayo", en: "it's okay" },
      { kr: "그렇지만", romanization: "geureochiman", en: "however" },
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
      { kr: "한국말", romanization: "hangungmal", en: "the Korean language" },
      { kr: "앞문", romanization: "ammun", en: "front door" },
      { kr: "십년", romanization: "simnyeon", en: "ten years" },
    ],
  },
  {
    key: "lateral",
    title: "유음화 — when ㄴ turns into ㄹ",
    tip: "ㄴ next to ㄹ gives in and becomes ㄹ. 연락 is said 열락, 신라 is 실라, 편리 is 펼리. Both consonants end up as the same flowing sound.",
    items: [
      { kr: "연락", romanization: "yeollak", en: "contact, getting in touch" },
      { kr: "신라", romanization: "silla", en: "Silla (dynasty)" },
      { kr: "편리하다", romanization: "pyeollihada", en: "to be convenient" },
      { kr: "설날", romanization: "seollal", en: "Lunar New Year's Day" },
      { kr: "일년", romanization: "illyeon", en: "one year" },
      { kr: "관리", romanization: "gwalli", en: "management" },
      { kr: "난로", romanization: "nallo", en: "heater, stove" },
    ],
  },
  {
    key: "palatal",
    title: "구개음화 — ㄷ/ㅌ become ㅈ/ㅊ",
    tip: "A final ㄷ or ㅌ followed by 이 or 히 slides forward to ㅈ or ㅊ. 굳이 is 구지, 같이 is 가치, 닫히다 is 다치다. The tongue takes the shortcut.",
    items: [
      { kr: "같이", romanization: "gachi", en: "together" },
      { kr: "굳이", romanization: "guji", en: "needlessly, insistently" },
      { kr: "해돋이", romanization: "haedoji", en: "sunrise" },
      { kr: "닫히다", romanization: "dachida", en: "to be closed" },
      { kr: "붙이다", romanization: "buchida", en: "to stick on" },
      { kr: "밭이", romanization: "bachi", en: "the field (subject)" },
      { kr: "맏이", romanization: "maji", en: "the eldest child" },
    ],
  },
  {
    key: "fortition",
    title: "경음화 — sounds that turn tense",
    tip: "After a stop 받침 (ㄱ ㄷ ㅂ), the next plain consonant tightens. 학교 is 학꾜, 식당 is 식땅, 숟가락 is 숟까락. Nobody writes it, everybody says it.",
    items: [
      { kr: "학교", romanization: "hakkyo", en: "school" },
      { kr: "식당", romanization: "sikttang", en: "restaurant" },
      { kr: "숟가락", romanization: "sutkkarak", en: "spoon" },
      { kr: "약국", romanization: "yakkuk", en: "pharmacy" },
      { kr: "입국", romanization: "ipkkuk", en: "entering a country" },
      { kr: "젓가락", romanization: "jeotkkarak", en: "chopsticks" },
      { kr: "듣기", romanization: "deutkki", en: "listening" },
      { kr: "잡지", romanization: "japjji", en: "magazine" },
    ],
  },
  {
    key: "n-insertion",
    title: "ㄴ 첨가 — the extra n",
    tip: "In compound words, a consonant 받침 meeting 이/야/여/요/유 sprouts an ㄴ. 무슨 일 is 무슨 닐, 색연필 is 생년필, 담요 is 담뇨.",
    items: [
      { kr: "무슨 일", romanization: "museun nil", en: "what's the matter" },
      { kr: "색연필", romanization: "saengnyeonpil", en: "coloured pencil" },
      { kr: "담요", romanization: "damnyo", en: "blanket" },
      { kr: "한여름", romanization: "hannyeoreum", en: "midsummer" },
      { kr: "꽃잎", romanization: "kkonnip", en: "flower petal" },
      { kr: "십육", romanization: "simnyuk", en: "sixteen" },
      { kr: "그림 일기", romanization: "geurim nilgi", en: "picture diary" },
    ],
  },
  {
    key: "intonation",
    title: "억양 — sentence melody",
    tip: "Korean marks questions with pitch, not word order: 밥 먹었어요 rises at the end to ask and falls to tell. Keep the syllables evenly timed — stressing one the way English does sounds foreign.",
    items: [
      { kr: "밥 먹었어요?", romanization: "bap meogeosseoyo?", en: "Did you eat? (rising)" },
      { kr: "밥 먹었어요.", romanization: "bap meogeosseoyo.", en: "I ate. (falling)" },
      { kr: "진짜요?", romanization: "jinjjayo?", en: "Really? (rising)" },
      { kr: "아니요, 괜찮아요.", romanization: "aniyo, gwaenchanayo.", en: "No, it's fine." },
      { kr: "가자!", romanization: "gaja!", en: "Let's go!" },
      { kr: "어떻게 해요?", romanization: "eotteoke haeyo?", en: "What should we do?" },
      { kr: "그렇구나…", romanization: "geureokuna…", en: "Ah, I see. (trailing)" },
    ],
  },
];

export function groupByKey(key: string) {
  return SOUND_GROUPS.find((g) => g.key === key);
}

// Challenge tiers, easy to brutal — vowel contrasts and single consonant
// families first, connected-speech rules (assimilation, insertion, melody)
// last, since those only make sense once the basics are solid.
export type ChallengeTier = 1 | 2 | 3 | 4 | 5;

export const GROUP_TIER: Record<string, ChallengeTier> = {
  "eo-o": 1,
  "eu-u": 1,
  "ae-e": 1,
  "y-vowels": 1,
  batchim: 1,
  tense: 2,
  aspirated: 2,
  "triplet-k": 2,
  "triplet-t": 2,
  "triplet-p": 2,
  "triplet-s": 2,
  "batchim-seven": 3,
  "double-batchim": 3,
  ui: 3,
  rieul: 3,
  linking: 4,
  hieut: 4,
  nasal: 4,
  lateral: 4,
  palatal: 5,
  fortition: 5,
  "n-insertion": 5,
  intonation: 5,
};

export const TIER_META: { tier: ChallengeTier; name: string; emoji: string }[] = [
  { tier: 1, name: "Warm-up", emoji: "🌱" },
  { tier: 2, name: "Spicy", emoji: "🌶️" },
  { tier: 3, name: "Hardcore", emoji: "🔥" },
  { tier: 4, name: "Brutal", emoji: "💀" },
  { tier: 5, name: "Legendary", emoji: "👑" },
];

export function groupsForTier(tier: ChallengeTier): SoundGroup[] {
  return SOUND_GROUPS.filter((g) => GROUP_TIER[g.key] === tier);
}

// A friendlier name shown as the chapter's headline; the full linguistic
// title (e.g. "구개음화 — ㄷ/ㅌ become ㅈ/ㅊ") stays available as a hover tooltip
// so the trail doesn't read like a phonology textbook at a glance.
export const CHAPTER_BLURB: Record<string, string> = {
  rieul: "R or L?",
  tense: "Snap it tight",
  aspirated: "Add a puff of air",
  "triplet-k": "가 · 카 · 까",
  "triplet-t": "다 · 타 · 따",
  "triplet-p": "바 · 파 · 빠",
  "triplet-s": "사 vs 싸",
  "eo-o": "uh vs oh",
  "eu-u": "eu vs oo",
  "ae-e": "ae vs e",
  "y-vowels": "Quick y-glides",
  ui: "The tricky ㅢ",
  batchim: "Closed-mouth endings",
  "batchim-seven": "Seven ending sounds",
  "double-batchim": "Two letters, one sound",
  linking: "Sounds that slide together",
  hieut: "The vanishing h",
  nasal: "Through your nose",
  lateral: "ㄴ becomes ㄹ",
  palatal: "ㄷ/ㅌ soften up",
  fortition: "Sounds that toughen up",
  "n-insertion": "A surprise n",
  intonation: "Say it with feeling",
};

export function chapterBlurb(key: string): string {
  return CHAPTER_BLURB[key] ?? groupByKey(key)?.title ?? key;
}

// A word counts as "nailed" once its best recorded score clears this bar —
// used consistently for chapter-clear/unlock logic and for deciding which
// words a returning learner can skip.
export const NAILED_THRESHOLD = 80;

export function chapterClearStats(nailedIds: Set<string>): { done: number; total: number } {
  const chapters = orderedChapters();
  const done = chapters.filter((c) => c.items.every((w) => nailedIds.has(`${c.key}:${w.kr}`))).length;
  return { done, total: chapters.length };
}

export type ChallengeWord = PronWord & { id: string; groupTitle: string; tip: string };

export function allChallengeWordIds(): string[] {
  return SOUND_GROUPS.flatMap((g) => g.items.map((w) => `${g.key}:${w.kr}`));
}

// A chapter is one sound-rule group, played as a ~7-word round. Chapters are
// globally ordered tier-by-tier (their `index` drives the unlock chain — a
// chapter opens once the one before it in this list is fully cleared).
export type Chapter = SoundGroup & { tier: ChallengeTier; index: number };

export function orderedChapters(): Chapter[] {
  const chapters: Chapter[] = [];
  for (const { tier } of TIER_META) {
    for (const g of groupsForTier(tier)) chapters.push({ ...g, tier, index: chapters.length });
  }
  return chapters;
}

export function chapterByKey(key: string): Chapter | undefined {
  return orderedChapters().find((c) => c.key === key);
}

export function wordsForChapter(key: string): ChallengeWord[] {
  const g = groupByKey(key);
  if (!g) return [];
  return g.items.map((w) => ({ ...w, id: `${key}:${w.kr}`, groupTitle: g.title, tip: g.tip }));
}
