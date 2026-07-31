export type Question = {
  type: "Words" | "Grammar" | "Listening";
  lv: number;
  word?: string;
  audio?: string;
  ask: string;
  opts: string[];
  ans: number;
};

export const QUESTIONS: Question[] = [
  { type: "Words", lv: 1, word: '"안녕하세요"', ask: "What does this mean?", opts: ["Hello 👋", "Goodbye", "Thank you", "Sorry"], ans: 0 },
  { type: "Words", lv: 1, word: '"물"', ask: "Pick the right meaning!", opts: ["Fire", "Water 💧", "Food", "House"], ans: 1 },
  { type: "Grammar", lv: 2, word: "저는 학생___.", ask: "Fill in the blank.", opts: ["이에요", "예요", "있어요", "해요"], ans: 0 },
  { type: "Words", lv: 2, word: '"괜찮아요"', ask: "What does this mean?", opts: ["It's okay 😊", "It's expensive", "See you tomorrow", "I don't know"], ans: 0 },
  { type: "Listening", lv: 3, audio: "지금 몇 시예요?", ask: "You heard a question — what is being asked?", opts: ["The time ⏰", "The price", "The weather", "Your name"], ans: 0 },
  { type: "Grammar", lv: 3, word: "비가 와___ 우산을 가져왔어요.", ask: "Choose the right connector.", opts: ["서", "고", "면", "지만"], ans: 0 },
  { type: "Words", lv: 4, word: '"번거롭다"', ask: "Closest in meaning?", opts: ["Troublesome", "Delicious", "Peaceful", "Generous"], ans: 0 },
  { type: "Grammar", lv: 4, word: "그 일은 이미 끝났___ 걱정하지 마세요.", ask: "Fill in the blank.", opts: ["으니까", "는데도", "기 위해", "자마자"], ans: 0 },
  { type: "Listening", lv: 5, audio: "회의가 연기됐다는 소식 들으셨어요?", ask: "What happened to the meeting?", opts: ["It was postponed", "It was cancelled", "It ended early", "It went well"], ans: 0 },
  { type: "Words", lv: 6, word: '"미봉책"', ask: "This word refers to…", opts: ["A stopgap measure", "A grand strategy", "A final decision", "An old custom"], ans: 0 },
];

export type Level = {
  code: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  min: number;
  desc: string;
};

export const LEVELS: Level[] = [
  { code: "A1", min: 0, desc: "You're at the very first page — the coziest place to start! We'll begin with Hangul, greetings, and little survival phrases." },
  { code: "A2", min: 5, desc: "You know the basics! Simple everyday chats are yours. Next we'll grow longer sentences and everyday words." },
  { code: "B1", min: 11, desc: "Solid roots! You can hold everyday conversations. Now for connectors, nuance, and real-life listening." },
  { code: "B2", min: 18, desc: "Wow — you handle most situations with confidence! Time to polish natural expression and faster listening." },
  { code: "C1", min: 25, desc: "Tall branches! You speak fluently across many topics. Let's refine idioms and formal Korean." },
  { code: "C2", min: 31, desc: "A mighty tree! Near-native mastery. We'll keep you sharp with fresh media, slang, and pro-level Korean." },
];

export function levelFromWeighted(weighted: number): Level {
  let lv = LEVELS[0];
  for (const L of LEVELS) {
    if (weighted >= L.min) lv = L;
  }
  return lv;
}
