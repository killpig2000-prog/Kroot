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
  level: "A1" | "A2";
  summary: string;
  sections: GrammarSection[];
  quiz: GrammarQuiz[];
};

export const GRAMMAR_LESSONS: GrammarLesson[] = [
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
];

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

export const GRAMMAR_LEVELS = ["A1", "A2"] as const;

// Grammar's role next to the 16-day course: the overlapping lessons are the
// course's deep-dive reference; the rest are what to learn right after
// finishing the course.
export type GrammarGroup = {
  key: string;
  title: string;
  titleKr: string;
  sub: string;
  lessonKeys: string[];
};

export const GRAMMAR_GROUPS: GrammarGroup[] = [
  {
    key: "course-deep",
    title: "16-Day Course deep dives",
    titleKr: "16일 코스 심화",
    sub: "The course teaches these as quick chunks — dig into the full rules here.",
    lessonKeys: ["word-order", "to-be", "present-tense", "topic-vs-subject", "object-marker", "past-tense"],
  },
  {
    key: "next-steps",
    title: "Next steps — after the course",
    titleKr: "다음 단계",
    sub: "Finished the 16-day course? These are the natural next lessons.",
    lessonKeys: ["negation", "location-particles", "politeness", "numbers-counters"],
  },
];

// Course day → deep-dive grammar lessons, shown on /course/day/[n].
export const COURSE_DEEP_DIVES: Record<number, string[]> = {
  8: ["word-order"],
  9: ["to-be"],
  10: ["present-tense"],
  11: ["topic-vs-subject", "object-marker"],
  12: ["past-tense", "present-tense"],
};
