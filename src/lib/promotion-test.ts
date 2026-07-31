import type { CefrLevel } from "@/lib/tree";

// Promotion (grade-up) test content + rules — separate from the onboarding
// placement quiz in level-test.ts. A test covers four skills; listening and
// reading are MCQ (scored locally), writing and speaking are free responses
// graded by AI (/api/level-test/grade).

export type McqQuestion = {
  /** Korean text; listening questions are played via TTS instead of shown. */
  kr: string;
  question: string;
  options: string[];
  answer: string;
};

export type PromotionTestSpec = {
  from: CefrLevel;
  to: CefrLevel;
  listening: McqQuestion[];
  reading: { passage: string; questions: McqQuestion[] };
  writing: { prompt: string; promptKr: string };
  speaking: { prompt: string; promptKr: string };
};

// Pass rules: every skill ≥ MIN_SKILL and average ≥ MIN_AVG.
export const MIN_SKILL = 60;
export const MIN_AVG = 70;
// Failed attempt → this many hours before the next try.
export const COOLDOWN_HOURS = 48;

// Eligibility thresholds within the current grade.
export const ELIGIBILITY = {
  // Coverage is relative to how many words of this grade actually exist in
  // the app (currently small; grows automatically as content is added).
  wordCoverageRatio: 0.8, // review at least 80% of this grade's words
  minAccuracy: 0.75, // cumulative correct / (correct+incorrect) on those words
  minReadingPassages: 2, // reading passages of this grade attempted
};

export const PROMOTION_TESTS: PromotionTestSpec[] = [
  {
    from: "A1",
    to: "A2",
    listening: [
      { kr: "저는 물을 마셔요.", question: "What did you hear?", options: ["I drink water", "I eat rice", "I go home"], answer: "I drink water" },
      { kr: "내일 학교에 가요.", question: "When are they going to school?", options: ["tomorrow", "yesterday", "now"], answer: "tomorrow" },
      { kr: "커피 주세요.", question: "What are they asking for?", options: ["coffee", "water", "rice"], answer: "coffee" },
      { kr: "친구가 와요.", question: "Who is coming?", options: ["a friend", "a teacher", "mom"], answer: "a friend" },
      { kr: "비가 오면 집에 있을 거예요.", question: "What will they do if it rains?", options: ["stay home", "go out", "study Korean"], answer: "stay home" },
    ],
    reading: {
      passage: "저는 마크예요. 학생이에요. 어제 친구를 만났어요. 우리는 커피를 마시고 이야기를 했어요. 내일은 도서관에 공부하러 갈 거예요.",
      questions: [
        { kr: "", question: "What is Mark?", options: ["a student", "a teacher", "a doctor"], answer: "a student" },
        { kr: "", question: "What did Mark do yesterday?", options: ["met a friend", "went to the library", "stayed home"], answer: "met a friend" },
        { kr: "", question: "Why is Mark going to the library tomorrow?", options: ["to study", "to drink coffee", "to meet a friend"], answer: "to study" },
        { kr: "", question: "What did Mark and his friend drink?", options: ["coffee", "water", "milk"], answer: "coffee" },
        { kr: "", question: "'공부하러' uses which pattern?", options: ["-(으)러 (in order to)", "-(으)면 (if)", "-는 것 (verb→noun)"], answer: "-(으)러 (in order to)" },
      ],
    },
    writing: {
      prompt: "Introduce yourself in Korean — 3 sentences or more. Include your name, one thing you did yesterday (past tense), and one thing you will do tomorrow (future tense).",
      promptKr: "한국어로 자기소개를 3문장 이상 써 보세요. 이름, 어제 한 일(과거), 내일 할 일(미래)을 포함하세요.",
    },
    speaking: {
      prompt: "Answer out loud in Korean, 2 sentences or more: 주말에 보통 뭐 해요? (What do you usually do on weekends?)",
      promptKr: "주말에 보통 뭐 해요? — 한국어로 2문장 이상 말해 보세요.",
    },
  },
];

export function testForGrade(from: CefrLevel): PromotionTestSpec | null {
  return PROMOTION_TESTS.find((t) => t.from === from) ?? null;
}

export type SkillScores = { listening: number; reading: number; writing: number; speaking: number };

export function testVerdict(scores: SkillScores): { passed: boolean; avg: number; weakest: keyof SkillScores } {
  const entries = Object.entries(scores) as [keyof SkillScores, number][];
  const avg = Math.round(entries.reduce((n, [, v]) => n + v, 0) / entries.length);
  const weakest = entries.reduce((a, b) => (b[1] < a[1] ? b : a))[0];
  const passed = avg >= MIN_AVG && entries.every(([, v]) => v >= MIN_SKILL);
  return { passed, avg, weakest };
}

export const SKILL_LABELS: Record<keyof SkillScores, { en: string; kr: string; href: string }> = {
  listening: { en: "Listening", kr: "듣기", href: "/listening" },
  reading: { en: "Reading", kr: "읽기", href: "/reading" },
  writing: { en: "Writing", kr: "쓰기", href: "/writing" },
  speaking: { en: "Speaking", kr: "말하기", href: "/speaking" },
};
