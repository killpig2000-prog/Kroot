export type Question = {
  type: "Words" | "Grammar" | "Listening";
  lv: number;
  word?: string;
  audio?: string;
  ask: string;
  opts: string[];
  ans: number;
};

// The placement pool. Every attempt draws a fresh balanced test from it via
// buildTest(), so a retake is never the same paper twice.
export const QUESTIONS: Question[] = [
  // ---------- lv 1 (A1) ----------
  { type: "Words", lv: 1, word: '"안녕하세요"', ask: "What does this mean?", opts: ["Hello 👋", "Goodbye", "Thank you", "Sorry"], ans: 0 },
  { type: "Words", lv: 1, word: '"물"', ask: "Pick the right meaning!", opts: ["Fire", "Water 💧", "Food", "House"], ans: 1 },
  { type: "Words", lv: 1, word: '"감사합니다"', ask: "What does this mean?", opts: ["Excuse me", "Thank you 🙏", "Good night", "Welcome"], ans: 1 },
  { type: "Words", lv: 1, word: '"학교"', ask: "What does this mean?", opts: ["Hospital", "Market", "School 🏫", "Station"], ans: 2 },
  { type: "Words", lv: 1, word: '"친구"', ask: "What does this mean?", opts: ["Friend 🧑‍🤝‍🧑", "Family", "Teacher", "Neighbour"], ans: 0 },
  { type: "Words", lv: 1, word: '"사과"', ask: "Pick the right meaning!", opts: ["Grape", "Apple 🍎", "Peach", "Pear"], ans: 1 },
  { type: "Grammar", lv: 1, word: "저___ 미국 사람이에요.", ask: "Fill in the blank.", opts: ["는", "를", "에", "와"], ans: 0 },
  { type: "Listening", lv: 1, audio: "이름이 뭐예요?", ask: "You heard a question — what is being asked?", opts: ["Your name 🙂", "Your age", "Your address", "The time"], ans: 0 },

  // ---------- lv 2 (A2) ----------
  { type: "Grammar", lv: 2, word: "저는 학생___.", ask: "Fill in the blank.", opts: ["이에요", "예요", "있어요", "해요"], ans: 0 },
  { type: "Words", lv: 2, word: '"괜찮아요"', ask: "What does this mean?", opts: ["It's okay 😊", "It's expensive", "See you tomorrow", "I don't know"], ans: 0 },
  { type: "Words", lv: 2, word: '"배고파요"', ask: "What does this mean?", opts: ["I'm tired", "I'm hungry 🍚", "I'm busy", "I'm cold"], ans: 1 },
  { type: "Words", lv: 2, word: '"빌리다"', ask: "Closest in meaning?", opts: ["To sell", "To borrow", "To carry", "To fix"], ans: 1 },
  { type: "Grammar", lv: 2, word: "어제 영화를 봤___.", ask: "Fill in the blank (polite past).", opts: ["어요", "아요", "해요", "이에요"], ans: 0 },
  { type: "Grammar", lv: 2, word: "학교___ 가요.", ask: "Choose the right particle.", opts: ["에", "을", "도", "만"], ans: 0 },
  { type: "Words", lv: 2, word: '"일찍"', ask: "Closest in meaning?", opts: ["Early", "Late", "Slowly", "Again"], ans: 0 },
  { type: "Listening", lv: 2, audio: "이거 얼마예요?", ask: "What is the speaker asking about?", opts: ["The price 💰", "The size", "The way there", "The opening hours"], ans: 0 },

  // ---------- lv 3 (B1) ----------
  { type: "Listening", lv: 3, audio: "지금 몇 시예요?", ask: "You heard a question — what is being asked?", opts: ["The time ⏰", "The price", "The weather", "Your name"], ans: 0 },
  { type: "Grammar", lv: 3, word: "비가 와___ 우산을 가져왔어요.", ask: "Choose the right connector.", opts: ["서", "고", "면", "지만"], ans: 0 },
  { type: "Words", lv: 3, word: '"미리"', ask: "Closest in meaning?", opts: ["In advance", "By accident", "On purpose", "At last"], ans: 0 },
  { type: "Words", lv: 3, word: '"익숙하다"', ask: "Closest in meaning?", opts: ["To be familiar with", "To be strange", "To be expensive", "To be noisy"], ans: 0 },
  { type: "Words", lv: 3, word: '"포기하다"', ask: "Closest in meaning?", opts: ["To give up", "To promise", "To prepare", "To succeed"], ans: 0 },
  { type: "Grammar", lv: 3, word: "친구를 만나기 ___ 카페에 갔어요.", ask: "Fill in the blank.", opts: ["위해", "때문", "대신", "동안"], ans: 0 },
  { type: "Grammar", lv: 3, word: "한국에 가 ___ 싶어요.", ask: "Fill in the blank.", opts: ["고", "서", "면", "지만"], ans: 0 },
  { type: "Listening", lv: 3, audio: "다음 주에 시간 괜찮으세요?", ask: "What does the speaker want to know?", opts: ["Whether you're free next week 📅", "Where you live", "What you ate", "How much it costs"], ans: 0 },

  // ---------- lv 4 (B2) ----------
  { type: "Words", lv: 4, word: '"번거롭다"', ask: "Closest in meaning?", opts: ["Troublesome", "Delicious", "Peaceful", "Generous"], ans: 0 },
  { type: "Grammar", lv: 4, word: "그 일은 이미 끝났___ 걱정하지 마세요.", ask: "Fill in the blank.", opts: ["으니까", "는데도", "기 위해", "자마자"], ans: 0 },
  { type: "Words", lv: 4, word: '"꾸준히"', ask: "Closest in meaning?", opts: ["Steadily, without a break", "Suddenly", "Barely", "Roughly"], ans: 0 },
  { type: "Words", lv: 4, word: '"어차피"', ask: "Closest in meaning?", opts: ["Anyway, either way", "Perhaps", "Instead", "Almost"], ans: 0 },
  { type: "Words", lv: 4, word: '"눈치"', ask: "This word refers to…", opts: ["Reading the room, social awareness", "Physical strength", "A written notice", "Table manners"], ans: 0 },
  { type: "Grammar", lv: 4, word: "비가 올 ___ 우산을 챙기세요.", ask: "Fill in the blank.", opts: ["테니까", "는데도", "기에는", "자마자"], ans: 0 },
  { type: "Grammar", lv: 4, word: "그 사람은 성실___ 성격도 좋아요.", ask: "Fill in the blank.", opts: ["할 뿐만 아니라", "하기 위해", "하자마자", "하더라도"], ans: 0 },
  { type: "Listening", lv: 4, audio: "예약을 변경하고 싶은데요.", ask: "What does the speaker want?", opts: ["To change a reservation", "To cancel a payment", "To order more food", "To file a complaint"], ans: 0 },

  // ---------- lv 5 (C1) ----------
  { type: "Listening", lv: 5, audio: "회의가 연기됐다는 소식 들으셨어요?", ask: "What happened to the meeting?", opts: ["It was postponed", "It was cancelled", "It ended early", "It went well"], ans: 0 },
  { type: "Words", lv: 5, word: '"타당하다"', ask: "Closest in meaning?", opts: ["To be reasonable, well-founded", "To be urgent", "To be unusual", "To be temporary"], ans: 0 },
  { type: "Words", lv: 5, word: '"불가피하다"', ask: "Closest in meaning?", opts: ["To be unavoidable", "To be optional", "To be regrettable", "To be exaggerated"], ans: 0 },
  { type: "Words", lv: 5, word: '"일회성"', ask: "This word describes something that is…", opts: ["One-off, not repeated", "Long-running", "Widely shared", "Strictly confidential"], ans: 0 },
  { type: "Grammar", lv: 5, word: "결과가 어떻___ 최선을 다합시다.", ask: "Fill in the blank.", opts: ["든지", "자마자", "길래", "더니"], ans: 0 },
  { type: "Grammar", lv: 5, word: "아무리 바쁘___ 밥은 먹어야죠.", ask: "Fill in the blank.", opts: ["더라도", "자마자", "는 바람에", "길래"], ans: 0 },
  { type: "Grammar", lv: 5, word: "사고가 나는 바람에 늦었어요.", ask: "What does ~는 바람에 express here?", opts: ["An unexpected cause of a bad result", "A purpose", "A polite request", "A future plan"], ans: 0 },
  { type: "Listening", lv: 5, audio: "이번 정책은 실효성이 떨어진다는 지적이 많습니다.", ask: "What is being said about the policy?", opts: ["Many say it isn't effective", "Many say it costs too much", "It was praised widely", "It takes effect next year"], ans: 0 },

  // ---------- lv 6 (C2) ----------
  { type: "Words", lv: 6, word: '"미봉책"', ask: "This word refers to…", opts: ["A stopgap measure", "A grand strategy", "A final decision", "An old custom"], ans: 0 },
  { type: "Words", lv: 6, word: '"아전인수"', ask: "This idiom describes…", opts: ["Twisting things in your own favour", "Sharing credit fairly", "Working without rest", "Learning from a rival"], ans: 0 },
  { type: "Words", lv: 6, word: '"십시일반"', ask: "This idiom describes…", opts: ["Many people each giving a little to help one", "One person carrying all the blame", "A sudden change of heart", "A long-standing grudge"], ans: 0 },
  { type: "Words", lv: 6, word: '"괄목상대"', ask: "This idiom describes…", opts: ["Improvement striking enough to deserve a second look", "A rivalry that never ends", "A reputation built on rumour", "A plan doomed from the start"], ans: 0 },
  { type: "Words", lv: 6, word: '"설상가상"', ask: "This idiom describes…", opts: ["One misfortune piled on another", "An unexpected windfall", "A perfectly timed rescue", "A quiet, uneventful spell"], ans: 0 },
  { type: "Grammar", lv: 6, word: "그런 실수를 하다니 어처구니가 ___.", ask: "Fill in the blank.", opts: ["없다", "많다", "좋다", "크다"], ans: 0 },
  { type: "Grammar", lv: 6, word: "논의가 원점으로 ___.", ask: "Fill in the blank (back to square one).", opts: ["돌아갔다", "올라갔다", "넘어갔다", "내려갔다"], ans: 0 },
  { type: "Listening", lv: 6, audio: "그 사안은 여론의 뭇매를 맞고 결국 백지화됐습니다.", ask: "What happened to the issue?", opts: ["It was scrapped after public backlash", "It passed despite objections", "It was quietly postponed", "It was handed to a committee"], ans: 0 },
];

/** Question levels present in the pool, ascending. */
export const TEST_BANDS = [1, 2, 3, 4, 5, 6] as const;
/** How many questions each band contributes to a served test. */
export const PER_BAND = 2;
/** Length of a served test. */
export const TEST_SIZE = TEST_BANDS.length * PER_BAND;
/** The highest weighted score a served test can produce. */
export const MAX_WEIGHTED = PER_BAND * TEST_BANDS.reduce((n, lv) => n + lv, 0);

// Small deterministic PRNG so a seeded test renders identically on the server
// and the client (avoids a hydration mismatch before the quiz starts).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickSome<T>(pool: T[], n: number, rand: () => number): T[] {
  const rest = [...pool];
  const out: T[] = [];
  while (out.length < n && rest.length > 0) {
    out.push(...rest.splice(Math.floor(rand() * rest.length), 1));
  }
  return out;
}

/**
 * Draw a balanced placement test: PER_BAND questions from every level band,
 * ordered easiest first. Pass a seed for a reproducible draw.
 */
export function buildTest(seed?: number): Question[] {
  const rand = seed === undefined ? Math.random : mulberry32(seed);
  return TEST_BANDS.flatMap((lv) =>
    pickSome(
      QUESTIONS.filter((q) => q.lv === lv),
      PER_BAND,
      rand,
    ),
  );
}

export type Level = {
  code: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  min: number;
  desc: string;
};

// Thresholds are tuned to a 12-question served test (max weighted 42): a
// learner who clears every band up to N lands squarely in that band's level.
export const LEVELS: Level[] = [
  { code: "A1", min: 0, desc: "You're at the very first page — the coziest place to start! We'll begin with Hangul, greetings, and little survival phrases." },
  { code: "A2", min: 5, desc: "You know the basics! Simple everyday chats are yours. Next we'll grow longer sentences and everyday words." },
  { code: "B1", min: 11, desc: "Solid roots! You can hold everyday conversations. Now for connectors, nuance, and real-life listening." },
  { code: "B2", min: 18, desc: "Wow — you handle most situations with confidence! Time to polish natural expression and faster listening." },
  { code: "C1", min: 26, desc: "Tall branches! You speak fluently across many topics. Let's refine idioms and formal Korean." },
  { code: "C2", min: 38, desc: "A mighty tree! Near-native mastery. We'll keep you sharp with fresh media, slang, and pro-level Korean." },
];

export function levelFromWeighted(weighted: number): Level {
  let lv = LEVELS[0];
  for (const L of LEVELS) {
    if (weighted >= L.min) lv = L;
  }
  return lv;
}
