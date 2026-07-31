import type { CefrLevel } from "@/lib/tree";

// Promotion (grade-up) test content + rules — separate from the onboarding
// placement quiz in level-test.ts. A test covers four skills; listening and
// reading are MCQ (scored locally), writing and speaking are free responses
// graded by AI (/api/level-test/grade).
//
// Anti-memorization: each spec holds POOLS larger than what one attempt
// serves. buildServedTest() samples questions/passages/prompts at random and
// shuffles the options, so a retake (after the 48h cooldown) sees a
// different test.

export type McqQuestion = {
  /** Korean text; listening questions are played via TTS instead of shown. */
  kr: string;
  question: string;
  options: string[];
  answer: string;
};

export type ReadingSet = { passage: string; questions: McqQuestion[] };
export type FreePrompt = { prompt: string; promptKr: string };

export type PromotionTestSpec = {
  from: CefrLevel;
  to: CefrLevel;
  /** Sampled down to listeningCount per attempt. */
  listeningPool: McqQuestion[];
  listeningCount: number;
  /** Sampled down to readingCount passages per attempt. */
  readingPool: ReadingSet[];
  readingCount: number;
  writingPool: FreePrompt[];
  speakingPool: FreePrompt[];
};

/** One concrete attempt, sampled from a spec's pools. */
export type ServedPromotionTest = {
  from: CefrLevel;
  to: CefrLevel;
  listening: McqQuestion[];
  reading: ReadingSet[];
  writing: FreePrompt;
  speaking: FreePrompt;
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

function fisherYates<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function buildServedTest(
  spec: PromotionTestSpec,
  rng: () => number = Math.random
): ServedPromotionTest {
  const shuffledOptions = (q: McqQuestion): McqQuestion => ({
    ...q,
    options: fisherYates(q.options, rng),
  });
  return {
    from: spec.from,
    to: spec.to,
    listening: fisherYates(spec.listeningPool, rng)
      .slice(0, spec.listeningCount)
      .map(shuffledOptions),
    reading: fisherYates(spec.readingPool, rng)
      .slice(0, spec.readingCount)
      .map((set) => ({ ...set, questions: set.questions.map(shuffledOptions) })),
    writing: fisherYates(spec.writingPool, rng)[0],
    speaking: fisherYates(spec.speakingPool, rng)[0],
  };
}

const L = (kr: string, question: string, options: string[], answer: string): McqQuestion => ({
  kr,
  question,
  options,
  answer,
});
const R = (question: string, options: string[], answer: string): McqQuestion => ({
  kr: "",
  question,
  options,
  answer,
});

export const PROMOTION_TESTS: PromotionTestSpec[] = [
  // ──────────────────────────────────────────────────────────── A1 → A2
  // Daily-life basics: present/past/future, simple questions.
  {
    from: "A1",
    to: "A2",
    listeningCount: 8,
    listeningPool: [
      L("저는 물을 마셔요.", "What did you hear?", ["I drink water", "I eat rice", "I go home"], "I drink water"),
      L("내일 학교에 가요.", "When are they going to school?", ["tomorrow", "yesterday", "now"], "tomorrow"),
      L("커피 주세요.", "What are they asking for?", ["coffee", "water", "rice"], "coffee"),
      L("친구가 와요.", "Who is coming?", ["a friend", "a teacher", "mom"], "a friend"),
      L("비가 오면 집에 있을 거예요.", "What will they do if it rains?", ["stay home", "go out", "study Korean"], "stay home"),
      L("어제 밥을 먹었어요.", "When did they eat?", ["yesterday", "today", "tomorrow"], "yesterday"),
      L("이 책은 얼마예요?", "What are they asking about?", ["the price", "the time", "the weather"], "the price"),
      L("오늘 날씨가 추워요.", "How is the weather today?", ["cold", "hot", "rainy"], "cold"),
      L("저는 한국어를 공부해요.", "What are they studying?", ["Korean", "English", "math"], "Korean"),
      L("지금 몇 시예요?", "What are they asking?", ["the time", "the date", "the price"], "the time"),
      L("주말에 영화를 봤어요.", "What did they do on the weekend?", ["watched a movie", "read a book", "played soccer"], "watched a movie"),
      L("우리 엄마는 의사예요.", "What is their mom's job?", ["a doctor", "a teacher", "a cook"], "a doctor"),
    ],
    readingCount: 2,
    readingPool: [
      {
        passage:
          "저는 마크예요. 학생이에요. 어제 친구를 만났어요. 우리는 커피를 마시고 이야기를 했어요. 내일은 도서관에 공부하러 갈 거예요.",
        questions: [
          R("What is Mark?", ["a student", "a teacher", "a doctor"], "a student"),
          R("What did Mark do yesterday?", ["met a friend", "went to the library", "stayed home"], "met a friend"),
          R("Why is Mark going to the library tomorrow?", ["to study", "to drink coffee", "to meet a friend"], "to study"),
          R("What did Mark and his friend drink?", ["coffee", "water", "milk"], "coffee"),
        ],
      },
      {
        passage:
          "지수 씨는 회사원이에요. 아침 일곱 시에 일어나요. 여덟 시에 지하철로 회사에 가요. 저녁에는 요가를 배워요. 주말에는 가족하고 공원에 가요.",
        questions: [
          R("What is Jisu's job?", ["an office worker", "a student", "a nurse"], "an office worker"),
          R("How does Jisu go to work?", ["by subway", "by bus", "by car"], "by subway"),
          R("What does Jisu learn in the evening?", ["yoga", "Korean", "piano"], "yoga"),
          R("Who does Jisu go to the park with?", ["her family", "her friends", "her coworkers"], "her family"),
        ],
      },
      {
        passage:
          "오늘은 토요일이에요. 날씨가 좋아서 민호 씨는 친구하고 한강에 갔어요. 같이 자전거를 탔어요. 점심으로 김밥을 먹었어요. 내일은 집에서 쉴 거예요.",
        questions: [
          R("What day is it?", ["Saturday", "Sunday", "Monday"], "Saturday"),
          R("Why did Minho go to the Han River?", ["the weather was nice", "he had a meeting", "it was raining"], "the weather was nice"),
          R("What did Minho eat for lunch?", ["gimbap", "ramyeon", "pizza"], "gimbap"),
          R("What will Minho do tomorrow?", ["rest at home", "ride a bike", "meet a friend"], "rest at home"),
        ],
      },
    ],
    writingPool: [
      {
        prompt:
          "Introduce yourself in Korean — 3 sentences or more. Include your name, one thing you did yesterday (past tense), and one thing you will do tomorrow (future tense).",
        promptKr: "한국어로 자기소개를 3문장 이상 써 보세요. 이름, 어제 한 일(과거), 내일 할 일(미래)을 포함하세요.",
      },
      {
        prompt:
          "Describe your day in Korean — 3 sentences or more. Say when you get up, one thing you do every day, and one thing you like.",
        promptKr: "하루 일과를 한국어로 3문장 이상 써 보세요. 몇 시에 일어나는지, 매일 하는 일, 좋아하는 것을 포함하세요.",
      },
      {
        prompt:
          "Write about your family or a friend in Korean — 3 sentences or more. Include who they are, what they do, and one thing you did together.",
        promptKr: "가족이나 친구에 대해 한국어로 3문장 이상 써 보세요. 누구인지, 무엇을 하는지, 같이 한 일을 포함하세요.",
      },
    ],
    speakingPool: [
      {
        prompt: "Answer out loud in Korean, 2 sentences or more: 주말에 보통 뭐 해요? (What do you usually do on weekends?)",
        promptKr: "주말에 보통 뭐 해요? — 한국어로 2문장 이상 말해 보세요.",
      },
      {
        prompt: "Answer out loud in Korean, 2 sentences or more: 어제 뭐 했어요? (What did you do yesterday?)",
        promptKr: "어제 뭐 했어요? — 한국어로 2문장 이상 말해 보세요.",
      },
      {
        prompt: "Answer out loud in Korean, 2 sentences or more: 무슨 음식을 좋아해요? (What food do you like?)",
        promptKr: "무슨 음식을 좋아해요? — 한국어로 2문장 이상 말해 보세요.",
      },
    ],
  },

  // ──────────────────────────────────────────────────────────── A2 → B1
  // Connected clauses, experience, reasons, comparisons.
  {
    from: "A2",
    to: "B1",
    listeningCount: 8,
    listeningPool: [
      L("배가 아파서 병원에 갔어요.", "Why did they go to the hospital?", ["their stomach hurt", "their head hurt", "they had a cold"], "their stomach hurt"),
      L("한국에 가 본 적이 있어요?", "What are they asking?", ["if you have been to Korea", "if you will go to Korea", "if you like Korea"], "if you have been to Korea"),
      L("시간이 있을 때 보통 음악을 들어요.", "What do they do in their free time?", ["listen to music", "watch movies", "play games"], "listen to music"),
      L("지하철이 버스보다 더 빨라요.", "Which is faster?", ["the subway", "the bus", "they are the same"], "the subway"),
      L("내일 비가 올 것 같아요.", "What do they think about tomorrow?", ["it will probably rain", "it will be sunny", "it will snow"], "it will probably rain"),
      L("창문 좀 닫아 주시겠어요?", "What are they asking you to do?", ["close the window", "open the window", "clean the window"], "close the window"),
      L("요즘 운동을 시작해서 기분이 좋아요.", "Why do they feel good?", ["they started exercising", "they got a new job", "they took a trip"], "they started exercising"),
      L("표를 예매하려고 인터넷을 찾아봤어요.", "Why did they search the internet?", ["to book tickets", "to buy clothes", "to find a recipe"], "to book tickets"),
      L("늦지 마세요. 회의가 아홉 시에 시작해요.", "When does the meeting start?", ["at 9", "at 10", "at 7"], "at 9"),
      L("김치가 맵지만 정말 맛있어요.", "What do they say about kimchi?", ["spicy but delicious", "too spicy to eat", "not spicy at all"], "spicy but delicious"),
      L("친구를 만나기 전에 숙제를 끝냈어요.", "What did they do first?", ["finished homework", "met a friend", "ate dinner"], "finished homework"),
      L("어렸을 때 부산에 살았어요.", "When did they live in Busan?", ["when they were young", "last year", "now"], "when they were young"),
    ],
    readingCount: 2,
    readingPool: [
      {
        passage:
          "지난 여름에 처음으로 제주도에 가 봤어요. 비행기 표가 비싸서 두 달 전에 예매했어요. 제주도에서 바다도 보고 한라산에도 올라갔어요. 등산은 힘들었지만 경치가 정말 아름다웠어요. 다음에는 겨울에 가 보고 싶어요. 눈이 온 한라산이 더 예쁘다고 들었거든요.",
        questions: [
          R("When did the writer go to Jeju?", ["last summer", "last winter", "two months ago"], "last summer"),
          R("Why did they book the flight two months early?", ["the tickets were expensive", "the seats were sold out", "they forgot the date"], "the tickets were expensive"),
          R("How was hiking Hallasan?", ["hard but the view was beautiful", "easy and fun", "too dangerous to finish"], "hard but the view was beautiful"),
          R("When do they want to go next?", ["in winter", "in summer", "next month"], "in winter"),
          R("Why winter?", ["they heard snowy Hallasan is prettier", "flights are cheaper", "there are fewer people"], "they heard snowy Hallasan is prettier"),
        ],
      },
      {
        passage:
          "저는 지난달에 새 회사에 들어갔어요. 처음에는 일이 어려워서 실수를 많이 했어요. 그런데 팀 사람들이 친절하게 도와줘서 지금은 많이 익숙해졌어요. 회사가 집에서 멀기 때문에 아침 여섯 시 반에 일어나야 해요. 힘들지만 일이 재미있어서 만족해요.",
        questions: [
          R("When did the writer join the new company?", ["last month", "last year", "this week"], "last month"),
          R("Why did they make many mistakes at first?", ["the work was difficult", "they were lazy", "they woke up late"], "the work was difficult"),
          R("How did they get used to the work?", ["teammates kindly helped them", "they took a class", "they read a book"], "teammates kindly helped them"),
          R("Why do they wake up at 6:30?", ["the company is far from home", "they exercise every morning", "they start work at 7"], "the company is far from home"),
          R("How do they feel about the job now?", ["satisfied because the work is fun", "tired and unhappy", "worried about mistakes"], "satisfied because the work is fun"),
        ],
      },
      {
        passage:
          "건강을 위해서 석 달 전부터 아침마다 달리기를 하고 있어요. 처음에는 십 분만 뛰어도 힘들었는데 지금은 삼십 분을 뛸 수 있어요. 달리기를 시작한 후에 잠도 잘 자고 스트레스도 줄었어요. 주말에는 공원에서 달리기 모임 사람들과 같이 뛰어요. 혼자 뛰는 것보다 훨씬 재미있어요.",
        questions: [
          R("How long have they been running?", ["for three months", "for three weeks", "for a year"], "for three months"),
          R("How long can they run now?", ["30 minutes", "10 minutes", "an hour"], "30 minutes"),
          R("What changed after they started running?", ["they sleep well and have less stress", "they lost their appetite", "they got injured"], "they sleep well and have less stress"),
          R("What do they do on weekends?", ["run with a running group", "rest at home", "run alone at the gym"], "run with a running group"),
          R("What do they say about running with others?", ["it is much more fun than alone", "it is slower than alone", "it is too crowded"], "it is much more fun than alone"),
        ],
      },
    ],
    writingPool: [
      {
        prompt:
          "Write 5 sentences or more in Korean about a trip you have taken. Where did you go, what did you do, and what was good or bad about it?",
        promptKr: "여행 경험에 대해 한국어로 5문장 이상 써 보세요. 어디에 갔는지, 무엇을 했는지, 무엇이 좋았거나 아쉬웠는지 쓰세요.",
      },
      {
        prompt:
          "Write 5 sentences or more in Korean about your plans for next year. Use future tense and give a reason for at least one plan (-(으)려고 하다, -아/어서).",
        promptKr: "내년 계획에 대해 한국어로 5문장 이상 써 보세요. 미래 시제를 쓰고, 계획 중 하나에는 이유를 붙이세요.",
      },
      {
        prompt:
          "Compare two things you know well (two cities, two foods, two seasons…) in Korean, 5 sentences or more. Use -보다 and say which one you prefer and why.",
        promptKr: "잘 아는 두 가지(두 도시, 두 음식, 두 계절 등)를 한국어로 5문장 이상 비교해 보세요. '-보다'를 쓰고 무엇을 더 좋아하는지 이유와 함께 쓰세요.",
      },
    ],
    speakingPool: [
      {
        prompt:
          "Answer out loud in Korean, 3 sentences or more: 지금까지 가 본 곳 중에서 어디가 제일 좋았어요? 왜요? (Of the places you've been, which was the best and why?)",
        promptKr: "지금까지 가 본 곳 중에서 어디가 제일 좋았어요? 왜요? — 한국어로 3문장 이상 말해 보세요.",
      },
      {
        prompt:
          "Answer out loud in Korean, 3 sentences or more: 스트레스를 받을 때 어떻게 풀어요? (How do you relieve stress?)",
        promptKr: "스트레스를 받을 때 어떻게 풀어요? — 한국어로 3문장 이상 말해 보세요.",
      },
      {
        prompt:
          "Answer out loud in Korean, 3 sentences or more: 요즘 배우고 있는 것이 있어요? 왜 배워요? (Is there something you're learning these days? Why?)",
        promptKr: "요즘 배우고 있는 것이 있어요? 왜 배워요? — 한국어로 3문장 이상 말해 보세요.",
      },
    ],
  },

  // ──────────────────────────────────────────────────────────── B1 → B2
  // Indirect speech, suppositions, everyday news and reviews. 4 options.
  {
    from: "B1",
    to: "B2",
    listeningCount: 10,
    listeningPool: [
      L("일기예보에서 주말에 눈이 온다고 했어요.", "What did the forecast say?", ["it will snow this weekend", "it will rain this weekend", "it snowed last weekend", "the weekend will be warm"], "it will snow this weekend"),
      L("회의가 취소됐다는 소식 들었어요?", "What news are they asking about?", ["the meeting was canceled", "the meeting was moved up", "a new meeting was added", "the meeting ran long"], "the meeting was canceled"),
      L("그 식당은 예약하지 않으면 들어가기 어려워요.", "What do they say about the restaurant?", ["it's hard to get in without a reservation", "it doesn't take reservations", "it's easy to get a table", "it's closed on weekends"], "it's hard to get in without a reservation"),
      L("운동을 꾸준히 할수록 건강이 좋아져요.", "What is the point of this sentence?", ["the more consistently you exercise, the healthier you get", "exercising too much is harmful", "health has little to do with exercise", "you should exercise only on weekends"], "the more consistently you exercise, the healthier you get"),
      L("지갑을 잃어버려서 경찰서에 신고했어요.", "What did they do?", ["reported a lost wallet to the police", "found a wallet at the police station", "lost their phone", "was questioned by the police"], "reported a lost wallet to the police"),
      L("이 약은 하루에 세 번 식사 후에 드세요.", "How should the medicine be taken?", ["three times a day after meals", "three times a day before meals", "once a day after dinner", "only when it hurts"], "three times a day after meals"),
      L("출근 시간에는 길이 막히니까 지하철을 타는 게 나아요.", "What do they recommend at rush hour?", ["taking the subway", "driving a car", "taking a taxi", "leaving later"], "taking the subway"),
      L("그 영화는 기대했던 것보다 재미없었어요.", "How was the movie?", ["less fun than expected", "more fun than expected", "exactly as expected", "so fun they watched it twice"], "less fun than expected"),
      L("한국 생활에 익숙해지는 데 시간이 꽤 걸렸어요.", "What took a long time?", ["getting used to life in Korea", "traveling to Korea", "learning to cook Korean food", "finding a house in Korea"], "getting used to life in Korea"),
      L("전화를 받자마자 밖으로 나갔어요.", "When did they go out?", ["as soon as they answered the phone", "before the phone rang", "after a long call", "without answering the phone"], "as soon as they answered the phone"),
      L("컴퓨터가 고장 나서 수리를 맡겼어요.", "What happened?", ["their computer broke, so they sent it for repair", "they bought a new computer", "they repaired the computer themselves", "they sold the broken computer"], "their computer broke, so they sent it for repair"),
      L("요즘 물가가 올라서 걱정이에요.", "What are they worried about?", ["rising prices", "falling prices", "losing their job", "their health"], "rising prices"),
      L("발표 자료를 미리 준비해 놓으세요.", "What are they told to do?", ["prepare the presentation materials in advance", "cancel the presentation", "present without materials", "email the materials afterward"], "prepare the presentation materials in advance"),
      L("감기에 걸리지 않도록 손을 자주 씻으세요.", "Why should you wash your hands often?", ["to avoid catching a cold", "because they look dirty", "before every meal only", "to warm them up"], "to avoid catching a cold"),
    ],
    readingCount: 2,
    readingPool: [
      {
        passage:
          "최근 조용한 카페 대신 '북카페'를 찾는 사람들이 늘고 있다. 북카페는 커피를 마시면서 책을 읽을 수 있는 공간으로, 조용한 분위기 덕분에 공부하러 오는 학생도 많다. 한 북카페 사장은 \"손님들이 평균 두 시간 이상 머무르기 때문에 자리 회전은 느리지만, 음료 외에 책 판매 수익이 있어서 운영에 도움이 된다\"고 말했다. 다만 일부 카페에서는 자리만 차지하고 주문하지 않는 손님 때문에 고민이라고 한다.",
        questions: [
          R("What is a 'book cafe'?", ["a cafe where you can read while drinking coffee", "a bookstore that doesn't sell drinks", "a library that bans drinks", "a cafe that only sells books"], "a cafe where you can read while drinking coffee"),
          R("Why do many students come?", ["because of the quiet atmosphere", "because drinks are free", "because it's open all night", "because books are free"], "because of the quiet atmosphere"),
          R("Why is slow seat turnover not a big problem for the owner?", ["book sales also bring revenue", "rent is cheap", "drinks are expensive", "the government supports the cafe"], "book sales also bring revenue"),
          R("What problem do some cafes mention?", ["customers who take seats without ordering", "customers who steal books", "too much noise", "a shortage of coffee beans"], "customers who take seats without ordering"),
          R("The word '머무르다' is closest in meaning to…", ["to stay", "to leave", "to order", "to read"], "to stay"),
        ],
      },
      {
        passage:
          "마라톤 선수 김하늘 씨는 작년에 큰 부상을 당해서 일 년 가까이 뛰지 못했다. 의사들은 다시 뛰기 어려울 것이라고 했지만, 그녀는 포기하지 않고 매일 재활 훈련을 계속했다. 이번 대회에서 그녀는 자신의 최고 기록을 세우며 우승했다. 경기 후 인터뷰에서 그녀는 \"기록보다 다시 달릴 수 있다는 것 자체가 기쁘다\"며 \"부상으로 힘들어하는 다른 선수들에게 희망이 되고 싶다\"고 말했다.",
        questions: [
          R("Why couldn't Kim Haneul run for almost a year?", ["she had a serious injury", "she retired", "she was studying abroad", "she changed sports"], "she had a serious injury"),
          R("What did the doctors say?", ["it would be hard for her to run again", "she would recover in a month", "she should run more", "she needed surgery immediately"], "it would be hard for her to run again"),
          R("What happened at this competition?", ["she won with a personal best", "she finished second", "she dropped out halfway", "she was injured again"], "she won with a personal best"),
          R("What does she say matters most?", ["being able to run again", "the new record", "the prize money", "beating her rival"], "being able to run again"),
          R("What does she want to be for injured athletes?", ["hope", "a coach", "a doctor", "a sponsor"], "hope"),
        ],
      },
      {
        passage:
          "우리 아파트는 다음 달부터 음식물 쓰레기 종량제를 시작한다. 지금까지는 관리비에 처리 비용이 포함되어 있었지만, 앞으로는 버리는 만큼 요금을 내야 한다. 관리 사무소는 \"버린 무게에 따라 요금이 계산되기 때문에 음식물 쓰레기를 줄일수록 돈을 아낄 수 있다\"고 설명했다. 실제로 이 제도를 먼저 시작한 옆 단지에서는 음식물 쓰레기가 삼십 퍼센트 넘게 줄었다고 한다.",
        questions: [
          R("What starts next month?", ["a pay-by-weight food waste system", "free food waste collection", "a recycling ban", "a new parking fee"], "a pay-by-weight food waste system"),
          R("How was food waste paid for until now?", ["it was included in the maintenance fee", "each household paid by weight", "the city paid for everything", "it was free with no limit"], "it was included in the maintenance fee"),
          R("How is the new fee calculated?", ["by the weight thrown away", "by household size", "by apartment size", "a fixed monthly amount"], "by the weight thrown away"),
          R("What happened in the neighboring complex?", ["food waste dropped by over 30%", "residents protested", "fees doubled", "nothing changed"], "food waste dropped by over 30%"),
          R("The word '줄이다' means…", ["to reduce", "to increase", "to collect", "to throw away"], "to reduce"),
        ],
      },
    ],
    writingPool: [
      {
        prompt:
          "In Korean, 6 sentences or more: describe a piece of news you heard recently and your opinion about it. Use indirect speech at least once (-다고 하다).",
        promptKr: "최근에 들은 소식 하나를 소개하고 그것에 대한 생각을 한국어로 6문장 이상 써 보세요. 간접화법(-다고 하다)을 한 번 이상 쓰세요.",
      },
      {
        prompt:
          "In Korean, 6 sentences or more: write a review of a movie, book, or restaurant. Say what you expected, how it actually was, and whether you would recommend it.",
        promptKr: "영화, 책, 식당 중 하나의 후기를 한국어로 6문장 이상 써 보세요. 기대했던 것, 실제 경험, 추천 여부를 포함하세요.",
      },
      {
        prompt:
          "In Korean, 6 sentences or more: a friend wants to start learning Korean. Give them advice — what to do, what to avoid, and why (-는 게 좋다, -지 않도록).",
        promptKr: "한국어를 배우고 싶어 하는 친구에게 조언하는 글을 6문장 이상 써 보세요. 무엇을 하면 좋은지, 무엇을 피해야 하는지 이유와 함께 쓰세요.",
      },
    ],
    speakingPool: [
      {
        prompt:
          "Speak in Korean, 4 sentences or more: 최근에 본 영화나 드라마를 소개해 주세요. 줄거리와 감상을 말해 보세요. (Introduce a movie/drama you watched recently — plot and impressions.)",
        promptKr: "최근에 본 영화나 드라마를 소개해 주세요. 줄거리와 감상을 한국어로 4문장 이상 말해 보세요.",
      },
      {
        prompt:
          "Speak in Korean, 4 sentences or more: 살면서 가장 기억에 남는 일은 뭐예요? 언제, 무슨 일이 있었는지 말해 보세요. (Your most memorable experience — when and what happened.)",
        promptKr: "살면서 가장 기억에 남는 일은 뭐예요? 언제, 무슨 일이 있었는지 한국어로 4문장 이상 말해 보세요.",
      },
      {
        prompt:
          "Speak in Korean, 4 sentences or more: 도시 생활과 시골 생활 중 뭐가 더 좋다고 생각해요? 이유를 들어 말해 보세요. (City vs country life — which is better and why?)",
        promptKr: "도시 생활과 시골 생활 중 뭐가 더 좋다고 생각해요? 이유를 들어 한국어로 4문장 이상 말해 보세요.",
      },
    ],
  },

  // ──────────────────────────────────────────────────────────── B2 → C1
  // Formal/written register, social issues, expository prose. 4 options.
  {
    from: "B2",
    to: "C1",
    listeningCount: 10,
    listeningPool: [
      L("정부는 내년부터 새로운 환경 정책을 시행할 예정입니다.", "What is the government planning?", ["to implement a new environmental policy next year", "to cancel an environmental policy", "to survey public opinion on the environment", "to raise environmental fines this year"], "to implement a new environmental policy next year"),
      L("이번 조사에 따르면 청년 실업률이 감소한 것으로 나타났습니다.", "What did the survey find?", ["youth unemployment decreased", "youth unemployment increased", "youth wages decreased", "more youths started businesses"], "youth unemployment decreased"),
      L("그 제안은 장점도 있지만 현실성이 부족하다는 비판을 받고 있습니다.", "What criticism does the proposal face?", ["it lacks feasibility", "it is too expensive", "it is too old-fashioned", "it has no advantages"], "it lacks feasibility"),
      L("회사 측은 사고 원인을 조사 중이라고 밝혔습니다.", "What did the company announce?", ["it is investigating the cause of the accident", "it has finished the investigation", "it denies the accident happened", "it will compensate the victims"], "it is investigating the cause of the accident"),
      L("인터넷의 발달로 정보를 얻기 쉬워진 반면 잘못된 정보도 늘어났습니다.", "What contrast is being made?", ["easier access to information vs more misinformation", "faster internet vs higher cost", "more information vs less privacy", "young users vs old users"], "easier access to information vs more misinformation"),
      L("행사 참가 신청은 이번 주 금요일까지 접수됩니다.", "When is the application deadline?", ["this Friday", "next Friday", "this weekend", "the end of the month"], "this Friday"),
      L("전문가들은 소비를 줄이는 것만으로는 문제를 해결할 수 없다고 지적합니다.", "What do experts point out?", ["reducing consumption alone cannot solve the problem", "consumption must be reduced immediately", "the problem has already been solved", "experts disagree with each other"], "reducing consumption alone cannot solve the problem"),
      L("그 배우는 인터뷰에서 은퇴를 고려하고 있다고 암시했습니다.", "What did the actor hint at?", ["considering retirement", "signing a new film", "getting married", "moving abroad"], "considering retirement"),
      L("대중교통 요금이 다음 달부터 인상된다고 발표됐습니다.", "What was announced?", ["public transit fares will rise next month", "public transit will be free next month", "new subway lines will open", "buses will run less often"], "public transit fares will rise next month"),
      L("이 지역은 홍수 피해를 자주 입어서 대책 마련이 시급합니다.", "What does this area urgently need?", ["measures against flood damage", "more tourists", "a new bridge", "better schools"], "measures against flood damage"),
      L("신제품은 기존 모델에 비해 배터리 수명이 두 배로 늘었습니다.", "How does the new product compare to the old model?", ["battery life doubled", "the price doubled", "the weight doubled", "the screen is twice as large"], "battery life doubled"),
      L("독서량이 줄어드는 현상은 젊은 세대에만 국한된 문제가 아닙니다.", "What is said about declining reading?", ["it is not limited to the younger generation", "it only affects the younger generation", "it has stopped recently", "it is caused by schools"], "it is not limited to the younger generation"),
      L("계약 조건을 꼼꼼히 확인하지 않으면 나중에 불이익을 당할 수 있습니다.", "What is the warning?", ["check contract terms carefully or face disadvantages later", "never sign contracts", "contracts cannot be changed", "verbal promises are enough"], "check contract terms carefully or face disadvantages later"),
      L("그 연구 결과는 아직 학계에서 검증되지 않았습니다.", "What is the status of the research findings?", ["not yet verified by the academic community", "widely accepted by scholars", "proven to be false", "published in a famous journal"], "not yet verified by the academic community"),
    ],
    readingCount: 2,
    readingPool: [
      {
        passage:
          "재택근무가 확산되면서 일과 삶의 균형이 개선되었다는 평가가 많다. 출퇴근 시간이 사라져 개인 시간이 늘었고, 업무 집중도가 높아졌다는 조사 결과도 있다. 그러나 부작용을 지적하는 목소리도 적지 않다. 동료와의 자연스러운 소통이 줄어들면서 협업의 질이 떨어지고, 신입 사원은 업무를 배울 기회를 잃는다는 것이다. 일과 휴식의 경계가 흐려져 오히려 근무 시간이 길어졌다는 응답도 있었다. 전문가들은 재택과 출근을 병행하는 혼합 근무가 현실적인 대안이라고 제안한다.",
        questions: [
          R("What positive effects of remote work are mentioned?", ["more personal time and higher focus", "higher pay and promotions", "cheaper office rent", "more business trips"], "more personal time and higher focus"),
          R("What problem affects new employees?", ["losing chances to learn the job", "lower salaries", "longer commutes", "stricter dress codes"], "losing chances to learn the job"),
          R("What do some respondents say about working hours?", ["they actually got longer", "they got much shorter", "they stayed exactly the same", "they became optional"], "they actually got longer"),
          R("What do experts propose?", ["hybrid work mixing home and office", "returning fully to the office", "working from home only", "a four-day work week"], "hybrid work mixing home and office"),
          R("Why does collaboration quality fall?", ["natural communication with colleagues decreases", "computers are slower at home", "meetings are banned", "teams become too large"], "natural communication with colleagues decreases"),
          R("The phrase '경계가 흐려지다' means…", ["the boundary becomes blurred", "the boundary becomes clear", "the rule becomes strict", "the schedule becomes fixed"], "the boundary becomes blurred"),
        ],
      },
      {
        passage:
          "도시의 인공 불빛이 밤을 밝히면서 '빛 공해'가 새로운 환경 문제로 떠오르고 있다. 빛 공해는 사람의 수면을 방해할 뿐 아니라 생태계에도 영향을 미친다. 야행성 동물은 사냥과 번식에 어려움을 겪고, 철새는 이동 경로를 잃기도 한다. 가로수는 계절 변화를 인식하지 못해 단풍이 늦어지는 현상도 관찰된다. 일부 도시는 자정 이후 옥외 조명의 밝기를 제한하는 조례를 도입했지만, 안전 문제를 이유로 반대하는 의견도 있어 시행이 쉽지 않다.",
        questions: [
          R("What is 'light pollution' presented as?", ["an emerging environmental problem", "a solved problem", "a purely aesthetic issue", "a problem only in rural areas"], "an emerging environmental problem"),
          R("How does it affect migratory birds?", ["they can lose their migration routes", "they fly faster", "they breed more", "they avoid cities entirely"], "they can lose their migration routes"),
          R("What happens to street trees?", ["their autumn colors come late", "they grow taller", "they bloom twice a year", "they die immediately"], "their autumn colors come late"),
          R("What have some cities done?", ["limited outdoor lighting brightness after midnight", "banned all outdoor lights", "installed brighter lights", "moved lights underground"], "limited outdoor lighting brightness after midnight"),
          R("Why is enforcement difficult?", ["some oppose it for safety reasons", "the fines are too small", "nobody knows about the law", "lights cannot be dimmed"], "some oppose it for safety reasons"),
          R("The word '야행성' describes animals that are…", ["active at night", "active in winter", "living in water", "raised on farms"], "active at night"),
        ],
      },
      {
        passage:
          "소비자들이 물건을 살 때 항상 합리적으로 판단하는 것은 아니다. 대표적인 예가 '한정판 마케팅'이다. 수량이 얼마 남지 않았다는 문구를 보면 소비자는 지금 사지 않으면 손해라는 불안을 느끼고, 실제 필요와 상관없이 구매를 결정하기 쉽다. '천 원 할인'보다 '이십 퍼센트 할인'이라는 표현에 더 끌리는 것도 숫자가 주는 인상 때문이다. 전문가들은 이런 심리를 이용한 마케팅이 불법은 아니지만, 소비자 스스로 구매 전에 '지금 정말 필요한가'를 묻는 습관이 필요하다고 조언한다.",
        questions: [
          R("What is the main point of the passage?", ["consumers do not always judge rationally", "all marketing is dishonest", "discounts are always beneficial", "limited editions are high quality"], "consumers do not always judge rationally"),
          R("What does 'limited edition marketing' exploit?", ["the fear of losing out by not buying now", "the desire to collect rare items", "loyalty to a brand", "the joy of gift-giving"], "the fear of losing out by not buying now"),
          R("Why is '20% off' more attractive than '1,000 won off'?", ["because of the impression the number gives", "because it is always a bigger discount", "because it applies to more items", "because it lasts longer"], "because of the impression the number gives"),
          R("What is the experts' view of such marketing?", ["not illegal, but consumers should question their purchases", "it should be banned immediately", "it only works on children", "it benefits consumers most"], "not illegal, but consumers should question their purchases"),
          R("What habit do experts recommend?", ["asking 'do I really need this now' before buying", "always buying limited editions early", "avoiding all discounted goods", "shopping only online"], "asking 'do I really need this now' before buying"),
          R("The word '합리적' is closest to…", ["rational", "emotional", "impulsive", "generous"], "rational"),
        ],
      },
    ],
    writingPool: [
      {
        prompt:
          "In Korean, 8 sentences or more: 'SNS가 우리 사회에 미치는 영향' — discuss both positive and negative sides, then state your own position with reasons.",
        promptKr: "'SNS가 우리 사회에 미치는 영향'에 대해 긍정적 측면과 부정적 측면을 모두 논하고, 자신의 입장을 이유와 함께 한국어로 8문장 이상 쓰세요.",
      },
      {
        prompt:
          "In Korean, 8 sentences or more: some cities limit cars in the city center to reduce pollution. Do you agree or disagree? Present your argument with at least two reasons and one counterargument you reject.",
        promptKr: "일부 도시는 오염을 줄이기 위해 도심 차량을 제한합니다. 찬성인가요, 반대인가요? 근거 두 가지 이상과, 반대 의견에 대한 반박 하나를 포함해 한국어로 8문장 이상 쓰세요.",
      },
      {
        prompt:
          "In Korean, 8 sentences or more: describe a social change you have observed in recent years (work culture, family, technology…), analyze its causes, and predict where it will lead.",
        promptKr: "최근 몇 년간 관찰한 사회 변화(직장 문화, 가족, 기술 등) 하나를 골라 원인을 분석하고 앞으로의 방향을 예측하는 글을 한국어로 8문장 이상 쓰세요.",
      },
    ],
    speakingPool: [
      {
        prompt:
          "Speak in Korean, 5 sentences or more: 인공지능이 일자리에 미칠 영향에 대해 어떻게 생각하세요? 구체적인 예를 들어 의견을 말해 보세요.",
        promptKr: "인공지능이 일자리에 미칠 영향에 대해 어떻게 생각하세요? 구체적인 예를 들어 한국어로 5문장 이상 말해 보세요.",
      },
      {
        prompt:
          "Speak in Korean, 5 sentences or more: 환경 보호를 위해 개인이 할 수 있는 일과 정부가 해야 할 일을 비교해서 말해 보세요.",
        promptKr: "환경 보호를 위해 개인이 할 수 있는 일과 정부가 해야 할 일을 비교해서 한국어로 5문장 이상 말해 보세요.",
      },
      {
        prompt:
          "Speak in Korean, 5 sentences or more: 전통을 지키는 것과 변화를 받아들이는 것 중 무엇이 더 중요하다고 생각하세요? 근거를 들어 말해 보세요.",
        promptKr: "전통을 지키는 것과 변화를 받아들이는 것 중 무엇이 더 중요하다고 생각하세요? 근거를 들어 한국어로 5문장 이상 말해 보세요.",
      },
    ],
  },

  // ──────────────────────────────────────────────────────────── C1 → C2
  // Academic register: science, history, abstract argument. 4 options.
  {
    from: "C1",
    to: "C2",
    listeningCount: 12,
    listeningPool: [
      L("이 학설은 오랫동안 정설로 여겨졌으나 최근 반박되는 추세입니다.", "What is happening to this theory?", ["long accepted, it is now increasingly refuted", "it has just been proposed", "it was never taken seriously", "it has been proven beyond doubt"], "long accepted, it is now increasingly refuted"),
      L("유전자 편집 기술은 윤리적 논란을 불러일으키고 있습니다.", "What does gene-editing technology provoke?", ["ethical controversy", "unanimous support", "economic growth", "little public interest"], "ethical controversy"),
      L("그 정책은 단기적 성과에 치중한 나머지 부작용을 간과했다는 평가를 받습니다.", "What criticism does the policy receive?", ["it overlooked side effects while chasing short-term results", "it ignored short-term results", "it had no measurable effects", "it was never implemented"], "it overlooked side effects while chasing short-term results"),
      L("언어는 사고방식을 반영할 뿐 아니라 형성하기도 합니다.", "What is claimed about language?", ["it both reflects and shapes thought", "it only reflects thought", "it has no relation to thought", "it hinders logical thought"], "it both reflects and shapes thought"),
      L("실험 결과가 가설과 일치하지 않을 경우 변수를 재검토해야 합니다.", "What should be done if results contradict the hypothesis?", ["re-examine the variables", "discard the experiment", "publish immediately", "change the results"], "re-examine the variables"),
      L("고령화가 가속화됨에 따라 연금 제도의 지속 가능성이 의문시되고 있습니다.", "What is being questioned as aging accelerates?", ["the sustainability of the pension system", "the cause of aging", "the retirement age only", "the birth rate statistics"], "the sustainability of the pension system"),
      L("그 작가의 후기 작품은 인간 존재의 부조리를 다루고 있습니다.", "What do the writer's later works deal with?", ["the absurdity of human existence", "romantic love", "historical battles", "childhood memories"], "the absurdity of human existence"),
      L("기후 변화의 영향은 생태계 전반에 걸쳐 연쇄적으로 나타납니다.", "How do climate change effects appear?", ["in chain reactions across the whole ecosystem", "only in polar regions", "only in the ocean", "in isolated, unconnected events"], "in chain reactions across the whole ecosystem"),
      L("통계 자료를 해석할 때는 표본의 대표성을 고려해야 합니다.", "What must be considered when interpreting statistics?", ["the representativeness of the sample", "the age of the researcher", "the length of the report", "the popularity of the topic"], "the representativeness of the sample"),
      L("이 문제는 법적 측면뿐 아니라 도덕적 측면에서도 검토되어야 합니다.", "How should this issue be examined?", ["from both legal and moral angles", "from a legal angle only", "from an economic angle only", "it needs no examination"], "from both legal and moral angles"),
      L("인공지능이 인간의 판단을 대체할 수 있는지에 대한 논의가 활발합니다.", "What debate is active?", ["whether AI can replace human judgment", "whether AI should be banned", "how to make AI cheaper", "who invented AI"], "whether AI can replace human judgment"),
      L("그 협상은 양측의 입장 차이로 결렬될 위기에 처했습니다.", "What is the state of the negotiation?", ["at risk of collapse due to differences between the two sides", "successfully concluded", "postponed by bad weather", "expanded to include more parties"], "at risk of collapse due to differences between the two sides"),
      L("백신의 효능은 대규모 임상 시험을 통해 입증되었습니다.", "How was the vaccine's efficacy established?", ["through large-scale clinical trials", "through animal tests only", "through a public vote", "it remains unproven"], "through large-scale clinical trials"),
      L("문화유산 보존과 도시 개발 사이의 갈등이 심화되고 있습니다.", "What conflict is deepening?", ["between heritage preservation and urban development", "between two construction companies", "between citizens and tourists", "between old and new architects"], "between heritage preservation and urban development"),
      L("소득 불평등의 심화는 사회 통합을 저해하는 요인으로 지목됩니다.", "What is deepening income inequality blamed for?", ["undermining social cohesion", "raising average income", "reducing crime", "slowing inflation"], "undermining social cohesion"),
      L("그 이론은 여러 학문 분야에 걸쳐 폭넓게 응용되고 있습니다.", "How is the theory being used?", ["applied broadly across many disciplines", "confined to one narrow field", "taught only in high schools", "rejected by every field"], "applied broadly across many disciplines"),
    ],
    readingCount: 3,
    readingPool: [
      {
        passage:
          "인간의 장에는 수십조 개의 미생물이 서식하며, 이들을 통틀어 장내 미생물총이라 부른다. 최근 연구들은 장내 미생물총이 소화를 돕는 데 그치지 않고 면역 체계의 발달, 나아가 뇌 기능에까지 관여한다는 사실을 밝혀내고 있다. 이른바 '장-뇌 축' 가설에 따르면, 장내 미생물이 만들어 내는 신경전달물질이 미주신경을 통해 뇌에 신호를 전달하여 기분과 행동에 영향을 줄 수 있다. 다만 현재까지의 연구 상당수는 동물 실험에 기반하고 있어, 인간에게 동일한 기제가 작동하는지는 추가 검증이 필요하다는 신중론도 만만치 않다.",
        questions: [
          R("What is the gut microbiome said to influence beyond digestion?", ["immune development and even brain function", "only skin health", "only body weight", "nothing else has been suggested"], "immune development and even brain function"),
          R("According to the gut-brain axis hypothesis, how do gut microbes affect the brain?", ["via neurotransmitters signaling through the vagus nerve", "by physically entering the brain", "by changing blood type", "by raising body temperature"], "via neurotransmitters signaling through the vagus nerve"),
          R("Why do cautious voices call for further verification?", ["much of the research is based on animal experiments", "the studies were all fabricated", "microbes cannot be observed", "the hypothesis is logically impossible"], "much of the research is based on animal experiments"),
          R("The word '신중론' refers to…", ["a cautious position", "an enthusiastic endorsement", "a final conclusion", "a funding proposal"], "a cautious position"),
        ],
      },
      {
        passage:
          "훈민정음 창제는 흔히 한 개인의 천재성으로 설명되지만, 당시의 사회적 맥락을 함께 보아야 그 의미가 온전히 드러난다. 십오 세기 조선에서 문자 생활은 한문을 익힐 여유가 있는 지배층의 전유물이었고, 백성은 자신의 억울함을 글로 호소할 수단조차 갖지 못했다. 세종이 서문에서 '어리석은 백성이 말하고자 하는 바가 있어도 마침내 제 뜻을 펴지 못하는 자가 많다'고 밝힌 것은, 새 문자가 단순한 언어학적 성취를 넘어 통치 철학의 표현이었음을 시사한다. 물론 창제 이후에도 한글이 공식 문자의 지위를 얻기까지는 수백 년이 걸렸다는 점에서, 문자의 보급은 발명과는 별개의 정치적 과정이었다.",
        questions: [
          R("What does the author say is needed to fully understand the creation of Hunminjeongeum?", ["the social context of the time", "only King Sejong's biography", "modern linguistic theory", "comparison with the Roman alphabet"], "the social context of the time"),
          R("Who monopolized written language in 15th-century Joseon?", ["the ruling class who could learn Classical Chinese", "merchants", "farmers", "Buddhist monks only"], "the ruling class who could learn Classical Chinese"),
          R("What does Sejong's preface suggest about the new script?", ["it expressed a philosophy of governance beyond linguistics", "it was intended for scholars only", "it was created for foreign trade", "it was a purely artistic project"], "it expressed a philosophy of governance beyond linguistics"),
          R("What point does the author make about the spread of Hangul?", ["diffusion was a political process separate from invention", "it became official immediately", "it spread only through schools", "it was never resisted"], "diffusion was a political process separate from invention"),
        ],
      },
      {
        passage:
          "기술이 가치중립적이라는 통념은 오래전부터 도전받아 왔다. 기술 철학자들은 도구가 특정한 사용 방식을 유도하도록 설계된다는 점에 주목한다. 예컨대 무한 스크롤은 이용자가 멈출 지점을 스스로 정하도록 하는 대신, 계속 머무르는 쪽을 기본값으로 만든다. 이때 이용자의 선택은 형식적으로는 자유롭지만 실질적으로는 설계자가 배치한 경로를 따르기 쉽다. 따라서 기술을 평가할 때는 그것이 무엇을 가능하게 하는가만이 아니라, 무엇을 기본값으로 만들고 무엇을 어렵게 만드는가를 함께 물어야 한다는 것이 이들의 주장이다.",
        questions: [
          R("What common belief has long been challenged?", ["that technology is value-neutral", "that technology always improves life", "that design does not matter", "that users read manuals"], "that technology is value-neutral"),
          R("What does the infinite scroll example show?", ["staying longer is made the default", "users always stop on their own", "scrolling is physically difficult", "designers cannot predict behavior"], "staying longer is made the default"),
          R("How is the user's choice described?", ["formally free but practically guided along designed paths", "completely free in every sense", "entirely determined with no freedom", "random and unpredictable"], "formally free but practically guided along designed paths"),
          R("What question should be asked when evaluating technology?", ["what it makes default and what it makes difficult", "how expensive it is to produce", "which company released it first", "how fast it runs"], "what it makes default and what it makes difficult"),
        ],
      },
      {
        passage:
          "최저임금 인상이 고용에 미치는 영향은 경제학에서 가장 오래된 논쟁 중 하나다. 전통적 이론은 임금이 오르면 기업이 고용을 줄인다고 예측하지만, 일부 실증 연구는 적정 수준의 인상이 고용 감소 없이 저임금 노동자의 소득을 개선했다고 보고한다. 이러한 상반된 결과는 지역의 경제 상황, 인상 폭, 업종 구조에 따라 효과가 달라지기 때문으로 해석된다. 결국 중요한 것은 인상 자체의 찬반이 아니라, 어떤 조건에서 어느 정도의 인상이 의도한 효과를 내는지에 대한 정밀한 분석이라는 지적이 힘을 얻고 있다.",
        questions: [
          R("What does traditional theory predict about minimum wage increases?", ["firms will reduce employment", "firms will hire more", "prices will fall", "wages will not change"], "firms will reduce employment"),
          R("What do some empirical studies report?", ["moderate increases improved incomes without job losses", "every increase caused mass unemployment", "increases had no effect on income", "workers preferred lower wages"], "moderate increases improved incomes without job losses"),
          R("How are the conflicting results explained?", ["effects vary with local conditions, increase size, and industry structure", "one side simply lied", "the data was too old to use", "economists cannot do statistics"], "effects vary with local conditions, increase size, and industry structure"),
          R("What conclusion is gaining ground?", ["precise analysis of when and how much works matters more than being simply for or against", "the debate is finished", "minimum wage should be abolished", "theory should be trusted over evidence"], "precise analysis of when and how much works matters more than being simply for or against"),
        ],
      },
    ],
    writingPool: [
      {
        prompt:
          "In Korean, 10 sentences or more: '과학 연구의 방향을 시장의 수요가 결정해도 되는가' — write a structured essay with an introduction, at least two arguments, one counterargument with rebuttal, and a conclusion.",
        promptKr: "'과학 연구의 방향을 시장의 수요가 결정해도 되는가'에 대해 서론, 근거 두 가지 이상, 반론과 재반박, 결론을 갖춘 글을 한국어로 10문장 이상 쓰세요.",
      },
      {
        prompt:
          "In Korean, 10 sentences or more: discuss whether governments should regulate AI-generated content. Define the problem precisely, weigh freedom of expression against potential harms, and propose a concrete principle.",
        promptKr: "정부가 AI 생성 콘텐츠를 규제해야 하는지에 대해 한국어로 10문장 이상 쓰세요. 문제를 정확히 정의하고, 표현의 자유와 잠재적 해악을 비교한 뒤, 구체적인 원칙을 제안하세요.",
      },
      {
        prompt:
          "In Korean, 10 sentences or more: '세대 갈등은 과장된 것인가, 실재하는 구조적 문제인가' — take a position and defend it using at least one social or economic concept.",
        promptKr: "'세대 갈등은 과장된 것인가, 실재하는 구조적 문제인가'에 대해 입장을 정하고, 사회적·경제적 개념을 하나 이상 활용해 한국어로 10문장 이상 논증하세요.",
      },
    ],
    speakingPool: [
      {
        prompt:
          "Speak in Korean, 6 sentences or more: 기초 과학 연구에 대한 정부 투자가 왜 필요한지, 혹은 불필요한지 논리적으로 주장해 보세요.",
        promptKr: "기초 과학 연구에 대한 정부 투자가 왜 필요한지, 혹은 불필요한지 한국어로 6문장 이상 논리적으로 주장해 보세요.",
      },
      {
        prompt:
          "Speak in Korean, 6 sentences or more: '다수결이 항상 민주적인 것은 아니다'라는 주장에 대해 예를 들어 찬성 또는 반대 의견을 말해 보세요.",
        promptKr: "'다수결이 항상 민주적인 것은 아니다'라는 주장에 대해 예를 들어 한국어로 6문장 이상 찬성 또는 반대 의견을 말해 보세요.",
      },
      {
        prompt:
          "Speak in Korean, 6 sentences or more: 인류가 앞으로 50년 안에 해결해야 할 가장 중요한 문제는 무엇이라고 생각하며, 왜 그것이 다른 문제보다 우선해야 하나요?",
        promptKr: "인류가 앞으로 50년 안에 해결해야 할 가장 중요한 문제는 무엇이라고 생각하며, 왜 그것이 다른 문제보다 우선해야 하는지 한국어로 6문장 이상 말해 보세요.",
      },
    ],
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
