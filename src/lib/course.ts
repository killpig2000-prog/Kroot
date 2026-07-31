// The 16-day guided course that replaces the old 12-week Beginner Path.
// Week 1 (days 1–7) teaches Hangul with mnemonics and stroke animations;
// days 8–16 are the grammar track, one module per day in a fixed order
// (word order → be-verb/verbs → particles → tenses → -러/-는 것 →
// relative clauses → question clauses + conditionals → writing test).
// Every lesson leans on very easy words and full example sentences —
// concepts are shown, not lectured. Days are sequence units, not calendar
// days: finishing several in one sitting is fine.

export type Example = { kr: string; en: string };

export type CoursePhase =
  | { type: "intro"; kr: string; en: string; sub?: string }
  | { type: "concept"; title: string; body: string; examples: Example[] }
  | { type: "stroke"; chars: string[]; note: string }
  | { type: "speak"; title: string; items: Example[] }
  | {
      type: "quiz";
      questions: { q: string; hint?: string; options: string[]; answer: string }[];
    };

export type CourseDay = {
  day: number;
  key: string;
  title: string;
  titleKr: string;
  minutes: number;
  phases: CoursePhase[];
};

const q = (
  qText: string,
  options: string[],
  answer: string,
  hint?: string,
): { q: string; hint?: string; options: string[]; answer: string } => ({
  q: qText,
  options,
  answer,
  hint,
});

export const COURSE_DAYS: CourseDay[] = [
  // ---------------- Week 1 · Hangul ----------------
  {
    day: 1,
    key: "course-day-1",
    title: "How Hangul works + basic vowels",
    titleKr: "한글의 원리 + 기본 모음",
    minutes: 8,
    phases: [
      {
        type: "intro",
        kr: "안녕하세요!",
        en: "Welcome! Today you'll learn how Korean letters work — and read your first sounds.",
      },
      {
        type: "concept",
        title: "Letters stack like LEGO blocks",
        body: "Korean doesn't write letters in a line like English. Consonants and vowels stack into square syllable blocks. 한 = ㅎ + ㅏ + ㄴ, all in one block. Learn ~24 letters and you can read anything.",
        examples: [
          { kr: "한 = ㅎ + ㅏ + ㄴ", en: "one block, one syllable" },
          { kr: "물 = ㅁ + ㅜ + ㄹ", en: "mul — water" },
        ],
      },
      {
        type: "stroke",
        chars: ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"],
        note: "The six basic vowels. Vertical ones sit to the right of a consonant, horizontal ones sit below.",
      },
      {
        type: "speak",
        title: "Say the vowels (ㅇ is a silent placeholder)",
        items: [
          { kr: "아", en: "a — like 'father'" },
          { kr: "오", en: "o — like 'go'" },
          { kr: "우", en: "u — like 'moon'" },
          { kr: "이", en: "i — like 'see'" },
        ],
      },
    ],
  },
  {
    day: 2,
    key: "course-day-2",
    title: "Consonants I — read your first words",
    titleKr: "자음 1군 ㄱㄴㄷㄹㅁ",
    minutes: 8,
    phases: [
      {
        type: "intro",
        kr: "오늘은 자음이에요!",
        en: "Five consonants today — then you'll read real Korean words.",
      },
      {
        type: "concept",
        title: "Picture the shapes",
        body: "Each letter looks like something. ㄱ is a corner (g/k). ㄴ is a foot pointing forward (n). ㅁ is a door frame (m). ㄷ is an open box (d). ㄹ is a winding road (r/l).",
        examples: [
          { kr: "ㅁ = door → 문", en: "mun means door — really!" },
          { kr: "ㄴ = foot → 나", en: "na means me" },
        ],
      },
      {
        type: "stroke",
        chars: ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ"],
        note: "Top-to-bottom, left-to-right — strokes always flow that way.",
      },
      {
        type: "speak",
        title: "Read real words with what you know",
        items: [
          { kr: "나", en: "na — I, me" },
          { kr: "너", en: "neo — you" },
          { kr: "나무", en: "namu — tree" },
          { kr: "머리", en: "meori — head" },
        ],
      },
    ],
  },
  {
    day: 3,
    key: "course-day-3",
    title: "Consonants II + the silent ㅇ",
    titleKr: "자음 2군 ㅅㅂㅈㅇㅎ",
    minutes: 8,
    phases: [
      {
        type: "intro",
        kr: "오늘은 ㅇ의 비밀!",
        en: "Five more consonants — including the mysterious circle ㅇ.",
      },
      {
        type: "concept",
        title: "ㅇ is silent (at the start)",
        body: "Every syllable block must start with a consonant. When a syllable starts with a vowel sound, ㅇ fills the spot silently. So 아 is just 'a', 이 is just 'i'. ㅅ is a mountain (s), ㅂ a bucket (b), ㅈ is j, ㅎ is a man with a hat (h).",
        examples: [
          { kr: "아이 = a + i", en: "ai — child. Both ㅇ are silent!" },
          { kr: "바다", en: "bada — sea" },
        ],
      },
      {
        type: "stroke",
        chars: ["ㅅ", "ㅂ", "ㅈ", "ㅇ", "ㅎ"],
        note: "ㅇ is one smooth circle stroke.",
      },
      {
        type: "speak",
        title: "Read more real words",
        items: [
          { kr: "아이", en: "ai — child" },
          { kr: "바다", en: "bada — sea" },
          { kr: "하나", en: "hana — one" },
          { kr: "우유", en: "uyu — milk" },
        ],
      },
    ],
  },
  {
    day: 4,
    key: "course-day-4",
    title: "Y-vowels and compound vowels",
    titleKr: "ㅑㅕㅛㅠ / ㅐㅔ",
    minutes: 8,
    phases: [
      {
        type: "intro",
        kr: "작대기 하나 더!",
        en: "One extra stick = a 'y' sound. That's the whole rule today.",
      },
      {
        type: "concept",
        title: "Double the stick, add a y",
        body: "ㅏ(a) → ㅑ(ya). ㅓ(eo) → ㅕ(yeo). ㅗ(o) → ㅛ(yo). ㅜ(u) → ㅠ(yu). And two more team-ups: ㅐ and ㅔ both sound like 'e' in 'bed' — even Koreans pronounce them the same.",
        examples: [
          { kr: "야! = ya!", en: "hey! (casual)" },
          { kr: "예 = ye", en: "yes (polite)" },
        ],
      },
      {
        type: "stroke",
        chars: ["ㅑ", "ㅕ", "ㅛ", "ㅠ", "ㅐ", "ㅔ"],
        note: "Same shapes you know, one extra stroke.",
      },
      {
        type: "speak",
        title: "Read them in words",
        items: [
          { kr: "야구", en: "yagu — baseball" },
          { kr: "여자", en: "yeoja — woman" },
          { kr: "우유", en: "uyu — milk" },
          { kr: "가게", en: "gage — shop" },
        ],
      },
    ],
  },
  {
    day: 5,
    key: "course-day-5",
    title: "Strong sounds — 달/탈/딸",
    titleKr: "격음·경음 ㅋㅌㅍㅊ / ㄲㄸㅆ",
    minutes: 10,
    phases: [
      {
        type: "intro",
        kr: "달? 탈? 딸?",
        en: "Three words that sound almost identical to English ears. Let's train yours.",
      },
      {
        type: "concept",
        title: "Plain, breathy, tense",
        body: "Add a line to a consonant → a puff of air: ㄱ→ㅋ, ㄷ→ㅌ, ㅂ→ㅍ, ㅈ→ㅊ. Double it → a tense, tight sound: ㄲ, ㄸ, ㅆ. Hold your palm in front of your mouth: 카 puffs air, 까 doesn't.",
        examples: [
          { kr: "달 / 탈 / 딸", en: "moon / mask / daughter" },
          { kr: "불 / 풀 / 뿔", en: "fire / grass / horn" },
        ],
      },
      {
        type: "stroke",
        chars: ["ㅋ", "ㅌ", "ㅍ", "ㅊ"],
        note: "One extra line = one extra puff of air.",
      },
      {
        type: "speak",
        title: "Feel the difference",
        items: [
          { kr: "달", en: "dal — moon (plain)" },
          { kr: "탈", en: "tal — mask (breathy)" },
          { kr: "딸", en: "ttal — daughter (tense)" },
          { kr: "커피", en: "keopi — coffee" },
        ],
      },
    ],
  },
  {
    day: 6,
    key: "course-day-6",
    title: "Final consonants (batchim)",
    titleKr: "받침 — 블록의 바닥층",
    minutes: 8,
    phases: [
      {
        type: "intro",
        kr: "밥, 물, 강!",
        en: "A consonant can sit at the bottom of a block. That's batchim — the last piece of the puzzle.",
      },
      {
        type: "concept",
        title: "The bottom floor",
        body: "밥 = ㅂ + ㅏ + ㅂ. The bottom ㅂ closes the syllable: 'bap'. At the bottom, ㅇ is no longer silent — it's the 'ng' in 'song': 강 = kang.",
        examples: [
          { kr: "밥 = ba + p", en: "bap — rice, a meal" },
          { kr: "강 = ka + ng", en: "kang — river" },
        ],
      },
      {
        type: "speak",
        title: "Read closed syllables",
        items: [
          { kr: "밥", en: "bap — rice" },
          { kr: "물", en: "mul — water" },
          { kr: "집", en: "jip — house" },
          { kr: "산", en: "san — mountain" },
          { kr: "강", en: "kang — river" },
        ],
      },
    ],
  },
  {
    day: 7,
    key: "course-day-7",
    title: "Reading sprint — words you already know",
    titleKr: "읽기 스피드런",
    minutes: 10,
    phases: [
      {
        type: "intro",
        kr: "이제 다 읽을 수 있어요!",
        en: "You can now read every Korean word. Prove it with words you already know.",
      },
      {
        type: "speak",
        title: "Read these famous words",
        items: [
          { kr: "서울", en: "Seoul" },
          { kr: "김치", en: "kimchi" },
          { kr: "비빔밥", en: "bibimbap" },
          { kr: "부산", en: "Busan" },
          { kr: "라면", en: "ramyeon — instant noodles" },
        ],
      },
      {
        type: "speak",
        title: "Your first phrases — just memorize the sound",
        items: [
          { kr: "안녕하세요", en: "annyeonghaseyo — hello" },
          { kr: "감사합니다", en: "gamsahamnida — thank you" },
          { kr: "네 / 아니요", en: "ne / aniyo — yes / no" },
        ],
      },
    ],
  },

  // ---------------- Week 2–3 · Grammar track (modules 0–8) ----------------
  {
    day: 8,
    key: "course-day-8",
    title: "Module 0 · Word order — the verb goes last",
    titleKr: "어순: 주어 + 목적어 + 서술어",
    minutes: 8,
    phases: [
      {
        type: "intro",
        kr: "동사는 맨 끝!",
        en: "English says I-drink-water. Korean says I-water-drink. One rule: the verb goes last.",
      },
      {
        type: "concept",
        title: "Subject + Object + Verb",
        body: "English: I drink water (S-V-O). Korean: 저는 물을 마셔요 = I + water + drink (S-O-V). Whatever else happens in a sentence, the verb sits at the very end.",
        examples: [
          { kr: "저는 물을 마셔요.", en: "I drink water. (lit. I water drink)" },
          { kr: "저는 밥을 먹어요.", en: "I eat rice. (lit. I rice eat)" },
          { kr: "저는 한국어를 배워요.", en: "I learn Korean. (lit. I Korean learn)" },
        ],
      },
      {
        type: "speak",
        title: "Say the pattern",
        items: [
          { kr: "저는 물을 마셔요.", en: "I drink water." },
          { kr: "저는 밥을 먹어요.", en: "I eat rice." },
        ],
      },
    ],
  },
  {
    day: 9,
    key: "course-day-9",
    title: "Module 1a · The be-verb — ~이에요/예요",
    titleKr: "be동사: ~이에요/예요",
    minutes: 8,
    phases: [
      {
        type: "intro",
        kr: "저는 마크예요!",
        en: "am / is / are — in Korean it's one ending stuck to the noun: ~이에요/예요.",
      },
      {
        type: "concept",
        title: "X는 Y예요 = X is Y",
        body: "After a vowel use 예요, after a final consonant use 이에요. That's the whole rule. 마크 ends in a vowel → 마크예요. 물 ends in ㄹ → 물이에요.",
        examples: [
          { kr: "저는 마크예요.", en: "I am Mark." },
          { kr: "이거는 물이에요.", en: "This is water." },
          { kr: "저는 학생이에요.", en: "I am a student." },
        ],
      },
      {
        type: "speak",
        title: "Swap the noun, keep the frame",
        items: [
          { kr: "저는 마크예요.", en: "I am Mark. (say your name!)" },
          { kr: "이거는 커피예요.", en: "This is coffee." },
          { kr: "저는 학생이에요.", en: "I am a student." },
        ],
      },
    ],
  },
  {
    day: 10,
    key: "course-day-10",
    title: "Module 1b · Verbs + can / must",
    titleKr: "일반동사 + 조동사 (-ㄹ 수 있어요, -야 해요)",
    minutes: 10,
    phases: [
      {
        type: "intro",
        kr: "먹어요, 가요, 자요!",
        en: "Real verbs today — plus how to say 'can' and 'must'.",
      },
      {
        type: "concept",
        title: "Learn verbs as ready-to-use chunks",
        body: "Dictionary form ends in -다 (먹다 to eat), but people speak in the -요 form: 먹어요. Just learn the -요 form whole. For 'can': verb + -(으)ㄹ 수 있어요. For 'must': verb + -야 해요.",
        examples: [
          { kr: "저는 밥을 먹어요.", en: "I eat (rice)." },
          { kr: "저는 학교에 가요.", en: "I go to school." },
          { kr: "저는 한국어를 할 수 있어요.", en: "I can speak Korean." },
          { kr: "저는 집에 가야 해요.", en: "I must go home." },
        ],
      },
      {
        type: "speak",
        title: "Say the chunks",
        items: [
          { kr: "먹어요", en: "eat" },
          { kr: "가요", en: "go" },
          { kr: "자요", en: "sleep" },
          { kr: "할 수 있어요", en: "can do" },
          { kr: "가야 해요", en: "must go" },
        ],
      },
    ],
  },
  {
    day: 11,
    key: "course-day-11",
    title: "Module 2 · Particles — 은/는, 이/가, 을/를",
    titleKr: "조사: 명사에 붙는 스티커",
    minutes: 10,
    phases: [
      {
        type: "intro",
        kr: "은? 는? 이? 가?",
        en: "In English, position tells you who does what. In Korean, little stickers on nouns do that job.",
      },
      {
        type: "concept",
        title: "Stickers on nouns",
        body: "은/는 marks the topic ('as for X'). 이/가 marks the subject. 을/를 marks the object. Pick by sound: after a consonant use 은/이/을, after a vowel use 는/가/를. Because the stickers carry the roles, word order can even move — the meaning stays.",
        examples: [
          { kr: "저는 커피를 마셔요.", en: "I(topic) drink coffee(object)." },
          { kr: "친구가 와요.", en: "A friend(subject) is coming." },
          { kr: "저는 밥을 먹어요.", en: "I eat rice. — 밥 ends in ㅂ → 을" },
        ],
      },
      {
        type: "speak",
        title: "Feel the stickers",
        items: [
          { kr: "저는 물을 마셔요.", en: "I drink water." },
          { kr: "친구가 와요.", en: "A friend is coming." },
          { kr: "저는 커피를 마셔요.", en: "I drink coffee." },
        ],
      },
    ],
  },
  {
    day: 12,
    key: "course-day-12",
    title: "Module 3 · Tenses — one verb, four times",
    titleKr: "시제: 먹었어요·먹어요·먹고 있어요·먹을 거예요",
    minutes: 10,
    phases: [
      {
        type: "intro",
        kr: "어제, 지금, 내일!",
        en: "Take one verb — eat — and move it through time.",
      },
      {
        type: "concept",
        title: "The timeline of 먹다",
        body: "Past: 먹었어요 (ate). Present: 먹어요 (eat). Right now: 먹고 있어요 (am eating). Future: 먹을 거예요 (will eat). Same endings work on almost every verb.",
        examples: [
          { kr: "어제 밥을 먹었어요.", en: "Yesterday I ate." },
          { kr: "지금 밥을 먹고 있어요.", en: "I am eating right now." },
          { kr: "내일 밥을 먹을 거예요.", en: "Tomorrow I will eat." },
        ],
      },
      {
        type: "speak",
        title: "Walk the timeline",
        items: [
          { kr: "먹었어요", en: "ate (past)" },
          { kr: "먹어요", en: "eat (present)" },
          { kr: "먹고 있어요", en: "am eating (now)" },
          { kr: "먹을 거예요", en: "will eat (future)" },
        ],
      },
    ],
  },
  {
    day: 13,
    key: "course-day-13",
    title: "Module 4 · 'to eat' and 'eating' — -으러, -으려고, -는 것",
    titleKr: "to부정사·동명사",
    minutes: 10,
    phases: [
      {
        type: "intro",
        kr: "밥을 먹으러 가요!",
        en: "How to say 'in order to' and turn a verb into a thing — English's to-infinitive and gerund, Korean style.",
      },
      {
        type: "concept",
        title: "Three endings, three jobs",
        body: "-(으)러 = go somewhere TO do: 먹으러 가요 (go to eat). -(으)려고 = intending to: 먹으려고 해요 (plan to eat). -는 것 = verb→noun, like English -ing: 먹는 것 (eating).",
        examples: [
          { kr: "밥을 먹으러 가요.", en: "I'm going (somewhere) to eat." },
          { kr: "한국어를 배우려고 해요.", en: "I intend to learn Korean." },
          { kr: "한국어를 배우는 것이 좋아요.", en: "Learning Korean is good / I like learning Korean." },
        ],
      },
      {
        type: "speak",
        title: "Say the patterns",
        items: [
          { kr: "밥을 먹으러 가요.", en: "going to eat" },
          { kr: "친구를 만나러 가요.", en: "going to meet a friend" },
          { kr: "먹는 것", en: "eating (as a noun)" },
        ],
      },
    ],
  },
  {
    day: 14,
    key: "course-day-14",
    title: "Module 5 · Relative clauses — the describing flip",
    titleKr: "관계대명사: ~가 ~하는 N",
    minutes: 10,
    phases: [
      {
        type: "intro",
        kr: "제가 마시는 커피",
        en: "'The coffee that I drink' — Korean says it backwards: the description comes BEFORE the noun.",
      },
      {
        type: "concept",
        title: "Description first, noun last",
        body: "English: the coffee [that I drink]. Korean: [제가 마시는] 커피 — literally '[I-drink] coffee'. No word for 'that/which' — the verb ending -는 (present) or -(으)ㄴ (past) does the job.",
        examples: [
          { kr: "제가 마시는 커피", en: "the coffee that I drink" },
          { kr: "어제 본 영화", en: "the movie (I) saw yesterday" },
          { kr: "제가 좋아하는 사람", en: "the person that I like" },
        ],
      },
      {
        type: "speak",
        title: "Flip it",
        items: [
          { kr: "제가 마시는 커피", en: "the coffee I drink" },
          { kr: "어제 본 영화", en: "the movie I saw yesterday" },
          { kr: "제가 먹는 밥", en: "the rice I'm eating" },
        ],
      },
    ],
  },
  {
    day: 15,
    key: "course-day-15",
    title: "Modules 6+7 · 'when/what to…' and 'if'",
    titleKr: "의문사절 (-ㄹ지) + 가정법 (-면)",
    minutes: 10,
    phases: [
      {
        type: "intro",
        kr: "뭘 먹을지 몰라요!",
        en: "Two final tools: embedded questions ('I don't know what to eat') and if-sentences.",
      },
      {
        type: "concept",
        title: "-ㄹ지 = whether/what-to · -면 = if",
        body: "Question word + verb + -ㄹ지: 뭘 먹을지 (what to eat), 언제 갈지 (when to go). For 'if', attach -(으)면 to the condition: 비가 오면 (if it rains) — then say the result.",
        examples: [
          { kr: "뭘 먹을지 몰라요.", en: "I don't know what to eat." },
          { kr: "언제 갈지 몰라요.", en: "I don't know when to go." },
          { kr: "비가 오면 집에 있을 거예요.", en: "If it rains, I'll stay home." },
          { kr: "시간이 있으면 갈 거예요.", en: "If I have time, I'll go." },
        ],
      },
      {
        type: "speak",
        title: "Say the patterns",
        items: [
          { kr: "뭘 먹을지 몰라요.", en: "I don't know what to eat." },
          { kr: "비가 오면 집에 있을 거예요.", en: "If it rains, I'll stay home." },
        ],
      },
    ],
  },
  {
    day: 16,
    key: "course-day-16",
    title: "Module 8 · Writing test — build the sentences",
    titleKr: "작문 테스트 🎉",
    minutes: 15,
    phases: [
      {
        type: "intro",
        kr: "마지막 날이에요!",
        en: "Final day. Eight English sentences — pick the correct Korean for each. Everything you've learned, together.",
      },
      {
        type: "quiz",
        questions: [
          q("I am a student.", ["저는 학생이에요.", "저는 학생 가요.", "학생은 저를 이에요."], "저는 학생이에요.", "module 1: be-verb"),
          q("I drink water.", ["저는 물을 마셔요.", "저는 마셔요 물을.", "물은 저를 마셔요."], "저는 물을 마셔요.", "module 0+2: order + particles"),
          q("I can speak Korean.", ["한국어를 할 수 있어요.", "한국어를 해야 해요.", "한국어를 했어요."], "한국어를 할 수 있어요.", "module 1: can"),
          q("Yesterday I ate rice.", ["어제 밥을 먹었어요.", "어제 밥을 먹을 거예요.", "어제 밥을 먹고 있어요."], "어제 밥을 먹었어요.", "module 3: past"),
          q("I'm going (out) to eat.", ["밥을 먹으러 가요.", "밥을 먹는 것 가요.", "밥을 먹으면 가요."], "밥을 먹으러 가요.", "module 4"),
          q("the coffee that I drink", ["제가 마시는 커피", "커피가 제가 마셔요", "마시는 제가 커피"], "제가 마시는 커피", "module 5"),
          q("I don't know what to eat.", ["뭘 먹을지 몰라요.", "뭘 먹으면 몰라요.", "뭘 먹으러 몰라요."], "뭘 먹을지 몰라요.", "module 6"),
          q("If it rains, I'll stay home.", ["비가 오면 집에 있을 거예요.", "비가 올지 집에 있어요.", "비가 오러 집에 갔어요."], "비가 오면 집에 있을 거예요.", "module 7"),
        ],
      },
      {
        type: "speak",
        title: "Your graduation line — say it proudly",
        items: [
          { kr: "저는 한국어를 할 수 있어요!", en: "I can speak Korean!" },
        ],
      },
    ],
  },
];

// Optional per-chapter practice quizzes ("추가 학습"). Entirely optional:
// they never gate completion and write no progress. Day 16 has no entry —
// its writing test is the course finale.
export type QuizQuestion = { q: string; hint?: string; options: string[]; answer: string };

export const DAY_QUIZZES: Record<number, QuizQuestion[]> = {
  1: [
    q("Which vowel sounds like the 'a' in 'father'?", ["ㅏ", "ㅜ", "ㅣ"], "ㅏ"),
    q("한 is made of how many letters?", ["2", "3", "4"], "3", "ㅎ + ㅏ + ㄴ"),
    q("Which one sounds like 'u' in 'moon'?", ["ㅗ", "ㅡ", "ㅜ"], "ㅜ"),
    q("Korean letters are written…", ["in a line like English", "stacked into square blocks", "right to left"], "stacked into square blocks"),
    q("Which vowel is horizontal (sits below a consonant)?", ["ㅗ", "ㅏ", "ㅣ"], "ㅗ"),
    q("Read this: 이", ["i", "a", "o"], "i"),
    q("Read this: 오", ["o", "u", "i"], "o"),
    q("Which one sounds like 'o' in 'go'?", ["ㅗ", "ㅓ", "ㅜ"], "ㅗ"),
    q("ㅡ sounds like…", ["a relaxed 'uh' (eu)", "ee", "ya"], "a relaxed 'uh' (eu)"),
    q("물 (ㅁ+ㅜ+ㄹ) is how many syllable blocks?", ["1", "2", "3"], "1"),
  ],
  2: [
    q("Which letter is the 'm' sound (the door)?", ["ㄱ", "ㅁ", "ㄴ"], "ㅁ"),
    q("나무 means…", ["tree", "head", "water"], "tree"),
    q("Read this: 너", ["na", "neo", "no"], "neo"),
    q("ㄱ sounds like…", ["g/k", "m", "n"], "g/k"),
    q("Which letter is 'n' (the foot)?", ["ㄴ", "ㄷ", "ㄹ"], "ㄴ"),
    q("Read this: 나", ["na", "ma", "da"], "na"),
    q("머리 means…", ["head", "tree", "you"], "head"),
    q("ㄹ sounds like…", ["r/l", "b", "h"], "r/l"),
    q("ㄷ is the … sound", ["d/t", "g/k", "m"], "d/t"),
    q("Read this: 무", ["mu", "nu", "du"], "mu"),
  ],
  3: [
    q("What sound does ㅇ make at the start of 아?", ["ng", "silent", "h"], "silent"),
    q("바다 means…", ["sea", "child", "milk"], "sea"),
    q("Read this: 하나", ["hana", "sana", "bana"], "hana"),
    q("ㅅ sounds like…", ["s", "j", "h"], "s"),
    q("Which letter is 'h'?", ["ㅎ", "ㅇ", "ㅂ"], "ㅎ"),
    q("Read this: 자", ["ja", "sa", "ha"], "ja"),
    q("ㅂ sounds like…", ["b/p", "s", "ng"], "b/p"),
    q("Read this: 바다", ["bada", "mada", "hada"], "bada"),
    q("아이 has how many silent ㅇ?", ["0", "1", "2"], "2"),
    q("Why does 아 start with ㅇ?", ["every block needs a starting consonant", "it makes an 'ng' sound", "decoration"], "every block needs a starting consonant"),
  ],
  4: [
    q("ㅏ with one extra stick becomes…", ["ㅑ (ya)", "ㅓ (eo)", "ㅣ (i)"], "ㅑ (ya)"),
    q("여자 means…", ["baseball", "woman", "shop"], "woman"),
    q("ㅐ and ㅔ sound…", ["very different", "almost the same", "silent"], "almost the same"),
    q("ㅕ sounds like…", ["yeo", "ya", "yo"], "yeo"),
    q("Read this: 우유", ["uyu", "oyo", "ayu"], "uyu"),
    q("야구 means…", ["baseball", "woman", "milk"], "baseball"),
    q("ㅠ sounds like…", ["yu", "yo", "ye"], "yu"),
    q("가게 means…", ["shop", "house", "school"], "shop"),
    q("Read this: 예", ["ye", "ya", "yo"], "ye"),
    q("ㅛ sounds like…", ["yo", "yu", "u"], "yo"),
  ],
  5: [
    q("딸 means…", ["moon", "mask", "daughter"], "daughter"),
    q("Which one has a puff of air?", ["가", "카", "까"], "카"),
    q("커피 means…", ["coffee", "cola", "cocoa"], "coffee"),
    q("탈 means…", ["mask", "moon", "daughter"], "mask"),
    q("Which is the tense (tight) sound?", ["가", "카", "까"], "까"),
    q("ㅍ is the breathy version of…", ["ㅂ", "ㅁ", "ㅅ"], "ㅂ"),
    q("불 means…", ["fire", "grass", "horn"], "fire"),
    q("Read this: 뿔", ["ppul", "pul", "bul"], "ppul"),
    q("ㅊ is the breathy version of…", ["ㅈ", "ㅅ", "ㄷ"], "ㅈ"),
    q("달 means…", ["moon", "mask", "daughter"], "moon"),
  ],
  6: [
    q("The bottom consonant in 밥 makes it sound like…", ["ba", "bap", "bam"], "bap"),
    q("ㅇ at the bottom of a block sounds like…", ["silent", "ng", "m"], "ng"),
    q("물 means…", ["rice", "house", "water"], "water"),
    q("집 means…", ["house", "rice", "mountain"], "house"),
    q("A batchim sits at the … of the block", ["bottom", "top", "right"], "bottom"),
    q("Read this: 강", ["kang", "kan", "kam"], "kang"),
    q("밥 means…", ["rice", "water", "river"], "rice"),
    q("산 ends with which sound?", ["n", "m", "p"], "n"),
    q("Read this: 물", ["mul", "mun", "mu"], "mul"),
    q("강 means…", ["river", "mountain", "house"], "river"),
  ],
  7: [
    q("Read this: 서울", ["Seoul", "Busan", "Suwon"], "Seoul"),
    q("How do you say 'thank you'?", ["안녕하세요", "감사합니다", "아니요"], "감사합니다"),
    q("Read this: 김치", ["kimbap", "kimchi", "kkochi"], "kimchi"),
    q("Read this: 부산", ["Busan", "Suwon", "Seoul"], "Busan"),
    q("안녕하세요 means…", ["hello", "thank you", "goodbye"], "hello"),
    q("'yes' is…", ["네", "아니요", "감사"], "네"),
    q("Read this: 비빔밥", ["bibimbap", "bulgogi", "gimbap"], "bibimbap"),
    q("'no' is…", ["아니요", "네", "안녕"], "아니요"),
    q("Read this: 라면", ["ramyeon", "myeonra", "namyeon"], "ramyeon"),
    q("감사합니다 means…", ["thank you", "hello", "sorry"], "thank you"),
  ],
  8: [
    q("Where does the Korean verb go?", ["first", "middle", "last"], "last"),
    q("'I eat rice' in Korean order is…", ["I eat rice", "I rice eat", "Rice eat I"], "I rice eat"),
    q("저는 물을 마셔요 means…", ["I drink water", "I eat rice", "I like water"], "I drink water"),
    q("Korean word order is…", ["SOV", "SVO", "VSO"], "SOV"),
    q("In 저는 밥을 먹어요, the verb is…", ["저는", "밥을", "먹어요"], "먹어요"),
    q("'I learn Korean' in Korean order is…", ["I Korean learn", "I learn Korean", "Korean I learn"], "I Korean learn"),
    q("저는 means…", ["I (as the topic)", "water", "eat"], "I (as the topic)"),
    q("What never moves from the end of the sentence?", ["the verb", "the subject", "the object"], "the verb"),
    q("마셔요 means…", ["drink", "eat", "sleep"], "drink"),
    q("Pick the correct sentence for 'I eat rice'", ["저는 밥을 먹어요", "저는 먹어요 밥을", "밥을 먹어요 저는요"], "저는 밥을 먹어요"),
  ],
  9: [
    q("물 ends in a consonant, so 'it is water' is…", ["물예요", "물이에요", "물요"], "물이에요"),
    q("커피 ends in a vowel, so 'it is coffee' is…", ["커피예요", "커피이에요", "커피에"], "커피예요"),
    q("저는 학생이에요 means…", ["I am a teacher", "I am a student", "I am Mark"], "I am a student"),
    q("After a vowel, 'is' is…", ["예요", "이에요", "있어요"], "예요"),
    q("선생님 ends in ㅁ. 'I am a teacher' → 저는 선생님…", ["이에요", "예요", "가요"], "이에요"),
    q("이거는 물이에요 means…", ["This is water", "I drink water", "Water is good"], "This is water"),
    q("학생 means…", ["student", "teacher", "friend"], "student"),
    q("'I am Mark' is…", ["저는 마크예요", "저는 마크이에요", "마크는 저예요"], "저는 마크예요"),
    q("The Korean be-verb attaches…", ["to the end of the noun", "before the noun", "nowhere — it's a separate word first"], "to the end of the noun"),
    q("이거 means…", ["this", "that over there", "what"], "this"),
  ],
  10: [
    q("'I can do it' uses…", ["할 수 있어요", "해야 해요", "했어요"], "할 수 있어요"),
    q("'I must go home' is 집에 …", ["가요", "가야 해요", "갈 수 있어요"], "가야 해요"),
    q("가요 means…", ["eat", "go", "sleep"], "go"),
    q("자요 means…", ["sleep", "go", "eat"], "sleep"),
    q("'can eat' is…", ["먹을 수 있어요", "먹어야 해요", "먹었어요"], "먹을 수 있어요"),
    q("'must eat' is…", ["먹어야 해요", "먹을 수 있어요", "먹어요"], "먹어야 해요"),
    q("Dictionary form of a verb ends in…", ["-다", "-요", "-까"], "-다", "먹다, 가다, 자다"),
    q("학교에 가요 means…", ["I go to school", "I go home", "I sleep"], "I go to school"),
    q("먹다 means…", ["to eat", "to go", "to sleep"], "to eat"),
    q("'I can speak Korean' is…", ["한국어를 할 수 있어요", "한국어를 해야 해요", "한국어를 몰라요"], "한국어를 할 수 있어요"),
  ],
  11: [
    q("커피 ends in a vowel. 'I drink coffee' → 커피_ 마셔요", ["을", "를", "은"], "를"),
    q("Which particle marks the object?", ["은/는", "이/가", "을/를"], "을/를"),
    q("친구가 와요 — 가 marks 친구 as the…", ["object", "subject", "verb"], "subject"),
    q("밥 ends in ㅂ. 'I eat rice' → 밥_ 먹어요", ["을", "를", "가"], "을"),
    q("은/는 marks the…", ["topic", "object", "verb"], "topic"),
    q("After a vowel, the subject marker is…", ["가", "이", "은"], "가"),
    q("저는 물을 마셔요 — 을 marks 물 as the…", ["object", "subject", "topic"], "object"),
    q("친구 ends in a vowel. 'a friend comes' → 친구_ 와요", ["가", "이", "을"], "가"),
    q("물 ends in ㄹ. Its subject marker is…", ["이", "가", "는"], "이"),
    q("Particles attach…", ["right after the noun", "before the noun", "to the verb"], "right after the noun"),
  ],
  12: [
    q("'I ate yesterday' → 어제 …", ["먹어요", "먹었어요", "먹을 거예요"], "먹었어요"),
    q("'I am eating right now' → 지금 …", ["먹고 있어요", "먹었어요", "먹어요"], "먹고 있어요"),
    q("먹을 거예요 is which tense?", ["past", "present", "future"], "future"),
    q("먹었어요 is which tense?", ["past", "present", "future"], "past"),
    q("'Tomorrow I will eat' → 내일 …", ["먹을 거예요", "먹었어요", "먹고 있어요"], "먹을 거예요"),
    q("'am/is doing (right now)' uses…", ["-고 있어요", "-었어요", "-을 거예요"], "-고 있어요"),
    q("어제 means…", ["yesterday", "today", "tomorrow"], "yesterday"),
    q("내일 means…", ["tomorrow", "yesterday", "now"], "tomorrow"),
    q("지금 means…", ["now", "later", "yesterday"], "now"),
    q("가요 in the past becomes…", ["갔어요", "갈 거예요", "가고 있어요"], "갔어요"),
  ],
  13: [
    q("'I go to eat' → 밥을 …", ["먹으러 가요", "먹는 것 가요", "먹으면 가요"], "먹으러 가요"),
    q("-는 것 turns a verb into a…", ["question", "noun", "command"], "noun"),
    q("배우려고 해요 means…", ["I learned", "I intend to learn", "learning is fun"], "I intend to learn"),
    q("'going to meet a friend' is…", ["친구를 만나러 가요", "친구를 만나면 가요", "친구를 만날 거예요"], "친구를 만나러 가요"),
    q("-(으)러 is used with verbs of…", ["going and coming", "eating", "being"], "going and coming"),
    q("'learning Korean' as a noun is…", ["한국어를 배우는 것", "한국어를 배우러", "한국어를 배우면"], "한국어를 배우는 것"),
    q("먹으러 가요 means…", ["going (somewhere) to eat", "must eat", "ate"], "going (somewhere) to eat"),
    q("-(으)려고 해요 expresses…", ["intention", "the past", "ability"], "intention"),
    q("'I like eating' → 먹는 __이 좋아요", ["것", "러", "면"], "것"),
    q("만나다 means…", ["to meet", "to eat", "to buy"], "to meet"),
  ],
  14: [
    q("In Korean, the description goes…", ["after the noun", "before the noun", "anywhere"], "before the noun"),
    q("'the movie I saw yesterday' is…", ["영화 어제 본", "어제 본 영화", "본 영화 어제"], "어제 본 영화"),
    q("제가 좋아하는 사람 means…", ["the person I like", "I like a person", "a nice person"], "the person I like"),
    q("'the rice I'm eating' is…", ["제가 먹는 밥", "밥 제가 먹는", "먹는 밥 제가"], "제가 먹는 밥"),
    q("The present describing ending is…", ["-는", "-(으)ㄴ", "-면"], "-는", "마시는 커피"),
    q("The past describing ending (본 in 어제 본 영화) is…", ["-(으)ㄴ", "-는", "-지"], "-(으)ㄴ"),
    q("Does Korean have a word for 'that/which'?", ["no — the verb ending does the job", "yes: 것", "yes: 는"], "no — the verb ending does the job"),
    q("본 comes from which verb?", ["보다 (to see)", "오다 (to come)", "먹다 (to eat)"], "보다 (to see)"),
    q("'the person who comes' is…", ["오는 사람", "사람 오는", "온 사람요"], "오는 사람"),
    q("제가 좋아하는 커피 means…", ["the coffee I like", "I like coffee", "coffee likes me"], "the coffee I like"),
  ],
  15: [
    q("'if it rains' is…", ["비가 오면", "비가 올지", "비가 와서"], "비가 오면"),
    q("뭘 먹을지 몰라요 means…", ["I don't know what to eat", "I won't eat", "What did you eat?"], "I don't know what to eat"),
    q("-면 attaches to the…", ["result", "condition", "noun"], "condition"),
    q("'I don't know when to go' is…", ["언제 갈지 몰라요", "언제 가면 몰라요", "언제 가러 몰라요"], "언제 갈지 몰라요"),
    q("몰라요 means…", ["I don't know", "I know", "I want"], "I don't know"),
    q("'If I have time' is…", ["시간이 있으면", "시간이 있을지", "시간이 있어서"], "시간이 있으면"),
    q("-(으)면 means…", ["if / when", "because", "but"], "if / when"),
    q("뭘 means…", ["what (as the object)", "when", "where"], "what (as the object)"),
    q("In 비가 오면 집에 있을 거예요, the result part is…", ["집에 있을 거예요", "비가 오면", "비가 와요"], "집에 있을 거예요"),
    q("언제 means…", ["when", "what", "who"], "when"),
  ],
};

export const COURSE_TOTAL_DAYS = COURSE_DAYS.length;

// Chain-view grouping for the /course overview page.
export type CourseSection = {
  key: string;
  title: string;
  titleKr: string;
  sub: string;
  days: CourseDay[];
};

export const COURSE_SECTIONS: CourseSection[] = [
  {
    key: "hangul",
    title: "Consonants & Vowels",
    titleKr: "자음·모음 코스",
    sub: "Day 1–7 · learn to read Hangul with picture mnemonics and stroke animations",
    days: COURSE_DAYS.filter((d) => d.day <= 7),
  },
  {
    key: "grammar",
    title: "Grammar",
    titleKr: "문법 코스",
    sub: "Day 8–16 · word order to if-clauses, with a writing test on the final day",
    days: COURSE_DAYS.filter((d) => d.day >= 8),
  },
];

export function getCourseDay(day: number): CourseDay | null {
  return COURSE_DAYS.find((d) => d.day === day) ?? null;
}

/** First not-yet-completed day, given completed step keys from path_progress. */
export function nextCourseDay(doneKeys: Set<string>): CourseDay | null {
  return COURSE_DAYS.find((d) => !doneKeys.has(d.key)) ?? null;
}
