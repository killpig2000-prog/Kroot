import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";

export type GrammarExample = { kr: string; romanization: string; en: string };

export type GrammarSection = {
  heading: string;
  explanation: string;
  examples: GrammarExample[];
};

export type GrammarQuiz = { q: string; opts: string[]; ans: number };

export type GrammarLesson = {
  key: string;
  title: string;
  krTitle: string;
  level: CefrLevel;
  summary: string;
  sections: GrammarSection[];
  quiz: GrammarQuiz[];
};

const RAW_LESSONS: GrammarLesson[] = [
  {
    key: "word-order",
    title: "Korean word order (SOV)",
    krTitle: "어순",
    level: "A1",
    summary: "The verb always comes last. Everything else is flexible because particles carry the meaning.",
    sections: [
      {
        heading: "Subject – Object – Verb",
        explanation:
          "English is Subject–Verb–Object: 'I eat bread.' Korean is Subject–Object–Verb: 'I bread eat.' Once you expect the verb at the end, most sentences stop feeling scrambled.",
        examples: [
          { kr: "저는 빵을 먹어요.", romanization: "jeo-neun ppang-eul meogeoyo.", en: "I eat bread." },
          { kr: "친구가 커피를 마셔요.", romanization: "chingu-ga keopi-reul masyeoyo.", en: "My friend drinks coffee." },
          { kr: "저는 한국어를 공부해요.", romanization: "jeo-neun hangugeo-reul gongbuhaeyo.", en: "I study Korean." },
        ],
      },
      {
        heading: "Particles do the work, so order can move",
        explanation:
          "Because 은/는 marks the topic and 을/를 marks the object, you can move those chunks around for emphasis and the sentence still means the same thing. Only the verb is locked to the end.",
        examples: [
          { kr: "빵을 저는 먹어요.", romanization: "ppang-eul jeo-neun meogeoyo.", en: "Bread, I eat. (same meaning, bread emphasised)" },
          { kr: "오늘 저는 학교에 가요.", romanization: "oneul jeo-neun hakgyo-e gayo.", en: "Today I go to school." },
        ],
      },
      {
        heading: "You can drop what's obvious",
        explanation:
          "Korean leaves out the subject whenever context makes it clear. A one-word answer is a complete sentence.",
        examples: [
          { kr: "어디 가요?", romanization: "eodi gayo?", en: "Where are you going? (no 'you' needed)" },
          { kr: "집에 가요.", romanization: "jib-e gayo.", en: "(I'm) going home." },
        ],
      },
    ],
    quiz: [
      { q: "Where does the verb go in a Korean sentence?", opts: ["First", "Second", "At the very end", "Anywhere"], ans: 2 },
      { q: "Which sentence means 'I study Korean'?", opts: ["저는 공부해요 한국어를.", "저는 한국어를 공부해요.", "공부해요 저는 한국어를.", "한국어를 공부해요 저는."], ans: 1 },
      { q: "Why can Korean move phrases around so freely?", opts: ["Because verbs change form", "Because particles mark each word's role", "Because there are no nouns", "Because word order is random"], ans: 1 },
    ],
  },
  {
    key: "topic-vs-subject",
    title: "은/는 vs 이/가",
    krTitle: "은/는 · 이/가",
    level: "A1",
    summary: "은/는 sets the topic and invites contrast. 이/가 points at who exactly is doing something.",
    sections: [
      {
        heading: "The shapes",
        explanation:
          "After a consonant use 은 and 이. After a vowel use 는 and 가. That is the only spelling rule you need.",
        examples: [
          { kr: "저는 학생이에요.", romanization: "jeo-neun haksaeng-ieyo.", en: "I am a student. (저 ends in a vowel → 는)" },
          { kr: "선생님은 한국 사람이에요.", romanization: "seonsaengnim-eun hanguk saram-ieyo.", en: "The teacher is Korean. (님 ends in a consonant → 은)" },
        ],
      },
      {
        heading: "은/는: 'as for…'",
        explanation:
          "은/는 announces what the sentence is about, and quietly compares it to something else. Use it to introduce yourself and to contrast two things.",
        examples: [
          { kr: "저는 미국 사람이에요.", romanization: "jeo-neun miguk saram-ieyo.", en: "I'm American. (as for me)" },
          { kr: "커피는 좋아해요. 차는 안 좋아해요.", romanization: "keopi-neun joahaeyo. cha-neun an joahaeyo.", en: "Coffee I like. Tea I don't. (clear contrast)" },
        ],
      },
      {
        heading: "이/가: 'it is THIS one'",
        explanation:
          "이/가 identifies the subject, especially new information or the answer to 'who?' and 'what?'. It is also required with 있어요/없어요 and with descriptive verbs like 좋다.",
        examples: [
          { kr: "누가 왔어요? — 친구가 왔어요.", romanization: "nuga wasseoyo? — chingu-ga wasseoyo.", en: "Who came? — My friend came." },
          { kr: "시간이 없어요.", romanization: "sigan-i eopseoyo.", en: "I don't have time." },
          { kr: "날씨가 좋아요.", romanization: "nalssi-ga joayo.", en: "The weather is nice." },
        ],
      },
    ],
    quiz: [
      { q: "Which particle follows a word ending in a consonant, like 선생님?", opts: ["는", "은", "가", "를"], ans: 1 },
      { q: "'Who came?' — '친구___ 왔어요.' Which fits?", opts: ["는", "은", "가", "를"], ans: 2 },
      { q: "You want to contrast: 'Coffee I like, but tea I don't.' Which particle marks 커피 and 차?", opts: ["이/가", "은/는", "을/를", "에/에서"], ans: 1 },
    ],
  },
  {
    key: "object-marker",
    title: "The object marker 을/를",
    krTitle: "을/를",
    level: "A1",
    summary: "Mark the thing being acted on with 을 after a consonant, 를 after a vowel.",
    sections: [
      {
        heading: "Which one to use",
        explanation:
          "을 goes after a noun ending in a consonant; 를 after a noun ending in a vowel. The choice is purely about sound.",
        examples: [
          { kr: "밥을 먹어요.", romanization: "bab-eul meogeoyo.", en: "I eat rice. (밥 ends in ㅂ → 을)" },
          { kr: "커피를 마셔요.", romanization: "keopi-reul masyeoyo.", en: "I drink coffee. (커피 ends in a vowel → 를)" },
          { kr: "책을 읽어요.", romanization: "chaeg-eul ilgeoyo.", en: "I read a book." },
        ],
      },
      {
        heading: "It attaches to the receiver of the action",
        explanation:
          "Whatever is being eaten, watched, bought or studied takes 을/를. Verbs of motion like 가다 use 에 instead, not 을/를.",
        examples: [
          { kr: "영화를 봐요.", romanization: "yeonghwa-reul bwayo.", en: "I watch a movie." },
          { kr: "한국어를 배워요.", romanization: "hangugeo-reul baewoyo.", en: "I learn Korean." },
          { kr: "친구를 만나요.", romanization: "chingu-reul mannayo.", en: "I meet a friend. (Korean 만나다 takes an object)" },
        ],
      },
      {
        heading: "In casual speech it disappears",
        explanation:
          "Spoken Korean drops 을/를 constantly when the meaning is obvious. Keep it in writing and in careful speech.",
        examples: [
          { kr: "밥 먹었어요?", romanization: "bap meogeosseoyo?", en: "Did you eat? (을 dropped)" },
          { kr: "영화 볼래요?", romanization: "yeonghwa bollaeyo?", en: "Want to watch a movie?" },
        ],
      },
    ],
    quiz: [
      { q: "'책' ends in a consonant. Which object marker follows it?", opts: ["를", "을", "이", "가"], ans: 1 },
      { q: "Which sentence is correct for 'I drink coffee'?", opts: ["커피을 마셔요.", "커피를 마셔요.", "커피가 마셔요.", "커피에 마셔요."], ans: 1 },
      { q: "What does 을/를 mark?", opts: ["The topic", "The location", "The object of the verb", "The time"], ans: 2 },
    ],
  },
  {
    key: "to-be",
    title: "이에요 / 예요 — to be",
    krTitle: "이에요 · 예요",
    level: "A1",
    summary: "Attach 이에요 or 예요 to a noun to say 'is / am / are'.",
    sections: [
      {
        heading: "Noun + 이에요/예요",
        explanation:
          "Use 이에요 after a consonant and 예요 after a vowel. There is no separate word for 'is' — it glues straight onto the noun.",
        examples: [
          { kr: "저는 학생이에요.", romanization: "jeo-neun haksaeng-ieyo.", en: "I am a student. (학생 → consonant)" },
          { kr: "저는 의사예요.", romanization: "jeo-neun uisa-yeyo.", en: "I am a doctor. (의사 → vowel)" },
          { kr: "이건 커피예요.", romanization: "igeon keopi-yeyo.", en: "This is coffee." },
        ],
      },
      {
        heading: "Questions and negatives",
        explanation:
          "For a question, keep the same form and raise your intonation. For 'is not', use 이/가 아니에요.",
        examples: [
          { kr: "학생이에요?", romanization: "haksaeng-ieyo?", en: "Are you a student?" },
          { kr: "저는 학생이 아니에요.", romanization: "jeo-neun haksaeng-i anieyo.", en: "I am not a student." },
          { kr: "이건 커피가 아니에요.", romanization: "igeon keopi-ga anieyo.", en: "This is not coffee." },
        ],
      },
      {
        heading: "Don't confuse it with 있어요",
        explanation:
          "이에요/예요 means 'X is Y'. 있어요 means 'there is / I have'. They are not interchangeable.",
        examples: [
          { kr: "친구예요.", romanization: "chingu-yeyo.", en: "(It) is a friend." },
          { kr: "친구가 있어요.", romanization: "chingu-ga isseoyo.", en: "I have a friend." },
        ],
      },
    ],
    quiz: [
      { q: "'의사' ends in a vowel. Which form is correct?", opts: ["의사이에요", "의사예요", "의사가에요", "의사있어요"], ans: 1 },
      { q: "How do you say 'I am not a student'?", opts: ["저는 학생이에요.", "저는 학생이 아니에요.", "저는 학생이 없어요.", "저는 학생을 안 해요."], ans: 1 },
      { q: "Which means 'I have a friend'?", opts: ["친구예요.", "친구가 있어요.", "친구가 아니에요.", "친구를 예요."], ans: 1 },
    ],
  },
  {
    key: "present-tense",
    title: "Present tense 아요 / 어요",
    krTitle: "아요 · 어요",
    level: "A1",
    summary: "Drop 다 from the dictionary form, then add 아요 or 어요 depending on the last vowel.",
    sections: [
      {
        heading: "The rule",
        explanation:
          "Take the verb stem (dictionary form minus 다). If its last vowel is ㅏ or ㅗ, add 아요. Otherwise add 어요. 하다 verbs are irregular and become 해요.",
        examples: [
          { kr: "가다 → 가요", romanization: "gada → gayo", en: "to go → (I) go" },
          { kr: "먹다 → 먹어요", romanization: "meokda → meogeoyo", en: "to eat → (I) eat" },
          { kr: "공부하다 → 공부해요", romanization: "gongbuhada → gongbuhaeyo", en: "to study → (I) study" },
        ],
      },
      {
        heading: "When vowels merge",
        explanation:
          "If the stem already ends in ㅏ or ㅓ, the 아/어 is absorbed rather than doubled. 오 + 아요 contracts to 와요, and 우 + 어요 to 워요.",
        examples: [
          { kr: "오다 → 와요", romanization: "oda → wayo", en: "to come → (I) come" },
          { kr: "배우다 → 배워요", romanization: "baeuda → baewoyo", en: "to learn → (I) learn" },
          { kr: "마시다 → 마셔요", romanization: "masida → masyeoyo", en: "to drink → (I) drink" },
        ],
      },
      {
        heading: "One form, three jobs",
        explanation:
          "아요/어요 covers the present, the near future, and habitual actions. Intonation alone turns it into a question.",
        examples: [
          { kr: "지금 밥을 먹어요.", romanization: "jigeum bab-eul meogeoyo.", en: "I'm eating now." },
          { kr: "내일 학교에 가요.", romanization: "naeil hakgyo-e gayo.", en: "I'm going to school tomorrow." },
          { kr: "어디에 가요?", romanization: "eodi-e gayo?", en: "Where are you going?" },
        ],
      },
    ],
    quiz: [
      { q: "What is the present-tense form of 먹다?", opts: ["먹아요", "먹어요", "먹해요", "먹이에요"], ans: 1 },
      { q: "공부하다 becomes…", opts: ["공부하아요", "공부하어요", "공부해요", "공부이에요"], ans: 2 },
      { q: "Which stems take 아요?", opts: ["Stems whose last vowel is ㅏ or ㅗ", "Stems ending in a consonant", "All 하다 verbs", "Stems whose last vowel is ㅜ"], ans: 0 },
    ],
  },
  {
    key: "negation",
    title: "Saying no: 안 and 지 않다",
    krTitle: "안 · 지 않다",
    level: "A1",
    summary: "Put 안 in front of the verb for quick negation, or attach 지 않아요 to the stem for a more formal one.",
    sections: [
      {
        heading: "안 + verb",
        explanation:
          "The short form. Just place 안 immediately before the conjugated verb. This is what you'll hear most in conversation.",
        examples: [
          { kr: "저는 안 가요.", romanization: "jeo-neun an gayo.", en: "I'm not going." },
          { kr: "고기를 안 먹어요.", romanization: "gogi-reul an meogeoyo.", en: "I don't eat meat." },
          { kr: "오늘은 안 바빠요.", romanization: "oneul-eun an bappayo.", en: "I'm not busy today." },
        ],
      },
      {
        heading: "Stem + 지 않아요",
        explanation:
          "The long form. Slightly more formal and more emphatic, common in writing. Same meaning as 안.",
        examples: [
          { kr: "저는 가지 않아요.", romanization: "jeo-neun gaji anayo.", en: "I do not go." },
          { kr: "고기를 먹지 않아요.", romanization: "gogi-reul meokji anayo.", en: "I do not eat meat." },
        ],
      },
      {
        heading: "하다 verbs split",
        explanation:
          "With 하다 compounds, 안 goes between the noun and 하다 — not in front of the whole thing. Also note 있다's opposite is the separate word 없다, and 알다's is 모르다.",
        examples: [
          { kr: "공부 안 해요.", romanization: "gongbu an haeyo.", en: "I don't study. (not 안 공부해요)" },
          { kr: "시간이 없어요.", romanization: "sigan-i eopseoyo.", en: "I don't have time." },
          { kr: "잘 몰라요.", romanization: "jal mollayo.", en: "I don't really know." },
        ],
      },
    ],
    quiz: [
      { q: "How do you negate 공부해요?", opts: ["안 공부해요", "공부 안 해요", "공부해 안요", "안공부요"], ans: 1 },
      { q: "Which is the long negative form of 먹어요?", opts: ["안 먹어요", "먹지 않아요", "먹어 없어요", "못 먹다"], ans: 1 },
      { q: "What is the opposite of 있어요?", opts: ["안 있어요", "있지 않아요", "없어요", "아니에요"], ans: 2 },
    ],
  },
  {
    key: "past-tense",
    title: "Past tense 았어요 / 었어요",
    krTitle: "았어요 · 었어요",
    level: "A1",
    summary: "Conjugate as if for the present, then swap 요 for ㅆ어요.",
    sections: [
      {
        heading: "The shortcut",
        explanation:
          "Make the 아요/어요 form first, drop the 요, and add ㅆ어요 to that syllable. 가요 → 갔어요. This works for almost every verb.",
        examples: [
          { kr: "가요 → 갔어요", romanization: "gayo → gasseoyo", en: "go → went" },
          { kr: "먹어요 → 먹었어요", romanization: "meogeoyo → meogeosseoyo", en: "eat → ate" },
          { kr: "해요 → 했어요", romanization: "haeyo → haesseoyo", en: "do → did" },
        ],
      },
      {
        heading: "In full sentences",
        explanation: "Nothing else in the sentence changes — only the verb ending moves to the past.",
        examples: [
          { kr: "어제 친구를 만났어요.", romanization: "eoje chingu-reul mannasseoyo.", en: "I met a friend yesterday." },
          { kr: "영화를 봤어요.", romanization: "yeonghwa-reul bwasseoyo.", en: "I watched a movie." },
          { kr: "한국에 갔어요.", romanization: "hanguk-e gasseoyo.", en: "I went to Korea." },
        ],
      },
      {
        heading: "Past of 'to be'",
        explanation: "이에요/예요 becomes 이었어요/였어요, and 있어요/없어요 become 있었어요/없었어요.",
        examples: [
          { kr: "학생이었어요.", romanization: "haksaeng-ieosseoyo.", en: "I was a student." },
          { kr: "시간이 없었어요.", romanization: "sigan-i eopseosseoyo.", en: "I didn't have time." },
        ],
      },
    ],
    quiz: [
      { q: "What is the past tense of 가요?", opts: ["가었어요", "갔어요", "가았어요", "가해요"], ans: 1 },
      { q: "해요 in the past is…", opts: ["핬어요", "했어요", "하었어요", "해었어요"], ans: 1 },
      { q: "'I met a friend yesterday' is…", opts: ["어제 친구를 만나요.", "어제 친구를 만났어요.", "어제 친구가 만나요.", "어제 친구를 안 만나요."], ans: 1 },
    ],
  },
  {
    key: "location-particles",
    title: "에 and 에서",
    krTitle: "에 · 에서",
    level: "A1",
    summary: "에 marks a destination or a point in time; 에서 marks where an action happens.",
    sections: [
      {
        heading: "에 — where you're going, when it happens",
        explanation:
          "Use 에 with movement verbs (가다, 오다) and with 있다/없다 for where something sits. It also attaches to times and dates.",
        examples: [
          { kr: "학교에 가요.", romanization: "hakgyo-e gayo.", en: "I go to school." },
          { kr: "집에 있어요.", romanization: "jib-e isseoyo.", en: "I'm at home." },
          { kr: "세 시에 만나요.", romanization: "se si-e mannayo.", en: "Let's meet at three o'clock." },
        ],
      },
      {
        heading: "에서 — where the action takes place",
        explanation:
          "If a real activity happens somewhere — eating, studying, working — use 에서. It also means 'from' a starting point.",
        examples: [
          { kr: "학교에서 공부해요.", romanization: "hakgyo-eseo gongbuhaeyo.", en: "I study at school." },
          { kr: "카페에서 커피를 마셔요.", romanization: "kape-eseo keopi-reul masyeoyo.", en: "I drink coffee at the cafe." },
          { kr: "한국에서 왔어요.", romanization: "hanguk-eseo wasseoyo.", en: "I came from Korea." },
        ],
      },
      {
        heading: "The contrast in one pair",
        explanation:
          "'집에 있어요' is a state — I am at home. '집에서 일해요' is an action — I work at home. Ask yourself whether anything is actually being done there.",
        examples: [
          { kr: "집에 있어요.", romanization: "jib-e isseoyo.", en: "I'm at home. (state)" },
          { kr: "집에서 일해요.", romanization: "jib-eseo ilhaeyo.", en: "I work at home. (action)" },
        ],
      },
    ],
    quiz: [
      { q: "'I study at school' uses which particle after 학교?", opts: ["에", "에서", "을", "는"], ans: 1 },
      { q: "Which is correct for 'I go to school'?", opts: ["학교에서 가요.", "학교에 가요.", "학교를 가요에.", "학교는 가요에서."], ans: 1 },
      { q: "What does 에서 mean besides 'at'?", opts: ["to", "from", "with", "for"], ans: 1 },
    ],
  },
  {
    key: "politeness",
    title: "존댓말 basics",
    krTitle: "존댓말",
    level: "A2",
    summary: "Korean picks a politeness level for every sentence. Start with 요, and know when to reach for 습니다.",
    sections: [
      {
        heading: "Three levels you'll meet",
        explanation:
          "반말 (casual, no 요) is for close friends and children. 해요체 (ends in 요) is polite and safe almost everywhere. 합쇼체 (ends in 습니다/ㅂ니다) is formal — news, presentations, the military, customer service.",
        examples: [
          { kr: "밥 먹어.", romanization: "bap meogeo.", en: "Eat. (casual — friends only)" },
          { kr: "밥 먹어요.", romanization: "bap meogeoyo.", en: "Please eat. (polite, everyday)" },
          { kr: "식사하십시오.", romanization: "siksahasipsio.", en: "Please dine. (formal)" },
        ],
      },
      {
        heading: "Honorific 시",
        explanation:
          "To show respect toward the person you're talking about (not the listener), insert 으시/시 into the verb. Never use it about yourself.",
        examples: [
          { kr: "선생님이 가세요.", romanization: "seonsaengnim-i gaseyo.", en: "The teacher is going. (respectful)" },
          { kr: "어디 가세요?", romanization: "eodi gaseyo?", en: "Where are you going, sir/ma'am?" },
          { kr: "할머니가 주무세요.", romanization: "halmeoni-ga jumuseyo.", en: "Grandma is sleeping. (자다 → 주무시다)" },
        ],
      },
      {
        heading: "Humble words for yourself",
        explanation:
          "Some words have a humble version you use when referring to yourself in polite company: 저 instead of 나, 제 instead of 내.",
        examples: [
          { kr: "저는 마이클이에요.", romanization: "jeo-neun maikeul-ieyo.", en: "I'm Michael. (polite 저)" },
          { kr: "제 이름은 마이클이에요.", romanization: "je ireum-eun maikeul-ieyo.", en: "My name is Michael." },
        ],
      },
    ],
    quiz: [
      { q: "Which ending is polite and safe for everyday use?", opts: ["-어 (반말)", "-요 (해요체)", "-습니다 (합쇼체)", "-지"], ans: 1 },
      { q: "When do you use 시 in a verb?", opts: ["When talking about yourself", "To show respect to the person you're speaking about", "To make a question", "To form the past tense"], ans: 1 },
      { q: "Which pronoun is the polite word for 'I'?", opts: ["나", "저", "너", "우리"], ans: 1 },
    ],
  },
  {
    key: "numbers-counters",
    title: "Numbers & counters",
    krTitle: "숫자와 단위 명사",
    level: "A2",
    summary: "Korean has two number systems, and counting things needs a counter word.",
    sections: [
      {
        heading: "Two systems",
        explanation:
          "Native Korean numbers (하나, 둘, 셋…) count things, people and hours. Sino-Korean numbers (일, 이, 삼…) handle money, dates, minutes, phone numbers and anything above 99.",
        examples: [
          { kr: "하나, 둘, 셋, 넷, 다섯", romanization: "hana, dul, set, net, daseot", en: "1–5, native Korean" },
          { kr: "일, 이, 삼, 사, 오", romanization: "il, i, sam, sa, o", en: "1–5, Sino-Korean" },
          { kr: "삼천 원이에요.", romanization: "samcheon won-ieyo.", en: "It's 3,000 won. (money → Sino)" },
        ],
      },
      {
        heading: "Counters",
        explanation:
          "You can't just say 'two cats'. The pattern is noun + number + counter: 개 for objects, 명 for people, 마리 for animals, 잔 for cups, 병 for bottles.",
        examples: [
          { kr: "커피 두 잔 주세요.", romanization: "keopi du jan juseyo.", en: "Two cups of coffee, please." },
          { kr: "사람 세 명이 있어요.", romanization: "saram se myeong-i isseoyo.", en: "There are three people." },
          { kr: "고양이 한 마리", romanization: "goyangi han mari", en: "one cat" },
        ],
      },
      {
        heading: "The four that change shape",
        explanation:
          "Before a counter, 하나/둘/셋/넷 shorten to 한/두/세/네. 스물 becomes 스무. Everything else keeps its form.",
        examples: [
          { kr: "한 개, 두 개, 세 개, 네 개", romanization: "han gae, du gae, se gae, ne gae", en: "one, two, three, four items" },
          { kr: "지금 두 시예요.", romanization: "jigeum du si-yeyo.", en: "It's two o'clock. (hours → native)" },
          { kr: "두 시 삼십 분", romanization: "du si samsip bun", en: "2:30 (hour native, minutes Sino)" },
        ],
      },
    ],
    quiz: [
      { q: "Which number system do you use for money?", opts: ["Native Korean (하나, 둘…)", "Sino-Korean (일, 이…)", "Either one", "Neither"], ans: 1 },
      { q: "How do you say 'two cups of coffee'?", opts: ["커피 둘 잔", "커피 두 잔", "커피 이 잔", "커피 두 개"], ans: 1 },
      { q: "In '두 시 삼십 분', why are the hour and minute different systems?", opts: ["It's a mistake", "Hours use native numbers, minutes use Sino-Korean", "Both are native", "Both are Sino-Korean"], ans: 1 },
    ],
  },
  {
    key: "and-with",
    title: "Saying 'and' and 'with'",
    krTitle: "하고 · 와/과 · (이)랑",
    level: "A1",
    summary: "Three ways to link two nouns. The same words also mean 'with someone'.",
    sections: [
      {
        heading: "Linking two nouns",
        explanation:
          "To join nouns, attach 하고 (neutral, very common in speech), 와/과 (a touch more formal and used in writing), or (이)랑 (casual). 와 follows a vowel, 과 follows a consonant; 이랑 follows a consonant, 랑 a vowel. 하고 never changes.",
        examples: [
          { kr: "빵하고 우유를 샀어요.", romanization: "ppang-hago uyu-reul sasseoyo.", en: "I bought bread and milk." },
          { kr: "책과 공책이 있어요.", romanization: "chaek-gwa gongchaek-i isseoyo.", en: "I have a book and a notebook." },
          { kr: "김치랑 밥이요.", romanization: "gimchi-rang bab-iyo.", en: "Kimchi and rice, please." },
        ],
      },
      {
        heading: "The same words mean 'with'",
        explanation:
          "Attach the same particle to a person and you get 'together with'. Adding 같이 or 함께 after it makes the 'together' part explicit.",
        examples: [
          { kr: "친구하고 영화를 봐요.", romanization: "chingu-hago yeonghwa-reul bwayo.", en: "I watch a movie with a friend." },
          { kr: "가족과 함께 살아요.", romanization: "gajok-gwa hamkke sarayo.", en: "I live together with my family." },
          { kr: "동생이랑 같이 가요.", romanization: "dongsaeng-irang gachi gayo.", en: "I go together with my younger sibling." },
        ],
      },
      {
        heading: "Do not use these to link sentences",
        explanation:
          "하고 and 와/과 only join nouns. To join two whole clauses you need the verb ending ~고. English 'and' covers both jobs, Korean keeps them separate.",
        examples: [
          { kr: "밥을 먹고 커피를 마셔요.", romanization: "bab-eul meokgo keopi-reul masyeoyo.", en: "I eat rice and drink coffee. (two clauses, so verb + 고)" },
          { kr: "밥하고 커피", romanization: "bap-hago keopi", en: "rice and coffee (two nouns)" },
        ],
      },
    ],
    quiz: [
      { q: "Which particle links nouns and is the most neutral in everyday speech?", opts: ["하고", "고", "에서", "을"], ans: 0 },
      { q: "'책' ends in a consonant. Which form of 와/과 follows it?", opts: ["와", "과", "랑", "하"], ans: 1 },
      { q: "How do you join two clauses, as in 'I eat and I drink'?", opts: ["Noun + 하고", "Verb stem + 고", "Noun + 와", "Verb stem + 에서"], ans: 1 },
    ],
  },
  {
    key: "demonstratives",
    title: "이 / 그 / 저 — this, that, that over there",
    krTitle: "이 · 그 · 저",
    level: "A1",
    summary: "Korean splits 'that' in two: 그 for near the listener or already mentioned, 저 for far from you both.",
    sections: [
      {
        heading: "Three distances, not two",
        explanation:
          "이 is near the speaker, 그 is near the listener or something you both already talked about, and 저 is far from both of you. English only has this and that, so 그 is the one that needs practice.",
        examples: [
          { kr: "이 책 좋아요.", romanization: "i chaek joayo.", en: "This book (here by me) is good." },
          { kr: "그 책 주세요.", romanization: "geu chaek juseyo.", en: "Give me that book (by you)." },
          { kr: "저 건물이 학교예요.", romanization: "jeo geonmul-i hakgyo-yeyo.", en: "That building over there is the school." },
        ],
      },
      {
        heading: "Standing alone: 이것 / 그것 / 저것",
        explanation:
          "이/그/저 must sit in front of a noun. To say this one on its own, add 것 (thing). In speech these contract to 이거, 그거, 저거.",
        examples: [
          { kr: "이것은 뭐예요?", romanization: "igeoseun mwo-yeyo?", en: "What is this?" },
          { kr: "이거 얼마예요?", romanization: "igeo eolma-yeyo?", en: "How much is this? (spoken)" },
          { kr: "저것도 주세요.", romanization: "jeogeot-do juseyo.", en: "Give me that one over there too." },
        ],
      },
      {
        heading: "Places: 여기 / 거기 / 저기",
        explanation:
          "The same three-way split applies to places. 여기 is here, 거기 is there by you or the place we mentioned, 저기 is over there in sight of us both. 저기요 is also how you politely get a stranger's attention.",
        examples: [
          { kr: "여기에서 기다릴게요.", romanization: "yeogi-eseo gidarilgeyo.", en: "I'll wait here." },
          { kr: "거기 날씨는 어때요?", romanization: "geogi nalssi-neun eottaeyo?", en: "How is the weather there (where you are)?" },
          { kr: "저기요, 물 좀 주세요.", romanization: "jeogiyo, mul jom juseyo.", en: "Excuse me, could I get some water?" },
        ],
      },
    ],
    quiz: [
      { q: "You want the book the listener is holding. Which word do you use?", opts: ["이 책", "그 책", "저 책", "어느 책"], ans: 1 },
      { q: "What does 저 mark?", opts: ["Near the speaker", "Near the listener", "Far from both people", "Already mentioned"], ans: 2 },
      { q: "Which is the natural spoken way to ask 'How much is this?'", opts: ["이것 얼마예요?", "이거 얼마예요?", "그거 얼마예요?", "여기 얼마예요?"], ans: 1 },
    ],
  },
  {
    key: "future-tense",
    title: "Future with ~(으)ㄹ 거예요",
    krTitle: "~(으)ㄹ 거예요",
    level: "A2",
    summary: "The everyday future: plans, predictions and 'I'm going to'. Add ㄹ 거예요 after a vowel, 을 거예요 after a consonant.",
    sections: [
      {
        heading: "Building the form",
        explanation:
          "Take the verb stem. If it ends in a vowel, attach ㄹ 거예요 directly to that syllable. If it ends in a consonant, attach 을 거예요. Stems ending in ㄹ just take 거예요.",
        examples: [
          { kr: "가다 → 갈 거예요", romanization: "gada → gal geoyeyo", en: "to go → will go" },
          { kr: "먹다 → 먹을 거예요", romanization: "meokda → meogeul geoyeyo", en: "to eat → will eat" },
          { kr: "만들다 → 만들 거예요", romanization: "mandeulda → mandeul geoyeyo", en: "to make → will make" },
        ],
      },
      {
        heading: "Plans and intentions",
        explanation:
          "With a first-person subject this is your plan. It is the form you reach for when someone asks what you are doing this weekend.",
        examples: [
          { kr: "주말에 친구를 만날 거예요.", romanization: "jumal-e chingu-reul mannal geoyeyo.", en: "I'm going to meet a friend this weekend." },
          { kr: "내년에 한국에 갈 거예요.", romanization: "naenyeon-e hanguk-e gal geoyeyo.", en: "I'm going to Korea next year." },
          { kr: "오늘은 집에서 쉴 거예요.", romanization: "oneul-eun jib-eseo swil geoyeyo.", en: "Today I'll rest at home." },
        ],
      },
      {
        heading: "Guesses about other people",
        explanation:
          "With a third-person subject the same form becomes a prediction: probably, I bet. Context tells you which reading is meant.",
        examples: [
          { kr: "그 영화는 재미있을 거예요.", romanization: "geu yeonghwa-neun jaemiisseul geoyeyo.", en: "That movie is probably interesting." },
          { kr: "내일 비가 올 거예요.", romanization: "naeil bi-ga ol geoyeyo.", en: "It'll probably rain tomorrow." },
          { kr: "지금 바쁠 거예요.", romanization: "jigeum bappeul geoyeyo.", en: "They're probably busy right now." },
        ],
      },
      {
        heading: "The near-future 아/어요 shortcut",
        explanation:
          "For something already fixed and imminent, plain 아/어요 with a time word is more natural than the full future form. Both are correct; the plain form sounds more settled.",
        examples: [
          { kr: "내일 학교에 가요.", romanization: "naeil hakgyo-e gayo.", en: "I'm going to school tomorrow. (settled plan)" },
          { kr: "내일 학교에 갈 거예요.", romanization: "naeil hakgyo-e gal geoyeyo.", en: "I'm going to go to school tomorrow. (intention)" },
        ],
      },
    ],
    quiz: [
      { q: "What is the future form of 먹다?", opts: ["먹ㄹ 거예요", "먹을 거예요", "먹어 거예요", "먹었 거예요"], ans: 1 },
      { q: "Stems ending in a vowel take…", opts: ["을 거예요", "ㄹ 거예요", "이 거예요", "어 거예요"], ans: 1 },
      { q: "'그 영화는 재미있을 거예요' most likely means…", opts: ["That movie was interesting", "That movie is probably interesting", "I will make that movie", "I don't like that movie"], ans: 1 },
    ],
  },
  {
    key: "want-to",
    title: "Wanting things: ~고 싶다",
    krTitle: "~고 싶다",
    level: "A2",
    summary: "Attach 고 싶어요 to a verb stem for 'I want to…'. For other people you need 고 싶어하다.",
    sections: [
      {
        heading: "Stem + 고 싶어요",
        explanation:
          "No vowel matching needed — 고 싶다 attaches straight to any verb stem. Conjugate 싶다 like a normal descriptive verb: 싶어요, 싶었어요, 싶을 거예요.",
        examples: [
          { kr: "물을 마시고 싶어요.", romanization: "mul-eul masigo sipeoyo.", en: "I want to drink water." },
          { kr: "한국에 가고 싶어요.", romanization: "hanguk-e gago sipeoyo.", en: "I want to go to Korea." },
          { kr: "쉬고 싶었어요.", romanization: "swigo sipeosseoyo.", en: "I wanted to rest." },
        ],
      },
      {
        heading: "Other people want: 고 싶어하다",
        explanation:
          "Korean treats another person's desire as something you observe, not something you feel. So for he/she/they, switch to 고 싶어해요. Using plain 고 싶어요 about someone else sounds wrong.",
        examples: [
          { kr: "동생이 게임을 하고 싶어해요.", romanization: "dongsaeng-i geim-eul hago sipeohaeyo.", en: "My younger sibling wants to play games." },
          { kr: "친구가 집에 가고 싶어해요.", romanization: "chingu-ga jib-e gago sipeohaeyo.", en: "My friend wants to go home." },
        ],
      },
      {
        heading: "Wanting a thing, not an action",
        explanation:
          "고 싶다 needs a verb. To want a noun, use 갖고 싶다 (want to have) or 필요하다 (to need), which takes 이/가, not 을/를.",
        examples: [
          { kr: "새 가방을 갖고 싶어요.", romanization: "sae gabang-eul gatgo sipeoyo.", en: "I want a new bag." },
          { kr: "시간이 필요해요.", romanization: "sigan-i piryohaeyo.", en: "I need time." },
        ],
      },
    ],
    quiz: [
      { q: "How do you say 'I want to eat'?", opts: ["먹어 싶어요", "먹고 싶어요", "먹을 싶어요", "먹지 싶어요"], ans: 1 },
      { q: "Which form describes what your friend wants?", opts: ["가고 싶어요", "가고 싶어해요", "가고 싶다", "가고 싶었어요"], ans: 1 },
      { q: "Which particle does 필요하다 take?", opts: ["을/를", "이/가", "에서", "으로"], ans: 1 },
    ],
  },
  {
    key: "can-cannot",
    title: "Ability: ~(으)ㄹ 수 있다 and 못",
    krTitle: "~(으)ㄹ 수 있다 · 못",
    level: "A2",
    summary: "~(으)ㄹ 수 있어요 is 'can', ~(으)ㄹ 수 없어요 is 'cannot', and 못 is the quick spoken 'can't'.",
    sections: [
      {
        heading: "Can and cannot",
        explanation:
          "수 literally means a way or method. Stem + (으)ㄹ 수 있어요 is 'there is a way to do it' — you can. Swap 있어요 for 없어요 and you cannot. The (으) follows the same rule as the future form.",
        examples: [
          { kr: "한국어를 할 수 있어요.", romanization: "hangugeo-reul hal su isseoyo.", en: "I can speak Korean." },
          { kr: "매운 음식을 먹을 수 있어요.", romanization: "maeun eumsig-eul meogeul su isseoyo.", en: "I can eat spicy food." },
          { kr: "오늘은 갈 수 없어요.", romanization: "oneul-eun gal su eopseoyo.", en: "I can't go today." },
        ],
      },
      {
        heading: "못 — blocked by circumstance",
        explanation:
          "못 goes right before the verb, exactly where 안 goes. The difference is meaning: 안 is 'I choose not to', 못 is 'I'm unable to'. With 하다 compounds, 못 slots between the noun and 해요.",
        examples: [
          { kr: "오늘은 못 가요.", romanization: "oneul-eun mot gayo.", en: "I can't go today. (something is stopping me)" },
          { kr: "저는 안 가요.", romanization: "jeo-neun an gayo.", en: "I'm not going. (my choice)" },
          { kr: "어제는 공부 못 했어요.", romanization: "eoje-neun gongbu mot haesseoyo.", en: "I couldn't study yesterday." },
        ],
      },
      {
        heading: "Knowing how: ~(으)ㄹ 줄 알다",
        explanation:
          "For a learned skill — swimming, driving, playing an instrument — Korean prefers (으)ㄹ 줄 알아요 (I know how) over (으)ㄹ 수 있어요. The negative is (으)ㄹ 줄 몰라요.",
        examples: [
          { kr: "수영할 줄 알아요.", romanization: "suyeonghal jul arayo.", en: "I know how to swim." },
          { kr: "운전할 줄 몰라요.", romanization: "unjeonhal jul mollayo.", en: "I don't know how to drive." },
        ],
      },
    ],
    quiz: [
      { q: "How do you say 'I can speak Korean'?", opts: ["한국어를 할 수 있어요.", "한국어를 하고 싶어요.", "한국어를 안 해요.", "한국어를 할 거예요."], ans: 0 },
      { q: "What is the difference between 안 가요 and 못 가요?", opts: ["No difference", "안 is 'choose not to', 못 is 'unable to'", "안 is past, 못 is future", "못 is more polite"], ans: 1 },
      { q: "Which is most natural for 'I know how to swim'?", opts: ["수영할 수 없어요", "수영할 줄 알아요", "수영하고 싶어요", "수영 안 해요"], ans: 1 },
    ],
  },
  {
    key: "purpose-basics",
    title: "Going somewhere to do something: ~(으)러",
    krTitle: "~(으)러 · ~는 것",
    level: "A2",
    summary: "~(으)러 attaches to a verb stem before a movement verb (가다/오다) to say 'in order to'. There's a fuller set of purpose forms later — this is the one you'll use every day.",
    sections: [
      {
        heading: "Stem + (으)러 + 가다/오다",
        explanation:
          "Only works with a movement verb at the end — 가다, 오다, 다니다. No batchim takes 러, a batchim takes 으러. The two clauses share the same subject.",
        examples: [
          { kr: "밥을 먹으러 가요.", romanization: "bab-eul meogeuro gayo.", en: "I'm going to eat. (lit. going in order to eat)" },
          { kr: "친구를 만나러 왔어요.", romanization: "chingu-reul mannareo wasseoyo.", en: "I came to meet a friend." },
          { kr: "책을 사러 서점에 가요.", romanization: "chaeg-eul sareo seojeom-e gayo.", en: "I'm going to the bookstore to buy a book." },
        ],
      },
      {
        heading: "Turning a verb into 'to do it' / 'doing it': ~는 것",
        explanation:
          "는 것 turns a whole verb phrase into a noun — 'the act of doing X'. It's the everyday way to say 'to swim' or 'swimming' as a subject or object, before you need anything fancier.",
        examples: [
          { kr: "한국어를 배우는 것이 재미있어요.", romanization: "hangugeo-reul baeuneun geosi jaemiisseoyo.", en: "Learning Korean is fun." },
          { kr: "제 취미는 요리하는 거예요.", romanization: "je chwimi-neun yorihaneun geoyeyo.", en: "My hobby is cooking." },
        ],
      },
    ],
    quiz: [
      { q: "'책을 사러 가요' means…", opts: ["I bought a book", "I'm going to buy a book", "I want a book", "I have a book"], ans: 1 },
      { q: "~(으)러 must be followed by…", opts: ["Any verb", "A movement verb like 가다/오다", "A descriptive verb", "이다"], ans: 1 },
      { q: "Which turns '요리하다' into 'cooking' as a noun?", opts: ["요리해서", "요리하러", "요리하는 것", "요리하려고"], ans: 2 },
    ],
  },
  {
    key: "simple-modifiers",
    title: "Verbs before nouns: ~는",
    krTitle: "~는 (동사 → 형용사)",
    level: "A2",
    summary: "Korean has no word for 'who'/'which' — instead the verb itself moves in front of the noun. This covers just the present-tense form; there's a full past/future set later.",
    sections: [
      {
        heading: "Stem + 는 + noun",
        explanation:
          "Attach 는 to an action-verb stem and place it directly before the noun it describes — the modifier always comes first, opposite of English word order.",
        examples: [
          { kr: "커피를 마시는 사람", romanization: "keopi-reul masineun saram", en: "the person who drinks coffee" },
          { kr: "한국어를 가르치는 선생님", romanization: "hangugeo-reul garuchineun seonsaengnim", en: "the teacher who teaches Korean" },
          { kr: "지금 자는 아기", romanization: "jigeum janeun agi", en: "the baby who is sleeping now" },
        ],
      },
      {
        heading: "Only for actions happening now",
        explanation:
          "This 는 form is present tense only. Talking about something that already happened, or hasn't happened yet, needs a different ending (으)ㄴ or (으)ㄹ — that's the next lesson.",
        examples: [
          { kr: "매일 운동하는 사람은 건강해요.", romanization: "maeil undonghaneun saram-eun geonganghaeyo.", en: "A person who exercises every day is healthy." },
        ],
      },
    ],
    quiz: [
      { q: "'커피를 마시는 사람' means…", opts: ["I drink coffee", "The person who drinks coffee", "Please drink coffee", "I drank coffee"], ans: 1 },
      { q: "Where does the modifier go relative to the noun?", opts: ["After the noun", "Before the noun", "Doesn't matter", "Replaces the noun"], ans: 1 },
      { q: "~는 on an action verb marks…", opts: ["Past tense", "Present tense", "Future tense", "A question"], ans: 1 },
    ],
  },
  {
    key: "wonder-ji",
    title: "Wondering if: ~(으)ㄹ지",
    krTitle: "~(으)ㄹ지",
    level: "A2",
    summary: "Attach (으)ㄹ지 to a stem to turn a yes/no question into 'whether/if' — useful with 모르다 (don't know) or 궁금하다 (wonder).",
    sections: [
      {
        heading: "Stem + (으)ㄹ지 + 모르다/궁금하다",
        explanation:
          "Same batchim rule as the future tense: no batchim takes ㄹ지, a batchim takes 을지. It reports an unresolved yes/no question inside a bigger sentence.",
        examples: [
          { kr: "내일 비가 올지 모르겠어요.", romanization: "naeil biga olji moregesseoyo.", en: "I don't know if it'll rain tomorrow." },
          { kr: "그 식당이 맛있을지 궁금해요.", romanization: "geu sikdang-i masiss-eulji gunggeumhaeyo.", en: "I wonder if that restaurant is good." },
          { kr: "이걸 살지 말지 고민 중이에요.", romanization: "igeol salji malji gomin jungieyo.", en: "I'm debating whether to buy this or not." },
        ],
      },
    ],
    quiz: [
      { q: "'내일 비가 올지 모르겠어요' means…", opts: ["It will rain tomorrow", "I don't know if it'll rain tomorrow", "It rained yesterday", "Please don't rain tomorrow"], ans: 1 },
      { q: "~(으)ㄹ지 most naturally pairs with…", opts: ["주세요", "모르다 / 궁금하다", "싶어요", "거예요"], ans: 1 },
      { q: "What does ~ㄹ지 말지 express?", opts: ["Definitely yes", "Whether to do it or not", "A command", "An apology"], ans: 1 },
    ],
  },
  {
    key: "simple-conditional",
    title: "If / when: ~(으)면",
    krTitle: "~(으)면",
    level: "A2",
    summary: "The everyday 'if' or 'when' clause. This is the basic pattern only — there's a lesson later on the fixed phrases built on top of it.",
    sections: [
      {
        heading: "Stem + (으)면",
        explanation:
          "No batchim takes 면, a batchim takes 으면. The 면-clause never carries tense itself — 았/었 or 겠 goes only on the final verb, exactly like ~아/어서.",
        examples: [
          { kr: "시간이 있으면 전화해 주세요.", romanization: "sigan-i isseumyeon jeonhwahae juseyo.", en: "If you have time, please call me." },
          { kr: "비가 오면 안 가요.", romanization: "biga omyeon an gayo.", en: "If it rains, I'm not going." },
          { kr: "한국에 가면 김치를 먹을 거예요.", romanization: "hanguk-e gamyeon gimchi-reul meogeul geoyeyo.", en: "When I go to Korea, I'll eat kimchi." },
        ],
      },
      {
        heading: "'If' and 'when' overlap here",
        explanation:
          "Unlike English, Korean doesn't force a choice between 'if' and 'when' for something expected to happen — (으)면 covers both. A separate word (때) exists for 'when' about a fixed moment, but that's for later.",
        examples: [
          { kr: "졸리면 커피를 마셔요.", romanization: "jolliyeon keopi-reul masyeoyo.", en: "When/if I'm sleepy, I drink coffee." },
        ],
      },
    ],
    quiz: [
      { q: "'비가 오면 안 가요' means…", opts: ["It's raining so I'm not going", "If it rains, I'm not going", "It rained yesterday", "I like rain"], ans: 1 },
      { q: "Where does past tense go in a (으)면 sentence?", opts: ["On the 면-clause", "On the final verb only", "On both verbs", "Nowhere"], ans: 1 },
      { q: "~(으)면 can mean…", opts: ["Only 'if'", "Only 'when'", "Both 'if' and 'when'", "Neither"], ans: 2 },
    ],
  },
  {
    key: "because-aseo",
    title: "Because: ~아/어서",
    krTitle: "~아/어서",
    level: "A2",
    summary: "Join a reason to a result with 아/어서. It also means 'and then' for actions that follow on from each other.",
    sections: [
      {
        heading: "Reason and result",
        explanation:
          "Conjugate the first verb into its 아/어 form and add 서. The reason clause never carries tense — put 았/었 or 겠 only on the final verb.",
        examples: [
          { kr: "배가 아파서 병원에 갔어요.", romanization: "bae-ga apaseo byeongwon-e gasseoyo.", en: "My stomach hurt, so I went to the hospital." },
          { kr: "비가 와서 못 갔어요.", romanization: "bi-ga waseo mot gasseoyo.", en: "It rained, so I couldn't go." },
          { kr: "시간이 없어서 택시를 탔어요.", romanization: "sigan-i eopseoseo taeksi-reul tasseoyo.", en: "I had no time, so I took a taxi." },
        ],
      },
      {
        heading: "No commands or suggestions after it",
        explanation:
          "This is the one restriction to remember: you cannot follow 아/어서 with an order or a let's-do suggestion. For those you need ~(으)니까 instead.",
        examples: [
          { kr: "늦어서 죄송합니다.", romanization: "neujeoseo joesonghamnida.", en: "I'm sorry for being late. (statement — fine)" },
          { kr: "늦었으니까 빨리 가세요.", romanization: "neujeosseunikka ppalli gaseyo.", en: "You're late, so please hurry. (command — needs 니까)" },
        ],
      },
      {
        heading: "The 'and then' use",
        explanation:
          "With action verbs, 아/어서 can also link two steps where the second depends on the first — you go somewhere and then do something there. Compare with plain ~고, which just lists unrelated steps.",
        examples: [
          { kr: "친구를 만나서 커피를 마셨어요.", romanization: "chingu-reul mannaseo keopi-reul masyeosseoyo.", en: "I met my friend and (together with them) drank coffee." },
          { kr: "집에 가서 잘 거예요.", romanization: "jib-e gaseo jal geoyeyo.", en: "I'll go home and sleep (there)." },
          { kr: "밥을 먹고 영화를 봤어요.", romanization: "bab-eul meokgo yeonghwa-reul bwasseoyo.", en: "I ate and then watched a movie. (separate events)" },
        ],
      },
    ],
    quiz: [
      { q: "Where does the past-tense marker go in '비가 오다 + 못 가다' with 아/어서?", opts: ["On both verbs", "Only on the first verb", "Only on the final verb", "Nowhere"], ans: 2 },
      { q: "Which sentence type can NOT follow ~아/어서?", opts: ["A statement", "A question", "A command", "A past-tense verb"], ans: 2 },
      { q: "'집에 가서 잘 거예요' means…", opts: ["I'll sleep because I went home", "I'll go home and sleep there", "I go home well", "I want to go home"], ans: 1 },
    ],
  },
  {
    key: "requests",
    title: "Asking politely: ~(으)세요 and ~아/어 주세요",
    krTitle: "~(으)세요 · ~아/어 주세요",
    level: "A2",
    summary: "(으)세요 tells someone to do something politely; 아/어 주세요 asks them to do it for you.",
    sections: [
      {
        heading: "(으)세요 — polite instruction",
        explanation:
          "This is the honorific 시 plus the polite ending. Add 세요 after a vowel stem and 으세요 after a consonant. It covers everything from please sit down to have a good day.",
        examples: [
          { kr: "여기 앉으세요.", romanization: "yeogi anjeuseyo.", en: "Please sit here." },
          { kr: "천천히 가세요.", romanization: "cheoncheonhi gaseyo.", en: "Please go slowly / take care." },
          { kr: "이름을 쓰세요.", romanization: "ireum-eul sseuseyo.", en: "Please write your name." },
        ],
      },
      {
        heading: "아/어 주세요 — do it for me",
        explanation:
          "주다 means to give. Attaching it after the 아/어 form adds the sense of doing the action as a favour to the speaker. This is what you use in shops, taxis and restaurants.",
        examples: [
          { kr: "다시 말해 주세요.", romanization: "dasi malhae juseyo.", en: "Please say that again (for me)." },
          { kr: "사진 좀 찍어 주세요.", romanization: "sajin jom jjigeo juseyo.", en: "Could you take a photo for me?" },
          { kr: "여기에서 세워 주세요.", romanization: "yeogi-eseo sewo juseyo.", en: "Please stop here." },
        ],
      },
      {
        heading: "Softening and negative requests",
        explanation:
          "Slip 좀 in before the verb to soften any request — it literally means a little but works like please. For please don't, use 지 마세요.",
        examples: [
          { kr: "물 좀 주세요.", romanization: "mul jom juseyo.", en: "Some water, please." },
          { kr: "여기에서 담배를 피우지 마세요.", romanization: "yeogi-eseo dambae-reul piuji maseyo.", en: "Please don't smoke here." },
          { kr: "걱정하지 마세요.", romanization: "geokjeonghaji maseyo.", en: "Please don't worry." },
        ],
      },
    ],
    quiz: [
      { q: "'앉다' ends in a consonant. Which polite instruction is correct?", opts: ["앉세요", "앉으세요", "앉아세요", "앉이세요"], ans: 1 },
      { q: "What does adding 주세요 to a request add?", opts: ["Past tense", "The sense of doing it as a favour for the speaker", "A question", "Formality only"], ans: 1 },
      { q: "How do you say 'please don't worry'?", opts: ["걱정 안 하세요", "걱정하지 마세요", "걱정 못 해요", "걱정하지 않아요"], ans: 1 },
    ],
  },
  {
    key: "progressive",
    title: "In progress: ~고 있다",
    krTitle: "~고 있다",
    level: "A2",
    summary: "Stem + 고 있어요 is the -ing form: an action happening right now or ongoing in your life.",
    sections: [
      {
        heading: "Right now",
        explanation:
          "Attach 고 있어요 to any action verb stem, with no vowel matching. Plain 아/어요 can also describe the present, but 고 있어요 makes it explicit that the action is under way.",
        examples: [
          { kr: "지금 밥을 먹고 있어요.", romanization: "jigeum bab-eul meokgo isseoyo.", en: "I'm eating right now." },
          { kr: "뭐 하고 있어요?", romanization: "mwo hago isseoyo?", en: "What are you doing?" },
          { kr: "친구를 기다리고 있어요.", romanization: "chingu-reul gidarigo isseoyo.", en: "I'm waiting for a friend." },
        ],
      },
      {
        heading: "Ongoing situations",
        explanation:
          "It also covers things true over a stretch of time, even if you are not doing them this second — where you work, what you are studying these days.",
        examples: [
          { kr: "은행에서 일하고 있어요.", romanization: "eunhaeng-eseo ilhago isseoyo.", en: "I work at a bank." },
          { kr: "요즘 한국어를 배우고 있어요.", romanization: "yojeum hangugeo-reul baeugo isseoyo.", en: "I'm learning Korean these days." },
        ],
      },
      {
        heading: "State, not action: ~아/어 있다",
        explanation:
          "Verbs that describe a resulting state — a door being open, someone being seated — use 아/어 있다 instead. 앉고 있어요 means in the act of sitting down; 앉아 있어요 means seated.",
        examples: [
          { kr: "문이 열려 있어요.", romanization: "mun-i yeollyeo isseoyo.", en: "The door is open." },
          { kr: "의자에 앉아 있어요.", romanization: "uija-e anja isseoyo.", en: "I'm sitting on the chair. (already seated)" },
          { kr: "그 사람은 서울에 살고 있어요.", romanization: "geu saram-eun seoul-e salgo isseoyo.", en: "That person lives in Seoul." },
        ],
      },
    ],
    quiz: [
      { q: "How do you say 'I'm eating right now'?", opts: ["지금 밥을 먹어 있어요.", "지금 밥을 먹고 있어요.", "지금 밥을 먹을 거예요.", "지금 밥을 먹고 싶어요."], ans: 1 },
      { q: "What does 앉아 있어요 mean?", opts: ["Is in the act of sitting down", "Is already seated", "Will sit", "Wants to sit"], ans: 1 },
      { q: "Which form describes an ongoing situation like 'I work at a bank'?", opts: ["일해 있어요", "일하고 있어요", "일할 거예요", "일했어요"], ans: 1 },
    ],
  },
  {
    key: "connect-go-jiman",
    title: "Linking clauses: ~고 and ~지만",
    krTitle: "~고 · ~지만",
    level: "A2",
    summary: "~고 strings clauses together as 'and'; ~지만 turns the sentence with 'but'.",
    sections: [
      {
        heading: "~고 — and",
        explanation:
          "Attach 고 to the plain stem, with no vowel matching and no tense on the first clause. It lists things in order or simply piles up facts.",
        examples: [
          { kr: "저는 학생이고 동생은 회사원이에요.", romanization: "jeo-neun haksaeng-igo dongsaeng-eun hoesawon-ieyo.", en: "I'm a student and my sibling is an office worker." },
          { kr: "아침을 먹고 학교에 갔어요.", romanization: "achim-eul meokgo hakgyo-e gasseoyo.", en: "I ate breakfast and went to school." },
          { kr: "그 식당은 싸고 맛있어요.", romanization: "geu sikdang-eun ssago masisseoyo.", en: "That restaurant is cheap and tasty." },
        ],
      },
      {
        heading: "~지만 — but",
        explanation:
          "Attach 지만 to the stem for a contrast. Unlike 고, this one can carry tense: 했지만 means did it, but.",
        examples: [
          { kr: "한국어는 어렵지만 재미있어요.", romanization: "hangugeo-neun eoryeopjiman jaemiisseoyo.", en: "Korean is hard but fun." },
          { kr: "비가 왔지만 나갔어요.", romanization: "bi-ga watjiman nagasseoyo.", en: "It rained, but I went out." },
          { kr: "좋아하지만 자주 못 먹어요.", romanization: "joahajiman jaju mot meogeoyo.", en: "I like it, but I can't eat it often." },
        ],
      },
      {
        heading: "Starting a fresh sentence",
        explanation:
          "To begin a new sentence with and or but, use the standalone connectors 그리고 and 그렇지만 / 하지만. They do the same work between sentences that 고 and 지만 do inside one.",
        examples: [
          { kr: "밥을 먹었어요. 그리고 커피를 마셨어요.", romanization: "bab-eul meogeosseoyo. geurigo keopi-reul masyeosseoyo.", en: "I ate. And then I drank coffee." },
          { kr: "피곤해요. 하지만 괜찮아요.", romanization: "pigonhaeyo. hajiman gwaenchanayo.", en: "I'm tired. But I'm fine." },
        ],
      },
    ],
    quiz: [
      { q: "Which ending means 'but'?", opts: ["~고", "~지만", "~아서", "~으면"], ans: 1 },
      { q: "Can ~고 carry a past-tense marker on the first clause?", opts: ["Yes, always", "No — tense normally goes on the final verb", "Only in questions", "Only with 하다 verbs"], ans: 1 },
      { q: "Which word starts a new sentence with 'but'?", opts: ["그리고", "하지만", "그래서", "그러니까"], ans: 1 },
    ],
  },
  {
    key: "must-should",
    title: "Have to and must not",
    krTitle: "~아/어야 되다 · ~(으)면 안 되다",
    level: "A2",
    summary: "아/어야 되다 is 'have to'; (으)면 안 되다 is 'must not'; 아/어도 되다 is 'may'.",
    sections: [
      {
        heading: "~아/어야 되다 / 하다 — have to",
        explanation:
          "Take the 아/어 form, add 야, then 돼요 or 해요. 돼요 is more common in speech, 해요 slightly more formal. Both mean the same thing.",
        examples: [
          { kr: "지금 가야 돼요.", romanization: "jigeum gaya dwaeyo.", en: "I have to go now." },
          { kr: "약을 먹어야 해요.", romanization: "yag-eul meogeoya haeyo.", en: "I have to take medicine." },
          { kr: "내일 일찍 일어나야 돼요.", romanization: "naeil iljjik ireonaya dwaeyo.", en: "I have to get up early tomorrow." },
        ],
      },
      {
        heading: "~(으)면 안 되다 — must not",
        explanation:
          "Literally if you do it, it won't do. This is the standard way to state a rule or prohibition.",
        examples: [
          { kr: "여기에서 사진을 찍으면 안 돼요.", romanization: "yeogi-eseo sajin-eul jjigeumyeon an dwaeyo.", en: "You must not take photos here." },
          { kr: "늦으면 안 돼요.", romanization: "neujeumyeon an dwaeyo.", en: "You must not be late." },
        ],
      },
      {
        heading: "~아/어도 되다 — you may",
        explanation:
          "Swap 야 for 도 and you get permission instead of obligation. As a question it is how you ask whether something is allowed.",
        examples: [
          { kr: "여기에 앉아도 돼요?", romanization: "yeogi-e anjado dwaeyo?", en: "May I sit here?" },
          { kr: "사진을 찍어도 돼요.", romanization: "sajin-eul jjigeodo dwaeyo.", en: "You may take photos." },
          { kr: "안 가도 돼요.", romanization: "an gado dwaeyo.", en: "You don't have to go." },
        ],
      },
    ],
    quiz: [
      { q: "How do you say 'I have to go now'?", opts: ["지금 가도 돼요.", "지금 가야 돼요.", "지금 가면 안 돼요.", "지금 갈 거예요."], ans: 1 },
      { q: "'여기에서 사진을 찍으면 안 돼요' means…", opts: ["You may take photos here", "You must take photos here", "You must not take photos here", "I want to take photos here"], ans: 2 },
      { q: "Which form asks for permission?", opts: ["~아/어야 돼요?", "~아/어도 돼요?", "~(으)면 안 돼요?", "~고 싶어요?"], ans: 1 },
    ],
  },
  {
    key: "formal-style",
    title: "The formal ~(스)ㅂ니다 style",
    krTitle: "~(스)ㅂ니다",
    level: "A2",
    summary: "The register of news, presentations, service work and the workplace. Same meaning as 요, different distance.",
    sections: [
      {
        heading: "Making the form",
        explanation:
          "After a vowel stem add ㅂ니다; after a consonant stem add 습니다. Questions swap 다 for 까: ㅂ니까 / 습니까. Note the spelling is 니다 but the pronunciation is closer to nida with a soft m before it.",
        examples: [
          { kr: "가다 → 갑니다", romanization: "gada → gamnida", en: "to go → (I) go" },
          { kr: "먹다 → 먹습니다", romanization: "meokda → meokseumnida", en: "to eat → (I) eat" },
          { kr: "어디에 갑니까?", romanization: "eodi-e gamnikka?", en: "Where are you going?" },
        ],
      },
      {
        heading: "Where you meet it",
        explanation:
          "Broadcasts, company meetings, announcements, the military, and anyone serving a customer. Set phrases you already know — 감사합니다, 안녕하십니까 — are this style.",
        examples: [
          { kr: "감사합니다.", romanization: "gamsahamnida.", en: "Thank you." },
          { kr: "안녕하십니까?", romanization: "annyeonghasimnikka?", en: "Hello. (formal greeting)" },
          { kr: "회의는 세 시에 시작합니다.", romanization: "hoeui-neun se si-e sijakhamnida.", en: "The meeting starts at three." },
        ],
      },
      {
        heading: "Past and future in this style",
        explanation:
          "Attach the same tense markers first, then the ending. Past 았/었 plus 습니다 gives 았습니다/었습니다; the future uses (으)ㄹ 것입니다, often shortened to (으)ㄹ 겁니다.",
        examples: [
          { kr: "어제 도착했습니다.", romanization: "eoje dochakhaesseumnida.", en: "I arrived yesterday." },
          { kr: "내일 발표할 것입니다.", romanization: "naeil balpyohal geosimnida.", en: "I will present tomorrow." },
          { kr: "문제가 없습니다.", romanization: "munje-ga eopseumnida.", en: "There is no problem." },
        ],
      },
    ],
    quiz: [
      { q: "'먹다' ends in a consonant. What is its formal present form?", opts: ["먹ㅂ니다", "먹습니다", "먹입니다", "먹어니다"], ans: 1 },
      { q: "How do you turn ~습니다 into a question?", opts: ["Add 요", "Change 다 to 까", "Add 지", "Raise intonation only"], ans: 1 },
      { q: "Where would you most expect this style?", opts: ["Talking to a close friend", "A television news broadcast", "Texting a sibling", "A children's song"], ans: 1 },
    ],
  },
  {
    key: "because-nikka",
    title: "~(으)니까 vs ~아/어서",
    krTitle: "~(으)니까",
    level: "B1",
    summary: "Both mean 'because', but only 니까 can be followed by a command or a suggestion.",
    sections: [
      {
        heading: "Building ~(으)니까",
        explanation:
          "Add 니까 to a vowel stem and 으니까 to a consonant stem. Unlike 아/어서, this one happily takes tense markers: 했으니까, 갔으니까.",
        examples: [
          { kr: "시간이 없으니까 택시를 탑시다.", romanization: "sigan-i eopseunikka taeksi-reul tapsida.", en: "We have no time, so let's take a taxi." },
          { kr: "비가 오니까 우산을 가져가세요.", romanization: "bi-ga onikka usan-eul gajyeogaseyo.", en: "It's raining, so take an umbrella." },
          { kr: "이미 먹었으니까 괜찮아요.", romanization: "imi meogeosseunikka gwaenchanayo.", en: "I already ate, so I'm fine." },
        ],
      },
      {
        heading: "The dividing line",
        explanation:
          "아/어서 states an objective cause and cannot precede a command, a request or a let's-do form. 니까 gives the speaker's own reasoning and can precede all of them. When in doubt before an imperative, use 니까.",
        examples: [
          { kr: "추우니까 문을 닫아 주세요.", romanization: "chuunikka mun-eul dada juseyo.", en: "It's cold, so please close the door. (request — 니까 required)" },
          { kr: "추워서 문을 닫았어요.", romanization: "chuwoseo mun-eul dadasseoyo.", en: "It was cold, so I closed the door. (statement — 아/어서 fine)" },
        ],
      },
      {
        heading: "Where each one is fixed",
        explanation:
          "Apologies and thanks are the classic 아/어서 territory — 늦어서 죄송합니다 is set, and 늦으니까 죄송합니다 sounds like you are blaming the listener. Conversely, 니까 also introduces a discovery: I did X, and then I found out Y.",
        examples: [
          { kr: "도와주셔서 감사합니다.", romanization: "dowajusyeoseo gamsahamnida.", en: "Thank you for helping me. (fixed with 아/어서)" },
          { kr: "집에 가니까 아무도 없었어요.", romanization: "jib-e ganikka amudo eopseosseoyo.", en: "When I got home, nobody was there. (discovery)" },
        ],
      },
    ],
    quiz: [
      { q: "Which connector can be followed by a command?", opts: ["~아/어서", "~(으)니까", "Both", "Neither"], ans: 1 },
      { q: "Which is correct for 'Thank you for helping me'?", opts: ["도와주시니까 감사합니다", "도와주셔서 감사합니다", "도와주고 감사합니다", "도와주지만 감사합니다"], ans: 1 },
      { q: "Can ~(으)니까 carry a past-tense marker?", opts: ["Yes — 했으니까 is normal", "No, never", "Only in writing", "Only with 있다"], ans: 0 },
    ],
  },
  {
    key: "neunde",
    title: "The all-purpose ~는데 / ~(으)ㄴ데",
    krTitle: "~는데 · ~(으)ㄴ데",
    level: "B1",
    summary: "The most-used connector in spoken Korean: background, contrast, and softening all at once.",
    sections: [
      {
        heading: "Which shape to use",
        explanation:
          "Action verbs take 는데. Descriptive verbs take (으)ㄴ데 — ㄴ데 after a vowel, 은데 after a consonant. Nouns take 인데. In the past tense everything takes 았/었는데.",
        examples: [
          { kr: "지금 가는데 같이 갈래요?", romanization: "jigeum ganeunde gachi gallaeyo?", en: "I'm going now — want to come along?" },
          { kr: "이 옷은 예쁜데 너무 비싸요.", romanization: "i os-eun yeppeunde neomu bissayo.", en: "These clothes are pretty, but too expensive." },
          { kr: "학생인데 일도 해요.", romanization: "haksaeng-inde il-do haeyo.", en: "I'm a student, but I work too." },
        ],
      },
      {
        heading: "Setting up background",
        explanation:
          "Its core job is to give the listener the situation before the main point lands. English does this with a comma and a pause; Korean does it with 는데.",
        examples: [
          { kr: "한국어를 배우는데 발음이 어려워요.", romanization: "hangugeo-reul baeuneunde bareum-i eoryeowoyo.", en: "I'm learning Korean, and the pronunciation is hard." },
          { kr: "친구를 기다리는데 안 와요.", romanization: "chingu-reul gidarineunde an wayo.", en: "I'm waiting for a friend, but they're not coming." },
        ],
      },
      {
        heading: "Trailing off politely",
        explanation:
          "Ending a sentence on 는데요 leaves the request unsaid, which is exactly why it sounds polite. It is also how you signal mild disagreement without confrontation.",
        examples: [
          { kr: "저기, 자리가 없는데요.", romanization: "jeogi, jari-ga eomneundeyo.", en: "Um, there aren't any seats… (so what should we do?)" },
          { kr: "좀 비싼데요.", romanization: "jom bissandeyo.", en: "It's a bit expensive… (soft objection)" },
          { kr: "잘 모르겠는데요.", romanization: "jal moreugennundeyo.", en: "I'm not really sure…" },
        ],
      },
    ],
    quiz: [
      { q: "Which form follows a descriptive verb stem ending in a vowel, like 예쁘-?", opts: ["는데", "ㄴ데", "은데", "인데"], ans: 1 },
      { q: "What does ending a sentence with ~는데요 achieve?", opts: ["Makes it past tense", "Softens it and leaves the point implied", "Makes it a command", "Makes it formal"], ans: 1 },
      { q: "Which noun form of ~는데 is correct?", opts: ["학생는데", "학생인데", "학생은데", "학생하는데"], ans: 1 },
    ],
  },
  {
    key: "if-myeon",
    title: "Conditionals: ~(으)면",
    krTitle: "~(으)면",
    level: "B1",
    summary: "The general 'if / when' clause, plus the fixed patterns built on top of it.",
    sections: [
      {
        heading: "The basic conditional",
        explanation:
          "Add 면 to a vowel stem, 으면 to a consonant stem. Korean does not distinguish 'if' from 'whenever' here — context decides. Past 았/었으면 shifts it to a wish or a counterfactual.",
        examples: [
          { kr: "시간이 있으면 전화하세요.", romanization: "sigan-i isseumyeon jeonhwahaseyo.", en: "If you have time, call me." },
          { kr: "봄이 되면 꽃이 펴요.", romanization: "bom-i doemyeon kkoch-i pyeoyo.", en: "When spring comes, the flowers bloom." },
          { kr: "돈이 많았으면 좋겠어요.", romanization: "don-i manasseumyeon jokesseoyo.", en: "I wish I had a lot of money." },
        ],
      },
      {
        heading: "Patterns built on 면",
        explanation:
          "Several everyday grammar points are just 면 plus something: (으)면 되다 (it's enough to), (으)면 좋겠다 (I hope), (으)ㄹ 때 is the neutral 'when' for a single event rather than a condition.",
        examples: [
          { kr: "여기에 이름만 쓰면 돼요.", romanization: "yeogi-e ireum-man sseumyeon dwaeyo.", en: "You just need to write your name here." },
          { kr: "빨리 나으면 좋겠어요.", romanization: "ppalli naeumyeon jokesseoyo.", en: "I hope you get better soon." },
          { kr: "학교에 갈 때 버스를 타요.", romanization: "hakgyo-e gal ttae beoseu-reul tayo.", en: "When I go to school, I take the bus." },
        ],
      },
      {
        heading: "면 vs 때 vs 니까",
        explanation:
          "면 is a condition that may or may not happen. (으)ㄹ 때 is a time frame that does happen. 니까 is a reason. Choosing the wrong one changes the sentence from a possibility to a fact.",
        examples: [
          { kr: "비가 오면 안 갈 거예요.", romanization: "bi-ga omyeon an gal geoyeyo.", en: "If it rains, I won't go. (uncertain)" },
          { kr: "비가 올 때 우산을 써요.", romanization: "bi-ga ol ttae usan-eul sseoyo.", en: "When it rains, I use an umbrella. (habitual fact)" },
          { kr: "비가 오니까 안 갈 거예요.", romanization: "bi-ga onikka an gal geoyeyo.", en: "It's raining, so I won't go. (established reason)" },
        ],
      },
    ],
    quiz: [
      { q: "'있다' ends in a consonant. Which conditional is correct?", opts: ["있면", "있으면", "있는면", "있어면"], ans: 1 },
      { q: "What does ~았/었으면 좋겠어요 express?", opts: ["A past event", "A wish or hope", "An order", "A completed action"], ans: 1 },
      { q: "Which sentence treats the rain as uncertain?", opts: ["비가 올 때 우산을 써요.", "비가 오면 안 갈 거예요.", "비가 오니까 안 가요.", "비가 와서 안 갔어요."], ans: 1 },
    ],
  },
  {
    key: "try-boda",
    title: "Trying things: ~아/어 보다",
    krTitle: "~아/어 보다",
    level: "B1",
    summary: "보다 after the 아/어 form means 'give it a try' — and in the past, 'have done it before'.",
    sections: [
      {
        heading: "Give it a go",
        explanation:
          "Conjugate the verb into its 아/어 form and add 보다. It softens an instruction into an invitation, which is why it fills recipes, tourist guides and shop assistants' speech.",
        examples: [
          { kr: "이거 한번 먹어 보세요.", romanization: "igeo hanbeon meogeo boseyo.", en: "Try eating this." },
          { kr: "여기에 앉아 볼까요?", romanization: "yeogi-e anja bolkkayo?", en: "Shall we try sitting here?" },
          { kr: "다시 생각해 볼게요.", romanization: "dasi saenggakhae bolgeyo.", en: "I'll think it over." },
        ],
      },
      {
        heading: "Past = experience",
        explanation:
          "In the past tense, 아/어 봤어요 means you have done it at least once. The fuller form 아/어 본 적이 있다 makes the experience reading explicit; its negative is 본 적이 없다.",
        examples: [
          { kr: "한국 음식을 먹어 봤어요.", romanization: "hanguk eumsig-eul meogeo bwasseoyo.", en: "I've tried Korean food." },
          { kr: "제주도에 가 본 적이 있어요.", romanization: "jejudo-e ga bon jeog-i isseoyo.", en: "I've been to Jeju Island." },
          { kr: "그 영화는 본 적이 없어요.", romanization: "geu yeonghwa-neun bon jeog-i eopseoyo.", en: "I've never seen that movie." },
        ],
      },
      {
        heading: "Not for 보다 itself",
        explanation:
          "You do not say 봐 보다 for trying to look. Use 보다 alone, or 한번 보다. Also note 보이다 (to be visible) is a different verb entirely.",
        examples: [
          { kr: "한번 보세요.", romanization: "hanbeon boseyo.", en: "Take a look." },
          { kr: "산이 보여요.", romanization: "san-i boyeoyo.", en: "The mountain is visible." },
        ],
      },
    ],
    quiz: [
      { q: "What does 먹어 보세요 mean?", opts: ["You must eat", "Try eating it", "Don't eat", "I ate"], ans: 1 },
      { q: "How do you say 'I've never seen that movie'?", opts: ["그 영화를 안 봐요.", "그 영화는 본 적이 없어요.", "그 영화를 못 봐요.", "그 영화를 볼 거예요."], ans: 1 },
      { q: "In the past tense, ~아/어 봤어요 expresses…", opts: ["Future intention", "Past experience of having done it", "Obligation", "Ability"], ans: 1 },
    ],
  },
  {
    key: "modifiers",
    title: "Turning verbs into adjectives",
    krTitle: "~는 · ~(으)ㄴ · ~(으)ㄹ",
    level: "B1",
    summary: "Korean has no relative pronouns. Instead the whole clause is reshaped and placed in front of the noun.",
    sections: [
      {
        heading: "Action verbs across three tenses",
        explanation:
          "For action verbs: (으)ㄴ is past, 는 is present, (으)ㄹ is future or unrealised. The modifier always comes before the noun, and the whole clause with it.",
        examples: [
          { kr: "제가 먹은 빵", romanization: "je-ga meogeun ppang", en: "the bread I ate" },
          { kr: "제가 먹는 빵", romanization: "je-ga meongneun ppang", en: "the bread I'm eating" },
          { kr: "제가 먹을 빵", romanization: "je-ga meogeul ppang", en: "the bread I'll eat" },
        ],
      },
      {
        heading: "Descriptive verbs",
        explanation:
          "Descriptive verbs use (으)ㄴ for the plain present — 예쁘다 becomes 예쁜. Their 는 form (예쁘던 aside) is not used for the present, which is the single most common learner mistake here. 있다 and 없다 behave like action verbs and take 는.",
        examples: [
          { kr: "예쁜 꽃", romanization: "yeppeun kkot", en: "a pretty flower" },
          { kr: "작은 방", romanization: "jageun bang", en: "a small room" },
          { kr: "재미있는 영화", romanization: "jaemiinneun yeonghwa", en: "an interesting movie (있다 → 는)" },
        ],
      },
      {
        heading: "Long clauses in front of the noun",
        explanation:
          "Because the modifier can be a whole sentence, Korean stacks a lot of information before the noun where English would trail it after with 'that' or 'which'. Read from the noun backwards to unpack it.",
        examples: [
          { kr: "어제 제가 만난 사람이 왔어요.", romanization: "eoje je-ga mannan saram-i wasseoyo.", en: "The person I met yesterday came." },
          { kr: "한국에서 유명한 가수", romanization: "hanguk-eseo yumyeonghan gasu", en: "a singer who is famous in Korea" },
          { kr: "내일 만날 친구", romanization: "naeil mannal chingu", en: "the friend I'll meet tomorrow" },
        ],
      },
    ],
    quiz: [
      { q: "How do you say 'the bread I ate'?", opts: ["제가 먹는 빵", "제가 먹은 빵", "제가 먹을 빵", "제가 먹어 빵"], ans: 1 },
      { q: "Which ending do descriptive verbs take for the plain present, as in 'a pretty flower'?", opts: ["는", "(으)ㄴ", "(으)ㄹ", "던"], ans: 1 },
      { q: "재미있다 modifies a noun as…", opts: ["재미있은", "재미있는", "재미있을", "재미있어"], ans: 1 },
    ],
  },
  {
    key: "indirect-speech",
    title: "Reporting what people said",
    krTitle: "~다고 · ~냐고 · ~자고 · ~(으)라고 하다",
    level: "B1",
    summary: "Four quoting endings, one for each sentence type: statement, question, suggestion and command.",
    sections: [
      {
        heading: "Statements: ~(ㄴ/는)다고 하다",
        explanation:
          "Put the quoted verb into its plain written form first, then add 고 하다. Action verbs become ㄴ/는다고, descriptive verbs 다고, nouns (이)라고, past 았/었다고.",
        examples: [
          { kr: "친구가 간다고 했어요.", romanization: "chingu-ga gandago haesseoyo.", en: "My friend said they're going." },
          { kr: "날씨가 춥다고 했어요.", romanization: "nalssi-ga chupdago haesseoyo.", en: "They said the weather is cold." },
          { kr: "학생이라고 했어요.", romanization: "haksaeng-irago haesseoyo.", en: "They said they're a student." },
        ],
      },
      {
        heading: "Questions, suggestions, commands",
        explanation:
          "Questions take (느)냐고, suggestions take 자고, and commands take (으)라고. The verb after them is usually 하다, but 묻다, 부탁하다 and 시키다 all work too.",
        examples: [
          { kr: "어디에 가냐고 물었어요.", romanization: "eodi-e ganyago mureosseoyo.", en: "They asked where I was going." },
          { kr: "같이 가자고 했어요.", romanization: "gachi gajago haesseoyo.", en: "They suggested we go together." },
          { kr: "빨리 오라고 했어요.", romanization: "ppalli orago haesseoyo.", en: "They told me to come quickly." },
        ],
      },
      {
        heading: "Give me: ~아/어 달라고",
        explanation:
          "A request aimed at the speaker uses 달라고 rather than 주라고. 주라고 means asking someone to give it to a third party. This distinction has no English equivalent and is worth memorising.",
        examples: [
          { kr: "돈을 빌려 달라고 했어요.", romanization: "don-eul billyeo dallago haesseoyo.", en: "They asked me to lend them money." },
          { kr: "동생에게 책을 주라고 했어요.", romanization: "dongsaeng-ege chaeg-eul jurago haesseoyo.", en: "They told me to give the book to my sibling." },
        ],
      },
    ],
    quiz: [
      { q: "Which ending reports a command?", opts: ["~다고", "~냐고", "~자고", "~(으)라고"], ans: 3 },
      { q: "'They suggested we go together' uses which form?", opts: ["같이 간다고 했어요", "같이 가자고 했어요", "같이 가냐고 했어요", "같이 가라고 했어요"], ans: 1 },
      { q: "When the request is for the speaker's own benefit, 주라고 becomes…", opts: ["달라고", "주다고", "주자고", "주냐고"], ans: 0 },
    ],
  },
  {
    key: "experience-degree",
    title: "Talking about frequency and degree",
    krTitle: "~(으)ㄴ 편이다 · ~는 편이다",
    level: "B1",
    summary: "Korean prefers hedged claims. These patterns say 'rather', 'tend to' and 'about as much as'.",
    sections: [
      {
        heading: "~(으)ㄴ / ~는 편이다 — tends to be",
        explanation:
          "Attach the modifier form plus 편이다 to say something falls on one side of a scale rather than being absolutely so. Direct assertions can sound blunt in Korean, so this is very common.",
        examples: [
          { kr: "저는 조용한 편이에요.", romanization: "jeo-neun joyonghan pyeon-ieyo.", en: "I'm on the quiet side." },
          { kr: "이 식당은 비싼 편이에요.", romanization: "i sikdang-eun bissan pyeon-ieyo.", en: "This restaurant is rather expensive." },
          { kr: "운동을 자주 하는 편이에요.", romanization: "undong-eul jaju haneun pyeon-ieyo.", en: "I exercise fairly often." },
        ],
      },
      {
        heading: "~만큼 and ~보다 — comparisons",
        explanation:
          "보다 marks what you compare against (than), and 만큼 marks an equal degree (as much as). 더 and 덜 add more and less. Note 보다 attaches to the standard, which is the reverse of English word order.",
        examples: [
          { kr: "서울이 부산보다 커요.", romanization: "seoul-i busan-boda keoyo.", en: "Seoul is bigger than Busan." },
          { kr: "생각보다 어려웠어요.", romanization: "saenggak-boda eoryeowosseoyo.", en: "It was harder than I thought." },
          { kr: "형만큼 키가 커요.", romanization: "hyeong-mankeum ki-ga keoyo.", en: "I'm as tall as my older brother." },
        ],
      },
      {
        heading: "Frequency words",
        explanation:
          "항상, 자주, 가끔, 별로, 전혀 sit before the verb. 별로 and 전혀 require a negative verb to follow — leaving the verb positive is ungrammatical.",
        examples: [
          { kr: "가끔 영화를 봐요.", romanization: "gakkeum yeonghwa-reul bwayo.", en: "I watch movies occasionally." },
          { kr: "별로 안 좋아해요.", romanization: "byeollo an joahaeyo.", en: "I don't really like it." },
          { kr: "전혀 몰랐어요.", romanization: "jeonhyeo mollasseoyo.", en: "I had no idea at all." },
        ],
      },
    ],
    quiz: [
      { q: "'이 식당은 비싼 편이에요' means…", opts: ["This restaurant is cheap", "This restaurant is rather expensive", "This restaurant must be expensive", "This restaurant was expensive"], ans: 1 },
      { q: "In '서울이 부산보다 커요', what does 보다 attach to?", opts: ["The bigger thing", "The thing being compared against", "The verb", "The topic"], ans: 1 },
      { q: "What must follow 별로?", opts: ["A positive verb", "A negative verb", "A noun", "A question"], ans: 1 },
    ],
  },
  {
    key: "irregular-verbs",
    title: "The irregular verb families",
    krTitle: "불규칙 활용",
    level: "B1",
    summary: "Six patterns cover nearly every irregular verb in Korean. Learn the family, not the word.",
    sections: [
      {
        heading: "ㅂ and ㄷ irregulars",
        explanation:
          "ㅂ-irregulars turn ㅂ into 우 before a vowel ending: 춥다 becomes 추워요. ㄷ-irregulars turn ㄷ into ㄹ: 듣다 becomes 들어요. Both are regular before consonant endings.",
        examples: [
          { kr: "춥다 → 추워요, 추우면", romanization: "chupda → chuwoyo, chuumyeon", en: "cold → is cold, if it's cold" },
          { kr: "듣다 → 들어요, 들으면", romanization: "deutda → deureoyo, deureumyeon", en: "listen → listens, if one listens" },
          { kr: "돕다 → 도와요", romanization: "dopda → dowayo", en: "help → helps (돕다 and 곱다 take 와, not 워)" },
        ],
      },
      {
        heading: "ㅅ and 르 irregulars",
        explanation:
          "ㅅ-irregulars drop the ㅅ but keep the vowels apart: 낫다 becomes 나아요. 르-irregulars double the ㄹ and take 라/러: 모르다 becomes 몰라요, 부르다 becomes 불러요.",
        examples: [
          { kr: "낫다 → 나아요", romanization: "natda → naayo", en: "get better → gets better" },
          { kr: "모르다 → 몰라요", romanization: "moreuda → mollayo", en: "not know → doesn't know" },
          { kr: "부르다 → 불러요", romanization: "bureuda → bulleoyo", en: "call/sing → calls/sings" },
        ],
      },
      {
        heading: "ㅡ, ㄹ and ㅎ",
        explanation:
          "The ㅡ vowel drops before 아/어: 바쁘다 becomes 바빠요, 예쁘다 becomes 예뻐요. Stems ending in ㄹ drop it before ㄴ, ㅂ, ㅅ: 살다 becomes 삽니다, 사세요. ㅎ-irregular colour adjectives become ㅐ: 그렇다 becomes 그래요.",
        examples: [
          { kr: "바쁘다 → 바빠요", romanization: "bappeuda → bappayo", en: "busy → is busy" },
          { kr: "살다 → 삽니다, 사세요", romanization: "salda → samnida, saseyo", en: "live → lives, please live" },
          { kr: "빨갛다 → 빨개요", romanization: "ppalgata → ppalgaeyo", en: "red → is red" },
        ],
      },
      {
        heading: "The look-alikes that are regular",
        explanation:
          "Not every stem ending in ㅂ or ㄷ is irregular. 좁다, 입다, 잡다 are regular ㅂ verbs; 받다, 닫다, 믿다 are regular ㄷ verbs. There is no rule — these have to be learned individually.",
        examples: [
          { kr: "입다 → 입어요", romanization: "ipda → ibeoyo", en: "wear → wears (regular, not 이워요)" },
          { kr: "받다 → 받아요", romanization: "batda → badayo", en: "receive → receives (regular, not 발아요)" },
        ],
      },
    ],
    quiz: [
      { q: "What is the polite present form of 듣다?", opts: ["듣어요", "들어요", "듣아요", "들러요"], ans: 1 },
      { q: "모르다 conjugates to…", opts: ["모라요", "몰라요", "모르어요", "모러요"], ans: 1 },
      { q: "Which of these is a REGULAR verb despite ending in ㅂ?", opts: ["춥다", "덥다", "입다", "돕다"], ans: 2 },
    ],
  },
  {
    key: "passive-causative",
    title: "Passive and causative basics",
    krTitle: "피동 · 사동",
    level: "B1",
    summary: "The infixes 이/히/리/기 make a verb passive; adding 우/구/추 to the set makes it causative.",
    sections: [
      {
        heading: "Passive with 이/히/리/기",
        explanation:
          "One of four syllables slots into the stem to turn the object into the subject. Which one a verb takes is fixed by the verb, not by a rule, so learn them in pairs. The old object now takes 이/가.",
        examples: [
          { kr: "보다 → 보이다", romanization: "boda → boida", en: "to see → to be visible" },
          { kr: "문이 열렸어요.", romanization: "mun-i yeollyeosseoyo.", en: "The door opened / was opened. (열다 → 열리다)" },
          { kr: "글씨가 잘 안 보여요.", romanization: "geulssi-ga jal an boyeoyo.", en: "I can't see the writing well." },
        ],
      },
      {
        heading: "Causative with 이/히/리/기/우/구/추",
        explanation:
          "The same infixes plus three more make someone do something. 먹다 becomes 먹이다 (to feed), 자다 becomes 재우다 (to put to sleep), 앉다 becomes 앉히다 (to seat).",
        examples: [
          { kr: "아이에게 밥을 먹여요.", romanization: "ai-ege bab-eul meogyeoyo.", en: "I feed the child." },
          { kr: "아기를 재웠어요.", romanization: "agi-reul jaewosseoyo.", en: "I put the baby to sleep." },
          { kr: "옷을 입혔어요.", romanization: "os-eul ipyeosseoyo.", en: "I dressed them." },
        ],
      },
      {
        heading: "The regular alternatives",
        explanation:
          "When a verb has no infix form, use 아/어지다 for the passive and 게 하다 for the causative. These work on almost any verb and are the safe fallback.",
        examples: [
          { kr: "이 문제는 쉽게 해결됐어요.", romanization: "i munje-neun swipge haegyeoldwaesseoyo.", en: "This problem was easily solved. (하다 → 되다)" },
          { kr: "글씨가 지워졌어요.", romanization: "geulssi-ga jiwojyeosseoyo.", en: "The writing got erased." },
          { kr: "아이를 자게 했어요.", romanization: "ai-reul jage haesseoyo.", en: "I made the child sleep." },
        ],
      },
    ],
    quiz: [
      { q: "보다 in its passive form is…", opts: ["보히다", "보이다", "보리다", "보기다"], ans: 1 },
      { q: "What does 먹이다 mean?", opts: ["To be eaten", "To feed someone", "To want to eat", "To finish eating"], ans: 1 },
      { q: "Which is the general-purpose causative that works on almost any verb?", opts: ["~아/어지다", "~게 하다", "~고 있다", "~아/어 보다"], ans: 1 },
    ],
  },
  {
    key: "nominalization",
    title: "Making verbs into nouns",
    krTitle: "~기 · ~(으)ㅁ · ~는 것",
    level: "B1",
    summary: "Three ways to say 'the act of doing' — and they are not interchangeable.",
    sections: [
      {
        heading: "~기 — the activity itself",
        explanation:
          "Attach 기 to a plain stem. It names an activity in the abstract and is what fixed patterns like 기 쉽다, 기 전에 and 기 때문에 are built from. It is also the form used in titles and instructions.",
        examples: [
          { kr: "수영하기가 어려워요.", romanization: "suyeonghagi-ga eoryeowoyo.", en: "Swimming is difficult." },
          { kr: "읽기 쉬운 책", romanization: "ilgi swiun chaek", en: "an easy-to-read book" },
          { kr: "밥을 먹기 전에 손을 씻어요.", romanization: "bab-eul meokgi jeon-e son-eul ssiseoyo.", en: "I wash my hands before eating." },
        ],
      },
      {
        heading: "~는 것 — the concrete instance",
        explanation:
          "것 means thing, so 는 것 refers to the specific act or fact in question. In speech it contracts to 는 게 (subject) and 는 걸 (object). Use it when you can point at what you mean.",
        examples: [
          { kr: "한국어를 배우는 것이 재미있어요.", romanization: "hangugeo-reul baeuneun geos-i jaemiisseoyo.", en: "Learning Korean is fun." },
          { kr: "제가 좋아하는 게 뭔지 알아요?", romanization: "je-ga joahaneun ge mwonji arayo?", en: "Do you know what I like?" },
          { kr: "늦는 걸 싫어해요.", romanization: "neunneun geol sireohaeyo.", en: "I hate being late." },
        ],
      },
      {
        heading: "~(으)ㅁ — the written noun",
        explanation:
          "The most formal of the three. It appears in dictionary entries, notices, memos and note-taking, where it states a fact compactly. Some ㅁ nouns have frozen into ordinary vocabulary: 웃음, 믿음, 죽음.",
        examples: [
          { kr: "회의가 취소되었음을 알려 드립니다.", romanization: "hoeui-ga chwisodoeeosseum-eul allyeo deurimnida.", en: "We inform you that the meeting has been cancelled." },
          { kr: "오후 3시 도착함", romanization: "ohu se-si dochakham", en: "Arrives 3 p.m. (memo style)" },
          { kr: "믿음, 웃음, 꿈", romanization: "mideum, useum, kkum", en: "belief, laughter, dream (frozen forms)" },
        ],
      },
    ],
    quiz: [
      { q: "Which nominalizer appears in fixed patterns like ~기 전에 and ~기 쉽다?", opts: ["~는 것", "~기", "~(으)ㅁ", "~게"], ans: 1 },
      { q: "In speech, 는 것이 contracts to…", opts: ["는 걸", "는 게", "는 것", "는 거"], ans: 1 },
      { q: "Which form belongs in a formal written notice?", opts: ["~기", "~는 것", "~(으)ㅁ", "~아/어서"], ans: 2 },
    ],
  },
  {
    key: "deoni",
    title: "~더니 and ~았/었더니",
    krTitle: "~더니 · ~았/었더니",
    level: "B2",
    summary: "Two cousins with a strict subject rule: 더니 reports what someone else did, 았/었더니 what you did.",
    sections: [
      {
        heading: "~더니 — I observed, and then",
        explanation:
          "Attach 더니 to the stem to link something you personally witnessed with what followed. The subject must be someone other than the speaker, and you must have seen it yourself.",
        examples: [
          { kr: "친구가 열심히 공부하더니 시험에 합격했어요.", romanization: "chingu-ga yeolsimhi gongbuhadeoni siheom-e hapgyeokhaesseoyo.", en: "My friend studied hard, and (sure enough) passed the exam." },
          { kr: "아까는 춥더니 지금은 따뜻하네요.", romanization: "akka-neun chupdeoni jigeum-eun ttatteuthaneyo.", en: "It was cold earlier, and now it's warm." },
          { kr: "동생이 밥을 많이 먹더니 배가 아프대요.", romanization: "dongsaeng-i bab-eul mani meokdeoni bae-ga apeudaeyo.", en: "My sibling ate a lot, and now says their stomach hurts." },
        ],
      },
      {
        heading: "~았/었더니 — I did, and then I found",
        explanation:
          "With the past marker in front, the subject flips to the speaker. You did something, and the second clause is the result or discovery. This is the form for I went there and found that…",
        examples: [
          { kr: "아침을 안 먹었더니 배가 고파요.", romanization: "achim-eul an meogeotdeoni bae-ga gopayo.", en: "I skipped breakfast, so now I'm hungry." },
          { kr: "친구에게 전화했더니 안 받았어요.", romanization: "chingu-ege jeonhwahaetdeoni an badasseoyo.", en: "I called my friend, but they didn't pick up." },
          { kr: "일찍 갔더니 아무도 없었어요.", romanization: "iljjik gatdeoni amudo eopseosseoyo.", en: "I went early and found nobody there." },
        ],
      },
      {
        heading: "Keeping it apart from ~니까",
        explanation:
          "니까 gives a reason; 더니 reports a sequence you witnessed and often implies the second clause was a natural consequence. Swapping them is not ungrammatical but changes the flavour from because to and sure enough.",
        examples: [
          { kr: "많이 뛰었더니 다리가 아파요.", romanization: "mani ttwieotdeoni dari-ga apayo.", en: "I ran a lot, and now my legs hurt. (experienced result)" },
          { kr: "많이 뛰었으니까 다리가 아파요.", romanization: "mani ttwieosseunikka dari-ga apayo.", en: "My legs hurt because I ran a lot. (stated reason)" },
        ],
      },
    ],
    quiz: [
      { q: "Who is the subject of a ~더니 clause?", opts: ["Always the speaker", "Someone other than the speaker", "Always plural", "It doesn't matter"], ans: 1 },
      { q: "'아침을 안 먹었더니 배가 고파요' implies the speaker…", opts: ["watched someone skip breakfast", "skipped breakfast themselves", "will skip breakfast", "always eats breakfast"], ans: 1 },
      { q: "What extra requirement does ~더니 carry?", opts: ["The event must be in the future", "The speaker must have witnessed it", "It must be formal", "It must be negative"], ans: 1 },
    ],
  },
  {
    key: "gillae",
    title: "~길래 — since it was like that, I…",
    krTitle: "~길래",
    level: "B2",
    summary: "A reason you noticed from outside, prompting your own spontaneous action.",
    sections: [
      {
        heading: "How it works",
        explanation:
          "Attach 길래 to the stem. The first clause is an external circumstance you observed; the second is what you decided to do about it. The second clause subject is almost always the speaker.",
        examples: [
          { kr: "날씨가 좋길래 산책했어요.", romanization: "nalssi-ga jokillae sanchaekhaesseoyo.", en: "The weather was nice, so I went for a walk." },
          { kr: "친구가 아프다길래 약을 사 갔어요.", romanization: "chingu-ga apeudagillae yag-eul sa gasseoyo.", en: "My friend said they were sick, so I bought medicine and went over." },
          { kr: "세일하길래 두 개 샀어요.", romanization: "seilhagillae du gae sasseoyo.", en: "It was on sale, so I bought two." },
        ],
      },
      {
        heading: "Why not just 니까",
        explanation:
          "니까 is neutral reasoning and works with any subject and any following sentence type. 길래 is narrower: an outside trigger plus your own past action. It cannot be followed by a command, a suggestion or a plain future plan.",
        examples: [
          { kr: "비가 오길래 우산을 샀어요.", romanization: "bi-ga ogillae usan-eul sasseoyo.", en: "It was raining, so I bought an umbrella. (natural)" },
          { kr: "비가 오니까 우산을 사세요.", romanization: "bi-ga onikka usan-eul saseyo.", en: "It's raining, so buy an umbrella. (command needs 니까)" },
        ],
      },
      {
        heading: "In questions: what on earth",
        explanation:
          "In a question, 길래 asks what circumstance produced a surprising result. It carries a note of curiosity or mild reproach.",
        examples: [
          { kr: "얼마나 피곤했길래 그렇게 잤어요?", romanization: "eolmana pigonhaetgillae geureoke jasseoyo?", en: "How tired were you that you slept that much?" },
          { kr: "무슨 일이길래 이렇게 시끄러워요?", romanization: "museun il-igillae ireoke sikkeureowoyo?", en: "What on earth is going on that it's this noisy?" },
        ],
      },
    ],
    quiz: [
      { q: "In a ~길래 sentence, who normally performs the action in the second clause?", opts: ["The speaker", "The listener", "A third person", "Nobody"], ans: 0 },
      { q: "Which cannot follow ~길래?", opts: ["A past-tense statement", "A command", "A first-person action", "A description of what you bought"], ans: 1 },
      { q: "'날씨가 좋길래 산책했어요' means…", opts: ["Please walk since it's nice", "The weather was nice, so I took a walk", "I walk when the weather is nice", "The weather will be nice"], ans: 1 },
    ],
  },
  {
    key: "baram-e",
    title: "Blaming and crediting a cause",
    krTitle: "~는 바람에 · ~탓에 · ~덕분에",
    level: "B2",
    summary: "Three cause markers coloured by outcome: unintended, blamed, and thanked.",
    sections: [
      {
        heading: "~는 바람에 — because of it, unintentionally",
        explanation:
          "Attach 는 바람에 to an action verb stem. The result is always unexpected and usually unwanted, and the whole sentence sits in the past. You cannot use it about something you planned.",
        examples: [
          { kr: "늦잠을 자는 바람에 지각했어요.", romanization: "neutjam-eul janeun baram-e jigakhaesseoyo.", en: "I overslept, and so I was late." },
          { kr: "비가 오는 바람에 경기가 취소됐어요.", romanization: "bi-ga oneun baram-e gyeonggi-ga chwisodwaesseoyo.", en: "It rained, so the match got cancelled." },
          { kr: "길이 막히는 바람에 늦었어요.", romanization: "gil-i makhineun baram-e neujeosseoyo.", en: "The traffic was jammed, so I was late." },
        ],
      },
      {
        heading: "~탓에 / ~때문에 — fault and plain cause",
        explanation:
          "때문에 is the neutral because of. 탓에 assigns blame and only fits bad outcomes. Both attach to nouns directly and to verbs via the modifier form: 는 탓에, 기 때문에.",
        examples: [
          { kr: "날씨 때문에 못 갔어요.", romanization: "nalssi ttaemun-e mot gasseoyo.", en: "I couldn't go because of the weather." },
          { kr: "제 실수 탓에 일이 커졌어요.", romanization: "je silsu tas-e il-i keojyeosseoyo.", en: "Because of my mistake, things blew up." },
          { kr: "시간이 없기 때문에 서둘렀어요.", romanization: "sigan-i eopgi ttaemun-e seodulleosseoyo.", en: "I hurried because there was no time." },
        ],
      },
      {
        heading: "~덕분에 — thanks to",
        explanation:
          "The mirror image of 탓에: it credits a good outcome. Note that 때문에 cannot start a sentence on its own — use 그렇기 때문에 for that.",
        examples: [
          { kr: "선생님 덕분에 합격했어요.", romanization: "seonsaengnim deokbun-e hapgyeokhaesseoyo.", en: "Thanks to my teacher, I passed." },
          { kr: "도와주신 덕분에 잘 끝났어요.", romanization: "dowajusin deokbun-e jal kkeunnasseoyo.", en: "Thanks to your help, it ended well." },
        ],
      },
    ],
    quiz: [
      { q: "What kind of result does ~는 바람에 always describe?", opts: ["A planned one", "An unexpected, usually unwanted one", "A future one", "A positive one"], ans: 1 },
      { q: "Which marker credits a good outcome?", opts: ["탓에", "바람에", "덕분에", "때문에"], ans: 2 },
      { q: "Which is the neutral 'because of'?", opts: ["덕분에", "탓에", "때문에", "바람에"], ans: 2 },
    ],
  },
  {
    key: "written-plain-style",
    title: "The written plain style ~ㄴ/는다",
    krTitle: "문어체 (~ㄴ/는다)",
    level: "B2",
    summary: "Books, essays, newspapers and diaries drop the 요 entirely and use the neutral 한다 form.",
    sections: [
      {
        heading: "The four endings",
        explanation:
          "Action verbs take ㄴ다 after a vowel and 는다 after a consonant. Descriptive verbs and 있다/없다 take plain 다. Nouns take (이)다. Past is 았/었다 for everything, future (으)ㄹ 것이다.",
        examples: [
          { kr: "그는 매일 아침 커피를 마신다.", romanization: "geu-neun maeil achim keopi-reul masinda.", en: "He drinks coffee every morning." },
          { kr: "날씨가 춥다.", romanization: "nalssi-ga chupda.", en: "The weather is cold." },
          { kr: "그것은 사실이 아니다.", romanization: "geugeos-eun sasil-i anida.", en: "That is not true." },
        ],
      },
      {
        heading: "It is a register, not rudeness",
        explanation:
          "This style has no listener built into it, so it is neither polite nor impolite — it simply addresses no one. That is why it suits printed text. Spoken to a person's face, though, it lands as blunt 반말.",
        examples: [
          { kr: "정부는 새 정책을 발표했다.", romanization: "jeongbu-neun sae jeongchaeg-eul balpyohaetda.", en: "The government announced a new policy." },
          { kr: "오늘은 비가 올 것이다.", romanization: "oneul-eun bi-ga ol geos-ida.", en: "It will rain today." },
        ],
      },
      {
        heading: "Other things that change in writing",
        explanation:
          "Written Korean also prefers 나 over 저, drops most sentence-final particles like 요 and 네, replaces 그래서 with 따라서 or 그러므로, and favours Sino-Korean vocabulary over native equivalents.",
        examples: [
          { kr: "따라서 결론은 명확하다.", romanization: "ttaraseo gyeollon-eun myeonghwakhada.", en: "Therefore the conclusion is clear." },
          { kr: "이 문제는 해결이 필요하다.", romanization: "i munje-neun haegyeol-i piryohada.", en: "This problem requires a solution." },
        ],
      },
    ],
    quiz: [
      { q: "How does the action verb 마시다 appear in written plain style?", opts: ["마시다", "마신다", "마셔요", "마십니다"], ans: 1 },
      { q: "Descriptive verbs like 춥다 in this style are written…", opts: ["춥는다", "춥다", "추운다", "추워요"], ans: 1 },
      { q: "Why does the written plain style feel neutral rather than rude in print?", opts: ["It is very old", "It addresses no specific listener", "It is only used by teachers", "It is a form of honorific"], ans: 1 },
    ],
  },
  {
    key: "quotation-contraction",
    title: "Contracted quotations: ~대요, ~냬요, ~재요, ~래요",
    krTitle: "~대요 · ~냬요 · ~재요 · ~래요",
    level: "B2",
    summary: "Spoken Korean squeezes 다고 해요 down to 대요. Four endings, one for each sentence type.",
    sections: [
      {
        heading: "The four contractions",
        explanation:
          "다고 해요 becomes 대요, 냐고 해요 becomes 냬요, 자고 해요 becomes 재요, and (으)라고 해요 becomes (으)래요. These dominate casual speech — the full forms sound stiff in conversation.",
        examples: [
          { kr: "내일 비가 온대요.", romanization: "naeil bi-ga ondaeyo.", en: "They say it'll rain tomorrow." },
          { kr: "어디 가냬요.", romanization: "eodi ganyaeyo.", en: "They're asking where you're going." },
          { kr: "같이 밥 먹재요.", romanization: "gachi bap meokjaeyo.", en: "They suggest eating together." },
          { kr: "빨리 오래요.", romanization: "ppalli oraeyo.", en: "They say to come quickly." },
        ],
      },
      {
        heading: "Hearsay you did not witness",
        explanation:
          "대요 also works with no named source, meaning it is said that or apparently. This is how you pass on weather forecasts, gossip and things you read.",
        examples: [
          { kr: "그 식당이 진짜 맛있대요.", romanization: "geu sikdang-i jinjja masitdaeyo.", en: "Apparently that restaurant is really good." },
          { kr: "그 사람 결혼했대요.", romanization: "geu saram gyeolhonhaetdaeyo.", en: "I heard they got married." },
        ],
      },
      {
        heading: "Do not confuse it with ~ㄴ대요 as surprise",
        explanation:
          "Nouns quote as (이)래요, not 대요: 학생이래요. Also, a rising 대요 at the end of your own question turns it into an expression of disbelief. Tone carries a lot here.",
        examples: [
          { kr: "그 사람은 의사래요.", romanization: "geu saram-eun uisa-raeyo.", en: "They say that person is a doctor." },
          { kr: "지금 간대요?", romanization: "jigeum gandaeyo?", en: "They're going now, really?" },
        ],
      },
    ],
    quiz: [
      { q: "What does 온대요 come from?", opts: ["오냐고 해요", "온다고 해요", "오자고 해요", "오라고 해요"], ans: 1 },
      { q: "Which contraction reports a suggestion?", opts: ["~대요", "~냬요", "~재요", "~래요"], ans: 2 },
      { q: "How do you quote a noun, as in 'they say he's a doctor'?", opts: ["의사대요", "의사래요", "의사냬요", "의사재요"], ans: 1 },
    ],
  },
  {
    key: "as-soon-as",
    title: "As soon as: ~자마자 and ~는 대로",
    krTitle: "~자마자 · ~는 대로",
    level: "B2",
    summary: "Both mean 'the moment X happens', but only one of them can point at the future.",
    sections: [
      {
        heading: "~자마자 — immediately after",
        explanation:
          "Attach 자마자 to the plain stem. It works for past and future alike and simply reports that two events touched. No tense goes on the first clause.",
        examples: [
          { kr: "집에 도착하자마자 잤어요.", romanization: "jib-e dochakhajamaja jasseoyo.", en: "I fell asleep the moment I got home." },
          { kr: "수업이 끝나자마자 전화할게요.", romanization: "sueob-i kkeunnajamaja jeonhwahalgeyo.", en: "I'll call as soon as class ends." },
          { kr: "그 말을 듣자마자 웃었어요.", romanization: "geu mal-eul deutjamaja useosseoyo.", en: "I laughed the instant I heard that." },
        ],
      },
      {
        heading: "~는 대로 — as soon as, for things still to come",
        explanation:
          "Attach 는 대로 to an action verb. It carries a sense of intention, so it points forward and cannot describe a past accident. It is the standard form for making commitments.",
        examples: [
          { kr: "도착하는 대로 연락드리겠습니다.", romanization: "dochakhaneun daero yeollakdeurigesseumnida.", en: "I'll contact you as soon as I arrive." },
          { kr: "일이 끝나는 대로 갈게요.", romanization: "il-i kkeunnaneun daero galgeyo.", en: "I'll go as soon as work is over." },
        ],
      },
      {
        heading: "대로's other meaning: exactly as",
        explanation:
          "After a past modifier or a noun, 대로 means in accordance with. 말한 대로 is as I said; 계획대로 is according to plan. Same word, quite different job.",
        examples: [
          { kr: "제가 말한 대로 하세요.", romanization: "je-ga malhan daero haseyo.", en: "Do it exactly as I said." },
          { kr: "계획대로 진행됐어요.", romanization: "gyehoekdaero jinhaengdwaesseoyo.", en: "It proceeded according to plan." },
        ],
      },
    ],
    quiz: [
      { q: "Which form cannot be used for an unintended past event?", opts: ["~자마자", "~는 대로", "Both work", "Neither works"], ans: 1 },
      { q: "Does ~자마자 take a tense marker on the first clause?", opts: ["Yes, always", "No — it attaches to the plain stem", "Only in the past", "Only in writing"], ans: 1 },
      { q: "'제가 말한 대로 하세요' means…", opts: ["Do it as soon as I speak", "Do it exactly as I said", "Say what I do", "Don't do what I said"], ans: 1 },
    ],
  },
  {
    key: "retrospective-deo",
    title: "Recalling with ~더라고요 and ~던",
    krTitle: "~더라고요 · ~던",
    level: "B2",
    summary: "The 더 marker replays something you personally experienced and are now reporting back.",
    sections: [
      {
        heading: "~더라고요 — I saw it myself",
        explanation:
          "Attach 더라고요 to the stem to report a discovery you made in person. The rule is strict: you must have witnessed it, and the subject is normally not you, because you do not observe yourself from outside.",
        examples: [
          { kr: "그 집 음식이 정말 맛있더라고요.", romanization: "geu jip eumsig-i jeongmal masitdeoragoyo.", en: "The food at that place was really good — I tried it." },
          { kr: "생각보다 사람이 많더라고요.", romanization: "saenggakboda saram-i mandeoragoyo.", en: "There were more people than I expected." },
          { kr: "어제 가 봤는데 문을 닫았더라고요.", romanization: "eoje ga bwanneunde mun-eul dadatdeoragoyo.", en: "I went yesterday and found it closed." },
        ],
      },
      {
        heading: "~던 — the modifier of memory",
        explanation:
          "던 in front of a noun marks something recalled: ongoing back then, repeated back then, or left unfinished. 았/었던 marks a completed past you are now recalling as distant.",
        examples: [
          { kr: "제가 다니던 학교예요.", romanization: "je-ga danideon hakgyo-yeyo.", en: "It's the school I used to attend." },
          { kr: "마시던 커피가 식었어요.", romanization: "masideon keopi-ga sigeosseoyo.", en: "The coffee I was drinking got cold." },
          { kr: "어릴 때 살았던 동네", romanization: "eoril ttae saratdeon dongne", en: "the neighbourhood I lived in as a child" },
        ],
      },
      {
        heading: "Also ~더라 and ~던데요",
        explanation:
          "The casual version is 더라. Combined with 는데 you get 던데요, which reports an observation while inviting the listener to respond to it.",
        examples: [
          { kr: "그 영화 진짜 재미있더라.", romanization: "geu yeonghwa jinjja jaemiitdeora.", en: "That movie was really fun. (casual)" },
          { kr: "밖이 꽤 춥던데요.", romanization: "bakk-i kkwae chupdeondeyo.", en: "It was quite cold outside, you know…" },
        ],
      },
    ],
    quiz: [
      { q: "What does the 더 marker require?", opts: ["A formal register", "That the speaker experienced it firsthand", "A future event", "A plural subject"], ans: 1 },
      { q: "'제가 다니던 학교' means…", opts: ["The school I will attend", "The school I used to attend", "The school I like", "The school that is closed"], ans: 1 },
      { q: "Why is '제가 예쁘더라고요' odd?", opts: ["Wrong tense", "You don't observe yourself from outside", "예쁘다 is irregular", "It needs 요"], ans: 1 },
    ],
  },
  {
    key: "intentions",
    title: "Purpose: ~(으)려고, ~기 위해, ~고자",
    krTitle: "~(으)려고 · ~기 위해 · ~고자",
    level: "B2",
    summary: "Three ways to say 'in order to', separated by formality and by what kind of goal is involved.",
    sections: [
      {
        heading: "~(으)려고 — personal intention",
        explanation:
          "The everyday one. The subject of both clauses must be the same person, and the second clause cannot be a command or a suggestion. On its own, (으)려고 하다 means to be about to or to intend to.",
        examples: [
          { kr: "한국에 가려고 돈을 모아요.", romanization: "hanguk-e garyeogo don-eul moayo.", en: "I'm saving money in order to go to Korea." },
          { kr: "지금 나가려고 해요.", romanization: "jigeum nagaryeogo haeyo.", en: "I'm about to go out." },
          { kr: "자려고 누웠는데 잠이 안 와요.", romanization: "jaryeogo nuwonneunde jam-i an wayo.", en: "I lay down to sleep but can't drop off." },
        ],
      },
      {
        heading: "~기 위해(서) — for the sake of",
        explanation:
          "More formal and more goal-oriented, common in writing and speeches. Unlike (으)려고, it can be followed by a command. After a noun, use 을/를 위해.",
        examples: [
          { kr: "건강을 지키기 위해 매일 운동합니다.", romanization: "geongang-eul jikigi wihae maeil undonghamnida.", en: "I exercise daily in order to protect my health." },
          { kr: "가족을 위해 일해요.", romanization: "gajog-eul wihae ilhaeyo.", en: "I work for my family." },
          { kr: "안전을 위해 손잡이를 잡으세요.", romanization: "anjeon-eul wihae sonjab-i-reul jabeuseyo.", en: "For your safety, please hold the handrail." },
        ],
      },
      {
        heading: "~고자 and ~(으)러",
        explanation:
          "고자 is the most formal of the set and belongs to written and ceremonial language. (으)러 is different again: it only attaches to a goal that is followed by a verb of movement — going or coming somewhere to do something.",
        examples: [
          { kr: "말씀드리고자 합니다.", romanization: "malsseumdeurigoja hamnida.", en: "I would like to say a few words. (formal)" },
          { kr: "밥을 먹으러 식당에 갔어요.", romanization: "bab-eul meogeureo sikdang-e gasseoyo.", en: "I went to the restaurant to eat." },
          { kr: "책을 빌리러 도서관에 가요.", romanization: "chaeg-eul billireo doseogwan-e gayo.", en: "I'm going to the library to borrow a book." },
        ],
      },
    ],
    quiz: [
      { q: "Which purpose form requires a movement verb in the main clause?", opts: ["~(으)려고", "~기 위해", "~(으)러", "~고자"], ans: 2 },
      { q: "Which can be followed by a command?", opts: ["~(으)려고", "~기 위해", "Neither", "Only ~고자"], ans: 1 },
      { q: "'지금 나가려고 해요' means…", opts: ["I went out", "I'm about to go out", "Please go out", "I can't go out"], ans: 1 },
    ],
  },
  {
    key: "concessive",
    title: "Even if: ~아/어도 and ~더라도",
    krTitle: "~아/어도 · ~더라도 · ~(으)ㄹ지라도",
    level: "B2",
    summary: "Concessive clauses that grant the point and then push past it, ordered from everyday to literary.",
    sections: [
      {
        heading: "~아/어도 — even if, even though",
        explanation:
          "Take the 아/어 form and add 도. It covers both a real concession (even though it is so) and a hypothetical one (even if it were). Tense goes on the final verb.",
        examples: [
          { kr: "비가 와도 갈 거예요.", romanization: "bi-ga wado gal geoyeyo.", en: "I'll go even if it rains." },
          { kr: "아무리 바빠도 밥은 먹어야죠.", romanization: "amuri bappado bab-eun meogeoyajyo.", en: "No matter how busy you are, you have to eat." },
          { kr: "설명을 들어도 이해가 안 돼요.", romanization: "seolmyeong-eul deureodo ihae-ga an dwaeyo.", en: "Even after hearing the explanation, I don't understand." },
        ],
      },
      {
        heading: "~더라도 — even supposing",
        explanation:
          "Stronger and more hypothetical than 아/어도. It concedes something you consider unlikely or extreme, and often pairs with 아무리 or 설령.",
        examples: [
          { kr: "시간이 없더라도 꼭 연락하세요.", romanization: "sigan-i eopdeorado kkok yeollakhaseyo.", en: "Even if you have no time, do get in touch." },
          { kr: "설령 실패하더라도 후회하지 않아요.", romanization: "seollyeong silpaehadeorado huhoehaji anayo.", en: "Even supposing I fail, I won't regret it." },
        ],
      },
      {
        heading: "~(으)ㄹ지라도 and ~(으)ㄴ들",
        explanation:
          "These belong to formal writing and rhetoric. (으)ㄹ지라도 is a heightened even though; (으)ㄴ들 is a rhetorical even if, usually implying it would make no difference.",
        examples: [
          { kr: "어려울지라도 포기하지 않겠습니다.", romanization: "eoryeouljirado pogihaji ankesseumnida.", en: "Even though it may be hard, I will not give up." },
          { kr: "지금 후회한들 무슨 소용이 있겠는가.", romanization: "jigeum huhoehandeul museun soyong-i itgenneunga.", en: "What good would regretting it now do?" },
        ],
      },
    ],
    quiz: [
      { q: "Which is the everyday 'even if'?", opts: ["~아/어도", "~더라도", "~(으)ㄹ지라도", "~(으)ㄴ들"], ans: 0 },
      { q: "Which adverb commonly pairs with these concessive endings?", opts: ["아주", "아무리", "벌써", "이미"], ans: 1 },
      { q: "Where would you expect ~(으)ㄹ지라도?", opts: ["Texting a friend", "Formal writing or a speech", "Ordering food", "A children's book"], ans: 1 },
    ],
  },
  {
    key: "degree-extent",
    title: "Degree and proportion",
    krTitle: "~(으)ㄹ 정도로 · ~(으)ㄹ 만큼 · ~(으)면 ~(으)ㄹ수록",
    level: "B2",
    summary: "Patterns for saying how much, to what extent, and the more X the more Y.",
    sections: [
      {
        heading: "~(으)ㄹ 정도로 — to the extent that",
        explanation:
          "Put a vivid comparison in the first clause and 정도로 turns it into a measure of the second. English usually renders it as so much that.",
        examples: [
          { kr: "말을 못 할 정도로 놀랐어요.", romanization: "mal-eul mot hal jeongdo-ro nollasseoyo.", en: "I was so surprised I couldn't speak." },
          { kr: "눈물이 날 정도로 매웠어요.", romanization: "nunmul-i nal jeongdo-ro maewosseoyo.", en: "It was spicy enough to bring tears." },
          { kr: "믿을 수 없을 정도로 빨라요.", romanization: "mideul su eopseul jeongdo-ro ppallayo.", en: "It's unbelievably fast." },
        ],
      },
      {
        heading: "~(으)ㄹ 만큼 — as much as",
        explanation:
          "Close to 정도로 but focused on matching a quantity rather than illustrating an extreme. 만큼 also attaches straight to nouns for as much as X.",
        examples: [
          { kr: "먹을 만큼만 가져가세요.", romanization: "meogeul mankeum-man gajyeogaseyo.", en: "Take only as much as you'll eat." },
          { kr: "노력한 만큼 결과가 나와요.", romanization: "noryeokhan mankeum gyeolgwa-ga nawayo.", en: "You get results in proportion to your effort." },
        ],
      },
      {
        heading: "~(으)면 ~(으)ㄹ수록 — the more, the more",
        explanation:
          "Repeat the same verb in both slots: conditional 면 first, then (으)ㄹ수록. In speech the first half is often dropped, leaving just (으)ㄹ수록.",
        examples: [
          { kr: "보면 볼수록 예뻐요.", romanization: "bomyeon bolsurok yeppeoyo.", en: "The more I look, the prettier it is." },
          { kr: "공부하면 할수록 재미있어요.", romanization: "gongbuhamyeon halsurok jaemiisseoyo.", en: "The more I study, the more fun it gets." },
          { kr: "시간이 갈수록 어려워져요.", romanization: "sigan-i galsurok eoryeowojyeoyo.", en: "It gets harder as time goes on." },
        ],
      },
    ],
    quiz: [
      { q: "'말을 못 할 정도로 놀랐어요' means…", opts: ["I was surprised and spoke", "I was so surprised I couldn't speak", "I couldn't be surprised", "I spoke about the surprise"], ans: 1 },
      { q: "Which pattern means 'the more X, the more Y'?", opts: ["~(으)ㄹ 정도로", "~(으)ㄹ 만큼", "~(으)면 ~(으)ㄹ수록", "~는 대로"], ans: 2 },
      { q: "'먹을 만큼만 가져가세요' tells you to take…", opts: ["everything", "only as much as you'll eat", "nothing", "twice as much"], ans: 1 },
    ],
  },
  {
    key: "general-truth",
    title: "Stating general truths",
    krTitle: "~기 마련이다 · ~는 법이다",
    level: "C1",
    summary: "Endings that frame something as inevitable, natural, or the way of the world.",
    sections: [
      {
        heading: "~기 마련이다 — it is bound to happen",
        explanation:
          "Attach 기 마련이다 to a stem to say that the outcome is only natural given how things are. It carries a resigned, worldly tone and appears constantly in proverbs and advice. 게 마련이다 is an equally correct variant.",
        examples: [
          { kr: "사람은 누구나 실수하기 마련이에요.", romanization: "saram-eun nuguna silsuhagi maryeon-ieyo.", en: "Everyone is bound to make mistakes." },
          { kr: "처음에는 어렵기 마련이다.", romanization: "cheoeum-eneun eoryeopgi maryeon-ida.", en: "It's only natural for things to be hard at first." },
          { kr: "시간이 지나면 잊히게 마련이에요.", romanization: "sigan-i jinamyeon ijhige maryeon-ieyo.", en: "Once time passes, things naturally get forgotten." },
        ],
      },
      {
        heading: "~는 법이다 — that is how it works",
        explanation:
          "법 means law or way. This ending asserts a principle rather than a tendency, so it sounds more didactic than 기 마련이다. It is what an elder says when delivering a life lesson.",
        examples: [
          { kr: "노력하면 성공하는 법이다.", romanization: "noryeokhamyeon seonggonghaneun beob-ida.", en: "Work hard and you succeed — that's how it goes." },
          { kr: "급하게 먹으면 체하는 법이에요.", romanization: "geuphage meogeumyeon chehaneun beob-ieyo.", en: "Eat in a rush and you'll get indigestion; that's the way of it." },
        ],
      },
      {
        heading: "Neighbouring patterns",
        explanation:
          "~는 셈이다 says it amounts to; ~기 십상이다 warns that something bad is likely; ~는 경향이 있다 states a tendency more neutrally and belongs to written or academic register.",
        examples: [
          { kr: "거의 다 끝난 셈이에요.", romanization: "geoui da kkeunnan sem-ieyo.", en: "It's as good as finished." },
          { kr: "그렇게 하면 다치기 십상이에요.", romanization: "geureoke hamyeon dachigi sipsang-ieyo.", en: "Do it that way and you're likely to get hurt." },
          { kr: "젊은 층은 그런 경향이 있다.", romanization: "jeolmeun cheung-eun geureon gyeonghyang-i itda.", en: "Younger demographics show that tendency." },
        ],
      },
    ],
    quiz: [
      { q: "Which ending frames the result as only natural and slightly resigned?", opts: ["~기 마련이다", "~는 셈이다", "~기 위해", "~는 대로"], ans: 0 },
      { q: "'거의 다 끝난 셈이에요' means…", opts: ["It's bound to finish", "It's as good as finished", "It must finish", "It finished badly"], ans: 1 },
      { q: "Which warns that something undesirable is likely?", opts: ["~는 법이다", "~기 십상이다", "~는 경향이 있다", "~기 마련이다"], ans: 1 },
    ],
  },
  {
    key: "ppun-manira",
    title: "Not only that: ~(으)ㄹ 뿐만 아니라",
    krTitle: "~(으)ㄹ 뿐만 아니라 · ~(으)ㄹ 뿐이다",
    level: "C1",
    summary: "뿐 means 'only'. Negate it and you get 'not only' — the workhorse of formal addition.",
    sections: [
      {
        heading: "~(으)ㄹ 뿐만 아니라 — not only… but also",
        explanation:
          "Attach the (으)ㄹ modifier plus 뿐만 아니라 to a verb, or 뿐만 아니라 directly to a noun. The second clause usually carries 도. It is the standard connector for building a case in writing.",
        examples: [
          { kr: "그는 성실할 뿐만 아니라 유능하다.", romanization: "geu-neun seongsilhal ppunman anira yuneunghada.", en: "He is not only diligent but also capable." },
          { kr: "가격뿐만 아니라 품질도 좋아요.", romanization: "gagyeok-ppunman anira pumjil-do joayo.", en: "Not only the price but the quality is good too." },
          { kr: "비가 올 뿐만 아니라 바람도 세요.", romanization: "bi-ga ol ppunman anira baram-do seyo.", en: "Not only is it raining, the wind is strong too." },
        ],
      },
      {
        heading: "~(으)ㄹ 뿐이다 — nothing more than",
        explanation:
          "Left positive, 뿐이다 restricts: that and nothing else. It often carries a note of modesty or of dismissal, depending on what you attach it to.",
        examples: [
          { kr: "저는 제 일을 했을 뿐입니다.", romanization: "jeo-neun je il-eul haesseul ppun-imnida.", en: "I merely did my job." },
          { kr: "그저 소문일 뿐이에요.", romanization: "geujeo somun-il ppun-ieyo.", en: "It's nothing more than a rumour." },
        ],
      },
      {
        heading: "The same job, other registers",
        explanation:
          "In speech, 도 ~고 or 게다가 does the adding. In formal writing you will also meet ~(으)ㅁ은 물론이고 and ~기도 하다. Choosing among them is mostly a register decision, not a meaning one.",
        examples: [
          { kr: "맛있고 게다가 싸요.", romanization: "masitgo gedaga ssayo.", en: "It's tasty and on top of that cheap. (spoken)" },
          { kr: "실력은 물론이고 인성도 훌륭하다.", romanization: "sillyeog-eun mullon-igo inseong-do hullyunghada.", en: "Not to mention skill, their character is excellent too." },
        ],
      },
    ],
    quiz: [
      { q: "What particle usually appears in the second clause after ~뿐만 아니라?", opts: ["은/는", "도", "이/가", "만"], ans: 1 },
      { q: "'저는 제 일을 했을 뿐입니다' means…", opts: ["I did more than my job", "I merely did my job", "I couldn't do my job", "I will do my job"], ans: 1 },
      { q: "Which is the spoken equivalent for adding a point?", opts: ["게다가", "물론이고", "뿐만 아니라", "그러므로"], ans: 0 },
    ],
  },
  {
    key: "sino-word-formation",
    title: "한자어 word-building",
    krTitle: "한자어 조어법",
    level: "C1",
    summary: "A handful of Sino-Korean suffixes unlock thousands of advanced words at once.",
    sections: [
      {
        heading: "~적 (的) — the -ic / -al suffix",
        explanation:
          "적 turns a Sino-Korean noun into a modifier. 적인 goes before a noun, 적으로 before a verb, and bare 적 is used in compact written phrases. This one suffix covers most abstract adjectives in academic Korean.",
        examples: [
          { kr: "경제적인 문제", romanization: "gyeongjejeog-in munje", en: "an economic problem" },
          { kr: "구체적으로 설명해 주세요.", romanization: "guchejeogeuro seolmyeonghae juseyo.", en: "Please explain concretely." },
          { kr: "사회적 책임", romanization: "sahoejeok chaegim", en: "social responsibility" },
        ],
      },
      {
        heading: "~화 (化), ~성 (性), ~력 (力)",
        explanation:
          "화 is -ization (자동화, automation), 성 is -ness or -ity (가능성, possibility), 력 is power or capacity (능력, ability). Recognising them lets you decode words you have never seen.",
        examples: [
          { kr: "산업화가 빠르게 진행되었다.", romanization: "saneophwa-ga ppareuge jinhaengdoeeotda.", en: "Industrialisation proceeded rapidly." },
          { kr: "성공 가능성이 높아요.", romanization: "seonggong ganeungseong-i nopayo.", en: "The likelihood of success is high." },
          { kr: "집중력이 부족해요.", romanization: "jipjungnyeog-i bujokhaeyo.", en: "My concentration is lacking." },
        ],
      },
      {
        heading: "Prefixes: 무~, 미~, 재~, 반~",
        explanation:
          "무 is -less (무료, free of charge), 미 is not yet (미완성, unfinished), 재 is re- (재검토, re-examination), 반 is anti- (반대, opposition). They behave exactly like their English counterparts.",
        examples: [
          { kr: "입장은 무료입니다.", romanization: "ipjang-eun muryo-imnida.", en: "Admission is free." },
          { kr: "아직 미해결 상태예요.", romanization: "ajik mihaegyeol sangtae-yeyo.", en: "It's still in an unresolved state." },
          { kr: "재검토가 필요합니다.", romanization: "jaegeomto-ga piryohamnida.", en: "A re-examination is needed." },
        ],
      },
      {
        heading: "Native and Sino pairs",
        explanation:
          "Most concepts have both a native and a Sino-Korean word, and the Sino one is the formal register. Knowing the pair lets you shift register deliberately rather than by accident.",
        examples: [
          { kr: "생각 / 사고", romanization: "saenggak / sago", en: "thought (everyday / academic)" },
          { kr: "나이 / 연세", romanization: "nai / yeonse", en: "age (plain / honorific)" },
          { kr: "값 / 가격", romanization: "gap / gagyeok", en: "price (spoken / written)" },
        ],
      },
    ],
    quiz: [
      { q: "Which form of 적 goes directly before a verb?", opts: ["적인", "적으로", "적", "적이"], ans: 1 },
      { q: "가능성 breaks down as 가능 plus which suffix?", opts: ["화 (-ization)", "성 (-ness/-ity)", "력 (power)", "적 (-ic)"], ans: 1 },
      { q: "Which prefix means 'not yet'?", opts: ["무~", "미~", "재~", "반~"], ans: 1 },
    ],
  },
  {
    key: "nuanced-endings",
    title: "Sentence endings that carry attitude",
    krTitle: "~잖아요 · ~거든요 · ~네요 · ~지요",
    level: "C1",
    summary: "These endings add nothing to the facts and everything to the relationship between speaker and listener.",
    sections: [
      {
        heading: "~잖아요 — you know this already",
        explanation:
          "Use it to remind the listener of shared knowledge. It can sound warm and collaborative, or impatient, depending entirely on tone — which is why learners are often warned off it with strangers.",
        examples: [
          { kr: "어제 말했잖아요.", romanization: "eoje malhaetjanayo.", en: "I told you yesterday, remember?" },
          { kr: "오늘 일요일이잖아요.", romanization: "oneul iryoil-ijanayo.", en: "It's Sunday today, you know." },
        ],
      },
      {
        heading: "~거든요 — here's the background",
        explanation:
          "It supplies a reason the listener does not yet have, often setting up what you are about to say. Ending a first sentence on 거든요 signals that more is coming.",
        examples: [
          { kr: "내일 못 가요. 일이 있거든요.", romanization: "naeil mot gayo. il-i itgeodeunyo.", en: "I can't go tomorrow. I've got work, you see." },
          { kr: "제가 어제 그 사람을 만났거든요. 그런데…", romanization: "je-ga eoje geu saram-eul mannatgeodeunyo. geureonde…", en: "So I met that person yesterday. And then…" },
        ],
      },
      {
        heading: "~네요 and ~군요 — fresh realisation",
        explanation:
          "Both mark something you have just noticed. 네요 is the everyday spoken one and sounds mildly impressed; 군요 (or 구나 casually) is a touch more bookish and reads as ah, I see.",
        examples: [
          { kr: "한국어를 정말 잘하시네요.", romanization: "hangugeo-reul jeongmal jalhasineyo.", en: "You speak Korean really well! (just noticed)" },
          { kr: "아, 그래서 안 왔군요.", romanization: "a, geuraeseo an watgunyo.", en: "Ah, so that's why they didn't come." },
        ],
      },
      {
        heading: "~지요 / ~죠 — seeking agreement",
        explanation:
          "지요 assumes the listener agrees, like an English tag question. It also softens a suggestion or an offer, and in the first person it signals willing acceptance.",
        examples: [
          { kr: "날씨가 좋죠?", romanization: "nalssi-ga jochyo?", en: "The weather's nice, isn't it?" },
          { kr: "제가 도와 드리죠.", romanization: "je-ga dowa deurijyo.", en: "Let me help you, then." },
          { kr: "그럼 그렇게 하죠.", romanization: "geureom geureoke hajyo.", en: "Let's do it that way, then." },
        ],
      },
    ],
    quiz: [
      { q: "Which ending reminds the listener of something you both already know?", opts: ["~거든요", "~잖아요", "~네요", "~죠"], ans: 1 },
      { q: "'일이 있거든요' supplies…", opts: ["shared knowledge", "a reason the listener didn't have", "a fresh realisation", "a tag question"], ans: 1 },
      { q: "Which ending works like an English tag question?", opts: ["~네요", "~군요", "~지요", "~거든요"], ans: 2 },
    ],
  },
  {
    key: "conjecture-endings",
    title: "Conjecture: ~(으)ㄹ 텐데, ~(으)ㄹ 테니까, ~(으)ㄹ 걸",
    krTitle: "~(으)ㄹ 텐데 · ~(으)ㄹ 테니까 · ~(으)ㄹ 걸",
    level: "C1",
    summary: "Speculation with consequences — guessing, and then acting on the guess.",
    sections: [
      {
        heading: "~(으)ㄹ 텐데 — I'd expect…, but",
        explanation:
          "터 is a bound noun meaning expectation. 텐데 states a supposition and leaves a concern or a contrast hanging. Trailing off on 텐데요 is a common way to voice worry politely.",
        examples: [
          { kr: "지금쯤 도착했을 텐데 연락이 없네요.", romanization: "jigeumjjeum dochakhaesseul tende yeollag-i eomneyo.", en: "They should have arrived by now, but there's no word." },
          { kr: "많이 힘드실 텐데요.", romanization: "mani himdeusil tendeyo.", en: "That must be hard on you…" },
        ],
      },
      {
        heading: "~(으)ㄹ 테니까 — since I expect, you should",
        explanation:
          "The same 터 plus 니까. The first clause is your prediction or your own intention; the second tells the listener what follows from it. This is the natural way to offer to handle something.",
        examples: [
          { kr: "제가 준비할 테니까 걱정하지 마세요.", romanization: "je-ga junbihal tenikka geokjeonghaji maseyo.", en: "I'll take care of the preparations, so don't worry." },
          { kr: "길이 막힐 테니까 일찍 출발하세요.", romanization: "gil-i makhil tenikka iljjik chulbalhaseyo.", en: "The roads will be jammed, so set off early." },
        ],
      },
      {
        heading: "~(으)ㄹ 걸(요) and ~(으)ㄹ 걸 그랬다",
        explanation:
          "(으)ㄹ 걸요 is a soft guess: probably, I'd say. But past 았/었을 걸 그랬다 is entirely different — it is regret about a road not taken.",
        examples: [
          { kr: "지금은 문을 닫았을 걸요.", romanization: "jigeum-eun mun-eul dadasseul geolyo.", en: "They're probably closed by now." },
          { kr: "그때 말할 걸 그랬어요.", romanization: "geuttae malhal geol geuraesseoyo.", en: "I should have said something back then." },
          { kr: "우산을 가져올 걸 그랬어요.", romanization: "usan-eul gajyeool geol geuraesseoyo.", en: "I should have brought an umbrella." },
        ],
      },
    ],
    quiz: [
      { q: "Which form offers to handle something on the listener's behalf?", opts: ["~(으)ㄹ 텐데", "~(으)ㄹ 테니까", "~(으)ㄹ 걸요", "~(으)ㄹ 걸 그랬다"], ans: 1 },
      { q: "'그때 말할 걸 그랬어요' expresses…", opts: ["a prediction", "regret about not having spoken", "a plan to speak", "an obligation to speak"], ans: 1 },
      { q: "What does the bound noun 터 contribute?", opts: ["Location", "Expectation or supposition", "Obligation", "Permission"], ans: 1 },
    ],
  },
  {
    key: "formal-connectives",
    title: "Connectives for formal prose",
    krTitle: "~(으)ㄴ/는 반면 · ~(으)ㅁ에도 불구하고 · ~(으)로 인해",
    level: "C1",
    summary: "The connectors that make writing read as an argument rather than a conversation.",
    sections: [
      {
        heading: "Contrast: ~(으)ㄴ/는 반면(에)",
        explanation:
          "반면 means the opposite side. It sets two facts against each other in a balanced way, unlike 지만 which simply turns. Written Korean strongly prefers it for structured comparison.",
        examples: [
          { kr: "수출은 늘어난 반면 수입은 줄었다.", romanization: "suchul-eun neureonan banmyeon suib-eun jureotda.", en: "Exports rose, whereas imports fell." },
          { kr: "가격은 저렴한 반면 품질이 떨어진다.", romanization: "gagyeog-eun jeoryeomhan banmyeon pumjil-i tteoreojinda.", en: "The price is low, while the quality is poor." },
        ],
      },
      {
        heading: "Concession: ~(으)ㅁ에도 불구하고",
        explanation:
          "The formal despite. It attaches to the ㅁ nominalizer, or straight to a noun with 에도 불구하고. Reserve it for writing; in speech it sounds like a press release.",
        examples: [
          { kr: "노력했음에도 불구하고 실패했다.", romanization: "noryeokhaesseum-edo bulguhago silpaehaetda.", en: "Despite having made an effort, it failed." },
          { kr: "악천후에도 불구하고 행사가 진행되었다.", romanization: "akcheonhu-edo bulguhago haengsa-ga jinhaengdoeeotda.", en: "The event went ahead despite the bad weather." },
        ],
      },
      {
        heading: "Cause: ~(으)로 인해 and ~에 따라",
        explanation:
          "(으)로 인해 is the formal owing to, used where speech would use 때문에. 에 따라 means in accordance with or depending on, and marks a variable the outcome tracks.",
        examples: [
          { kr: "폭우로 인해 열차가 지연되었다.", romanization: "pogu-ro inhae yeolcha-ga jiyeondoeeotda.", en: "Trains were delayed owing to heavy rain." },
          { kr: "지역에 따라 결과가 다르다.", romanization: "jiyeog-e ttara gyeolgwa-ga dareuda.", en: "Results differ depending on the region." },
          { kr: "규정에 따라 처리하겠습니다.", romanization: "gyujeong-e ttara cheorihagesseumnida.", en: "We will handle it in accordance with the rules." },
        ],
      },
    ],
    quiz: [
      { q: "Which connective sets two facts against each other in balanced contrast?", opts: ["~지만", "~(으)ㄴ/는 반면", "~아/어서", "~고"], ans: 1 },
      { q: "'~(으)ㅁ에도 불구하고' means…", opts: ["because of", "despite", "as soon as", "in order to"], ans: 1 },
      { q: "Which is the formal written equivalent of 때문에?", opts: ["~에 따라", "~(으)로 인해", "~는 바람에", "~덕분에"], ans: 1 },
    ],
  },
  {
    key: "regret-necessity",
    title: "Regret, hindsight and no choice",
    krTitle: "~았/었어야 했다 · ~(으)ㄹ 수밖에 없다",
    level: "C1",
    summary: "Looking back at what should have happened, and forward at what cannot be avoided.",
    sections: [
      {
        heading: "~았/었어야 했다 — should have",
        explanation:
          "Put the verb in the past, add 어야, then 했다 or 하는데. It states an unmet obligation. The 했는데 variant softens it into a lingering regret rather than a verdict.",
        examples: [
          { kr: "더 일찍 출발했어야 했어요.", romanization: "deo iljjik chulbalhaesseoya haesseoyo.", en: "I should have set off earlier." },
          { kr: "그때 말했어야 했는데.", romanization: "geuttae malhaesseoya haenneunde.", en: "I really should have said something then…" },
        ],
      },
      {
        heading: "~(으)ㄹ 수밖에 없다 — no choice but",
        explanation:
          "밖에 means outside of, and it always demands a negative verb. Literally there is nothing outside of doing it, so: I have no option. It can also describe an inevitable outcome rather than a decision.",
        examples: [
          { kr: "이런 상황에서는 포기할 수밖에 없어요.", romanization: "ireon sanghwang-eseoneun pogihal subakk-e eopseoyo.", en: "In this situation there's no choice but to give up." },
          { kr: "가격이 오를 수밖에 없다.", romanization: "gagyeog-i oreul subakk-e eopda.", en: "Prices are bound to rise." },
        ],
      },
      {
        heading: "~(으)ㄹ 뻔했다 and ~고 말았다",
        explanation:
          "(으)ㄹ 뻔했다 is a near miss: it almost happened but did not. 고 말았다 is the opposite — it ended up happening, usually to the speaker's dismay.",
        examples: [
          { kr: "넘어질 뻔했어요.", romanization: "neomeojil ppeonhaesseoyo.", en: "I almost fell over." },
          { kr: "결국 다 잊어버리고 말았어요.", romanization: "gyeolguk da ijeobeorigo marasseoyo.", en: "In the end I went and forgot it all." },
        ],
      },
    ],
    quiz: [
      { q: "What must always follow 밖에?", opts: ["A positive verb", "A negative verb", "A noun", "A question"], ans: 1 },
      { q: "'넘어질 뻔했어요' means…", opts: ["I fell over", "I almost fell over", "I will fall over", "I made someone fall"], ans: 1 },
      { q: "Which ending expresses that something regrettably ended up happening?", opts: ["~(으)ㄹ 뻔했다", "~고 말았다", "~(으)ㄹ 수밖에 없다", "~았/었어야 했다"], ans: 1 },
    ],
  },
  {
    key: "dependent-nouns",
    title: "Bound nouns that shape a clause",
    krTitle: "~는 김에 · ~는 통에 · ~(으)ㄴ 나머지",
    level: "C1",
    summary: "Small nouns with no independent meaning that completely change what a clause does.",
    sections: [
      {
        heading: "~는 김에 — while you're at it",
        explanation:
          "You are already doing one thing, so you take the opportunity to do another. The two actions must genuinely overlap; you cannot use it for unrelated errands.",
        examples: [
          { kr: "나가는 김에 우유 좀 사다 주세요.", romanization: "naganeun gim-e uyu jom sada juseyo.", en: "While you're going out, could you pick up some milk?" },
          { kr: "청소하는 김에 창문도 닦았어요.", romanization: "cheongsohaneun gim-e changmun-do dakkasseoyo.", en: "Since I was cleaning anyway, I wiped the windows too." },
        ],
      },
      {
        heading: "~는 통에 — in all the commotion",
        explanation:
          "Close to 바람에 but noisier: the cause is chaotic or disruptive, and the result is always negative. Common with crowds, noise and confusion.",
        examples: [
          { kr: "아이들이 떠드는 통에 잠을 못 잤어요.", romanization: "aideul-i tteodeuneun tong-e jam-eul mot jasseoyo.", en: "With the kids making such a racket, I couldn't sleep." },
          { kr: "정신없는 통에 가방을 놓고 왔어요.", romanization: "jeongsineomneun tong-e gabang-eul noko wasseoyo.", en: "In all the chaos I left my bag behind." },
        ],
      },
      {
        heading: "~(으)ㄴ 나머지 and ~는 차에",
        explanation:
          "나머지 means the remainder: an extreme emotion or state spills over into an unintended act. 는 차에 (or 던 차에) marks a moment that was already at hand when something else happened.",
        examples: [
          { kr: "너무 놀란 나머지 소리를 질렀어요.", romanization: "neomu nollan nameoji sori-reul jilleosseoyo.", en: "I was so startled that I screamed." },
          { kr: "막 나가려던 차에 전화가 왔어요.", romanization: "mak nagaryeodeon cha-e jeonhwa-ga wasseoyo.", en: "Just as I was about to leave, the phone rang." },
        ],
      },
    ],
    quiz: [
      { q: "'나가는 김에 우유 좀 사다 주세요' relies on the fact that the listener…", opts: ["is already going out", "wants milk", "is at home", "has no time"], ans: 0 },
      { q: "What kind of cause does ~는 통에 describe?", opts: ["A calm, planned one", "A chaotic or disruptive one", "A positive one", "A hypothetical one"], ans: 1 },
      { q: "'너무 놀란 나머지 소리를 질렀어요' means the scream was…", opts: ["planned", "the overflow of an extreme reaction", "quiet", "someone else's"], ans: 1 },
    ],
  },
  {
    key: "hedged-assertions",
    title: "Framing a claim carefully",
    krTitle: "~(으)ㄴ 셈이다 · ~는 것이다 · ~(으)ㄴ 듯하다",
    level: "C1",
    summary: "Advanced Korean rarely asserts flatly. These patterns restate, qualify and estimate.",
    sections: [
      {
        heading: "~는 것이다 — the point being that",
        explanation:
          "In writing and formal speech, 는 것이다 restates a point emphatically or draws out its significance. It signals to the reader that this sentence is the conclusion, not just another fact.",
        examples: [
          { kr: "결국 준비가 부족했던 것이다.", romanization: "gyeolguk junbi-ga bujokhaetdeon geos-ida.", en: "In the end, the point is that preparation was lacking." },
          { kr: "그만큼 상황이 심각하다는 것이다.", romanization: "geumankeum sanghwang-i simgakhadaneun geos-ida.", en: "Which is to say the situation is that serious." },
        ],
      },
      {
        heading: "~(으)ㄴ/는 듯하다 and ~(으)ㄴ/는 것 같다",
        explanation:
          "것 같다 is the everyday it seems. 듯하다 is its written cousin and sounds more measured. 는 듯이 as an adverb means as though, describing manner rather than probability.",
        examples: [
          { kr: "비가 그친 듯하다.", romanization: "bi-ga geuchin deuthada.", en: "The rain appears to have stopped." },
          { kr: "아무 일도 없었다는 듯이 웃었다.", romanization: "amu ildo eopseotdaneun deusi useotda.", en: "He smiled as though nothing had happened." },
          { kr: "조금 늦을 것 같아요.", romanization: "jogeum neujeul geot gatayo.", en: "I think I'll be a little late." },
        ],
      },
      {
        heading: "Academic hedges",
        explanation:
          "Research and journalism use a fixed set: ~(으)ㄹ 것으로 보인다 (appears likely), ~(으)ㄴ 것으로 나타났다 (was found to be), ~(으)ㄴ 것으로 알려졌다 (is known to be). Learning these three unlocks most of the newspaper.",
        examples: [
          { kr: "내년에도 성장세가 이어질 것으로 보인다.", romanization: "naenyeon-edo seongjangse-ga ieojil geoseuro boinda.", en: "Growth appears likely to continue next year as well." },
          { kr: "조사 결과 만족도가 높은 것으로 나타났다.", romanization: "josa gyeolgwa manjokdo-ga nopeun geoseuro natanatda.", en: "The survey found satisfaction to be high." },
        ],
      },
    ],
    quiz: [
      { q: "Which pattern signals 'the point being that' in formal writing?", opts: ["~는 것 같다", "~는 것이다", "~는 듯이", "~는 김에"], ans: 1 },
      { q: "Which is the written, more measured version of ~것 같다?", opts: ["~듯하다", "~셈이다", "~법이다", "~마련이다"], ans: 0 },
      { q: "'~(으)ㄴ 것으로 나타났다' is used to report…", opts: ["a personal feeling", "a research or survey finding", "a command", "a wish"], ans: 1 },
    ],
  },
  {
    key: "emphasis-particles",
    title: "Emphatic particles: 조차, 마저, 커녕, 이야말로",
    krTitle: "조차 · 마저 · 커녕 · 이야말로",
    level: "C1",
    summary: "Particles that do not change who does what — only how strongly the speaker feels about it.",
    sections: [
      {
        heading: "조차 and 마저 — even this too",
        explanation:
          "Both mean even, attached to the least expected item, and both normally sit in negative or unwelcome sentences. 조차 stresses that the minimum was not met; 마저 stresses that the last remaining thing has also gone.",
        examples: [
          { kr: "이름조차 기억나지 않아요.", romanization: "ireumjocha gieoknaji anayo.", en: "I can't even remember the name." },
          { kr: "친구마저 떠났어요.", romanization: "chingumajeo tteonasseoyo.", en: "Even my friend left me. (the last one)" },
          { kr: "물조차 없었다.", romanization: "muljocha eopseotda.", en: "There wasn't even water." },
        ],
      },
      {
        heading: "커녕 — far from it",
        explanation:
          "은/는커녕 dismisses the first item as out of the question and then denies something far more modest as well. The second half almost always carries 도 and a negative.",
        examples: [
          { kr: "밥은커녕 물도 못 마셨어요.", romanization: "bab-eun-keonyeong mul-do mot masyeosseoyo.", en: "Forget a meal — I couldn't even drink water." },
          { kr: "칭찬은커녕 혼만 났어요.", romanization: "chingchan-eun-keonyeong hon-man nasseoyo.", en: "Far from being praised, I just got told off." },
        ],
      },
      {
        heading: "(이)야말로 and (이)나마",
        explanation:
          "(이)야말로 singles something out as the very thing: this above all. (이)나마 is the opposite in spirit — it accepts something inadequate as at least better than nothing.",
        examples: [
          { kr: "건강이야말로 가장 중요한 것이다.", romanization: "geongang-iyamallo gajang jungyohan geos-ida.", en: "Health above all is what matters most." },
          { kr: "잠깐이나마 쉴 수 있어서 다행이에요.", romanization: "jamkkan-inama swil su isseoseo dahaeng-ieyo.", en: "I'm glad I could rest, even if only briefly." },
        ],
      },
    ],
    quiz: [
      { q: "Which particle stresses that even the last remaining thing is gone?", opts: ["조차", "마저", "커녕", "야말로"], ans: 1 },
      { q: "What normally follows 은/는커녕?", opts: ["A positive verb", "A milder item plus 도 and a negative", "A command", "A question"], ans: 1 },
      { q: "'건강이야말로 가장 중요하다' singles health out as…", opts: ["barely adequate", "the very thing that matters most", "unimportant", "one option among many"], ans: 1 },
    ],
  },
  {
    key: "news-register",
    title: "Reading the news",
    krTitle: "신문 문체",
    level: "C2",
    summary: "Headlines drop particles and tense; body text runs on a small set of reporting verbs.",
    sections: [
      {
        heading: "Headline compression",
        explanation:
          "Korean headlines strip particles, use the bare noun or the ㄴ/는다 form, and mark the future with a bare stem plus 할 듯 or 전망. A dash or comma often stands in for the topic particle.",
        examples: [
          { kr: "정부, 내년 예산 확대", romanization: "jeongbu, naenyeon yesan hwakdae", en: "Government to expand next year's budget" },
          { kr: "물가 상승세 둔화", romanization: "mulga sangseungse dunhwa", en: "Inflation slowing" },
          { kr: "내일 전국 비… 기온 뚝", romanization: "naeil jeonguk bi… gion ttuk", en: "Rain nationwide tomorrow; temperatures to plunge" },
        ],
      },
      {
        heading: "The reporting verbs",
        explanation:
          "Body text cycles through a small set: 밝혔다 (stated), 전했다 (reported), 덧붙였다 (added), 지적했다 (pointed out), 강조했다 (emphasised). Learning them makes any article far easier to skim.",
        examples: [
          { kr: "관계자는 이렇게 밝혔다.", romanization: "gwangyeja-neun ireoke balhyeotda.", en: "An official stated as follows." },
          { kr: "전문가들은 신중해야 한다고 지적했다.", romanization: "jeonmungadeul-eun sinjunghaeya handago jijeokhaetda.", en: "Experts pointed out that caution is needed." },
        ],
      },
      {
        heading: "Attribution and forecast frames",
        explanation:
          "Three frames carry most of the hedging: ~(으)ㄴ 것으로 알려졌다 (it is understood that), ~(으)ㄹ 전망이다 (is forecast to), and ~(으)ㄴ 데 따르면 or ~에 따르면 (according to).",
        examples: [
          { kr: "협상은 다음 주 재개될 전망이다.", romanization: "hyeopsang-eun daeum ju jaegaedoel jeonmang-ida.", en: "Talks are expected to resume next week." },
          { kr: "경찰에 따르면 부상자는 없다.", romanization: "gyeongchal-e ttareumyeon busangja-neun eopda.", en: "According to police, there are no injuries." },
          { kr: "이미 합의한 것으로 알려졌다.", romanization: "imi habuihan geoseuro allyeojyeotda.", en: "It is understood that an agreement has already been reached." },
        ],
      },
    ],
    quiz: [
      { q: "What typically replaces the topic particle in a Korean headline?", opts: ["A question mark", "A comma or dash", "The word 은", "Nothing is omitted"], ans: 1 },
      { q: "'~(으)ㄹ 전망이다' marks…", opts: ["a completed event", "a forecast", "a quotation", "a command"], ans: 1 },
      { q: "Which verb means 'pointed out'?", opts: ["밝혔다", "전했다", "지적했다", "덧붙였다"], ans: 2 },
    ],
  },
  {
    key: "academic-register",
    title: "Academic and analytical writing",
    krTitle: "학술 문체",
    level: "C2",
    summary: "Nominal density, impersonal framing, and the connectors that hold an argument together.",
    sections: [
      {
        heading: "Nouns instead of verbs",
        explanation:
          "Academic Korean compresses clauses into noun phrases using (으)ㅁ and 기, then links them with Sino-Korean verbs like 이루어지다, 제시하다, 규명하다. Sentences get longer but each carries more.",
        examples: [
          { kr: "본 연구는 그 원인을 규명하고자 한다.", romanization: "bon yeongu-neun geu wonin-eul gyumyeonghagoja handa.", en: "This study seeks to identify the cause." },
          { kr: "분석은 세 단계로 이루어진다.", romanization: "bunseog-eun se dangye-ro irueojinda.", en: "The analysis is carried out in three stages." },
          { kr: "이러한 결과는 다음을 시사한다.", romanization: "ireohan gyeolgwa-neun daeum-eul sisahanda.", en: "These results suggest the following." },
        ],
      },
      {
        heading: "Impersonal framing",
        explanation:
          "The author is 본고, 본 연구 or 필자 rather than 나. Claims are set at a distance with ~(으)ㄹ 수 있다, ~(으)ㄴ 것으로 판단된다 and ~다고 볼 수 있다.",
        examples: [
          { kr: "이는 유의미한 차이라고 볼 수 있다.", romanization: "i-neun yuuimihan chairago bol su itda.", en: "This can be regarded as a meaningful difference." },
          { kr: "추가 연구가 필요한 것으로 판단된다.", romanization: "chuga yeongu-ga piryohan geoseuro pandandoenda.", en: "Further research is judged to be necessary." },
        ],
      },
      {
        heading: "Argument connectors",
        explanation:
          "따라서 (therefore), 그러므로 (hence), 즉 (that is), 한편 (meanwhile), 다만 (that said), 아울러 (in addition), 및 (and, between nouns only). These replace their conversational equivalents entirely.",
        examples: [
          { kr: "따라서 가설은 기각된다.", romanization: "ttaraseo gaseol-eun gigakdoenda.", en: "The hypothesis is therefore rejected." },
          { kr: "즉, 두 변수는 무관하다.", romanization: "jeuk, du byeonsu-neun mugwanhada.", en: "That is, the two variables are unrelated." },
          { kr: "이론 및 실증 분석", romanization: "iron mit siljeung bunseok", en: "theoretical and empirical analysis" },
        ],
      },
    ],
    quiz: [
      { q: "How does an academic author usually refer to their own study?", opts: ["제 연구", "본 연구", "우리 연구", "내 연구"], ans: 1 },
      { q: "및 can join…", opts: ["two clauses", "two nouns only", "any two words", "two questions"], ans: 1 },
      { q: "Which connector means 'that is to say'?", opts: ["따라서", "한편", "즉", "다만"], ans: 2 },
    ],
  },
  {
    key: "speech-levels-full",
    title: "The full range of speech levels",
    krTitle: "말단계 · 화계",
    level: "C2",
    summary: "Beyond 반말 and 존댓말: six traditional levels, and where you still meet each one.",
    sections: [
      {
        heading: "The six levels",
        explanation:
          "하십시오체 (highest formal), 해요체 (polite informal), 하오체 and 하게체 (older middle levels), 해체 and 해라체 (casual and plain). Only 하십시오체, 해요체, 해체 and 해라체 are fully alive today.",
        examples: [
          { kr: "어서 오십시오.", romanization: "eoseo osipsio.", en: "Please come in. (하십시오체)" },
          { kr: "어서 오세요.", romanization: "eoseo oseyo.", en: "Come on in. (해요체)" },
          { kr: "어서 오게.", romanization: "eoseo oge.", en: "Come in. (하게체 — an elder to a younger adult)" },
          { kr: "어서 와.", romanization: "eoseo wa.", en: "Come in. (해체)" },
        ],
      },
      {
        heading: "Where the old levels survive",
        explanation:
          "하오체 lingers in period dramas, public signs (출입을 금하오) and translated literature. 하게체 belongs to professors addressing students and older men addressing younger adult men. Reading them is a comprehension skill more than a production one.",
        examples: [
          { kr: "그대는 누구시오?", romanization: "geudae-neun nugusio?", en: "Who might you be? (하오체, archaic)" },
          { kr: "이보게, 잠깐 앉게.", romanization: "ibogae, jamkkan angge.", en: "Come now, sit a moment. (하게체)" },
        ],
      },
      {
        heading: "Switching mid-conversation",
        explanation:
          "Koreans move between levels within one conversation to signal warmth, distance, irritation or a shift into private register. An abrupt drop into 반말 with a stranger is an act of aggression; a shift up into 하십시오체 with a friend reads as sarcasm or sudden formality.",
        examples: [
          { kr: "말 놓으셔도 됩니다.", romanization: "mal noeusyeodo doemnida.", en: "Feel free to speak casually with me." },
          { kr: "우리 말 놓을까요?", romanization: "uri mal noeulkkayo?", en: "Shall we drop the formalities?" },
        ],
      },
    ],
    quiz: [
      { q: "Which speech level survives mainly in period dramas and old public signs?", opts: ["해요체", "하오체", "해라체", "하십시오체"], ans: 1 },
      { q: "'말 놓으셔도 됩니다' invites the listener to…", opts: ["speak more formally", "speak casually", "stop talking", "speak louder"], ans: 1 },
      { q: "Dropping abruptly into 반말 with a stranger reads as…", opts: ["friendly", "aggressive", "formal", "neutral"], ans: 1 },
    ],
  },
  {
    key: "honorific-system",
    title: "The full honorific system",
    krTitle: "높임법 · 겸양어",
    level: "C2",
    summary: "Three axes — subject, object and listener — plus a vocabulary of humble and elevated words.",
    sections: [
      {
        heading: "Three separate honorifics",
        explanation:
          "주체 높임 elevates the sentence subject (시, 께서, 님). 객체 높임 elevates the object or recipient (께, 드리다, 뵙다, 여쭙다). 상대 높임 is the speech level aimed at the listener. All three can operate in one sentence independently.",
        examples: [
          { kr: "할아버지께서 진지를 드십니다.", romanization: "harabeojikkeseo jinji-reul deusimnida.", en: "Grandfather is eating. (subject elevated, formal listener)" },
          { kr: "선생님께 여쭤봤어요.", romanization: "seonsaengnimkke yeojjwobwasseoyo.", en: "I asked the teacher. (object elevated)" },
          { kr: "제가 도와 드릴게요.", romanization: "je-ga dowa deurilgeyo.", en: "I'll help you. (humble 드리다)" },
        ],
      },
      {
        heading: "Suppletive vocabulary",
        explanation:
          "Some words swap entirely rather than take 시: 먹다 becomes 드시다 or 잡수시다, 자다 becomes 주무시다, 있다 becomes 계시다, 말하다 becomes 말씀하시다, 죽다 becomes 돌아가시다. Nouns change too: 밥 becomes 진지, 나이 becomes 연세, 집 becomes 댁.",
        examples: [
          { kr: "어머니께서 주무세요.", romanization: "eomeonikkeseo jumuseyo.", en: "Mother is sleeping." },
          { kr: "연세가 어떻게 되세요?", romanization: "yeonse-ga eotteoke doeseyo?", en: "May I ask your age?" },
          { kr: "댁이 어디세요?", romanization: "daeg-i eodiseyo?", en: "Where is your home?" },
        ],
      },
      {
        heading: "압존법 and its decline",
        explanation:
          "Traditionally you lowered a middle-ranking person when speaking to someone senior to them — telling your grandfather that 아버지가 왔습니다, not 오셨습니다. Modern usage, and the National Institute of Korean Language, now accepts the honorific in most family and workplace settings. Learners should recognise 압존법 but need not apply it.",
        examples: [
          { kr: "할아버지, 아버지가 왔습니다.", romanization: "harabeoji, abeoji-ga watseumnida.", en: "Grandfather, Father has arrived. (traditional 압존법)" },
          { kr: "할아버지, 아버지가 오셨습니다.", romanization: "harabeoji, abeoji-ga osyeotseumnida.", en: "Grandfather, Father has arrived. (accepted modern usage)" },
        ],
      },
      {
        heading: "The over-honorific error",
        explanation:
          "Service Korean has spread 시 onto inanimate objects: 커피 나오셨습니다. This 사물 존대 is widely criticised as incorrect, though you will hear it constantly in cafes and shops. Recognise it; do not copy it.",
        examples: [
          { kr: "주문하신 커피 나왔습니다.", romanization: "jumunhasin keopi nawatseumnida.", en: "Your coffee is ready. (correct)" },
          { kr: "커피 나오셨습니다.", romanization: "keopi naosyeotseumnida.", en: "Your coffee is ready. (common but incorrect — the coffee is being honoured)" },
        ],
      },
    ],
    quiz: [
      { q: "Which verb is the humble form used when you give something to a superior?", opts: ["주다", "드리다", "받다", "계시다"], ans: 1 },
      { q: "What is the honorific noun for 나이?", opts: ["진지", "연세", "댁", "말씀"], ans: 1 },
      { q: "Why is '커피 나오셨습니다' criticised?", opts: ["It is too casual", "It applies an honorific to an object", "It uses the wrong tense", "It is regional"], ans: 1 },
    ],
  },
  {
    key: "idiomatic-expressions",
    title: "Body-part and everyday idioms",
    krTitle: "관용 표현",
    level: "C2",
    summary: "Fixed phrases whose meaning you cannot assemble from their parts.",
    sections: [
      {
        heading: "Eyes, ears, hands and feet",
        explanation:
          "Korean builds a huge share of its idioms from body parts. These are frozen — you cannot swap the noun or the verb and keep the meaning.",
        examples: [
          { kr: "눈이 높다", romanization: "nun-i nopda", en: "to have high standards (literally: eyes are high)" },
          { kr: "발이 넓다", romanization: "bal-i neopda", en: "to know a lot of people (literally: feet are wide)" },
          { kr: "손이 크다", romanization: "son-i keuda", en: "to be generous, to cook in large quantities" },
          { kr: "귀가 얇다", romanization: "gwi-ga yapda", en: "to be easily persuaded (literally: ears are thin)" },
        ],
      },
      {
        heading: "Feelings and social life",
        explanation:
          "Another cluster describes emotional states and relationships. 미역국을 먹다 is a famous one: seaweed soup is slippery, so eating it means you slipped — that is, failed an exam.",
        examples: [
          { kr: "시험에서 미역국을 먹었어요.", romanization: "siheom-eseo miyeokgug-eul meogeosseoyo.", en: "I failed the exam." },
          { kr: "바가지를 썼어요.", romanization: "bagaji-reul sseosseoyo.", en: "I got ripped off." },
          { kr: "국수를 언제 먹어요?", romanization: "guksu-reul eonje meogeoyo?", en: "When are you getting married? (noodles are served at weddings)" },
        ],
      },
      {
        heading: "Common verb collocations",
        explanation:
          "Some pairings simply have to be memorised as units because the verb choice is unpredictable from English. Getting these right is one of the clearest markers of advanced fluency.",
        examples: [
          { kr: "약속을 지키다", romanization: "yaksog-eul jikida", en: "to keep a promise (literally: guard)" },
          { kr: "감기에 걸리다", romanization: "gamgi-e geollida", en: "to catch a cold (literally: to be hung on a cold)" },
          { kr: "신경을 쓰다", romanization: "singyeong-eul sseuda", en: "to care about, to worry over" },
        ],
      },
    ],
    quiz: [
      { q: "What does 발이 넓다 mean?", opts: ["To have large feet", "To know a lot of people", "To walk quickly", "To be tall"], ans: 1 },
      { q: "'미역국을 먹었어요' in a school context means…", opts: ["I had a birthday", "I failed the exam", "I was ill", "I got married"], ans: 1 },
      { q: "Which verb goes with 감기?", opts: ["하다", "걸리다", "받다", "타다"], ans: 1 },
    ],
  },
  {
    key: "four-character-idioms",
    title: "사자성어 — four-character idioms",
    krTitle: "사자성어",
    level: "C2",
    summary: "Compressed Sino-Korean proverbs used in speeches, editorials and everyday advice.",
    sections: [
      {
        heading: "How they work",
        explanation:
          "Each is four Chinese characters carrying a whole story or moral. They function as nouns and usually take 이다 or slot in as a comment on a situation. Educated speakers deploy them constantly in writing.",
        examples: [
          { kr: "고진감래 (苦盡甘來)", romanization: "gojingamnae", en: "Hardship ends, sweetness comes — no pain, no gain." },
          { kr: "유비무환 (有備無患)", romanization: "yubimuhwan", en: "Be prepared and there is no calamity." },
          { kr: "새옹지마 (塞翁之馬)", romanization: "saeongjima", en: "A blessing in disguise; fortune is unpredictable." },
        ],
      },
      {
        heading: "In real sentences",
        explanation:
          "They most often appear as the predicate of a summary sentence, or introduced by 말 그대로 or 그야말로 for emphasis.",
        examples: [
          { kr: "인생은 새옹지마라고 하잖아요.", romanization: "insaeng-eun saeongjimarago hajanayo.", en: "They do say life is unpredictable, don't they?" },
          { kr: "그야말로 고진감래였다.", romanization: "geuyamallo gojingamnaeyeotda.", en: "It was hardship followed by reward, in the truest sense." },
        ],
      },
      {
        heading: "A working set",
        explanation:
          "A dozen or so cover most real usage. Learn them with the situation attached rather than as vocabulary lists — the situation is what triggers recall.",
        examples: [
          { kr: "일석이조 (一石二鳥)", romanization: "ilseogijo", en: "Two birds with one stone." },
          { kr: "동문서답 (東問西答)", romanization: "dongmunseodap", en: "Answering something entirely unrelated to the question." },
          { kr: "作心三日 · 작심삼일", romanization: "jaksimsamil", en: "A resolve that lasts three days — a broken New Year's resolution." },
        ],
      },
    ],
    quiz: [
      { q: "How many characters does a 사자성어 contain?", opts: ["Two", "Three", "Four", "Five"], ans: 2 },
      { q: "새옹지마 means…", opts: ["Hard work always pays", "Fortune is unpredictable", "Two birds with one stone", "Be prepared"], ans: 1 },
      { q: "작심삼일 describes…", opts: ["a three-day holiday", "a resolution that quickly collapses", "a three-part plan", "a long journey"], ans: 1 },
    ],
  },
  {
    key: "cause-nuance",
    title: "Distinguishing the cause markers",
    krTitle: "~에 따라 · ~에 의해 · ~(으)로 인해",
    level: "C2",
    summary: "Three formal markers English collapses into 'by' or 'due to', but Korean keeps apart.",
    sections: [
      {
        heading: "~에 의해 — the agent",
        explanation:
          "Marks the doer in a passive sentence: who or what performed the action. It is the closest thing Korean has to the English by in a passive construction, and it belongs firmly to written register.",
        examples: [
          { kr: "이 법은 국회에 의해 통과되었다.", romanization: "i beob-eun gukhoe-e uihae tonggwadoeeotda.", en: "This law was passed by the National Assembly." },
          { kr: "그 이론은 아인슈타인에 의해 제시되었다.", romanization: "geu iron-eun ainsyutain-e uihae jesidoeeotda.", en: "That theory was put forward by Einstein." },
        ],
      },
      {
        heading: "~(으)로 인해 — the cause",
        explanation:
          "Marks a non-agentive cause: an event or condition that brought about a result. Swapping it for 에 의해 makes it sound as though the weather deliberately acted.",
        examples: [
          { kr: "화재로 인해 건물이 손상되었다.", romanization: "hwajae-ro inhae geonmul-i sonsangdoeeotda.", en: "The building was damaged as a result of the fire." },
          { kr: "인구 감소로 인해 학교가 문을 닫았다.", romanization: "ingu gamso-ro inhae hakgyo-ga mun-eul dadatda.", en: "The school closed owing to population decline." },
        ],
      },
      {
        heading: "~에 따라 — the variable",
        explanation:
          "Marks something the outcome tracks or conforms to: a rule, a standard, or a factor the result varies with. It is correlation and conformity, not causation.",
        examples: [
          { kr: "상황에 따라 달라질 수 있습니다.", romanization: "sanghwang-e ttara dallajil su itseumnida.", en: "It may vary depending on the situation." },
          { kr: "법에 따라 처리되었다.", romanization: "beob-e ttara cheoridoeeotda.", en: "It was handled in accordance with the law." },
          { kr: "기술 발전에 따라 산업이 변했다.", romanization: "gisul baljeon-e ttara saneob-i byeonhaetda.", en: "Industry changed in step with technological development." },
        ],
      },
    ],
    quiz: [
      { q: "Which marker introduces the agent of a formal passive?", opts: ["~에 따라", "~에 의해", "~(으)로 인해", "~때문에"], ans: 1 },
      { q: "'상황에 따라 달라져요' expresses…", opts: ["causation", "variation depending on a factor", "an agent", "a purpose"], ans: 1 },
      { q: "Why is '태풍에 의해 피해가 발생했다' less natural than '태풍으로 인해'?", opts: ["에 의해 is informal", "에 의해 implies a deliberate agent", "태풍 is a native word", "It needs past tense"], ans: 1 },
    ],
  },
  {
    key: "causative-nuance",
    title: "Fine distinctions in causatives",
    krTitle: "~게 하다 · ~시키다 · 사동 접미사",
    level: "C2",
    summary: "Three ways to make someone do something, differing in directness and in who does the work.",
    sections: [
      {
        heading: "Suffix causatives are direct",
        explanation:
          "The 이/히/리/기/우/구/추 forms usually describe the causer physically doing it: 먹이다 is spoon-feeding, 입히다 is dressing someone yourself. The causee is often not acting independently at all.",
        examples: [
          { kr: "아이에게 옷을 입혔어요.", romanization: "ai-ege os-eul ipyeosseoyo.", en: "I dressed the child. (I did it)" },
          { kr: "아이에게 옷을 입게 했어요.", romanization: "ai-ege os-eul ipge haesseoyo.", en: "I made the child get dressed. (they did it)" },
        ],
      },
      {
        heading: "~게 하다 is indirect",
        explanation:
          "The causee performs the action; you brought it about by instruction or permission. Depending on context it can be make, let or have someone do something.",
        examples: [
          { kr: "학생들에게 발표하게 했어요.", romanization: "haksaengdeul-ege balpyohage haesseoyo.", en: "I had the students give presentations." },
          { kr: "아이를 놀게 두세요.", romanization: "ai-reul nolge duseyo.", en: "Let the child play." },
        ],
      },
      {
        heading: "~시키다 — Sino-Korean nouns only",
        explanation:
          "시키다 attaches to a Sino-Korean action noun, making the 하다 verb causative: 공부하다 becomes 공부시키다. It also means to order food. Attaching it to a native verb stem is ungrammatical.",
        examples: [
          { kr: "아이에게 영어를 공부시켜요.", romanization: "ai-ege yeongeo-reul gongbusikyeoyo.", en: "I make my child study English." },
          { kr: "짜장면을 시켰어요.", romanization: "jjajangmyeon-eul sikyeosseoyo.", en: "I ordered jjajangmyeon." },
          { kr: "회의를 30분 연기시켰다.", romanization: "hoeui-reul samsipbun yeongisikyeotda.", en: "The meeting was pushed back thirty minutes." },
        ],
      },
    ],
    quiz: [
      { q: "'아이에게 옷을 입혔어요' implies…", opts: ["the child dressed themselves", "the speaker dressed the child", "the child refused", "nobody got dressed"], ans: 1 },
      { q: "What can 시키다 attach to?", opts: ["Any verb stem", "A Sino-Korean action noun", "Descriptive verbs", "Nouns of place"], ans: 1 },
      { q: "Which causative can also mean 'let'?", opts: ["~게 하다", "~시키다", "The 이/히/리/기 suffixes", "None of them"], ans: 0 },
    ],
  },
  {
    key: "literary-forms",
    title: "Literary and archaic forms",
    krTitle: "문학적 · 고어체 표현",
    level: "C2",
    summary: "Endings you will read in poetry, scripture and historical drama but should not produce in conversation.",
    sections: [
      {
        heading: "Elevated declaratives",
        explanation:
          "~노라 (a solemn first-person declaration), ~도다 and ~로다 (exclamatory), ~리라 (a vow or prophecy about the future). These belong to poetry, anthems and translated classics.",
        examples: [
          { kr: "내가 여기 서 있노라.", romanization: "naega yeogi seo innora.", en: "Here I stand. (solemn declaration)" },
          { kr: "아름답도다.", romanization: "areumdapdoda.", en: "How beautiful it is!" },
          { kr: "언젠가 다시 오리라.", romanization: "eonjenga dasi orira.", en: "One day I shall return." },
        ],
      },
      {
        heading: "Archaic connectors",
        explanation:
          "~느니 (rather than), ~거늘 (whereas, yet), ~건대 (as for, if I may say). You meet them in proverbs and formal address more than anywhere else.",
        examples: [
          { kr: "굶느니 차라리 먹겠다.", romanization: "gumneuni charari meokgetda.", en: "Rather than starve, I'd sooner eat." },
          { kr: "바라건대 부디 무사하기를.", romanization: "baragande budi musahagireul.", en: "It is my wish that you be safe." },
        ],
      },
      {
        heading: "Reading old spelling",
        explanation:
          "Pre-1988 texts use spellings that no longer match the standard: 읍니다 for 습니다, 어떻읍니까 for 어떻습니까, and the obsolete letter ㆍ in very old texts. Historical dramas also revive 하오체 and 하게체 wholesale.",
        examples: [
          { kr: "그리하였읍니다 → 그리하였습니다", romanization: "geurihayeosseumnida", en: "did so (old spelling → modern)" },
          { kr: "아니 되옵니다.", romanization: "ani doeomnida.", en: "It must not be so, Your Majesty. (sageuk register)" },
        ],
      },
    ],
    quiz: [
      { q: "Where would you expect to meet ~노라?", opts: ["A text message", "Poetry or a solemn declaration", "A shop sign", "A business email"], ans: 1 },
      { q: "What does ~리라 express?", opts: ["A past habit", "A vow or prophecy", "A question", "A polite request"], ans: 1 },
      { q: "읍니다 is…", opts: ["a regional dialect", "an obsolete spelling of 습니다", "an honorific form", "a typo for 입니다"], ans: 1 },
    ],
  },
  {
    key: "spoken-vs-written",
    title: "구어체 vs 문어체",
    krTitle: "구어체 · 문어체",
    level: "C2",
    summary: "The systematic differences that make writing sound like writing and speech sound like speech.",
    sections: [
      {
        heading: "Contractions and dropped particles",
        explanation:
          "Speech contracts relentlessly — 이것은 to 이건, 나는 to 난, 무엇을 to 뭘 — and drops 을/를 and 이/가 whenever context allows. Writing restores all of them.",
        examples: [
          { kr: "이건 뭐야? / 이것은 무엇입니까?", romanization: "igeon mwoya? / igeoseun mueosimnikka?", en: "What is this? (spoken / written)" },
          { kr: "밥 먹었어? / 식사를 하셨습니까?", romanization: "bap meogeosseo? / siksa-reul hasyeotseumnikka?", en: "Have you eaten? (spoken / formal)" },
        ],
      },
      {
        heading: "Different vocabulary for the same idea",
        explanation:
          "Native words dominate speech and Sino-Korean words dominate writing. 그래서 becomes 따라서, 하지만 becomes 그러나, 아주 becomes 매우, 되게 becomes 상당히.",
        examples: [
          { kr: "되게 어려워요. / 상당히 어렵다.", romanization: "doege eoryeowoyo. / sangdanghi eoryeopda.", en: "It's quite difficult. (spoken / written)" },
          { kr: "그래서 안 했어요. / 따라서 시행하지 않았다.", romanization: "geuraeseo an haesseoyo. / ttaraseo sihaenghaji anatda.", en: "So it wasn't done. (spoken / written)" },
        ],
      },
      {
        heading: "Filler, hedging and sentence length",
        explanation:
          "Speech is full of 좀, 뭐, 그냥, 약간 and trailing 는데요; writing removes them entirely and packs the content into longer, nominalised sentences. A common advanced error is writing exactly as one speaks, which reads as unserious.",
        examples: [
          { kr: "좀 그냥 애매한데요.", romanization: "jom geunyang aemaehandeyo.", en: "It's just kind of ambiguous, honestly. (spoken)" },
          { kr: "다소 모호한 측면이 있다.", romanization: "daso mohohan cheungmyeon-i itda.", en: "There is a somewhat ambiguous aspect to it. (written)" },
        ],
      },
    ],
    quiz: [
      { q: "In writing, 그래서 is typically replaced by…", opts: ["그러니까", "따라서", "그리고", "근데"], ans: 1 },
      { q: "What happens to 을/를 and 이/가 in casual speech?", opts: ["They double", "They are often dropped", "They become honorific", "They move to the end"], ans: 1 },
      { q: "Which of these belongs to written register?", opts: ["되게", "상당히", "좀", "그냥"], ans: 1 },
    ],
  },
];

// Presented in CEFR order so lesson numbering and the Next button run A1 to C2.
export const GRAMMAR_LESSONS: GrammarLesson[] = LEVEL_ORDER.flatMap((lv) =>
  RAW_LESSONS.filter((l) => l.level === lv)
);

export function lessonByKey(key: string): GrammarLesson | undefined {
  return GRAMMAR_LESSONS.find((l) => l.key === key);
}

export function lessonIndex(key: string): number {
  return GRAMMAR_LESSONS.findIndex((l) => l.key === key);
}

export function nextLesson(key: string): GrammarLesson | undefined {
  const i = lessonIndex(key);
  return i >= 0 ? GRAMMAR_LESSONS[i + 1] : undefined;
}

export const GRAMMAR_LEVELS = LEVEL_ORDER;

export function lessonsByLevel(level: CefrLevel): GrammarLesson[] {
  return GRAMMAR_LESSONS.filter((l) => l.level === level);
}

// Curated groups shown above the full level-by-level list — a suggested
// order for absolute beginners, and what to learn once the basics are down.
export type GrammarGroup = {
  key: string;
  title: string;
  titleKr: string;
  sub: string;
  lessonKeys: string[];
};

export const GRAMMAR_GROUPS: GrammarGroup[] = [
  {
    key: "start-here",
    title: "Start here",
    titleKr: "여기서 시작하세요",
    sub: "New to Korean grammar? Do these in order first.",
    lessonKeys: [
      "word-order",
      "to-be",
      "present-tense",
      "topic-vs-subject",
      "object-marker",
      "past-tense",
      "can-cannot",
      "want-to",
      "purpose-basics",
      "simple-modifiers",
      "wonder-ji",
      "simple-conditional",
    ],
  },
  {
    key: "next-steps",
    title: "Next steps",
    titleKr: "다음 단계",
    sub: "Keep going after the basics.",
    lessonKeys: ["negation", "location-particles", "politeness", "numbers-counters"],
  },
];
