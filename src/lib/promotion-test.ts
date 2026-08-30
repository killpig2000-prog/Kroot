import type { CefrLevel } from "@/lib/tree";
import { getPromptsForLevel, type Prompt } from "@/lib/writing";

// Promotion (grade-up) test content + rules — separate from the onboarding
// placement quiz in level-test.ts. A test covers three skills, all scored
// locally, no AI: listening and reading are MCQ; writing is the same
// tap-to-assemble tile board the Writing feature uses (build the target
// sentence in order), sourced live from getPromptsForLevel(spec.to) so this
// file doesn't duplicate that content. There is no speaking section — free
// speech had no local scoring method once Gemini grading was removed
// app-wide, and this test would rather ask more writing than fall back to a
// weaker mechanic.
//
// Anti-memorization: listening/reading hold POOLS larger than what one
// attempt serves; writing draws from Writing's own (much larger) prompt
// pool. buildServedTest() samples at random and shuffles MCQ options, so a
// retake (after the cooldown) sees a different test.

export type McqQuestion = {
  /** Korean text; listening questions are played via TTS instead of shown. */
  kr: string;
  question: string;
  options: string[];
  answer: string;
};

export type ReadingSet = { passage: string; questions: McqQuestion[] };

export type PromotionTestSpec = {
  from: CefrLevel;
  to: CefrLevel;
  /** Sampled down to listeningCount per attempt. */
  listeningPool: McqQuestion[];
  listeningCount: number;
  /** Sampled down to readingCount passages per attempt. */
  readingPool: ReadingSet[];
  readingCount: number;
  /** How many tile-writing questions to serve, sampled from Writing's own pool for `to`. */
  writingCount: number;
};

/** One concrete attempt, sampled from a spec's pools. */
export type ServedPromotionTest = {
  from: CefrLevel;
  to: CefrLevel;
  listening: McqQuestion[];
  reading: ReadingSet[];
  writing: Prompt[];
};

// Pass rules: every skill ≥ MIN_SKILL and average ≥ MIN_AVG.
export const MIN_SKILL = 60;
export const MIN_AVG = 70;
// Failed attempt → this many hours before the next try.
export const COOLDOWN_HOURS = 24;

// Eligibility thresholds within the current grade.
//
// The gate asks "have you actually retained a solid chunk of this grade?" — the
// test itself is what measures ability, so the gate must never be harder to
// clear than the test is to pass.
//
// It counts words held at SRS box >= MASTERY_BOX rather than words merely seen,
// and rather than a lifetime correct/incorrect ratio. Box state is current, so
// a word you fumbled while learning but hold today counts as held; a lifetime
// ratio would have penalised those early misses forever.
//
// The target is an absolute count, capped by the ratio only so a grade with
// very little content can't lock learners out. An earlier version used the
// ratio alone, which meant every vocabulary expansion silently pushed the
// finish line further away for everyone mid-grade (A1 had grown to 480 words,
// ~7 weeks, before this was fixed).
export const ELIGIBILITY = {
  masteryBox: 3, // box 3 = survived the 1-day and 3-day reviews (see lib/srs.ts)
  targetMasteredWords: 150, // ~2 weeks at a normal pace
  wordCoverageRatio: 0.8, // ceiling only: never demand more than 80% of a grade
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

// Stable identity for a pool item, used to avoid re-serving the exact
// content a learner just saw on their last attempt at this grade.
export const listeningKey = (q: McqQuestion): string => q.kr;
export const readingKey = (set: ReadingSet): string => set.passage;
export const writingKey = (p: Prompt): string => p.key;

export type ServedKeys = {
  listening: string[];
  reading: string[];
  writing: string[];
};

/** Keys of what a served test actually contains — store this after grading so the next attempt can exclude it. */
export function servedKeysOf(test: ServedPromotionTest): ServedKeys {
  return {
    listening: test.listening.map(listeningKey),
    reading: test.reading.map(readingKey),
    writing: test.writing.map(writingKey),
  };
}

export type ExcludeKeys = {
  listening?: string[];
  reading?: string[];
  writing?: string[];
};

// Drop excluded items from a pool, but only if enough remain to serve the
// count — a learner should never see fewer questions just because their
// pool ran low on unseen content.
function withoutSeen<T>(pool: T[], key: (item: T) => string, exclude: string[] | undefined, need: number): T[] {
  if (!exclude || exclude.length === 0) return pool;
  const seen = new Set(exclude);
  const fresh = pool.filter((item) => !seen.has(key(item)));
  return fresh.length >= need ? fresh : pool;
}

export function buildServedTest(
  spec: PromotionTestSpec,
  rng: () => number = Math.random,
  exclude?: ExcludeKeys
): ServedPromotionTest {
  const shuffledOptions = (q: McqQuestion): McqQuestion => ({
    ...q,
    options: fisherYates(q.options, rng),
  });
  const listeningPool = withoutSeen(spec.listeningPool, listeningKey, exclude?.listening, spec.listeningCount);
  const readingPool = withoutSeen(spec.readingPool, readingKey, exclude?.reading, spec.readingCount);
  const writingPool = withoutSeen(getPromptsForLevel(spec.to), writingKey, exclude?.writing, spec.writingCount);
  return {
    from: spec.from,
    to: spec.to,
    listening: fisherYates(listeningPool, rng)
      .slice(0, spec.listeningCount)
      .map(shuffledOptions),
    reading: fisherYates(readingPool, rng)
      .slice(0, spec.readingCount)
      .map((set) => ({ ...set, questions: set.questions.map(shuffledOptions) })),
    writing: fisherYates(writingPool, rng).slice(0, spec.writingCount),
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
      L("저는 지금 청바지를 사요.", "What is the person buying?", ["jeans", "shoes", "a hat"], "jeans"),
      L("버스가 늦게 와요.", "What is late?", ["the bus", "the subway", "the taxi"], "the bus"),
      L("머리가 아파서 약을 먹었어요.", "What did they do because their head hurt?", ["took medicine", "went to sleep", "drank water"], "took medicine"),
      L("창문 좀 열어 주세요.", "What are they asking you to do?", ["open the window", "close the window", "clean the window"], "open the window"),
      L("저는 케이팝을 좋아해요.", "What do they like?", ["K-pop", "K-dramas", "Korean food"], "K-pop"),
      L("오늘 아침에 집을 청소했어요.", "What did they do this morning?", ["cleaned the house", "cooked breakfast", "washed the car"], "cleaned the house"),
      L("다음 주에 생일 파티가 있어요.", "When is the birthday party?", ["next week", "today", "last week"], "next week"),
      L("연필 좀 빌려 주세요.", "What are they asking to borrow?", ["a pencil", "a book", "money"], "a pencil"),
      L("지호 씨가 저한테 전화를 해요.", "Who is calling?", ["Jiho", "Yuna", "Mark"], "Jiho"),
      L("저녁에 파스타를 만들 거예요.", "What will they make for dinner?", ["pasta", "soup", "rice"], "pasta"),
      L("요즘 회사에서 늦게까지 일해요.", "What are they doing these days?", ["working late", "resting at home", "traveling"], "working late"),
      L("아침마다 운동을 해요.", "When do they exercise?", ["every morning", "every night", "on weekends only"], "every morning"),
      L("저는 회사에서 일해요.", "Where does the person work?", ["a company", "a school", "a hospital"], "a company"),
      L("이 아파트는 방이 두 개예요.", "How many rooms does the apartment have?", ["two", "one", "three"], "two"),
      L("지하철역이 집에서 가까워요.", "What is close to their house?", ["the subway station", "the bus stop", "the market"], "the subway station"),
      L("이 신발은 너무 작아요.", "What is too small?", ["the shoes", "the shirt", "the bag"], "the shoes"),
      L("감기에 걸려서 오늘 회사에 안 가요.", "Why aren't they going to work today?", ["they have a cold", "they are on vacation", "it is a holiday"], "they have a cold"),
      L("저는 주말마다 등산을 해요.", "What do they do every weekend?", ["go hiking", "go swimming", "go shopping"], "go hiking"),
      L("오늘 오후에 눈이 올 거예요.", "What will happen this afternoon?", ["it will snow", "it will rain", "it will be sunny"], "it will snow"),
      L("저녁으로 김치찌개를 먹었어요.", "What did they eat for dinner?", ["kimchi stew", "bulgogi", "bibimbap"], "kimchi stew"),
      L("이번 주말에 부모님 댁에 갈 거예요.", "Where will they go this weekend?", ["their parents' house", "the beach", "the mountains"], "their parents' house"),
      L("여보세요, 지금 통화 괜찮으세요?", "What are they asking?", ["if it's a good time to talk", "where you are", "what time it is"], "if it's a good time to talk"),
      L("다음 주 화요일에 병원 예약이 있어요.", "When is the hospital appointment?", ["next Tuesday", "this Friday", "tomorrow"], "next Tuesday"),
      L("이 옷은 세일 중이에요.", "What is on sale?", ["these clothes", "these shoes", "this bag"], "these clothes"),
      L("우리 부장님이 오늘 회의를 취소했어요.", "What did the manager do today?", ["cancelled the meeting", "started the meeting", "moved the meeting"], "cancelled the meeting"),
      L("집 근처에 새 마트가 생겼어요.", "What opened near their house?", ["a new mart", "a new gym", "a new cafe"], "a new mart"),
      L("저는 기타 치는 것을 좋아해요.", "What do they enjoy?", ["playing the guitar", "singing", "dancing"], "playing the guitar"),
      L("오늘 아침에 목이 아파요.", "What hurts this morning?", ["their throat", "their stomach", "their leg"], "their throat"),
      L("버스 정류장에서 삼십 분 기다렸어요.", "How long did they wait at the bus stop?", ["thirty minutes", "ten minutes", "one hour"], "thirty minutes"),
      L("이 우산 좀 써도 돼요?", "What are they asking to use?", ["an umbrella", "a pen", "a phone"], "an umbrella"),
      L("치과 예약을 다음 달로 바꿨어요.", "What did they change?", ["the dentist appointment", "the doctor appointment", "the meeting"], "the dentist appointment"),
      L("월세가 너무 비싸서 걱정이에요.", "What are they worried about?", ["the rent is too expensive", "the food is too expensive", "the trip is too expensive"], "the rent is too expensive"),
      L("저는 매주 수영을 배워요.", "What do they learn every week?", ["swimming", "cooking", "painting"], "swimming"),
      L("오늘 미세먼지가 심해요.", "What is bad today?", ["the air quality", "the weather", "the traffic"], "the air quality"),
      L("냉장고에 우유가 없어요.", "What is missing from the fridge?", ["milk", "eggs", "juice"], "milk"),
      L("이번 달에 이사를 할 거예요.", "What will they do this month?", ["move house", "go on a trip", "start a new job"], "move house"),
      L("전화번호를 잘못 눌렀어요.", "What mistake did they make?", ["dialed the wrong number", "sent the wrong message", "called the wrong time"], "dialed the wrong number"),
      L("저는 퇴근하고 헬스장에 가요.", "Where do they go after work?", ["the gym", "the library", "home"], "the gym"),
      L("이 가게는 저녁 아홉 시에 문을 닫아요.", "When does the store close?", ["9 PM", "8 PM", "10 PM"], "9 PM"),
      L("주차장이 꽉 차서 다른 곳에 세웠어요.", "What did they do because the parking lot was full?", ["parked somewhere else", "waited in line", "went home"], "parked somewhere else"),
      L("저는 사진 찍는 취미가 있어요.", "What is their hobby?", ["taking photos", "reading books", "playing games"], "taking photos"),
      L("오늘 하늘이 맑고 따뜻해요.", "How is the weather today?", ["clear and warm", "cloudy and cold", "rainy and windy"], "clear and warm"),
      L("택배가 오늘 도착할 거예요.", "What will arrive today?", ["a package", "a letter", "a guest"], "a package"),
      L("저는 회의 시간에 늦었어요.", "What were they late for?", ["the meeting", "the class", "the flight"], "the meeting"),
      L("이 식당은 예약을 해야 돼요.", "What do you need to do at this restaurant?", ["make a reservation", "pay in cash", "wait outside"], "make a reservation"),
      L("저는 요즘 요리를 배우고 있어요.", "What are they learning these days?", ["cooking", "driving", "dancing"], "cooking"),
      L("안경을 집에 두고 왔어요.", "What did they leave at home?", ["their glasses", "their wallet", "their phone"], "their glasses"),
      L("다음 주에 태풍이 온대요.", "What is coming next week?", ["a typhoon", "a heat wave", "snow"], "a typhoon"),
      L("저는 이번 주말에 친구 결혼식에 가요.", "Where are they going this weekend?", ["a friend's wedding", "a friend's birthday party", "a friend's new house"], "a friend's wedding"),
      L("엘리베이터가 고장 나서 계단으로 올라갔어요.", "Why did they take the stairs?", ["the elevator was broken", "the elevator was full", "they wanted exercise"], "the elevator was broken"),
      L("저는 아침마다 뉴스를 들어요.", "What do they listen to every morning?", ["the news", "music", "a podcast about cooking"], "the news"),

      { kr: "제 남자친구는 요리를 잘해요.", question: "What is true about their boyfriend?", options: ["He cooks well", "He sings well", "He drives well"], answer: "He cooks well" },
      { kr: "우리는 다음 달에 결혼해요.", question: "What are they doing next month?", options: ["getting married", "moving house", "going on a trip"], answer: "getting married" },
      { kr: "저는 여자 친구한테 꽃을 줬어요.", question: "What did they give their girlfriend?", options: ["flowers", "chocolate", "a ring"], answer: "flowers" },
      { kr: "부모님이 이번 주말에 우리 집에 오세요.", question: "Who is coming this weekend?", options: ["their parents", "their coworkers", "their neighbors"], answer: "their parents" },
      { kr: "저는 다음 주에 부산으로 여행을 가요.", question: "Where are they traveling next week?", options: ["Busan", "Jeju", "Seoul"], answer: "Busan" },
      { kr: "공항에 세 시간 일찍 도착했어요.", question: "How early did they arrive at the airport?", options: ["three hours", "one hour", "thirty minutes"], answer: "three hours" },
      { kr: "여권을 잃어버려서 걱정돼요.", question: "Why are they worried?", options: ["they lost their passport", "they missed the flight", "they lost their bag"], answer: "they lost their passport" },
      { kr: "호텔 방이 너무 작아요.", question: "What is the problem with the hotel room?", options: ["it's too small", "it's too expensive", "it's too far"], answer: "it's too small" },
      { kr: "저는 매운 음식을 잘 만들어요.", question: "What can they make well?", options: ["spicy food", "sweet food", "cold noodles"], answer: "spicy food" },
      { kr: "김치찌개를 끓이고 있어요.", question: "What are they cooking?", options: ["kimchi stew", "fried rice", "noodle soup"], answer: "kimchi stew" },
      { kr: "설탕을 너무 많이 넣었어요.", question: "What did they add too much of?", options: ["sugar", "salt", "pepper"], answer: "sugar" },
      { kr: "저는 강아지를 한 마리 키워요.", question: "What kind of pet do they have?", options: ["a dog", "a cat", "a bird"], answer: "a dog" },
      { kr: "고양이가 소파 위에서 자고 있어요.", question: "Where is the cat sleeping?", options: ["on the sofa", "on the bed", "under the table"], answer: "on the sofa" },
      { kr: "매일 저녁에 강아지를 산책시켜요.", question: "When do they walk the dog?", options: ["every evening", "every morning", "only weekends"], answer: "every evening" },
      { kr: "저는 요즘 그림을 배워요.", question: "What are they learning these days?", options: ["painting", "cooking", "singing"], answer: "painting" },
      { kr: "주말마다 등산을 가요.", question: "What do they do every weekend?", options: ["go hiking", "go swimming", "go shopping"], answer: "go hiking" },
      { kr: "저는 사진 찍는 것을 좋아해요.", question: "What do they like doing?", options: ["taking photos", "writing letters", "playing games"], answer: "taking photos" },
      { kr: "은행에서 통장을 만들었어요.", question: "What did they make at the bank?", options: ["a bank account", "a credit card", "a loan"], answer: "a bank account" },
      { kr: "돈을 좀 찾아야 해요.", question: "What do they need to do?", options: ["withdraw money", "deposit money", "borrow money"], answer: "withdraw money" },
      { kr: "이번 달 월세를 아직 안 냈어요.", question: "What haven't they paid yet?", options: ["this month's rent", "the electric bill", "the phone bill"], answer: "this month's rent" },
      { kr: "택배가 오늘 도착할 거예요.", question: "What will arrive today?", options: ["a package", "a letter", "a bill"], answer: "a package" },
      { kr: "편지를 우체국에서 보냈어요.", question: "Where did they send the letter from?", options: ["the post office", "the bank", "the market"], answer: "the post office" },
      { kr: "상자가 너무 무거워요.", question: "What is too heavy?", options: ["the box", "the bag", "the suitcase"], answer: "the box" },
      { kr: "옆집 아저씨가 인사를 했어요.", question: "Who greeted them?", options: ["the man next door", "a coworker", "a taxi driver"], answer: "the man next door" },
      { kr: "위층 사람들이 너무 시끄러워요.", question: "What is too loud?", options: ["the people upstairs", "the street", "the TV"], answer: "the people upstairs" },
      { kr: "이웃한테 설탕을 좀 빌렸어요.", question: "What did they borrow from a neighbor?", options: ["sugar", "eggs", "milk"], answer: "sugar" },
      { kr: "휴대폰 배터리가 다 됐어요.", question: "What happened to their phone?", options: ["the battery died", "it broke", "it got lost"], answer: "the battery died" },
      { kr: "새 핸드폰을 샀어요.", question: "What did they buy?", options: ["a new phone", "a new laptop", "a new watch"], answer: "a new phone" },
      { kr: "문자 메시지를 못 봤어요.", question: "What did they not see?", options: ["a text message", "an email", "a phone call"], answer: "a text message" },
      { kr: "와이파이가 안 돼요.", question: "What is not working?", options: ["the wifi", "the printer", "the TV"], answer: "the wifi" },
      { kr: "오늘 날씨가 정말 좋네요.", question: "What are they saying about the weather?", options: ["it's really nice", "it's really cold", "it's really hot"], answer: "it's really nice" },
      { kr: "요즘 어떻게 지내세요?", question: "What are they asking?", options: ["how have you been", "where do you live", "what do you do"], answer: "how have you been" },
      { kr: "오랜만이에요. 잘 지냈어요?", question: "What is the greeting about?", options: ["it's been a long time", "it's a new job", "it's a birthday"], answer: "it's been a long time" },
      { kr: "저는 형이 한 명 있어요.", question: "Who do they have?", options: ["an older brother", "a younger sister", "a cousin"], answer: "an older brother" },
      { kr: "동생이랑 자주 싸워요.", question: "Who do they often fight with?", options: ["their younger sibling", "their friend", "their neighbor"], answer: "their younger sibling" },
      { kr: "기차표를 미리 예매했어요.", question: "What did they do in advance?", options: ["booked a train ticket", "booked a hotel", "booked a table"], answer: "booked a train ticket" },
      { kr: "짐을 캐리어에 다 쌌어요.", question: "What did they pack?", options: ["the suitcase", "a backpack", "a box"], answer: "the suitcase" },
      { kr: "요즘 기타를 배우고 있어요.", question: "What are they learning?", options: ["guitar", "piano", "drums"], answer: "guitar" },
    ],
    readingCount: 2,
    writingCount: 5,
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
      {
        passage:
          "저는 하늘이에요. 회사원이에요. 매일 아침 일곱 시에 일어나요. 아침을 먹고 버스로 회사에 가요. 오늘은 날씨가 흐려서 우산을 가지고 나왔어요. 저녁에는 집에서 텔레비전을 봐요.",
        questions: [
          { kr: "", question: "What is Haneul's job?", options: ["an office worker", "a student", "a doctor"], answer: "an office worker" },
          { kr: "", question: "How does Haneul get to work?", options: ["by bus", "by subway", "by car"], answer: "by bus" },
          { kr: "", question: "Why did Haneul bring an umbrella?", options: ["the weather was cloudy", "it was raining hard", "the news said so"], answer: "the weather was cloudy" },
          { kr: "", question: "What does Haneul do in the evening?", options: ["watches TV", "goes for a walk", "meets friends"], answer: "watches TV" },
        ],
      },
      {
        passage:
          "예린 씨는 어제 백화점에 갔어요. 친구 선물을 사고 싶었어요. 여러 가게를 구경하고 예쁜 가방을 샀어요. 가방은 조금 비쌌지만 마음에 들었어요. 오늘은 그 가방을 친구에게 줄 거예요.",
        questions: [
          { kr: "", question: "Where did Yerin go yesterday?", options: ["a department store", "a bookstore", "a market"], answer: "a department store" },
          { kr: "", question: "Why did she go there?", options: ["to buy a gift for a friend", "to buy new clothes", "to meet her family"], answer: "to buy a gift for a friend" },
          { kr: "", question: "What did she buy?", options: ["a bag", "a hat", "shoes"], answer: "a bag" },
          { kr: "", question: "What will she do today?", options: ["give the bag to her friend", "return the bag", "buy another gift"], answer: "give the bag to her friend" },
        ],
      },
      {
        passage:
          "현우 씨는 요즘 헬스장에 다녀요. 퇴근 후에 한 시간씩 운동을 해요. 처음에는 힘들었지만 지금은 재미있어요. 주말에는 친구하고 같이 운동하고 같이 밥을 먹어요. 건강이 많이 좋아졌어요.",
        questions: [
          { kr: "", question: "Where does Hyunwoo go these days?", options: ["a gym", "a park", "a pool"], answer: "a gym" },
          { kr: "", question: "When does he exercise on weekdays?", options: ["after work", "before work", "during lunch"], answer: "after work" },
          { kr: "", question: "How did he feel about it at first?", options: ["it was hard", "it was easy", "it was boring"], answer: "it was hard" },
          { kr: "", question: "What does he do with a friend on weekends?", options: ["exercises and eats together", "goes shopping", "watches movies"], answer: "exercises and eats together" },
        ],
      },
      {
        passage:
          "저는 민준이에요. 회사원이에요. 아침 여덟 시에 회사에 도착해요. 컴퓨터로 이메일을 확인하고 회의를 해요. 열두 시에 동료들하고 점심을 먹어요. 오후에는 보고서를 써요. 여섯 시에 퇴근해요.",
        questions: [
          { kr: "", question: "What is Minjun's job?", options: ["an office worker", "a doctor", "a chef"], answer: "an office worker" },
          { kr: "", question: "What does he do first at the office?", options: ["checks his email", "eats lunch", "writes a report"], answer: "checks his email" },
          { kr: "", question: "Who does he eat lunch with?", options: ["his coworkers", "his family", "his friends"], answer: "his coworkers" },
          { kr: "", question: "What time does he leave work?", options: ["six o'clock", "eight o'clock", "twelve o'clock"], answer: "six o'clock" },
        ],
      },
      {
        passage:
          "서연 씨는 어제 마트에 갔어요. 과일하고 채소를 샀어요. 우유도 샀어요. 계산할 때 지갑을 안 가져와서 조금 당황했어요. 다행히 카드가 가방 안에 있었어요. 집에 와서 저녁을 만들었어요.",
        questions: [
          { kr: "", question: "Where did Seoyeon go yesterday?", options: ["a mart", "a bank", "a hospital"], answer: "a mart" },
          { kr: "", question: "What did she buy besides fruit and vegetables?", options: ["milk", "bread", "eggs"], answer: "milk" },
          { kr: "", question: "Why was she flustered at checkout?", options: ["she forgot her wallet", "the price was high", "the store was closed"], answer: "she forgot her wallet" },
          { kr: "", question: "What did she do after coming home?", options: ["made dinner", "went to sleep", "called a friend"], answer: "made dinner" },
        ],
      },
      {
        passage:
          "지호 씨는 토요일에 남산에 갔어요. 케이블카를 타고 올라갔어요. 서울 시내가 아주 잘 보였어요. 사진을 많이 찍었어요. 내려와서 근처 식당에서 떡볶이를 먹었어요. 정말 즐거운 하루였어요.",
        questions: [
          { kr: "", question: "Where did Jiho go on Saturday?", options: ["Namsan", "the beach", "a museum"], answer: "Namsan" },
          { kr: "", question: "How did he go up?", options: ["by cable car", "by bus", "by foot"], answer: "by cable car" },
          { kr: "", question: "What could he see well?", options: ["downtown Seoul", "the ocean", "a mountain village"], answer: "downtown Seoul" },
          { kr: "", question: "What did he eat afterward?", options: ["tteokbokki", "pizza", "noodles"], answer: "tteokbokki" },
        ],
      },
      {
        passage:
          "유나 씨는 요즘 이가 아파요. 그래서 오늘 치과에 갔어요. 의사 선생님이 이를 검사했어요. 충치가 있어서 치료를 받았어요. 조금 아팠지만 참았어요. 의사 선생님이 이를 잘 닦으라고 했어요.",
        questions: [
          { kr: "", question: "Why did Yuna go to the dentist?", options: ["her tooth hurt", "she had a cold", "she hurt her arm"], answer: "her tooth hurt" },
          { kr: "", question: "What did the doctor find?", options: ["a cavity", "a broken tooth", "nothing wrong"], answer: "a cavity" },
          { kr: "", question: "How did the treatment feel?", options: ["a little painful", "not painful at all", "very scary"], answer: "a little painful" },
          { kr: "", question: "What did the doctor tell her to do?", options: ["brush her teeth well", "eat more fruit", "drink more water"], answer: "brush her teeth well" },
        ],
      },
      {
        passage:
          "도윤 씨는 어젯밤에 부모님한테 전화를 했어요. 오랫동안 이야기를 못 해서 반가웠어요. 요즘 회사 일이 바쁘다고 말했어요. 부모님은 건강하게 지내라고 했어요. 다음 달에 고향에 갈 거예요.",
        questions: [
          { kr: "", question: "Who did Doyun call last night?", options: ["his parents", "his boss", "his sister"], answer: "his parents" },
          { kr: "", question: "How did he feel about the call?", options: ["glad", "bored", "worried"], answer: "glad" },
          { kr: "", question: "What did he say about work?", options: ["it is busy these days", "it is very easy", "he lost his job"], answer: "it is busy these days" },
          { kr: "", question: "When will he visit his hometown?", options: ["next month", "next week", "tomorrow"], answer: "next month" },
        ],
      },
      {
        passage:
          "태오 씨는 이번 여름에 부산에 여행을 갔어요. 기차를 타고 세 시간 동안 갔어요. 바다에서 수영을 하고 회를 먹었어요. 밤에는 불꽃놀이를 봤어요. 정말 좋은 여행이었어요.",
        questions: [
          { kr: "", question: "Where did Taeo travel this summer?", options: ["Busan", "Jeju", "Gyeongju"], answer: "Busan" },
          { kr: "", question: "How did he get there?", options: ["by train", "by plane", "by car"], answer: "by train" },
          { kr: "", question: "What did he eat by the sea?", options: ["raw fish", "chicken", "pizza"], answer: "raw fish" },
          { kr: "", question: "What did he watch at night?", options: ["fireworks", "a movie", "a concert"], answer: "fireworks" },
        ],
      },
      {
        passage:
          "지은 씨는 요즘 그림 그리기를 배워요. 일주일에 두 번 학원에 가요. 처음에는 어려웠지만 지금은 재미있어요. 지난주에 처음으로 그림을 완성했어요. 친구들한테 그림을 보여 줬어요.",
        questions: [
          { kr: "", question: "What is Jieun learning these days?", options: ["drawing", "cooking", "dancing"], answer: "drawing" },
          { kr: "", question: "How often does she go to the academy?", options: ["twice a week", "every day", "once a month"], answer: "twice a week" },
          { kr: "", question: "How does she feel about it now?", options: ["it's fun", "it's still hard", "it's boring"], answer: "it's fun" },
          { kr: "", question: "What did she do last week?", options: ["finished a painting", "started a new job", "moved house"], answer: "finished a painting" },
        ],
      },
      {
        passage:
          "소라 씨는 주말에 할머니 댁에 갔어요. 할머니가 맛있는 김치찌개를 만들어 주셨어요. 같이 텔레비전을 보고 이야기를 했어요. 저녁에 할머니께 인사하고 집으로 돌아왔어요.",
        questions: [
          { kr: "", question: "Where did Sora go on the weekend?", options: ["her grandmother's house", "her friend's house", "the countryside"], answer: "her grandmother's house" },
          { kr: "", question: "What did her grandmother make?", options: ["kimchi stew", "bulgogi", "bibimbap"], answer: "kimchi stew" },
          { kr: "", question: "What did they do together?", options: ["watched TV and talked", "went shopping", "cleaned the house"], answer: "watched TV and talked" },
          { kr: "", question: "When did she return home?", options: ["in the evening", "in the morning", "the next day"], answer: "in the evening" },
        ],
      },
      {
        passage:
          "준서 씨는 오늘 새 휴대폰을 샀어요. 예전 휴대폰이 너무 느렸어요. 매장 직원이 친절하게 설명해 줬어요. 색깔은 검은색을 골랐어요. 집에 와서 사진하고 앱을 다시 설치했어요.",
        questions: [
          { kr: "", question: "What did Junseo buy today?", options: ["a new phone", "a new laptop", "a new watch"], answer: "a new phone" },
          { kr: "", question: "Why did he buy it?", options: ["his old phone was too slow", "his old phone broke", "he lost his old phone"], answer: "his old phone was too slow" },
          { kr: "", question: "What color did he choose?", options: ["black", "white", "blue"], answer: "black" },
          { kr: "", question: "What did he do at home?", options: ["reinstalled photos and apps", "called his friends", "went to sleep"], answer: "reinstalled photos and apps" },
        ],
      },
      {
        passage:
          "나윤 씨는 오늘 아침에 늦게 일어났어요. 회사에 늦을까 봐 택시를 탔어요. 길이 막혀서 걱정했어요. 다행히 회의 시간 전에 도착했어요. 동료들이 웃으면서 인사해 줬어요.",
        questions: [
          { kr: "", question: "What happened this morning?", options: ["Nayoon woke up late", "Nayoon missed the bus", "Nayoon lost her keys"], answer: "Nayoon woke up late" },
          { kr: "", question: "Why did she take a taxi?", options: ["she worried about being late", "she didn't like the bus", "it was raining"], answer: "she worried about being late" },
          { kr: "", question: "What worried her on the way?", options: ["heavy traffic", "the taxi fare", "the weather"], answer: "heavy traffic" },
          { kr: "", question: "How did her coworkers greet her?", options: ["smiling", "angrily", "quietly"], answer: "smiling" },
        ],
      },
      {
        passage:
          "다은 씨는 이번 주에 집안일을 많이 했어요. 월요일에는 빨래를 하고 수요일에는 청소를 했어요. 금요일에는 창문을 닦았어요. 집이 깨끗해져서 기분이 좋았어요.",
        questions: [
          { kr: "", question: "What did Daeun do on Monday?", options: ["laundry", "cleaning", "cooking"], answer: "laundry" },
          { kr: "", question: "What did she do on Wednesday?", options: ["cleaning", "laundry", "washing windows"], answer: "cleaning" },
          { kr: "", question: "What did she do on Friday?", options: ["washed the windows", "did laundry", "cooked dinner"], answer: "washed the windows" },
          { kr: "", question: "How did she feel afterward?", options: ["good", "tired and upset", "bored"], answer: "good" },
        ],
      },
      {
        passage:
          "시우 씨는 다음 달에 새 집으로 이사해요. 오늘 이삿짐센터에 전화했어요. 짐을 정리하느라 바빴어요. 안 쓰는 물건은 친구한테 줬어요. 새 집은 회사에서 더 가까워요.",
        questions: [
          { kr: "", question: "When is Siwoo moving?", options: ["next month", "next week", "tomorrow"], answer: "next month" },
          { kr: "", question: "Who did he call today?", options: ["a moving company", "a real estate agent", "his landlord"], answer: "a moving company" },
          { kr: "", question: "What did he give to a friend?", options: ["things he doesn't use", "his old computer", "his car"], answer: "things he doesn't use" },
          { kr: "", question: "How is the new house different?", options: ["it's closer to work", "it's bigger", "it's cheaper"], answer: "it's closer to work" },
        ],
      },
      {
        passage:
          "아린 씨는 오늘 회사 면접을 봤어요. 아침 일찍 일어나서 정장을 입었어요. 조금 긴장했지만 열심히 대답했어요. 면접이 끝난 후에 커피를 마시면서 쉬었어요. 결과는 다음 주에 나와요.",
        questions: [
          { kr: "", question: "What did Arin do today?", options: ["a job interview", "a doctor's appointment", "a wedding"], answer: "a job interview" },
          { kr: "", question: "What did she wear?", options: ["a suit", "a dress", "jeans"], answer: "a suit" },
          { kr: "", question: "How did she feel before the interview?", options: ["a little nervous", "very calm", "sleepy"], answer: "a little nervous" },
          { kr: "", question: "When will she get the results?", options: ["next week", "tomorrow", "today"], answer: "next week" },
        ],
      },
      {
        passage:
          "준영 씨는 오늘 갑자기 비가 와서 우산이 없었어요. 편의점에서 우산을 샀어요. 그래도 신발이 다 젖었어요. 집에 와서 따뜻한 차를 마셨어요. 내일은 날씨가 맑기를 바라요.",
        questions: [
          { kr: "", question: "What problem did Junyoung have today?", options: ["he had no umbrella when it rained", "he lost his umbrella", "his umbrella broke"], answer: "he had no umbrella when it rained" },
          { kr: "", question: "Where did he buy an umbrella?", options: ["a convenience store", "a department store", "a supermarket"], answer: "a convenience store" },
          { kr: "", question: "What got wet?", options: ["his shoes", "his bag", "his phone"], answer: "his shoes" },
          { kr: "", question: "What did he drink at home?", options: ["warm tea", "cold water", "coffee"], answer: "warm tea" },
        ],
      },
      {
        passage:
          "혜진 씨는 강아지를 키워요. 이름은 콩이예요. 매일 아침 콩이하고 산책을 해요. 오늘은 콩이가 아파서 동물병원에 데려갔어요. 수의사 선생님이 괜찮다고 해서 안심했어요.",
        questions: [
          { kr: "", question: "What does Hyejin have?", options: ["a dog", "a cat", "a bird"], answer: "a dog" },
          { kr: "", question: "What does she do every morning?", options: ["walks her dog", "feeds a cat", "goes jogging"], answer: "walks her dog" },
          { kr: "", question: "Why did she take the dog to the vet today?", options: ["the dog was sick", "the dog was lost", "for a checkup only"], answer: "the dog was sick" },
          { kr: "", question: "How did she feel after seeing the vet?", options: ["relieved", "still worried", "angry"], answer: "relieved" },
        ],
      },
      {
        passage:
          "성민 씨는 다음 주가 생일이에요. 친구들이 파티를 준비하고 있어요. 성민 씨는 아직 몰라요. 친구들은 케이크하고 선물을 준비했어요. 파티 장소는 성민 씨 집 근처 카페예요.",
        questions: [
          { kr: "", question: "When is Seongmin's birthday?", options: ["next week", "today", "next month"], answer: "next week" },
          { kr: "", question: "Who is preparing the party?", options: ["his friends", "his parents", "his coworkers"], answer: "his friends" },
          { kr: "", question: "Does Seongmin know about the party?", options: ["no, he doesn't know yet", "yes, he knows everything", "he guessed it"], answer: "no, he doesn't know yet" },
          { kr: "", question: "Where will the party be?", options: ["a cafe near his house", "his office", "a restaurant downtown"], answer: "a cafe near his house" },
        ],
      },
      {
        passage:
          "은지 씨는 오늘 카페에서 영어 공부를 했어요. 노트북으로 온라인 수업을 들었어요. 두 시간 동안 집중해서 공부했어요. 커피를 두 잔 마셨어요. 저녁에는 친구를 만나서 저녁을 먹었어요.",
        questions: [
          { kr: "", question: "What did Eunji study today?", options: ["English", "Korean history", "math"], answer: "English" },
          { kr: "", question: "Where did she study?", options: ["a cafe", "the library", "her office"], answer: "a cafe" },
          { kr: "", question: "How long did she study?", options: ["two hours", "one hour", "three hours"], answer: "two hours" },
          { kr: "", question: "What did she do in the evening?", options: ["met a friend for dinner", "went to bed early", "watched TV"], answer: "met a friend for dinner" },
        ],
      },
      {
        passage:
          "재현 씨는 오늘 머리를 잘랐어요. 미용실 직원이 짧게 잘라 줬어요. 처음에는 어색했지만 곧 마음에 들었어요. 친구들이 잘 어울린다고 말했어요. 기분이 좋아서 사진도 찍었어요.",
        questions: [
          { kr: "", question: "What did Jaehyun do today?", options: ["got a haircut", "bought new glasses", "got a tattoo"], answer: "got a haircut" },
          { kr: "", question: "How was his hair cut?", options: ["short", "long", "colored"], answer: "short" },
          { kr: "", question: "How did he feel about it at first?", options: ["a little awkward", "very happy", "angry"], answer: "a little awkward" },
          { kr: "", question: "What did his friends say?", options: ["it suits him well", "it's too short", "they didn't notice"], answer: "it suits him well" },
        ],
      },
      {
        passage:
          "수아 씨는 감기에 걸려서 오늘 회사를 쉬었어요. 하루 종일 집에서 쉬었어요. 죽을 먹고 약을 먹었어요. 친구가 전화해서 걱정해 줬어요. 내일은 다시 회사에 갈 거예요.",
        questions: [
          { kr: "", question: "Why did Sua stay home from work today?", options: ["she caught a cold", "she was tired", "it was a holiday"], answer: "she caught a cold" },
          { kr: "", question: "What did she eat?", options: ["porridge", "noodles", "bread"], answer: "porridge" },
          { kr: "", question: "Who called her?", options: ["a friend", "her boss", "her doctor"], answer: "a friend" },
          { kr: "", question: "When will she go back to work?", options: ["tomorrow", "next week", "today"], answer: "tomorrow" },
        ],
      },
      {
        passage:
          "동현 씨는 다음 주에 유럽으로 여행을 가요. 오늘은 짐을 쌌어요. 여권하고 비행기 표를 다시 확인했어요. 옷을 너무 많이 넣어서 가방이 무거웠어요. 몇 개를 다시 뺐어요.",
        questions: [
          { kr: "", question: "Where is Donghyun traveling to next week?", options: ["Europe", "Japan", "the United States"], answer: "Europe" },
          { kr: "", question: "What did he do today?", options: ["packed his bag", "bought a ticket", "cleaned his house"], answer: "packed his bag" },
          { kr: "", question: "What did he check again?", options: ["his passport and plane ticket", "his hotel address", "his phone"], answer: "his passport and plane ticket" },
          { kr: "", question: "Why did he take some clothes out?", options: ["the bag was too heavy", "he changed his mind", "they didn't fit"], answer: "the bag was too heavy" },
        ],
      },
      {
        passage:
          "채원 씨는 매일 지하철로 출근해요. 오늘은 사람이 너무 많아서 힘들었어요. 회사까지 삼십 분쯤 걸려요. 지하철에서 음악을 들으면서 가요. 저녁에는 같은 길로 집에 돌아와요.",
        questions: [
          { kr: "", question: "How does Chaewon commute to work?", options: ["by subway", "by bus", "by bike"], answer: "by subway" },
          { kr: "", question: "Why was today hard?", options: ["there were too many people", "the subway was late", "she overslept"], answer: "there were too many people" },
          { kr: "", question: "How long does it take to get to work?", options: ["about thirty minutes", "about one hour", "about ten minutes"], answer: "about thirty minutes" },
          { kr: "", question: "What does she do on the subway?", options: ["listens to music", "reads a book", "sleeps"], answer: "listens to music" },
        ],
      },
      {
        passage:
          "우진 씨는 오늘 처음으로 빵을 만들었어요. 인터넷에서 레시피를 찾았어요. 밀가루하고 설탕, 계란을 섞었어요. 시간이 오래 걸렸지만 맛있게 나왔어요. 가족들이 맛있다고 칭찬했어요.",
        questions: [
          { kr: "", question: "What did Woojin make for the first time today?", options: ["bread", "cake", "cookies"], answer: "bread" },
          { kr: "", question: "Where did he find the recipe?", options: ["the internet", "a cookbook", "his mother"], answer: "the internet" },
          { kr: "", question: "What did he mix together?", options: ["flour, sugar, and eggs", "milk and butter only", "rice and water"], answer: "flour, sugar, and eggs" },
          { kr: "", question: "What did his family say?", options: ["it was delicious", "it was too sweet", "it needed more time"], answer: "it was delicious" },
        ],
      },

      {
        passage:
          "저는 도윤이에요. 다음 주에 시험이 있어요. 요즘 매일 도서관에서 공부해요. 오늘은 아침부터 저녁까지 도서관에 있었어요. 집에 가서 일찍 잘 거예요.",
        questions: [
          { kr: "", question: "When is Dohyun's test?", options: ["next week", "tomorrow", "next month"], answer: "next week" },
          { kr: "", question: "Where does he study these days?", options: ["at the library", "at home", "at a cafe"], answer: "at the library" },
          { kr: "", question: "How long was he at the library today?", options: ["morning to evening", "only in the morning", "only at night"], answer: "morning to evening" },
          { kr: "", question: "What will he do after going home?", options: ["sleep early", "eat dinner out", "watch TV"], answer: "sleep early" },
        ],
      },
      {
        passage:
          "지은 씨는 작년에 회사에서 은퇴했어요. 지금은 매일 아침 베란다에서 화분을 돌봐요. 토마토와 상추를 키워요. 어제는 상추를 처음 땄어요. 이웃에게 상추를 좀 나눠 줬어요.",
        questions: [
          { kr: "", question: "When did Jieun retire?", options: ["last year", "this year", "two years ago"], answer: "last year" },
          { kr: "", question: "What does she do every morning now?", options: ["takes care of plants", "goes for a walk", "reads a newspaper"], answer: "takes care of plants" },
          { kr: "", question: "What does she grow?", options: ["tomatoes and lettuce", "peppers and onions", "flowers"], answer: "tomatoes and lettuce" },
          { kr: "", question: "What did she do with the lettuce?", options: ["shared it with a neighbor", "sold it at a market", "cooked it for dinner"], answer: "shared it with a neighbor" },
        ],
      },
      {
        passage:
          "저는 서연이에요. 지난달에 부산에서 서울로 이사했어요. 아직 동네가 낯설어요. 그래서 주말마다 동네를 산책하면서 구경해요. 오늘은 집 근처에서 작은 빵집을 찾았어요.",
        questions: [
          { kr: "", question: "When did Seoyeon move to Seoul?", options: ["last month", "last week", "yesterday"], answer: "last month" },
          { kr: "", question: "How does she feel about her neighborhood?", options: ["it feels unfamiliar", "it feels very familiar", "it feels boring"], answer: "it feels unfamiliar" },
          { kr: "", question: "What does she do every weekend?", options: ["walks around the neighborhood", "cleans her apartment", "visits her family"], answer: "walks around the neighborhood" },
          { kr: "", question: "What did she find today?", options: ["a small bakery", "a bookstore", "a gym"], answer: "a small bakery" },
        ],
      },
      {
        passage:
          "민준 씨는 강아지가 한 마리 있어요. 이름은 콩이예요. 매일 아침 콩이하고 공원에서 산책해요. 오늘은 비가 와서 짧게 걸었어요. 콩이는 산책 후에 낮잠을 잤어요.",
        questions: [
          { kr: "", question: "What does Minjun have?", options: ["a dog", "a cat", "a bird"], answer: "a dog" },
          { kr: "", question: "Where does he walk his dog every morning?", options: ["at the park", "at home", "on the roof"], answer: "at the park" },
          { kr: "", question: "Why was today's walk short?", options: ["it was raining", "he was tired", "it was too cold"], answer: "it was raining" },
          { kr: "", question: "What did the dog do after the walk?", options: ["took a nap", "ate lunch", "played with a ball"], answer: "took a nap" },
        ],
      },
      {
        passage:
          "유나 씨는 아파트에 살아요. 요즘 윗집이 너무 시끄러워요. 밤늦게까지 소리가 들려요. 어제 관리실에 전화해서 이야기했어요. 오늘 밤은 조용해서 잘 잤어요.",
        questions: [
          { kr: "", question: "Where does Yuna live?", options: ["an apartment", "a house", "a dorm"], answer: "an apartment" },
          { kr: "", question: "What has been a problem these days?", options: ["a noisy upstairs neighbor", "a broken window", "a slow elevator"], answer: "a noisy upstairs neighbor" },
          { kr: "", question: "What did she do yesterday?", options: ["called the management office", "talked to the neighbor directly", "moved to a new apartment"], answer: "called the management office" },
          { kr: "", question: "How did she sleep tonight?", options: ["well, because it was quiet", "badly, because of the noise", "she couldn't sleep at all"], answer: "well, because it was quiet" },
        ],
      },
      {
        passage:
          "저는 지호예요. 요즘 요리를 배워요. 지난주에 처음으로 김치찌개를 만들었어요. 조금 짰지만 맛있었어요. 다음에는 된장찌개를 만들어 볼 거예요.",
        questions: [
          { kr: "", question: "What is Jiho learning these days?", options: ["cooking", "Korean", "painting"], answer: "cooking" },
          { kr: "", question: "What did he make for the first time last week?", options: ["kimchi jjigae", "doenjang jjigae", "bulgogi"], answer: "kimchi jjigae" },
          { kr: "", question: "How did it taste?", options: ["a bit salty but good", "too spicy", "too bland"], answer: "a bit salty but good" },
          { kr: "", question: "What will he try to make next?", options: ["doenjang jjigae", "kimchi jjigae again", "japchae"], answer: "doenjang jjigae" },
        ],
      },
      {
        passage:
          "은지 씨는 매일 아침 여섯 시에 일어나서 뛰어요. 처음에는 십 분만 뛰었지만 지금은 삼십 분을 뛸 수 있어요. 뛰고 나면 기분이 좋아요. 이번 주말에는 첫 마라톤 대회에 나갈 거예요.",
        questions: [
          { kr: "", question: "What time does Eunji wake up every morning?", options: ["six", "seven", "five"], answer: "six" },
          { kr: "", question: "How long can she run now?", options: ["thirty minutes", "ten minutes", "one hour"], answer: "thirty minutes" },
          { kr: "", question: "How does she feel after running?", options: ["good", "tired and upset", "sleepy"], answer: "good" },
          { kr: "", question: "What will she do this weekend?", options: ["run in her first marathon", "rest all day", "start swimming"], answer: "run in her first marathon" },
        ],
      },
      {
        passage:
          "오늘 재현 씨는 친구들하고 소풍을 갈 계획이었어요. 그런데 아침부터 비가 많이 왔어요. 그래서 소풍 대신 집에서 영화를 봤어요. 다음 주에 날씨가 좋으면 다시 소풍을 갈 거예요.",
        questions: [
          { kr: "", question: "What did Jaehyun plan to do today?", options: ["go on a picnic with friends", "study at home", "go to a movie theater"], answer: "go on a picnic with friends" },
          { kr: "", question: "Why did the plan change?", options: ["it rained a lot", "he was sick", "his friends were busy"], answer: "it rained a lot" },
          { kr: "", question: "What did he do instead?", options: ["watched a movie at home", "went shopping", "slept all day"], answer: "watched a movie at home" },
          { kr: "", question: "When might they go on the picnic again?", options: ["next week, if the weather is good", "tomorrow", "next month"], answer: "next week, if the weather is good" },
        ],
      },
      {
        passage:
          "소민 씨는 은퇴한 후에 손주를 자주 봐요. 오늘은 손주하고 놀이터에 갔어요. 손주는 그네를 타고 미끄럼틀도 탔어요. 두 시간 동안 놀고 아이스크림을 먹었어요.",
        questions: [
          { kr: "", question: "What does Somin often do since retiring?", options: ["look after her grandchild", "travel abroad", "volunteer at school"], answer: "look after her grandchild" },
          { kr: "", question: "Where did they go today?", options: ["a playground", "a museum", "a zoo"], answer: "a playground" },
          { kr: "", question: "What did the grandchild do there?", options: ["rode the swing and slide", "played soccer", "read books"], answer: "rode the swing and slide" },
          { kr: "", question: "What did they do after playing?", options: ["ate ice cream", "went home to sleep", "had lunch at a restaurant"], answer: "ate ice cream" },
        ],
      },
      {
        passage:
          "저는 우진이에요. 이 동네로 이사 온 지 한 달 됐어요. 지난 주말에 옆집 아저씨를 처음 만났어요. 아저씨가 저한테 커피를 주셨어요. 이제 이 동네가 조금 편해졌어요.",
        questions: [
          { kr: "", question: "How long has Woojin lived in this neighborhood?", options: ["one month", "one week", "one year"], answer: "one month" },
          { kr: "", question: "Who did he meet last weekend?", options: ["his next-door neighbor", "his coworker", "his landlord"], answer: "his next-door neighbor" },
          { kr: "", question: "What did the neighbor give him?", options: ["coffee", "bread", "fruit"], answer: "coffee" },
          { kr: "", question: "How does he feel about the neighborhood now?", options: ["more comfortable", "still uncomfortable", "he wants to move again"], answer: "more comfortable" },
        ],
      },
      {
        passage:
          "하은 씨는 고양이 한 마리를 키워요. 이름은 두부예요. 두부는 하루에 열여섯 시간을 자요. 저녁에는 창문 옆에서 밖을 봐요. 하은 씨는 두부가 자는 모습을 보면 마음이 편해져요.",
        questions: [
          { kr: "", question: "What does Haeun have as a pet?", options: ["a cat", "a dog", "a rabbit"], answer: "a cat" },
          { kr: "", question: "How many hours a day does the cat sleep?", options: ["sixteen hours", "eight hours", "twelve hours"], answer: "sixteen hours" },
          { kr: "", question: "What does the cat do in the evening?", options: ["looks outside by the window", "plays with a toy", "eats dinner"], answer: "looks outside by the window" },
          { kr: "", question: "How does Haeun feel watching the cat sleep?", options: ["comfortable", "bored", "worried"], answer: "comfortable" },
        ],
      },
      {
        passage:
          "준서 씨가 사는 아파트는 오늘 엘리베이터가 고장 났어요. 준서 씨는 십 층에 살아요. 그래서 계단으로 걸어서 올라갔어요. 조금 힘들었지만 운동이 됐어요. 내일은 엘리베이터가 고쳐진다고 해요.",
        questions: [
          { kr: "", question: "What happened at Junseo's apartment today?", options: ["the elevator broke down", "the water stopped", "the power went out"], answer: "the elevator broke down" },
          { kr: "", question: "What floor does he live on?", options: ["the tenth floor", "the fifth floor", "the first floor"], answer: "the tenth floor" },
          { kr: "", question: "How did he get to his apartment?", options: ["walked up the stairs", "waited for the elevator", "took a taxi"], answer: "walked up the stairs" },
          { kr: "", question: "When will the elevator be fixed?", options: ["tomorrow", "today", "next week"], answer: "tomorrow" },
        ],
      },
      {
        passage:
          "나윤 씨는 오늘 처음으로 빵을 만들었어요. 유튜브를 보면서 따라 했어요. 반죽이 잘 안 돼서 두 시간이나 걸렸어요. 그래도 빵이 잘 나와서 기뻤어요. 내일은 회사 동료들에게 나눠 줄 거예요.",
        questions: [
          { kr: "", question: "What did Nayoon make for the first time today?", options: ["bread", "cake", "cookies"], answer: "bread" },
          { kr: "", question: "How did she learn to make it?", options: ["watching a YouTube video", "reading a cookbook", "asking her mother"], answer: "watching a YouTube video" },
          { kr: "", question: "Why did it take two hours?", options: ["the dough didn't work well at first", "her oven was broken", "she made too much"], answer: "the dough didn't work well at first" },
          { kr: "", question: "What will she do tomorrow?", options: ["share the bread with coworkers", "make bread again", "eat it all herself"], answer: "share the bread with coworkers" },
        ],
      },
      {
        passage:
          "성민 씨는 요즘 수영을 배워요. 처음에는 물이 무서웠어요. 그런데 선생님이 친절하게 가르쳐 줬어요. 이제는 자유형을 잘해요. 다음 달에는 배영도 배울 거예요.",
        questions: [
          { kr: "", question: "What is Seongmin learning these days?", options: ["swimming", "running", "tennis"], answer: "swimming" },
          { kr: "", question: "How did he feel about the water at first?", options: ["scared", "excited", "bored"], answer: "scared" },
          { kr: "", question: "What can he do well now?", options: ["freestyle", "backstroke", "diving"], answer: "freestyle" },
          { kr: "", question: "What will he learn next month?", options: ["backstroke", "freestyle", "diving"], answer: "backstroke" },
        ],
      },
      {
        passage:
          "어젯밤부터 눈이 많이 왔어요. 아린 씨는 오늘 밖에 나가지 않고 집에서 쉬었어요. 창밖으로 눈이 쌓이는 걸 봤어요. 따뜻한 차를 마시면서 책을 읽었어요. 내일은 눈사람을 만들고 싶어요.",
        questions: [
          { kr: "", question: "What has been happening since last night?", options: ["it has been snowing a lot", "it has been raining", "it has been windy"], answer: "it has been snowing a lot" },
          { kr: "", question: "What did Arin do today?", options: ["rested at home", "went to work", "went shopping"], answer: "rested at home" },
          { kr: "", question: "What did she do while drinking warm tea?", options: ["read a book", "watched TV", "called a friend"], answer: "read a book" },
          { kr: "", question: "What does she want to do tomorrow?", options: ["make a snowman", "go skiing", "clean the house"], answer: "make a snowman" },
        ],
      },
      {
        passage:
          "저는 동현이에요. 다음 달에 큰 시험이 있어요. 그래서 친구들하고 같이 공부해요. 우리는 일주일에 세 번 카페에서 만나요. 서로 모르는 것을 가르쳐 줘서 도움이 많이 돼요.",
        questions: [
          { kr: "", question: "When is Donghyun's big test?", options: ["next month", "next week", "tomorrow"], answer: "next month" },
          { kr: "", question: "Who does he study with?", options: ["his friends", "his teacher", "his family"], answer: "his friends" },
          { kr: "", question: "How often do they meet at the cafe?", options: ["three times a week", "every day", "once a week"], answer: "three times a week" },
          { kr: "", question: "Why is studying together helpful?", options: ["they teach each other what they don't know", "the cafe is quiet", "it's cheaper than studying alone"], answer: "they teach each other what they don't know" },
        ],
      },
      {
        passage:
          "채원 씨는 은퇴한 후에 동네 도서관에서 봉사를 해요. 일주일에 두 번 아이들에게 책을 읽어 줘요. 아이들이 이야기를 좋아해서 채원 씨도 즐거워요. 다음 주에는 새로운 동화책을 준비할 거예요.",
        questions: [
          { kr: "", question: "What does Chaewon do since retiring?", options: ["volunteers at the local library", "works at a school", "teaches piano"], answer: "volunteers at the local library" },
          { kr: "", question: "How often does she read to children?", options: ["twice a week", "every day", "once a month"], answer: "twice a week" },
          { kr: "", question: "Why does she enjoy it?", options: ["the children love the stories", "it pays well", "it's close to her home"], answer: "the children love the stories" },
          { kr: "", question: "What will she prepare next week?", options: ["a new picture book", "a birthday party", "a school trip"], answer: "a new picture book" },
        ],
      },
      {
        passage:
          "규현 씨는 이 도시로 이사 온 지 얼마 안 됐어요. 어제 동네를 걷다가 작은 카페를 발견했어요. 커피가 맛있고 조용해서 마음에 들었어요. 이제 그 카페는 규현 씨가 가장 좋아하는 장소가 됐어요.",
        questions: [
          { kr: "", question: "How long has Gyuhyun lived in this city?", options: ["not long", "ten years", "five years"], answer: "not long" },
          { kr: "", question: "What did he discover yesterday?", options: ["a small cafe", "a bookstore", "a park"], answer: "a small cafe" },
          { kr: "", question: "Why did he like it?", options: ["the coffee was good and it was quiet", "it was cheap", "it was near his office"], answer: "the coffee was good and it was quiet" },
          { kr: "", question: "What has the cafe become for him?", options: ["his favorite place", "his workplace", "a place he avoids"], answer: "his favorite place" },
        ],
      },
      {
        passage:
          "다은 씨는 집에 작은 어항이 있어요. 물고기 세 마리를 키워요. 일주일에 한 번 어항 물을 갈아 줘요. 오늘은 물을 갈아 주고 물고기 밥도 새로 샀어요. 물고기들이 건강해 보여서 기뻤어요.",
        questions: [
          { kr: "", question: "What does Daeun have at home?", options: ["a small fish tank", "a bird cage", "a flower pot"], answer: "a small fish tank" },
          { kr: "", question: "How many fish does she keep?", options: ["three", "two", "five"], answer: "three" },
          { kr: "", question: "How often does she change the water?", options: ["once a week", "every day", "once a month"], answer: "once a week" },
          { kr: "", question: "What did she buy today?", options: ["fish food", "a new fish", "a new tank"], answer: "fish food" },
        ],
      },
      {
        passage:
          "승우 씨가 사는 아파트에는 공용 세탁실이 있어요. 주말에는 사람이 많아서 오래 기다려야 해요. 오늘은 평일이라서 세탁기가 비어 있었어요. 빨래를 빨리 끝내고 집에 돌아왔어요.",
        questions: [
          { kr: "", question: "What does Seungwoo's apartment have?", options: ["a shared laundry room", "a shared gym", "a shared kitchen"], answer: "a shared laundry room" },
          { kr: "", question: "When is it usually crowded?", options: ["on weekends", "on weekday mornings", "at night"], answer: "on weekends" },
          { kr: "", question: "Why was it empty today?", options: ["it was a weekday", "it was too early", "the machines were broken"], answer: "it was a weekday" },
          { kr: "", question: "What did he do after finishing the laundry?", options: ["went back home", "went to work", "met a friend"], answer: "went back home" },
        ],
      },
      {
        passage:
          "혜진 씨는 오늘 친구를 집에 초대했어요. 아침부터 시장에 가서 재료를 샀어요. 불고기와 잡채를 만들었어요. 친구가 맛있게 먹어서 기분이 좋았어요. 다음에는 다른 요리도 해 보고 싶어요.",
        questions: [
          { kr: "", question: "What did Hyejin do today?", options: ["invited a friend over", "went to a friend's house", "ate out with a friend"], answer: "invited a friend over" },
          { kr: "", question: "Where did she go in the morning?", options: ["the market", "the mall", "the bakery"], answer: "the market" },
          { kr: "", question: "What did she cook?", options: ["bulgogi and japchae", "kimchi jjigae", "bibimbap"], answer: "bulgogi and japchae" },
          { kr: "", question: "How did she feel when her friend enjoyed the food?", options: ["good", "tired", "nervous"], answer: "good" },
        ],
      },
      {
        passage:
          "태오 씨는 퇴근 후에 요가 수업을 들어요. 처음에는 동작이 어려웠지만 지금은 많이 늘었어요. 요가를 하면 하루의 스트레스가 풀려요. 오늘도 수업이 끝나고 몸이 가벼워졌어요.",
        questions: [
          { kr: "", question: "When does Taeo take a yoga class?", options: ["after work", "before work", "on weekends only"], answer: "after work" },
          { kr: "", question: "How were the poses at first?", options: ["difficult", "easy", "boring"], answer: "difficult" },
          { kr: "", question: "What does yoga do for him?", options: ["relieves his stress", "makes him hungry", "makes him sleepy"], answer: "relieves his stress" },
          { kr: "", question: "How did he feel after class today?", options: ["light", "heavy and tired", "sad"], answer: "light" },
        ],
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
      L("여권을 갱신하려고 구청에 갔어요.", "Why did they go to the district office?", ["to renew their passport", "to pay a bill", "to register a car"], "to renew their passport"),
      L("버스를 놓쳐서 택시를 탔어요.", "Why did they take a taxi?", ["they missed the bus", "the bus was full", "it was raining"], "they missed the bus"),
      L("돈이 부족해서 친구한테 좀 빌렸어요.", "What did they do because they were short on money?", ["borrowed some from a friend", "asked for a raise", "sold something"], "borrowed some from a friend"),
      L("이 집은 회사에서 가까워서 마음에 들어요.", "Why do they like this place?", ["it's close to work", "it's cheap", "it's quiet"], "it's close to work"),
      L("요즘 유튜브를 보면서 요리를 배우고 있어요.", "How are they learning to cook?", ["by watching YouTube", "by taking a class", "from a cookbook"], "by watching YouTube"),
      L("매달 조금씩 저축하려고 노력하고 있어요.", "What are they trying to do?", ["save a little each month", "spend less on food", "find a second job"], "save a little each month"),
      L("마감이 얼마 안 남아서 요즘 바빠요.", "Why are they busy these days?", ["the deadline is close", "they started a new job", "they are traveling"], "the deadline is close"),
      L("더 좋은 조건 때문에 이직을 결심했어요.", "Why did they decide to change jobs?", ["better conditions", "a shorter commute", "a friend's advice"], "better conditions"),
      L("여행 가기 전에 짐을 미리 싸 놨어요.", "What did they do before the trip?", ["packed in advance", "booked a hotel", "bought new clothes"], "packed in advance"),
      L("감기에 걸려서 며칠 동안 푹 쉬었어요.", "What did they do because they caught a cold?", ["rested for several days", "went to work anyway", "took a trip"], "rested for several days"),
      L("오랜만에 할머니 댁에 다녀왔어요.", "Where did they visit after a long time?", ["their grandmother's house", "their uncle's house", "an old friend's house"], "their grandmother's house"),
      L("친구 생일 파티를 준비하느라 정신이 없었어요.", "Why were they so busy?", ["preparing a friend's birthday party", "moving to a new house", "studying for a test"], "preparing a friend's birthday party"),
      { kr: "월세가 너무 올라서 다른 집을 알아보고 있어요.", question: "Why are they looking for another place?", options: ["the rent went up too much", "the landlord asked them to leave", "the apartment is too small"], answer: "the rent went up too much" },
      { kr: "엘리베이터가 고장 나서 계단으로 올라갔어요.", question: "Why did they take the stairs?", options: ["the elevator was broken", "they wanted exercise", "the elevator was too crowded"], answer: "the elevator was broken" },
      { kr: "지하철이 고장 나서 삼십 분 동안 기다렸어요.", question: "Why did they wait 30 minutes?", options: ["the subway broke down", "they missed the train", "the station was closed"], answer: "the subway broke down" },
      { kr: "출근 시간에는 길이 너무 막혀서 버스보다 지하철이 나아요.", question: "Why is the subway better during commute hours?", options: ["the roads are too congested", "the bus fare is higher", "the bus doesn't stop nearby"], answer: "the roads are too congested" },
      { kr: "이번 주말에 이사할 집을 미리 청소해 놓으려고요.", question: "What are they planning to do this weekend?", options: ["clean the new place in advance", "sign the lease", "buy new furniture"], answer: "clean the new place in advance" },
      { kr: "치과에 예약을 했는데 갑자기 일이 생겨서 취소해야 해요.", question: "Why do they need to cancel?", options: ["something came up suddenly", "the dentist is closed", "they feel better now"], answer: "something came up suddenly" },
      { kr: "머리가 아프고 열이 나서 오늘은 병원에 가 보려고요.", question: "Why are they going to the hospital today?", options: ["headache and fever", "a stomachache", "a sore throat"], answer: "headache and fever" },
      { kr: "세일 기간이라서 옷을 몇 벌 싸게 샀어요.", question: "Why did they buy clothes cheaply?", options: ["it was a sale period", "it was a clearance store", "they used a coupon"], answer: "it was a sale period" },
      { kr: "마트에 갔는데 우유가 다 떨어져서 못 샀어요.", question: "Why couldn't they buy milk?", options: ["it was sold out", "the store was closed", "it was too expensive"], answer: "it was sold out" },
      { kr: "이번 달에는 외식을 줄이고 집에서 요리를 더 많이 하려고 해요.", question: "What are they trying to do this month?", options: ["cook at home more instead of eating out", "eat out more often", "order delivery more"], answer: "cook at home more instead of eating out" },
      { kr: "요즘 등산에 빠져서 주말마다 산에 가요.", question: "What are they into these days?", options: ["hiking", "cycling", "swimming"], answer: "hiking" },
      { kr: "그림 그리는 게 취미인데 요즘은 시간이 없어서 못 그려요.", question: "Why haven't they been painting?", options: ["they don't have time", "they lost interest", "they ran out of supplies"], answer: "they don't have time" },
      { kr: "오늘 날씨가 갑자기 추워져서 두꺼운 옷을 꺼내 입었어요.", question: "What did they do because it got suddenly cold?", options: ["put on thick clothes", "stayed home all day", "turned on the heater"], answer: "put on thick clothes" },
      { kr: "미세먼지가 심해서 오늘은 마스크를 쓰고 나갔어요.", question: "Why did they wear a mask?", options: ["fine dust was bad", "they had a cold", "it was raining"], answer: "fine dust was bad" },
      { kr: "전화를 걸었는데 계속 통화 중이어서 문자를 보냈어요.", question: "Why did they send a text?", options: ["the line was busy", "no one answered", "their phone died"], answer: "the line was busy" },
      { kr: "회사에서 전화가 와서 급하게 회의 자료를 준비했어요.", question: "Why did they prepare materials in a hurry?", options: ["they got a call from work", "their boss visited", "the deadline changed"], answer: "they got a call from work" },
      { kr: "약속 시간에 늦을 것 같아서 미리 전화로 알렸어요.", question: "Why did they call ahead?", options: ["to say they'd be late", "to cancel the appointment", "to change the location"], answer: "to say they'd be late" },
      { kr: "이번 주말에는 특별한 계획 없이 집에서 푹 쉬려고 해요.", question: "What are their weekend plans?", options: ["rest at home with no plans", "go on a trip", "meet friends downtown"], answer: "rest at home with no plans" },
      { kr: "다음 주말에 친구들이랑 캠핑을 가기로 했어요.", question: "What are they doing next weekend?", options: ["going camping with friends", "having a house party", "going to a concert"], answer: "going camping with friends" },
      { kr: "부장님이 갑자기 회의 시간을 앞당겼어요.", question: "What did the manager do?", options: ["moved the meeting earlier", "canceled the meeting", "postponed the meeting"], answer: "moved the meeting earlier" },
      { kr: "이번 프로젝트를 맡게 돼서 요즘 야근이 많아요.", question: "Why are they working overtime a lot?", options: ["they took on a new project", "a coworker quit", "the office moved"], answer: "they took on a new project" },
      { kr: "면접을 보러 가는데 너무 긴장돼서 손이 떨려요.", question: "Why are their hands shaking?", options: ["they're nervous about an interview", "they're cold", "they didn't sleep well"], answer: "they're nervous about an interview" },
      { kr: "월급이 올라서 이번 달부터 적금을 하나 더 들려고요.", question: "What are they doing because their salary went up?", options: ["starting another savings account", "buying a new car", "moving to a bigger apartment"], answer: "starting another savings account" },
      { kr: "세탁기가 고장 나서 수리 기사를 불렀어요.", question: "Why did they call a repair technician?", options: ["the washing machine broke", "the fridge broke", "the boiler broke"], answer: "the washing machine broke" },
      { kr: "옆집이 너무 시끄러워서 밤에 잠을 잘 못 잤어요.", question: "Why couldn't they sleep well?", options: ["the neighbors were noisy", "it was too hot", "there was a storm"], answer: "the neighbors were noisy" },
      { kr: "이 식당은 항상 사람이 많아서 예약을 하고 가야 해요.", question: "What do you need to do at this restaurant?", options: ["make a reservation", "wait in line", "pay in cash only"], answer: "make a reservation" },
      { kr: "새로 생긴 카페 커피가 맛있다고 소문이 나서 가 봤어요.", question: "Why did they go to the new cafe?", options: ["they heard the coffee was good", "it was close to home", "a friend recommended the pastries"], answer: "they heard the coffee was good" },
      { kr: "휴대폰 요금제를 바꾸려고 대리점에 들렀어요.", question: "Why did they stop by the phone store?", options: ["to change their phone plan", "to buy a new phone", "to fix a broken screen"], answer: "to change their phone plan" },
      { kr: "인터넷이 갑자기 안 돼서 고객센터에 전화했어요.", question: "Why did they call customer service?", options: ["the internet suddenly stopped working", "their bill was wrong", "they wanted to cancel service"], answer: "the internet suddenly stopped working" },
      { kr: "허리가 아파서 요가를 배우기 시작했어요.", question: "Why did they start yoga?", options: ["their back hurt", "they wanted to lose weight", "a doctor recommended it"], answer: "their back hurt" },
      { kr: "환절기라서 그런지 감기 걸린 사람이 많아요.", question: "Why are many people catching colds?", options: ["it's the change of seasons", "the office is too cold", "there's a virus going around"], answer: "it's the change of seasons" },
      { kr: "이 옷을 환불하고 싶은데 영수증을 잃어버렸어요.", question: "What's the problem with returning the clothes?", options: ["they lost the receipt", "the store is closed", "the item is damaged"], answer: "they lost the receipt" },
      { kr: "정류장에서 버스를 기다리는데 비가 와서 다 젖었어요.", question: "Why did they get wet?", options: ["it rained while they waited for the bus", "they forgot their umbrella at home", "the bus was late by an hour"], answer: "it rained while they waited for the bus" },
      { kr: "요즘 배드민턴 동호회에 가입해서 매주 두 번씩 운동해요.", question: "What are they doing twice a week?", options: ["playing badminton with a club", "going to the gym alone", "taking a swimming class"], answer: "playing badminton with a club" },
      { kr: "치킨을 시켰는데 배달이 너무 늦게 왔어요.", question: "What was the problem?", options: ["the delivery was very late", "they got the wrong order", "the food was cold"], answer: "the delivery was very late" },
      { kr: "안과에 가서 시력 검사를 받고 새 안경을 맞췄어요.", question: "What did they do at the eye clinic?", options: ["got an eye exam and new glasses", "got contact lenses", "had eye surgery"], answer: "got an eye exam and new glasses" },
      { kr: "이번 주에 날씨가 좋아서 창문을 열고 이불을 말렸어요.", question: "What did they do because the weather was nice?", options: ["aired out their blankets by the window", "went for a picnic", "washed the car"], answer: "aired out their blankets by the window" },
      { kr: "다음 달에 있을 발표 때문에 요즘 자료 조사를 하고 있어요.", question: "Why are they researching these days?", options: ["for a presentation next month", "for a school assignment", "for a job application"], answer: "for a presentation next month" },

      { kr: "남자친구랑 싸워서 요즘 기분이 안 좋아요.", question: "Why does she feel bad these days?", options: ["she had a fight with her boyfriend", "she lost her job", "she failed a test"], answer: "she had a fight with her boyfriend" },
      { kr: "여자친구한테 프러포즈하려고 반지를 준비했어요.", question: "What did he prepare?", options: ["a ring to propose", "a birthday cake", "concert tickets"], answer: "a ring to propose" },
      { kr: "부모님께 남자친구를 소개하기로 했어요.", question: "What did she decide to do?", options: ["introduce her boyfriend to her parents", "move in with her parents", "call her parents"], answer: "introduce her boyfriend to her parents" },
      { kr: "이번 휴가에는 유럽으로 배낭여행을 갈 거예요.", question: "What kind of trip are they planning?", options: ["a backpacking trip to Europe", "a business trip to Japan", "a family trip to Jeju"], answer: "a backpacking trip to Europe" },
      { kr: "환전을 하려고 은행에 들렀어요.", question: "Why did they stop by the bank?", options: ["to exchange currency", "to open an account", "to pay a loan"], answer: "to exchange currency" },
      { kr: "여행 중에 여권을 잃어버려서 정말 당황했어요.", question: "What happened during the trip?", options: ["they lost their passport", "they missed a flight", "they got sick"], answer: "they lost their passport" },
      { kr: "오늘 저녁에는 된장찌개를 끓여 보려고요.", question: "What are they going to cook tonight?", options: ["doenjang stew", "fried rice", "noodle soup"], answer: "doenjang stew" },
      { kr: "요리할 때 간을 맞추는 게 제일 어려워요.", question: "What is the hardest part of cooking for them?", options: ["seasoning the food right", "chopping vegetables", "timing everything"], answer: "seasoning the food right" },
      { kr: "고양이한테 밥을 주는 걸 깜빡했어요.", question: "What did they forget to do?", options: ["feed the cat", "walk the dog", "clean the fish tank"], answer: "feed the cat" },
      { kr: "강아지를 입양한 지 한 달 됐어요.", question: "How long ago did they adopt the dog?", options: ["a month ago", "a week ago", "a year ago"], answer: "a month ago" },
      { kr: "취미로 그림을 그리기 시작했어요.", question: "What hobby did they start?", options: ["painting", "photography", "pottery"], answer: "painting" },
      { kr: "주말마다 클라이밍을 하러 다녀요.", question: "What do they do every weekend?", options: ["go rock climbing", "go swimming", "go hiking"], answer: "go rock climbing" },
      { kr: "적금을 들려고 은행 상담을 받았어요.", question: "Why did they get advice at the bank?", options: ["to open a savings plan", "to apply for a loan", "to report a lost card"], answer: "to open a savings plan" },
      { kr: "신용카드를 잃어버려서 은행에 전화했어요.", question: "Why did they call the bank?", options: ["they lost their credit card", "they want a new account", "they need a loan"], answer: "they lost their credit card" },
      { kr: "택배가 안 와서 배송 조회를 해 봤어요.", question: "Why did they check the delivery status?", options: ["the package hadn't arrived", "they returned an item", "they sent a gift"], answer: "the package hadn't arrived" },
      { kr: "우체국에서 소포를 부치고 왔어요.", question: "What did they do at the post office?", options: ["sent a package", "bought stamps", "opened an account"], answer: "sent a package" },
      { kr: "옆집 아저씨가 이사 떡을 가져다주셨어요.", question: "What did the neighbor bring over?", options: ["rice cakes for moving in", "fresh vegetables", "a housewarming gift card"], answer: "rice cakes for moving in" },
      { kr: "윗집이 너무 시끄러워서 잠을 못 잤어요.", question: "Why couldn't they sleep?", options: ["the upstairs neighbor was too noisy", "the heater was broken", "they had a headache"], answer: "the upstairs neighbor was too noisy" },
      { kr: "휴대폰이 고장 나서 서비스 센터에 맡겼어요.", question: "Why did they go to the service center?", options: ["their phone broke", "they wanted a new number", "they lost their charger"], answer: "their phone broke" },
      { kr: "새 휴대폰으로 바꾸려고 통신사에 갔어요.", question: "Why did they go to the phone carrier?", options: ["to switch to a new phone", "to cancel their plan", "to pay a bill"], answer: "to switch to a new phone" },
      { kr: "와이파이가 자꾸 끊겨서 답답해요.", question: "What is frustrating them?", options: ["the wifi keeps disconnecting", "the phone battery dies fast", "the internet bill is too high"], answer: "the wifi keeps disconnecting" },
      { kr: "엘리베이터에서 이웃을 만나서 인사했어요.", question: "What happened in the elevator?", options: ["they greeted a neighbor", "they got stuck", "they missed their floor"], answer: "they greeted a neighbor" },
      { kr: "오랜만에 만난 친구랑 카페에서 수다를 떨었어요.", question: "What did they do at the cafe?", options: ["chatted with a friend", "studied alone", "worked on a laptop"], answer: "chatted with a friend" },
      { kr: "날씨 얘기를 하다가 자연스럽게 친해졌어요.", question: "How did they become close?", options: ["by chatting about the weather", "by working on a project together", "by living next door"], answer: "by chatting about the weather" },
      { kr: "결혼기념일이라서 특별한 저녁을 준비했어요.", question: "Why did they prepare a special dinner?", options: ["it's their wedding anniversary", "it's a birthday", "it's a promotion"], answer: "it's their wedding anniversary" },
      { kr: "부부 싸움을 하고 나서 서로 사과했어요.", question: "What did they do after the argument?", options: ["apologized to each other", "stopped talking", "called a friend"], answer: "apologized to each other" },
      { kr: "여행지에서 현지 음식을 많이 먹어 봤어요.", question: "What did they try a lot of during the trip?", options: ["local food", "local music", "local clothing"], answer: "local food" },
      { kr: "공항에서 수하물을 부치는 데 시간이 오래 걸렸어요.", question: "What took a long time at the airport?", options: ["checking in luggage", "going through security", "boarding the plane"], answer: "checking in luggage" },
      { kr: "새로운 레시피로 파스타를 만들어 봤어요.", question: "What did they cook with a new recipe?", options: ["pasta", "curry", "pizza"], answer: "pasta" },
      { kr: "오븐이 없어서 에어프라이어로 요리해요.", question: "What do they cook with since they have no oven?", options: ["an air fryer", "a microwave", "a rice cooker"], answer: "an air fryer" },
      { kr: "강아지 산책을 시키다가 이웃을 만났어요.", question: "When did they run into a neighbor?", options: ["while walking the dog", "while doing laundry", "while gardening"], answer: "while walking the dog" },
      { kr: "고양이가 아파서 동물병원에 데려갔어요.", question: "Why did they take the cat to the vet?", options: ["the cat was sick", "the cat needed a checkup only", "the cat needed grooming"], answer: "the cat was sick" },
      { kr: "뜨개질을 배우려고 동호회에 가입했어요.", question: "Why did they join the club?", options: ["to learn knitting", "to learn cooking", "to learn dancing"], answer: "to learn knitting" },
      { kr: "사진 찍는 게 취미라서 카메라를 새로 샀어요.", question: "Why did they buy a new camera?", options: ["photography is their hobby", "their old one broke", "it was on sale"], answer: "photography is their hobby" },
      { kr: "계좌 이체를 하려는데 앱이 자꾸 오류가 나요.", question: "What problem are they having?", options: ["the banking app keeps giving errors", "they forgot their password", "the bank is closed"], answer: "the banking app keeps giving errors" },
      { kr: "택배 상자가 파손돼서 교환을 신청했어요.", question: "Why did they request an exchange?", options: ["the package box was damaged", "the wrong item arrived", "the item was too small"], answer: "the package box was damaged" },
      { kr: "새 스마트워치 사용법을 배우고 있어요.", question: "What are they learning to use?", options: ["a smartwatch", "a laptop", "a printer"], answer: "a smartwatch" },
      { kr: "이웃과 층간 소음 문제로 얘기를 나눴어요.", question: "What did they talk with their neighbor about?", options: ["noise between floors", "parking spaces", "trash disposal"], answer: "noise between floors" },
    ],
    readingCount: 2,
    writingCount: 5,
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
      {
        passage:
          "지난달에 이사를 했어요. 예전 집보다 방이 넓고 회사에서도 가까워서 아침에 더 여유가 생겼어요. 그런데 새 동네는 아직 낯설어서 마트나 병원이 어디 있는지 잘 몰라요. 이웃 사람들은 친절해서 이사한 첫날에 떡을 나눠 주기도 했어요. 조금씩 동네에 익숙해지고 있어서 다행이에요.",
        questions: [
          R("What is bigger about the new place?", ["the rooms", "the kitchen", "the balcony"], "the rooms"),
          R("What changed about the writer's mornings?", ["they have more time", "they wake up later", "they have less time"], "they have more time"),
          R("What is the problem with the new neighborhood?", ["it still feels unfamiliar", "it's too noisy", "it's too far from work"], "it still feels unfamiliar"),
          R("What did the neighbors do on moving day?", ["shared rice cakes", "helped carry boxes", "invited them to dinner"], "shared rice cakes"),
          R("How does the writer feel now?", ["glad to be getting used to the area", "still very uncomfortable", "planning to move again"], "glad to be getting used to the area"),
        ],
      },
      {
        passage:
          "저는 여섯 달 전부터 기타를 배우고 있어요. 처음에는 손가락이 아파서 한 시간도 연습하기 힘들었어요. 그래도 매일 삼십 분씩 연습했더니 지금은 좋아하는 노래를 한 곡 칠 수 있게 됐어요. 다음 달에는 학원 발표회가 있어서 요즘 더 열심히 연습하고 있어요. 사람들 앞에서 연주하는 건 처음이라 조금 떨려요.",
        questions: [
          R("How long has the writer been learning guitar?", ["six months", "six weeks", "a year"], "six months"),
          R("What was hard at first?", ["their fingers hurt", "they couldn't read music", "they had no guitar"], "their fingers hurt"),
          R("How did they improve?", ["practicing 30 minutes every day", "taking a weekly class", "watching videos"], "practicing 30 minutes every day"),
          R("What is happening next month?", ["a recital at the academy", "a guitar competition", "a trip abroad"], "a recital at the academy"),
          R("How does the writer feel about performing?", ["a little nervous since it's their first time", "very confident", "not interested at all"], "a little nervous since it's their first time"),
        ],
      },
      {
        passage:
          "작년부터 주말마다 동네 도서관에서 봉사 활동을 하고 있어요. 처음에는 그냥 시간이 남아서 시작했는데 지금은 그 시간이 일주일 중에서 제일 기다려져요. 아이들에게 책을 읽어 주고 책 정리도 도와줘요. 봉사를 하면서 사람들을 만나는 게 즐겁고, 제가 좋아하는 책 이야기를 나눌 수 있어서 좋아요. 앞으로도 계속하고 싶어요.",
        questions: [
          R("Since when has the writer been volunteering?", ["last year", "last month", "this week"], "last year"),
          R("Why did they start?", ["they had free time", "a friend asked them to", "it was required at work"], "they had free time"),
          R("What do they do at the library?", ["read to children and organize books", "check out books", "teach English"], "read to children and organize books"),
          R("What do they enjoy most about volunteering?", ["meeting people and talking about books", "getting paid", "having a quiet place to study"], "meeting people and talking about books"),
          R("What do they want to do going forward?", ["keep volunteering", "find a paid job there", "stop soon"], "keep volunteering"),
        ],
      },
      {
        passage:
          "어제 아침에 지갑을 잃어버려서 하루 종일 정신이 없었어요. 출근하려고 가방을 열었는데 지갑이 없는 거예요. 어젯밤에 편의점에서 계산할 때 놓고 온 것 같았어요. 회사에 늦을까 봐 걱정하면서도 편의점에 다시 가 봤어요. 다행히 직원이 지갑을 보관하고 있었어요. 카드랑 돈이 그대로 있어서 정말 안심이 됐어요.",
        questions: [
          { kr: "", question: "What happened yesterday morning?", options: ["they lost their wallet", "they missed the bus", "they overslept"], answer: "they lost their wallet" },
          { kr: "", question: "Where did they think they left it?", options: ["at the convenience store", "at the office", "on the subway"], answer: "at the convenience store" },
          { kr: "", question: "What were they worried about?", options: ["being late for work", "losing their phone too", "missing a meeting"], answer: "being late for work" },
          { kr: "", question: "Who had the wallet?", options: ["a store employee", "a police officer", "a neighbor"], answer: "a store employee" },
          { kr: "", question: "How did they feel in the end?", options: ["relieved", "still worried", "angry"], answer: "relieved" },
        ],
      },
      {
        passage:
          "지난주에 회사에서 큰 발표를 했어요. 며칠 동안 준비했지만 사람들 앞에 서니까 너무 떨려서 말이 잘 안 나왔어요. 중간에 순서를 한 번 잊어버려서 당황했지만 침착하게 다시 시작했어요. 발표가 끝난 후에 팀장님이 잘했다고 칭찬해 주셔서 마음이 놓였어요. 다음번에는 더 자신 있게 발표할 수 있을 것 같아요.",
        questions: [
          { kr: "", question: "What did the writer do last week?", options: ["gave a big presentation", "attended a job interview", "wrote a report"], answer: "gave a big presentation" },
          { kr: "", question: "How did they feel standing in front of people?", options: ["very nervous", "very confident", "bored"], answer: "very nervous" },
          { kr: "", question: "What happened in the middle of the presentation?", options: ["they forgot the order", "the projector broke", "they ran out of time"], answer: "they forgot the order" },
          { kr: "", question: "Who praised them afterward?", options: ["their team leader", "a client", "a coworker"], answer: "their team leader" },
          { kr: "", question: "How do they feel about next time?", options: ["more confident", "still scared", "unwilling to try again"], answer: "more confident" },
        ],
      },
      {
        passage:
          "지난달에 혼자 오사카로 여행을 갔어요. 그런데 공항에서 비행기를 놓쳐서 다음 비행기를 다시 예매해야 했어요. 세 시간을 공항에서 기다리느라 지쳤지만 결국 무사히 도착했어요. 호텔에 도착하니 예약이 다른 날짜로 잘못 되어 있어서 또 한 번 놀랐어요. 다행히 방이 남아 있어서 그날 밤에 잘 수 있었어요. 힘든 여행이었지만 좋은 경험이 됐어요.",
        questions: [
          { kr: "", question: "Where did the writer travel alone?", options: ["Osaka", "Jeju", "Busan"], answer: "Osaka" },
          { kr: "", question: "What happened at the airport?", options: ["they missed their flight", "their luggage was lost", "the flight was cancelled"], answer: "they missed their flight" },
          { kr: "", question: "How long did they wait at the airport?", options: ["three hours", "one hour", "all day"], answer: "three hours" },
          { kr: "", question: "What was wrong at the hotel?", options: ["the reservation was on the wrong date", "the room was too small", "there was no hot water"], answer: "the reservation was on the wrong date" },
          { kr: "", question: "How does the writer describe the trip in the end?", options: ["hard but a good experience", "a complete disaster", "boring"], answer: "hard but a good experience" },
        ],
      },
      {
        passage:
          "저는 두 달 전에 사진 동호회에 가입했어요. 주말마다 사람들과 같이 공원이나 시장에 가서 사진을 찍어요. 처음에는 카메라 다루는 법도 잘 몰랐지만 회원들이 친절하게 알려 줬어요. 요즘은 조명이나 구도에 대해서도 조금씩 배우고 있어요. 다음 달에는 동호회 사람들끼리 작은 사진 전시회를 열 계획이에요. 제 사진이 전시된다고 생각하니 벌써 설레요.",
        questions: [
          { kr: "", question: "When did the writer join the photography club?", options: ["two months ago", "two weeks ago", "last year"], answer: "two months ago" },
          { kr: "", question: "Where do they go to take photos?", options: ["parks or markets", "the beach", "the mountains"], answer: "parks or markets" },
          { kr: "", question: "How did they learn to use the camera?", options: ["club members kindly taught them", "they took an online course", "they read a manual"], answer: "club members kindly taught them" },
          { kr: "", question: "What are they learning about now?", options: ["lighting and composition", "video editing", "printing photos"], answer: "lighting and composition" },
          { kr: "", question: "What is planned for next month?", options: ["a small photo exhibition", "a trip abroad", "a photography contest"], answer: "a small photo exhibition" },
        ],
      },
      {
        passage:
          "요즘 하루 종일 책상 앞에 앉아서 일하다 보니 허리가 많이 아파요. 처음에는 그냥 피곤해서 그런 줄 알았는데 점점 심해져서 병원에 갔어요. 의사 선생님이 자세가 안 좋아서 그렇다고 하시면서 스트레칭을 하라고 하셨어요. 그 후로 한 시간마다 일어나서 몸을 움직이려고 노력하고 있어요. 아직 완전히 낫지는 않았지만 조금씩 나아지고 있어요.",
        questions: [
          { kr: "", question: "Why does the writer's back hurt?", options: ["sitting at a desk all day", "carrying heavy boxes", "playing sports"], answer: "sitting at a desk all day" },
          { kr: "", question: "What did they think it was at first?", options: ["just tiredness", "a serious illness", "an old injury"], answer: "just tiredness" },
          { kr: "", question: "What did the doctor say caused it?", options: ["bad posture", "lack of sleep", "stress"], answer: "bad posture" },
          { kr: "", question: "What are they trying to do now?", options: ["get up and move every hour", "sleep more", "take medicine daily"], answer: "get up and move every hour" },
          { kr: "", question: "How is their back now?", options: ["slowly getting better", "completely healed", "getting worse"], answer: "slowly getting better" },
        ],
      },
      {
        passage:
          "지난주에 산 청소기가 며칠 만에 고장이 나서 매장에 가지고 갔어요. 영수증을 챙겨 가서 다행히 환불을 받을 수 있었어요. 직원이 제품에 문제가 있었던 것 같다고 사과하면서 다른 제품을 추천해 줬어요. 이번에는 후기를 꼼꼼히 읽고 다른 회사 제품으로 새로 샀어요. 지금은 잘 작동해서 만족하고 있어요.",
        questions: [
          { kr: "", question: "What did the writer buy last week?", options: ["a vacuum cleaner", "a washing machine", "a phone"], answer: "a vacuum cleaner" },
          { kr: "", question: "Why did they go back to the store?", options: ["it broke after a few days", "they wanted a different color", "it was too expensive"], answer: "it broke after a few days" },
          { kr: "", question: "What did they bring with them?", options: ["the receipt", "the box", "a photo of the problem"], answer: "the receipt" },
          { kr: "", question: "What did they do before buying a new one?", options: ["read reviews carefully", "ask a friend for advice", "compare prices online"], answer: "read reviews carefully" },
          { kr: "", question: "How do they feel about the new product?", options: ["satisfied", "still worried", "disappointed"], answer: "satisfied" },
        ],
      },
      {
        passage:
          "다음 달에 새 직장 때문에 다른 도시로 이사를 가요. 몇 년 동안 살던 동네를 떠나려니 아쉬운 마음이 커요. 그동안 친해진 이웃들과 자주 가던 식당도 그리울 것 같아요. 그래도 새로운 곳에서 새로운 일을 시작한다고 생각하니 기대도 돼요. 이번 주말에는 짐을 정리하면서 필요 없는 물건들을 정리하고 있어요.",
        questions: [
          { kr: "", question: "Why is the writer moving next month?", options: ["for a new job", "to be closer to family", "the rent went up"], answer: "for a new job" },
          { kr: "", question: "How do they feel about leaving?", options: ["a bit sad", "very happy", "indifferent"], answer: "a bit sad" },
          { kr: "", question: "What will they miss?", options: ["neighbors and a favorite restaurant", "their old apartment's view", "their gym"], answer: "neighbors and a favorite restaurant" },
          { kr: "", question: "How do they also feel about the move?", options: ["excited", "scared", "regretful"], answer: "excited" },
          { kr: "", question: "What are they doing this weekend?", options: ["sorting out their belongings", "visiting the new city", "saying goodbye to coworkers"], answer: "sorting out their belongings" },
        ],
      },
      {
        passage:
          "고등학교 때 제일 친했던 친구와 십 년 만에 연락이 닿았어요. 우연히 동창 모임에서 다시 만났는데 예전처럼 편하게 이야기할 수 있어서 신기했어요. 그동안 서로 다른 도시에서 살면서 연락이 끊겼는데 이제는 자주 전화하고 있어요. 다음 달에는 같이 여행을 가기로 했어요. 오랜 우정이 다시 이어져서 정말 기뻐요.",
        questions: [
          { kr: "", question: "When did the writer reconnect with their old friend?", options: ["after ten years", "after five years", "last month"], answer: "after ten years" },
          { kr: "", question: "Where did they meet again?", options: ["at a class reunion", "at a wedding", "on social media"], answer: "at a class reunion" },
          { kr: "", question: "Why had they lost contact?", options: ["they lived in different cities", "they had a fight", "one of them moved abroad"], answer: "they lived in different cities" },
          { kr: "", question: "What do they do now?", options: ["call each other often", "text occasionally", "meet every weekend"], answer: "call each other often" },
          { kr: "", question: "What are they planning for next month?", options: ["a trip together", "a birthday party", "moving in together"], answer: "a trip together" },
        ],
      },
      {
        passage:
          "지난 주말에 친구들을 초대해서 저녁을 만들었는데 요리를 하다가 그만 파스타를 다 태워 버렸어요. 급하게 다시 만들려고 했지만 재료가 부족해서 결국 배달 음식을 시켰어요. 친구들은 웃으면서 괜찮다고 했지만 저는 좀 창피했어요. 다음에는 미리 연습해 보고 손님을 초대해야겠다고 생각했어요. 그래도 다 같이 즐거운 시간을 보냈어요.",
        questions: [
          { kr: "", question: "What did the writer do last weekend?", options: ["invited friends for dinner", "went to a friend's party", "ate out with coworkers"], answer: "invited friends for dinner" },
          { kr: "", question: "What went wrong while cooking?", options: ["they burned the pasta", "they forgot the sauce", "the oven broke"], answer: "they burned the pasta" },
          { kr: "", question: "Why couldn't they cook it again?", options: ["they didn't have enough ingredients", "they ran out of time", "the kitchen was too small"], answer: "they didn't have enough ingredients" },
          { kr: "", question: "What did they end up doing?", options: ["ordering delivery food", "going to a restaurant", "eating cereal instead"], answer: "ordering delivery food" },
          { kr: "", question: "How did the writer feel about it?", options: ["a bit embarrassed", "not bothered at all", "furious"], answer: "a bit embarrassed" },
        ],
      },
      {
        passage:
          "지난달에 유기 동물 보호소에서 고양이 한 마리를 입양했어요. 처음에는 낯을 많이 가려서 침대 밑에 숨어만 있었어요. 매일 조금씩 먹이를 주고 말을 걸었더니 이제는 제 무릎 위에서 잠도 자요. 아침에 고양이가 저를 깨워 줘서 요즘은 알람이 필요 없어요. 혼자 살아서 외로웠는데 고양이 덕분에 집이 훨씬 활기차졌어요.",
        questions: [
          { kr: "", question: "Where did the writer get their cat?", options: ["an animal shelter", "a pet shop", "a friend"], answer: "an animal shelter" },
          { kr: "", question: "How did the cat act at first?", options: ["it hid under the bed", "it scratched furniture", "it wouldn't eat"], answer: "it hid under the bed" },
          { kr: "", question: "What does the cat do now?", options: ["sleeps on their lap", "sleeps on the sofa", "sleeps outside"], answer: "sleeps on their lap" },
          { kr: "", question: "What has changed in the mornings?", options: ["they no longer need an alarm", "they wake up earlier for work", "they walk the cat"], answer: "they no longer need an alarm" },
          { kr: "", question: "How does the writer feel now?", options: ["their home feels livelier", "still a bit lonely", "overwhelmed"], answer: "their home feels livelier" },
        ],
      },
      {
        passage:
          "지난 여름에 태풍 때문에 제주도 여행에서 이틀 동안 발이 묶인 적이 있어요. 비행기가 전부 취소돼서 공항 근처 숙소에서 기다려야 했어요. 처음에는 답답했지만 같은 상황이었던 다른 여행객들과 이야기를 나누면서 오히려 즐거운 시간을 보냈어요. 결국 셋째 날에야 비행기를 탈 수 있었어요. 예상보다 길어진 여행이었지만 잊지 못할 추억이 됐어요.",
        questions: [
          { kr: "", question: "Why was the writer stuck in Jeju?", options: ["a typhoon", "a snowstorm", "a strike"], answer: "a typhoon" },
          { kr: "", question: "How long were they stuck?", options: ["two days", "one day", "a week"], answer: "two days" },
          { kr: "", question: "Where did they wait?", options: ["a hotel near the airport", "the airport lounge", "a friend's house"], answer: "a hotel near the airport" },
          { kr: "", question: "What made the wait more enjoyable?", options: ["talking with other travelers", "watching movies", "reading books"], answer: "talking with other travelers" },
          { kr: "", question: "When could they finally fly home?", options: ["on the third day", "the next morning", "after a week"], answer: "on the third day" },
        ],
      },
      {
        passage:
          "이사 온 지 얼마 안 됐을 때 윗집에서 밤늦게까지 나는 소리 때문에 잠을 못 잔 적이 많았어요. 처음에는 그냥 참았지만 너무 힘들어서 결국 편지를 써서 문 앞에 붙여 놓았어요. 며칠 후에 윗집 아저씨가 미안하다며 직접 찾아와서 사과했어요. 그 후로는 소리가 많이 줄어서 이제는 편하게 지내고 있어요. 솔직하게 말하길 잘한 것 같아요.",
        questions: [
          { kr: "", question: "What problem did the writer have after moving in?", options: ["noise from upstairs at night", "a leaking ceiling", "a broken elevator"], answer: "noise from upstairs at night" },
          { kr: "", question: "What did they do at first?", options: ["just endured it", "called the police", "moved out"], answer: "just endured it" },
          { kr: "", question: "How did they finally address it?", options: ["left a note on the door", "knocked on the door directly", "complained to the landlord"], answer: "left a note on the door" },
          { kr: "", question: "How did the upstairs neighbor respond?", options: ["came to apologize in person", "ignored the note", "wrote back angrily"], answer: "came to apologize in person" },
          { kr: "", question: "How do they feel now?", options: ["they're glad they spoke up honestly", "still annoyed", "planning to move"], answer: "they're glad they spoke up honestly" },
        ],
      },
      {
        passage:
          "올해 초부터 헬스장에 다니기 시작했어요. 처음 몇 주는 근육통 때문에 계단도 못 올라갈 정도로 힘들었어요. 그래도 트레이너 선생님이 자세를 자세히 알려 줘서 조금씩 요령을 배웠어요. 요즘은 일주일에 네 번씩 운동하러 가는 게 습관이 됐어요. 체력이 늘면서 예전보다 훨씬 덜 피곤해요.",
        questions: [
          { kr: "", question: "When did the writer start going to the gym?", options: ["earlier this year", "last summer", "two years ago"], answer: "earlier this year" },
          { kr: "", question: "What was hard in the first few weeks?", options: ["muscle soreness", "waking up early", "the membership fee"], answer: "muscle soreness" },
          { kr: "", question: "Who helped them learn proper form?", options: ["a trainer", "a friend", "a video"], answer: "a trainer" },
          { kr: "", question: "How often do they go now?", options: ["four times a week", "twice a week", "every day"], answer: "four times a week" },
          { kr: "", question: "How do they feel now?", options: ["much less tired than before", "still exhausted", "in pain"], answer: "much less tired than before" },
        ],
      },
      {
        passage:
          "회사에서 외국 지사와 자주 이메일을 주고받아야 해서 작년부터 퇴근 후에 영어 학원에 다니고 있어요. 처음에는 문법 위주로 배웠는데 요즘은 회화 수업도 같이 듣고 있어요. 아직 실수를 많이 하지만 예전보다 훨씬 자신 있게 말할 수 있게 됐어요. 얼마 전에는 외국 동료와 화상 회의를 영어로 무사히 마쳤어요. 계속 배우다 보면 더 늘 것 같아요.",
        questions: [
          { kr: "", question: "Why did the writer start studying English?", options: ["to email an overseas branch", "to travel abroad", "to pass a test"], answer: "to email an overseas branch" },
          { kr: "", question: "What did they focus on at first?", options: ["grammar", "listening", "writing"], answer: "grammar" },
          { kr: "", question: "What class are they also taking now?", options: ["conversation", "business writing", "pronunciation"], answer: "conversation" },
          { kr: "", question: "What did they recently manage to do?", options: ["finish a video call in English", "give a speech in English", "write an English report"], answer: "finish a video call in English" },
          { kr: "", question: "How do they feel about their progress?", options: ["more confident than before", "no different", "discouraged"], answer: "more confident than before" },
        ],
      },
      {
        passage:
          "며칠 전에 휴대폰을 떨어뜨려서 화면이 깨졌어요. 서비스 센터에 가져갔더니 수리비가 생각보다 비싸서 놀랐어요. 고민하다가 결국 고치기로 했는데 부품이 없어서 일주일이나 기다려야 했어요. 그동안 예전에 쓰던 낡은 휴대폰을 빌려 써야 해서 불편했어요. 드디어 오늘 고친 휴대폰을 찾아서 정말 후련해요.",
        questions: [
          { kr: "", question: "What happened to the writer's phone?", options: ["the screen cracked", "it was stolen", "it stopped turning on"], answer: "the screen cracked" },
          { kr: "", question: "What surprised them at the service center?", options: ["the repair cost", "the wait time", "the friendly staff"], answer: "the repair cost" },
          { kr: "", question: "Why did the repair take a week?", options: ["a part was out of stock", "the shop was closed", "they needed to order a new phone"], answer: "a part was out of stock" },
          { kr: "", question: "What did they use in the meantime?", options: ["an old phone", "a friend's phone", "no phone at all"], answer: "an old phone" },
          { kr: "", question: "How do they feel now?", options: ["relieved", "still annoyed", "worried it will break again"], answer: "relieved" },
        ],
      },
      {
        passage:
          "이사를 하면서 안 쓰는 가구를 중고 거래 앱에 올렸어요. 처음에는 사람들이 관심이 없을까 봐 걱정했는데 올리자마자 연락이 여러 개 왔어요. 직접 만나서 물건을 확인하고 판매하는 게 조금 번거로웠지만 생각보다 재미있었어요. 덕분에 이사 비용도 조금 아낄 수 있었고 집도 훨씬 깔끔해졌어요. 다음에도 안 쓰는 물건이 생기면 이렇게 정리하려고요.",
        questions: [
          { kr: "", question: "Why did the writer sell furniture online?", options: ["they were moving", "they needed money urgently", "the furniture was broken"], answer: "they were moving" },
          { kr: "", question: "What did they worry about at first?", options: ["no one would be interested", "the app would be complicated", "buyers would negotiate too much"], answer: "no one would be interested" },
          { kr: "", question: "What was a bit inconvenient?", options: ["meeting buyers in person", "packaging the items", "setting the price"], answer: "meeting buyers in person" },
          { kr: "", question: "What did selling the furniture help with?", options: ["saving on moving costs", "buying new furniture", "paying rent"], answer: "saving on moving costs" },
          { kr: "", question: "What will they do in the future?", options: ["sell unused items this way again", "throw items away instead", "give items to charity only"], answer: "sell unused items this way again" },
        ],
      },
      {
        passage:
          "다음 주에 있을 면접 때문에 요즘 매일 예상 질문에 답하는 연습을 하고 있어요. 지난번 면접에서는 너무 긴장해서 준비한 말도 제대로 못 했거든요. 이번에는 거울 앞에서 여러 번 연습하고 친구에게도 도와 달라고 부탁했어요. 여전히 떨리긴 하지만 예전보다 자신감이 생긴 것 같아요. 이번에는 꼭 좋은 결과가 있으면 좋겠어요.",
        questions: [
          { kr: "", question: "What is the writer preparing for?", options: ["a job interview", "a school exam", "a work presentation"], answer: "a job interview" },
          { kr: "", question: "What went wrong at the previous interview?", options: ["they were too nervous to speak well", "they arrived late", "they forgot their resume"], answer: "they were too nervous to speak well" },
          { kr: "", question: "How are they practicing this time?", options: ["in front of a mirror and with a friend", "with an online course", "by memorizing a script"], answer: "in front of a mirror and with a friend" },
          { kr: "", question: "How do they feel compared to before?", options: ["more confident", "just as nervous", "less prepared"], answer: "more confident" },
          { kr: "", question: "What do they hope for?", options: ["a good result this time", "to reschedule the interview", "a different job offer"], answer: "a good result this time" },
        ],
      },
      {
        passage:
          "대학교를 졸업하고 취직하기 전까지 몇 달 동안 카페에서 아르바이트를 했어요. 처음에는 손님이 많을 때 주문을 자꾸 헷갈려서 실수를 했어요. 사장님과 다른 직원들이 친절하게 알려 줘서 점점 익숙해졌어요. 커피 만드는 법도 배우고 손님을 대하는 법도 배워서 사회 경험에 많은 도움이 됐어요. 지금 회사에서 일할 때도 그때 배운 것들이 자주 생각나요.",
        questions: [
          { kr: "", question: "When did the writer work part-time at a cafe?", options: ["after graduating, before finding a job", "during high school", "while working full-time"], answer: "after graduating, before finding a job" },
          { kr: "", question: "What mistake did they make at first?", options: ["mixing up orders when busy", "spilling drinks", "giving wrong change"], answer: "mixing up orders when busy" },
          { kr: "", question: "Who helped them improve?", options: ["the owner and other staff", "a manual", "an online course"], answer: "the owner and other staff" },
          { kr: "", question: "What did they learn there?", options: ["making coffee and dealing with customers", "managing a business", "accounting"], answer: "making coffee and dealing with customers" },
          { kr: "", question: "How is it useful now?", options: ["they remember it often at their current job", "it has nothing to do with their job", "they miss working there"], answer: "they remember it often at their current job" },
        ],
      },
      {
        passage:
          "주말에 화장실 수도꼭지에서 물이 계속 새서 직접 고쳐 보려고 했어요. 인터넷 영상을 보면서 따라 했는데 오히려 물이 더 세게 나와서 당황했어요. 결국 수리 기사님을 불렀는데 부품이 낡아서 그런 거라며 금방 고쳐 주셨어요. 직접 고치려다가 더 큰 문제가 생길 뻔했다는 걸 알고 안심이 됐어요. 다음부터는 이런 일은 전문가에게 맡기기로 했어요.",
        questions: [
          { kr: "", question: "What problem did the writer have?", options: ["a leaking bathroom faucet", "a broken heater", "a clogged drain"], answer: "a leaking bathroom faucet" },
          { kr: "", question: "What went wrong when they tried to fix it themselves?", options: ["the water flowed even harder", "they broke the sink", "they flooded the floor"], answer: "the water flowed even harder" },
          { kr: "", question: "Who fixed it in the end?", options: ["a repair technician", "a neighbor", "the landlord"], answer: "a repair technician" },
          { kr: "", question: "What was the cause of the leak?", options: ["an old part", "a wrong installation", "a crack in the pipe"], answer: "an old part" },
          { kr: "", question: "What did they decide going forward?", options: ["to leave such repairs to professionals", "to take a plumbing class", "to buy new faucets"], answer: "to leave such repairs to professionals" },
        ],
      },
      {
        passage:
          "지난주에 카페에서 우산을 놓고 나왔다가 다시 찾으러 간 적이 있어요. 다행히 직원이 잘 보관해 두고 있어서 금방 찾을 수 있었어요. 그런데 알고 보니 그 우산은 벌써 세 번째로 잃어버렸다가 찾은 우산이었어요. 친구가 이제 우산에 이름표를 붙이라고 농담을 했어요. 앞으로는 나갈 때마다 한 번 더 확인하는 습관을 들이려고 해요.",
        questions: [
          { kr: "", question: "What did the writer leave at the cafe?", options: ["an umbrella", "a scarf", "a laptop"], answer: "an umbrella" },
          { kr: "", question: "Who had kept it safe?", options: ["a staff member", "another customer", "the manager"], answer: "a staff member" },
          { kr: "", question: "How many times had they lost that same umbrella?", options: ["three times", "twice", "once"], answer: "three times" },
          { kr: "", question: "What did their friend joke about?", options: ["putting a name tag on the umbrella", "buying a new umbrella", "never carrying an umbrella again"], answer: "putting a name tag on the umbrella" },
          { kr: "", question: "What habit will they try to build?", options: ["double-checking before leaving", "always carrying a backup umbrella", "leaving umbrellas at home"], answer: "double-checking before leaving" },
        ],
      },
      {
        passage:
          "석 달 전부터 동네 서점에서 여는 독서 모임에 나가고 있어요. 한 달에 한 번씩 같은 책을 읽고 모여서 생각을 나눠요. 혼자 책을 읽을 때는 금방 잊어버렸는데 이렇게 이야기하다 보니 내용이 더 오래 기억에 남아요. 나이도 직업도 다른 사람들의 생각을 듣는 게 특히 재미있어요. 다음 모임에서 읽을 책이 벌써부터 기대돼요.",
        questions: [
          { kr: "", question: "Since when has the writer joined the book club?", options: ["three months ago", "three weeks ago", "a year ago"], answer: "three months ago" },
          { kr: "", question: "How often do they meet?", options: ["once a month", "once a week", "every other week"], answer: "once a month" },
          { kr: "", question: "What changed compared to reading alone?", options: ["they remember the content longer", "they read faster", "they read more books"], answer: "they remember the content longer" },
          { kr: "", question: "What do they especially enjoy?", options: ["hearing views from people of different backgrounds", "getting free books", "meeting the author"], answer: "hearing views from people of different backgrounds" },
          { kr: "", question: "How do they feel about the next meeting?", options: ["excited", "nervous", "indifferent"], answer: "excited" },
        ],
      },

      {
        passage:
          "이번 추석에는 처음으로 우리 가족 모두가 저희 집에 모였어요. 어머니와 저는 아침 일찍부터 송편을 빚고 전을 부쳤어요. 삼촌 가족은 차가 막혀서 저녁이 다 돼서야 도착했지만, 다 같이 늦은 저녁을 먹으니까 오히려 더 특별했어요. 할머니는 오랜만에 손주들을 다 보셔서 계속 웃으셨어요. 다음 명절에도 이렇게 다 같이 모이면 좋겠어요.",
        questions: [
          { kr: "", question: "Where did the family gather this Chuseok?", options: ["the writer's house", "the grandmother's house", "the uncle's house"], answer: "the writer's house" },
          { kr: "", question: "What did the writer and mother make in the morning?", options: ["songpyeon and jeon", "japchae and bulgogi", "tteokguk and mandu"], answer: "songpyeon and jeon" },
          { kr: "", question: "Why was the uncle's family late?", options: ["traffic was heavy", "their car broke down", "they overslept"], answer: "traffic was heavy" },
          { kr: "", question: "How did the writer feel about the late dinner?", options: ["it felt even more special", "it was disappointing", "it was too tiring"], answer: "it felt even more special" },
          { kr: "", question: "Why did the grandmother keep smiling?", options: ["she saw all her grandchildren after a long time", "she received a gift", "she liked the food"], answer: "she saw all her grandchildren after a long time" },
        ],
      },
      {
        passage:
          "다음 주에 사촌 동생이 결혼해서 저는 축의금을 준비하고 정장을 새로 샀어요. 사촌은 대학교 때부터 만난 남자친구와 오 년 만에 드디어 결혼식을 올려요. 결혼식은 한강이 보이는 작은 홀에서 열릴 예정이라 가족들이 모두 기대하고 있어요. 저는 신부 대기실에서 사진 찍는 걸 도와주기로 했어요. 사촌이 행복하게 사는 모습을 보니 저도 덩달아 설레요.",
        questions: [
          { kr: "", question: "What did the writer prepare for the wedding?", options: ["congratulatory money and a new suit", "a wedding gift and shoes", "flowers and a card"], answer: "congratulatory money and a new suit" },
          { kr: "", question: "How long has the cousin dated her boyfriend?", options: ["five years", "one year", "since high school"], answer: "five years" },
          { kr: "", question: "Where will the wedding be held?", options: ["a small hall with a view of the Han River", "a hotel downtown", "a garden in the countryside"], answer: "a small hall with a view of the Han River" },
          { kr: "", question: "What did the writer agree to help with?", options: ["taking photos in the bride's waiting room", "arranging flowers", "greeting guests"], answer: "taking photos in the bride's waiting room" },
          { kr: "", question: "How does the writer feel about the cousin's happiness?", options: ["excited along with her", "a little jealous", "worried for her"], answer: "excited along with her" },
        ],
      },
      {
        passage:
          "이번 주 토요일은 아버지 환갑이라서 온 가족이 모여서 파티를 준비했어요. 저와 언니는 몰래 케이크를 주문하고 거실에 풍선을 달았어요. 아버지는 아무것도 모르고 퇴근하셨다가 깜짝 놀라셨어요. 저녁에는 아버지가 좋아하시는 갈비를 먹으며 그동안 고생하신 이야기를 나눴어요. 아버지는 눈물을 보이시면서도 정말 행복해 보이셨어요.",
        questions: [
          { kr: "", question: "What occasion was the family celebrating?", options: ["the father's 60th birthday", "the parents' anniversary", "the father's retirement"], answer: "the father's 60th birthday" },
          { kr: "", question: "What did the writer and her sister secretly do?", options: ["ordered a cake and hung balloons", "booked a restaurant", "wrote a letter"], answer: "ordered a cake and hung balloons" },
          { kr: "", question: "How did the father react when he came home?", options: ["he was surprised", "he was angry", "he already knew"], answer: "he was surprised" },
          { kr: "", question: "What did they eat for dinner?", options: ["galbi", "kimchi jjigae", "bulgogi"], answer: "galbi" },
          { kr: "", question: "How did the father look at the end?", options: ["happy, though he teared up", "tired and quiet", "embarrassed"], answer: "happy, though he teared up" },
        ],
      },
      {
        passage:
          "저는 일요일마다 아침 일곱 시에 일어나서 근처 공원을 삼십 분 정도 뛰어요. 뛰고 나서 집 앞 카페에 들러서 커피 한 잔을 사 마시는 게 저만의 작은 습관이에요. 예전에는 주말에 늦게까지 자기만 했는데, 이렇게 하니까 하루가 훨씬 길게 느껴져요. 커피를 마시면서 그 주에 읽고 싶었던 책을 조금씩 읽어요. 이 시간이 일주일 중에서 가장 여유로운 순간이에요.",
        questions: [
          { kr: "", question: "What time does the writer wake up on Sundays?", options: ["7 a.m.", "6 a.m.", "9 a.m."], answer: "7 a.m." },
          { kr: "", question: "What does the writer do after jogging?", options: ["stops by a cafe for coffee", "goes back to sleep", "cooks breakfast"], answer: "stops by a cafe for coffee" },
          { kr: "", question: "What did the writer used to do on weekends?", options: ["sleep in late", "go hiking", "study all day"], answer: "sleep in late" },
          { kr: "", question: "What does the writer do while drinking coffee?", options: ["reads a book a little", "watches videos", "calls friends"], answer: "reads a book a little" },
          { kr: "", question: "How does the writer describe this time?", options: ["the most relaxing moment of the week", "the busiest time", "a boring routine"], answer: "the most relaxing moment of the week" },
        ],
      },
      {
        passage:
          "저는 주말마다 새로운 요리에 도전하는 걸 즐겨요. 평일에는 시간이 없어서 간단하게 먹지만, 토요일 오후에는 시장에 가서 재료를 사고 두세 시간씩 요리에 집중해요. 지난주에는 태국 음식인 팟타이를 처음 만들어 봤는데 생각보다 어렵지 않았어요. 실패할 때도 있지만 새로운 맛을 만들어 내는 과정이 재미있어요. 다음 주에는 이탈리아 파스타를 만들어 볼 계획이에요.",
        questions: [
          { kr: "", question: "When does the writer try new recipes?", options: ["on weekends", "every evening", "only on holidays"], answer: "on weekends" },
          { kr: "", question: "Where does the writer buy ingredients?", options: ["the market", "a large supermarket", "online"], answer: "the market" },
          { kr: "", question: "What dish did the writer make last week?", options: ["pad thai", "pasta", "curry"], answer: "pad thai" },
          { kr: "", question: "How did making it go?", options: ["not as hard as expected", "much harder than expected", "impossible without help"], answer: "not as hard as expected" },
          { kr: "", question: "What is the writer planning to make next week?", options: ["Italian pasta", "Japanese sushi", "Chinese noodles"], answer: "Italian pasta" },
        ],
      },
      {
        passage:
          "저는 토요일 오전에는 항상 집안 청소를 해요. 청소기를 돌리고 빨래를 하고 나면 집이 깨끗해져서 마음도 가벼워져요. 오후에는 소파에 누워서 밀린 책을 읽거나 좋아하는 드라마를 봐요. 예전에는 주말에도 계획 없이 시간을 보내서 아쉬웠는데, 요즘은 오전과 오후를 나눠서 보내니까 훨씬 알차게 느껴져요. 이런 규칙적인 생활이 저한테 잘 맞는 것 같아요.",
        questions: [
          { kr: "", question: "What does the writer do on Saturday mornings?", options: ["clean the house", "go shopping", "meet friends"], answer: "clean the house" },
          { kr: "", question: "How does the writer feel after cleaning?", options: ["lighter and refreshed", "exhausted", "bored"], answer: "lighter and refreshed" },
          { kr: "", question: "What does the writer do in the afternoon?", options: ["read books or watch a drama", "go for a run", "study Korean"], answer: "read books or watch a drama" },
          { kr: "", question: "What used to bother the writer about weekends?", options: ["spending time without a plan", "having too little sleep", "being too busy"], answer: "spending time without a plan" },
          { kr: "", question: "How does the writer feel about the new routine?", options: ["it feels more fulfilling", "it feels too strict", "it feels boring"], answer: "it feels more fulfilling" },
        ],
      },
      {
        passage:
          "저는 대학교 근처 카페에서 주말마다 아르바이트를 해요. 처음에는 커피 만드는 법을 몰라서 실수를 많이 했지만, 사장님이 친절하게 알려 주셔서 지금은 라떼 아트도 할 수 있어요. 손님이 많은 시간에는 정신이 없지만, 단골손님과 인사를 나누는 게 즐거워요. 시급도 꽤 괜찮고 학교 가기 전에 잠깐 일할 수 있어서 시간표에 맞추기도 좋아요. 이 일을 시작한 게 정말 잘한 선택이었어요.",
        questions: [
          { kr: "", question: "Where does the writer work part-time?", options: ["a cafe near the university", "a bakery", "a bookstore"], answer: "a cafe near the university" },
          { kr: "", question: "What could the writer not do at first?", options: ["make coffee properly", "use the cash register", "speak to customers"], answer: "make coffee properly" },
          { kr: "", question: "What can the writer do now?", options: ["latte art", "roast beans", "manage the store"], answer: "latte art" },
          { kr: "", question: "What does the writer enjoy about the job?", options: ["greeting regular customers", "the quiet atmosphere", "working alone"], answer: "greeting regular customers" },
          { kr: "", question: "Why does the schedule work well for the writer?", options: ["it fits around school", "it pays the most", "it's close to home"], answer: "it fits around school" },
        ],
      },
      {
        passage:
          "저는 두 달 전부터 집 근처 편의점에서 야간 아르바이트를 하고 있어요. 밤 열 시부터 새벽 여섯 시까지 일하는데 처음에는 낮과 밤이 바뀌어서 많이 힘들었어요. 손님이 없는 새벽 시간에는 진열을 정리하거나 책을 읽으면서 시간을 보내요. 야간 수당이 있어서 돈은 더 많이 벌지만, 잠자는 시간을 맞추는 게 여전히 쉽지 않아요. 그래도 조용한 밤 시간이 저한테는 오히려 편해요.",
        questions: [
          { kr: "", question: "How long has the writer worked the night shift?", options: ["two months", "two weeks", "a year"], answer: "two months" },
          { kr: "", question: "What was hard at first?", options: ["adjusting to being awake at night", "dealing with rude customers", "learning the register"], answer: "adjusting to being awake at night" },
          { kr: "", question: "What does the writer do when there are no customers?", options: ["organizes shelves or reads", "cleans the whole store", "does homework"], answer: "organizes shelves or reads" },
          { kr: "", question: "Why does the writer earn more money?", options: ["there is a night-shift allowance", "the store pays a bonus", "there is overtime pay"], answer: "there is a night-shift allowance" },
          { kr: "", question: "How does the writer feel about the quiet nights?", options: ["it actually feels comfortable", "it feels lonely", "it feels scary"], answer: "it actually feels comfortable" },
        ],
      },
      {
        passage:
          "저는 요즘 중학생 한 명에게 영어를 가르치는 과외 아르바이트를 하고 있어요. 일주일에 두 번, 학생 집에 가서 두 시간씩 수업을 해요. 처음에는 학생이 영어를 싫어해서 가르치기 힘들었는데, 게임처럼 문제를 풀게 했더니 점점 흥미를 보이기 시작했어요. 지난주 시험에서 학생 점수가 많이 올라서 저도 뿌듯했어요. 가르치는 일이 저한테 잘 맞는 것 같아서 앞으로 진로로도 생각해 보고 있어요.",
        questions: [
          { kr: "", question: "What does the writer teach?", options: ["English to a middle school student", "math to a high school student", "Korean to a foreigner"], answer: "English to a middle school student" },
          { kr: "", question: "How often does the writer tutor?", options: ["twice a week", "every day", "once a month"], answer: "twice a week" },
          { kr: "", question: "What was the challenge at first?", options: ["the student disliked English", "the student was often late", "the parents were strict"], answer: "the student disliked English" },
          { kr: "", question: "How did the writer make lessons more interesting?", options: ["by turning problems into a game", "by giving prizes", "by shortening the lessons"], answer: "by turning problems into a game" },
          { kr: "", question: "What is the writer now considering?", options: ["teaching as a future career", "quitting the job", "studying abroad"], answer: "teaching as a future career" },
        ],
      },
      {
        passage:
          "저희 옆집에는 혼자 사시는 아저씨가 계신데, 처음 이사 왔을 때는 서로 인사만 하는 사이였어요. 그런데 어느 날 제가 무거운 짐을 들고 있을 때 아저씨가 도와주신 뒤로 조금씩 가까워졌어요. 요즘은 지나가다 마주치면 날씨 이야기도 하고, 아저씨가 키우시는 화분에 대해 물어보기도 해요. 지난주에는 아저씨가 직접 만든 반찬을 나눠 주셔서 정말 감사했어요. 이웃과 이렇게 친해질 줄은 몰랐어요.",
        questions: [
          { kr: "", question: "Who lives next door to the writer?", options: ["a man who lives alone", "a young couple", "a family with kids"], answer: "a man who lives alone" },
          { kr: "", question: "How did they become closer?", options: ["he helped carry heavy luggage", "they went on a trip together", "they worked at the same company"], answer: "he helped carry heavy luggage" },
          { kr: "", question: "What do they talk about now?", options: ["the weather and his plants", "politics", "their jobs"], answer: "the weather and his plants" },
          { kr: "", question: "What did the neighbor share last week?", options: ["homemade side dishes", "vegetables from his garden", "a book"], answer: "homemade side dishes" },
          { kr: "", question: "How does the writer feel about the friendship?", options: ["surprised it happened", "annoyed by him", "indifferent"], answer: "surprised it happened" },
        ],
      },
      {
        passage:
          "저희 아파트는 층간 소음 문제로 위층과 사이가 안 좋았어요. 밤마다 뛰는 소리가 들려서 스트레스를 많이 받았거든요. 그런데 관리사무소를 통해 편지를 전했더니 위층 부부가 직접 찾아와서 사과했어요. 알고 보니 어린 아이가 있어서 밤에 잘 못 재웠던 거였어요. 지금은 매트를 깔아 주셔서 소음이 많이 줄었고, 가끔 엘리베이터에서 만나면 반갑게 인사해요.",
        questions: [
          { kr: "", question: "What problem did the writer have?", options: ["noise from upstairs at night", "a broken elevator", "a water leak"], answer: "noise from upstairs at night" },
          { kr: "", question: "How did the writer first contact the upstairs family?", options: ["through the management office", "by knocking on their door", "by calling the police"], answer: "through the management office" },
          { kr: "", question: "Why was the noise happening?", options: ["they had a young child who wouldn't sleep", "they were renovating", "they had a pet"], answer: "they had a young child who wouldn't sleep" },
          { kr: "", question: "What did the upstairs family do to help?", options: ["put down a mat", "moved out", "paid for repairs"], answer: "put down a mat" },
          { kr: "", question: "How do they interact now?", options: ["they greet each other warmly", "they still avoid each other", "they argue occasionally"], answer: "they greet each other warmly" },
        ],
      },
      {
        passage:
          "저희 옆집 아주머니는 요리를 정말 잘하셔서 자주 반찬을 나눠 주세요. 저도 답례로 제가 만든 쿠키나 과일을 드리곤 해요. 지난달에는 제가 감기에 걸려서 며칠 동안 밥을 못 챙겨 먹었는데, 아주머니가 죽을 끓여서 가져다주셨어요. 그때 정말 큰 도움이 됐고 고마운 마음이 들었어요. 요즘 같은 시대에 이런 정이 있는 이웃을 만나서 정말 다행이라고 생각해요.",
        questions: [
          { kr: "", question: "What does the neighbor often give the writer?", options: ["side dishes", "flowers", "money"], answer: "side dishes" },
          { kr: "", question: "What does the writer give in return?", options: ["cookies or fruit", "coffee", "vegetables"], answer: "cookies or fruit" },
          { kr: "", question: "Why did the writer need help last month?", options: ["they had a cold and couldn't cook", "they were traveling", "they lost their job"], answer: "they had a cold and couldn't cook" },
          { kr: "", question: "What did the neighbor bring over?", options: ["porridge", "medicine", "groceries"], answer: "porridge" },
          { kr: "", question: "How does the writer feel about having this neighbor?", options: ["grateful and lucky", "a little uncomfortable", "indifferent"], answer: "grateful and lucky" },
        ],
      },
      {
        passage:
          "저는 태어나서 처음으로 김치찌개를 직접 만들어 봤어요. 어머니한테 전화로 물어보면서 김치와 돼지고기, 두부를 넣고 끓였어요. 간을 맞추는 게 생각보다 어려워서 두 번이나 다시 끓였어요. 결국 완성된 찌개는 어머니가 해 주시던 맛과는 조금 달랐지만 그래도 먹을 만했어요. 다음에는 좀 더 자신 있게 만들 수 있을 것 같아요.",
        questions: [
          { kr: "", question: "What dish did the writer make for the first time?", options: ["kimchi jjigae", "doenjang jjigae", "japchae"], answer: "kimchi jjigae" },
          { kr: "", question: "Who did the writer ask for help?", options: ["their mother, by phone", "a cooking teacher", "a friend"], answer: "their mother, by phone" },
          { kr: "", question: "What was difficult?", options: ["getting the seasoning right", "cutting the vegetables", "finding the ingredients"], answer: "getting the seasoning right" },
          { kr: "", question: "How many times did the writer make it?", options: ["three times", "once", "five times"], answer: "three times" },
          { kr: "", question: "How did the final dish compare to the mother's?", options: ["a bit different but still edible", "exactly the same", "much better"], answer: "a bit different but still edible" },
        ],
      },
      {
        passage:
          "저희 회사 사람들은 점심시간에 각자 도시락을 싸 와서 같이 나눠 먹어요. 저는 요리를 잘 못해서 처음에는 부끄러웠지만, 다들 서로 다른 반찬을 나눠 주니까 오히려 좋았어요. 매주 화요일에는 누가 더 특별한 반찬을 준비했는지 서로 웃으면서 이야기해요. 도시락을 싸 오면 돈도 아끼고 건강한 음식도 먹을 수 있어서 일석이조예요. 요즘은 저도 조금씩 요리 실력이 늘고 있어요.",
        questions: [
          { kr: "", question: "What do coworkers do at lunchtime?", options: ["share homemade lunchboxes", "order delivery together", "go to a cafeteria"], answer: "share homemade lunchboxes" },
          { kr: "", question: "How did the writer feel at first?", options: ["a little embarrassed about their cooking", "proud of their cooking", "annoyed by the tradition"], answer: "a little embarrassed about their cooking" },
          { kr: "", question: "What happens every Tuesday?", options: ["they joke about who made the most special dish", "they eat out together", "they clean the kitchen"], answer: "they joke about who made the most special dish" },
          { kr: "", question: "What is one benefit of bringing lunchboxes?", options: ["saving money", "getting extra break time", "free delivery"], answer: "saving money" },
          { kr: "", question: "What has improved for the writer recently?", options: ["their cooking skills", "their salary", "their commute"], answer: "their cooking skills" },
        ],
      },
      {
        passage:
          "저는 석 달 전부터 채식을 시작했어요. 건강도 챙기고 환경에도 도움이 될 것 같아서 결심했어요. 처음에는 고기가 안 들어간 음식을 찾기가 어려워서 외식할 때마다 곤란했어요. 그런데 시간이 지나면서 채소로도 충분히 맛있는 요리를 만들 수 있다는 걸 알게 됐어요. 가족들은 처음에는 걱정했지만, 제가 오히려 더 건강해 보인다고 이제는 응원해 줘요.",
        questions: [
          { kr: "", question: "When did the writer start eating vegetarian?", options: ["three months ago", "three weeks ago", "a year ago"], answer: "three months ago" },
          { kr: "", question: "Why did the writer decide to go vegetarian?", options: ["for health and the environment", "doctor's orders", "to save money"], answer: "for health and the environment" },
          { kr: "", question: "What was difficult at first?", options: ["finding meat-free food when eating out", "cooking at home", "buying vegetables"], answer: "finding meat-free food when eating out" },
          { kr: "", question: "What did the writer learn over time?", options: ["vegetables alone can make tasty dishes", "meat is necessary for good food", "cooking vegetarian food is too expensive"], answer: "vegetables alone can make tasty dishes" },
          { kr: "", question: "How does the family feel now?", options: ["supportive, since the writer looks healthier", "still worried", "opposed to it"], answer: "supportive, since the writer looks healthier" },
        ],
      },
      {
        passage:
          "저는 스마트폰을 너무 많이 봐서 눈도 아프고 집중력도 떨어지는 것 같았어요. 그래서 한 달 전부터 스마트폰 사용 시간을 줄이기로 했어요. 자기 전 한 시간은 폰을 안 보고 책을 읽거나 스트레칭을 해요. 처음에는 습관처럼 자꾸 폰을 찾게 됐지만 지금은 많이 익숙해졌어요. 사용 시간이 줄어드니까 잠도 더 잘 자고 아침에 일어나는 것도 훨씬 편해졌어요.",
        questions: [
          { kr: "", question: "Why did the writer decide to use their phone less?", options: ["eyes hurt and concentration dropped", "the phone broke", "a doctor advised it"], answer: "eyes hurt and concentration dropped" },
          { kr: "", question: "What does the writer do instead before bed?", options: ["reads or stretches", "watches TV", "exercises outside"], answer: "reads or stretches" },
          { kr: "", question: "What was hard at the start?", options: ["habitually reaching for the phone", "falling asleep", "waking up early"], answer: "habitually reaching for the phone" },
          { kr: "", question: "How is the writer sleeping now?", options: ["better than before", "worse than before", "about the same"], answer: "better than before" },
          { kr: "", question: "How does the writer feel in the morning now?", options: ["it's easier to wake up", "it's harder to wake up", "no change at all"], answer: "it's easier to wake up" },
        ],
      },
      {
        passage:
          "저는 요즘 퇴근 후에 온라인 강의로 영상 편집을 배우고 있어요. 회사에서 필요할 것 같아서 시작했는데, 생각보다 재미있어서 취미처럼 하고 있어요. 하루에 한 시간씩 강의를 듣고 직접 짧은 영상을 만들어 봐요. 모르는 부분은 강의 게시판에 질문을 올리면 다른 수강생들이 답을 알려 줘요. 다음 달에는 배운 걸로 여행 영상을 하나 만들어 볼 계획이에요.",
        questions: [
          { kr: "", question: "What is the writer learning through an online course?", options: ["video editing", "graphic design", "coding"], answer: "video editing" },
          { kr: "", question: "Why did the writer start learning it?", options: ["it seemed useful for work", "a friend recommended it", "it was required for school"], answer: "it seemed useful for work" },
          { kr: "", question: "How much time does the writer spend studying each day?", options: ["one hour", "thirty minutes", "three hours"], answer: "one hour" },
          { kr: "", question: "How does the writer get help with questions?", options: ["posting on the course discussion board", "calling the instructor", "asking coworkers"], answer: "posting on the course discussion board" },
          { kr: "", question: "What is the writer's plan for next month?", options: ["make a travel video", "start a new course", "buy new equipment"], answer: "make a travel video" },
        ],
      },
      {
        passage:
          "저는 얼마 전부터 중고 거래 앱을 자주 사용해요. 안 쓰는 물건을 팔아서 용돈도 벌고, 필요한 물건을 저렴하게 사기도 해요. 지난주에는 몇 년 동안 안 읽은 책을 스무 권이나 팔았어요. 앱으로 낯선 사람과 직접 만나서 물건을 주고받는 게 처음에는 조금 어색했지만, 이제는 익숙해졌어요. 이렇게 쓰지 않는 물건을 다른 사람에게 넘기니까 환경에도 좋은 것 같아서 뿌듯해요.",
        questions: [
          { kr: "", question: "What app does the writer use often?", options: ["a secondhand trading app", "a food delivery app", "a banking app"], answer: "a secondhand trading app" },
          { kr: "", question: "What did the writer sell last week?", options: ["twenty books", "old clothes", "a bicycle"], answer: "twenty books" },
          { kr: "", question: "What felt awkward at first?", options: ["meeting strangers to exchange items", "using the app itself", "setting prices"], answer: "meeting strangers to exchange items" },
          { kr: "", question: "How does the writer feel about it now?", options: ["used to it", "still uncomfortable", "no longer interested"], answer: "used to it" },
          { kr: "", question: "Why does the writer feel proud?", options: ["it seems good for the environment", "it makes a lot of money", "it's a fun hobby"], answer: "it seems good for the environment" },
        ],
      },
      {
        passage:
          "어제 올겨울 첫눈이 내렸어요. 아침에 일어나서 창밖을 보니 온 세상이 하얗게 변해 있었어요. 저는 어릴 때처럼 신이 나서 친구에게 전화해서 같이 산책하러 나갔어요. 눈사람도 만들고 사진도 많이 찍었어요. 어른이 되면 눈이 귀찮게 느껴질 줄 알았는데, 첫눈이 오는 날은 여전히 설레는 것 같아요.",
        questions: [
          { kr: "", question: "What happened yesterday?", options: ["the first snow of winter fell", "a big storm hit", "it rained all day"], answer: "the first snow of winter fell" },
          { kr: "", question: "What did the writer see out the window?", options: ["the whole world turned white", "the streets were flooded", "the sky was clear"], answer: "the whole world turned white" },
          { kr: "", question: "What did the writer do?", options: ["called a friend and went for a walk", "stayed inside all day", "went to work early"], answer: "called a friend and went for a walk" },
          { kr: "", question: "What did they make outside?", options: ["a snowman", "a snow fort", "snow angels"], answer: "a snowman" },
          { kr: "", question: "How does the writer feel about snow as an adult?", options: ["still excited by the first snow", "annoyed by it", "indifferent to it"], answer: "still excited by the first snow" },
        ],
      },
      {
        passage:
          "칠월이 되면서 장마가 시작됐어요. 며칠째 계속 비가 내려서 빨래도 잘 안 마르고 마음도 축 처져요. 우산을 챙겨도 바람이 세게 불면 다 젖기 일쑤예요. 그래도 비 오는 날 창가에 앉아서 따뜻한 차를 마시는 건 나름대로 좋아하는 시간이에요. 장마가 끝나면 본격적으로 더운 여름이 시작될 거라고 생각하니 벌써 걱정이 돼요.",
        questions: [
          { kr: "", question: "When did the monsoon season start?", options: ["July", "June", "August"], answer: "July" },
          { kr: "", question: "What problem does the constant rain cause?", options: ["laundry doesn't dry well", "the streets flood badly", "the power goes out"], answer: "laundry doesn't dry well" },
          { kr: "", question: "What happens even with an umbrella?", options: ["it gets soaked in strong wind", "it breaks easily", "it's too heavy to carry"], answer: "it gets soaked in strong wind" },
          { kr: "", question: "What does the writer enjoy on rainy days?", options: ["sitting by the window with warm tea", "watching movies all day", "sleeping late"], answer: "sitting by the window with warm tea" },
          { kr: "", question: "What is the writer worried about?", options: ["the hot summer after the monsoon", "another storm coming", "flooding in the neighborhood"], answer: "the hot summer after the monsoon" },
        ],
      },
      {
        passage:
          "요즘 봄이 되면 미세먼지 때문에 걱정이 많아요. 하늘이 뿌옇게 보이는 날에는 마스크 없이는 밖에 나가기가 힘들어요. 저는 매일 아침 미세먼지 앱으로 농도를 확인하고 나서 창문을 열지 말지 결정해요. 공기청정기도 새로 샀는데 확실히 실내 공기가 조금 나아진 것 같아요. 빨리 미세먼지가 줄어서 마음 편하게 산책할 수 있는 날이 왔으면 좋겠어요.",
        questions: [
          { kr: "", question: "What does the writer worry about in spring?", options: ["fine dust", "typhoons", "heat waves"], answer: "fine dust" },
          { kr: "", question: "What happens on days with a hazy sky?", options: ["it's hard to go outside without a mask", "schools close", "public transport stops"], answer: "it's hard to go outside without a mask" },
          { kr: "", question: "What does the writer check every morning?", options: ["a fine dust app", "the weather forecast on TV", "a friend's advice"], answer: "a fine dust app" },
          { kr: "", question: "What did the writer buy recently?", options: ["an air purifier", "a new mask brand", "a humidifier"], answer: "an air purifier" },
          { kr: "", question: "What does the writer hope for?", options: ["being able to walk outside comfortably again", "moving to another city", "staying indoors permanently"], answer: "being able to walk outside comfortably again" },
        ],
      },
      {
        passage:
          "저는 지난달에 유기견 보호소에서 강아지 한 마리를 입양했어요. 처음에는 낯선 환경 때문인지 강아지가 계속 저를 피했어요. 하지만 매일 산책시키고 간식을 챙겨 주면서 조금씩 마음을 열어 줬어요. 지금은 제가 집에 오면 꼬리를 흔들면서 달려와요. 강아지를 키우면서 책임감도 생기고 하루하루가 더 즐거워졌어요.",
        questions: [
          { kr: "", question: "Where did the writer adopt the puppy from?", options: ["an animal shelter", "a pet shop", "a friend"], answer: "an animal shelter" },
          { kr: "", question: "How did the puppy act at first?", options: ["it avoided the writer", "it barked constantly", "it was very friendly right away"], answer: "it avoided the writer" },
          { kr: "", question: "What did the writer do to build trust?", options: ["walked it daily and gave treats", "left it alone to adjust", "took it to training classes"], answer: "walked it daily and gave treats" },
          { kr: "", question: "How does the puppy greet the writer now?", options: ["running over wagging its tail", "hiding under the bed", "barking loudly"], answer: "running over wagging its tail" },
          { kr: "", question: "How has the writer's life changed?", options: ["days feel more enjoyable and they feel more responsible", "life feels busier and more stressful", "nothing has changed much"], answer: "days feel more enjoyable and they feel more responsible" },
        ],
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
      L("면접 결과는 다음 주 금요일에 알려준다고 했어요.", "When will the interview results be announced?", ["next Friday", "this Friday", "next Monday", "tomorrow"], "next Friday"),
      L("집주인이 다음 달부터 월세를 올린다고 했어요.", "What did the landlord say?", ["the rent will go up next month", "the rent will go down", "the lease will end next month", "the deposit will be returned"], "the rent will go up next month"),
      L("헬스장 회원권은 오래 끊을수록 할인이 커져요.", "What is true about the gym membership?", ["the longer you sign up for, the bigger the discount", "the shorter the membership, the cheaper it is", "discounts are only for new members", "there are no discounts at all"], "the longer you sign up for, the bigger the discount"),
      L("사이즈가 안 맞아서 환불을 신청했어요.", "Why did they request a refund?", ["the size didn't fit", "the color was wrong", "it arrived broken", "it was too expensive"], "the size didn't fit"),
      L("비행기가 두 시간 지연됐다는 안내 방송이 나왔어요.", "What did the announcement say?", ["the flight is delayed two hours", "the flight is canceled", "the gate has changed", "boarding starts early"], "the flight is delayed two hours"),
      L("차가 갑자기 멈춰서 견인차를 불렀어요.", "What happened?", ["the car suddenly stopped, so they called a tow truck", "they got a flat tire and changed it", "they ran out of gas", "the car was stolen"], "the car suddenly stopped, so they called a tow truck"),
      L("치과는 예약하지 않으면 한참 기다려야 해요.", "What do they say about the dentist?", ["you have to wait a long time without a reservation", "reservations aren't accepted", "it's closed on weekdays", "walk-ins get priority"], "you have to wait a long time without a reservation"),
      L("책을 다 읽자마자 독서 모임에 참석했어요.", "When did they attend the book club?", ["right after finishing the book", "before starting the book", "a month after finishing it", "instead of finishing the book"], "right after finishing the book"),
      L("프리랜서로 일할수록 시간 관리가 중요하다는 걸 깨달았어요.", "What did they realize?", ["time management matters more the longer you freelance", "freelancing is easier than office work", "deadlines don't matter for freelancers", "freelancers need less planning"], "time management matters more the longer you freelance"),
      L("이사한 동네는 생각보다 조용하고 편리했어요.", "How did the new neighborhood turn out?", ["quieter and more convenient than expected", "noisier than expected", "far from everything", "exactly as they expected"], "quieter and more convenient than expected"),
      L("요금제를 바꾸지 않으면 매달 손해를 본다고 해요.", "What will happen if they don't change their phone plan?", ["they'll lose money every month", "their phone will stop working", "they'll get a free upgrade", "nothing will change"], "they'll lose money every month"),
      L("대출 이자가 올라서 부담이 커졌어요.", "What increased their financial burden?", ["the loan interest rate went up", "their rent went up", "they lost their job", "they bought a new car"], "the loan interest rate went up"),
      L("정전이 되지 않도록 양초를 미리 준비해 두세요.", "Why are they told to prepare candles in advance?", ["in case there's a power outage", "for a birthday party", "because it's a holiday tradition", "for a camping trip"], "in case there's a power outage"),
      L("유기견을 입양한 후로 생활이 많이 바뀌었어요.", "What changed their daily life?", ["adopting a rescue dog", "moving to a new city", "starting a new job", "getting married"], "adopting a rescue dog"),
      { kr: "새로 온 팀장님은 회의 시간을 반으로 줄이자고 제안했어요.", question: "What did the new team leader propose?", options: ["cutting meeting time in half", "canceling all meetings", "doubling meeting time", "meeting only on Fridays"], answer: "cutting meeting time in half" },
      { kr: "이번 프로젝트는 마감이 촉박해서 야근이 잦아졌어요.", question: "Why has overtime become frequent?", options: ["the project deadline is tight", "there are too few clients", "the office moved", "salaries were cut"], answer: "the project deadline is tight" },
      { kr: "신입 사원 교육은 이번 주 목요일까지 진행돼요.", question: "When does the new employee training run through?", options: ["this Thursday", "this Monday", "next Thursday", "next Monday"], answer: "this Thursday" },
      { kr: "상사가 제 아이디어를 칭찬해 줘서 기분이 좋았어요.", question: "Why did they feel good?", options: ["their boss praised their idea", "they got a raise", "they finished early", "they were promoted"], answer: "their boss praised their idea" },
      { kr: "재택근무를 하니까 출퇴근 시간이 줄어서 좋아요.", question: "What do they like about working from home?", options: ["less commuting time", "more free coffee", "a bigger office", "flexible pay"], answer: "less commuting time" },
      { kr: "집주인이 보일러 수리비를 내주지 않겠다고 했어요.", question: "What did the landlord refuse to do?", options: ["pay for the boiler repair", "lower the rent", "return the deposit", "fix the elevator"], answer: "pay for the boiler repair" },
      { kr: "계약 기간이 끝나기 전에 미리 연장 여부를 알려 달래요.", question: "What are they asked to do?", options: ["let them know about renewal before the lease ends", "move out immediately", "pay extra fees", "sign a new contract today"], answer: "let them know about renewal before the lease ends" },
      { kr: "윗집에서 밤마다 시끄러운 소리가 나서 잠을 못 잤어요.", question: "Why couldn't they sleep?", options: ["noise from the upstairs unit at night", "construction outside", "a broken air conditioner", "loud traffic"], answer: "noise from the upstairs unit at night" },
      { kr: "보증금을 돌려받으려면 집을 원래 상태로 청소해야 해요.", question: "What must be done to get the deposit back?", options: ["clean the apartment back to its original condition", "pay an extra fee", "repaint the walls a new color", "buy new furniture"], answer: "clean the apartment back to its original condition" },
      { kr: "이 아파트는 반려동물을 키울 수 없다고 계약서에 적혀 있어요.", question: "What does the contract say?", options: ["pets are not allowed", "pets are allowed with a deposit", "only small pets are allowed", "pets require the landlord's daily approval"], answer: "pets are not allowed" },
      { kr: "공항에서 수하물이 늦게 나와서 한 시간 넘게 기다렸어요.", question: "Why did they wait over an hour?", options: ["their luggage came out late", "the flight was delayed", "customs was closed", "they lost their passport"], answer: "their luggage came out late" },
      { kr: "환승 시간이 짧아서 다음 비행기를 놓칠 뻔했어요.", question: "What almost happened?", options: ["they almost missed their connecting flight", "they missed check-in", "they lost their ticket", "they boarded the wrong plane"], answer: "they almost missed their connecting flight" },
      { kr: "여권 유효기간이 얼마 안 남아서 미리 갱신해야 해요.", question: "Why do they need to renew soon?", options: ["their passport is about to expire", "they lost their passport", "their visa was denied", "the airline requires a new photo"], answer: "their passport is about to expire" },
      { kr: "숙소 예약을 취소하면 수수료가 든다고 해요.", question: "What happens if they cancel the reservation?", options: ["a cancellation fee applies", "it's fully refunded", "the room is given away for free", "nothing happens"], answer: "a cancellation fee applies" },
      { kr: "렌터카를 반납할 때 기름을 가득 채워야 한대요.", question: "What must be done when returning the rental car?", options: ["fill the tank all the way", "wash the car first", "return it a day early", "remove all personal items only"], answer: "fill the tank all the way" },
      { kr: "기차표가 매진돼서 다음 열차를 예매했어요.", question: "What did they do?", options: ["booked the next train because the tickets were sold out", "canceled their trip", "bought a plane ticket instead", "waited at the station without a ticket"], answer: "booked the next train because the tickets were sold out" },
      { kr: "여행 중에 다쳐서 현지 병원에 가야 했어요.", question: "Why did they go to a hospital while traveling?", options: ["they got injured", "they had a fever", "they needed a checkup", "they lost their medicine"], answer: "they got injured" },
      { kr: "요즘 기침이 심해서 병원에 가 보려고 해요.", question: "Why are they planning to see a doctor?", options: ["they have a bad cough", "they have a broken arm", "they have a headache", "they need a vaccine"], answer: "they have a bad cough" },
      { kr: "검사 결과는 일주일 후에 이메일로 알려준대요.", question: "How will they receive the test results?", options: ["by email in a week", "by phone tomorrow", "in person today", "by mail in a month"], answer: "by email in a week" },
      { kr: "이 약은 졸릴 수 있으니까 운전하기 전에 먹지 마세요.", question: "What warning is given about the medicine?", options: ["don't take it before driving because it may cause drowsiness", "take it only at night", "don't take it with food", "it should be taken on an empty stomach"], answer: "don't take it before driving because it may cause drowsiness" },
      { kr: "허리가 계속 아파서 정형외과에 예약을 잡았어요.", question: "Why did they book an orthopedic appointment?", options: ["their back keeps hurting", "their leg is broken", "they had a fall", "they need a vaccine"], answer: "their back keeps hurting" },
      { kr: "건강검진에서 혈압이 조금 높게 나왔어요.", question: "What did the health checkup show?", options: ["blood pressure was a bit high", "cholesterol was too low", "everything was perfectly normal", "they need surgery"], answer: "blood pressure was a bit high" },
      { kr: "매달 월급의 일부를 적금에 넣고 있어요.", question: "What are they doing with part of their salary?", options: ["putting it into a savings account", "spending it on rent", "donating it to charity", "investing it in stocks only"], answer: "putting it into a savings account" },
      { kr: "카드값이 예상보다 많이 나와서 깜짝 놀랐어요.", question: "Why were they surprised?", options: ["the credit card bill was higher than expected", "their salary was cut", "their card was declined", "they lost their wallet"], answer: "the credit card bill was higher than expected" },
      { kr: "은행 앱이 자꾸 오류가 나서 창구에 직접 갔어요.", question: "Why did they go to the bank in person?", options: ["the banking app kept giving errors", "the app was too slow", "they forgot their password", "the app doesn't support transfers"], answer: "the banking app kept giving errors" },
      { kr: "세금 신고 기한이 다음 주까지라서 서둘러야 해요.", question: "Why do they need to hurry?", options: ["the tax filing deadline is next week", "the bank is closing early", "their account will be frozen", "they need to renew their ID"], answer: "the tax filing deadline is next week" },
      { kr: "이번 달에는 지출을 줄이려고 외식을 안 하기로 했어요.", question: "What did they decide to reduce spending?", options: ["not eating out this month", "canceling their gym membership", "selling their car", "moving to a cheaper apartment"], answer: "not eating out this month" },
      { kr: "노트북이 갑자기 꺼져서 데이터를 잃어버릴까 봐 걱정돼요.", question: "What are they worried about?", options: ["losing data because the laptop suddenly shut off", "the laptop being stolen", "the laptop being too heavy", "a software update failing"], answer: "losing data because the laptop suddenly shut off" },
      { kr: "와이파이가 자꾸 끊겨서 화상 회의를 못 했어요.", question: "Why couldn't they join the video call?", options: ["the wifi kept disconnecting", "their camera broke", "the meeting was canceled", "their laptop battery died"], answer: "the wifi kept disconnecting" },
      { kr: "비밀번호를 잊어버려서 계정을 다시 설정해야 해요.", question: "What do they need to do?", options: ["reset their account because they forgot the password", "delete their account", "create a new email", "call customer service"], answer: "reset their account because they forgot the password" },
      { kr: "휴대폰 화면이 깨져서 수리 센터에 맡겼어요.", question: "What did they do with their phone?", options: ["took it to a repair center because the screen cracked", "sold it online", "upgraded to a new model", "returned it to the store"], answer: "took it to a repair center because the screen cracked" },
      { kr: "소프트웨어를 업데이트한 후로 프로그램이 자꾸 멈춰요.", question: "What happened after the software update?", options: ["the program keeps freezing", "the program runs faster", "the program deleted itself", "nothing changed"], answer: "the program keeps freezing" },
      { kr: "이메일을 잘못 보내서 상사에게 다시 사과 메일을 썼어요.", question: "Why did they write an apology email?", options: ["they sent the wrong email to their boss", "they missed a deadline", "they were late to work", "they forgot a meeting"], answer: "they sent the wrong email to their boss" },
      { kr: "동료가 갑자기 퇴사해서 업무가 저한테 다 넘어왔어요.", question: "Why did all the work get passed to them?", options: ["a coworker suddenly quit", "a coworker was promoted", "a coworker went on vacation", "the team was downsized"], answer: "a coworker suddenly quit" },
      { kr: "이번 출장은 예산이 부족해서 취소될 것 같아요.", question: "Why might the business trip be canceled?", options: ["the budget is insufficient", "the client canceled the meeting", "the flight was overbooked", "no one wants to go"], answer: "the budget is insufficient" },
      { kr: "계좌 이체가 잘못돼서 은행에 문의 전화를 했어요.", question: "Why did they call the bank?", options: ["a bank transfer went wrong", "they wanted to open a new account", "they lost their card", "they wanted a loan"], answer: "a bank transfer went wrong" },

      L("민준 씨는 요즘 여자친구와 자주 다퉈서 고민이래요.", "What is Minjun worried about these days?", ["fighting often with his girlfriend", "breaking up with his girlfriend", "not having enough time to date", "his girlfriend moving abroad"], "fighting often with his girlfriend"),
      L("서연 씨는 소개팅에서 만난 사람과 다시 만나기로 했대요.", "What did Seoyeon decide?", ["to meet the blind date person again", "to cancel the blind date", "to introduce a friend instead", "to stop dating for a while"], "to meet the blind date person again"),
      L("친구들과 오랜만에 동창회에 가기로 했어요.", "What are they planning to attend?", ["a class reunion", "a wedding", "a company dinner", "a birthday party"], "a class reunion"),
      L("지호 씨는 여러 번 연락했는데도 답장이 없어서 서운했대요.", "Why was Jiho upset?", ["there was no reply despite contacting several times", "his friend canceled a plan suddenly", "he was left out of a group chat", "his friend forgot his birthday"], "there was no reply despite contacting several times"),
      L("이번 주말에 친구 결혼식이 있어서 축의금을 준비해야 해요.", "What do they need to prepare for this weekend?", ["congratulatory money for a friend's wedding", "a gift for a housewarming", "a card for a graduation", "flowers for a funeral"], "congratulatory money for a friend's wedding"),
      L("요즘은 캠핑보다 등산 동호회가 더 인기가 많아요.", "What is more popular these days?", ["hiking clubs", "camping clubs", "cycling clubs", "fishing clubs"], "hiking clubs"),
      L("도자기 공방에서 취미로 그릇 만드는 걸 배우고 있어요.", "What are they learning as a hobby?", ["making pottery at a workshop", "painting landscapes", "playing traditional music", "carving wood"], "making pottery at a workshop"),
      L("전시회에 가려고 했는데 표가 이미 다 팔렸대요.", "What happened with the exhibition?", ["the tickets were already sold out", "the exhibition was postponed", "the venue changed", "admission is now free"], "the tickets were already sold out"),
      L("요즘 필름 카메라로 사진 찍는 게 다시 유행이래요.", "What is trending again these days?", ["taking photos with film cameras", "using disposable cameras only indoors", "printing photos at home", "collecting old phones"], "taking photos with film cameras"),
      L("독립 서점에서 열리는 낭독회에 참석할 예정이에요.", "What are they planning to attend?", ["a reading event at an independent bookstore", "a book fair downtown", "a writing class", "a library renovation opening"], "a reading event at an independent bookstore"),
      L("합창단 연습이 매주 화요일 저녁으로 바뀌었어요.", "When was the choir practice changed to?", ["Tuesday evenings every week", "Monday mornings", "every other Sunday", "Friday nights"], "Tuesday evenings every week"),
      L("이 옷 가게는 교환은 되지만 환불은 안 된대요.", "What is the store's policy?", ["exchanges are allowed but not refunds", "refunds are allowed but not exchanges", "neither exchanges nor refunds", "both exchanges and refunds within a week"], "exchanges are allowed but not refunds"),
      L("온라인으로 주문한 물건이 사진과 많이 달라서 실망했어요.", "Why were they disappointed?", ["the item looked very different from the photo", "the item arrived late", "the price went up after ordering", "the item was out of stock"], "the item looked very different from the photo"),
      L("이 세제는 대용량으로 사면 훨씬 저렴해요.", "What is true about this detergent?", ["buying the large size is much cheaper", "the small size is on sale", "it's only sold online", "it comes in one size only"], "buying the large size is much cheaper"),
      L("배송이 너무 늦어서 고객센터에 항의 전화를 했어요.", "What did they do?", ["called customer service to complain about slow delivery", "canceled their membership", "returned the item unopened", "left a positive review"], "called customer service to complain about slow delivery"),
      L("이 카드는 특정 매장에서만 적립이 두 배로 돼요.", "What is special about this card?", ["points are doubled only at certain stores", "it has no annual fee", "it works only overseas", "it gives cash back on all purchases"], "points are doubled only at certain stores"),
      L("중고차를 살 때는 사고 이력을 꼭 확인해야 해요.", "What should you check when buying a used car?", ["its accident history", "its color options", "the dealer's opening hours", "the manufacturer's warranty period"], "its accident history"),
      L("세일 기간에는 사람이 많아서 계산대에 줄이 길어요.", "What happens during the sale period?", ["the checkout lines get long", "the store closes early", "delivery becomes free", "prices go up temporarily"], "the checkout lines get long"),
      L("요즘 편의점에서 무인 계산대를 쓰는 사람이 늘었어요.", "What has become more common?", ["using self-checkout at convenience stores", "convenience stores closing at night", "paying only with cash", "delivery-only convenience stores"], "using self-checkout at convenience stores"),
      L("최근 짧은 영상 콘텐츠에 빠진 사람들이 많아지고 있어요.", "What are more people getting into?", ["short-form video content", "long documentary films", "printed magazines", "radio dramas"], "short-form video content"),
      L("요즘 한 가지 색으로 맞춰 입는 패션이 유행이래요.", "What fashion trend is popular now?", ["dressing in one matching color", "wearing mismatched patterns", "vintage denim jackets", "oversized coats only"], "dressing in one matching color"),
      L("최근에는 커피 대신 차를 마시는 젊은 사람들이 늘고 있어요.", "What trend is mentioned?", ["more young people drinking tea instead of coffee", "coffee prices dropping", "cafes closing down", "people quitting caffeine entirely"], "more young people drinking tea instead of coffee"),
      L("요즘 반려식물을 키우는 사람들이 부쩍 많아졌어요.", "What has become more common recently?", ["keeping houseplants as companions", "keeping exotic pets", "growing vegetables for sale", "collecting rare flowers"], "keeping houseplants as companions"),
      L("이 앱은 하루 사용 시간을 알려줘서 요즘 인기가 많아요.", "Why is this app popular?", ["it shows how much time you spend on your phone daily", "it blocks all notifications", "it tracks your location", "it recommends restaurants nearby"], "it shows how much time you spend on your phone daily"),
      L("사무실 자율 좌석제 때문에 매일 앉는 자리가 달라요.", "Why does their seat change every day?", ["the office has a free-seating system", "the desks are being repaired", "there aren't enough chairs", "seating is assigned randomly each month"], "the office has a free-seating system"),
      L("팀장님이 회식보다 각자 편한 시간에 쉬는 걸 더 좋아해요.", "What does the team leader prefer?", ["everyone resting at their own convenient time over company dinners", "having a company dinner every week", "starting work earlier", "canceling all team events"], "everyone resting at their own convenient time over company dinners"),
      L("요즘 회사에서는 사적인 질문을 하지 않는 분위기예요.", "What is the workplace atmosphere like?", ["people avoid asking personal questions", "everyone shares personal news openly", "managers ask about family often", "small talk is encouraged"], "people avoid asking personal questions"),
      L("재택근무를 하다 보니 동료들과 소통이 줄었어요.", "What has decreased because of working from home?", ["communication with coworkers", "the amount of work", "commuting costs", "meeting frequency"], "communication with coworkers"),
      L("신입 사원 환영회는 이번에 조용한 식당에서 하기로 했어요.", "Where will the welcome party be held this time?", ["at a quiet restaurant", "at the office", "at a noisy bar", "outdoors in a park"], "at a quiet restaurant"),
      L("직급보다는 이름을 부르는 문화로 바뀌고 있어요.", "What culture change is happening?", ["calling people by name instead of title", "using more formal titles", "removing all job titles from name cards", "requiring uniforms at work"], "calling people by name instead of title"),
      L("부모님이 이번 명절에는 다 같이 여행을 가자고 하셨어요.", "What did the parents suggest for this holiday?", ["going on a trip together", "hosting a big family dinner", "staying home and resting", "visiting relatives separately"], "going on a trip together"),
      L("동생이 취업 준비 때문에 요즘 스트레스를 많이 받아요.", "Why is the younger sibling stressed?", ["preparing for a job search", "studying for final exams", "moving to a new city", "planning a wedding"], "preparing for a job search"),
      L("할머니 생신에 온 가족이 모여서 사진을 찍었어요.", "What did the family do for the grandmother's birthday?", ["gathered together and took a photo", "sent a video message", "held a small party at a restaurant", "gave her a surprise trip"], "gathered together and took a photo"),
      L("부모님이 오랜만에 부부 동반 여행을 다녀오셨대요.", "What did the parents do?", ["went on a trip together as a couple", "visited their hometown alone", "hosted relatives for a week", "started a new hobby together"], "went on a trip together as a couple"),
      L("형이 결혼 준비 때문에 요즘 정신이 없대요.", "Why is the older brother so busy?", ["preparing for his wedding", "moving to a new apartment", "starting a new job", "studying for a certification"], "preparing for his wedding"),
      L("아이 학교 앞으로 이사한 뒤로 등하교가 훨씬 편해졌어요.", "What became more convenient after moving?", ["commuting to and from the child's school", "grocery shopping", "the parents' commute to work", "visiting grandparents"], "commuting to and from the child's school"),

      // NEW_READING

      // NEW_WRITING

      // NEW_SPEAKING
    ],
    readingCount: 2,
    writingCount: 5,
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
      {
        passage:
          "요즘 중고거래 앱을 이용하는 사람들이 눈에 띄게 늘고 있다. 예전에는 안 쓰는 물건을 그냥 버리는 경우가 많았지만, 이제는 사진 몇 장만 올리면 몇 시간 안에 팔리는 경우도 흔하다. 한 이용자는 \"필요 없는 물건을 팔아서 용돈도 벌고 쓰레기도 줄일 수 있어서 일석이조\"라고 말했다. 다만 직거래 과정에서 약속 시간에 나타나지 않거나 상태를 속이고 파는 사람들 때문에 피해를 봤다는 이야기도 종종 들린다. 전문가들은 거래 전 후기를 꼼꼼히 확인하고, 가능하면 사람이 많은 공공장소에서 만날 것을 권한다.",
        questions: [
          R("What is increasingly popular these days?", ["secondhand trading apps", "new furniture stores", "online grocery delivery", "public libraries"], "secondhand trading apps"),
          R("What did the user say is a benefit?", ["earning extra money and reducing waste at the same time", "getting items for free", "meeting new friends", "avoiding taxes"], "earning extra money and reducing waste at the same time"),
          R("What problem does the passage mention?", ["sellers not showing up or misrepresenting item condition", "apps charging high fees", "items always arriving broken", "slow delivery times"], "sellers not showing up or misrepresenting item condition"),
          R("What do experts recommend?", ["checking reviews and meeting in busy public places", "only trading with friends", "avoiding the apps entirely", "always paying in cash in advance"], "checking reviews and meeting in busy public places"),
          R("The expression '일석이조' is closest in meaning to…", ["killing two birds with one stone", "better late than never", "out of sight, out of mind", "practice makes perfect"], "killing two birds with one stone"),
        ],
      },
      {
        passage:
          "삼 년 전, 나는 안정적이던 회사를 그만두고 전혀 다른 분야로 이직했다. 주변에서는 왜 굳이 위험을 감수하냐며 걱정했지만, 매일 반복되는 업무에 흥미를 잃어 가는 나 자신을 더는 무시할 수 없었다. 처음 몇 달은 낯선 업무 때문에 실수도 잦았고 월급도 줄어서 힘들었다. 하지만 시간이 지날수록 새로운 것을 배우는 재미를 느꼈고, 지금은 예전보다 훨씬 만족스럽게 일하고 있다. 돌이켜보면 그때의 선택을 후회한 적은 한 번도 없다.",
        questions: [
          R("What did the writer do three years ago?", ["left a stable job for a completely different field", "got promoted at the same company", "started a business with friends", "retired early"], "left a stable job for a completely different field"),
          R("Why were people around the writer worried?", ["they thought it was too risky", "they thought the new job paid too little", "they didn't like the new company", "they thought it was too far away"], "they thought it was too risky"),
          R("What was difficult about the first few months?", ["frequent mistakes and a lower salary", "long commuting hours", "having no coworkers", "constant business trips"], "frequent mistakes and a lower salary"),
          R("How does the writer feel now?", ["much more satisfied than before", "still unsure about the choice", "planning to switch jobs again", "regretful about leaving"], "much more satisfied than before"),
          R("The phrase '돌이켜보면' is closest in meaning to…", ["looking back", "looking forward", "at first glance", "without exception"], "looking back"),
        ],
      },
      {
        passage:
          "전기차를 사는 사람은 늘고 있지만, 충전 인프라는 그 속도를 따라가지 못하고 있다. 특히 오래된 아파트 단지에는 충전기가 한두 대뿐이라 밤마다 순서를 기다려야 하는 경우가 많다. 한 전기차 운전자는 \"충전기 앞에 차를 세워 놓고 정작 충전은 하지 않는 얌체 운전자들 때문에 더 화가 난다\"고 말했다. 정부는 신축 아파트에 충전기 설치를 의무화하는 법을 추진 중이지만, 기존 아파트에 적용되기까지는 시간이 걸릴 전망이다. 전문가들은 충전 인프라 확대 없이는 전기차 보급 목표를 달성하기 어려울 것이라고 지적한다.",
        questions: [
          R("What problem does the passage describe?", ["charging infrastructure isn't keeping up with EV sales", "electric cars are too expensive", "EV batteries wear out too quickly", "gas prices are rising"], "charging infrastructure isn't keeping up with EV sales"),
          R("What is the situation in older apartment complexes?", ["there are only one or two chargers, so people wait in line", "there are no chargers at all", "charging is completely free", "chargers are reserved for guests only"], "there are only one or two chargers, so people wait in line"),
          R("What frustrates the EV driver interviewed?", ["drivers who park at chargers without actually charging", "chargers breaking down often", "high electricity prices", "long charging times"], "drivers who park at chargers without actually charging"),
          R("What is the government trying to do?", ["require chargers in newly built apartments", "ban gas cars immediately", "lower electric car prices", "build more highways"], "require chargers in newly built apartments"),
          R("The word '보급' is closest in meaning to…", ["spread/distribution", "regulation", "repair", "invention"], "spread/distribution"),
        ],
      },
      {
        passage:
          "나는 몇 년 전까지만 해도 밤늦게까지 깨어 있는 올빼미형 인간이었다. 새벽 두세 시에 잠들고 정오가 다 되어서야 일어나는 생활이 당연했다. 그런데 재택근무를 시작하면서 오전 시간을 통째로 낭비하고 있다는 사실을 깨달았다. 그래서 억지로라도 아침 여섯 시에 일어나기로 결심했다. 처음 한 달은 정말 힘들었지만, 세 달이 지나자 오히려 저녁보다 아침에 머리가 더 맑다는 것을 알게 되었다. 지금은 아침에 일어나자마자 운동을 하고 하루 계획을 세우는데, 이 습관 하나가 삶 전체의 리듬을 바꿔 놓았다.",
        questions: [
          { kr: "", question: "What kind of person was the writer before?", options: ["a night owl who stayed up late", "an early riser", "someone who never slept", "someone who worked night shifts"], answer: "a night owl who stayed up late" },
          { kr: "", question: "What made the writer realize a problem?", options: ["wasting the entire morning after starting remote work", "getting fired for being late", "a doctor's warning", "losing a promotion"], answer: "wasting the entire morning after starting remote work" },
          { kr: "", question: "How long did it take to feel the benefit?", options: ["about three months", "one week", "a year", "it never improved"], answer: "about three months" },
          { kr: "", question: "What does the writer do right after waking up now?", options: ["exercise and plan the day", "check email for two hours", "go back to sleep briefly", "make breakfast for the family"], answer: "exercise and plan the day" },
          { kr: "", question: "The phrase '억지로라도' is closest in meaning to…", options: ["even if forced / reluctantly", "naturally", "occasionally", "never again"], answer: "even if forced / reluctantly" },
        ],
      },
      {
        passage:
          "담배를 끊은 지 이제 이 년이 넘었다. 십 년 넘게 피워 온 습관이라 처음에는 절대 못 끊을 거라고 생각했다. 결심하게 된 계기는 단순했다. 조카가 \"삼촌한테서 담배 냄새가 나서 안기기 싫다\"고 말한 것이다. 그 말을 듣고 나서 며칠 동안 고민하다가 금연 앱을 깔고 하루하루 버텨 보기로 했다. 초반 두 달은 스트레스를 받을 때마다 손이 떨릴 정도로 힘들었지만, 대신 껌을 씹거나 산책을 하면서 버텼다. 지금은 냄새조차 맡기 싫을 정도로 담배와 멀어졌고, 무엇보다 계단을 올라도 숨이 차지 않는다는 게 가장 큰 변화다.",
        questions: [
          { kr: "", question: "How long has the writer been smoke-free?", options: ["over two years", "six months", "ten years", "one week"], answer: "over two years" },
          { kr: "", question: "What triggered the decision to quit?", options: ["a nephew/niece said they didn't want to be hugged because of the smoke smell", "a doctor's diagnosis", "a rise in cigarette prices", "a coworker's complaint"], answer: "a nephew/niece said they didn't want to be hugged because of the smoke smell" },
          { kr: "", question: "What tool did the writer use to help quit?", options: ["a quit-smoking app", "nicotine patches", "hypnosis", "a support group"], answer: "a quit-smoking app" },
          { kr: "", question: "What did the writer do instead of smoking when stressed?", options: ["chew gum or take a walk", "eat snacks", "call a friend", "drink coffee"], answer: "chew gum or take a walk" },
          { kr: "", question: "What is the biggest change the writer notices now?", options: ["not getting out of breath climbing stairs", "sleeping better", "saving a lot of money", "having whiter teeth"], answer: "not getting out of breath climbing stairs" },
        ],
      },
      {
        passage:
          "스마트폰 사용 시간을 확인하고 깜짝 놀란 적이 있다. 하루 평균 여섯 시간, 대부분이 특별한 목적 없이 화면을 넘기며 흘려보낸 시간이었다. 그날부터 나는 잠자리에 들기 한 시간 전부터는 휴대폰을 다른 방에 두기로 규칙을 정했다. 처음에는 손이 허전해서 자꾸 방으로 돌아가 확인하고 싶었지만, 대신 그 시간에 책을 읽거나 일기를 쓰기 시작했다. 몇 주가 지나자 잠도 훨씬 잘 오고, 아침에 눈을 뜨자마자 휴대폰부터 찾던 습관도 사라졌다. 화면 없이 보내는 그 한 시간이 하루 중 가장 소중한 시간이 되었다.",
        questions: [
          { kr: "", question: "What did the writer discover about phone use?", options: ["averaging six hours a day, mostly aimless scrolling", "using it only for work", "never checking it at night", "using it exactly one hour a day"], answer: "averaging six hours a day, mostly aimless scrolling" },
          { kr: "", question: "What new rule did the writer set?", options: ["keeping the phone in another room an hour before bed", "deleting all social media apps", "turning off the phone entirely on weekends", "only using the phone at work"], answer: "keeping the phone in another room an hour before bed" },
          { kr: "", question: "What did the writer do instead during that hour?", options: ["read books or write in a journal", "watch TV", "exercise", "call family members"], answer: "read books or write in a journal" },
          { kr: "", question: "What changed after a few weeks?", options: ["sleep improved and the morning phone-checking habit disappeared", "the writer stopped reading", "stress increased", "nothing changed at all"], answer: "sleep improved and the morning phone-checking habit disappeared" },
          { kr: "", question: "The word '허전해서' is closest in meaning to…", options: ["feeling empty/unsettled", "feeling excited", "feeling proud", "feeling sleepy"], answer: "feeling empty/unsettled" },
        ],
      },
      {
        passage:
          "동생과 나는 어릴 때부터 유난히 사이가 좋지 않았다. 사소한 일로 자주 다퉜고, 성인이 된 후에도 서로 연락을 거의 하지 않고 지냈다. 그러던 중 아버지가 갑자기 입원하시면서 병원에서 매일 마주칠 수밖에 없었다. 처음에는 서먹했지만, 함께 아버지를 돌보며 자연스럽게 대화가 늘어났다. 동생이 그동안 나에게 서운했던 점을 솔직하게 털어놓았을 때, 나 역시 몰랐던 오해가 많았다는 것을 알게 되었다. 아버지는 다행히 건강을 회복하셨지만, 그 일을 계기로 동생과 나는 예전보다 훨씬 가까워졌다. 위기가 오히려 관계를 회복시켜 준 셈이다.",
        questions: [
          { kr: "", question: "How was the relationship between the writer and their sibling before?", options: ["not close, with frequent small arguments", "extremely close since childhood", "they never met", "they lived together happily"], answer: "not close, with frequent small arguments" },
          { kr: "", question: "What event brought them together?", options: ["their father's sudden hospitalization", "a family wedding", "moving into the same apartment", "a shared business"], answer: "their father's sudden hospitalization" },
          { kr: "", question: "What did the sibling do at the hospital?", options: ["honestly shared feelings of hurt from the past", "avoided the writer completely", "argued about money", "left early each day"], answer: "honestly shared feelings of hurt from the past" },
          { kr: "", question: "What was the outcome for the father?", options: ["he recovered his health", "he passed away", "he needed surgery again", "he moved to another hospital"], answer: "he recovered his health" },
          { kr: "", question: "What is the overall message of the passage?", options: ["a crisis can actually help repair a relationship", "family conflicts never get resolved", "hospitals are stressful places", "siblings should live separately"], answer: "a crisis can actually help repair a relationship" },
        ],
      },
      {
        passage:
          "나는 오랫동안 부탁을 거절하지 못하는 사람이었다. 친구가 갑자기 부탁을 하면 내 일정이 아무리 바빠도 \"안 돼\"라는 말이 입 밖으로 나오지 않았다. 그러다 보니 정작 내 시간과 에너지는 늘 부족했고, 마음속으로는 불만이 쌓여 갔다. 어느 날 상담을 받으면서 \"거절은 관계를 망치는 것이 아니라 오히려 건강하게 만든다\"는 말을 듣고 조금씩 연습을 시작했다. 처음에는 거절한 후 죄책감에 시달렸지만, 신기하게도 진짜 친구들은 거절해도 관계가 달라지지 않았다. 오히려 내가 무리하지 않으니 만날 때마다 더 즐거운 시간을 보낼 수 있게 되었다.",
        questions: [
          { kr: "", question: "What kind of person was the writer for a long time?", options: ["someone who couldn't say no to requests", "someone who never asked friends for help", "someone who avoided all friendships", "someone who only helped family"], answer: "someone who couldn't say no to requests" },
          { kr: "", question: "What was the result of always saying yes?", options: ["chronic lack of time and energy, with growing resentment", "making a lot of new friends", "becoming very organized", "earning extra money"], answer: "chronic lack of time and energy, with growing resentment" },
          { kr: "", question: "What did counseling teach the writer?", options: ["saying no can actually make relationships healthier", "friends should never be trusted", "counseling doesn't help with this issue", "the writer should quit their job"], answer: "saying no can actually make relationships healthier" },
          { kr: "", question: "What happened at first after saying no?", options: ["the writer felt guilty", "the writer felt relieved immediately", "friends stopped talking to the writer", "nothing changed emotionally"], answer: "the writer felt guilty" },
          { kr: "", question: "What did the writer discover about real friends?", options: ["the relationship didn't change even after being refused", "they got angry and left", "they stopped inviting the writer out", "they demanded an apology"], answer: "the relationship didn't change even after being refused" },
        ],
      },
      {
        passage:
          "결혼하고 나서 가장 크게 배운 것은 '같이 살기 위해서는 서로 양보하는 법을 배워야 한다'는 사실이다. 나는 집이 조용해야 마음이 편한 사람이고, 남편은 늘 음악을 틀어 놓아야 편안함을 느끼는 사람이었다. 신혼 초에는 이 작은 차이 때문에 자주 부딪혔다. 결국 우리는 각자 조용히 있고 싶은 시간과 음악을 듣는 시간을 정해 놓기로 했다. 처음에는 규칙을 지키는 게 어색했지만, 시간이 지나면서 오히려 서로의 공간과 취향을 존중하는 법을 배우게 되었다. 완벽하게 똑같아질 필요는 없다는 것, 그것이 결혼 생활에서 얻은 가장 큰 깨달음이다.",
        questions: [
          { kr: "", question: "What did the writer learn most from getting married?", options: ["the importance of compromise to live together", "how to cook well", "how to manage finances", "how to argue less about money"], answer: "the importance of compromise to live together" },
          { kr: "", question: "What is the difference between the writer and the husband?", options: ["one prefers quiet, the other prefers music playing", "one is a morning person, the other a night owl", "one likes to travel, the other doesn't", "one is neat, the other messy"], answer: "one prefers quiet, the other prefers music playing" },
          { kr: "", question: "How did they solve the problem?", options: ["set specific times for quiet and for music", "one of them moved out temporarily", "they stopped talking about it", "they hired a counselor"], answer: "set specific times for quiet and for music" },
          { kr: "", question: "How did the writer feel about the rule at first?", options: ["awkward", "perfectly natural", "angry", "indifferent"], answer: "awkward" },
          { kr: "", question: "What is the main realization the writer reaches?", options: ["a couple doesn't need to become exactly alike", "couples should always agree", "music is more important than silence", "marriage requires giving up all hobbies"], answer: "a couple doesn't need to become exactly alike" },
        ],
      },
      {
        passage:
          "십 년 넘게 대기업에서 일하다가 작년에 그만두고 고등학교 국어 교사가 되었다. 주변에서는 연봉이 크게 줄어드는데 왜 그러냐고 물었지만, 나에게는 다른 이유가 있었다. 회사에서는 매년 실적 숫자만 신경 쓰다 보니 내가 하는 일의 의미를 점점 느끼지 못했다. 반면 학생들과 함께 책을 읽고 토론하는 상상을 하면 오랜만에 가슴이 뛰었다. 교사가 되고 나서 첫 학기는 수업 준비만으로도 밤을 새우기 일쑤였다. 하지만 학생이 \"선생님 덕분에 책 읽는 게 재밌어졌어요\"라고 말했을 때, 나는 이 선택이 옳았다는 것을 확신했다.",
        questions: [
          { kr: "", question: "What career change did the writer make?", options: ["left a large company to become a high school teacher", "left teaching to join a company", "started a small business", "moved from teaching to journalism"], answer: "left a large company to become a high school teacher" },
          { kr: "", question: "What bothered the writer about the corporate job?", options: ["only caring about performance numbers, losing a sense of meaning", "the long commute", "having no coworkers", "constant business travel"], answer: "only caring about performance numbers, losing a sense of meaning" },
          { kr: "", question: "What was the first semester of teaching like?", options: ["often staying up late preparing lessons", "very relaxed with lots of free time", "mostly spent on paperwork", "focused on grading exams only"], answer: "often staying up late preparing lessons" },
          { kr: "", question: "What confirmed the writer's decision was right?", options: ["a student said reading became fun thanks to the teacher", "a big raise", "praise from the principal", "winning a teaching award"], answer: "a student said reading became fun thanks to the teacher" },
          { kr: "", question: "The phrase '가슴이 뛰었다' is closest in meaning to…", options: ["felt excited", "felt scared", "felt exhausted", "felt bored"], answer: "felt excited" },
        ],
      },
      {
        passage:
          "회사가 갑자기 구조조정을 발표했을 때, 나는 십오 년 만에 처음으로 실직자가 되었다. 처음 몇 주는 이력서만 계속 넣으며 재취업을 준비했지만, 나이 때문인지 면접까지 가는 일도 드물었다. 그러던 중 예전부터 관심 있던 수제 빵집을 작게라도 열어 보자는 생각이 들었다. 퇴직금 대부분을 투자하는 것이라 아내는 걱정이 컸지만, 나는 이번이 마지막 기회라고 생각했다. 처음 몇 달은 손님이 거의 없어 문을 닫고 싶은 순간도 많았다. 하지만 단골손님이 하나둘 늘면서 지금은 동네에서 꽤 알려진 빵집이 되었다. 실직이 오히려 새로운 인생의 문을 열어 준 셈이다.",
        questions: [
          { kr: "", question: "What happened to the writer after fifteen years at the company?", options: ["became unemployed due to sudden restructuring", "got promoted to manager", "was transferred abroad", "retired voluntarily"], answer: "became unemployed due to sudden restructuring" },
          { kr: "", question: "What did the writer decide to do?", options: ["open a small handmade bread shop", "start a delivery business", "go back to school", "move to another city for a new job"], answer: "open a small handmade bread shop" },
          { kr: "", question: "How did the wife feel about the plan?", options: ["worried, since it used most of the severance pay", "excited and fully supportive from the start", "indifferent", "angry and against it entirely"], answer: "worried, since it used most of the severance pay" },
          { kr: "", question: "What was difficult in the first few months?", options: ["having very few customers", "finding a location", "hiring staff", "getting loans"], answer: "having very few customers" },
          { kr: "", question: "How does the writer describe the outcome now?", options: ["a fairly well-known bakery in the neighborhood", "a shop that closed after a year", "a business sold to a franchise", "a shop still struggling badly"], answer: "a fairly well-known bakery in the neighborhood" },
        ],
      },
      {
        passage:
          "지난달 회사에서 팀장 승진을 제안받았지만, 나는 정중히 거절했다. 동료들은 다들 의아해했다. 승진하면 연봉도 오르고 경력에도 도움이 되는데 왜 마다하냐는 것이었다. 하지만 나는 이미 지금 업무만으로도 야근이 잦고, 아이와 보낼 시간이 점점 줄어드는 것이 늘 마음에 걸렸다. 팀장이 되면 책임과 회의가 더 늘어날 것이 뻔했다. 고민 끝에 나는 승진 대신 지금의 균형을 지키는 쪽을 택했다. 상사는 아쉬워했지만 내 선택을 존중해 주었다. 남들이 보기엔 이해하기 어려운 결정일 수 있지만, 나에게는 무엇보다 옳은 선택이었다.",
        questions: [
          { kr: "", question: "What offer did the writer turn down?", options: ["a promotion to team leader", "a transfer to another branch", "a raise without new duties", "an offer from another company"], answer: "a promotion to team leader" },
          { kr: "", question: "Why were colleagues surprised?", options: ["a promotion usually means higher pay and career benefit", "the writer had asked for it before", "the position had no downsides", "everyone always accepts promotions"], answer: "a promotion usually means higher pay and career benefit" },
          { kr: "", question: "What was the writer already concerned about?", options: ["frequent overtime and less time with their child", "poor health", "a long commute", "low salary"], answer: "frequent overtime and less time with their child" },
          { kr: "", question: "What did the writer choose instead?", options: ["keeping the current work-life balance", "quitting the job entirely", "asking for a transfer", "negotiating a part-time schedule"], answer: "keeping the current work-life balance" },
          { kr: "", question: "How did the boss react?", options: ["felt it was a pity but respected the decision", "refused to accept the decision", "fired the writer", "insisted on the promotion anyway"], answer: "felt it was a pity but respected the decision" },
        ],
      },
      {
        passage:
          "이 년 전, 나는 아무 연고도 없는 캐나다로 혼자 떠났다. 영어도 서툴렀고 아는 사람 하나 없었지만, 새로운 환경에서 나 자신을 시험해 보고 싶었다. 도착한 첫 달은 매일 밤 외로움에 눈물을 흘릴 정도로 힘들었다. 은행 계좌를 여는 것부터 집을 구하는 것까지 모든 게 낯설고 서툴렀다. 그러나 도서관에서 우연히 만난 외국인 친구 덕분에 조금씩 생활에 적응하기 시작했다. 지금은 그 친구와 함께 작은 사업을 준비하고 있을 정도로 가까워졌다. 낯선 곳에서 혼자 버텨 낸 그 시간이 나를 훨씬 단단한 사람으로 만들어 주었다.",
        questions: [
          { kr: "", question: "Where did the writer move to alone?", options: ["Canada, with no connections there", "a nearby city in their home country", "Japan, to study", "Australia, for a job"], answer: "Canada, with no connections there" },
          { kr: "", question: "What was the first month like?", options: ["so lonely that the writer cried nearly every night", "surprisingly comfortable and easy", "spent mostly traveling", "filled with new friends immediately"], answer: "so lonely that the writer cried nearly every night" },
          { kr: "", question: "What was difficult at first?", options: ["everyday tasks like opening a bank account and finding housing", "learning to cook", "finding a job interview", "getting a visa"], answer: "everyday tasks like opening a bank account and finding housing" },
          { kr: "", question: "Who helped the writer adjust?", options: ["a foreign friend met by chance at the library", "a relative living nearby", "a coworker from the same country", "an online community"], answer: "a foreign friend met by chance at the library" },
          { kr: "", question: "What are the writer and that friend doing now?", options: ["preparing a small business together", "no longer in contact", "living in different countries", "working for the same large company"], answer: "preparing a small business together" },
        ],
      },
      {
        passage:
          "복잡한 도시 생활에 지쳐 삼 년 전 시골 마을로 이사했다. 서울에서 나고 자란 나에게 시골살이는 완전히 낯선 도전이었다. 처음에는 편의점 하나 가려면 차로 이십 분을 가야 한다는 사실에 답답했다. 겨울에는 눈이 많이 내려 며칠씩 마을이 고립되기도 했다. 하지만 계절이 바뀔 때마다 달라지는 풍경을 보고, 이웃들과 텃밭에서 기른 채소를 나눠 먹으면서 도시에서는 몰랐던 여유를 느끼게 되었다. 아이들도 마당에서 뛰어놀며 훨씬 밝아졌다. 불편함은 여전히 있지만, 지금의 삶을 도시로 다시 바꾸고 싶지는 않다.",
        questions: [
          { kr: "", question: "Why did the writer move to the countryside?", options: ["feeling exhausted by complicated city life", "for a job transfer", "to be near aging parents", "to save on housing costs"], answer: "feeling exhausted by complicated city life" },
          { kr: "", question: "What was frustrating at first?", options: ["needing a 20-minute drive to reach a convenience store", "having no internet access", "extremely high living costs", "no schools nearby"], answer: "needing a 20-minute drive to reach a convenience store" },
          { kr: "", question: "What happened in winter?", options: ["the village was sometimes isolated by heavy snow", "the writer moved back to the city", "the house lost heating for weeks", "nothing changed at all"], answer: "the village was sometimes isolated by heavy snow" },
          { kr: "", question: "What positive change does the writer describe?", options: ["a sense of ease unknown in the city, from seasons and sharing vegetables with neighbors", "higher income from farming", "better internet speed", "shorter work hours"], answer: "a sense of ease unknown in the city, from seasons and sharing vegetables with neighbors" },
          { kr: "", question: "How do the writer's children seem now?", options: ["much brighter, playing in the yard", "more anxious than before", "unchanged", "wanting to move back to the city"], answer: "much brighter, playing in the yard" },
        ],
      },
      {
        passage:
          "대학 졸업 후 십 년 넘게 타지에서 살다가 작년에 고향으로 돌아왔다. 오랜만의 귀향이라 설렜지만, 막상 돌아와 보니 예전 친구들은 대부분 다른 곳으로 떠나 있었고, 익숙했던 거리도 많이 변해 있었다. 처음 몇 달은 어디에도 속하지 못한 듯한 기분이 들어 오히려 타지에 있을 때보다 더 외로웠다. 그러다 동네 도서관에서 진행하는 독서 모임에 우연히 참여하게 되었고, 그곳에서 비슷한 시기에 돌아온 사람들을 만났다. 함께 이야기를 나누면서 고향이 예전과 같지 않아도 괜찮다는 것을, 새로운 관계 속에서 다시 뿌리를 내릴 수 있다는 것을 깨달았다.",
        questions: [
          { kr: "", question: "What did the writer do after living away for over ten years?", options: ["returned to their hometown", "moved abroad permanently", "stayed in the same city", "moved to a different foreign country"], answer: "returned to their hometown" },
          { kr: "", question: "What did the writer find upon returning?", options: ["most old friends had moved elsewhere and the streets had changed", "everything was exactly the same as before", "the hometown had grown much smaller", "no one remembered the writer"], answer: "most old friends had moved elsewhere and the streets had changed" },
          { kr: "", question: "How did the writer feel in the first few months?", options: ["lonelier than while living away", "instantly at home and comfortable", "angry at old friends", "eager to leave again immediately"], answer: "lonelier than while living away" },
          { kr: "", question: "How did the writer meet new people?", options: ["by joining a book club at the local library", "through a coworker", "at a family gathering", "through an old classmate"], answer: "by joining a book club at the local library" },
          { kr: "", question: "What did the writer come to realize?", options: ["new roots can grow even if home has changed", "returning home was a mistake", "old friendships are irreplaceable", "libraries are the best place to meet people"], answer: "new roots can grow even if home has changed" },
        ],
      },
      {
        passage:
          "나는 삼수 끝에도 원하던 대학에 들어가지 못했다. 그때는 세상이 끝난 것처럼 느껴졌고, 몇 달 동안 방에서 나오지 않을 정도로 힘들어했다. 하지만 언제까지나 주저앉아 있을 수는 없어서, 일단 눈에 보이는 전문학교에 들어가 관심 있던 분야를 공부하기 시작했다. 처음에는 어쩔 수 없이 선택한 길이라고 생각했지만, 막상 배워 보니 생각보다 훨씬 적성에 맞았다. 지금은 그 분야에서 어엿한 전문가로 인정받고 있다. 돌이켜보면 그때의 실패가 없었다면 지금의 나도 없었을 것이다. 실패는 끝이 아니라 다른 길로 가는 문이었다.",
        questions: [
          { kr: "", question: "What happened after three attempts at the college entrance exam?", options: ["the writer still failed to get into the desired university", "the writer succeeded on the third try", "the writer gave up studying entirely", "the writer got a scholarship"], answer: "the writer still failed to get into the desired university" },
          { kr: "", question: "How did the writer react at first?", options: ["stayed in the room for months, deeply discouraged", "immediately started a new plan", "felt relieved", "blamed the teachers"], answer: "stayed in the room for months, deeply discouraged" },
          { kr: "", question: "What did the writer do next?", options: ["entered a vocational school in a field of interest", "retook the exam a fourth time", "started working full-time immediately", "moved abroad to study"], answer: "entered a vocational school in a field of interest" },
          { kr: "", question: "How did the writer feel about the field after studying it?", options: ["it suited the writer much better than expected", "it was a complete waste of time", "it was harder than the original goal", "it was less interesting than expected"], answer: "it suited the writer much better than expected" },
          { kr: "", question: "What is the writer's overall conclusion?", options: ["failure was a door to another path, not an end", "failure should always be avoided", "success only comes from the first attempt", "college is not important at all"], answer: "failure was a door to another path, not an end" },
        ],
      },
      {
        passage:
          "몇 년 전 나는 친구와 함께 작은 온라인 쇼핑몰을 시작했다가 일 년 만에 문을 닫아야 했다. 준비 없이 유행만 따라 아이템을 골랐고, 재고 관리도 제대로 하지 못했다. 결국 빚만 남긴 채 사업을 정리하면서 한동안 사람들 앞에서 그 이야기를 꺼내지도 못할 만큼 부끄러웠다. 하지만 시간이 지나면서 그때의 실수들을 하나씩 복기해 보았다. 시장 조사 없이 성급하게 시작한 것, 자금 계획을 세우지 않은 것 등 문제가 명확히 보이기 시작했다. 이번에 새로 시작한 사업은 그 실패에서 배운 원칙들을 철저히 지키고 있고, 다행히 순조롭게 자리를 잡아 가고 있다.",
        questions: [
          { kr: "", question: "What happened to the writer's first online shop?", options: ["it had to close after just one year", "it grew into a large company", "it was sold for a profit", "it is still running successfully"], answer: "it had to close after just one year" },
          { kr: "", question: "What went wrong the first time?", options: ["chasing trends without preparation and poor inventory management", "too much market research", "hiring too many employees", "excessive advertising spending"], answer: "chasing trends without preparation and poor inventory management" },
          { kr: "", question: "How did the writer feel after the failure?", options: ["too embarrassed to talk about it for a while", "proud of the experience immediately", "indifferent to what happened", "eager to tell everyone right away"], answer: "too embarrassed to talk about it for a while" },
          { kr: "", question: "What did the writer do over time?", options: ["reviewed the mistakes one by one", "avoided starting any new business", "blamed the friend entirely", "gave up on business permanently"], answer: "reviewed the mistakes one by one" },
          { kr: "", question: "How is the new business going?", options: ["settling in smoothly by following lessons learned", "failing in the same way as before", "not yet started", "run entirely by someone else now"], answer: "settling in smoothly by following lessons learned" },
        ],
      },
      {
        passage:
          "작년 첫 마라톤 대회에서 나는 완주에 실패했다. 이십 킬로미터 지점에서 다리에 쥐가 나 결국 중도 포기할 수밖에 없었다. 몇 달 동안 준비한 시간이 물거품이 된 것 같아 크게 낙담했다. 하지만 포기 지점에서 만난 다른 참가자가 \"완주보다 다시 도전하는 게 더 중요하다\"고 건넨 말이 오래 마음에 남았다. 그 후 나는 훈련 방식을 완전히 바꿨다. 무리하게 거리를 늘리는 대신 근력 운동과 회복을 함께 챙기기 시작했다. 올해 다시 도전한 대회에서는 비록 기록은 평범했지만 끝까지 완주할 수 있었다. 그 순간의 기쁨은 어떤 기록보다도 값진 것이었다.",
        questions: [
          { kr: "", question: "What happened at the writer's first marathon?", options: ["failed to finish due to a leg cramp at the 20km mark", "finished with a personal best", "was disqualified for cheating", "finished but felt disappointed with the time"], answer: "failed to finish due to a leg cramp at the 20km mark" },
          { kr: "", question: "What helped the writer emotionally afterward?", options: ["words from another participant about trying again", "a doctor's advice", "a coach's criticism", "reading a book about marathons"], answer: "words from another participant about trying again" },
          { kr: "", question: "How did the writer change their training?", options: ["added strength training and recovery instead of just increasing distance", "trained even harder without rest", "stopped training for months", "hired a personal trainer full-time"], answer: "added strength training and recovery instead of just increasing distance" },
          { kr: "", question: "What was the result this year?", options: ["finished the race, though with an ordinary time", "set a new personal record", "quit again at the same point", "didn't participate at all"], answer: "finished the race, though with an ordinary time" },
          { kr: "", question: "How does the writer describe that moment of finishing?", options: ["more valuable than any record", "disappointing compared to expectations", "not as meaningful as the first attempt", "something the writer wants to forget"], answer: "more valuable than any record" },
        ],
      },
      {
        passage:
          "운동과는 담을 쌓고 살던 내가 달리기를 시작한 지도 어느덧 이 년이 되었다. 계기는 단순했다. 건강검진에서 체력이 또래보다 훨씬 떨어진다는 말을 듣고 겁이 났던 것이다. 처음에는 오백 미터도 못 뛰고 헐떡였지만, 매일 조금씩 거리를 늘려 나갔다. 달리기를 하면서 가장 크게 바뀐 것은 체력만이 아니었다. 머릿속이 복잡할 때 달리다 보면 신기하게도 생각이 정리됐고, 스트레스를 다루는 방식 자체가 달라졌다. 이제는 하루라도 뛰지 않으면 오히려 몸이 찌뿌둥하게 느껴진다. 사소한 계기로 시작한 습관이 삶을 대하는 태도까지 바꿔 놓을 줄은 몰랐다.",
        questions: [
          { kr: "", question: "What was the writer like before starting running?", options: ["had nothing to do with exercise", "was already a competitive athlete", "ran occasionally for fun", "hated all outdoor activities equally"], answer: "had nothing to do with exercise" },
          { kr: "", question: "What prompted the writer to start running?", options: ["a health checkup showing poor fitness for their age", "a friend's invitation", "training for a specific race", "a doctor's prescription"], answer: "a health checkup showing poor fitness for their age" },
          { kr: "", question: "What happened at first when running?", options: ["couldn't even run 500 meters without gasping", "ran a full marathon on day one", "injured a knee immediately", "found it easy from the start"], answer: "couldn't even run 500 meters without gasping" },
          { kr: "", question: "What unexpected benefit did running bring?", options: ["clearer thinking and a new way of handling stress", "a new career in sports", "weight gain from muscle building", "meeting a large group of friends"], answer: "clearer thinking and a new way of handling stress" },
          { kr: "", question: "How does the writer feel on a day without running now?", options: ["physically sluggish", "perfectly fine and relaxed", "more energetic than usual", "unable to tell any difference"], answer: "physically sluggish" },
        ],
      },
      {
        passage:
          "베란다에 작은 화분 두 개를 놓은 것이 시작이었다. 처음에는 그저 집안 분위기를 바꿔 보려는 마음이었는데, 식물을 하나둘 늘리다 보니 어느새 작은 텃밭 수준이 되었다. 매일 아침 물을 주고 잎을 살피는 시간이 생기면서 하루의 시작이 훨씬 차분해졌다. 식물이 시들면 원인을 찾아보고, 다시 살아나면 그렇게 뿌듯할 수가 없었다. 실패도 많았다. 애써 키운 방울토마토가 며칠 만에 벌레 때문에 다 죽어 버린 적도 있었다. 그래도 포기하지 않고 계속하다 보니 이제는 직접 기른 채소로 저녁 식탁을 차릴 정도가 되었다. 식물을 돌보는 일이 나를 훨씬 여유 있는 사람으로 만들어 주었다.",
        questions: [
          { kr: "", question: "How did the writer's gardening hobby start?", options: ["with two small pots on the balcony", "by inheriting a large garden", "by joining a gardening club", "with a gift of seeds from a neighbor"], answer: "with two small pots on the balcony" },
          { kr: "", question: "What effect did the morning watering routine have?", options: ["made the start of the day much calmer", "made mornings more rushed", "had no noticeable effect", "made the writer more anxious"], answer: "made the start of the day much calmer" },
          { kr: "", question: "What failure does the writer mention?", options: ["cherry tomatoes dying from insects within days", "an entire balcony collapsing", "flooding the apartment", "losing all plants to frost"], answer: "cherry tomatoes dying from insects within days" },
          { kr: "", question: "What can the writer do now?", options: ["make dinner with home-grown vegetables", "sell vegetables at a market", "grow only flowers, no vegetables", "run a plant shop"], answer: "make dinner with home-grown vegetables" },
          { kr: "", question: "How has gardening changed the writer overall?", options: ["made them a more relaxed person", "made them busier and more stressed", "had little lasting effect", "made them want to move to a farm"], answer: "made them a more relaxed person" },
        ],
      },
      {
        passage:
          "그림과는 전혀 관련 없는 삶을 살던 내가 삼십 대 중반에 취미로 그림을 배우기 시작했다. 처음에는 손이 떨려 직선 하나 제대로 긋지 못했지만, 매주 한 번씩 수업을 들으며 조금씩 실력이 늘었다. 그림을 그리는 동안에는 신기하게도 회사 걱정도, 미래에 대한 불안도 잊게 되었다. 완성된 그림을 보며 느끼는 성취감은 업무에서 얻는 것과는 전혀 다른 종류의 만족이었다. 얼마 전에는 동네 작은 카페에서 열린 아마추어 전시회에 그림 두 점을 걸기도 했다. 잘 그리고 못 그리고를 떠나, 나만의 세계를 표현할 수 있다는 것 자체가 큰 위안이 된다는 것을 이제야 알게 되었다.",
        questions: [
          { kr: "", question: "When did the writer start learning to paint?", options: ["in their mid-thirties, as a hobby", "as a child", "in college as a major", "after retiring"], answer: "in their mid-thirties, as a hobby" },
          { kr: "", question: "What was difficult at the very beginning?", options: ["couldn't even draw a straight line without a shaky hand", "couldn't afford art supplies", "had no time to attend class", "couldn't find a teacher"], answer: "couldn't even draw a straight line without a shaky hand" },
          { kr: "", question: "What happens while the writer paints?", options: ["work worries and future anxiety are forgotten", "the writer becomes more anxious", "the writer thinks about work more", "nothing changes emotionally"], answer: "work worries and future anxiety are forgotten" },
          { kr: "", question: "What recent achievement does the writer mention?", options: ["displaying two paintings at an amateur exhibit in a local cafe", "selling a painting for a high price", "winning a national art contest", "being featured in a magazine"], answer: "displaying two paintings at an amateur exhibit in a local cafe" },
          { kr: "", question: "What does the writer realize painting offers?", options: ["comfort from expressing one's own world, regardless of skill", "a new career path", "a way to make money quickly", "a way to impress coworkers"], answer: "comfort from expressing one's own world, regardless of skill" },
        ],
      },
      {
        passage:
          "회사에서 받은 스트레스를 풀 방법을 찾다가 우연히 중고 기타를 하나 사게 되었다. 악보도 볼 줄 몰랐고 코드 하나 잡는 것도 서툴렀지만, 유튜브 영상을 보며 독학으로 연습을 시작했다. 손끝이 아파 며칠 쉬었다가 다시 잡기를 반복하면서도 신기하게 그만두고 싶다는 생각은 들지 않았다. 여섯 달쯤 지나자 좋아하는 노래 한 곡을 제법 그럴듯하게 연주할 수 있게 되었고, 그때의 뿌듯함은 지금도 잊을 수 없다. 최근에는 같은 취미를 가진 사람들과 소모임을 만들어 한 달에 한 번씩 함께 연주하기도 한다. 기타를 배우면서 나는 무언가를 처음부터 끝까지 꾸준히 해내는 즐거움을 다시 알게 되었다.",
        questions: [
          { kr: "", question: "How did the writer start learning guitar?", options: ["bought a used guitar while looking for a way to relieve stress", "received it as a birthday gift", "took formal lessons at a school", "borrowed one from a friend permanently"], answer: "bought a used guitar while looking for a way to relieve stress" },
          { kr: "", question: "How did the writer learn to play?", options: ["self-taught using YouTube videos", "with a private tutor", "through a mobile app only", "by joining a band immediately"], answer: "self-taught using YouTube videos" },
          { kr: "", question: "What happened to the writer's fingers?", options: ["they hurt, requiring breaks of a few days", "they never hurt at all", "the writer got a permanent injury", "the writer switched to a different instrument"], answer: "they hurt, requiring breaks of a few days" },
          { kr: "", question: "What did the writer achieve after about six months?", options: ["could play a favorite song fairly well", "could compose original songs", "performed at a concert hall", "became a professional musician"], answer: "could play a favorite song fairly well" },
          { kr: "", question: "What does the writer do recently with this hobby?", options: ["plays together with a small group once a month", "practices alone every day, never with others", "has stopped playing guitar", "teaches guitar professionally"], answer: "plays together with a small group once a month" },
        ],
      },
      {
        passage:
          "요리에는 전혀 관심이 없던 내가 요리를 배우기 시작한 건 순전히 배달 음식값이 부담스러워서였다. 처음에는 계란 프라이 하나도 태우기 일쑤였지만, 인터넷 레시피를 보며 하나씩 따라 하다 보니 조금씩 자신감이 붙었다. 신기하게도 재료를 손질하고 요리가 완성되어 가는 과정 자체에서 묘한 몰입감을 느끼게 되었다. 실패한 요리를 억지로 먹으며 웃었던 기억도, 처음으로 친구를 초대해 직접 만든 음식을 대접했던 뿌듯함도 모두 소중한 경험이 되었다. 지금은 주말마다 새로운 레시피에 도전하는 것이 가장 큰 즐거움이 되었고, 돈을 아끼려던 소박한 시작이 삶의 활력소가 될 줄은 몰랐다.",
        questions: [
          { kr: "", question: "Why did the writer start learning to cook?", options: ["delivery food was becoming too expensive", "wanted to become a professional chef", "a doctor recommended home cooking", "moved in with a partner who couldn't cook"], answer: "delivery food was becoming too expensive" },
          { kr: "", question: "What happened at the very beginning?", options: ["even burned fried eggs regularly", "cooked perfectly from the first try", "refused to follow any recipes", "only cooked desserts"], answer: "even burned fried eggs regularly" },
          { kr: "", question: "What unexpected feeling did cooking bring?", options: ["a sense of deep focus while preparing and cooking", "constant boredom", "anxiety about food safety", "frustration that never went away"], answer: "a sense of deep focus while preparing and cooking" },
          { kr: "", question: "What memory does the writer mention fondly?", options: ["laughing while eating a failed dish, and hosting a friend for the first time", "winning a cooking competition", "being complimented by a chef", "opening a small restaurant"], answer: "laughing while eating a failed dish, and hosting a friend for the first time" },
          { kr: "", question: "What does the writer do now every weekend?", options: ["tries a new recipe", "eats out at restaurants instead", "orders delivery as before", "avoids the kitchen entirely"], answer: "tries a new recipe" },
        ],
      },
      {
        passage:
          "여행지에서 찍은 사진이 마음에 들지 않아 충동적으로 카메라를 산 것이 사진 취미의 시작이었다. 처음에는 그저 예쁜 풍경을 찍는 데만 급급했지만, 사진 수업을 들으며 빛과 구도를 신경 쓰기 시작하자 같은 장소도 완전히 다르게 보이기 시작했다. 출근길에 마주치는 평범한 골목, 지하철역의 낡은 계단 같은 것들도 이제는 카메라를 꺼내고 싶은 순간이 되었다. 덕분에 바쁘게만 지나치던 일상을 천천히 관찰하는 습관이 생겼다. 얼마 전에는 그동안 찍은 사진들을 모아 작은 개인 블로그를 열었는데, 낯선 사람들이 남긴 댓글을 볼 때마다 사진이 나와 타인을 연결해 주는 도구가 되었다는 것을 실감한다.",
        questions: [
          { kr: "", question: "What started the writer's interest in photography?", options: ["being unhappy with travel photos and impulsively buying a camera", "receiving a camera as a gift", "studying photography in college", "a friend's recommendation"], answer: "being unhappy with travel photos and impulsively buying a camera" },
          { kr: "", question: "What changed after taking a photography class?", options: ["began paying attention to light and composition", "stopped taking photos of landscapes entirely", "switched to only black-and-white photos", "gave up photography as too difficult"], answer: "began paying attention to light and composition" },
          { kr: "", question: "What ordinary things now catch the writer's eye?", options: ["an alley on the way to work and an old subway staircase", "only famous tourist sites", "expensive restaurants", "sports events"], answer: "an alley on the way to work and an old subway staircase" },
          { kr: "", question: "What habit did photography create?", options: ["slowly observing daily life instead of rushing past it", "waking up earlier every day", "traveling more often", "avoiding crowded places"], answer: "slowly observing daily life instead of rushing past it" },
          { kr: "", question: "What did the writer recently do with the photos?", options: ["opened a small personal blog", "sold them to a magazine", "printed them into a book for sale", "deleted most of them"], answer: "opened a small personal blog" },
        ],
      },
      {
        passage:
          "고등학교 때 가장 친했던 친구와 대학 진학 이후 십 년 가까이 연락이 끊겼다. 각자 바쁘게 사느라 자연스럽게 멀어졌는데, 어느 날 우연히 SNS에서 그 친구의 소식을 보게 되었다. 망설이다가 용기를 내어 메시지를 보냈고, 다행히 친구도 반갑게 답장을 해 주었다. 오랜만에 만난 자리에서는 어색할까 봐 걱정했지만, 대화를 시작하자마자 마치 어제 만난 것처럼 편안했다. 그동안 서로 겪은 일들, 특히 힘들었던 시기에 대해 이야기하며 오히려 예전보다 더 깊은 대화를 나눌 수 있었다. 시간이 관계를 끊어 놓은 줄 알았지만, 사실은 다시 이어질 순간을 기다리고 있었을 뿐이라는 생각이 들었다.",
        questions: [
          { kr: "", question: "What happened between the writer and their closest high school friend?", options: ["lost contact for nearly ten years after starting college", "they had a serious falling out", "they moved in together after college", "they stayed in constant contact"], answer: "lost contact for nearly ten years after starting college" },
          { kr: "", question: "How did the writer reconnect with the friend?", options: ["saw the friend's news on social media and sent a message", "ran into the friend by chance on the street", "a mutual friend arranged a meeting", "received a letter in the mail"], answer: "saw the friend's news on social media and sent a message" },
          { kr: "", question: "How did the reunion feel?", options: ["comfortable, as if they had met just yesterday", "very awkward and tense", "disappointing overall", "brief and formal"], answer: "comfortable, as if they had met just yesterday" },
          { kr: "", question: "What did they talk about?", options: ["what each had gone through, including hard times", "only happy memories from high school", "future business plans", "mutual friends they had lost touch with"], answer: "what each had gone through, including hard times" },
          { kr: "", question: "What realization does the writer reach at the end?", options: ["time hadn't ended the friendship, it was just waiting to reconnect", "the friendship was truly over", "reconnecting was a mistake", "they should never have lost contact in the first place"], answer: "time hadn't ended the friendship, it was just waiting to reconnect" },
        ],
      },

      {
        passage:
          "대학교 때 가장 친했던 친구와 나는 졸업 후 각자 다른 도시로 떠나면서 자연스럽게 연락이 뜸해졌다. 처음에는 매주 전화하던 사이였지만, 몇 년이 지나자 명절에나 겨우 안부를 묻는 사이가 되었다. 얼마 전 우연히 그 친구가 이사한다는 소식을 듣고 도와주러 갔는데, 오랜만인데도 어색함 없이 예전처럼 편하게 이야기할 수 있어서 놀랐다. 자주 만나지 않아도 진짜 우정은 변하지 않는다는 것을 그날 깨달았다.",
        questions: [
          R("What happened to the friendship after graduation?", ["they naturally drifted apart and contacted each other less", "they had a big fight and stopped talking", "they moved to the same city", "they lost touch completely"], "they naturally drifted apart and contacted each other less"),
          R("Why did the writer visit the friend recently?", ["to help with the friend's move", "to attend a wedding", "to celebrate a birthday", "to return borrowed money"], "to help with the friend's move"),
          R("What surprised the writer during the visit?", ["there was no awkwardness even after a long time", "the friend had changed completely", "they argued again", "the friend didn't recognize them"], "there was no awkwardness even after a long time"),
          R("What did the writer realize that day?", ["true friendship doesn't change even without frequent contact", "old friends always grow apart", "moving houses ends friendships", "phone calls are more important than visits"], "true friendship doesn't change even without frequent contact"),
          R("The word '뜸해지다' is closest in meaning to…", ["to become infrequent", "to become close", "to become loud", "to become expensive"], "to become infrequent"),
        ],
      },
      {
        passage:
          "나는 이십 대 초반에는 월급을 받으면 다음 달까지 다 써 버리는 편이었다. 저축이라는 것에 별 관심이 없었고, 어차피 돈은 또 벌면 된다고 생각했다. 그러다 서른 살이 되던 해에 갑자기 큰 병원비가 필요해졌는데, 모아 둔 돈이 하나도 없어서 부모님께 빌려야 했다. 그 일을 계기로 매달 월급의 이십 퍼센트를 무조건 따로 떼어 저축하기 시작했다. 처음에는 답답하게 느껴졌지만, 이제는 통장에 돈이 쌓이는 걸 보는 게 오히려 즐겁다.",
        questions: [
          R("How did the writer handle money in their early twenties?", ["spent the whole salary every month", "saved most of the salary", "invested in stocks", "gave money to family"], "spent the whole salary every month"),
          R("What happened at age thirty?", ["they needed a large amount for hospital bills and had no savings", "they got a big raise", "they bought a house", "they lost their job"], "they needed a large amount for hospital bills and had no savings"),
          R("Who did the writer borrow money from?", ["their parents", "a bank", "a friend", "a coworker"], "their parents"),
          R("What new habit did the writer start?", ["setting aside 20% of salary every month", "spending less on food", "canceling all subscriptions", "working a second job"], "setting aside 20% of salary every month"),
          R("How does the writer feel about saving now?", ["they enjoy watching their savings grow", "they still find it stressful", "they regret starting", "they plan to stop soon"], "they enjoy watching their savings grow"),
        ],
      },
      {
        passage:
          "몇 달 전부터 나는 매일 아침 6시에 일어나 삼십 분씩 걷기 시작했다. 원래는 아침잠이 많아서 상상도 못 할 일이었지만, 건강 검진에서 혈압이 조금 높다는 말을 들은 뒤로 마음을 바꿨다. 처음 일주일은 몸이 적응하지 못해 힘들었지만, 한 달쯤 지나자 오히려 아침에 걷지 않으면 하루가 이상하게 느껴질 정도가 되었다. 최근 검진에서는 혈압도 정상으로 돌아왔고, 무엇보다 하루를 상쾌하게 시작할 수 있어서 만족스럽다.",
        questions: [
          R("What new routine did the writer start a few months ago?", ["walking for 30 minutes every morning at 6", "jogging every night", "going to the gym after work", "doing yoga before bed"], "walking for 30 minutes every morning at 6"),
          R("Why did the writer change their habit?", ["a health checkup showed slightly high blood pressure", "a doctor recommended weight loss", "they wanted to lose weight for an event", "a friend convinced them"], "a health checkup showed slightly high blood pressure"),
          R("What was hard about the first week?", ["the body wasn't used to the new routine", "the weather was too cold", "there was no time in the morning", "they kept getting injured"], "the body wasn't used to the new routine"),
          R("What changed after about a month?", ["the day felt strange without the morning walk", "they wanted to quit", "they started walking longer distances", "they switched to running"], "the day felt strange without the morning walk"),
          R("What was the result of the recent checkup?", ["blood pressure returned to normal", "blood pressure got worse", "no change was found", "a new health problem was discovered"], "blood pressure returned to normal"),
        ],
      },
      {
        passage:
          "나는 스마트폰 없이는 하루도 못 살 것 같다고 늘 농담처럼 말해 왔다. 그런데 얼마 전 여행지에서 휴대폰을 잃어버리는 바람에 이틀 동안 강제로 스마트폰 없이 지내야 했다. 처음에는 불안하고 답답했지만, 시간이 지날수록 오히려 눈앞의 풍경에 더 집중하게 되고 사람들과의 대화도 더 깊어졌다. 한국에 돌아온 뒤로 나는 저녁 아홉 시 이후에는 스마트폰을 다른 방에 두는 습관을 들이고 있다. 완전히 끊지는 못하지만, 예전보다 훨씬 자유로워진 느낌이다.",
        questions: [
          R("What used to be true for the writer?", ["they joked they couldn't live a day without their smartphone", "they never used a smartphone", "they worked in tech", "they hated social media"], "they joked they couldn't live a day without their smartphone"),
          R("What happened while traveling?", ["they lost their phone and went without it for two days", "their phone broke permanently", "they had no signal for a week", "they left their phone at home on purpose"], "they lost their phone and went without it for two days"),
          R("What changed as time passed without the phone?", ["they focused more on scenery and had deeper conversations", "they felt more anxious", "they wanted to buy a new phone immediately", "nothing changed at all"], "they focused more on scenery and had deeper conversations"),
          R("What new habit did the writer form after returning?", ["keeping the phone in another room after 9pm", "deleting all social media apps", "turning off the phone completely every night", "using the phone only on weekends"], "keeping the phone in another room after 9pm"),
          R("How does the writer feel now compared to before?", ["much freer than before", "more anxious than before", "exactly the same", "more dependent on the phone"], "much freer than before"),
        ],
      },
      {
        passage:
          "작년에 혼자 떠난 배낭여행은 처음에는 외로움과의 싸움이었다. 계획했던 일정이 틀어지고 숙소를 못 구해 헤맨 날도 있었다. 하지만 낯선 도시에서 우연히 만난 여행자들과 저녁을 함께 먹고, 길을 잃었을 때 친절하게 도와준 현지인 덕분에 무사히 여행을 마칠 수 있었다. 돌아온 뒤로 나는 예전보다 낯선 상황을 두려워하지 않게 되었고, 계획대로 되지 않아도 괜찮다는 여유를 갖게 되었다. 그 여행은 단순한 관광이 아니라 나 자신을 알아가는 시간이었다.",
        questions: [
          R("What was the writer's solo backpacking trip like at first?", ["a struggle with loneliness", "relaxing from the start", "planned perfectly", "a business trip"], "a struggle with loneliness"),
          R("What problem did the writer face during the trip?", ["the schedule fell apart and they couldn't find lodging", "they got sick", "they ran out of money", "their passport was stolen"], "the schedule fell apart and they couldn't find lodging"),
          R("How did the writer manage to finish the trip safely?", ["with help from fellow travelers and a kind local", "by calling their family for advice", "by joining a tour group", "by returning home early"], "with help from fellow travelers and a kind local"),
          R("What changed in the writer after returning?", ["they became less afraid of unfamiliar situations", "they decided never to travel alone again", "they became more anxious about planning", "they stopped enjoying travel"], "they became less afraid of unfamiliar situations"),
          R("How does the writer describe the trip in the end?", ["a time of getting to know themselves", "a waste of money", "just simple sightseeing", "a disappointing experience"], "a time of getting to know themselves"),
        ],
      },
      {
        passage:
          "우리 가족은 명절마다 모이지만, 사실 아버지와 나는 오랫동안 서로 대화가 별로 없었다. 아버지는 감정 표현이 서툰 분이었고, 나 역시 어릴 때부터 그런 아버지가 어려웠다. 그런데 지난달 아버지가 은퇴하신 후 함께 등산을 다니기 시작하면서 조금씩 상황이 달라졌다. 산길을 걸으며 나눈 사소한 대화들이 쌓이자, 어느새 아버지가 예전보다 편한 존재로 느껴지기 시작했다. 나이가 들어서야 아버지를 조금씩 이해하게 된 것 같다.",
        questions: [
          R("What was the relationship between the writer and their father like for a long time?", ["they didn't talk much with each other", "they argued constantly", "they lived far apart", "they were extremely close"], "they didn't talk much with each other"),
          R("Why was the father difficult for the writer growing up?", ["the father was bad at expressing emotions", "the father was often away for work", "the father was very strict about grades", "the father remarried"], "the father was bad at expressing emotions"),
          R("What started after the father retired?", ["they began hiking together", "they started living together", "they opened a business together", "they took a trip abroad"], "they began hiking together"),
          R("What changed through the hiking trips?", ["small conversations made the father feel more comfortable to the writer", "they stopped talking again", "the father became stricter", "the writer moved out"], "small conversations made the father feel more comfortable to the writer"),
          R("What does the writer feel now?", ["they are starting to understand their father", "they still feel distant from their father", "they regret starting to hike", "they wish they had more free time"], "they are starting to understand their father"),
        ],
      },
      {
        passage:
          "나는 친구가 많은 편은 아니지만, 몇 안 되는 친구들과는 깊은 관계를 유지하려고 노력한다. 예전에는 인맥이 넓을수록 좋다고 생각해서 여러 모임에 나가느라 바빴지만, 정작 힘든 일이 생겼을 때 진심으로 걱정해 주는 사람은 몇 명 되지 않는다는 걸 깨달았다. 그 후로는 얕은 관계를 늘리기보다 소수의 사람들과 시간을 깊이 나누는 쪽을 택했다. 친구의 숫자보다 관계의 질이 훨씬 중요하다는 것을 뒤늦게 배운 셈이다.",
        questions: [
          R("How does the writer describe their circle of friends?", ["not many friends, but deep relationships", "hundreds of casual acquaintances", "no close friends at all", "only online friends"], "not many friends, but deep relationships"),
          R("What did the writer used to believe?", ["that a wider network of connections was better", "that having no friends was best", "that only family relationships mattered", "that friendship should be avoided"], "that a wider network of connections was better"),
          R("What did the writer realize during a difficult time?", ["only a few people truly worried about them", "everyone they knew helped them", "no one cared about them at all", "money mattered more than friends"], "only a few people truly worried about them"),
          R("What choice did the writer make afterward?", ["spending deep time with a small number of people", "cutting off all social contact", "joining even more groups", "moving to a new city"], "spending deep time with a small number of people"),
          R("What lesson did the writer learn?", ["quality of relationships matters more than quantity", "more friends always means more happiness", "friendship isn't important in adult life", "old friends are better than new ones"], "quality of relationships matters more than quantity"),
        ],
      },
      {
        passage:
          "나는 몇 년 전부터 매달 정해진 금액을 적금에 넣기 시작했다. 처음에는 목표도 없이 그냥 습관처럼 저축했는데, 어느 날 통장을 보다가 문득 이 돈으로 무엇을 하고 싶은지 스스로에게 물어보게 되었다. 고민 끝에 오 년 안에 작은 가게를 여는 것을 목표로 삼았다. 목표가 생기자 저축이 예전처럼 지루하게 느껴지지 않았고, 오히려 불필요한 소비를 줄이는 것도 자연스럽게 되었다. 돈을 모으는 이유가 분명해지자 삶의 방향도 함께 뚜렷해진 느낌이다.",
        questions: [
          R("What did the writer start doing a few years ago?", ["putting a fixed amount into savings every month", "investing in the stock market", "borrowing money from a bank", "spending freely without a plan"], "putting a fixed amount into savings every month"),
          R("What question did the writer ask themselves one day?", ["what they wanted to do with the money", "how to earn more money", "whether to quit their job", "when to retire"], "what they wanted to do with the money"),
          R("What goal did the writer set?", ["opening a small shop within five years", "buying a car within a year", "traveling around the world", "paying off a loan early"], "opening a small shop within five years"),
          R("How did having a goal change saving for the writer?", ["it no longer felt boring", "it became more stressful", "they stopped saving altogether", "they needed a second job"], "it no longer felt boring"),
          R("What else happened naturally after setting the goal?", ["unnecessary spending decreased", "spending increased", "they borrowed more money", "they changed banks"], "unnecessary spending decreased"),
        ],
      },
      {
        passage:
          "나는 원래 아침을 거의 먹지 않는 사람이었다. 시간도 없었고 배도 고프지 않아서 커피 한 잔으로 하루를 시작하곤 했다. 그런데 작년에 위염 진단을 받은 후 의사의 권유로 간단하게라도 아침을 챙겨 먹기 시작했다. 처음에는 십 분이라도 일찍 일어나는 게 귀찮았지만, 몇 주가 지나자 오전에 훨씬 덜 피곤하고 집중력도 좋아진다는 것을 느꼈다. 지금은 바쁜 날에도 최소한 과일이나 요거트라도 챙겨 먹으려고 노력한다.",
        questions: [
          R("What was the writer's old habit regarding breakfast?", ["skipping it and only drinking coffee", "eating a large breakfast every day", "eating breakfast at work", "eating breakfast only on weekends"], "skipping it and only drinking coffee"),
          R("Why did the writer start eating breakfast?", ["a doctor recommended it after a stomach diagnosis", "a friend suggested it", "they wanted to lose weight", "they read an article online"], "a doctor recommended it after a stomach diagnosis"),
          R("What was hard about the change at first?", ["waking up ten minutes earlier felt bothersome", "finding time to cook", "the cost of groceries", "eating alone"], "waking up ten minutes earlier felt bothersome"),
          R("What did the writer notice after a few weeks?", ["less fatigue and better concentration in the morning", "more fatigue than before", "weight loss", "trouble sleeping at night"], "less fatigue and better concentration in the morning"),
          R("What does the writer do now on busy days?", ["still tries to eat at least fruit or yogurt", "skips breakfast as before", "eats only coffee and bread", "eats a large meal instead"], "still tries to eat at least fruit or yogurt"),
        ],
      },
      {
        passage:
          "나는 새로운 기기가 나올 때마다 꼭 사야 직성이 풀리는 사람이었다. 최신 스마트폰이 나오면 줄을 서서라도 구입했고, 서랍에는 몇 번 쓰지 않은 전자제품이 쌓여 갔다. 그러다 작년에 예산을 정리하면서 지난 오 년간 전자제품에 쓴 돈을 계산해 보고 깜짝 놀랐다. 그 후로는 새 기기가 정말 필요한지 최소 한 달은 고민하는 습관을 들였다. 지금 쓰는 스마트폰은 벌써 삼 년째인데, 예전보다 물건에 덜 집착하게 된 나 자신이 마음에 든다.",
        questions: [
          R("What kind of person was the writer regarding gadgets?", ["someone who had to buy every new device", "someone who avoided technology", "someone who fixed old devices instead of buying new ones", "someone who sold used electronics"], "someone who had to buy every new device"),
          R("What was accumulating in the writer's drawer?", ["barely used electronics", "old clothes", "unpaid bills", "books"], "barely used electronics"),
          R("What surprised the writer while organizing their budget?", ["how much money had been spent on electronics over five years", "how little they had saved", "how much debt they had", "how cheap electronics had become"], "how much money had been spent on electronics over five years"),
          R("What new habit did the writer form?", ["waiting at least a month before buying a new device", "buying only refurbished electronics", "asking friends for advice before buying", "avoiding stores completely"], "waiting at least a month before buying a new device"),
          R("How does the writer feel about themselves now?", ["pleased to be less attached to things", "still tempted to overspend", "regretful about past purchases", "unsure about the new habit"], "pleased to be less attached to things"),
        ],
      },
      {
        passage:
          "작년 여름 나는 계획 없이 떠난 국내 여행에서 예상치 못한 곳에 매력을 느꼈다. 원래는 유명한 관광지 몇 곳만 둘러보고 돌아올 생각이었는데, 차가 고장 나는 바람에 작은 시골 마을에서 하루를 더 머물게 되었다. 그 마을에서 만난 주민들은 낯선 여행자에게도 스스럼없이 저녁을 대접해 주었고, 나는 그날 밤 별이 가득한 하늘 아래에서 오랜만에 진짜 휴식을 느꼈다. 유명한 곳이 아니어도 여행의 의미는 얼마든지 찾을 수 있다는 것을 그때 배웠다.",
        questions: [
          R("What kind of trip did the writer take last summer?", ["an unplanned domestic trip", "a carefully planned trip abroad", "a business trip", "a school trip"], "an unplanned domestic trip"),
          R("Why did the writer stay an extra day in a small village?", ["their car broke down", "they missed the bus", "the weather was bad", "they wanted to save money"], "their car broke down"),
          R("How did the villagers treat the writer?", ["they welcomed them and offered dinner without hesitation", "they were suspicious of the stranger", "they ignored the writer", "they charged high prices for help"], "they welcomed them and offered dinner without hesitation"),
          R("What did the writer feel that night?", ["real rest under a sky full of stars", "boredom in a quiet village", "fear of being in an unfamiliar place", "disappointment about the trip"], "real rest under a sky full of stars"),
          R("What lesson did the writer learn from this experience?", ["meaning in travel can be found even in unfamous places", "famous tourist spots are always disappointing", "traveling alone is dangerous", "planning is always necessary"], "meaning in travel can be found even in unfamous places"),
        ],
      },
      {
        passage:
          "나는 형제가 셋인데, 그중에서도 막내인 나는 늘 부모님의 관심을 형과 누나에게 빼앗긴다고 느끼며 자랐다. 그래서인지 성인이 된 후에도 가족 모임에서 은근히 소외감을 느낄 때가 많았다. 그런데 최근 아버지 생신을 준비하면서 처음으로 형제들과 함께 요리부터 상 차리는 일까지 도맡아 진행했다. 서로 부족한 부분을 채워 가며 준비하는 과정에서, 나는 우리가 생각보다 서로를 잘 이해하고 있다는 것을 느꼈다. 그날 이후로 가족 모임이 예전만큼 부담스럽지 않다.",
        questions: [
          R("How did the writer feel growing up as the youngest of three siblings?", ["that attention went mostly to the older siblings", "that they were the favorite child", "that they had no siblings to rely on", "that they were treated equally"], "that attention went mostly to the older siblings"),
          R("What did the writer feel at family gatherings as an adult?", ["a quiet sense of being left out", "constant excitement", "complete indifference", "jealousy toward their parents"], "a quiet sense of being left out"),
          R("What did the siblings do together recently?", ["prepared their father's birthday, from cooking to setting the table", "planned a family vacation", "moved their parents to a new house", "opened a joint bank account"], "prepared their father's birthday, from cooking to setting the table"),
          R("What did the writer realize during the preparation?", ["they understood each other better than expected", "they still didn't get along", "cooking together was too stressful", "their parents were unhappy with the plan"], "they understood each other better than expected"),
          R("How do family gatherings feel to the writer now?", ["less burdensome than before", "still very stressful", "unnecessary", "exactly the same as before"], "less burdensome than before"),
        ],
      },
      {
        passage:
          "나는 회사 동료 중 유일하게 마음을 터놓을 수 있는 친구가 한 명 있다. 처음에는 그저 업무적으로만 편한 사이였지만, 야근을 함께하며 힘든 시기를 겪다 보니 어느새 진짜 친구가 되어 있었다. 얼마 전 그 친구가 다른 회사로 이직을 결심했을 때, 나는 축하하는 마음과 동시에 서운함을 감출 수 없었다. 매일 얼굴을 보던 사이가 앞으로는 가끔씩 연락하는 사이가 될 것이기 때문이다. 그래도 진짜 친구라면 어디에 있든 관계가 이어질 것이라고 믿는다.",
        questions: [
          R("How did the writer's relationship with the coworker start?", ["just comfortable for work purposes", "as childhood friends", "through a mutual hobby", "as neighbors"], "just comfortable for work purposes"),
          R("How did the two become real friends?", ["by going through hard times together while working late", "by traveling abroad together", "by living in the same building", "by studying together in school"], "by going through hard times together while working late"),
          R("What did the friend recently decide to do?", ["change to another company", "move to another country", "start their own business", "retire early"], "change to another company"),
          R("How did the writer feel about this news?", ["happy for the friend but also a bit sad", "purely happy with no other feelings", "angry and betrayed", "indifferent"], "happy for the friend but also a bit sad"),
          R("What does the writer believe about real friendship?", ["it continues no matter where each person is", "it always fades with distance", "it depends on seeing each other daily", "it requires working at the same company"], "it continues no matter where each person is"),
        ],
      },
      {
        passage:
          "몇 년 전까지만 해도 나는 밤늦게까지 SNS를 확인하느라 잠을 설치는 날이 많았다. 다른 사람들의 일상을 보다 보면 시간이 순식간에 지나갔고, 다음 날 피곤함에 시달렸다. 어느 날 눈이 너무 아파서 병원에 갔더니 의사가 화면을 너무 오래 본다고 지적했다. 그 후로 잠들기 한 시간 전에는 휴대폰을 아예 꺼 두는 규칙을 만들었다. 처음에는 심심하고 손이 허전했지만, 이제는 그 시간에 책을 읽거나 일기를 쓰며 하루를 정리한다.",
        questions: [
          R("What was the writer's habit until a few years ago?", ["checking social media late at night and losing sleep", "waking up very early every day", "avoiding all screens completely", "writing a diary every night"], "checking social media late at night and losing sleep"),
          R("What effect did this habit have?", ["feeling exhausted the next day", "improved focus at work", "better sleep quality", "no noticeable effect"], "feeling exhausted the next day"),
          R("Why did the writer go to the hospital?", ["their eyes hurt too much", "they had a headache", "they couldn't sleep at all", "they had a stomachache"], "their eyes hurt too much"),
          R("What rule did the writer make afterward?", ["turning off the phone one hour before sleeping", "deleting all social media accounts", "using the phone only in the morning", "buying a new phone"], "turning off the phone one hour before sleeping"),
          R("What does the writer do now instead?", ["reads books or writes a diary", "watches TV instead", "calls friends every night", "goes for a walk outside"], "reads books or writes a diary"),
        ],
      },
      {
        passage:
          "나는 어릴 때부터 몸이 약해서 운동과는 거리가 먼 사람이었다. 하지만 서른 살이 되던 해, 계단 몇 층만 올라가도 숨이 차는 나 자신을 보고 충격을 받아 동네 수영장에 등록했다. 처음 한 달은 물에 뜨는 것조차 힘들었지만, 강사의 도움으로 조금씩 나아졌다. 지금은 일주일에 세 번씩 수영을 하는데, 체력이 좋아진 것은 물론이고 스트레스를 푸는 나만의 방법도 생겼다. 늦게라도 시작하길 잘했다는 생각이 든다.",
        questions: [
          R("What was the writer like growing up?", ["physically weak and far from exercise", "an athlete since childhood", "someone who loved swimming", "someone who avoided doctors"], "physically weak and far from exercise"),
          R("What shocked the writer at age thirty?", ["getting out of breath from climbing a few flights of stairs", "gaining a lot of weight", "a serious illness diagnosis", "failing a fitness test"], "getting out of breath from climbing a few flights of stairs"),
          R("What did the writer sign up for?", ["a neighborhood swimming pool", "a gym membership", "a yoga class", "a running club"], "a neighborhood swimming pool"),
          R("What was difficult in the first month?", ["even floating in the water was hard", "finding time to attend classes", "affording the membership fee", "getting along with the instructor"], "even floating in the water was hard"),
          R("How does the writer feel about starting late?", ["glad they started, even though it was late", "regretful about not starting earlier", "unsure if it was worth it", "indifferent about the decision"], "glad they started, even though it was late"),
        ],
      },
      {
        passage:
          "재택근무가 시작된 후로 나는 하루 종일 노트북 앞에 앉아 있는 시간이 늘었다. 처음에는 출퇴근 시간이 줄어서 좋았지만, 몇 달이 지나자 화면을 보는 시간이 너무 길어서 목과 어깨가 늘 뻐근했다. 결국 회사 업무와 개인적인 화면 사용 시간을 구분하기로 결심했다. 저녁에는 텔레비전 대신 산책을 하거나 종이책을 읽는 시간을 늘렸다. 화면에서 조금 멀어지자 오히려 하루가 더 길게 느껴지고 여유도 생겼다.",
        questions: [
          R("What changed after remote work began for the writer?", ["more time was spent sitting in front of a laptop", "the writer moved to a new city", "the writer changed careers", "the writer stopped working entirely"], "more time was spent sitting in front of a laptop"),
          R("What problem appeared after a few months?", ["neck and shoulder stiffness from too much screen time", "trouble finding motivation to work", "conflicts with coworkers", "financial difficulties"], "neck and shoulder stiffness from too much screen time"),
          R("What decision did the writer make?", ["to separate work screen time from personal screen time", "to quit the remote job", "to buy a bigger monitor", "to work only part-time"], "to separate work screen time from personal screen time"),
          R("What did the writer do in the evenings instead?", ["went for walks or read paper books", "watched more television", "worked overtime", "played video games"], "went for walks or read paper books"),
          R("How did the writer feel after reducing screen time?", ["the day felt longer and more relaxed", "the day felt shorter and busier", "nothing really changed", "they missed the screen time"], "the day felt longer and more relaxed"),
        ],
      },
      {
        passage:
          "결혼한 지 오 년이 넘었지만, 나와 남편은 돈 관리 방식이 완전히 달라서 자주 부딪혔다. 나는 매달 예산을 세우고 지출을 기록하는 편인 반면, 남편은 계획 없이 필요할 때마다 쓰는 편이었다. 몇 번의 다툼 끝에 우리는 공동 통장과 각자의 자유 통장을 나누어 쓰기로 합의했다. 생활비와 저축은 공동 통장에서, 개인적인 지출은 각자의 통장에서 해결하니 다툼이 눈에 띄게 줄었다. 방식이 다르다고 틀린 것은 아니라는 걸 이제야 이해하게 됐다.",
        questions: [
          R("What has caused frequent conflict in the writer's marriage?", ["different ways of managing money", "disagreements about raising children", "different work schedules", "disagreements about where to live"], "different ways of managing money"),
          R("How does the writer usually manage money?", ["setting a monthly budget and recording expenses", "spending freely without tracking", "avoiding money matters entirely", "letting the husband handle everything"], "setting a monthly budget and recording expenses"),
          R("How does the husband handle money?", ["spending as needed without a plan", "saving every extra cent", "tracking every purchase carefully", "refusing to spend on anything"], "spending as needed without a plan"),
          R("What did the couple agree to do?", ["use a joint account and separate personal accounts", "give all money to one person", "stop discussing money altogether", "hire a financial advisor"], "use a joint account and separate personal accounts"),
          R("What did the writer come to understand?", ["being different isn't the same as being wrong", "their way was the only correct way", "money problems can't be solved", "marriage always involves financial conflict"], "being different isn't the same as being wrong"),
        ],
      },
      {
        passage:
          "나는 새로운 도시로 이사 온 후 한동안 아는 사람이 하나도 없어서 외로웠다. 그러다 우연히 동네 독서 모임에 참여하게 되었는데, 처음에는 낯선 사람들과 이야기하는 것이 어색해서 몇 마디만 하고 조용히 앉아 있곤 했다. 하지만 매주 같은 책을 읽고 생각을 나누다 보니 어느새 편하게 농담을 주고받는 사이가 되었다. 지금은 그 모임 사람들과 책 이야기뿐 아니라 일상의 고민까지 나누는 친구가 되었다. 낯선 도시에서 얻은 뜻밖의 선물이라고 생각한다.",
        questions: [
          R("How did the writer feel after moving to a new city?", ["lonely, with no acquaintances", "excited to meet new people right away", "eager to move again soon", "relieved to be alone"], "lonely, with no acquaintances"),
          R("What did the writer join by chance?", ["a neighborhood book club", "a cooking class", "a sports team", "a language exchange group"], "a neighborhood book club"),
          R("What was difficult at first?", ["talking to unfamiliar people felt awkward", "finding the meeting location", "understanding the books discussed", "paying the membership fee"], "talking to unfamiliar people felt awkward"),
          R("What happened after meeting weekly?", ["they became comfortable joking with each other", "the group became too large", "the writer stopped attending", "conflicts arose within the group"], "they became comfortable joking with each other"),
          R("How does the writer describe the group now?", ["friends who share both book talk and daily worries", "just people to discuss books with", "acquaintances the writer barely knows", "a group the writer wants to leave"], "friends who share both book talk and daily worries"),
        ],
      },
      {
        passage:
          "나는 여행을 갈 때마다 계획을 빈틈없이 세우는 편이었다. 시간대별로 일정을 짜고 예약도 미리 다 해 두어야 마음이 놓였다. 그런데 지난달 처음으로 아무 계획 없이 즉흥적으로 여행을 떠나 보았다. 도착한 도시에서 그날그날 마음이 끌리는 대로 다녔는데, 예상보다 훨씬 즐거웠고 우연히 발견한 작은 식당에서 최고의 식사를 하기도 했다. 계획대로 되지 않아도 괜찮다는 걸 배운 여행이었고, 앞으로는 일정에 여유를 좀 더 남겨 두려고 한다.",
        questions: [
          R("What kind of traveler was the writer usually?", ["someone who planned every detail in advance", "someone who never planned anything", "someone who traveled only with tour groups", "someone who avoided travel"], "someone who planned every detail in advance"),
          R("What did the writer try for the first time last month?", ["traveling with no plan at all", "traveling to a new country", "traveling with a large group", "traveling by train instead of plane"], "traveling with no plan at all"),
          R("What happened during the spontaneous trip?", ["they found a great meal at a small restaurant by chance", "they got lost and missed meals", "they had to return home early", "nothing interesting happened"], "they found a great meal at a small restaurant by chance"),
          R("What did the writer learn from this trip?", ["it's okay when things don't go as planned", "planning is always necessary", "spontaneous trips are too risky", "traveling alone is better"], "it's okay when things don't go as planned"),
          R("What does the writer plan to do in future trips?", ["leave more room in the schedule", "plan even more strictly than before", "stop traveling for a while", "always travel alone"], "leave more room in the schedule"),
        ],
      },
      {
        passage:
          "우리 가족은 매년 명절마다 큰집에 모여 차례를 지냈는데, 몇 년 전부터 형제들 사이에 의견 차이가 생기기 시작했다. 일부는 전통을 지켜야 한다고 했고, 일부는 시대에 맞게 간소화하자고 주장했다. 갈등이 깊어질 뻔했지만, 결국 우리는 격식은 줄이되 가족이 모이는 시간 자체는 유지하기로 합의했다. 상을 간단히 차리고 대신 다 같이 이야기 나누는 시간을 늘렸더니, 오히려 예전보다 명절이 편안하고 즐거운 시간이 되었다.",
        questions: [
          R("What tradition did the writer's family follow every holiday?", ["gathering at the eldest sibling's house for ancestral rites", "traveling abroad together", "hosting a large outdoor party", "exchanging expensive gifts"], "gathering at the eldest sibling's house for ancestral rites"),
          R("What disagreement arose among the siblings?", ["whether to keep tradition or simplify it", "where to hold the gathering", "who should pay for the food", "how long the holiday should last"], "whether to keep tradition or simplify it"),
          R("What did the family finally agree to do?", ["reduce formality but keep the gathering itself", "cancel the gathering entirely", "hold separate gatherings each year", "let each family choose independently"], "reduce formality but keep the gathering itself"),
          R("What did they do instead of a big formal meal?", ["kept the meal simple and talked more together", "ordered food from a restaurant", "skipped the meal completely", "had each family cook separately"], "kept the meal simple and talked more together"),
          R("How do the holidays feel now compared to before?", ["more comfortable and enjoyable", "more stressful than before", "exactly the same", "less meaningful than before"], "more comfortable and enjoyable"),
        ],
      },
      {
        passage:
          "나는 몇 년째 매달 일정 금액을 기부하고 있다. 처음에는 큰 부담 없이 시작한 작은 기부였지만, 시간이 지나면서 그 단체가 어떤 활동을 하는지 궁금해져서 소식지를 꼼꼼히 읽기 시작했다. 내가 낸 돈이 실제로 어떤 아이들에게 도움이 되었는지 구체적인 사례를 읽을 때마다 뿌듯함을 느낀다. 월급이 많지 않아 큰돈을 기부하지는 못하지만, 적은 금액이라도 꾸준히 하는 것이 중요하다고 생각하게 되었다. 돈을 모으는 것만큼이나 나누는 습관도 소중하다는 걸 배우고 있다.",
        questions: [
          R("What has the writer been doing for a few years?", ["donating a set amount monthly", "volunteering at a shelter every weekend", "saving for a house", "sponsoring a scholarship"], "donating a set amount monthly"),
          R("What did the writer start doing over time?", ["reading the organization's newsletter carefully", "increasing the donation amount every year", "visiting the organization in person", "stopping the donations"], "reading the organization's newsletter carefully"),
          R("When does the writer feel proud?", ["when reading specific cases of children helped by the donation", "when receiving a thank-you gift", "when their salary increases", "when friends praise them"], "when reading specific cases of children helped by the donation"),
          R("Why can't the writer donate a large amount?", ["their salary isn't very high", "they don't trust the organization", "they prefer to save instead", "they already spend a lot on other charities"], "their salary isn't very high"),
          R("What has the writer come to believe?", ["the habit of sharing is as valuable as saving money", "only large donations matter", "donating regularly is a waste of money", "saving is more important than giving"], "the habit of sharing is as valuable as saving money"),
        ],
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
      L("도심 아파트 가격이 최근 몇 달 사이 급격히 상승했습니다.", "What happened to apartment prices?", ["they rose sharply in recent months", "they fell sharply in recent months", "they stayed the same", "they will rise next year"], "they rose sharply in recent months"),
      L("성인을 대상으로 한 온라인 강의 수강자가 빠르게 늘고 있습니다.", "What is increasing rapidly?", ["the number of adults taking online lectures", "the number of adults attending university", "the cost of online lectures", "the number of teachers"], "the number of adults taking online lectures"),
      L("그 회사는 포장재를 재활용 소재로 바꾸겠다고 발표했습니다.", "What did the company announce?", ["it will switch its packaging to recycled materials", "it will stop using packaging entirely", "it will raise product prices", "it will close a factory"], "it will switch its packaging to recycled materials"),
      L("고령화가 빠르게 진행되면서 연금 제도에 대한 우려가 커지고 있습니다.", "What is causing growing concern?", ["rapid aging is straining the pension system", "the pension system was just abolished", "young people refuse to pay taxes", "the retirement age was lowered"], "rapid aging is straining the pension system"),
      L("한 스타트업이 새로운 앱으로 대규모 투자를 유치했습니다.", "What happened to the startup?", ["it attracted large investment with a new app", "it went bankrupt", "it merged with a bigger company", "it launched without any funding"], "it attracted large investment with a new app"),
      L("정부는 전기차 구매 보조금을 확대하기로 했습니다.", "What did the government decide?", ["to expand subsidies for buying electric cars", "to ban electric cars in cities", "to raise taxes on electric cars", "to end all car subsidies"], "to expand subsidies for buying electric cars"),
      L("국제 유가 상승으로 운송비 부담이 커지고 있습니다.", "What is causing higher transport costs?", ["rising international oil prices", "a shortage of drivers", "new road construction", "stricter emissions rules"], "rising international oil prices"),
      L("안전 문제로 인해 지역 축제가 취소되었습니다.", "Why was the local festival canceled?", ["safety concerns", "lack of funding", "bad weather forecasts", "low ticket sales"], "safety concerns"),
      L("원격 의료 서비스가 농어촌 지역까지 확대되고 있습니다.", "What is expanding to rural and fishing areas?", ["telemedicine services", "high-speed internet only", "new hospitals only", "private health insurance"], "telemedicine services"),
      L("출산율 감소로 일부 학교의 신입생 수가 급감했습니다.", "What caused some schools' new student numbers to plunge?", ["the declining birth rate", "a rise in school fees", "a new school district law", "a teacher shortage"], "the declining birth rate"),
      L("그 항공사는 마일리지 유효 기간을 단축하기로 했습니다.", "What did the airline decide?", ["to shorten how long mileage points remain valid", "to extend mileage validity indefinitely", "to remove mileage programs entirely", "to double mileage earned per flight"], "to shorten how long mileage points remain valid"),
      L("공사로 인해 그 작가의 전시회가 다음 달로 연기되었습니다.", "Why was the exhibition postponed?", ["construction work", "the artist's illness", "a lack of visitors", "missing artwork"], "construction work"),
      L("정부는 이번 달 물가 상승률이 예상보다 낮았다고 발표했습니다.", "What did the government announce?", ["this month's inflation rate was lower than expected", "this month's inflation rate was higher than expected", "prices will be frozen next month", "inflation data will not be released"], "this month's inflation rate was lower than expected"),
      L("은행 측은 최근 보이스피싱 피해가 급증했다고 경고했습니다.", "What did the bank warn about?", ["a sharp rise in phishing scam damage", "a new banking fee", "a system outage", "a rise in interest rates"], "a sharp rise in phishing scam damage"),
      L("연봉 협상에서 회사 측은 기본급 대신 성과급 비중을 늘리자고 제안했습니다.", "What did the company propose during salary negotiations?", ["increasing the share of performance-based pay instead of base salary", "cutting all bonuses", "raising the base salary only", "freezing salaries for a year"], "increasing the share of performance-based pay instead of base salary"),
      L("민준 씨는 이직 제안을 받았지만 현재 회사의 복지 혜택이 더 나아서 고민 중입니다.", "Why is Minjun hesitant about the job offer?", ["his current company's benefits are better", "the new company pays less", "he dislikes his current coworkers", "the new job requires relocation"], "his current company's benefits are better"),
      L("구청 직원은 전화로 건축 허가 서류가 미비하다고 안내했습니다.", "What did the district office employee explain over the phone?", ["the building permit documents were incomplete", "the permit had been approved", "the fee had not been paid", "the building was illegal"], "the building permit documents were incomplete"),
      L("세무서에서는 종합소득세 신고 기한이 다음 달 말까지 연장되었다고 밝혔습니다.", "What did the tax office announce?", ["the income tax filing deadline was extended to the end of next month", "the tax rate was lowered", "tax filing is now optional", "a new tax was introduced"], "the income tax filing deadline was extended to the end of next month"),
      L("서연 씨는 최근 건강 검진에서 콜레스테롤 수치가 높게 나와 식단 조절을 권유받았습니다.", "What did Seoyeon's health checkup reveal?", ["high cholesterol, so she was advised to adjust her diet", "diabetes requiring insulin", "a broken bone needing surgery", "perfect health with no concerns"], "high cholesterol, so she was advised to adjust her diet"),
      L("의사는 검사 결과가 나올 때까지 무리한 운동을 자제하라고 당부했습니다.", "What did the doctor advise?", ["avoid strenuous exercise until the test results come back", "start exercising immediately", "stop taking all medication", "schedule surgery right away"], "avoid strenuous exercise until the test results come back"),
      L("은행 상담원은 대출 한도가 소득 증빙 서류에 따라 달라질 수 있다고 설명했습니다.", "What did the bank counselor explain?", ["the loan limit may vary depending on income documents", "the loan is automatically approved", "no documents are needed", "interest rates are fixed for everyone"], "the loan limit may vary depending on income documents"),
      L("지호 씨는 주식 투자로 손실을 본 뒤 적금으로 전환하기로 했습니다.", "What did Jiho decide after losing money on stocks?", ["to switch to a savings account", "to invest even more in stocks", "to borrow money to recover losses", "to quit his job"], "to switch to a savings account"),
      L("부동산 중개인은 전세 매물이 부족해서 가격이 오르고 있다고 말했습니다.", "What did the real estate agent say?", ["prices are rising due to a shortage of jeonse listings", "prices are falling sharply", "there are too many empty apartments", "rent control was just introduced"], "prices are rising due to a shortage of jeonse listings"),
      L("하늘 씨는 이사할 집을 계약하기 전에 등기부 등본을 꼭 확인하라는 조언을 들었습니다.", "What advice did Haneul receive?", ["to check the property registry before signing a lease", "to skip the contract review", "to pay the full deposit in cash immediately", "to avoid using a real estate agent"], "to check the property registry before signing a lease"),
      L("아파트 관리사무소는 다음 주부터 엘리베이터 점검으로 운행이 일시 중단된다고 공지했습니다.", "What did the apartment management office announce?", ["the elevator will be temporarily out of service for inspection", "the elevator will be permanently removed", "a new elevator will be installed for free", "the building will be closed for a week"], "the elevator will be temporarily out of service for inspection"),
      L("고객센터 직원은 인터넷 요금제 변경이 다음 청구서부터 반영된다고 안내했습니다.", "What did the customer service representative explain?", ["the internet plan change will take effect from the next bill", "the plan cannot be changed", "the customer must visit in person", "the service will be disconnected"], "the internet plan change will take effect from the next bill"),
      L("도윤 씨는 새로 나온 인공지능 비서 앱이 일정 관리에 유용하다고 추천했습니다.", "What did Doyun recommend?", ["a new AI assistant app for schedule management", "a fitness tracking app", "a language learning app", "a photo editing app"], "a new AI assistant app for schedule management"),
      L("회사는 보안 문제로 전 직원에게 비밀번호를 즉시 변경하라고 지시했습니다.", "What did the company instruct employees to do?", ["change their passwords immediately due to a security issue", "stop using company email", "install new hardware", "work from home permanently"], "change their passwords immediately due to a security issue"),
      L("예린 씨는 팀장과의 면담에서 재택근무 일수를 늘려달라고 요청했습니다.", "What did Yerin request in her meeting with the team leader?", ["more remote work days", "a higher salary", "a transfer to another team", "a shorter lunch break"], "more remote work days"),
      L("인사팀은 이번 승진 심사 결과가 다음 주 금요일에 발표될 예정이라고 밝혔습니다.", "What did the HR team announce?", ["promotion results will be announced next Friday", "promotions have been canceled this year", "the deadline for applications was extended", "salaries will be cut"], "promotion results will be announced next Friday"),
      L("민원실 직원은 여권 재발급에 최소 일주일이 걸린다고 안내했습니다.", "What did the civil affairs office employee explain?", ["passport reissuance takes at least a week", "passports are issued the same day", "the passport office is closed indefinitely", "reissuance requires a court order"], "passport reissuance takes at least a week"),
      L("보험 회사 상담원은 사고 접수 후 서류 제출까지 사흘의 여유가 있다고 말했습니다.", "What did the insurance representative say?", ["there are three days to submit documents after reporting an accident", "documents must be submitted immediately", "no documents are required", "the claim was automatically rejected"], "there are three days to submit documents after reporting an accident"),
      L("태오 씨는 정기 건강 검진에서 혈압이 높다는 진단을 받고 약을 처방받았습니다.", "What happened to Taeo at his regular checkup?", ["he was diagnosed with high blood pressure and prescribed medication", "he was told he was perfectly healthy", "he was referred for immediate surgery", "he was advised to stop taking all medication"], "he was diagnosed with high blood pressure and prescribed medication"),
      L("지은 씨는 새 아파트 대출 심사에서 신용 점수가 부족하다는 통보를 받았습니다.", "What notice did Jieun receive regarding her apartment loan?", ["her credit score was insufficient", "her loan was fully approved", "she needs no credit check", "the interest rate was lowered"], "her credit score was insufficient"),
      L("현우 씨는 협상 중에 계약 조건을 문서로 남겨 달라고 요청했습니다.", "What did Hyunwoo request during the negotiation?", ["that the contract terms be put in writing", "that the negotiation be canceled", "a verbal agreement only", "a longer deadline for the deal"], "that the contract terms be put in writing"),
      L("마크 씨는 은행 앱의 신규 보안 인증 절차가 번거롭다고 불평했습니다.", "What did Mark complain about?", ["the bank app's new security verification process is inconvenient", "the bank app was deleted", "his account was hacked", "the bank raised its fees"], "the bank app's new security verification process is inconvenient"),
      L("지수 씨는 재건축 조합 회의에서 공사 일정이 또 미뤄졌다는 소식을 들었습니다.", "What did Jisu learn at the redevelopment association meeting?", ["the construction schedule was delayed again", "construction has finally begun", "the project was canceled entirely", "the budget was doubled"], "the construction schedule was delayed again"),
      L("민호 씨는 새 직장에서 계약서에 경업 금지 조항이 있다는 것을 뒤늦게 알았습니다.", "What did Minho discover about his new contract?", ["it includes a non-compete clause", "it has no probation period", "it guarantees a yearly bonus", "it allows unlimited vacation"], "it includes a non-compete clause"),
      L("고객센터는 시스템 점검으로 인해 오늘 밤 자정부터 두 시간 동안 서비스가 중단된다고 공지했습니다.", "What did customer service announce?", ["service will be down for two hours starting midnight for system maintenance", "the service is permanently closed", "a new feature launches at midnight", "customer service hours were extended"], "service will be down for two hours starting midnight for system maintenance"),
      L("유나 씨는 병원에서 재검사 결과 특별한 이상이 없다는 말을 듣고 안도했습니다.", "Why was Yuna relieved?", ["the follow-up test showed no abnormalities", "she was told to have surgery", "her insurance covered nothing", "the doctor recommended a longer stay"], "the follow-up test showed no abnormalities"),
      L("공무원은 민원인에게 온라인으로도 서류를 제출할 수 있다고 안내했습니다.", "What did the government official tell the visitor?", ["documents can also be submitted online", "documents must be mailed only", "no documents are needed at all", "the office no longer accepts submissions"], "documents can also be submitted online"),
      L("회사 협상팀은 노조 측 요구를 일부 수용하되 시행 시기를 늦추자고 제안했습니다.", "What did the company's negotiation team propose?", ["accepting some union demands but delaying implementation", "rejecting all union demands", "immediately accepting every demand", "ending negotiations without agreement"], "accepting some union demands but delaying implementation"),
      L("증권사 직원은 시장 변동성이 커서 당분간 투자에 신중해야 한다고 조언했습니다.", "What did the brokerage employee advise?", ["to be cautious with investments due to high market volatility", "to invest all savings immediately", "to withdraw all funds from the market", "that the market has stabilized completely"], "to be cautious with investments due to high market volatility"),
      L("도윤 씨는 신용카드 회사로부터 이상 거래가 감지되어 카드가 일시 정지되었다는 연락을 받았습니다.", "What did the credit card company tell Doyun?", ["his card was temporarily suspended due to suspicious activity", "his card limit was increased", "his account was closed permanently", "no issues were found"], "his card was temporarily suspended due to suspicious activity"),
      L("집주인은 임차인에게 계약 갱신 시 월세를 인상하겠다고 통보했습니다.", "What did the landlord notify the tenant of?", ["a rent increase upon contract renewal", "a rent decrease", "free contract renewal", "eviction with no notice"], "a rent increase upon contract renewal"),
      L("한 스타트업은 신제품 개발을 위해 클라우드 서버 사용량을 대폭 늘렸습니다.", "What did the startup do for its new product development?", ["greatly increased its cloud server usage", "reduced its server usage", "switched entirely to offline systems", "outsourced all development"], "greatly increased its cloud server usage"),
      L("예린 씨는 회의에서 예산 삭감안에 반대하며 대안을 제시했습니다.", "What did Yerin do in the meeting?", ["opposed the budget cut proposal and offered an alternative", "agreed to the budget cut without question", "proposed an even bigger budget cut", "left the meeting early"], "opposed the budget cut proposal and offered an alternative"),
      L("병원 접수처는 예약 없이 방문할 경우 대기 시간이 길어질 수 있다고 안내했습니다.", "What did the hospital reception desk explain?", ["waiting time may be longer for walk-ins without a reservation", "walk-ins are no longer accepted", "reservations are unnecessary", "the hospital is closed today"], "waiting time may be longer for walk-ins without a reservation"),
      L("지호 씨는 회사 서버 보안 점검에서 취약점이 발견되어 밤늦게까지 야근했습니다.", "Why did Jiho work late?", ["a vulnerability was found during a server security check", "the server crashed permanently", "he was training a new employee", "the office internet went down"], "a vulnerability was found during a server security check"),
      L("공인중개사는 매매가보다 시세가 낮아 매수인에게 유리한 상황이라고 설명했습니다.", "What did the real estate agent explain?", ["the market price is lower than the sale price, favoring the buyer", "the sale price is far below market value", "the seller refuses to negotiate", "the deal has already fallen through"], "the market price is lower than the sale price, favoring the buyer"),

      { kr: "요즘 젊은 세대와 기성세대 사이에 사용하는 유행어의 차이가 커서 의사소통에 어려움을 겪는 경우가 많습니다.", question: "What difficulty is mentioned?", options: ["communication gaps caused by slang differences between generations", "differences in salary between generations", "disagreements over retirement age", "a shortage of Korean teachers"], answer: "communication gaps caused by slang differences between generations" },
      { kr: "그 배우의 문신이 화제가 되면서 문신에 대한 사회적 편견을 다시 생각해봐야 한다는 목소리가 나오고 있습니다.", question: "What is being reconsidered?", options: ["social prejudice against tattoos", "the actor's acting skills", "a new tattoo ban law", "the cost of tattoo removal"], answer: "social prejudice against tattoos" },
      { kr: "필요한 만큼만 소유하자는 미니멀리즘 라이프스타일이 젊은 층 사이에서 다시 주목받고 있습니다.", question: "What lifestyle trend is gaining attention among young people?", options: ["minimalism", "extreme saving apps", "luxury collecting", "home gardening"], answer: "minimalism" },
      { kr: "일부 직장인들은 승진이나 추가 업무를 거부하고 주어진 역할만 수행하는 '조용한 퇴사'를 택하고 있습니다.", question: "What are some workers choosing to do?", options: ["'quiet quitting' by doing only their assigned role", "quitting their jobs to travel", "demanding immediate promotions", "working unpaid overtime voluntarily"], answer: "'quiet quitting' by doing only their assigned role" },
      { kr: "한 팀장은 부하 직원의 성과를 자신의 것처럼 보고해 논란이 되고 있습니다.", question: "What is the team leader accused of?", options: ["taking credit for a subordinate's work", "firing an employee unfairly", "leaking company secrets", "refusing to approve vacations"], answer: "taking credit for a subordinate's work" },
      { kr: "재택근무와 사무실 근무를 병행하면서 화상 회의가 지나치게 잦아져 피로감을 호소하는 직장인이 늘고 있습니다.", question: "What are more workers complaining about?", options: ["fatigue from too many video meetings", "slow internet at home", "a lack of office desks", "confusing dress codes"], answer: "fatigue from too many video meetings" },
      { kr: "이직을 반복하며 경력을 쌓는 것을 부정적으로 보지 않는 분위기가 확산되고 있습니다.", question: "What attitude is spreading?", options: ["not viewing frequent job changes negatively", "requiring lifelong loyalty to one company", "banning job-hopping in contracts", "preferring older, experienced workers only"], answer: "not viewing frequent job changes negatively" },
      { kr: "한 회사는 직급 대신 이름으로 서로를 부르는 수평적 호칭 제도를 도입했습니다.", question: "What system did the company introduce?", options: ["calling coworkers by name instead of job titles", "removing all managers", "paying everyone the same salary", "eliminating job titles from business cards only"], answer: "calling coworkers by name instead of job titles" },
      { kr: "수많은 구독 서비스에 가입한 소비자들이 지출을 감당하지 못해 일부를 해지하는 사례가 늘고 있습니다.", question: "What are more consumers doing?", options: ["canceling some subscriptions because costs add up", "signing up for even more subscriptions", "demanding free trials only", "switching to physical media entirely"], answer: "canceling some subscriptions because costs add up" },
      { kr: "인공지능이 추천하는 상품만 구매하다 보면 소비자의 선택 폭이 오히려 좁아질 수 있다는 우려가 제기됩니다.", question: "What concern is raised?", options: ["AI recommendations may narrow consumer choice", "AI recommendations are always inaccurate", "AI shopping is illegal in some countries", "AI reduces the price of goods"], answer: "AI recommendations may narrow consumer choice" },
      { kr: "유명인의 뒷광고 논란 이후 소비자들은 인플루언서의 추천을 예전만큼 신뢰하지 않게 되었습니다.", question: "What changed after the undisclosed-ad controversy?", options: ["consumers trust influencer recommendations less", "influencers stopped advertising entirely", "sales of the products increased", "the celebrity was banned from social media"], answer: "consumers trust influencer recommendations less" },
      { kr: "중고 거래 플랫폼 이용자가 급증하면서 관련 사기 신고 건수도 함께 늘고 있습니다.", question: "What is increasing along with secondhand platform use?", options: ["reports of related fraud", "the price of new goods", "the number of physical stores", "shipping delivery times"], answer: "reports of related fraud" },
      { kr: "인공지능이 작성한 기사와 인간 기자가 쓴 기사를 구별하기 어려워지면서 언론의 신뢰성 문제가 대두되고 있습니다.", question: "What issue is emerging?", options: ["media credibility issues from AI-written articles being hard to distinguish", "a shortage of human journalists", "declining newspaper sales only", "new copyright laws for journalists"], answer: "media credibility issues from AI-written articles being hard to distinguish" },
      { kr: "웹툰 산업이 해외로 진출하면서 관련 종사자 수요가 크게 늘고 있습니다.", question: "What is happening to the webtoon industry?", options: ["expanding overseas and increasing demand for workers", "shrinking due to piracy", "being banned in several countries", "merging entirely with the film industry"], answer: "expanding overseas and increasing demand for workers" },
      { kr: "장거리 연애를 하는 커플들은 화상 통화로 서로의 일상을 공유하며 관계를 유지한다고 말합니다.", question: "How do long-distance couples maintain their relationship?", options: ["by sharing daily life through video calls", "by meeting every weekend", "by writing letters only", "by living together part-time"], answer: "by sharing daily life through video calls" },
      { kr: "소개팅 애플리케이션 이용자가 늘고 있지만, 반복되는 만남에 지쳤다는 불만도 적지 않습니다.", question: "What complaint is common among dating app users?", options: ["being exhausted by repeated meetings", "the apps being too expensive", "a lack of male users", "apps requiring too much personal information"], answer: "being exhausted by repeated meetings" },
      { kr: "이혼 후에도 자녀 양육을 위해 협력하는 부모가 늘고 있다는 조사 결과가 나왔습니다.", question: "What did the survey find?", options: ["more divorced parents are cooperating in raising children", "divorce rates are falling sharply", "custody battles are increasing", "remarriage rates are declining"], answer: "more divorced parents are cooperating in raising children" },
      { kr: "성인이 된 이후 새로운 친구를 사귀기 어렵다고 느끼는 사람들이 많아지고 있습니다.", question: "What do many adults feel is difficult?", options: ["making new friends after becoming an adult", "keeping a job for a long time", "finding time to exercise", "affording a house"], answer: "making new friends after becoming an adult" },
      { kr: "조부모와 손주가 함께 사는 다세대 가구가 다시 늘어나는 추세입니다.", question: "What household trend is on the rise again?", options: ["multigenerational households", "single-person households", "childless households only", "households with pets only"], answer: "multigenerational households" },
      { kr: "혼자 여행하는 사람들을 위한 숙소와 여행 상품이 눈에 띄게 늘고 있습니다.", question: "What is increasing noticeably?", options: ["accommodations and tour packages for solo travelers", "group tour packages only", "airline ticket prices", "travel insurance premiums"], answer: "accommodations and tour packages for solo travelers" },
      { kr: "관광객이 지나치게 몰리면서 주민들의 일상생활에 불편을 초래하는 오버투어리즘이 문제가 되고 있습니다.", question: "What problem is mentioned?", options: ["overtourism disrupting residents' daily lives", "a lack of tourists hurting the local economy", "airport construction delays", "rising hotel construction costs"], answer: "overtourism disrupting residents' daily lives" },
      { kr: "저비용 항공사의 지연과 결항이 잦아지자 승객들의 불만이 쏟아지고 있습니다.", question: "What are passengers complaining about?", options: ["frequent delays and cancellations by budget airlines", "high ticket prices only", "lost luggage only", "overbooking on all flights"], answer: "frequent delays and cancellations by budget airlines" },
      { kr: "일부 국가는 원격 근무자를 유치하기 위해 디지털 노마드 비자를 새로 도입했습니다.", question: "What did some countries introduce?", options: ["a digital nomad visa to attract remote workers", "a tax on foreign remote workers", "a ban on remote work visas", "free flights for tourists"], answer: "a digital nomad visa to attract remote workers" },
      { kr: "여행 인플루언서들이 실제와 다른 과장된 사진으로 여행지를 소개해 논란이 되고 있습니다.", question: "What controversy involves travel influencers?", options: ["introducing destinations with exaggerated, unrealistic photos", "refusing to travel to certain countries", "charging fees for travel advice", "being banned from social media"], answer: "introducing destinations with exaggerated, unrealistic photos" },
      { kr: "이번 지방 선거의 투표율이 지난 선거보다 낮게 나타나 그 원인에 관심이 쏠리고 있습니다.", question: "What is drawing attention about this local election?", options: ["voter turnout was lower than the previous election", "voter turnout was record high", "the election was postponed", "results were disputed in court"], answer: "voter turnout was lower than the previous election" },
      { kr: "언론 단체는 정부의 취재 제한 조치가 언론 자유를 침해한다고 비판했습니다.", question: "What did the press association criticize?", options: ["government restrictions on reporting as a violation of press freedom", "a new subscription fee for newspapers", "the closure of a broadcasting station", "a shortage of trained journalists"], answer: "government restrictions on reporting as a violation of press freedom" },
      { kr: "이번 태풍으로 큰 피해를 입은 지역에 정부가 재난지원금을 신속히 지급하기로 했습니다.", question: "What did the government decide?", options: ["to quickly provide disaster relief funds to typhoon-hit areas", "to delay all disaster relief payments", "to rebuild the area with foreign aid only", "to relocate all residents permanently"], answer: "to quickly provide disaster relief funds to typhoon-hit areas" },
      { kr: "이민자 수용 확대를 둘러싼 찬반 논쟁이 국회에서 뜨겁게 이어지고 있습니다.", question: "What is being heatedly debated in the National Assembly?", options: ["expanding the acceptance of immigrants", "cutting foreign aid budgets", "banning all imports", "reducing the voting age"], answer: "expanding the acceptance of immigrants" },
      { kr: "노사 양측은 최저임금 인상 폭을 두고 여전히 합의점을 찾지 못하고 있습니다.", question: "What have labor and management failed to agree on?", options: ["how much to raise the minimum wage", "whether to shorten the workweek", "whether to allow labor unions", "how to fund pensions"], answer: "how much to raise the minimum wage" },
      { kr: "대선 후보들의 토론회가 예정보다 길어지면서 방송 일정에도 차질이 생겼습니다.", question: "What happened during the presidential candidates' debate?", options: ["it ran longer than scheduled, disrupting the broadcast schedule", "it was canceled at the last minute", "only one candidate showed up", "it was moved to an earlier date"], answer: "it ran longer than scheduled, disrupting the broadcast schedule" },
      { kr: "명절마다 반복되는 가족 간 갈등을 줄이기 위해 각자의 방식으로 명절을 보내는 가정이 늘고 있습니다.", question: "What are more families doing to reduce holiday conflict?", options: ["spending holidays in their own way instead of the traditional gathering", "canceling holidays entirely", "inviting more relatives each year", "moving holidays to a different season"], answer: "spending holidays in their own way instead of the traditional gathering" },
      { kr: "회식 문화가 강요가 아닌 자율 참여로 바뀌면서 직장 분위기가 달라지고 있다는 평가가 나옵니다.", question: "What change is affecting workplace atmosphere?", options: ["after-work gatherings becoming voluntary instead of mandatory", "after-work gatherings being banned entirely", "salaries being tied to attendance at gatherings", "companies canceling all social events"], answer: "after-work gatherings becoming voluntary instead of mandatory" },
      { kr: "재난 문자가 지나치게 자주 발송되면서 정작 위급 상황에는 무시당하는 부작용이 나타나고 있습니다.", question: "What side effect is emerging?", options: ["people ignore emergency alerts because they are sent too often", "emergency alerts have stopped working entirely", "phones cannot receive the alerts anymore", "alerts are only sent in one region"], answer: "people ignore emergency alerts because they are sent too often" },
      { kr: "명품 브랜드의 잦은 가격 인상에도 불구하고 오히려 수요가 늘어나는 현상이 나타나고 있습니다.", question: "What phenomenon is occurring with luxury brands?", options: ["demand is rising despite frequent price increases", "demand is falling due to price increases", "prices have been frozen by regulation", "counterfeit sales have stopped completely"], answer: "demand is rising despite frequent price increases" },
      { kr: "직장 내 세대 차이를 줄이기 위해 멘토링 프로그램을 도입하는 기업이 늘고 있습니다.", question: "What are more companies introducing?", options: ["mentoring programs to reduce generational gaps at work", "mandatory retirement at an earlier age", "salary cuts for older employees", "separate offices for each generation"], answer: "mentoring programs to reduce generational gaps at work" },
      { kr: "팟캐스트 광고 시장이 빠르게 성장하면서 전통적인 라디오 광고 매출은 계속 줄고 있습니다.", question: "What is happening as the podcast ad market grows?", options: ["traditional radio ad revenue continues to decline", "traditional radio ad revenue is also growing", "podcast platforms are shutting down", "advertisers are avoiding audio ads entirely"], answer: "traditional radio ad revenue continues to decline" },
    ],
    readingCount: 2,
    writingCount: 5,
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
      {
        passage:
          "최근 몇 년 동안 반려동물을 기르는 가구가 크게 늘면서 관련 산업도 빠르게 성장하고 있다. 예전에는 반려동물을 위한 지출이 사료와 병원비 정도에 그쳤지만, 요즈음에는 전용 미용실, 카페, 심지어 장례 서비스까지 등장했다. 이러한 변화는 반려동물을 단순한 동물이 아니라 가족 구성원으로 여기는 인식이 확산된 결과로 풀이된다. 그러나 일부에서는 과도한 소비를 부추기는 상술이라는 비판도 나온다. 또한 반려동물을 키우다가 감당하지 못해 유기하는 사례가 여전히 줄지 않아, 산업의 외형적 성장과 별개로 책임감 있는 반려 문화 정착이 시급하다는 지적이 제기된다.",
        questions: [
          R("What is the passage mainly about?", ["the growth of the pet industry and related issues", "how to train a pet properly", "the history of pet ownership", "government pet registration fees"], "the growth of the pet industry and related issues"),
          R("What used to be the main pet-related expenses?", ["food and vet bills", "grooming and funerals only", "toys and clothing", "insurance and travel"], "food and vet bills"),
          R("What new services have appeared?", ["grooming salons, cafes, and even funeral services", "pet daycare only", "pet insurance only", "pet hotels only"], "grooming salons, cafes, and even funeral services"),
          R("What is this change interpreted as a result of?", ["pets increasingly being seen as family members", "a decline in pet prices", "new government regulations", "a shortage of veterinarians"], "pets increasingly being seen as family members"),
          R("What criticism is mentioned?", ["that it encourages excessive consumption", "that it is illegal", "that it harms animals", "that it is too small an industry to matter"], "that it encourages excessive consumption"),
          R("What problem still persists despite the industry's growth?", ["abandonment of pets owners cannot handle", "a shortage of pet food", "a lack of pet cafes", "falling adoption rates"], "abandonment of pets owners cannot handle"),
        ],
      },
      {
        passage:
          "인터넷 쇼핑이 일상화되면서 소비자들은 구매 전에 다른 사람의 후기를 참고하는 경우가 많다. 그러나 최근에는 이러한 후기의 신뢰성이 도마 위에 올랐다. 일부 업체가 금전이나 상품을 제공하고 좋은 평가를 유도하는 이른바 '체험단' 후기를 실제 사용 후기처럼 꾸미기 때문이다. 이런 후기는 소비자의 합리적인 선택을 방해할 뿐 아니라, 정직하게 상품을 만드는 업체에도 피해를 준다. 정부는 대가를 받고 작성한 후기에는 이를 명시하도록 하는 규정을 마련했지만, 단속 인력이 부족해 실효성이 떨어진다는 지적이 나온다. 전문가들은 후기의 작성 날짜와 구체성을 함께 살펴보는 것이 도움이 된다고 조언한다.",
        questions: [
          R("What is the main topic of the passage?", ["the reliability problem of online reviews", "how to write a good review", "the rise of internet shopping", "consumer protection law history"], "the reliability problem of online reviews"),
          R("What practice is criticized in the passage?", ["disguising paid promotional reviews as genuine ones", "banning all reviews", "charging customers for reviews", "deleting negative reviews only"], "disguising paid promotional reviews as genuine ones"),
          R("Who is harmed besides consumers?", ["companies that honestly make their products", "review website owners", "delivery companies", "advertising agencies"], "companies that honestly make their products"),
          R("What did the government do about this?", ["require disclosure of paid reviews", "ban online reviews completely", "require all reviews to be positive", "fine companies for negative reviews"], "require disclosure of paid reviews"),
          R("Why is the regulation not very effective?", ["a lack of enforcement personnel", "the regulation was canceled", "companies are unaware of it", "it only applies overseas"], "a lack of enforcement personnel"),
          R("What do experts recommend consumers check?", ["a review's date and specificity", "only the star rating", "the seller's advertising budget", "the number of followers a reviewer has"], "a review's date and specificity"),
        ],
      },
      {
        passage:
          "일부 기업들이 주 4일 근무제를 시범 도입하면서 그 효과에 관심이 쏠리고 있다. 도입 기업들은 근무일이 줄어도 업무를 효율적으로 재배치하면 생산성이 크게 떨어지지 않는다고 밝혔다. 오히려 직원들의 만족도와 집중력이 높아졌다는 조사 결과도 있다. 그러나 모든 업종에 적용하기는 어렵다는 반론도 만만치 않다. 고객을 직접 상대하는 서비스업이나 인력이 부족한 중소기업에서는 근무일 단축이 곧바로 매출 감소로 이어질 수 있다는 우려다. 전문가들은 업종과 기업 규모에 따라 단계적으로 도입하는 방안을 검토해야 한다고 제안한다.",
        questions: [
          R("What is the main topic of the passage?", ["the effects of trial four-day workweeks", "how to hire more employees", "the history of the standard workweek", "a decline in worker salaries"], "the effects of trial four-day workweeks"),
          R("What did companies find about productivity?", ["it did not fall much if work was rearranged efficiently", "it dropped sharply", "it doubled immediately", "it could not be measured"], "it did not fall much if work was rearranged efficiently"),
          R("What positive effect was also reported?", ["higher employee satisfaction and concentration", "lower employee turnover only", "higher company profits only", "shorter commute times"], "higher employee satisfaction and concentration"),
          R("What counterargument does the passage raise?", ["not all industries can apply it easily", "the idea is entirely untested", "employees dislike having more days off", "it is illegal in most countries"], "not all industries can apply it easily"),
          R("Which businesses are especially concerned about the change?", ["customer-facing service businesses and understaffed small firms", "large tech companies only", "government offices only", "companies with no customers"], "customer-facing service businesses and understaffed small firms"),
          R("What do experts suggest?", ["a gradual introduction based on industry and company size", "immediate nationwide adoption", "abandoning the idea entirely", "applying it only to managers"], "a gradual introduction based on industry and company size"),
        ],
      },
      {
        passage:
          "최근 직장인들 사이에서 '조용한 퇴사'라는 말이 자주 언급된다. 이는 실제로 회사를 그만두는 것이 아니라, 주어진 업무만 정확히 처리하고 그 이상의 노력이나 헌신은 하지 않는 태도를 뜻한다. 예전에는 야근과 초과 근무가 성실함의 상징처럼 여겨졌지만, 최근 세대는 회사에 대한 과도한 몰입이 결국 개인의 삶을 희생시킨다고 판단하는 경우가 많다. 기업 입장에서는 이러한 태도가 조직의 활력을 떨어뜨린다고 우려하지만, 노동 시간에 비례하지 않는 보상 체계가 원인이라는 반박도 만만치 않다. 전문가들은 이 현상을 단순한 게으름이 아니라 일과 삶의 경계를 재정립하려는 움직임으로 봐야 한다고 설명한다.",
        questions: [
          { kr: "", question: "What does 'quiet quitting' mean according to the passage?", options: ["doing only assigned work without extra effort", "literally resigning from a job without notice", "quitting to start a new business quietly", "refusing to do any work at all"], answer: "doing only assigned work without extra effort" },
          { kr: "", question: "How was overtime viewed in the past?", options: ["as a symbol of diligence", "as a sign of poor management", "as illegal in most companies", "as a way to earn extra vacation days"], answer: "as a symbol of diligence" },
          { kr: "", question: "What do younger workers believe about excessive devotion to work?", options: ["it ultimately sacrifices personal life", "it always leads to promotion", "it is required by law", "it has no real effect on life"], answer: "it ultimately sacrifices personal life" },
          { kr: "", question: "What do companies worry about?", options: ["a decline in organizational vitality", "a rise in hiring costs", "a shortage of qualified applicants", "an increase in workplace accidents"], answer: "a decline in organizational vitality" },
          { kr: "", question: "What counterargument is raised against blaming employees?", options: ["compensation is not proportional to hours worked", "employees are simply lazy by nature", "companies already pay too much", "the trend only affects one industry"], answer: "compensation is not proportional to hours worked" },
          { kr: "", question: "How do experts interpret this phenomenon?", options: ["as an attempt to redefine the boundary between work and life", "as a temporary economic downturn effect", "as evidence of a skills shortage", "as a sign of declining education levels"], answer: "as an attempt to redefine the boundary between work and life" },
        ],
      },
      {
        passage:
          "평생직장이라는 개념이 사라지면서 짧은 근속 기간을 당연하게 여기는 분위기가 확산되고 있다. 과거에는 한 회사에서 오래 근무하는 것이 안정성과 충성심의 증거로 평가받았지만, 요즘 구직자들은 이직을 경력 관리의 자연스러운 수단으로 받아들인다. 특히 젊은 직장인들은 급여, 성장 가능성, 조직 문화 중 하나라도 기대에 미치지 못하면 비교적 짧은 기간 안에 다른 직장을 알아본다. 기업들은 잦은 이직으로 인한 채용 비용 증가와 업무 공백을 우려하지만, 동시에 우수 인재를 붙잡기 위해 처우를 개선하려는 경쟁도 치열해지고 있다. 결과적으로 이러한 흐름은 노동 시장 전체의 유연성을 높이는 동시에 기업의 인사 전략에도 변화를 요구하고 있다.",
        questions: [
          { kr: "", question: "What concept is described as disappearing?", options: ["lifetime employment at a single company", "the minimum wage system", "mandatory retirement age", "the eight-hour workday"], answer: "lifetime employment at a single company" },
          { kr: "", question: "How was long tenure viewed in the past?", options: ["as proof of stability and loyalty", "as a sign of weak ambition", "as illegal under old labor law", "as unrelated to job performance"], answer: "as proof of stability and loyalty" },
          { kr: "", question: "How do young workers now view job changes?", options: ["as a natural tool for career management", "as something to avoid at all costs", "as a sign of personal failure", "as only acceptable after age 40"], answer: "as a natural tool for career management" },
          { kr: "", question: "When do young employees tend to look for a new job?", options: ["when pay, growth, or culture falls short of expectations", "only after working over ten years", "only when fired", "only when relocating cities"], answer: "when pay, growth, or culture falls short of expectations" },
          { kr: "", question: "What do companies worry about regarding frequent turnover?", options: ["higher hiring costs and work gaps", "lower tax revenue", "increased office rent", "reduced customer satisfaction only"], answer: "higher hiring costs and work gaps" },
          { kr: "", question: "What competitive response are companies making?", options: ["improving treatment to retain talented employees", "shortening the workday for everyone", "reducing all employee benefits", "hiring only temporary staff"], answer: "improving treatment to retain talented employees" },
        ],
      },
      {
        passage:
          "업무 시간 외에 상사나 동료의 연락에 응답하지 않을 권리, 이른바 '연결되지 않을 권리'를 법으로 보장하려는 움직임이 여러 나라에서 나타나고 있다. 스마트폰의 보급으로 업무와 사생활의 경계가 사실상 사라지면서, 퇴근 후에도 이메일이나 메신저 확인에 시달리는 직장인이 늘어난 것이 배경이다. 찬성하는 쪽은 이러한 제도가 직원의 정신 건강을 보호하고 장기적으로는 생산성 향상에도 기여한다고 주장한다. 반면 일부 경영진은 국제적으로 사업을 운영하는 기업의 경우 시차 때문에 업무 연락이 불가피하다며 현실성에 의문을 제기한다. 결국 이 논의의 핵심은 기술이 준 편리함을 개인의 삶을 침해하지 않는 방식으로 다루는 방법을 찾는 데 있다.",
        questions: [
          { kr: "", question: "What right is the passage mainly about?", options: ["the right to not respond to work contact after hours", "the right to unlimited paid leave", "the right to refuse relocation", "the right to negotiate salary annually"], answer: "the right to not respond to work contact after hours" },
          { kr: "", question: "What caused the boundary between work and private life to blur?", options: ["the spread of smartphones", "a new tax law", "a shortage of office space", "the rise of part-time work"], answer: "the spread of smartphones" },
          { kr: "", question: "What do supporters of the law argue?", options: ["it protects mental health and boosts long-term productivity", "it will eliminate the need for managers", "it guarantees higher salaries", "it removes the need for meetings"], answer: "it protects mental health and boosts long-term productivity" },
          { kr: "", question: "What concern do some executives raise?", options: ["time differences make work contact unavoidable for global firms", "employees will stop working entirely", "the law is too expensive to enforce", "customers will be dissatisfied"], answer: "time differences make work contact unavoidable for global firms" },
          { kr: "", question: "What is described as the core issue of this debate?", options: ["handling technology's convenience without invading personal life", "banning smartphones from workplaces", "reducing all working hours by half", "deciding who owns company data"], answer: "handling technology's convenience without invading personal life" },
          { kr: "", question: "The phrase '경계가 사라지다' most closely means…", options: ["a boundary disappears", "a boundary becomes stronger", "a rule is newly created", "a schedule is finalized"], answer: "a boundary disappears" },
        ],
      },
      {
        passage:
          "코로나 이후 원격 근무가 자리 잡으면서 한 나라에 얽매이지 않고 일하는 '디지털 노마드'를 위한 특별 비자를 도입하는 국가가 늘고 있다. 이 비자는 외국 기업에 고용되어 원격으로 일하는 사람에게 장기 체류를 허용하며, 해당 국가에 세금을 내지 않아도 되는 경우가 많다. 관광 산업이 침체된 지역에서는 이러한 제도가 장기 체류자들의 소비를 통해 지역 경제를 활성화하는 효과를 기대하고 있다. 그러나 현지인들 사이에서는 외국인 노동자의 유입으로 주거비가 상승하고 원주민이 도심에서 밀려난다는 불만도 제기된다. 결국 이 제도의 성패는 지역 경제에 활력을 불어넣으면서도 기존 주민의 생활 기반을 해치지 않는 균형을 찾을 수 있느냐에 달려 있다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["special visas for digital nomads", "immigration policy for students", "tourist visa fees", "retirement visa programs"], answer: "special visas for digital nomads" },
          { kr: "", question: "Who is eligible for this type of visa?", options: ["people remotely employed by a foreign company", "only citizens returning from abroad", "retired government workers", "seasonal agricultural workers"], answer: "people remotely employed by a foreign company" },
          { kr: "", question: "What benefit do some regions hope to gain?", options: ["revitalizing the local economy through long-term visitors' spending", "attracting more factory investment", "reducing local unemployment through direct hiring", "increasing tax revenue from tourists' flights"], answer: "revitalizing the local economy through long-term visitors' spending" },
          { kr: "", question: "What complaint do locals raise?", options: ["housing costs rise and residents are pushed out of city centers", "foreign workers take all local jobs", "public schools become overcrowded", "local businesses go bankrupt"], answer: "housing costs rise and residents are pushed out of city centers" },
          { kr: "", question: "What does the passage say determines this policy's success?", options: ["balancing economic vitality with protecting residents' living conditions", "how many visas are issued each year", "whether taxes are collected from visa holders", "how strict the visa application process is"], answer: "balancing economic vitality with protecting residents' living conditions" },
          { kr: "", question: "The word '침체된' is closest in meaning to…", options: ["stagnant", "booming", "regulated", "expanding"], answer: "stagnant" },
        ],
      },
      {
        passage:
          "한때 스타트업의 상징처럼 여겨지던 공유 오피스가 최근 들어 성장세가 둔화되고 있다는 분석이 나온다. 초기에는 저렴한 비용으로 사무 공간과 네트워킹 기회를 동시에 제공한다는 점이 매력적이었지만, 재택근무와 하이브리드 근무가 보편화되면서 굳이 별도의 사무 공간을 임대할 필요성이 줄어든 것이다. 반면 일부 공유 오피스 업체는 단순한 책상 대여를 넘어, 소규모 팀을 위한 맞춤형 회의 공간이나 지역 커뮤니티 행사를 결합한 서비스로 방향을 전환하며 생존을 모색하고 있다. 이러한 변화는 공간을 빌려주는 사업에서 경험과 관계를 제공하는 사업으로 업종의 성격 자체가 바뀌고 있음을 보여 준다.",
        questions: [
          { kr: "", question: "What is happening to coworking spaces according to the passage?", options: ["their growth is slowing down", "they are rapidly expanding worldwide", "they have completely disappeared", "they are being nationalized by governments"], answer: "their growth is slowing down" },
          { kr: "", question: "What made coworking spaces attractive early on?", options: ["low cost office space plus networking opportunities", "free legal consulting for startups", "guaranteed investment funding", "unlimited free food and drinks"], answer: "low cost office space plus networking opportunities" },
          { kr: "", question: "Why has demand for coworking spaces decreased?", options: ["hybrid and remote work reduced the need for separate offices", "coworking prices became too expensive", "most startups have shut down", "new tax laws banned shared offices"], answer: "hybrid and remote work reduced the need for separate offices" },
          { kr: "", question: "How are some coworking companies adapting?", options: ["combining custom meeting spaces with community events", "lowering prices to the minimum possible", "converting offices into apartments", "merging with hotel chains"], answer: "combining custom meeting spaces with community events" },
          { kr: "", question: "What broader shift does this change reflect?", options: ["a shift from renting space to offering experiences and relationships", "a shift from digital to physical retail", "a shift from private to public ownership", "a shift from urban to rural business"], answer: "a shift from renting space to offering experiences and relationships" },
          { kr: "", question: "The word '둔화되다' means…", options: ["to slow down", "to speed up", "to disappear suddenly", "to double in size"], answer: "to slow down" },
        ],
      },
      {
        passage:
          "매달 자동으로 결제되는 구독 서비스가 늘어나면서 '구독 피로'를 호소하는 소비자가 많아지고 있다. 영상 스트리밍, 음악, 클라우드 저장 공간, 심지어 자동차 기능까지 구독 형태로 제공되면서, 소비자는 자신이 어떤 서비스에 얼마를 지출하고 있는지 정확히 파악하기 어려워졌다. 처음에는 소액이라 부담 없이 시작했던 구독이 여러 개 쌓이면 결코 적지 않은 고정 지출이 된다는 것이다. 이에 따라 여러 구독 내역을 한눈에 관리해 주는 애플리케이션이 인기를 끌고 있으며, 일부 소비자는 정기적으로 구독 목록을 점검해 사용하지 않는 서비스를 해지하는 습관을 들이고 있다. 전문가들은 구독 경제가 편리함을 제공하는 동시에 소비자의 지출 감각을 무디게 만들 위험이 있다고 지적한다.",
        questions: [
          { kr: "", question: "What is 'subscription fatigue' about?", options: ["consumers being overwhelmed by many auto-billed subscriptions", "streaming services running out of content", "companies canceling subscriptions without notice", "the high cost of a single subscription"], answer: "consumers being overwhelmed by many auto-billed subscriptions" },
          { kr: "", question: "What has made it hard for consumers to track spending?", options: ["so many different things are now offered as subscriptions", "prices change every day without warning", "subscriptions are illegal to cancel", "companies hide their subscription menus"], answer: "so many different things are now offered as subscriptions" },
          { kr: "", question: "What happens when small subscription fees accumulate?", options: ["they become a considerable fixed expense", "they automatically get refunded", "they are converted into free trials", "they disappear after one year"], answer: "they become a considerable fixed expense" },
          { kr: "", question: "What kind of app has become popular?", options: ["one that manages multiple subscriptions at a glance", "one that blocks all advertisements", "one that tracks daily exercise", "one that manages email spam"], answer: "one that manages multiple subscriptions at a glance" },
          { kr: "", question: "What habit are some consumers developing?", options: ["regularly reviewing and canceling unused subscriptions", "signing up for even more subscriptions", "sharing passwords to reduce cost", "switching banks every month"], answer: "regularly reviewing and canceling unused subscriptions" },
          { kr: "", question: "What risk do experts point out about the subscription economy?", options: ["it can dull consumers' sense of spending", "it always leads to identity theft", "it is completely unregulated by law", "it only benefits large corporations"], answer: "it can dull consumers' sense of spending" },
        ],
      },
      {
        passage:
          "새 제품을 사는 대신 중고 물건을 사고파는 '리세일' 시장이 빠르게 성장하고 있다. 과거에는 중고품 구매가 경제적 여유가 없을 때 선택하는 대안으로 여겨졌지만, 최근에는 환경을 생각하는 소비자들이 자발적으로 중고 거래를 선택하는 경우가 늘고 있다. 특히 의류나 가전제품처럼 생산 과정에서 자원 소모가 큰 품목일수록 재사용의 가치가 크다는 인식이 확산되고 있다. 온라인 중고 거래 플랫폼들은 신뢰를 높이기 위해 상품 검수와 인증 절차를 강화하며 시장 규모를 키워 왔다. 일각에서는 유명 브랜드들이 이러한 흐름에 맞춰 자사 제품의 중고 거래를 공식적으로 지원하는 서비스를 출시하며 새로운 수익원으로 활용하고 있다는 분석도 나온다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["the growth of the secondhand resale market", "the decline of online shopping", "new import tariffs on used goods", "counterfeit product scandals"], answer: "the growth of the secondhand resale market" },
          { kr: "", question: "How was buying secondhand goods viewed in the past?", options: ["as an alternative for those without financial means", "as a luxury only the wealthy could afford", "as illegal in most countries", "as a hobby for collectors only"], answer: "as an alternative for those without financial means" },
          { kr: "", question: "Why do environmentally conscious consumers choose secondhand goods?", options: ["reusing items with high resource consumption in production is seen as valuable", "secondhand items are always cheaper by law", "new products are being banned", "resale items come with better warranties"], answer: "reusing items with high resource consumption in production is seen as valuable" },
          { kr: "", question: "How have online resale platforms tried to build trust?", options: ["by strengthening inspection and authentication procedures", "by removing all seller reviews", "by requiring cash-only payments", "by banning returns entirely"], answer: "by strengthening inspection and authentication procedures" },
          { kr: "", question: "How are some famous brands responding to this trend?", options: ["launching official resale services for their own products", "suing resale platforms for trademark violations", "stopping production of new items", "raising prices to discourage resale"], answer: "launching official resale services for their own products" },
          { kr: "", question: "The word '자발적으로' is closest in meaning to…", options: ["voluntarily", "reluctantly", "accidentally", "temporarily"], answer: "voluntarily" },
        ],
      },
      {
        passage:
          "화려한 로고와 눈에 띄는 디자인 대신 단순하고 절제된 디자인을 선호하는 '조용한 럭셔리'가 새로운 소비 흐름으로 떠오르고 있다. 이러한 스타일을 선택하는 소비자들은 브랜드를 과시하기보다 소재의 질과 만듦새로 가치를 드러내려 한다. 경기 침체로 과도한 소비에 대한 사회적 시선이 예민해진 상황에서, 값비싼 물건을 티 나지 않게 소비하려는 심리가 반영된 결과라는 분석도 있다. 명품 업계는 이러한 변화에 맞춰 로고를 최소화한 제품 라인을 확대하고 있지만, 일부에서는 결국 이러한 절제된 디자인 역시 안목이 있는 사람만 알아볼 수 있는 또 다른 형태의 과시라고 꼬집는다.",
        questions: [
          { kr: "", question: "What is 'quiet luxury' as described in the passage?", options: ["preferring simple, understated design over flashy logos", "buying only secondhand luxury goods", "avoiding luxury brands entirely", "wearing handmade traditional clothing"], answer: "preferring simple, understated design over flashy logos" },
          { kr: "", question: "How do consumers of this style show value?", options: ["through material quality and craftsmanship rather than showing off brands", "by wearing the largest logos available", "by only buying discounted items", "by advertising prices publicly"], answer: "through material quality and craftsmanship rather than showing off brands" },
          { kr: "", question: "What social context is linked to this trend?", options: ["heightened sensitivity toward excessive consumption during an economic downturn", "a government ban on luxury advertising", "a shortage of luxury materials", "rising import taxes on fashion goods"], answer: "heightened sensitivity toward excessive consumption during an economic downturn" },
          { kr: "", question: "How has the luxury industry responded?", options: ["expanding product lines with minimized logos", "stopping all production of luxury goods", "lowering prices across all products", "merging with fast-fashion brands"], answer: "expanding product lines with minimized logos" },
          { kr: "", question: "What criticism is raised about quiet luxury?", options: ["it is still a form of display, recognizable only to the discerning", "it is cheaper than regular luxury goods", "it harms the environment more than loud branding", "it is only popular among teenagers"], answer: "it is still a form of display, recognizable only to the discerning" },
          { kr: "", question: "The word '절제된' most closely means…", options: ["restrained", "excessive", "colorful", "cheap"], answer: "restrained" },
        ],
      },
      {
        passage:
          "물건을 먼저 받고 대금을 여러 번에 나누어 내는 '선구매 후결제' 서비스가 젊은 소비자들 사이에서 빠르게 확산되고 있다. 신용카드 발급이 어려운 사회 초년생도 손쉽게 이용할 수 있다는 점이 인기 요인으로 꼽힌다. 그러나 이러한 간편함이 오히려 과소비를 부추긴다는 우려도 커지고 있다. 여러 업체의 서비스를 동시에 이용하다 보면 자신이 갚아야 할 총액을 정확히 인식하지 못하는 경우가 생기고, 결제일을 놓쳐 연체료가 눈덩이처럼 불어나는 사례도 보고된다. 금융 당국은 이러한 서비스에 대한 규제를 검토하고 있지만, 업계는 이미 소비자의 결제 습관으로 자리 잡은 서비스를 갑작스럽게 제한하면 시장에 혼란을 줄 수 있다고 반박한다.",
        questions: [
          { kr: "", question: "What service is the passage mainly about?", options: ["buy-now-pay-later installment payment services", "traditional bank loans", "cryptocurrency trading apps", "credit card reward programs"], answer: "buy-now-pay-later installment payment services" },
          { kr: "", question: "Why is this service popular among young consumers?", options: ["it is easy to use even without a credit card", "it offers the lowest prices in the market", "it requires a high income to qualify", "it guarantees free shipping"], answer: "it is easy to use even without a credit card" },
          { kr: "", question: "What concern is raised about the service's convenience?", options: ["it may encourage overspending", "it discourages online shopping entirely", "it is only available to wealthy users", "it eliminates the need for banks"], answer: "it may encourage overspending" },
          { kr: "", question: "What problem can occur when using multiple such services at once?", options: ["losing track of the total amount owed", "being unable to make any purchases", "having accounts automatically closed", "receiving duplicate items"], answer: "losing track of the total amount owed" },
          { kr: "", question: "What happens when a payment deadline is missed?", options: ["late fees can grow rapidly", "the purchase is automatically canceled", "the item must be returned immediately", "the user's account is deleted"], answer: "late fees can grow rapidly" },
          { kr: "", question: "How does the industry respond to proposed regulation?", options: ["arguing sudden restriction could confuse a now-established market", "agreeing completely with all new rules", "threatening to leave the country", "denying that any problems exist"], answer: "arguing sudden restriction could confuse a now-established market" },
        ],
      },
      {
        passage:
          "온라인 쇼핑몰들이 인공지능을 활용해 사용자의 검색 기록과 구매 패턴을 분석하여 상품을 추천하는 '초개인화' 서비스를 확대하고 있다. 이러한 기술은 소비자가 원하는 상품을 더 빠르게 찾도록 돕는다는 장점이 있지만, 동시에 소비자를 특정한 소비 취향에 가두는 부작용도 우려된다. 알고리즘이 추천하는 상품만 반복적으로 노출되다 보면, 정작 소비자 자신이 미처 발견하지 못했을 새로운 선택지는 점점 접하기 어려워진다는 것이다. 일부 전문가는 이를 정보의 '거품' 현상에 빗대며, 소비자가 자신의 선택이 얼마나 알고리즘에 의해 만들어졌는지 인식조차 하지 못할 수 있다고 경고한다. 이에 따라 추천 알고리즘의 작동 원리를 소비자에게 투명하게 공개해야 한다는 목소리도 커지고 있다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["hyper-personalized product recommendation using AI", "the decline of physical retail stores", "counterfeit goods sold online", "shipping delays in e-commerce"], answer: "hyper-personalized product recommendation using AI" },
          { kr: "", question: "What advantage does this technology offer?", options: ["helping consumers find desired products faster", "eliminating the need for payment", "guaranteeing the lowest prices", "removing all advertising from websites"], answer: "helping consumers find desired products faster" },
          { kr: "", question: "What side effect is a concern?", options: ["trapping consumers within a narrow range of tastes", "causing websites to crash frequently", "increasing shipping costs", "reducing product variety in warehouses"], answer: "trapping consumers within a narrow range of tastes" },
          { kr: "", question: "What happens when only algorithm-recommended items are shown repeatedly?", options: ["consumers struggle to encounter new options", "consumers automatically save more money", "product quality improves over time", "delivery becomes faster"], answer: "consumers struggle to encounter new options" },
          { kr: "", question: "What do some experts compare this phenomenon to?", options: ["an information 'bubble'", "a financial crash", "a supply chain collapse", "a labor shortage"], answer: "an information 'bubble'" },
          { kr: "", question: "What growing demand is mentioned at the end?", options: ["transparency about how recommendation algorithms work", "a total ban on online shopping", "free returns on all purchases", "government-run shopping platforms"], answer: "transparency about how recommendation algorithms work" },
        ],
      },
      {
        passage:
          "도심의 주택 가격이 치솟으면서 최소한의 면적으로 설계된 '초소형 주택'이 새로운 주거 형태로 주목받고 있다. 십 제곱미터 안팎의 공간에 수납, 취침, 조리 기능을 효율적으로 압축한 이러한 주택은 특히 1인 가구가 밀집한 대도시에서 인기를 끌고 있다. 설계자들은 가구를 접거나 벽에 수납하는 방식으로 좁은 공간을 다목적으로 활용하는 기술을 발전시켜 왔다. 그러나 일부에서는 이러한 주거 형태가 근본적인 주택 공급 부족 문제를 해결하기보다, 좁은 공간에서의 생활을 미화해 오히려 열악한 주거 환경을 정당화한다는 비판도 제기한다. 도시 계획 전문가들은 초소형 주택이 단기적인 대안은 될 수 있어도 장기적인 주거 정책의 중심이 되어서는 안 된다고 강조한다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["the rise of micro-apartments in cities", "a new subway construction project", "rent control legislation", "suburban housing developments"], answer: "the rise of micro-apartments in cities" },
          { kr: "", question: "Who tends to prefer this type of housing?", options: ["single-person households in dense big cities", "large families with children", "retirees moving to rural areas", "foreign diplomats"], answer: "single-person households in dense big cities" },
          { kr: "", question: "How do designers make the most of the limited space?", options: ["using foldable furniture and wall storage", "adding extra floors to each unit", "removing kitchens entirely", "sharing space between multiple buildings"], answer: "using foldable furniture and wall storage" },
          { kr: "", question: "What criticism is raised about micro-housing?", options: ["it may glamorize and justify poor living conditions", "it is far too expensive for most people", "it requires too much land", "it increases traffic congestion"], answer: "it may glamorize and justify poor living conditions" },
          { kr: "", question: "What do urban planning experts caution?", options: ["it should not become the center of long-term housing policy", "it should replace all traditional housing", "it is illegal in most cities", "it only works in rural areas"], answer: "it should not become the center of long-term housing policy" },
          { kr: "", question: "The phrase '치솟다' is closest in meaning to…", options: ["to soar", "to fall sharply", "to remain stable", "to disappear"], answer: "to soar" },
        ],
      },
      {
        passage:
          "직장, 학교, 병원, 상점 등 일상에 필요한 시설을 도보나 자전거로 십오 분 안에 이용할 수 있도록 설계하는 '십오 분 도시' 개념이 여러 나라의 도시 계획에 도입되고 있다. 이 개념은 자동차 이용을 줄여 교통 혼잡과 대기 오염을 완화하는 동시에, 주민들이 자신이 사는 지역 안에서 대부분의 생활을 해결하도록 유도한다. 지지자들은 이러한 방식이 지역 상권을 살리고 이웃 간의 유대감을 강화하는 효과도 있다고 설명한다. 그러나 기존에 형성된 도시를 이 개념에 맞춰 재구성하는 데는 막대한 예산과 시간이 필요하며, 일부 주민들은 특정 지역에 시설이 집중되면서 오히려 부동산 가격이 급등하는 부작용을 겪고 있다고 지적한다.",
        questions: [
          { kr: "", question: "What is the '15-minute city' concept about?", options: ["designing cities so daily needs are reachable within 15 minutes on foot or bike", "building 15 new subway stations per year", "limiting city population growth", "reducing the workweek to 15 hours"], answer: "designing cities so daily needs are reachable within 15 minutes on foot or bike" },
          { kr: "", question: "What effects does this concept aim to achieve?", options: ["reducing traffic congestion and air pollution", "increasing car sales", "expanding highway networks", "raising public transit fares"], answer: "reducing traffic congestion and air pollution" },
          { kr: "", question: "What additional benefit do supporters mention?", options: ["reviving local businesses and strengthening neighborhood ties", "eliminating the need for local government", "increasing international tourism", "reducing the need for schools"], answer: "reviving local businesses and strengthening neighborhood ties" },
          { kr: "", question: "What challenge does restructuring existing cities present?", options: ["it requires enormous budget and time", "it is technically impossible", "it is banned by international law", "it requires no government involvement"], answer: "it requires enormous budget and time" },
          { kr: "", question: "What side effect do some residents report?", options: ["real estate prices surging in certain concentrated areas", "a shortage of workers in rural areas", "declining school enrollment", "increased crime rates"], answer: "real estate prices surging in certain concentrated areas" },
          { kr: "", question: "The word '완화하다' is closest in meaning to…", options: ["to ease", "to worsen", "to eliminate instantly", "to ignore"], answer: "to ease" },
        ],
      },
      {
        passage:
          "빌딩 옥상의 빈 공간을 활용해 채소와 과일을 재배하는 '옥상 텃밭'이 도시 곳곳에서 늘어나고 있다. 이러한 시도는 식재료의 이동 거리를 줄여 신선도를 높이고 운송 과정에서 발생하는 탄소 배출을 줄인다는 점에서 주목받는다. 또한 삭막한 도심에 녹지를 늘려 건물의 열섬 현상을 완화하는 부수적인 효과도 있다는 연구 결과가 발표되었다. 지방자치단체 중에는 옥상 텃밭 조성 비용의 일부를 지원하며 이 흐름을 장려하는 곳도 있다. 다만 건물 구조상 하중을 견딜 수 있는지에 대한 안전 검토가 선행되어야 하고, 초기 투자 비용에 비해 수확량이 많지 않아 경제성 면에서는 아직 갈 길이 멀다는 지적도 나온다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["the growth of rooftop urban farms", "the decline of traditional farming", "a new pesticide regulation", "food import tariffs"], answer: "the growth of rooftop urban farms" },
          { kr: "", question: "What benefit does rooftop farming provide for food?", options: ["increased freshness and reduced transport carbon emissions", "lower prices for all produce", "longer shelf life through refrigeration", "elimination of the need for grocery stores"], answer: "increased freshness and reduced transport carbon emissions" },
          { kr: "", question: "What additional effect on cities is mentioned?", options: ["easing the urban heat island effect", "reducing building construction costs", "increasing traffic flow", "reducing noise pollution"], answer: "easing the urban heat island effect" },
          { kr: "", question: "How are some local governments supporting this trend?", options: ["subsidizing part of the setup cost", "requiring all buildings to have rooftop farms", "banning traditional farming nearby", "taxing buildings without gardens"], answer: "subsidizing part of the setup cost" },
          { kr: "", question: "What safety concern must be addressed first?", options: ["whether the building structure can bear the load", "whether the vegetables are edible", "whether pesticides are being used", "whether workers are properly insured"], answer: "whether the building structure can bear the load" },
          { kr: "", question: "What economic limitation is noted?", options: ["yields are still low relative to initial investment", "produce cannot be sold legally", "farming equipment is too heavy to install", "labor costs exceed produce value tenfold"], answer: "yields are still low relative to initial investment" },
        ],
      },
      {
        passage:
          "혼자 살면서도 완전히 고립되지 않기를 원하는 청년층을 겨냥해, 개인 공간은 따로 두되 주방과 거실 등 일부 공간을 공유하는 '코리빙' 주거 형태가 인기를 얻고 있다. 이러한 방식은 임대료 부담을 줄이는 동시에 입주민 간의 교류 기회를 제공한다는 점에서 전통적인 자취 생활과 차별화된다. 운영 업체들은 정기적인 모임이나 취미 활동 프로그램을 마련해 입주민들이 자연스럽게 친분을 쌓도록 돕기도 한다. 그러나 사생활 보호에 민감한 사람에게는 공용 공간에서의 소음이나 생활 습관 차이가 스트레스 요인이 될 수 있다는 우려도 있다. 결국 코리빙의 확산은 혼자 살고 싶지만 완전히 혼자이고 싶지는 않은 현대인의 이중적인 욕구를 반영한다고 볼 수 있다.",
        questions: [
          { kr: "", question: "What is 'co-living' as described in the passage?", options: ["private rooms with shared kitchen and living spaces", "entire apartments shared by strangers with no privacy", "government-subsidized housing for families", "temporary shelters for the homeless"], answer: "private rooms with shared kitchen and living spaces" },
          { kr: "", question: "How does co-living differ from traditional solo living?", options: ["it reduces rent burden while offering interaction opportunities", "it is always more expensive", "it requires marriage to qualify", "it bans any personal furniture"], answer: "it reduces rent burden while offering interaction opportunities" },
          { kr: "", question: "What do operating companies often provide?", options: ["regular gatherings and hobby programs", "free legal counseling", "unlimited free meals", "personal drivers"], answer: "regular gatherings and hobby programs" },
          { kr: "", question: "What concern is raised for privacy-sensitive people?", options: ["noise and differing habits in shared spaces can cause stress", "rent is not clearly disclosed", "residents must share bank accounts", "contracts cannot be canceled"], answer: "noise and differing habits in shared spaces can cause stress" },
          { kr: "", question: "What dual desire does co-living reflect?", options: ["wanting to live alone but not be completely isolated", "wanting to save money while living luxuriously", "wanting privacy while working from an office", "wanting to travel while owning property"], answer: "wanting to live alone but not be completely isolated" },
          { kr: "", question: "The word '고립되다' is closest in meaning to…", options: ["to become isolated", "to become popular", "to become wealthy", "to become organized"], answer: "to become isolated" },
        ],
      },
      {
        passage:
          "고밀도 아파트가 늘어나면서 위아래 층 사이의 생활 소음을 둘러싼 갈등이 사회적 문제로 대두되고 있다. 아이들이 뛰는 소리나 가구를 끄는 소음 등 일상적인 생활 소음도 반복되면 이웃 간의 심각한 분쟁으로 번지는 경우가 적지 않다. 일부 지방자치단체는 분쟁을 중재하는 전담 기구를 운영하며 당사자 간 대화를 유도하고 있지만, 감정이 격해진 상태에서는 중재가 효과를 보지 못하는 경우도 많다. 건설업계는 층간 소음을 줄이는 바닥재와 구조를 개발해 신축 아파트에 적용하고 있으나, 이미 지어진 노후 아파트에는 이러한 기술을 적용하기 어렵다는 한계가 있다. 전문가들은 기술적 해결책과 더불어 공동 주택 생활에 필요한 배려의 문화를 함께 만들어 가야 한다고 강조한다.",
        questions: [
          { kr: "", question: "What social problem does the passage describe?", options: ["conflicts over noise between apartment floors", "a shortage of new apartment construction", "rising apartment maintenance fees", "a lack of parking spaces"], answer: "conflicts over noise between apartment floors" },
          { kr: "", question: "What kind of everyday sounds cause disputes?", options: ["children running and furniture being dragged", "loud music played at parties", "construction noise from renovations", "car alarms in the parking lot"], answer: "children running and furniture being dragged" },
          { kr: "", question: "What have some local governments done?", options: ["operated mediation bodies to encourage dialogue between neighbors", "banned children from living in apartments", "fined all residents equally", "required soundproof headphones for all residents"], answer: "operated mediation bodies to encourage dialogue between neighbors" },
          { kr: "", question: "Why does mediation sometimes fail?", options: ["emotions between the parties are already too heightened", "mediators are not legally trained", "there are no mediation offices available", "residents refuse to attend any meetings"], answer: "emotions between the parties are already too heightened" },
          { kr: "", question: "What limitation exists for the construction industry's solution?", options: ["it is hard to apply new flooring technology to older buildings", "it is too expensive for new buildings", "it is banned by safety regulations", "it only works in single-family homes"], answer: "it is hard to apply new flooring technology to older buildings" },
          { kr: "", question: "What do experts emphasize alongside technical solutions?", options: ["building a culture of consideration for communal living", "increasing apartment prices to reduce density", "banning apartment living altogether", "relocating all families to houses"], answer: "building a culture of consideration for communal living" },
        ],
      },
      {
        passage:
          "잠들기 전까지 스마트폰으로 끊임없이 부정적인 뉴스나 자극적인 콘텐츠를 넘겨 보는 '둠스크롤링'이 현대인의 새로운 습관으로 자리 잡았다. 재난이나 사고 소식을 보면 불안감이 커지는데도, 사람들은 오히려 더 많은 정보를 확인하려는 심리에 이끌려 화면에서 눈을 떼지 못한다. 연구에 따르면 이러한 습관은 수면의 질을 떨어뜨릴 뿐 아니라 불안 장애나 우울감을 악화시킬 수 있다고 한다. 전문가들은 잠자리에 들기 전 일정 시간 동안 스마트폰 사용을 자제하는 '디지털 통금'을 권장하지만, 습관이 이미 몸에 밴 사람들에게는 실천이 쉽지 않다. 일부 애플리케이션 개발자들은 특정 시간이 되면 자극적인 콘텐츠 노출을 자동으로 제한하는 기능을 도입해 이러한 문제에 대응하고 있다.",
        questions: [
          { kr: "", question: "What is 'doomscrolling' as described in the passage?", options: ["endlessly scrolling negative news before sleep", "searching only for positive news", "posting daily updates on social media", "watching entertainment shows all night"], answer: "endlessly scrolling negative news before sleep" },
          { kr: "", question: "Why do people keep scrolling despite feeling anxious?", options: ["they feel compelled to check for more information", "they are required to by their jobs", "the content automatically refreshes without stopping", "they are unaware anxiety is increasing"], answer: "they feel compelled to check for more information" },
          { kr: "", question: "What negative effects does research link to this habit?", options: ["lower sleep quality and worsened anxiety or depression", "improved memory but poor eyesight", "increased social skills but poor grades", "higher productivity but weight gain"], answer: "lower sleep quality and worsened anxiety or depression" },
          { kr: "", question: "What do experts recommend?", options: ["a 'digital curfew' limiting phone use before bed", "banning smartphones from being sold", "sleeping with the phone turned off completely", "replacing phones with paper newspapers"], answer: "a 'digital curfew' limiting phone use before bed" },
          { kr: "", question: "Why is this recommendation hard to follow?", options: ["the habit is already deeply ingrained for many people", "phones cannot be turned off at night", "it is against the law in some countries", "there is no scientific evidence supporting it"], answer: "the habit is already deeply ingrained for many people" },
          { kr: "", question: "How are some app developers addressing the problem?", options: ["automatically limiting stimulating content at certain hours", "removing news apps entirely", "charging extra for nighttime use", "requiring parental permission to use apps"], answer: "automatically limiting stimulating content at certain hours" },
        ],
      },
      {
        passage:
          "짧게는 몇 초, 길어도 몇 분을 넘지 않는 짧은 영상 콘텐츠가 전 세대의 콘텐츠 소비 방식을 바꾸고 있다. 강렬한 첫 장면으로 시청자의 시선을 붙잡고, 빠른 전개로 지루할 틈을 주지 않는 이러한 형식은 특히 젊은 세대에게 큰 호응을 얻고 있다. 그러나 이러한 소비 습관이 장시간 집중력을 요구하는 독서나 강의 청취를 어렵게 만든다는 우려도 제기된다. 실제로 일부 교육 현장에서는 학생들이 긴 글을 끝까지 읽는 데 어려움을 겪는다는 보고가 이어지고 있다. 콘텐츠 제작자들 사이에서도 짧은 영상의 인기에 맞춰 콘텐츠를 더욱 자극적이고 단편적으로 만드는 경쟁이 심화되면서, 깊이 있는 정보 전달이 뒷전으로 밀린다는 자성의 목소리도 나온다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["how short-form video is changing content consumption", "the rise of traditional television", "new film industry regulations", "the decline of social media use"], answer: "how short-form video is changing content consumption" },
          { kr: "", question: "What technique do short videos use to hold attention?", options: ["a strong opening scene and fast pacing", "long introductions before the main content", "silent scenes with slow pacing", "extensive written subtitles"], answer: "a strong opening scene and fast pacing" },
          { kr: "", question: "What concern is raised about this consumption habit?", options: ["it makes sustained reading or listening harder", "it increases screen damage to eyes only", "it eliminates the need for the internet", "it reduces video quality standards"], answer: "it makes sustained reading or listening harder" },
          { kr: "", question: "What has been reported in some educational settings?", options: ["students struggle to read long texts to the end", "students no longer attend school", "test scores have improved dramatically", "teachers have stopped assigning homework"], answer: "students struggle to read long texts to the end" },
          { kr: "", question: "What competitive pressure do content creators face?", options: ["making content more sensational and fragmented", "producing only educational material", "lengthening videos to increase ad revenue", "removing all captions from videos"], answer: "making content more sensational and fragmented" },
          { kr: "", question: "What is being pushed aside according to the passage's closing point?", options: ["in-depth delivery of information", "advertising revenue", "video editing quality", "platform subscription numbers"], answer: "in-depth delivery of information" },
        ],
      },
      {
        passage:
          "디지털 기기에서 완전히 벗어나 며칠간 자연 속에서 지내는 '디지털 디톡스' 프로그램을 찾는 사람들이 늘고 있다. 참가자들은 프로그램 기간 동안 스마트폰을 반납하고, 독서나 명상, 산책 등 화면 없이 즐길 수 있는 활동으로 하루를 채운다. 처음에는 연락이 끊긴다는 사실에 불안감을 느끼던 참가자들도 시간이 지나면서 오히려 정신적인 여유를 되찾았다고 말한다. 이러한 프로그램의 인기는 역설적으로 디지털 기술이 일상에 얼마나 깊이 침투했는지를 보여 주는 현상이라 할 수 있다. 다만 며칠간의 단절이 근본적인 습관을 바꾸지는 못하며, 일상으로 복귀하는 순간 다시 이전의 사용 패턴으로 돌아가는 경우가 많다는 지적도 있다.",
        questions: [
          { kr: "", question: "What is a 'digital detox' program as described?", options: ["spending days in nature completely free of digital devices", "learning to code without internet access", "a therapy program for internet addiction only", "a competition for the fastest typing speed"], answer: "spending days in nature completely free of digital devices" },
          { kr: "", question: "What activities do participants do instead of using screens?", options: ["reading, meditating, and walking", "watching movies together", "playing video games offline", "attending online classes"], answer: "reading, meditating, and walking" },
          { kr: "", question: "How do participants initially feel about being unreachable?", options: ["anxious", "excited", "indifferent", "proud"], answer: "anxious" },
          { kr: "", question: "What do participants report after the program?", options: ["regaining a sense of mental ease", "increased dependence on their phones", "worsened sleep quality", "loss of interest in nature"], answer: "regaining a sense of mental ease" },
          { kr: "", question: "What does the popularity of this program paradoxically reveal?", options: ["how deeply digital technology has penetrated daily life", "how few people own smartphones", "how expensive digital devices have become", "how rural areas lack internet access"], answer: "how deeply digital technology has penetrated daily life" },
          { kr: "", question: "What limitation is pointed out about these programs?", options: ["old usage patterns often return once back in daily life", "the programs are too expensive for most people", "they are only available to certain age groups", "they require professional medical supervision"], answer: "old usage patterns often return once back in daily life" },
        ],
      },
      {
        passage:
          "스피커나 스마트폰에 탑재된 음성 비서가 일정 관리부터 조명 조작까지 일상의 여러 영역에 깊이 관여하면서, 사람들은 점점 더 자연스럽게 기계에게 말을 걸며 하루를 시작하게 되었다. 손을 쓰지 않아도 명령을 내릴 수 있다는 편리함 덕분에 특히 요리 중이거나 운전 중처럼 손이 자유롭지 못한 상황에서 활용도가 높다. 그러나 음성 비서가 대화 내용을 항상 듣고 있어야 작동한다는 특성상, 사생활 침해에 대한 우려도 꾸준히 제기된다. 일부 사용자는 무심코 나눈 대화가 기기에 저장되어 맞춤 광고에 활용되었다는 의혹을 제기하기도 했다. 기업들은 데이터 보호 정책을 강화하고 있다고 해명하지만, 소비자의 신뢰를 완전히 회복하기까지는 시간이 필요해 보인다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["voice assistants becoming part of daily routines and related privacy concerns", "a new smartphone model release", "the decline of home appliance sales", "government regulation of speakers"], answer: "voice assistants becoming part of daily routines and related privacy concerns" },
          { kr: "", question: "When is voice assistant use especially helpful?", options: ["when hands are occupied, like cooking or driving", "only when reading a book", "only during meetings", "only while sleeping"], answer: "when hands are occupied, like cooking or driving" },
          { kr: "", question: "Why does privacy concern arise with voice assistants?", options: ["they must constantly listen to function", "they require a monthly subscription fee", "they cannot be turned off", "they share data only with the government"], answer: "they must constantly listen to function" },
          { kr: "", question: "What suspicion have some users raised?", options: ["casual conversations were stored and used for targeted ads", "the devices explode when overheated", "the devices are illegal in some countries", "the devices record video without consent"], answer: "casual conversations were stored and used for targeted ads" },
          { kr: "", question: "How have companies responded to these concerns?", options: ["strengthening data protection policies", "discontinuing all voice assistant products", "offering free devices to affected users", "ignoring the complaints entirely"], answer: "strengthening data protection policies" },
          { kr: "", question: "What does the passage suggest about consumer trust?", options: ["it will take time to fully restore", "it has already been completely restored", "it was never affected", "it is irrelevant to sales"], answer: "it will take time to fully restore" },
        ],
      },
      {
        passage:
          "이른바 'MZ세대'로 불리는 젊은 직장인들의 조직 문화에 대한 인식이 기성세대와 뚜렷한 차이를 보이면서 세대 갈등이 새로운 화두로 떠오르고 있다. 기성세대는 조직에 대한 충성심과 위계질서를 중시하는 반면, 젊은 세대는 개인의 성장과 공정한 보상을 우선시하는 경향이 강하다. 예를 들어 회식이나 단체 활동을 조직 결속의 수단으로 여기는 상사와 달리, 젊은 직원들은 이를 업무 외 시간을 침해하는 부담으로 받아들이는 경우가 많다. 일부 기업은 세대 간 소통 격차를 줄이기 위해 상호 이해를 돕는 워크숍을 운영하고 있지만, 근본적인 가치관의 차이를 단기간에 좁히기는 쉽지 않다는 평가가 많다. 전문가들은 세대 차이를 갈등의 요인이 아니라 조직의 다양성을 높이는 자원으로 활용해야 한다고 조언한다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["generational differences in workplace culture", "a new minimum wage law", "declining birth rates among young workers", "a shortage of skilled labor"], answer: "generational differences in workplace culture" },
          { kr: "", question: "What does the older generation tend to value?", options: ["loyalty to the organization and hierarchy", "personal growth above all", "frequent job changes", "remote work exclusively"], answer: "loyalty to the organization and hierarchy" },
          { kr: "", question: "What does the younger generation tend to prioritize?", options: ["personal growth and fair compensation", "seniority-based promotion", "long working hours", "company loyalty over personal life"], answer: "personal growth and fair compensation" },
          { kr: "", question: "How do younger employees often view company dinners?", options: ["as a burden that intrudes on personal time", "as their favorite part of the job", "as mandatory training", "as an opportunity for promotion"], answer: "as a burden that intrudes on personal time" },
          { kr: "", question: "What are some companies doing to reduce the generational gap?", options: ["running workshops to promote mutual understanding", "firing all older employees", "banning intergenerational teams", "eliminating team meetings"], answer: "running workshops to promote mutual understanding" },
          { kr: "", question: "What do experts suggest about generational differences?", options: ["treating them as a resource for organizational diversity", "eliminating them through strict rules", "ignoring them entirely", "resolving them only through legislation"], answer: "treating them as a resource for organizational diversity" },
        ],
      },
      {
        passage:
          "은퇴 이후에도 경제 활동을 이어가려는 고령층이 늘면서 '재고용'을 둘러싼 사회적 논의가 활발해지고 있다. 평균 수명이 늘어난 만큼 은퇴 이후에도 상당한 기간을 보내야 하는 현실에서, 많은 은퇴자들이 경제적 이유뿐 아니라 사회적 소속감을 위해서도 일자리를 필요로 한다. 기업들은 숙련된 인력을 활용할 수 있다는 장점이 있지만, 신입 직원과의 임금 격차나 조직 내 역할 재조정 문제로 고민이 크다. 정부는 고령자 고용을 장려하기 위해 기업에 보조금을 지급하는 제도를 운영하고 있지만, 청년 일자리를 잠식한다는 우려의 목소리도 만만치 않다. 전문가들은 세대 간 일자리를 경쟁 관계로만 볼 것이 아니라, 서로 다른 역할을 맡도록 조정하는 방안을 모색해야 한다고 말한다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["the reemployment of retirees in the workforce", "a new pension reform bill", "youth unemployment causes", "mandatory retirement age laws"], answer: "the reemployment of retirees in the workforce" },
          { kr: "", question: "Why do many retirees seek continued employment?", options: ["for both financial reasons and a sense of belonging", "only because pensions were abolished", "only to avoid boredom", "only because their families require it"], answer: "for both financial reasons and a sense of belonging" },
          { kr: "", question: "What advantage do companies see in rehiring older workers?", options: ["access to skilled and experienced labor", "lower training costs than for anyone else", "guaranteed government contracts", "exemption from labor laws"], answer: "access to skilled and experienced labor" },
          { kr: "", question: "What difficulty do companies face with reemployment?", options: ["wage gaps and reorganizing roles within the company", "a total lack of qualified older workers", "legal bans on hiring retirees", "excessive training costs for basic skills"], answer: "wage gaps and reorganizing roles within the company" },
          { kr: "", question: "What concern exists about government subsidies for hiring seniors?", options: ["they might crowd out youth job opportunities", "they are too expensive for the government", "they are illegal under labor law", "they only benefit large corporations"], answer: "they might crowd out youth job opportunities" },
          { kr: "", question: "What do experts suggest about generational job competition?", options: ["adjusting roles so generations play complementary parts rather than compete", "banning older workers from applying to certain jobs", "raising the retirement age indefinitely", "removing all government job subsidies"], answer: "adjusting roles so generations play complementary parts rather than compete" },
        ],
      },
      {
        passage:
          "손목시계형 기기로 수면의 질을 측정하고 분석하는 '수면 경제'가 새로운 건강 산업으로 떠오르고 있다. 이러한 기기는 뒤척임, 심박수, 호흡 패턴 등을 감지해 사용자에게 수면 점수를 제공하고, 숙면을 위한 습관을 제안하기도 한다. 만성적인 수면 부족에 시달리던 사람들이 자신의 수면 상태를 객관적인 수치로 확인하면서 생활 습관을 개선하는 계기로 삼는 경우가 많다. 그러나 일부 전문가들은 숫자에 지나치게 집착하는 것이 오히려 수면에 대한 불안을 키운다고 경고한다. 낮은 수면 점수를 확인한 뒤 잠들지 못할까 봐 걱정하다가 정작 잠을 설치는 역설적인 상황이 생긴다는 것이다. 결국 기술은 수면 문제를 보조적으로 진단하는 도구일 뿐, 근본적인 해결책은 개인의 생활 습관 전반을 되돌아보는 데 있다는 조언이 나온다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["the rise of the sleep-tracking wellness economy", "the discovery of a new sleep disorder", "the invention of sleeping pills", "hospital sleep clinic regulations"], answer: "the rise of the sleep-tracking wellness economy" },
          { kr: "", question: "What do sleep-tracking devices measure?", options: ["tossing, heart rate, and breathing patterns", "blood sugar and cholesterol levels", "eye movement and blinking only", "room temperature and humidity"], answer: "tossing, heart rate, and breathing patterns" },
          { kr: "", question: "How do many chronically sleep-deprived users benefit?", options: ["they use objective data as motivation to improve habits", "they receive free medical treatment", "they no longer need to sleep as much", "they get discounts on mattresses"], answer: "they use objective data as motivation to improve habits" },
          { kr: "", question: "What warning do some experts give?", options: ["obsessing over sleep scores can increase anxiety about sleep", "the devices cause physical harm to the wrist", "the devices are always inaccurate", "the devices are too expensive for average consumers"], answer: "obsessing over sleep scores can increase anxiety about sleep" },
          { kr: "", question: "What paradoxical situation is described?", options: ["worrying about a low score makes it harder to actually fall asleep", "better scores lead to worse health outcomes", "the devices improve sleep but ruin daytime focus", "users sleep too much after using the devices"], answer: "worrying about a low score makes it harder to actually fall asleep" },
          { kr: "", question: "What is suggested as the fundamental solution to sleep problems?", options: ["reflecting on one's overall lifestyle habits", "buying a more expensive tracking device", "relying entirely on the technology's suggestions", "checking the sleep score multiple times a night"], answer: "reflecting on one's overall lifestyle habits" },
        ],
      },
      {
        passage:
          "몸을 차가운 물에 짧게 담그는 '냉수 요법'이 운동선수들의 회복 방법을 넘어 일반인들 사이에서도 건강 관리법으로 각광받고 있다. 지지자들은 이 방법이 스트레스를 줄이고 혈액 순환을 촉진하며, 심지어 기분을 개선하는 효과까지 있다고 주장한다. 소셜 미디어에는 야외에서 얼음물이 담긴 통에 몸을 담그는 영상이 자주 공유되며 이러한 흐름을 더욱 확산시키고 있다. 그러나 의료 전문가들은 아직 이 요법의 효과를 뒷받침하는 과학적 근거가 충분하지 않다고 지적하며, 심장 질환이 있는 사람에게는 오히려 위험할 수 있다고 경고한다. 결국 전문가들은 검증되지 않은 건강 유행을 무비판적으로 따르기보다, 개인의 건강 상태를 먼저 고려해야 한다고 조언한다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["the rising popularity of cold plunge therapy", "a new type of swimming pool design", "winter sports injury prevention", "the invention of ice-making machines"], answer: "the rising popularity of cold plunge therapy" },
          { kr: "", question: "What benefits do supporters claim?", options: ["reduced stress and improved circulation and mood", "permanent weight loss", "cured chronic diseases", "increased height"], answer: "reduced stress and improved circulation and mood" },
          { kr: "", question: "How has social media contributed to this trend?", options: ["videos of people plunging into ice water are widely shared", "influencers have banned the practice", "it has only been discussed in medical journals", "it has been used mainly in advertising"], answer: "videos of people plunging into ice water are widely shared" },
          { kr: "", question: "What do medical experts say about the evidence for this therapy?", options: ["it is not yet sufficiently backed by science", "it is completely proven and safe", "it has been tested for over a century", "it is endorsed by all hospitals"], answer: "it is not yet sufficiently backed by science" },
          { kr: "", question: "Who is warned to be especially cautious?", options: ["people with heart conditions", "people who exercise daily", "people who live in cold climates", "people under the age of twenty"], answer: "people with heart conditions" },
          { kr: "", question: "What do experts ultimately advise?", options: ["considering one's own health condition before following unverified trends", "following every new health trend immediately", "avoiding all forms of exercise", "relying only on social media for health advice"], answer: "considering one's own health condition before following unverified trends" },
        ],
      },

      {
        passage:
          "최근 1인 가구가 늘면서 '코리빙(co-living)'이라 불리는 공유형 주거 형태가 주목받고 있다. 침실은 개인 공간으로 두되 주방과 거실, 세탁실 등은 여러 입주자가 함께 쓰는 방식이다. 운영 업체들은 개인 원룸보다 임대료 부담이 적고, 낯선 도시에 이주한 사람들이 자연스럽게 인맥을 형성할 수 있다는 점을 장점으로 내세운다. 그러나 생활 습관이 다른 사람들과 공용 공간을 나눠 쓰는 데서 오는 갈등도 적지 않다. 소음이나 청소 문제로 다툼이 벌어지는 사례가 보고되면서, 일부 업체는 입주 전 생활 방식에 대한 사전 조율을 의무화하고 있다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["the rise of co-living arrangements", "the decline of one-person households", "government housing subsidies", "the history of shared dormitories"], answer: "the rise of co-living arrangements" },
          { kr: "", question: "What do co-living operators cite as an advantage?", options: ["lower rent and easier networking for newcomers", "larger private bedrooms", "free furniture for all residents", "guaranteed lifetime leases"], answer: "lower rent and easier networking for newcomers" },
          { kr: "", question: "What is shared among residents?", options: ["kitchen, living room, and laundry room", "only the laundry room", "nothing; everything is private", "only the bedroom"], answer: "kitchen, living room, and laundry room" },
          { kr: "", question: "What problem is mentioned?", options: ["conflicts over noise and cleaning", "extremely high rent", "a shortage of applicants", "frequent building fires"], answer: "conflicts over noise and cleaning" },
          { kr: "", question: "What have some operators started requiring?", options: ["prior coordination on lifestyle habits before move-in", "a minimum one-year contract", "background checks by police", "monthly rent increases"], answer: "prior coordination on lifestyle habits before move-in" },
          { kr: "", question: "The word '입주자' refers to…", options: ["a resident/tenant", "a landlord", "a building inspector", "a real estate agent"], answer: "a resident/tenant" },
        ],
      },
      {
        passage:
          "집값 부담이 커지면서 최소한의 면적으로 설계된 '초소형 주택'이 새로운 대안으로 떠오르고 있다. 전용 면적이 십 평 남짓에 불과하지만 다락이나 접이식 가구를 활용해 공간 효율을 극대화한 것이 특징이다. 젊은 1인 가구를 중심으로 수요가 늘면서 건설사들도 관련 상품을 잇달아 내놓고 있다. 다만 좁은 공간에서 오래 생활할 경우 답답함을 호소하는 입주자도 있어, 초소형 주택이 장기 거주보다는 사회 초년생의 과도기적 선택지에 가깝다는 분석도 나온다. 전문가들은 면적뿐 아니라 채광과 환기 같은 거주 환경의 질도 함께 고려해야 한다고 조언한다.",
        questions: [
          { kr: "", question: "What is a 'micro-house' as described here?", options: ["a very small home designed for space efficiency", "a house built entirely underground", "a temporary tent structure", "a luxury vacation home"], answer: "a very small home designed for space efficiency" },
          { kr: "", question: "What features maximize space efficiency?", options: ["lofts and foldable furniture", "extra bedrooms", "underground parking", "rooftop gardens only"], answer: "lofts and foldable furniture" },
          { kr: "", question: "Who is driving demand for micro-houses?", options: ["young one-person households", "large families", "retired couples", "corporate landlords"], answer: "young one-person households" },
          { kr: "", question: "What complaint do some residents have?", options: ["feeling cramped after living there a long time", "excessive noise from neighbors", "high monthly management fees", "lack of internet access"], answer: "feeling cramped after living there a long time" },
          { kr: "", question: "How are micro-houses characterized by some analysts?", options: ["a transitional option for early-career adults, not long-term housing", "the best permanent housing solution", "only suitable for retirees", "illegal in most cities"], answer: "a transitional option for early-career adults, not long-term housing" },
          { kr: "", question: "What do experts say should also be considered?", options: ["lighting and ventilation quality", "only the purchase price", "the building's paint color", "the number of parking spots"], answer: "lighting and ventilation quality" },
        ],
      },
      {
        passage:
          "성인이 된 이후에도 새로운 기술이나 지식을 배우는 '평생 학습'에 대한 관심이 높아지고 있다. 산업 구조가 빠르게 바뀌면서 한 번 취득한 자격이나 기술만으로는 경력을 이어가기 어려워졌기 때문이다. 온라인 강의 플랫폼과 직업 재교육 프로그램이 확산되면서 배움의 문턱은 낮아졌지만, 시간과 비용을 감당할 수 있는 사람과 그렇지 못한 사람 사이의 격차는 오히려 커지고 있다는 지적도 나온다. 특히 생계를 위해 여러 일을 병행하는 저소득층은 재교육에 투자할 여유가 상대적으로 부족하다. 전문가들은 평생 학습이 개인의 선택을 넘어 사회 정책 차원에서 지원되어야 한다고 강조한다.",
        questions: [
          { kr: "", question: "What is driving interest in lifelong learning?", options: ["rapidly changing industry structures making old skills insufficient", "a shortage of universities", "declining literacy rates", "mandatory government exams"], answer: "rapidly changing industry structures making old skills insufficient" },
          { kr: "", question: "What has lowered the barrier to learning?", options: ["online courses and job retraining programs", "free public libraries only", "shorter work weeks", "mandatory night classes"], answer: "online courses and job retraining programs" },
          { kr: "", question: "What gap is said to be widening?", options: ["the gap between those who can afford time and money for learning and those who cannot", "the gap between young and old learners only", "the gap in internet speed", "the gap between men and women"], answer: "the gap between those who can afford time and money for learning and those who cannot" },
          { kr: "", question: "Who is described as having less room to invest in retraining?", options: ["low-income people working multiple jobs", "corporate executives", "full-time university students", "retired teachers"], answer: "low-income people working multiple jobs" },
          { kr: "", question: "What do experts emphasize?", options: ["lifelong learning needs social policy support, not just individual effort", "lifelong learning should be banned for adults over 50", "only private companies should fund it", "it should remain entirely optional"], answer: "lifelong learning needs social policy support, not just individual effort" },
          { kr: "", question: "The phrase '문턱이 낮아지다' means…", options: ["a barrier becomes easier to overcome", "a barrier becomes stricter", "a price increases", "a deadline is extended"], answer: "a barrier becomes easier to overcome" },
        ],
      },
      {
        passage:
          "수능 중심의 대입 제도를 개편해야 한다는 논의가 오랫동안 이어지고 있다. 찬성 측은 단 한 번의 시험으로 학생의 실력을 평가하는 방식이 지나치게 경직되어 있으며, 학생들의 다양한 재능과 성장 과정을 반영하지 못한다고 주장한다. 반면 반대 측은 수능이 그나마 가장 객관적이고 공정한 평가 방식이며, 학생부 종합 전형처럼 정성 평가 비중이 높은 제도는 부모의 경제력이나 정보력에 따라 유불리가 갈릴 수 있다고 우려한다. 실제로 두 방식 모두 나름의 부작용을 낳으면서, 어느 한쪽으로 완전히 기울기보다는 여러 전형을 병행하며 보완해 나가야 한다는 의견이 힘을 얻고 있다.",
        questions: [
          { kr: "", question: "What is the passage debating?", options: ["reforming the university entrance exam system", "banning private tutoring", "closing rural schools", "raising teacher salaries"], answer: "reforming the university entrance exam system" },
          { kr: "", question: "What do supporters of reform argue?", options: ["a single exam is too rigid and misses students' diverse talents", "the exam should be made harder", "the exam should be abolished with no replacement", "more exams should be added"], answer: "a single exam is too rigid and misses students' diverse talents" },
          { kr: "", question: "What concern do opponents of reform raise?", options: ["holistic evaluations may favor students with wealthier or better-informed parents", "the exam is too easy", "holistic evaluations take too long to grade", "the exam should be given twice a year"], answer: "holistic evaluations may favor students with wealthier or better-informed parents" },
          { kr: "", question: "What is said about the current exam-centered system?", options: ["it is seen as the most objective and fair method available", "it has no critics at all", "it was recently abolished", "it only tests one subject"], answer: "it is seen as the most objective and fair method available" },
          { kr: "", question: "What view is gaining support?", options: ["combining and supplementing multiple admission methods rather than favoring one entirely", "returning to an exam-only system permanently", "abolishing university admissions exams", "letting only private schools decide"], answer: "combining and supplementing multiple admission methods rather than favoring one entirely" },
          { kr: "", question: "The word '경직되다' is closest to…", options: ["to become rigid/inflexible", "to become flexible", "to become popular", "to become cheaper"], answer: "to become rigid/inflexible" },
        ],
      },
      {
        passage:
          "생산지에서 소비자까지의 유통 단계를 최소화한 '파머스 마켓'과 지역 농산물 직거래가 도시 곳곳에서 확산되고 있다. 소비자는 신선한 농산물을 상대적으로 저렴하게 구매할 수 있고, 농가는 중간 유통 마진 없이 정당한 가격을 받을 수 있다는 점에서 서로에게 이득이라는 평가다. 이러한 흐름에 발맞춰 일부 식당은 메뉴판에 식재료의 원산지 농가를 구체적으로 표기하며 신뢰를 강조하기도 한다. 다만 직거래 방식은 대형 유통망만큼 안정적인 물량 공급이 어려워 가격 변동이 크고, 소비자가 원하는 시기에 원하는 품목을 구하기 어렵다는 한계도 지적된다.",
        questions: [
          { kr: "", question: "What trend does the passage describe?", options: ["farmers markets and direct farm-to-consumer sales", "the rise of large supermarket chains", "government food subsidies", "the decline of restaurants"], answer: "farmers markets and direct farm-to-consumer sales" },
          { kr: "", question: "Why is this trend seen as mutually beneficial?", options: ["consumers get fresh produce cheaply and farmers get fair prices without middlemen", "farmers get free advertising", "consumers get free delivery", "restaurants get tax breaks"], answer: "consumers get fresh produce cheaply and farmers get fair prices without middlemen" },
          { kr: "", question: "What do some restaurants do to build trust?", options: ["list the specific farm of origin for ingredients on the menu", "offer free samples to every customer", "hire farmers as chefs", "print nutrition labels only"], answer: "list the specific farm of origin for ingredients on the menu" },
          { kr: "", question: "What limitation does direct trade have?", options: ["unstable supply leading to large price swings", "it is more expensive than supermarkets always", "it requires a government license", "it only works in rural areas"], answer: "unstable supply leading to large price swings" },
          { kr: "", question: "What can be difficult for consumers under this system?", options: ["getting the item they want at the time they want it", "finding any farmers market at all", "paying with a credit card", "reading the menu"], answer: "getting the item they want at the time they want it" },
          { kr: "", question: "The word '원산지' means…", options: ["place of origin", "expiration date", "selling price", "recipe"], answer: "place of origin" },
        ],
      },
      {
        passage:
          "손질된 재료와 양념을 세트로 배송해 집에서 간편하게 요리할 수 있는 '밀키트' 시장이 빠르게 성장하고 있다. 요리에 서툰 사람도 레시피를 그대로 따라 하면 그럴듯한 한 끼를 완성할 수 있다는 점이 인기 요인으로 꼽힌다. 외식보다 저렴하면서도 즉석식품보다는 건강한 느낌을 준다는 인식도 시장 확대에 한몫하고 있다. 그러나 일회용 포장재 사용이 많아 환경 부담이 크다는 비판이 꾸준히 제기된다. 일부 업체는 포장재를 재활용 소재로 바꾸거나 용기를 회수해 재사용하는 방안을 시도하고 있지만, 아직 업계 전반으로 확산되지는 못한 상태다.",
        questions: [
          { kr: "", question: "What is the passage about?", options: ["the growth of the meal-kit market", "traditional Korean cooking methods", "restaurant delivery apps", "the decline of home cooking"], answer: "the growth of the meal-kit market" },
          { kr: "", question: "Why are meal kits popular?", options: ["even inexperienced cooks can follow the recipe to make a decent meal", "they are the cheapest food option available", "they require no cooking at all", "they are only sold in restaurants"], answer: "even inexperienced cooks can follow the recipe to make a decent meal" },
          { kr: "", question: "How are meal kits perceived compared to instant food?", options: ["healthier-feeling", "less healthy", "more expensive than dining out", "identical in taste"], answer: "healthier-feeling" },
          { kr: "", question: "What criticism does the industry face?", options: ["heavy use of disposable packaging harms the environment", "the food often spoils before delivery", "prices are too low to sustain farmers", "recipes are too complicated"], answer: "heavy use of disposable packaging harms the environment" },
          { kr: "", question: "What are some companies trying?", options: ["recyclable packaging and container return-and-reuse programs", "removing recipes from the box", "doubling portion sizes", "switching entirely to frozen food"], answer: "recyclable packaging and container return-and-reuse programs" },
          { kr: "", question: "What is the current status of these eco-friendly efforts?", options: ["not yet widespread across the industry", "adopted by every company", "banned by regulators", "more expensive than expected for consumers"], answer: "not yet widespread across the industry" },
        ],
      },
      {
        passage:
          "대형 마트와 온라인 쇼핑에 밀려 쇠퇴하던 전통 시장이 최근 젊은 세대의 발길을 다시 끌고 있다. 오래된 상점가에 개성 있는 카페와 소품점이 들어서면서 이색적인 분위기를 찾는 사람들이 모이기 시작한 것이다. 상인회는 이런 흐름을 살리기 위해 야시장을 열거나 결제 방식을 간편화하는 등 변화를 시도하고 있다. 그러나 정작 시장의 본래 기능인 신선 식품 판매는 여전히 어려움을 겪고 있어, 겉모습만 바뀌었을 뿐 근본적인 경쟁력은 회복되지 못했다는 지적도 나온다. 전통 시장이 관광 명소로만 소비되고 생활 상권으로서의 기능을 잃는다면 오히려 지역 주민에게는 불편이 될 수 있다는 우려도 있다.",
        questions: [
          { kr: "", question: "What is the passage about?", options: ["the revival of traditional markets among young people", "the closure of department stores", "new supermarket regulations", "online grocery delivery"], answer: "the revival of traditional markets among young people" },
          { kr: "", question: "What is attracting young people to old markets?", options: ["unique cafes and shops giving them an exotic atmosphere", "lower prices than supermarkets", "free parking", "government subsidies for shoppers"], answer: "unique cafes and shops giving them an exotic atmosphere" },
          { kr: "", question: "What have merchant associations done?", options: ["opened night markets and simplified payment methods", "banned online shopping in the area", "raised rents for all shops", "closed the market on weekends"], answer: "opened night markets and simplified payment methods" },
          { kr: "", question: "What problem persists according to the passage?", options: ["fresh food sales, the market's core function, still struggle", "there are too many customers to handle", "rent has become too cheap", "vendors refuse to accept cash"], answer: "fresh food sales, the market's core function, still struggle" },
          { kr: "", question: "What concern is raised about the market becoming a tourist spot?", options: ["it could lose its function as a practical shopping area for residents", "tourists will damage the buildings", "prices will fall too low", "the market will close entirely"], answer: "it could lose its function as a practical shopping area for residents" },
          { kr: "", question: "The phrase '발길을 끌다' means…", options: ["to attract people/visitors", "to block a road", "to raise prices", "to close a business"], answer: "to attract people/visitors" },
        ],
      },
      {
        passage:
          "일부 지방자치단체가 인구 밀도가 낮은 노선에 자율주행 버스를 시범 운행하고 있다. 배차 간격이 길고 수익성이 낮아 민간 버스 회사들이 꺼리는 구간에 무인 운행 기술을 도입해 교통 공백을 메우려는 시도다. 초기 실험에서는 낮은 속도로 정해진 구간만 운행하며 안전성을 검증하는 데 초점을 맞추고 있다. 주민들은 대체로 이동 편의성이 개선된 것을 반기지만, 돌발 상황에 대한 대응 능력에는 여전히 의문을 제기한다. 관련 법규와 보험 제도가 아직 정비되지 않아 사고 발생 시 책임 소재를 둘러싼 논란도 예상된다.",
        questions: [
          { kr: "", question: "What is being tested according to the passage?", options: ["self-driving buses on low-density routes", "high-speed rail expansion", "electric taxis in the city center", "a new subway line"], answer: "self-driving buses on low-density routes" },
          { kr: "", question: "Why were these routes chosen?", options: ["private bus companies avoid them due to low profitability", "they have the heaviest traffic", "they connect major airports", "they require the least funding"], answer: "private bus companies avoid them due to low profitability" },
          { kr: "", question: "What is the focus of the initial trials?", options: ["verifying safety at low speed on fixed routes", "maximizing passenger capacity", "reducing ticket prices", "testing new bus designs"], answer: "verifying safety at low speed on fixed routes" },
          { kr: "", question: "What do residents generally think?", options: ["they welcome improved mobility but doubt emergency response ability", "they oppose the buses entirely", "they think the buses are too expensive", "they want the buses removed immediately"], answer: "they welcome improved mobility but doubt emergency response ability" },
          { kr: "", question: "What legal issue is expected?", options: ["disputes over liability in accidents due to unfinished regulations", "disputes over bus color schemes", "disputes over driver salaries", "disputes over route naming"], answer: "disputes over liability in accidents due to unfinished regulations" },
          { kr: "", question: "The word '배차 간격' refers to…", options: ["the interval between bus departures", "the width of a road", "the price of a ticket", "the number of bus stops"], answer: "the interval between bus departures" },
        ],
      },
      {
        passage:
          "짧은 거리를 이동할 때 자동차 대신 공유 자전거를 이용하는 사람들이 늘고 있다. 지방자치단체가 도심 곳곳에 대여소를 설치하면서 접근성이 좋아졌고, 스마트폰 앱으로 간편하게 대여와 반납이 가능해진 점도 이용자 증가에 기여했다. 자동차 정체를 피할 수 있고 운동 효과까지 얻을 수 있다는 점에서 만족도가 높은 편이다. 그러나 아무 곳에나 자전거를 세워 두는 이용자들 때문에 보행로가 막히거나 주차 질서가 흐트러지는 문제도 발생하고 있다. 일부 도시는 지정된 거치대 밖에 반납하면 추가 요금을 부과하는 방식으로 문제를 해결하려 하고 있다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["the rise of bike-sharing programs", "the decline of car ownership", "new highway construction", "electric scooter accidents"], answer: "the rise of bike-sharing programs" },
          { kr: "", question: "What contributed to the increase in usage?", options: ["more rental stations and easy app-based rental/return", "free bicycles given to every citizen", "mandatory helmet laws", "reduced subway service"], answer: "more rental stations and easy app-based rental/return" },
          { kr: "", question: "What benefits do users report?", options: ["avoiding traffic and getting exercise", "earning money for each ride", "unlimited free rides", "guaranteed parking spots"], answer: "avoiding traffic and getting exercise" },
          { kr: "", question: "What problem is mentioned?", options: ["bikes left anywhere block sidewalks and disrupt order", "bikes frequently break down", "rental fees are too high", "there are not enough bikes for demand"], answer: "bikes left anywhere block sidewalks and disrupt order" },
          { kr: "", question: "How are some cities addressing this problem?", options: ["charging extra fees for returns outside designated racks", "banning bike-sharing entirely", "requiring a license to ride", "limiting rides to weekends only"], answer: "charging extra fees for returns outside designated racks" },
          { kr: "", question: "The word '거치대' means…", options: ["a docking/parking rack", "a traffic light", "a repair shop", "a subway entrance"], answer: "a docking/parking rack" },
        ],
      },
      {
        passage:
          "일회용 플라스틱 사용을 줄이기 위해 포장재를 아예 없애거나 최소화한 '제로웨이스트' 매장이 늘고 있다. 소비자는 세제나 곡물 같은 제품을 원하는 만큼만 개인 용기에 담아 구매할 수 있다. 초기에는 번거롭다는 반응도 있었지만, 환경 문제에 관심이 큰 소비자를 중심으로 꾸준히 자리를 잡아가고 있다. 다만 이런 매장은 대량 유통 구조를 갖춘 대형 마트에 비해 상품 가격이 높고 접근성이 떨어진다는 한계가 있다. 전문가들은 제로웨이스트가 소수의 선택이 아니라 보편적인 소비 방식이 되려면 가격 경쟁력을 갖춘 유통망 확대가 필요하다고 말한다.",
        questions: [
          { kr: "", question: "What is a 'zero-waste' store as described?", options: ["a store that eliminates or minimizes packaging", "a store that only sells recycled electronics", "a store with no cashiers", "a store that only operates online"], answer: "a store that eliminates or minimizes packaging" },
          { kr: "", question: "How do customers shop at these stores?", options: ["they bring their own containers and buy only the amount they need", "they must buy in bulk quantities", "they pay a flat monthly fee", "they cannot choose product amounts"], answer: "they bring their own containers and buy only the amount they need" },
          { kr: "", question: "Who mainly supports this trend?", options: ["consumers with strong environmental concern", "large corporations", "government agencies only", "tourists"], answer: "consumers with strong environmental concern" },
          { kr: "", question: "What limitation do zero-waste stores have?", options: ["higher prices and lower accessibility than large marts", "they sell only expired products", "they require a membership fee", "they are illegal in most cities"], answer: "higher prices and lower accessibility than large marts" },
          { kr: "", question: "What do experts say is needed for wider adoption?", options: ["a price-competitive distribution network", "banning plastic entirely by law", "government-run stores only", "higher taxes on regular supermarkets"], answer: "a price-competitive distribution network" },
          { kr: "", question: "The word '번거롭다' is closest to…", options: ["troublesome/inconvenient", "exciting", "affordable", "delicious"], answer: "troublesome/inconvenient" },
        ],
      },
      {
        passage:
          "도시 열섬 현상을 완화하기 위해 옥상과 벽면에 식물을 심는 '도시 녹화' 사업이 여러 지역에서 추진되고 있다. 콘크리트와 아스팔트로 뒤덮인 도심은 여름철 기온이 주변 지역보다 크게 높아지는데, 식물이 그늘을 만들고 수분을 증발시켜 온도를 낮추는 효과가 있다는 것이다. 실제로 녹화 사업을 시행한 건물 주변은 기온이 눈에 띄게 낮아졌다는 조사 결과도 있다. 그러나 초기 조성 비용과 이후 관리 인력 확보가 부담이라는 지적이 많다. 특히 예산이 부족한 지자체는 사업을 시작하고도 관리 소홀로 식물이 말라 죽는 경우가 적지 않아, 지속 가능한 운영 방안 마련이 과제로 남아 있다.",
        questions: [
          { kr: "", question: "What is 'urban greening' meant to address?", options: ["the urban heat island effect", "air traffic congestion", "housing shortages", "noise pollution"], answer: "the urban heat island effect" },
          { kr: "", question: "How do plants help lower temperature?", options: ["by creating shade and evaporating moisture", "by absorbing sunlight completely", "by blocking wind", "by reflecting heat upward"], answer: "by creating shade and evaporating moisture" },
          { kr: "", question: "What did surveys find near greened buildings?", options: ["temperatures were noticeably lower", "temperatures rose slightly", "no measurable change occurred", "humidity dropped sharply"], answer: "temperatures were noticeably lower" },
          { kr: "", question: "What is cited as a burden of these projects?", options: ["initial costs and ongoing maintenance staffing", "a shortage of plant species", "opposition from residents", "conflicts with building codes"], answer: "initial costs and ongoing maintenance staffing" },
          { kr: "", question: "What problem do budget-strapped local governments face?", options: ["plants dying from poor upkeep after projects start", "being unable to find any plants to buy", "residents refusing to allow greening", "the government banning rooftop gardens"], answer: "plants dying from poor upkeep after projects start" },
          { kr: "", question: "What remains a task for the future?", options: ["establishing a sustainable operation plan", "increasing the height of buildings", "removing all concrete from cities", "banning air conditioning"], answer: "establishing a sustainable operation plan" },
        ],
      },
      {
        passage:
          "탄소 중립 목표를 달성하기 위해 재생 에너지로의 전환이 세계 각국의 주요 과제로 떠올랐다. 태양광과 풍력 발전 단가가 꾸준히 낮아지면서 경제성 측면에서도 화석 연료와의 격차가 줄어들고 있다. 하지만 재생 에너지는 날씨에 따라 발전량이 크게 달라지는 간헐성 문제를 안고 있어, 안정적인 전력 공급을 위해서는 대규모 에너지 저장 장치가 함께 갖춰져야 한다. 또한 발전 시설을 새로 지으려는 지역 주민들의 반대에 부딪히는 경우도 많아, 기술적 과제 못지않게 사회적 합의를 끌어내는 일이 중요한 변수로 꼽힌다. 전문가들은 전환 속도보다 전환 과정에서의 형평성 확보가 장기적 성공의 열쇠라고 강조한다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["the transition to renewable energy for carbon neutrality", "the history of fossil fuel discovery", "electric vehicle battery technology", "nuclear power plant safety"], answer: "the transition to renewable energy for carbon neutrality" },
          { kr: "", question: "What trend is narrowing the cost gap with fossil fuels?", options: ["falling costs of solar and wind power generation", "rising oil prices only", "government bans on coal", "new tax breaks for oil companies"], answer: "falling costs of solar and wind power generation" },
          { kr: "", question: "What problem does renewable energy face?", options: ["intermittency depending on weather conditions", "it produces more pollution than coal", "it cannot be transported at all", "it requires no storage technology"], answer: "intermittency depending on weather conditions" },
          { kr: "", question: "What is needed to ensure stable power supply?", options: ["large-scale energy storage systems", "more coal power plants", "higher electricity prices", "smaller transmission grids"], answer: "large-scale energy storage systems" },
          { kr: "", question: "What social obstacle is mentioned?", options: ["local residents opposing new facility construction", "a lack of engineers", "opposition from environmental groups", "international trade disputes"], answer: "local residents opposing new facility construction" },
          { kr: "", question: "What do experts say is the key to long-term success?", options: ["ensuring fairness in the transition process, not just speed", "transitioning as fast as technically possible", "relying entirely on private companies", "avoiding public discussion"], answer: "ensuring fairness in the transition process, not just speed" },
        ],
      },
      {
        passage:
          "온라인 동영상 서비스(OTT)의 성장으로 영화관을 찾는 관객 수가 눈에 띄게 줄었다. 신작 영화가 극장 개봉과 거의 동시에 스트리밍으로 공개되는 경우가 늘면서, 굳이 극장에 가지 않아도 최신작을 볼 수 있게 된 것이 주요 원인으로 꼽힌다. 이에 극장 업계는 대형 스크린과 입체 음향 등 집에서는 누릴 수 없는 경험을 강조하며 관객을 붙잡으려 하지만, 높아진 관람료가 오히려 발길을 돌리게 한다는 지적도 있다. 한편 스트리밍 플랫폼의 급성장으로 다양한 국가의 작품이 쉽게 소개되면서 관객의 선택권이 넓어졌다는 긍정적 평가도 함께 나오고 있다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["how streaming services are changing moviegoing habits", "the invention of the movie theater", "government film censorship", "the salaries of movie actors"], answer: "how streaming services are changing moviegoing habits" },
          { kr: "", question: "Why has theater attendance declined?", options: ["new films often stream almost simultaneously with theatrical release", "theaters have closed permanently everywhere", "ticket sales are banned online", "movies are no longer being produced"], answer: "new films often stream almost simultaneously with theatrical release" },
          { kr: "", question: "How is the theater industry trying to retain audiences?", options: ["emphasizing big screens and immersive sound unavailable at home", "lowering ticket prices sharply", "banning streaming services", "showing only old films"], answer: "emphasizing big screens and immersive sound unavailable at home" },
          { kr: "", question: "What criticism is raised about theaters?", options: ["higher ticket prices are turning audiences away", "theaters are too far from residential areas", "theaters show too many foreign films", "theaters lack comfortable seating"], answer: "higher ticket prices are turning audiences away" },
          { kr: "", question: "What positive effect of streaming is mentioned?", options: ["wider audience choice through films from various countries", "cheaper movie production costs", "fewer film festivals needed", "shorter film run times"], answer: "wider audience choice through films from various countries" },
          { kr: "", question: "The word '개봉' refers to…", options: ["a film's release", "a film's rating", "a film's budget", "a film's director"], answer: "a film's release" },
        ],
      },
      {
        passage:
          "스마트폰으로 손쉽게 볼 수 있는 웹툰 산업이 국내를 넘어 해외 시장까지 빠르게 확대되고 있다. 세로 스크롤에 최적화된 형식과 컬러 삽화는 기존 출판 만화와 차별화된 읽는 경험을 제공하며 젊은 독자층을 끌어들였다. 인기 웹툰이 드라마나 영화로 제작되면서 원작의 흥행이 다른 콘텐츠 산업의 수익으로까지 이어지는 구조도 자리 잡았다. 그러나 신인 작가들의 원고료와 노동 환경이 여전히 열악하다는 지적이 꾸준히 제기되고 있으며, 마감에 쫓기는 연재 방식이 작가들의 건강을 해친다는 우려도 크다. 산업 규모에 걸맞은 창작자 보호 제도 마련이 시급하다는 목소리가 커지고 있다.",
        questions: [
          { kr: "", question: "What is the passage about?", options: ["the growth of the webtoon industry and its challenges", "the history of print comic books", "smartphone hardware development", "TV drama ratings"], answer: "the growth of the webtoon industry and its challenges" },
          { kr: "", question: "What distinguishes webtoons from traditional print comics?", options: ["vertical-scroll format and color illustrations", "black-and-white printing only", "physical book distribution", "weekly newspaper serialization"], answer: "vertical-scroll format and color illustrations" },
          { kr: "", question: "How do popular webtoons benefit other industries?", options: ["they get adapted into dramas or films, generating further revenue", "they replace all television programming", "they are banned from adaptation", "they only succeed within the webtoon platform"], answer: "they get adapted into dramas or films, generating further revenue" },
          { kr: "", question: "What problem do new webtoon artists face?", options: ["low pay and poor working conditions", "a lack of available platforms", "excessive government regulation", "no reader interest"], answer: "low pay and poor working conditions" },
          { kr: "", question: "What health concern is raised?", options: ["deadline pressure harming artists' health", "eye strain from color screens", "obesity from sedentary work", "hearing loss from headphones"], answer: "deadline pressure harming artists' health" },
          { kr: "", question: "What is urgently called for?", options: ["a creator protection system matching the industry's scale", "banning webtoon adaptations", "reducing the number of webtoon platforms", "shortening all webtoons"], answer: "a creator protection system matching the industry's scale" },
        ],
      },
      {
        passage:
          "인공지능 기술로 실제와 구분하기 어려운 가짜 영상을 만드는 '딥페이크'가 사회적 문제로 떠오르고 있다. 초기에는 오락 목적의 합성 영상이 대부분이었지만, 최근에는 유명인의 얼굴을 도용한 사기나 허위 정보 유포에 악용되는 사례가 늘고 있다. 기술이 정교해질수록 진위를 육안으로 가려내기가 점점 더 어려워지면서, 이를 탐지하는 별도의 프로그램 개발도 활발해지고 있다. 그러나 탐지 기술과 생성 기술이 서로 발전을 거듭하는 이른바 '기술 경쟁' 구도가 계속되고 있어 근본적인 해결책이 되기는 어렵다는 시각도 있다. 결국 법적 규제와 함께 대중의 미디어 문해력을 높이는 교육이 병행되어야 한다는 지적이 나온다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["the rise of deepfake technology as a social problem", "the invention of digital cameras", "copyright law for celebrities", "video game addiction"], answer: "the rise of deepfake technology as a social problem" },
          { kr: "", question: "How has deepfake misuse changed over time?", options: ["from entertainment purposes to fraud and disinformation", "from fraud to purely artistic uses", "it has decreased steadily since it began", "it is now used only in filmmaking"], answer: "from entertainment purposes to fraud and disinformation" },
          { kr: "", question: "What makes deepfakes harder to identify?", options: ["increasingly sophisticated technology", "lower video quality", "shorter video lengths", "fewer people using smartphones"], answer: "increasingly sophisticated technology" },
          { kr: "", question: "What is being developed in response?", options: ["separate programs to detect deepfakes", "new laws banning all video editing", "cameras that cannot be hacked", "a ban on facial recognition"], answer: "separate programs to detect deepfakes" },
          { kr: "", question: "Why is a fundamental solution seen as difficult?", options: ["detection and generation technologies keep advancing in competition with each other", "no one is working on detection technology", "deepfakes are impossible to create anymore", "laws already fully solve the problem"], answer: "detection and generation technologies keep advancing in competition with each other" },
          { kr: "", question: "What combined approach is suggested?", options: ["legal regulation together with media literacy education", "banning all AI research", "relying solely on detection software", "ignoring the problem as unsolvable"], answer: "legal regulation together with media literacy education" },
        ],
      },
      {
        passage:
          "전세 제도는 목돈을 맡기고 매달 임대료 없이 거주할 수 있어 오랫동안 한국 특유의 주거 방식으로 자리 잡아 왔다. 그러나 최근 집값 하락기에 전세금을 돌려받지 못하는 이른바 '깡통 전세' 피해가 잇따르면서 제도의 지속 가능성에 의문이 제기되고 있다. 집주인이 세입자의 보증금으로 다른 투자를 하다가 집값이 떨어지면 돌려줄 자금이 부족해지는 구조적 문제 때문이다. 정부는 보증 보험 가입을 의무화하는 등 대책을 내놓았지만, 보험료 부담이 다시 세입자에게 전가된다는 비판도 있다. 전문가들은 전세와 월세를 절충한 다양한 계약 형태를 활성화해 위험을 분산해야 한다고 제안한다.",
        questions: [
          { kr: "", question: "What is 'jeonse' as described in the passage?", options: ["a lease system with a lump-sum deposit and no monthly rent", "a government housing subsidy", "a monthly rent-only system", "a form of homeownership loan"], answer: "a lease system with a lump-sum deposit and no monthly rent" },
          { kr: "", question: "What problem has emerged recently?", options: ["tenants unable to get their deposits back when home prices fall", "landlords unable to find tenants", "a shortage of new housing", "rising interest rates on mortgages"], answer: "tenants unable to get their deposits back when home prices fall" },
          { kr: "", question: "What causes this structural problem?", options: ["landlords invest tenant deposits elsewhere and lack funds when prices drop", "tenants refuse to pay their deposits", "the government controls all housing prices", "banks stopped offering loans"], answer: "landlords invest tenant deposits elsewhere and lack funds when prices drop" },
          { kr: "", question: "What did the government require as a countermeasure?", options: ["mandatory deposit guarantee insurance", "a total ban on jeonse contracts", "free housing for all tenants", "a cap on home prices"], answer: "mandatory deposit guarantee insurance" },
          { kr: "", question: "What criticism does this countermeasure face?", options: ["insurance costs get passed on to tenants", "it only applies to landlords", "it has eliminated all risk", "it requires no government funding"], answer: "insurance costs get passed on to tenants" },
          { kr: "", question: "What do experts propose?", options: ["diversifying contract types that mix jeonse and monthly rent to spread risk", "abolishing jeonse immediately", "raising deposits even higher", "banning monthly rent contracts"], answer: "diversifying contract types that mix jeonse and monthly rent to spread risk" },
        ],
      },
      {
        passage:
          "자녀의 성적을 높이기 위한 사교육비 지출이 가계 경제에 큰 부담으로 작용하고 있다. 학원과 과외에 드는 비용이 소득의 상당 부분을 차지하면서, 자녀 수를 줄이거나 아예 출산을 미루는 이유 중 하나로 사교육비를 꼽는 부모도 적지 않다. 정부는 공교육의 질을 높여 사교육 의존도를 낮추겠다는 목표를 내세우지만, 대입 경쟁이 치열한 현실에서 효과는 제한적이라는 평가가 많다. 오히려 소득 수준에 따라 사교육 지출 격차가 벌어지면서 교육 기회의 불평등이 심화된다는 우려도 나온다. 근본적인 해결을 위해서는 대학 서열화를 완화하는 사회 전반의 변화가 함께 필요하다는 지적이다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["the financial burden of private tutoring costs on families", "the history of Korean public schools", "university tuition rates", "teacher qualification requirements"], answer: "the financial burden of private tutoring costs on families" },
          { kr: "", question: "What effect does this spending have on family planning, according to the passage?", options: ["some parents cite it as a reason to have fewer or no more children", "it has no effect on family size", "it encourages families to have more children", "it only affects retired couples"], answer: "some parents cite it as a reason to have fewer or no more children" },
          { kr: "", question: "What is the government's stated goal?", options: ["improving public education to reduce reliance on private tutoring", "banning private tutoring outright", "increasing tuition fees", "extending the school year"], answer: "improving public education to reduce reliance on private tutoring" },
          { kr: "", question: "Why is the government's effort seen as having limited effect?", options: ["fierce competition for university admission remains intense", "public schools have no teachers left", "private tutoring was already banned", "the policy was never implemented"], answer: "fierce competition for university admission remains intense" },
          { kr: "", question: "What inequality concern is raised?", options: ["gaps in private tutoring spending by income level worsen educational inequality", "only rich families can attend public school", "poor families receive extra tutoring for free", "tutoring costs are now equal for everyone"], answer: "gaps in private tutoring spending by income level worsen educational inequality" },
          { kr: "", question: "What broader change do experts say is needed?", options: ["easing the ranking hierarchy among universities", "eliminating all universities", "increasing the number of exams", "closing all private academies immediately"], answer: "easing the ranking hierarchy among universities" },
        ],
      },
      {
        passage:
          "건강과 환경에 대한 관심이 높아지면서 고기를 먹지 않거나 줄이는 식습관을 선택하는 사람들이 늘고 있다. 완전한 채식을 실천하는 사람도 있지만, 평소에는 고기를 먹되 일주일에 며칠은 채식을 하는 '유연한 채식'을 택하는 경우가 더 많다. 식품 업계도 이러한 변화에 맞춰 식물성 재료로 고기의 맛과 식감을 재현한 대체육 제품을 잇달아 출시하고 있다. 다만 대체육이 반드시 더 건강한 것은 아니라는 지적도 있다. 가공 과정에서 나트륨이나 첨가물이 많이 들어가는 경우가 있어, 단순히 '식물성'이라는 이유만으로 건강식이라 단정하기는 어렵다는 것이다.",
        questions: [
          { kr: "", question: "What trend does the passage describe?", options: ["a rise in reduced-meat and plant-based eating", "a decline in restaurant dining", "the rise of fast food chains", "increasing meat consumption"], answer: "a rise in reduced-meat and plant-based eating" },
          { kr: "", question: "What is more common than strict veganism, according to the passage?", options: ["flexible vegetarianism, eating meat but going meatless a few days a week", "eating meat every single meal", "avoiding all vegetables", "eating only seafood"], answer: "flexible vegetarianism, eating meat but going meatless a few days a week" },
          { kr: "", question: "How has the food industry responded?", options: ["releasing plant-based meat substitutes that mimic taste and texture", "banning meat products entirely", "raising meat prices sharply", "closing meat processing plants"], answer: "releasing plant-based meat substitutes that mimic taste and texture" },
          { kr: "", question: "What caution does the passage raise about meat substitutes?", options: ["they are not necessarily healthier due to added sodium and additives", "they always cost more than real meat", "they cannot be sold legally", "they contain no protein at all"], answer: "they are not necessarily healthier due to added sodium and additives" },
          { kr: "", question: "What does the passage caution against assuming?", options: ["that 'plant-based' automatically means healthy", "that vegetarianism is impossible in Korea", "that meat substitutes taste bad", "that all vegetarians avoid processed food"], answer: "that 'plant-based' automatically means healthy" },
          { kr: "", question: "The word '첨가물' means…", options: ["additives", "vitamins", "proteins", "preservative-free ingredients"], answer: "additives" },
        ],
      },
      {
        passage:
          "만성적인 도심 교통 체증을 해결하기 위해 혼잡한 시간대에 요금을 부과하는 '혼잡 통행료' 제도가 논의되고 있다. 특정 구역에 진입하는 차량에 추가 비용을 물려 자가용 이용을 줄이고 대중교통 이용을 유도하겠다는 취지다. 실제로 이 제도를 도입한 몇몇 해외 도시에서는 교통량이 눈에 띄게 줄고 대기 오염도 개선되었다는 결과가 나왔다. 그러나 저소득층 운전자에게 상대적으로 더 큰 부담이 될 수 있다는 형평성 문제가 제기되며, 대중교통 인프라가 충분히 갖춰지지 않은 지역에서는 실효성이 떨어진다는 반박도 있다. 도입에 앞서 대중교통 대안을 먼저 확충해야 한다는 목소리가 크다.",
        questions: [
          { kr: "", question: "What is 'congestion pricing' as described?", options: ["a fee charged for entering certain areas during busy hours", "a subsidy for buying electric cars", "a tax on all car sales", "a fine for illegal parking"], answer: "a fee charged for entering certain areas during busy hours" },
          { kr: "", question: "What is the goal of this policy?", options: ["reducing car use and encouraging public transit", "increasing car sales", "funding new highways only", "banning all vehicles from cities"], answer: "reducing car use and encouraging public transit" },
          { kr: "", question: "What results have some foreign cities seen?", options: ["reduced traffic volume and improved air quality", "increased traffic and worse pollution", "no measurable change at all", "a rise in car accidents"], answer: "reduced traffic volume and improved air quality" },
          { kr: "", question: "What equity concern is raised?", options: ["low-income drivers may bear a relatively heavier burden", "wealthy drivers are exempt by law", "only tourists pay the fee", "the fee applies only to trucks"], answer: "low-income drivers may bear a relatively heavier burden" },
          { kr: "", question: "Where is the policy considered less effective?", options: ["areas without sufficient public transit infrastructure", "areas with too many bike lanes", "areas with very low populations only", "areas that already ban cars"], answer: "areas without sufficient public transit infrastructure" },
          { kr: "", question: "What do many voices say should happen before implementation?", options: ["expanding public transit alternatives first", "banning private cars entirely", "raising the fee even higher", "removing all traffic lights"], answer: "expanding public transit alternatives first" },
        ],
      },
      {
        passage:
          "청취자가 원하는 시간에 원하는 주제를 골라 들을 수 있는 팟캐스트 시장이 꾸준히 성장하고 있다. 진입 장벽이 낮아 전문가부터 일반인까지 다양한 사람들이 직접 방송을 제작하면서, 기존 방송에서 다루지 않던 좁고 깊은 주제까지 다뤄지는 것이 특징이다. 광고와 후원을 통한 수익 구조가 자리 잡으면서 전업으로 팟캐스트를 제작하는 사람도 늘고 있다. 그러나 검증되지 않은 정보나 편향된 의견이 별다른 여과 없이 퍼질 수 있다는 우려도 커지고 있다. 전통 언론과 달리 별도의 심의나 정정 절차가 없는 경우가 많아, 청취자 스스로 정보를 비판적으로 판단하는 능력이 더욱 중요해지고 있다.",
        questions: [
          { kr: "", question: "What is the passage mainly about?", options: ["the growth of podcasts and related concerns", "the decline of traditional radio", "government media censorship", "streaming music services"], answer: "the growth of podcasts and related concerns" },
          { kr: "", question: "What feature is highlighted about podcast content?", options: ["it covers narrow, niche topics not found on traditional broadcasts", "it only covers breaking news", "it is limited to celebrity interviews", "it must be pre-approved by regulators"], answer: "it covers narrow, niche topics not found on traditional broadcasts" },
          { kr: "", question: "How do podcast creators typically earn income?", options: ["advertising and listener sponsorship", "government grants only", "ticket sales", "subscription boxes"], answer: "advertising and listener sponsorship" },
          { kr: "", question: "What concern is raised about podcasts?", options: ["unverified or biased information can spread without filtering", "podcasts are too expensive to produce", "podcasts require too much technical skill", "podcasts cannot reach a wide audience"], answer: "unverified or biased information can spread without filtering" },
          { kr: "", question: "How do podcasts differ from traditional media in this regard?", options: ["they often lack review or correction procedures", "they are always fact-checked twice", "they require a broadcasting license", "they are strictly limited in length"], answer: "they often lack review or correction procedures" },
          { kr: "", question: "What becomes more important as a result?", options: ["listeners' ability to critically judge information themselves", "stricter government censorship", "banning independent podcasts", "limiting podcasts to certified journalists"], answer: "listeners' ability to critically judge information themselves" },
        ],
      },
      {
        passage:
          "수도권 집중을 완화하기 위해 지방 소도시로 이주를 장려하는 정책이 여러 지자체에서 시행되고 있다. 정착 지원금이나 주택 마련 대출 우대 등 경제적 유인을 내세우며 인구 유입을 유도하는 방식이다. 실제로 자연환경과 여유로운 생활을 이유로 지방행을 선택하는 사람도 늘고 있지만, 정착 초기 이후 다시 도시로 돌아가는 이른바 '역이주' 사례도 적지 않다. 일자리와 의료, 교육 시설 등 생활 기반이 충분히 갖춰지지 않은 지역일수록 정착률이 낮게 나타난다. 전문가들은 단순한 금전적 지원을 넘어 안정적인 일자리와 생활 인프라를 함께 마련해야 이주 정책이 실질적인 효과를 거둘 수 있다고 지적한다.",
        questions: [
          { kr: "", question: "What policy does the passage describe?", options: ["encouraging migration from the capital region to small provincial cities", "banning migration to the capital region", "building new capital cities", "raising taxes on rural residents"], answer: "encouraging migration from the capital region to small provincial cities" },
          { kr: "", question: "What incentives are offered?", options: ["settlement subsidies and preferential home loans", "free cars for movers", "tax-free status for ten years", "guaranteed government jobs"], answer: "settlement subsidies and preferential home loans" },
          { kr: "", question: "What phenomenon is mentioned as common after initial settlement?", options: ["people moving back to the city, called 'reverse migration'", "permanent settlement by nearly everyone", "a total ban on returning to cities", "an increase in local birth rates"], answer: "people moving back to the city, called 'reverse migration'" },
          { kr: "", question: "What determines a lower settlement rate?", options: ["insufficient jobs, healthcare, and education infrastructure", "too much natural scenery", "high subsidy amounts", "low housing prices"], answer: "insufficient jobs, healthcare, and education infrastructure" },
          { kr: "", question: "What do experts say is needed beyond financial support?", options: ["stable jobs and adequate living infrastructure", "even larger cash subsidies", "stricter migration quotas", "banning migration to cities entirely"], answer: "stable jobs and adequate living infrastructure" },
          { kr: "", question: "The word '유인' in this context means…", options: ["an incentive/inducement", "a warning", "a penalty", "a regulation"], answer: "an incentive/inducement" },
        ],
      },
      {
        passage:
          "전기차 보급이 빠르게 늘고 있지만 충전 인프라는 이를 따라가지 못하고 있다는 지적이 계속되고 있다. 특히 아파트나 다세대 주택이 많은 도심에서는 개별 충전기를 설치할 공간과 전력 용량이 부족해 입주민 간 충전기 배정을 둘러싼 갈등이 벌어지기도 한다. 고속도로 휴게소의 급속 충전기도 명절이나 연휴에는 대기 줄이 길게 늘어서 이용자의 불만이 크다. 정부는 공용 충전소를 확충하겠다고 밝혔지만, 설치 부지 확보와 전력망 보강에 시간이 걸려 당장의 불편을 해소하기는 어려운 상황이다. 업계에서는 충전 인프라가 뒷받침되지 않으면 전기차 보급 속도 자체가 정체될 수 있다고 경고한다.",
        questions: [
          { kr: "", question: "What problem does the passage describe?", options: ["EV charging infrastructure lagging behind vehicle adoption", "a shortage of electric vehicles for sale", "high electric vehicle prices", "battery fires in electric cars"], answer: "EV charging infrastructure lagging behind vehicle adoption" },
          { kr: "", question: "Why is this problem worse in dense urban housing?", options: ["lack of space and power capacity for individual chargers causes conflicts among residents", "residents refuse to own electric cars", "urban buildings ban all vehicles", "electricity is not available in cities"], answer: "lack of space and power capacity for individual chargers causes conflicts among residents" },
          { kr: "", question: "What happens at highway rest stops during holidays?", options: ["long waiting lines form at fast chargers", "chargers are shut down entirely", "charging becomes free", "gas stations replace chargers"], answer: "long waiting lines form at fast chargers" },
          { kr: "", question: "What has the government promised?", options: ["to expand public charging stations", "to ban electric vehicles temporarily", "to subsidize gasoline cars instead", "to remove all existing chargers"], answer: "to expand public charging stations" },
          { kr: "", question: "Why is the government's plan slow to help?", options: ["securing sites and upgrading power grids takes time", "there is no funding available at all", "the plan has been cancelled", "electric vehicles are being banned"], answer: "securing sites and upgrading power grids takes time" },
          { kr: "", question: "What warning does the industry give?", options: ["EV adoption itself could stall without adequate charging infrastructure", "gasoline cars will be banned next year", "battery prices will double", "charging stations are unnecessary"], answer: "EV adoption itself could stall without adequate charging infrastructure" },
        ],
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
      { kr: "자동화가 확산되면서 숙련 노동자조차 일자리 대체 위협에서 자유롭지 않습니다.", question: "What does the spread of automation threaten?", options: ["even skilled workers with job displacement", "only unskilled workers", "management positions exclusively", "nobody, since automation creates only new jobs"], answer: "even skilled workers with job displacement" },
      { kr: "그 도시는 대중교통 확충보다 도로 확장을 우선시해 교통 정체가 오히려 심화되었습니다.", question: "What happened after the city prioritized road expansion over transit?", options: ["traffic congestion actually worsened", "traffic disappeared entirely", "public transit usage soared", "road expansion was cancelled"], answer: "traffic congestion actually worsened" },
      { kr: "역사학자들은 그 사건에 대한 공식 기록이 승자의 관점만 반영했다고 지적합니다.", question: "What do historians point out about the official record?", options: ["it reflects only the victor's perspective", "it is completely unbiased", "it was written by the losing side", "no records survived at all"], answer: "it reflects only the victor's perspective" },
      { kr: "인지 편향은 아무리 똑똑한 사람이라도 의사 결정을 왜곡할 수 있습니다.", question: "What can cognitive bias distort, even in intelligent people?", options: ["decision-making", "physical reflexes", "memory formation only", "nothing measurable"], answer: "decision-making" },
      { kr: "생물 다양성의 급격한 감소는 생태계 회복력을 약화시킨다는 경고가 나옵니다.", question: "What warning is raised about biodiversity loss?", options: ["it weakens the resilience of ecosystems", "it has no effect on ecosystems", "it only affects endangered species themselves", "it strengthens ecosystem stability"], answer: "it weakens the resilience of ecosystems" },
      { kr: "개인정보 보호와 국가 안보 사이의 균형을 어디에 둘 것인가에 대한 논쟁이 끊이지 않습니다.", question: "What is the ongoing debate about?", options: ["where to strike the balance between privacy and national security", "how to eliminate all surveillance", "whether privacy laws should be abolished", "how to fund the military"], answer: "where to strike the balance between privacy and national security" },
      { kr: "법원은 과거 판례를 뒤집으며 사회적 인식의 변화를 반영했다고 밝혔습니다.", question: "What did the court say when it overturned past precedent?", options: ["that it reflected a change in social perception", "that the previous ruling was never enforced", "that no explanation was needed", "that it was following a foreign court"], answer: "that it reflected a change in social perception" },
      { kr: "중앙은행이 금리를 인상하면 물가 상승세가 둔화될 것으로 기대됩니다.", question: "What is expected if the central bank raises interest rates?", options: ["inflation is expected to slow", "inflation will accelerate", "unemployment will vanish", "the currency will be abolished"], answer: "inflation is expected to slow" },
      { kr: "동료 심사 제도는 연구의 질을 검증하지만 때로는 혁신적인 논문을 배척하기도 합니다.", question: "What is a downside of peer review mentioned here?", options: ["it can sometimes reject innovative papers", "it guarantees every paper is correct", "it has no effect on research quality", "it was recently abolished worldwide"], answer: "it can sometimes reject innovative papers" },
      { kr: "재생 에너지로의 전환은 초기 투자 비용이 크지만 장기적으로는 경제성이 있다고 평가됩니다.", question: "How is the transition to renewable energy assessed?", options: ["costly upfront but economical in the long run", "cheap now but expensive later", "impossible with current technology", "irrelevant to the economy"], answer: "costly upfront but economical in the long run" },
      { kr: "일부 학자들은 문화적 요소의 차용과 착취를 구분하는 기준이 모호하다고 지적합니다.", question: "What do some scholars say about cultural borrowing?", options: ["the line between appropriation and exploitation is unclear", "there is no such thing as cultural exchange", "the criteria are perfectly clear", "it should always be banned"], answer: "the line between appropriation and exploitation is unclear" },
      { kr: "재택근무가 확산되면서 업무와 사생활의 경계가 오히려 흐려졌다는 불만도 제기됩니다.", question: "What complaint has arisen with the spread of remote work?", options: ["the boundary between work and personal life has blurred", "productivity has completely disappeared", "no one wants to work remotely anymore", "offices have become mandatory again"], answer: "the boundary between work and personal life has blurred" },
      { kr: "결정론과 자유의지에 관한 논쟁은 신경과학의 발전으로 새로운 국면을 맞이했습니다.", question: "What has given the determinism-versus-free-will debate a new phase?", options: ["advances in neuroscience", "the invention of the printing press", "a change in tax law", "the end of a war"], answer: "advances in neuroscience" },
      { kr: "허위 정보의 확산 속도는 사실 확인 속도를 이미 앞질렀다는 분석이 나옵니다.", question: "What does the analysis say about misinformation?", options: ["it spreads faster than fact-checking can keep up", "it spreads slower than verified news", "it no longer exists online", "fact-checkers have eliminated it"], answer: "it spreads faster than fact-checking can keep up" },
      { kr: "우주 탐사 예산 확대에 반대하는 이들은 지구의 문제부터 해결해야 한다고 주장합니다.", question: "What do opponents of expanding space exploration budgets argue?", options: ["Earth's problems should be solved first", "space exploration is too cheap", "there are no problems on Earth", "space exploration should double immediately"], answer: "Earth's problems should be solved first" },
      { kr: "도시 재개발이 진행되면서 원주민들이 치솟는 임대료를 감당하지 못해 밀려나고 있습니다.", question: "What is happening to original residents as urban redevelopment proceeds?", options: ["they are being pushed out by soaring rents", "they are receiving free housing", "rents have dropped sharply", "redevelopment has been cancelled"], answer: "they are being pushed out by soaring rents" },
      { kr: "신경가소성 연구는 성인의 뇌도 평생에 걸쳐 구조적으로 변화할 수 있음을 보여줍니다.", question: "What does neuroplasticity research show?", options: ["the adult brain can structurally change throughout life", "brain structure is fixed after childhood", "only children's brains can change", "the brain never recovers from injury"], answer: "the adult brain can structurally change throughout life" },
      { kr: "재현성 위기는 심리학과 의학 분야의 많은 연구 결과가 반복 실험에서 재현되지 않는다는 문제를 가리킵니다.", question: "What does the replication crisis refer to?", options: ["many study results fail to reproduce in repeat experiments", "researchers refuse to publish new studies", "all psychology studies are proven false", "funding for science has disappeared"], answer: "many study results fail to reproduce in repeat experiments" },
      { kr: "암흑 물질의 존재는 은하 회전 속도의 이상 현상을 통해 간접적으로 추론됩니다.", question: "How is the existence of dark matter inferred?", options: ["indirectly, through anomalies in galaxy rotation speed", "by directly photographing it", "through radio signals it emits", "by weighing individual stars"], answer: "indirectly, through anomalies in galaxy rotation speed" },
      { kr: "유전자 편집 작물이 식량 안보를 개선할 수 있다는 기대와 함께 생태계 교란에 대한 우려도 제기됩니다.", question: "What concern accompanies the hope that gene-edited crops could improve food security?", options: ["concern about ecosystem disruption", "concern about crop taste", "concern about packaging waste", "concern about crop color"], answer: "concern about ecosystem disruption" },
      { kr: "노화 방지 연구자들은 수명 연장보다 건강 수명 연장에 초점을 맞추어야 한다고 강조합니다.", question: "What do longevity researchers emphasize?", options: ["extending healthy years rather than mere lifespan", "extending lifespan at any cost", "curing all disease immediately", "reducing the population"], answer: "extending healthy years rather than mere lifespan" },
      { kr: "양자 컴퓨터는 특정 연산에서 기존 컴퓨터보다 기하급수적으로 빠를 수 있지만 오류 정정이 여전히 큰 과제입니다.", question: "What remains a major challenge for quantum computers?", options: ["error correction", "manufacturing cost only", "finding investors", "public awareness"], answer: "error correction" },
      { kr: "전염병 확산 모델은 감염률뿐 아니라 인구 이동 패턴까지 반영해야 정확도가 높아집니다.", question: "What must epidemic models reflect to improve accuracy?", options: ["population movement patterns as well as infection rates", "only hospital capacity", "only vaccination rates", "weather patterns alone"], answer: "population movement patterns as well as infection rates" },
      { kr: "외계 생명체 탐사는 물의 존재 가능성이 있는 행성을 우선적으로 조사하는 방식으로 이루어집니다.", question: "How is the search for extraterrestrial life primarily conducted?", options: ["by prioritizing planets that may have water", "by scanning random points in the sky", "by contacting radio stations", "by launching manned missions only"], answer: "by prioritizing planets that may have water" },
      { kr: "딥러닝 모델의 과적합 문제는 훈련 데이터에 지나치게 의존할 때 발생합니다.", question: "When does the overfitting problem in deep learning models occur?", options: ["when the model relies too heavily on training data", "when there is too little computing power", "when the model is too simple", "when data is deleted too often"], answer: "when the model relies too heavily on training data" },
      { kr: "그래핀은 강도와 전도성이 뛰어나 차세대 소재로 주목받지만 대량 생산 비용이 걸림돌입니다.", question: "What is the obstacle to graphene becoming a next-generation material?", options: ["the cost of mass production", "its lack of strength", "its poor conductivity", "its toxicity to humans"], answer: "the cost of mass production" },
      { kr: "전 국민 건강보험 도입을 둘러싼 논쟁은 재정 부담과 의료 접근성 사이의 균형 문제로 귀결됩니다.", question: "What does the debate over universal health insurance ultimately come down to?", options: ["balancing fiscal burden and access to care", "choosing which hospitals to close", "deciding doctors' salaries only", "banning private insurance entirely"], answer: "balancing fiscal burden and access to care" },
      { kr: "탄소세 도입에 찬성하는 이들은 오염 유발자에게 비용을 부담시켜야 한다고 주장합니다.", question: "What do carbon tax proponents argue?", options: ["polluters should bear the cost", "taxes should be abolished entirely", "only consumers should pay", "the tax should apply only overseas"], answer: "polluters should bear the cost" },
      { kr: "만성적인 무역 적자는 환율 변동뿐 아니라 산업 구조의 변화에서도 비롯될 수 있습니다.", question: "What can a chronic trade deficit stem from besides currency fluctuations?", options: ["changes in industrial structure", "a decrease in population", "an increase in exports", "a rise in interest rates alone"], answer: "changes in industrial structure" },
      { kr: "도시 용도 지역제 개혁은 주택 공급을 늘리기 위해 단독주택 지구에도 다세대 건축을 허용하자는 방향으로 논의되고 있습니다.", question: "What direction is zoning reform discussion taking to increase housing supply?", options: ["allowing multi-unit construction in single-family zones", "banning all new construction", "converting all housing to public ownership", "restricting immigration"], answer: "allowing multi-unit construction in single-family zones" },
      { kr: "부유세 도입 논의는 자산 평가의 어려움과 자본 유출 가능성이라는 현실적 장벽에 부딪힙니다.", question: "What practical barriers does wealth tax discussion face?", options: ["difficulty in asset valuation and possible capital flight", "lack of public interest", "a shortage of tax collectors", "opposition from unions only"], answer: "difficulty in asset valuation and possible capital flight" },
      { kr: "실업 급여 제도 개편은 근로 의욕을 유지하면서도 실직자의 최소 생활을 보장해야 하는 딜레마에 놓여 있습니다.", question: "What dilemma does unemployment insurance reform face?", options: ["maintaining work incentives while guaranteeing minimal living standards", "eliminating all benefits immediately", "raising taxes on employers only", "abolishing the insurance system entirely"], answer: "maintaining work incentives while guaranteeing minimal living standards" },
      { kr: "중앙은행의 독립성은 정치적 압력으로부터 통화 정책을 보호하기 위한 제도적 장치로 여겨집니다.", question: "What is central bank independence considered to protect against?", options: ["political pressure on monetary policy", "foreign investment entirely", "inflation reporting errors", "stock market speculation only"], answer: "political pressure on monetary policy" },
      { kr: "반독점 규제 당국은 거대 플랫폼 기업의 시장 지배력 남용 여부를 면밀히 조사하고 있습니다.", question: "What are antitrust regulators closely examining?", options: ["whether major platform companies abuse market dominance", "how to lower corporate taxes", "how to fund small startups", "how to merge more companies"], answer: "whether major platform companies abuse market dominance" },
      { kr: "국가 부채 비율이 지나치게 높아지면 신용 등급 하락과 차입 비용 상승으로 이어질 수 있습니다.", question: "What can an excessively high sovereign debt ratio lead to?", options: ["a credit rating downgrade and higher borrowing costs", "automatic debt forgiveness", "immediate currency abolition", "a guaranteed economic boom"], answer: "a credit rating downgrade and higher borrowing costs" },
      { kr: "암호화폐 규제 방식은 국가마다 달라 국제적인 자금 세탁 감시에 어려움을 초래합니다.", question: "What difficulty does varying cryptocurrency regulation across countries cause?", options: ["it complicates international monitoring of money laundering", "it makes all transactions instantly public", "it eliminates the need for banks", "it guarantees price stability"], answer: "it complicates international monitoring of money laundering" },
      { kr: "알고리즘 편향은 훈련 데이터에 내재된 사회적 불평등을 그대로 재생산할 위험이 있습니다.", question: "What risk does algorithmic bias carry?", options: ["reproducing social inequalities embedded in training data", "eliminating all human error", "making decisions completely random", "improving fairness automatically"], answer: "reproducing social inequalities embedded in training data" },
      { kr: "자율주행차 사고 발생 시 책임 소재를 제조사와 운전자 중 누구에게 물어야 하는지가 법적 쟁점입니다.", question: "What is the legal issue regarding autonomous vehicle accidents?", options: ["whether liability falls on the manufacturer or the driver", "how fast the vehicle can drive", "which color the vehicle should be", "how many passengers it can carry"], answer: "whether liability falls on the manufacturer or the driver" },
      { kr: "딥페이크 기술의 정교화는 진위 판별을 점점 더 어렵게 만들어 신뢰의 위기를 초래하고 있습니다.", question: "What crisis does the sophistication of deepfake technology bring about?", options: ["a crisis of trust as authenticity becomes harder to verify", "a shortage of video editing software", "a decline in internet speed", "an increase in film production costs"], answer: "a crisis of trust as authenticity becomes harder to verify" },
      { kr: "양자 암호는 도청 시도가 있을 경우 물리적으로 감지된다는 점에서 기존 암호와 차별화됩니다.", question: "What sets quantum encryption apart from conventional encryption?", options: ["eavesdropping attempts are physically detectable", "it requires no computer at all", "it is completely free to implement", "it never needs updating"], answer: "eavesdropping attempts are physically detectable" },
      { kr: "인공지능을 활용한 의료 진단은 정확도를 높이는 동시에 오진에 대한 법적 책임 문제를 새롭게 제기합니다.", question: "What new issue does AI-assisted medical diagnosis raise alongside improved accuracy?", options: ["legal liability for misdiagnosis", "the cost of hospital beds", "the shortage of nurses", "insurance premium calculations"], answer: "legal liability for misdiagnosis" },
      { kr: "반도체 제조 공정의 미세화는 물리적 한계에 근접하면서 새로운 소재와 구조에 대한 연구를 요구하고 있습니다.", question: "What does the miniaturization of chip manufacturing require as it nears physical limits?", options: ["research into new materials and structures", "an increase in factory workers", "lower electricity prices", "a reduction in chip demand"], answer: "research into new materials and structures" },
      { kr: "개인정보 유출 사고가 잇따르면서 데이터 최소 수집 원칙을 법제화해야 한다는 목소리가 커지고 있습니다.", question: "What is gaining support after a series of data breach incidents?", options: ["legislating the principle of minimal data collection", "banning all online services", "eliminating data protection laws", "requiring companies to collect more data"], answer: "legislating the principle of minimal data collection" },
      { kr: "오픈소스 인공지능 모델의 확산은 혁신을 촉진하지만 악용 가능성에 대한 통제 장치 부재라는 우려도 낳습니다.", question: "What concern accompanies the spread of open-source AI models?", options: ["the absence of safeguards against misuse", "a decline in overall innovation", "the disappearance of proprietary models", "the collapse of the tech industry"], answer: "the absence of safeguards against misuse" },
      { kr: "생성형 인공지능의 환각 현상은 그럴듯하지만 사실이 아닌 정보를 자신 있게 제시하는 경향을 말합니다.", question: "What does the hallucination phenomenon in generative AI refer to?", options: ["confidently presenting plausible but false information", "the AI refusing to answer any question", "the AI shutting down randomly", "the AI copying text verbatim only"], answer: "confidently presenting plausible but false information" },
      { kr: "제조업 로봇 자동화의 확대는 생산성을 높이지만 특정 지역의 고용 공동화를 가속화한다는 지적이 있습니다.", question: "What criticism is raised about expanding robotic automation in manufacturing?", options: ["it accelerates employment hollowing-out in certain regions", "it has no effect on productivity", "it eliminates the need for factories", "it lowers product quality"], answer: "it accelerates employment hollowing-out in certain regions" },
      { kr: "저자주의 이론은 영화의 예술적 성취를 감독 개인의 비전으로 환원한다는 점에서 비판받기도 합니다.", question: "What criticism does auteur theory face?", options: ["it reduces a film's artistic achievement to the director's vision alone", "it ignores directors completely", "it focuses only on box office success", "it applies only to documentaries"], answer: "it reduces a film's artistic achievement to the director's vision alone" },
      { kr: "문학 정전을 둘러싼 논쟁은 특정 집단의 목소리가 오랫동안 배제되어 왔다는 문제의식에서 출발합니다.", question: "What problem does the debate over the literary canon begin from?", options: ["certain groups' voices have long been excluded", "too many books are published each year", "translation quality has declined", "publishers no longer read manuscripts"], answer: "certain groups' voices have long been excluded" },
      { kr: "박물관 탈식민화 운동은 식민지 시기에 반출된 유물의 반환 문제를 핵심 의제로 삼고 있습니다.", question: "What key agenda does the museum decolonization movement focus on?", options: ["the return of artifacts taken during the colonial period", "expanding museum gift shops", "digitizing all exhibits", "closing museums permanently"], answer: "the return of artifacts taken during the colonial period" },
      { kr: "스트리밍 서비스의 확산으로 앨범 커버 예술의 상업적 비중이 크게 줄었다는 평가가 나옵니다.", question: "What assessment is made about album cover art due to the spread of streaming services?", options: ["its commercial importance has significantly declined", "it has become more valuable than ever", "it is now legally required", "it has replaced music entirely"], answer: "its commercial importance has significantly declined" },

      { kr: "배심원제는 시민의 사법 참여를 보장하지만 전문성 부족이라는 한계도 함께 지적됩니다.", question: "What limitation is pointed out about the jury system?", options: ["a lack of expertise among jurors", "excessive cost to taxpayers", "it excludes citizens entirely", "it only applies to minor cases"], answer: "a lack of expertise among jurors" },
      { kr: "저작권법은 창작자의 권리를 보호하는 동시에 공공의 정보 접근권과 균형을 이뤄야 합니다.", question: "What must copyright law balance?", options: ["creators' rights and the public's access to information", "government control and corporate profit", "artists and critics", "domestic law and foreign trade only"], answer: "creators' rights and the public's access to information" },
      { kr: "안락사의 합법화 여부는 개인의 자기결정권과 생명 존중 사이의 근본적인 갈등을 드러냅니다.", question: "What fundamental conflict does the euthanasia debate reveal?", options: ["personal autonomy versus respect for life", "religion versus science only", "young versus old generations", "doctors versus lawyers"], answer: "personal autonomy versus respect for life" },
      { kr: "출산율 저하와 평균 수명 연장이 맞물리며 인구 구조 자체가 근본적으로 변화하고 있습니다.", question: "What is fundamentally changing due to falling birth rates and longer life expectancy?", options: ["the population structure itself", "the average family size only", "the education system alone", "the currency exchange rate"], answer: "the population structure itself" },
      { kr: "1인 가구의 증가는 소비 패턴은 물론 주거 정책에도 큰 영향을 미치고 있습니다.", question: "What is the rise of single-person households affecting?", options: ["consumption patterns and housing policy", "only marriage rates", "only birth rates", "nothing measurable yet"], answer: "consumption patterns and housing policy" },
      { kr: "이민자 통합 정책의 성패는 언어 교육뿐 아니라 노동 시장 접근성에도 달려 있습니다.", question: "What does the success of immigrant integration policy depend on?", options: ["language education and access to the labor market", "border security alone", "tourism revenue", "military spending"], answer: "language education and access to the labor market" },
      { kr: "해수면 상승은 저지대 해안 도시의 존립 자체를 위협하는 수준에 이르렀습니다.", question: "What has sea-level rise come to threaten?", options: ["the very existence of low-lying coastal cities", "only fishing industries", "only tourism in a few countries", "nothing significant yet"], answer: "the very existence of low-lying coastal cities" },
      { kr: "탄소 배출권 거래제는 시장 원리를 이용해 온실가스 감축을 유도하려는 정책입니다.", question: "What does the carbon emissions trading system aim to do?", options: ["induce greenhouse gas reduction through market mechanisms", "ban all industrial production", "eliminate carbon entirely overnight", "subsidize fossil fuels"], answer: "induce greenhouse gas reduction through market mechanisms" },
      { kr: "무분별한 삼림 벌채는 지역 강우 패턴마저 교란시킬 수 있다는 연구 결과가 나왔습니다.", question: "What can reckless deforestation disrupt, according to the research?", options: ["even local rainfall patterns", "only soil color", "only insect populations", "nothing beyond the forest itself"], answer: "even local rainfall patterns" },
      { kr: "협상 테이블에서 상대의 숨은 이해관계를 파악하는 것이 성공적인 타결의 열쇠입니다.", question: "What is the key to a successful negotiation?", options: ["identifying the other side's hidden interests", "speaking louder than the opponent", "conceding on every point", "ending the meeting quickly"], answer: "identifying the other side's hidden interests" },
      { kr: "두 기업 간의 인수합병 협상은 가격 이견으로 난항을 겪고 있습니다.", question: "Why is the merger negotiation between the two companies struggling?", options: ["a disagreement over price", "a lack of interest from both sides", "a change in government regulation", "the companies have already merged"], answer: "a disagreement over price" },
      { kr: "노사 간 임금 협상이 결렬 직전까지 갔으나 막판 중재로 극적으로 타결되었습니다.", question: "How did the wage negotiation between labor and management end?", options: ["it was dramatically resolved through last-minute mediation", "it collapsed entirely", "it was postponed indefinitely", "management walked away without a deal"], answer: "it was dramatically resolved through last-minute mediation" },
      { kr: "중세 라틴어는 학술어로서의 지위를 잃은 뒤에도 여러 유럽어의 어휘 속에 흔적을 남겼습니다.", question: "What did medieval Latin leave behind even after losing its status as the scholarly language?", options: ["traces in the vocabulary of several European languages", "no influence whatsoever", "only its alphabet", "a complete grammar system in modern French"], answer: "traces in the vocabulary of several European languages" },
      { kr: "언어의 소멸은 단순히 의사소통 수단 하나가 사라지는 것이 아니라 그 안에 담긴 세계관의 소실을 뜻합니다.", question: "What does language extinction represent, beyond losing a means of communication?", options: ["the loss of a worldview embedded in that language", "an increase in global literacy", "a rise in translation demand", "a purely economic loss"], answer: "the loss of a worldview embedded in that language" },
      { kr: "그 협정은 무역 장벽을 낮추는 대신 노동 기준을 강화하는 조건을 포함하고 있습니다.", question: "What condition does the agreement include, alongside lowering trade barriers?", options: ["strengthening labor standards", "abolishing all tariffs immediately", "restricting immigration", "removing environmental regulations"], answer: "strengthening labor standards" },
      { kr: "국제법상 조약의 구속력은 각국의 비준 절차를 거쳐야 비로소 발생합니다.", question: "When does a treaty's binding force under international law actually take effect?", options: ["only after each country's ratification process", "the moment it is signed", "automatically after one year", "only when the UN votes"], answer: "only after each country's ratification process" },
      { kr: "표현의 자유는 절대적 권리가 아니라 타인의 권리와의 조화 속에서 행사되어야 합니다.", question: "How must freedom of expression be exercised, according to this statement?", options: ["in harmony with the rights of others, not as an absolute right", "without any limit whatsoever", "only by journalists", "only within private settings"], answer: "in harmony with the rights of others, not as an absolute right" },
      { kr: "고용 형태의 다변화로 인해 기존 노동법이 적용되지 않는 노동자가 늘고 있습니다.", question: "What is increasing due to the diversification of employment forms?", options: ["workers not covered by existing labor law", "workers with lifetime job security", "the number of labor unions", "government job placement rates"], answer: "workers not covered by existing labor law" },
      { kr: "빙하가 녹으면서 드러난 영구 동토층에서 오래된 병원균이 되살아날 가능성이 제기됩니다.", question: "What possibility is raised as glaciers melt and permafrost is exposed?", options: ["ancient pathogens could revive", "new species could be discovered daily", "sea levels could drop", "soil fertility could improve instantly"], answer: "ancient pathogens could revive" },
      { kr: "그 학자는 방언 연구가 단순한 언어학을 넘어 지역 정체성 형성과 밀접하다고 주장합니다.", question: "What does the scholar argue about dialect research?", options: ["it is closely tied to the formation of regional identity", "it has no relevance to identity", "it should be discontinued", "it only concerns pronunciation"], answer: "it is closely tied to the formation of regional identity" },
      { kr: "다자간 무역 협상은 참여국이 많을수록 합의 도출이 어려워지는 경향이 있습니다.", question: "What tendency do multilateral trade negotiations show?", options: ["reaching agreement becomes harder as more countries participate", "agreement is reached faster with more countries", "fewer countries always means faster deals", "the number of participants has no effect"], answer: "reaching agreement becomes harder as more countries participate" },
      { kr: "혼인율 감소와 만혼 경향은 전통적인 가족 개념에 근본적인 도전을 제기하고 있습니다.", question: "What are declining marriage rates and later marriage age posing a challenge to?", options: ["the traditional concept of family", "the national pension system alone", "the education curriculum", "urban housing prices only"], answer: "the traditional concept of family" },
      { kr: "그 판결은 표절과 정당한 인용의 경계를 어디에 그을 것인가에 대한 중요한 선례가 되었습니다.", question: "What did the ruling become an important precedent for?", options: ["where to draw the line between plagiarism and fair citation", "banning all quotations in academic writing", "abolishing copyright entirely", "defining what counts as art"], answer: "where to draw the line between plagiarism and fair citation" },
      { kr: "가뭄이 장기화되면서 농업용수를 둘러싼 지역 간 갈등이 표면화되고 있습니다.", question: "What is surfacing as the drought drags on?", options: ["conflict between regions over agricultural water", "a sudden increase in crop yields", "a decline in food prices", "cooperation between all regions"], answer: "conflict between regions over agricultural water" },
      { kr: "그 계약 조항은 모호하게 작성되어 훗날 소송의 빌미가 되었습니다.", question: "What resulted from the vaguely written contract clause?", options: ["it later became grounds for litigation", "it was praised for its clarity", "it prevented all future disputes", "it was never enforced"], answer: "it later became grounds for litigation" },
      { kr: "협상가는 감정을 배제하고 객관적 기준에 근거해 대안을 제시해야 한다고 조언합니다.", question: "What advice is given to negotiators?", options: ["set emotion aside and propose alternatives based on objective criteria", "always show strong emotion to persuade", "never offer alternatives", "rely solely on personal relationships"], answer: "set emotion aside and propose alternatives based on objective criteria" },
      { kr: "식민 지배의 역사는 오늘날까지도 해당 지역의 언어 정책에 그림자를 드리우고 있습니다.", question: "What does the history of colonial rule still cast a shadow over today?", options: ["the region's language policy", "only its architecture", "only its cuisine", "nothing measurable"], answer: "the region's language policy" },
      { kr: "재생 불가능한 자원의 고갈 속도는 대체 기술 개발 속도를 앞지르고 있다는 경고가 나옵니다.", question: "What warning is given about non-renewable resource depletion?", options: ["it is outpacing the development of alternative technologies", "it has already stopped completely", "alternative technologies are far ahead of it", "it poses no future risk"], answer: "it is outpacing the development of alternative technologies" },
      { kr: "그 사회학자는 익명성이 온라인 공동체의 결속과 갈등을 동시에 조장한다고 분석합니다.", question: "What does the sociologist say anonymity does in online communities?", options: ["fosters both solidarity and conflict at the same time", "eliminates all conflict", "has no effect on group behavior", "only strengthens solidarity"], answer: "fosters both solidarity and conflict at the same time" },
      { kr: "국경을 초월한 공급망 재편은 각국의 산업 정책에 새로운 셈법을 요구하고 있습니다.", question: "What is the reshaping of cross-border supply chains requiring of national industrial policy?", options: ["a new calculus", "complete deregulation", "an immediate halt to trade", "abandoning all foreign investment"], answer: "a new calculus" },
      { kr: "그 소송의 핵심 쟁점은 계약 위반이 아니라 신의성실 원칙의 위배 여부였습니다.", question: "What was the core issue of the lawsuit?", options: ["whether the principle of good faith was violated", "whether the contract existed at all", "the amount of damages only", "which court had jurisdiction"], answer: "whether the principle of good faith was violated" },
      { kr: "고대 문헌의 번역은 단어의 뜻만이 아니라 당대의 세계관까지 옮겨야 하는 작업입니다.", question: "What must translating ancient texts convey, beyond word meaning?", options: ["the worldview of that era", "only the grammar rules", "the translator's personal opinion", "modern slang equivalents"], answer: "the worldview of that era" },
      { kr: "탄소 국경세 도입을 둘러싸고 수출 의존도가 높은 국가들의 반발이 거세지고 있습니다.", question: "Why is opposition growing among export-dependent countries?", options: ["the introduction of a carbon border tax", "a sudden rise in oil prices", "a new immigration law", "a currency devaluation"], answer: "the introduction of a carbon border tax" },
      { kr: "그 협상단은 상호 양보의 폭을 명문화함으로써 향후 분쟁의 소지를 줄이고자 했습니다.", question: "What did the negotiating team try to do by formally documenting the scope of mutual concessions?", options: ["reduce the potential for future disputes", "end the negotiation immediately", "avoid signing any agreement", "increase ambiguity intentionally"], answer: "reduce the potential for future disputes" },
    ],
    readingCount: 3,
    writingCount: 5,
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
      {
        passage:
          "플라세보 효과는 흔히 '가짜 약'이 일으키는 심리적 착각 정도로 여겨지지만, 최근 신경과학 연구는 이를 훨씬 정교한 현상으로 재해석하고 있다. 뇌 영상 연구에 따르면 플라세보를 투여받은 환자의 뇌에서는 실제 진통제를 투여받았을 때와 유사한 신경 전달 물질 분비 패턴이 관찰된다. 흥미로운 점은 환자가 자신이 플라세보를 복용하고 있다는 사실을 알고 있는 경우에도 일정한 효과가 나타난다는 '공개 플라세보' 연구 결과다. 이는 효과의 상당 부분이 기대와 의례적 절차 자체에서 비롯됨을 시사한다. 다만 일부 연구자들은 이러한 발견이 만성 통증 관리에는 유용할 수 있으나, 이를 근거로 표준 치료를 대체하려는 시도는 위험하다고 경고한다.",
        questions: [
          { kr: "", question: "How is the placebo effect being reinterpreted by recent neuroscience research?", options: ["as a far more sophisticated phenomenon than mere psychological illusion", "as complete medical fraud", "as something only children experience", "as unrelated to brain activity"], answer: "as a far more sophisticated phenomenon than mere psychological illusion" },
          { kr: "", question: "What do brain imaging studies show about placebo patients?", options: ["neurotransmitter release patterns similar to those of actual painkillers", "no brain activity whatsoever", "activity only in the visual cortex", "patterns identical to sleep"], answer: "neurotransmitter release patterns similar to those of actual painkillers" },
          { kr: "", question: "What does 'open-label placebo' research suggest?", options: ["much of the effect comes from expectation and ritual itself", "patients must be deceived for any effect to occur", "the effect disappears once patients know the truth", "only children respond to open-label placebos"], answer: "much of the effect comes from expectation and ritual itself" },
          { kr: "", question: "What warning do some researchers give?", options: ["using this finding to replace standard treatment is risky", "placebos should replace all medicine immediately", "chronic pain cannot be managed at all", "brain imaging studies are unreliable"], answer: "using this finding to replace standard treatment is risky" },
        ],
      },
      {
        passage:
          "젠트리피케이션은 흔히 낙후된 지역이 활성화되는 긍정적 현상으로 소개되지만, 그 이면에는 원주민의 비자발적 이주라는 그림자가 드리워 있다. 예술가와 소규모 상인들이 저렴한 임대료를 좇아 유입되면서 지역의 독특한 문화가 형성되지만, 바로 그 매력이 자본을 끌어들이고 임대료를 끌어올려 애초에 그 문화를 만든 이들을 다시 밀어내는 역설이 반복된다. 도시 정책 연구자들은 이러한 순환을 막으려면 임대료 상한제나 공공 자산 신탁 같은 제도적 장치가 필요하다고 제안하지만, 이는 재산권 침해라는 반발에 부딪히기 일쑤다. 결국 문제의 핵심은 지역 활성화의 이익을 누가 향유하느냐라는 분배의 문제로 귀결된다는 지적이 많다.",
        questions: [
          { kr: "", question: "What shadow lies behind gentrification, according to the passage?", options: ["the involuntary displacement of original residents", "a permanent drop in property values", "the complete disappearance of small businesses everywhere", "a decline in urban population overall"], answer: "the involuntary displacement of original residents" },
          { kr: "", question: "What paradox is described in the passage?", options: ["the culture that attracts capital ends up pushing out its own creators", "artists always avoid affordable neighborhoods", "rising rents help original residents stay", "cultural growth always lowers rent"], answer: "the culture that attracts capital ends up pushing out its own creators" },
          { kr: "", question: "What do urban policy researchers propose to break this cycle?", options: ["institutional tools like rent caps or community land trusts", "banning artists from moving into neighborhoods", "eliminating all urban development", "raising taxes on original residents"], answer: "institutional tools like rent caps or community land trusts" },
          { kr: "", question: "What does the passage say the core issue ultimately comes down to?", options: ["who gets to enjoy the benefits of revitalization", "how to attract more tourists", "how to lower construction costs", "how to increase population density"], answer: "who gets to enjoy the benefits of revitalization" },
        ],
      },
      {
        passage:
          "기본소득 논의는 자동화로 인한 일자리 감소 전망과 맞물려 다시 활기를 띠고 있다. 찬성론자들은 조건 없이 지급되는 기본소득이 행정 비용을 절감하고 수급자의 존엄을 지키며, 저임금 노동을 강요당하지 않을 자유를 준다고 주장한다. 반면 반대론자들은 재원 마련을 위한 대규모 증세가 근로 의욕을 저하시킬 수 있으며, 기존 복지 제도를 대체할 경우 취약 계층에게 오히려 불리할 수 있다고 우려한다. 몇몇 국가에서 시행된 실험 결과는 엇갈린다. 노동 시간 감소는 미미했지만 정신 건강 지표는 개선되었다는 보고가 있는가 하면, 표본 규모가 작아 일반화하기 어렵다는 비판도 제기된다. 결국 기본소득의 성패는 재원 설계와 지급 방식에 달려 있다는 것이 중론이다.",
        questions: [
          { kr: "", question: "Why has the universal basic income debate regained momentum?", options: ["it is linked to forecasts of job loss from automation", "a global recession just ended", "birth rates have suddenly risen", "all existing welfare systems have collapsed"], answer: "it is linked to forecasts of job loss from automation" },
          { kr: "", question: "What do proponents claim about unconditional basic income?", options: ["it cuts administrative costs and preserves recipients' dignity", "it eliminates the need for any government", "it guarantees full employment", "it requires no funding at all"], answer: "it cuts administrative costs and preserves recipients' dignity" },
          { kr: "", question: "What concern do opponents raise?", options: ["large tax increases could reduce the motivation to work", "basic income would end all poverty instantly", "no country would ever try it", "it would have zero cost"], answer: "large tax increases could reduce the motivation to work" },
          { kr: "", question: "What do trial results in some countries show?", options: ["minor reduction in work hours but improved mental health indicators", "a dramatic collapse in the labor market", "no measurable effect of any kind", "unanimous agreement it should end"], answer: "minor reduction in work hours but improved mental health indicators" },
        ],
      },
      {
        passage:
          "작업 기억의 용량은 오랫동안 '마법의 숫자 7'로 알려져 왔지만, 최근 연구자들은 이 수치가 지나치게 단순화된 결과라고 지적한다. 정보를 낱개로 저장하는 대신 의미 있는 단위로 묶는 '청킹' 전략을 사용하면 실제 처리 용량이 크게 늘어난다는 것이다. 예컨대 무작위 숫자 열두 개를 그대로 외우기는 어렵지만, 이를 전화번호나 생년월일 형태로 재구성하면 훨씬 쉽게 기억할 수 있다. 이러한 발견은 작업 기억의 한계가 고정된 것이 아니라 정보를 조직하는 방식에 따라 달라질 수 있음을 시사하며, 학습 전략 설계에도 실질적인 함의를 지닌다.",
        questions: [
          { kr: "", question: "What do recent researchers say about the 'magic number 7'?", options: ["it oversimplifies working memory capacity", "it accurately measures long-term memory", "it was never studied scientifically", "it applies only to visual information"], answer: "it oversimplifies working memory capacity" },
          { kr: "", question: "What does 'chunking' allow people to do?", options: ["group information into meaningful units to expand effective capacity", "erase unnecessary memories permanently", "store information without any organization", "bypass the need for attention entirely"], answer: "group information into meaningful units to expand effective capacity" },
          { kr: "", question: "What example illustrates chunking in the passage?", options: ["restructuring random digits into a phone number format", "memorizing a poem line by line", "repeating a word aloud many times", "drawing a picture of the number"], answer: "restructuring random digits into a phone number format" },
          { kr: "", question: "What implication does this finding have?", options: ["memory limits depend on how information is organized, which matters for learning strategy", "working memory capacity cannot be changed under any circumstances", "chunking has no practical use outside laboratories", "the number 7 should be replaced with a fixed number 12"], answer: "memory limits depend on how information is organized, which matters for learning strategy" },
        ],
      },
      {
        passage:
          "확증 편향은 자신의 기존 신념과 일치하는 정보를 선택적으로 받아들이고 그렇지 않은 정보는 무시하거나 평가절하하는 인지적 경향을 가리킨다. 이 편향이 위험한 이유는 당사자가 스스로 편향되어 있다는 사실을 좀처럼 인식하지 못한다는 데 있다. 오히려 자신은 객관적 증거에 근거해 판단했다고 확신하는 경우가 많다. 심리학자들은 이러한 편향을 완전히 제거하기보다는, 의도적으로 반대 입장의 근거를 찾아보는 '악마의 변호인' 기법을 통해 그 영향을 줄이려는 시도가 더 현실적이라고 조언한다. 다만 이 기법 역시 형식적으로 수행될 경우 효과가 미미하다는 한계가 있다.",
        questions: [
          { kr: "", question: "What is confirmation bias defined as in the passage?", options: ["selectively accepting information that matches existing beliefs while dismissing contrary evidence", "randomly forming opinions without any evidence", "always changing one's mind when shown new data", "a bias that only affects trained scientists"], answer: "selectively accepting information that matches existing beliefs while dismissing contrary evidence" },
          { kr: "", question: "Why is confirmation bias considered dangerous?", options: ["people rarely recognize that they themselves are biased", "it only affects children, not adults", "it has been scientifically disproven", "it causes immediate physical harm"], answer: "people rarely recognize that they themselves are biased" },
          { kr: "", question: "What technique do psychologists recommend to reduce this bias?", options: ["deliberately seeking out arguments for the opposing side", "avoiding all forms of debate", "trusting intuition over evidence", "eliminating the bias completely through willpower"], answer: "deliberately seeking out arguments for the opposing side" },
          { kr: "", question: "What limitation of this technique is mentioned?", options: ["it has little effect if performed only superficially", "it works perfectly in every situation", "it requires expensive equipment", "it was banned in clinical settings"], answer: "it has little effect if performed only superficially" },
        ],
      },
      {
        passage:
          "메타인지란 자신의 사고 과정을 관찰하고 조절하는 능력을 말하며, 단순한 지식 습득과는 구분된다. 학습 부진을 겪는 학생 중 상당수는 지식이 부족해서가 아니라, 자신이 무엇을 알고 무엇을 모르는지 정확히 판단하지 못해 어려움을 겪는다는 연구 결과가 있다. 실제로 시험 준비 과정에서 '읽으면서 알 것 같다'는 느낌과 실제로 아는 것을 혼동하는 경우가 흔한데, 이를 '유창성 착각'이라 부른다. 반복해서 읽는 학습법보다 스스로 문제를 풀어 보며 즉각적인 피드백을 받는 방식이 이러한 착각을 줄이는 데 효과적이라는 것이 다수 연구의 결론이다.",
        questions: [
          { kr: "", question: "What is metacognition defined as?", options: ["the ability to observe and regulate one's own thought process", "the accumulation of factual knowledge", "a measure of raw intelligence", "the speed of processing new information"], answer: "the ability to observe and regulate one's own thought process" },
          { kr: "", question: "What do many struggling students actually lack, according to the passage?", options: ["an accurate judgment of what they know and don't know", "any interest in the subject", "access to study materials", "basic reading ability"], answer: "an accurate judgment of what they know and don't know" },
          { kr: "", question: "What is the 'illusion of fluency'?", options: ["confusing the feeling of familiarity while reading with actual knowledge", "the belief that reading quickly improves memory", "a visual illusion caused by fatigue", "mistaking a teacher's fluency for one's own"], answer: "confusing the feeling of familiarity while reading with actual knowledge" },
          { kr: "", question: "What study method is shown to be more effective than repeated reading?", options: ["solving problems and receiving immediate feedback", "listening to recorded lectures repeatedly", "copying the textbook by hand", "studying in complete silence"], answer: "solving problems and receiving immediate feedback" },
        ],
      },
      {
        passage:
          "낙관 편향은 사람들이 자신에게 나쁜 일이 일어날 확률을 실제보다 낮게, 좋은 일이 일어날 확률을 실제보다 높게 추정하는 경향을 말한다. 흥미롭게도 이 편향은 통계 지식이 풍부한 전문가 집단에서도 예외 없이 나타난다. 진화심리학자들은 이러한 편향이 불확실한 환경에서 도전을 지속하게 만드는 적응적 기능을 했을 것이라고 추정한다. 그러나 현대 사회에서는 이 편향이 재정 계획이나 건강 관리처럼 정확한 위험 평가가 필요한 영역에서 오히려 해가 될 수 있다. 최근 연구는 낙관 편향을 완전히 제거하려는 시도보다, 특정 의사 결정 상황에서만 선택적으로 위험을 재평가하도록 훈련하는 방식이 더 실용적이라고 제안한다.",
        questions: [
          { kr: "", question: "What is optimism bias defined as?", options: ["underestimating the probability of bad events and overestimating good ones for oneself", "believing that others are always luckier than oneself", "a rare condition found only in children", "overestimating risks in every domain of life"], answer: "underestimating the probability of bad events and overestimating good ones for oneself" },
          { kr: "", question: "Who is noted as still showing this bias despite expertise?", options: ["experts with extensive statistical knowledge", "only uneducated individuals", "professional gamblers exclusively", "people who have never studied psychology"], answer: "experts with extensive statistical knowledge" },
          { kr: "", question: "What adaptive function do evolutionary psychologists suggest this bias served?", options: ["sustaining continued effort under uncertain conditions", "preventing all forms of risk-taking", "improving memory accuracy", "reducing social conflict"], answer: "sustaining continued effort under uncertain conditions" },
          { kr: "", question: "What approach do recent studies propose instead of eliminating the bias entirely?", options: ["training selective risk reassessment in specific decision contexts", "ignoring the bias since it cannot be measured", "replacing optimism with permanent pessimism", "removing all financial planning from education"], answer: "training selective risk reassessment in specific decision contexts" },
        ],
      },
      {
        passage:
          "경제학에서 말하는 '매몰 비용의 오류'는 이미 회수할 수 없는 비용을 근거로 이후의 의사 결정을 내리는 비합리적 경향을 가리킨다. 이론적으로 합리적 행위자는 과거에 얼마를 투자했는지와 무관하게 오직 미래의 기대 비용과 편익만을 고려해야 하지만, 실제 인간의 의사 결정은 이 원칙에서 자주 벗어난다. 예컨대 실패가 예견되는 사업에 이미 막대한 자금을 투입했다는 이유만으로 추가 투자를 계속하는 기업의 사례가 대표적이다. 행동경제학자들은 이러한 오류가 손실을 인정하는 데 따르는 심리적 고통을 회피하려는 성향과 밀접하게 연관되어 있다고 설명한다.",
        questions: [
          { kr: "", question: "What is the sunk cost fallacy defined as?", options: ["basing future decisions on costs that cannot be recovered", "spending money without any planning", "always choosing the cheapest available option", "refusing to invest in any new project"], answer: "basing future decisions on costs that cannot be recovered" },
          { kr: "", question: "What should a theoretically rational actor consider, according to the passage?", options: ["only future expected costs and benefits", "only how much has already been spent", "the opinions of competitors", "the length of the project so far"], answer: "only future expected costs and benefits" },
          { kr: "", question: "What example illustrates the sunk cost fallacy?", options: ["a company continuing to invest in a doomed project because of prior spending", "a company that never invests in anything", "a consumer comparing prices before buying", "an investor diversifying a portfolio"], answer: "a company continuing to invest in a doomed project because of prior spending" },
          { kr: "", question: "How do behavioral economists explain this fallacy?", options: ["it is linked to avoiding the psychological pain of admitting a loss", "it is caused entirely by poor mathematics education", "it only occurs in economic recessions", "it results from a lack of available capital"], answer: "it is linked to avoiding the psychological pain of admitting a loss" },
        ],
      },
      {
        passage:
          "경기 순환을 설명하는 이론은 크게 수요 측 요인을 강조하는 입장과 공급 측 충격을 강조하는 입장으로 나뉜다. 전자는 소비와 투자 심리의 변화가 경기 변동의 주된 원인이라 보고 정부의 재정 정책 개입을 정당화하는 근거로 삼는다. 반면 후자는 기술 혁신이나 원자재 가격 변동 같은 외부 충격이 경제를 근본적으로 재조정한다고 보며, 인위적 개입이 오히려 자원 배분을 왜곡할 수 있다고 경고한다. 최근 몇몇 경제학자들은 두 접근이 상호 배타적이지 않으며, 실제 경기 침체는 수요와 공급 요인이 동시에 작용한 결과로 이해해야 한다고 주장한다.",
        questions: [
          { kr: "", question: "What are the two main schools of thought on business cycles described here?", options: ["demand-side factors versus supply-side shocks", "monetary policy versus fiscal policy only", "domestic trade versus international trade", "urban economics versus rural economics"], answer: "demand-side factors versus supply-side shocks" },
          { kr: "", question: "What does the demand-side view justify?", options: ["government fiscal policy intervention", "the complete removal of all taxes", "a fixed exchange rate system", "banning foreign investment"], answer: "government fiscal policy intervention" },
          { kr: "", question: "What warning does the supply-side view raise about intervention?", options: ["it can distort resource allocation", "it always increases employment", "it has no effect on the economy", "it eliminates business cycles entirely"], answer: "it can distort resource allocation" },
          { kr: "", question: "What do some recent economists argue?", options: ["real recessions result from both demand and supply factors acting together", "only one of the two theories can ever be correct", "business cycles no longer exist", "supply-side shocks have been disproven"], answer: "real recessions result from both demand and supply factors acting together" },
        ],
      },
      {
        passage:
          "정보 비대칭은 거래 당사자 중 한쪽이 다른 쪽보다 더 많은 정보를 가진 상태를 말하며, 중고차 시장은 이를 설명하는 고전적 사례로 자주 인용된다. 판매자는 차량의 실제 상태를 잘 알지만 구매자는 이를 정확히 파악하기 어렵기 때문에, 구매자는 평균적인 품질을 가정하고 가격을 낮게 제시하려는 경향을 보인다. 그 결과 품질이 좋은 차량의 판매자는 제값을 받지 못해 시장에서 이탈하고, 상대적으로 질이 낮은 차량만 남는 이른바 '역선택' 현상이 발생할 수 있다. 이러한 문제를 완화하기 위해 보증 제도나 제삼자 인증과 같은 신호 발신 장치가 활용된다.",
        questions: [
          { kr: "", question: "What is information asymmetry defined as?", options: ["one party in a transaction having more information than the other", "both parties having equal information", "a government policy restricting trade", "a type of currency exchange rate"], answer: "one party in a transaction having more information than the other" },
          { kr: "", question: "Why do buyers tend to offer lower prices in the used car example?", options: ["they cannot accurately assess the actual condition of the car", "they always distrust sellers regardless of information", "used cars are legally required to be cheap", "sellers always overstate the price"], answer: "they cannot accurately assess the actual condition of the car" },
          { kr: "", question: "What is 'adverse selection' as described here?", options: ["good-quality sellers leave the market, leaving mostly lower-quality goods", "buyers refuse to purchase anything at all", "only new cars are sold in the market", "prices rise uniformly across all quality levels"], answer: "good-quality sellers leave the market, leaving mostly lower-quality goods" },
          { kr: "", question: "What is used to mitigate this problem?", options: ["signaling devices such as warranties or third-party certification", "banning all used car sales", "fixing prices by government decree", "requiring buyers to be mechanics"], answer: "signaling devices such as warranties or third-party certification" },
        ],
      },
      {
        passage:
          "공공재는 배제 불가능성과 비경합성이라는 두 특성을 지닌 재화로, 가로등이나 국방이 대표적인 예로 꼽힌다. 누군가가 이미 비용을 지불했든 아니든 모두가 그 혜택을 누릴 수 있기 때문에, 개인은 자신이 비용을 부담하지 않고도 혜택만 누리려는 '무임승차' 유인을 갖게 된다. 이러한 유인이 널리 퍼지면 아무도 자발적으로 비용을 부담하지 않아 공공재가 과소 공급되는 결과로 이어질 수 있다. 전통적으로 이 문제는 정부의 강제적 조세를 통한 공급으로 해결되어 왔지만, 최근에는 디지털 플랫폼을 활용한 자발적 기여 모델이 일부 영역에서 대안으로 실험되고 있다.",
        questions: [
          { kr: "", question: "What two characteristics define a public good, according to the passage?", options: ["non-excludability and non-rivalry", "high price and low demand", "scarcity and portability", "government ownership and taxation"], answer: "non-excludability and non-rivalry" },
          { kr: "", question: "What incentive does the free-rider problem create?", options: ["enjoying benefits without bearing the cost", "paying more than one's fair share voluntarily", "avoiding all public services entirely", "demanding higher taxes from others"], answer: "enjoying benefits without bearing the cost" },
          { kr: "", question: "What result can widespread free-riding lead to?", options: ["undersupply of the public good", "oversupply of the public good", "an increase in private goods only", "the disappearance of taxation altogether"], answer: "undersupply of the public good" },
          { kr: "", question: "What alternative is being experimented with recently?", options: ["voluntary contribution models on digital platforms", "abolishing all forms of taxation", "privatizing national defense entirely", "banning public goods from being produced"], answer: "voluntary contribution models on digital platforms" },
        ],
      },
      {
        passage:
          "언어의 사피어-워프 가설은 사용하는 언어가 사고방식을 근본적으로 제약한다는 강한 형태와, 사고에 어느 정도 영향을 미칠 뿐이라는 약한 형태로 나뉜다. 강한 형태는 서로 다른 언어를 쓰는 사람들이 근본적으로 다른 방식으로 세계를 인식한다고 주장하지만, 오늘날 대다수 언어학자들은 이를 지지하지 않는다. 반면 약한 형태를 뒷받침하는 실증 연구는 꾸준히 축적되고 있다. 예컨대 공간을 절대 방위로 표현하는 언어를 쓰는 화자들은 상대 방위로 표현하는 언어의 화자들보다 방향 감각 과제에서 더 뛰어난 수행을 보인다는 연구 결과가 있다. 이는 언어가 사고를 결정하지는 않지만 특정한 인지적 습관을 형성하는 데 기여할 수 있음을 시사한다.",
        questions: [
          { kr: "", question: "What are the two versions of the Sapir-Whorf hypothesis described?", options: ["a strong version claiming language constrains thought and a weak version claiming mere influence", "an old version and a new version of the same claim", "a spoken version and a written version", "a version for children and one for adults"], answer: "a strong version claiming language constrains thought and a weak version claiming mere influence" },
          { kr: "", question: "How do most linguists today regard the strong version?", options: ["they do not support it", "they consider it fully proven", "they consider it the founding principle of linguistics", "they believe it applies only to tonal languages"], answer: "they do not support it" },
          { kr: "", question: "What example supports the weak version?", options: ["speakers of absolute-direction languages perform better on orientation tasks", "speakers of all languages perform identically on every task", "bilingual speakers cannot navigate at all", "written languages produce better spatial memory than spoken ones"], answer: "speakers of absolute-direction languages perform better on orientation tasks" },
          { kr: "", question: "What does this evidence suggest about language and thought?", options: ["language does not determine thought but can shape certain cognitive habits", "language has absolutely no effect on cognition", "thought exists entirely independently of any habit", "cognitive habits are fixed at birth regardless of language"], answer: "language does not determine thought but can shape certain cognitive habits" },
        ],
      },
      {
        passage:
          "언어 소멸은 화자 공동체가 사라지거나 지배 언어로 언어 전환이 일어날 때 발생하며, 전문가들은 현존하는 언어의 상당수가 이번 세기 안에 소멸할 위험에 처해 있다고 경고한다. 언어 소멸이 우려되는 이유는 단순히 의사소통 수단의 상실을 넘어선다. 각 언어는 그 공동체가 오랜 세월 축적해 온 생태 지식이나 세계 인식의 독특한 방식을 담고 있어, 언어가 사라지면 그와 함께 대체 불가능한 문화적 자산도 소실된다는 것이다. 이에 대응해 언어학자들은 소멸 위기에 처한 언어의 문법과 어휘를 기록하는 작업과, 공동체 스스로가 언어를 다음 세대에 전승하도록 지원하는 활성화 프로그램을 병행하고 있다.",
        questions: [
          { kr: "", question: "When does language death occur, according to the passage?", options: ["when a speech community disappears or shifts to a dominant language", "only when a country changes its official alphabet", "when a language is translated into another language", "when a government bans public speaking"], answer: "when a speech community disappears or shifts to a dominant language" },
          { kr: "", question: "Why does the passage say language extinction matters beyond communication loss?", options: ["each language embodies unique ecological knowledge and ways of understanding the world", "languages have no other function besides communication", "only written languages carry cultural value", "language loss only affects tourism revenue"], answer: "each language embodies unique ecological knowledge and ways of understanding the world" },
          { kr: "", question: "What is described as irreplaceable when a language disappears?", options: ["cultural assets embedded in that language", "the alphabet used to write it", "government archives", "trade agreements written in that language"], answer: "cultural assets embedded in that language" },
          { kr: "", question: "What do linguists do in response to endangered languages?", options: ["document grammar and vocabulary while supporting community-led transmission programs", "translate them immediately into a single global language", "encourage communities to abandon the language faster", "ban the use of dominant languages entirely"], answer: "document grammar and vocabulary while supporting community-led transmission programs" },
        ],
      },
      {
        passage:
          "코드 스위칭은 한 화자가 대화 중에 둘 이상의 언어나 방언을 번갈아 사용하는 현상을 가리키며, 과거에는 언어 능력의 부족을 나타내는 징후로 오해되기도 했다. 그러나 사회언어학 연구는 코드 스위칭이 오히려 정교한 언어 능력을 요구하는 행위임을 보여 준다. 화자는 대화 상대, 상황의 격식성, 전달하고자 하는 정체성 등을 순간적으로 판단하여 언어를 전환하며, 이는 단일 언어 사용자에게는 없는 추가적인 인지적 조율 능력을 필요로 한다. 최근 연구는 코드 스위칭을 자주 경험하는 이중 언어 사용자가 과제 전환 능력을 측정하는 인지 실험에서 더 뛰어난 수행을 보인다는 결과도 제시하고 있다.",
        questions: [
          { kr: "", question: "What is code-switching defined as?", options: ["alternating between two or more languages or dialects within a conversation", "speaking only one language fluently", "translating written documents professionally", "learning a second language from childhood"], answer: "alternating between two or more languages or dialects within a conversation" },
          { kr: "", question: "How was code-switching mistakenly viewed in the past?", options: ["as a sign of insufficient language ability", "as a formal teaching method", "as evidence of exceptional intelligence", "as a purely written phenomenon"], answer: "as a sign of insufficient language ability" },
          { kr: "", question: "What does sociolinguistic research show about code-switching?", options: ["it requires sophisticated linguistic competence", "it happens randomly with no pattern", "it only occurs among illiterate speakers", "it is declining rapidly worldwide"], answer: "it requires sophisticated linguistic competence" },
          { kr: "", question: "What do recent studies find about frequent code-switchers?", options: ["they perform better on cognitive task-switching experiments", "they perform worse on all cognitive tests", "they lose fluency in both languages over time", "they show no cognitive differences from monolinguals"], answer: "they perform better on cognitive task-switching experiments" },
        ],
      },
      {
        passage:
          "안면 인식 기술은 공공 안전 강화라는 명분으로 빠르게 확산되고 있지만, 그 이면에는 감시 사회로의 이행에 대한 우려가 짙게 드리워 있다. 기술 옹호자들은 범죄 예방과 실종자 수색 등 명백한 공익적 효용을 근거로 든다. 그러나 비판론자들은 이 기술이 대규모 시민을 대상으로 동의 없이 작동한다는 점, 그리고 특정 인종이나 성별에서 오인식률이 유독 높게 나타난다는 연구 결과를 지적하며 근본적인 재검토를 요구한다. 일부 도시는 공공장소에서의 안면 인식 사용을 전면 금지했지만, 다른 지역에서는 오히려 활용 범위를 넓히고 있어 규제의 방향은 아직 합의되지 않은 상태다.",
        questions: [
          { kr: "", question: "What justification is given for the rapid spread of facial recognition technology?", options: ["strengthening public safety", "reducing government spending", "improving internet speed", "increasing tourism"], answer: "strengthening public safety" },
          { kr: "", question: "What concern lies behind this technology's spread, according to the passage?", options: ["a shift toward a surveillance society", "a rise in unemployment", "a decline in internet access", "an increase in paper-based records"], answer: "a shift toward a surveillance society" },
          { kr: "", question: "What do critics point out about misidentification rates?", options: ["they are notably higher for certain races or genders", "they are identical across all demographic groups", "they have never been studied", "they only occur in rural areas"], answer: "they are notably higher for certain races or genders" },
          { kr: "", question: "What is the current state of regulation described as?", options: ["not yet agreed upon, with some cities banning it and others expanding it", "fully unified across all regions", "completely absent everywhere", "settled in favor of a total worldwide ban"], answer: "not yet agreed upon, with some cities banning it and others expanding it" },
        ],
      },
      {
        passage:
          "알고리즘 채용 시스템은 인간 채용 담당자의 편향을 줄여 준다는 기대와 함께 도입되었지만, 실제로는 과거 데이터에 내재된 편향을 그대로 학습하여 재생산하는 사례가 보고되고 있다. 대표적으로 특정 기업이 사용한 이력서 심사 알고리즘은 과거 채용 기록에서 남성 지원자가 우세했던 패턴을 학습한 결과, 여성 지원자에게 불리하게 작동한 것으로 드러났다. 이러한 문제는 알고리즘 자체가 악의를 가져서가 아니라, 훈련 데이터에 담긴 역사적 불평등을 그대로 반영하기 때문에 발생한다. 전문가들은 알고리즘의 공정성을 검증하기 위한 독립적인 감사 체계와, 결정 과정을 설명할 수 있는 투명성 확보가 필수적이라고 강조한다.",
        questions: [
          { kr: "", question: "What expectation accompanied the introduction of algorithmic hiring systems?", options: ["reducing bias present in human recruiters", "eliminating the need for job interviews", "guaranteeing higher salaries for all applicants", "speeding up manufacturing processes"], answer: "reducing bias present in human recruiters" },
          { kr: "", question: "What happened with the resume-screening algorithm mentioned as an example?", options: ["it disadvantaged female applicants after learning from historical hiring patterns", "it treated all applicants completely equally", "it only rejected unqualified applicants", "it was designed intentionally to favor women"], answer: "it disadvantaged female applicants after learning from historical hiring patterns" },
          { kr: "", question: "Why does this kind of problem occur, according to the passage?", options: ["the algorithm reflects historical inequality present in training data", "the algorithm has malicious intent", "the algorithm was programmed by a single biased engineer", "the algorithm randomly generates decisions"], answer: "the algorithm reflects historical inequality present in training data" },
          { kr: "", question: "What do experts say is essential to address this problem?", options: ["independent audits and transparency in decision-making processes", "banning all forms of automation immediately", "keeping algorithms completely secret from regulators", "removing human oversight entirely"], answer: "independent audits and transparency in decision-making processes" },
        ],
      },
      {
        passage:
          "딥페이크 기술의 발전은 영상과 음성을 정교하게 조작할 수 있는 가능성을 열었지만, 동시에 진위 판별이라는 새로운 사회적 과제를 낳았다. 초기에는 딥페이크가 주로 오락이나 풍자의 목적으로 사용되었지만, 최근에는 정치인의 발언을 조작하거나 개인을 대상으로 한 범죄에 악용되는 사례가 늘고 있다. 문제는 탐지 기술이 발전할수록 이를 우회하는 생성 기술 역시 함께 발전한다는 데 있다. 일부 학자들은 기술적 탐지에만 의존하기보다, 영상 콘텐츠의 출처를 추적할 수 있는 디지털 워터마크나 인증 체계를 콘텐츠 생성 단계부터 도입하는 것이 근본적인 해법이 될 수 있다고 제안한다.",
        questions: [
          { kr: "", question: "What new social challenge has deepfake technology created?", options: ["the challenge of distinguishing authentic content from manipulated content", "a shortage of video storage space", "a decline in film industry revenue", "an increase in internet costs"], answer: "the challenge of distinguishing authentic content from manipulated content" },
          { kr: "", question: "How has the use of deepfakes changed over time, according to the passage?", options: ["from mainly entertainment and satire to political manipulation and crime", "from crime exclusively to entertainment exclusively", "it has remained exactly the same since its invention", "it has been banned entirely worldwide"], answer: "from mainly entertainment and satire to political manipulation and crime" },
          { kr: "", question: "What problem is described regarding detection technology?", options: ["generation techniques that evade detection advance alongside it", "detection technology has become obsolete and unnecessary", "detection technology works perfectly with no exceptions", "detection technology is illegal to develop"], answer: "generation techniques that evade detection advance alongside it" },
          { kr: "", question: "What fundamental solution do some scholars propose?", options: ["introducing digital watermarks or authentication systems at the content creation stage", "banning all video recording devices", "relying solely on manual human review of every video", "shutting down social media platforms entirely"], answer: "introducing digital watermarks or authentication systems at the content creation stage" },
        ],
      },
      {
        passage:
          "생성형 인공지능이 창작물을 만들어 내는 과정에서 기존 저작물을 학습 데이터로 사용하는 관행은 저작권법의 근본적인 재검토를 요구하고 있다. 현행법은 인간 창작자를 전제로 설계되었기 때문에, 인공지능이 학습 과정에서 원작을 참고하는 행위가 공정 이용에 해당하는지, 그리고 그 결과물의 저작권을 누구에게 귀속시켜야 하는지에 대해 명확한 답을 제공하지 못한다. 창작자 단체들은 동의 없는 데이터 활용이 창작 생태계를 위협한다고 주장하는 반면, 기술 기업들은 과도한 규제가 혁신을 저해할 수 있다고 반박한다. 일부 국가는 데이터 사용에 대한 보상 체계를 마련하는 절충안을 모색하고 있지만, 국제적으로 통일된 기준은 아직 마련되지 않았다.",
        questions: [
          { kr: "", question: "What is requiring a fundamental review of copyright law, according to the passage?", options: ["the practice of using existing works as training data for generative AI", "the invention of the printing press", "a decline in book sales", "the closure of art schools"], answer: "the practice of using existing works as training data for generative AI" },
          { kr: "", question: "Why does current law fail to give clear answers here?", options: ["it was designed around the premise of human creators", "it was written specifically for AI companies", "it has never been updated since ancient times", "it applies only to physical artworks"], answer: "it was designed around the premise of human creators" },
          { kr: "", question: "What do creator groups argue?", options: ["using data without consent threatens the creative ecosystem", "AI should be allowed to use any data freely", "copyright law should be abolished entirely", "technology companies should own all creative output"], answer: "using data without consent threatens the creative ecosystem" },
          { kr: "", question: "What compromise are some countries exploring?", options: ["a compensation system for data use", "a total ban on generative AI", "removing all copyright protections", "requiring all AI output to be anonymous"], answer: "a compensation system for data use" },
        ],
      },
      {
        passage:
          "텔로미어는 염색체 말단을 보호하는 반복 서열로, 세포가 분열할 때마다 점차 짧아지며 이는 세포 노화의 주요 지표 중 하나로 여겨진다. 텔로미어가 임계 길이 이하로 줄어들면 세포는 더 이상 분열하지 못하고 노화 상태에 들어가거나 스스로 사멸한다. 흥미롭게도 만성 스트레스나 수면 부족과 같은 생활 습관 요인이 텔로미어 단축 속도를 가속화한다는 연구 결과가 축적되고 있다. 반면 규칙적인 운동과 적절한 식이는 텔로미어를 유지하는 효소인 텔로머레이스의 활성을 높이는 데 기여할 수 있다는 보고도 있다. 다만 텔로미어 길이를 인위적으로 늘리는 시도는 암세포의 무한 증식 기제와 밀접히 연관되어 있어 신중한 접근이 요구된다.",
        questions: [
          { kr: "", question: "What are telomeres described as in the passage?", options: ["repeated sequences protecting the ends of chromosomes", "a type of white blood cell", "an enzyme that digests proteins", "a hormone regulating sleep"], answer: "repeated sequences protecting the ends of chromosomes" },
          { kr: "", question: "What happens when telomeres shorten below a critical length?", options: ["cells stop dividing and enter senescence or die", "cells begin dividing infinitely without control", "cells convert into a different tissue type", "nothing changes in cell function"], answer: "cells stop dividing and enter senescence or die" },
          { kr: "", question: "What lifestyle factors are said to accelerate telomere shortening?", options: ["chronic stress and lack of sleep", "regular exercise and healthy diet", "moderate sunlight exposure", "drinking sufficient water"], answer: "chronic stress and lack of sleep" },
          { kr: "", question: "Why does the passage urge caution about artificially lengthening telomeres?", options: ["it is closely linked to the mechanism behind uncontrolled cancer cell growth", "it has no known biological effects", "it is prohibitively expensive for all patients", "it always causes immediate cell death"], answer: "it is closely linked to the mechanism behind uncontrolled cancer cell growth" },
        ],
      },
      {
        passage:
          "항생제 내성은 세균이 항생제에 노출되는 과정에서 살아남은 개체가 내성 유전자를 후대에 전달하며 확산되는 진화적 현상이다. 문제는 이러한 내성이 한 병원이나 국가에 국한되지 않고 국제 여행과 교역을 통해 빠르게 전 세계로 퍼진다는 점이다. 세계보건기구는 항생제 오남용, 특히 축산업에서의 예방적 목적의 대량 투여가 내성균 확산의 주요 원인 중 하나라고 지목한다. 신약 개발이 내성 확산 속도를 따라가지 못하는 상황에서, 전문가들은 기존 항생제의 신중한 처방과 더불어 백신 접종률을 높여 애초에 감염 자체를 줄이는 예방적 접근이 병행되어야 한다고 강조한다.",
        questions: [
          { kr: "", question: "How is antibiotic resistance described as spreading?", options: ["through evolutionary transmission of resistance genes from surviving bacteria to offspring", "only through direct physical contact between patients", "by mutation caused solely by vaccines", "through contaminated drinking water exclusively"], answer: "through evolutionary transmission of resistance genes from surviving bacteria to offspring" },
          { kr: "", question: "Why is antibiotic resistance considered a global problem?", options: ["it spreads worldwide rapidly through international travel and trade", "it only affects a single hospital at a time", "it cannot cross national borders", "it is limited to one bacterial species"], answer: "it spreads worldwide rapidly through international travel and trade" },
          { kr: "", question: "What does the WHO identify as a major cause of resistance spread?", options: ["mass preventive antibiotic use in livestock farming", "excessive handwashing in hospitals", "overuse of vaccines in children", "a shortage of doctors worldwide"], answer: "mass preventive antibiotic use in livestock farming" },
          { kr: "", question: "What preventive approach do experts recommend alongside cautious prescribing?", options: ["increasing vaccination rates to reduce infections in the first place", "banning all antibiotics immediately worldwide", "relying solely on new drug development", "reducing hospital capacity"], answer: "increasing vaccination rates to reduce infections in the first place" },
        ],
      },
      {
        passage:
          "생체 시계, 즉 일주기 리듬은 약 24시간 주기로 수면, 체온, 호르몬 분비를 조절하는 내재적 생체 기제다. 이 리듬은 빛에 크게 영향을 받으며, 특히 야간의 인공조명 노출은 수면 유도 호르몬인 멜라토닌의 분비를 억제하여 리듬을 교란할 수 있다. 교대 근무자를 대상으로 한 연구는 만성적인 일주기 리듬 교란이 단순한 피로감을 넘어 대사 질환과 특정 암의 발병 위험 증가와도 연관되어 있음을 보여 준다. 이러한 발견에 힘입어 일부 국가에서는 교대 근무자의 건강을 보호하기 위한 조명 설계 지침이나 근무 일정 조정 기준을 마련하기 시작했다.",
        questions: [
          { kr: "", question: "What is the circadian rhythm described as?", options: ["an internal biological mechanism regulating sleep, temperature, and hormones on roughly a 24-hour cycle", "a rhythm that repeats every hour", "a mechanism unrelated to light exposure", "a fixed schedule that cannot be disrupted"], answer: "an internal biological mechanism regulating sleep, temperature, and hormones on roughly a 24-hour cycle" },
          { kr: "", question: "What effect does nighttime artificial light have?", options: ["it suppresses melatonin secretion and disrupts the rhythm", "it has no measurable biological effect", "it increases melatonin secretion excessively", "it only affects people over 60"], answer: "it suppresses melatonin secretion and disrupts the rhythm" },
          { kr: "", question: "What have studies on shift workers shown?", options: ["chronic rhythm disruption is linked to increased risk of metabolic disease and certain cancers", "shift work has no health consequences at all", "shift workers sleep better than day workers", "only mental health is affected by shift work"], answer: "chronic rhythm disruption is linked to increased risk of metabolic disease and certain cancers" },
          { kr: "", question: "What have some countries begun to establish in response?", options: ["lighting design guidelines and work schedule adjustment standards", "a complete ban on night shift work", "mandatory retirement for shift workers", "free vacations for all shift workers"], answer: "lighting design guidelines and work schedule adjustment standards" },
        ],
      },
      {
        passage:
          "장기 이식을 기다리는 환자 수가 공급 가능한 장기 수를 훨씬 초과하는 현실은 오랫동안 의료 윤리의 난제로 남아 있다. 이 문제를 완화하기 위한 방안으로 최근 이종 이식, 즉 유전자 편집을 거친 동물의 장기를 인간에게 이식하는 기술이 주목받고 있다. 초기 임상 사례에서 일부 성공이 보고되었지만, 장기적인 면역 거부 반응과 동물 유래 바이러스의 인체 감염 가능성에 대한 우려는 여전히 해소되지 않았다. 아울러 이러한 기술이 상용화될 경우 그 비용이 막대할 것으로 예상되어, 혜택이 일부 부유한 환자에게만 돌아갈 수 있다는 형평성 문제도 함께 제기되고 있다.",
        questions: [
          { kr: "", question: "What long-standing ethical problem does the passage describe?", options: ["the number of patients waiting for organ transplants far exceeds available organs", "a surplus of organs with too few patients needing them", "a ban on all organ transplants worldwide", "the high cost of basic medical checkups"], answer: "the number of patients waiting for organ transplants far exceeds available organs" },
          { kr: "", question: "What technology is drawing attention as a possible solution?", options: ["xenotransplantation using gene-edited animal organs", "3D-printed synthetic organs only", "organ transplants between identical twins exclusively", "artificial blood transfusion"], answer: "xenotransplantation using gene-edited animal organs" },
          { kr: "", question: "What concerns remain unresolved about this technology?", options: ["long-term immune rejection and the risk of animal-derived viral infection", "excessive cost of the surgical equipment only", "a total lack of willing patients", "legal bans in every country"], answer: "long-term immune rejection and the risk of animal-derived viral infection" },
          { kr: "", question: "What equity concern is raised regarding commercialization?", options: ["the benefits might go only to wealthy patients due to high cost", "the technology would be free for everyone immediately", "poor patients would receive priority access", "the technology cannot be commercialized at all"], answer: "the benefits might go only to wealthy patients due to high cost" },
        ],
      },
      {
        passage:
          "정밀 의학은 개인의 유전 정보, 생활 습관, 환경적 요인을 종합적으로 고려하여 치료법을 맞춤화하는 접근으로, 획일적인 표준 치료의 한계를 넘어서려는 시도로 주목받고 있다. 특정 암 치료에서 유전자 변이 양상에 따라 약물 반응이 크게 달라진다는 사실이 밝혀지면서, 동일한 진단을 받은 환자라도 서로 다른 치료 전략이 필요하다는 인식이 확산되었다. 그러나 정밀 의학의 확대에는 걸림돌도 존재한다. 유전자 분석 비용이 여전히 높고, 대규모 유전 정보 데이터베이스가 특정 인종이나 지역에 편중되어 있어 그 결과를 모든 인구 집단에 동일하게 적용하기 어렵다는 지적이 제기된다.",
        questions: [
          { kr: "", question: "What is precision medicine defined as?", options: ["tailoring treatment by comprehensively considering genetics, lifestyle, and environmental factors", "applying the exact same treatment to every patient", "a treatment method based solely on patient age", "a purely experimental therapy with no clinical use"], answer: "tailoring treatment by comprehensively considering genetics, lifestyle, and environmental factors" },
          { kr: "", question: "What realization spread regarding cancer treatment?", options: ["patients with the same diagnosis may need different treatment strategies based on genetic variation", "all cancer patients respond identically to any drug", "genetic variation has no effect on drug response", "only lifestyle factors matter in cancer treatment"], answer: "patients with the same diagnosis may need different treatment strategies based on genetic variation" },
          { kr: "", question: "What is one obstacle to expanding precision medicine?", options: ["the high cost of genetic analysis", "a complete absence of interested patients", "a lack of any genetic research", "opposition from all medical professionals"], answer: "the high cost of genetic analysis" },
          { kr: "", question: "What criticism is raised about genetic databases?", options: ["they are skewed toward certain races or regions, limiting applicability to all populations", "they contain no real patient data", "they are updated too frequently to be useful", "they are entirely public and free to access"], answer: "they are skewed toward certain races or regions, limiting applicability to all populations" },
        ],
      },
      {
        passage:
          "인간의 미각은 단맛, 짠맛, 신맛, 쓴맛, 감칠맛의 다섯 가지 기본 미각으로 구성된다고 알려져 있지만, 최근 신경과학 연구는 이 분류가 실제 미각 경험을 온전히 설명하지 못한다고 지적한다. 미각은 후각, 촉각, 심지어 청각적 요소까지 통합되어 뇌에서 재구성되는 복합적 지각이라는 것이다. 예컨대 코를 막은 상태에서 음식을 먹으면 맛을 제대로 구별하지 못하는 현상은 후각이 미각 경험에 얼마나 깊이 관여하는지를 보여 준다. 이러한 발견은 감칠맛을 다섯 번째 기본 미각으로 인정하는 데 오랜 시간이 걸렸던 것처럼, 향후 새로운 미각 범주가 추가될 가능성을 열어 두고 있다.",
        questions: [
          { kr: "", question: "What five basic tastes have traditionally been recognized?", options: ["sweet, salty, sour, bitter, and umami", "sweet, spicy, sour, bitter, and metallic", "salty, spicy, bitter, umami, and cold", "sweet, sour, hot, cold, and umami"], answer: "sweet, salty, sour, bitter, and umami" },
          { kr: "", question: "What do recent neuroscience studies say about this classification?", options: ["it does not fully explain the actual experience of taste", "it is the complete and final explanation of taste", "it applies only to artificial flavors", "it was proven wrong a century ago"], answer: "it does not fully explain the actual experience of taste" },
          { kr: "", question: "What does the example of eating with a blocked nose demonstrate?", options: ["how deeply smell is involved in the experience of taste", "that taste is entirely independent of smell", "that touch has no role in taste perception", "that taste perception disappears entirely without hearing"], answer: "how deeply smell is involved in the experience of taste" },
          { kr: "", question: "What possibility does the passage leave open?", options: ["new taste categories may be added in the future, as happened with umami", "no new taste category will ever be recognized again", "umami will eventually be removed from the list", "taste research has reached its final conclusion"], answer: "new taste categories may be added in the future, as happened with umami" },
        ],
      },

      {
        passage:
          "사회 자본 개념은 개인이 맺고 있는 사회적 관계망이 그 자체로 경제적 자본이나 인적 자본에 버금가는 자원이 될 수 있음을 강조한다. 퍼트넘과 같은 학자들은 자원봉사 단체나 지역 모임에 대한 참여가 신뢰와 협력의 규범을 확산시켜 공동체 전체의 문제 해결 능력을 높인다고 주장했다. 그러나 최근 비판적 연구들은 사회 자본이 항상 긍정적으로 작동하지는 않는다고 지적한다. 폐쇄적인 네트워크는 내부 결속을 강화하는 동시에 외부인을 배제하는 방향으로 작동할 수 있으며, 이 경우 사회 자본은 오히려 불평등을 고착시키는 기제가 된다는 것이다. 따라서 사회 자본의 총량뿐 아니라 그것이 개방적으로 형성되었는지 폐쇄적으로 형성되었는지를 함께 살펴야 한다는 견해가 힘을 얻고 있다.",
        questions: [
          { kr: "", question: "What did Putnam and similar scholars argue about civic participation?", options: ["it spreads norms of trust and cooperation that improve a community's problem-solving capacity", "it has no measurable effect on communities", "it only benefits wealthy neighborhoods", "it replaces the need for economic capital entirely"], answer: "it spreads norms of trust and cooperation that improve a community's problem-solving capacity" },
          { kr: "", question: "What do recent critical studies point out about social capital?", options: ["closed networks can strengthen internal bonds while excluding outsiders", "it is impossible to measure", "it always reduces inequality", "it has been fully disproven"], answer: "closed networks can strengthen internal bonds while excluding outsiders" },
          { kr: "", question: "In what case can social capital entrench inequality, according to the passage?", options: ["when networks form in a closed rather than open manner", "whenever participation rates rise", "only in rural areas", "when government funding decreases"], answer: "when networks form in a closed rather than open manner" },
          { kr: "", question: "What view is gaining support at the end of the passage?", options: ["examining whether networks are open or closed matters as much as their total quantity", "only the total amount of social capital matters", "social capital should be abolished as a concept", "closed networks are always beneficial"], answer: "examining whether networks are open or closed matters as much as their total quantity" },
        ],
      },
      {
        passage:
          "공식 문서 중심의 역사 서술은 오랫동안 역사학의 표준으로 여겨져 왔지만, 이러한 방법론은 문자 기록을 남기지 못한 계층의 경험을 체계적으로 누락시킨다는 한계를 지닌다. 구술사 연구자들은 문맹률이 높았던 하층민이나 여성, 소수 민족의 목소리를 복원하기 위해 생존자와의 인터뷰를 사료로 적극 활용해 왔다. 다만 구술 증언은 기억의 왜곡이나 시간이 지나며 재구성되는 서사의 영향을 받기 쉽다는 반론도 만만치 않다. 이에 대해 일부 역사가들은 구술사의 목표가 객관적 사실의 재현이 아니라, 당대 사람들이 사건을 어떻게 경험하고 의미화했는지를 드러내는 데 있다고 반박하며, 문헌 사료와 구술 사료를 상호 보완적으로 활용해야 한다고 제안한다.",
        questions: [
          { kr: "", question: "What limitation does document-centered historiography have, according to the passage?", options: ["it systematically omits the experiences of classes who left no written records", "it is too expensive to conduct", "it only covers ancient history", "it cannot be taught in universities"], answer: "it systematically omits the experiences of classes who left no written records" },
          { kr: "", question: "Why do oral history researchers use interviews with survivors?", options: ["to recover the voices of the illiterate, women, and minorities", "to replace all written archives", "to reduce research costs", "to entertain the public"], answer: "to recover the voices of the illiterate, women, and minorities" },
          { kr: "", question: "What counterargument is raised against oral testimony?", options: ["it is vulnerable to memory distortion and narrative reconstruction over time", "it is always more accurate than documents", "no one has ever questioned its reliability", "it cannot be recorded technologically"], answer: "it is vulnerable to memory distortion and narrative reconstruction over time" },
          { kr: "", question: "What do some historians say oral history's real goal is?", options: ["revealing how people experienced and made meaning of events, not reproducing objective fact", "proving oral sources are always superior to documents", "eliminating the use of written archives", "collecting entertaining anecdotes"], answer: "revealing how people experienced and made meaning of events, not reproducing objective fact" },
        ],
      },
      {
        passage:
          "포퓰리즘이라는 용어는 정치 담론에서 흔히 경멸적으로 사용되지만, 정치학자들 사이에서도 그 정의를 둘러싼 합의는 아직 확립되지 않았다. 일부 학자는 포퓰리즘을 순수한 국민과 부패한 엘리트를 대립시키는 이념적 얇은 틀로 규정하며, 이 틀이 좌우 이념과 결합해 다양한 형태로 나타난다고 본다. 반면 다른 학자들은 포퓰리즘을 특정 이념이라기보다 카리스마 있는 지도자가 제도적 매개를 우회해 대중과 직접 소통하는 정치 스타일로 파악한다. 이러한 정의상의 혼란은 실증 연구에도 영향을 미쳐, 어떤 정당을 포퓰리즘으로 분류할지에 대해 연구자마다 상이한 결론에 도달하는 경우가 적지 않다. 결국 포퓰리즘을 분석하려면 먼저 어떤 정의를 채택했는지를 명시하는 작업이 선행되어야 한다는 지적이 나온다.",
        questions: [
          { kr: "", question: "What is one way scholars define populism, according to the passage?", options: ["as a thin ideological frame pitting a pure people against a corrupt elite", "as a strictly economic policy program", "as a synonym for democracy itself", "as a form of government unique to one country"], answer: "as a thin ideological frame pitting a pure people against a corrupt elite" },
          { kr: "", question: "How do other scholars characterize populism instead?", options: ["as a political style of bypassing institutional mediation to communicate directly with the public", "as a purely economic phenomenon", "as an outdated concept no longer used", "as a form unique to authoritarian states"], answer: "as a political style of bypassing institutional mediation to communicate directly with the public" },
          { kr: "", question: "What effect does the definitional confusion have on empirical research?", options: ["researchers often reach different conclusions about which parties count as populist", "it makes populism impossible to study at all", "it has led to a single agreed definition", "it only affects historical, not current, research"], answer: "researchers often reach different conclusions about which parties count as populist" },
          { kr: "", question: "What does the passage suggest is a necessary first step in analyzing populism?", options: ["explicitly stating which definition of populism is being adopted", "banning the term from academic use", "focusing only on left-wing movements", "surveying the general public"], answer: "explicitly stating which definition of populism is being adopted" },
        ],
      },
      {
        passage:
          "탄소 배출권 거래제와 자발적 탄소 상쇄 시장은 기후 위기 대응의 핵심 정책 수단으로 자리 잡았지만, 그 실효성에 대한 검증은 여전히 진행 중이다. 이론적으로 탄소 상쇄는 한 지역에서의 배출을 다른 지역의 감축 사업으로 보전함으로써 전체 배출량을 순 제로에 근접시킨다. 그러나 최근 조사에 따르면 상당수의 산림 보호 기반 상쇄 사업이 애초에 벌목될 위험이 낮았던 숲을 대상으로 선정되어, 실제 감축 효과가 과장되었다는 의혹이 제기되었다. 이러한 문제는 '추가성', 즉 상쇄 사업이 없었더라도 배출 감축이 일어났을지를 검증하기 어렵다는 근본적인 한계에서 비롯된다. 일부 전문가들은 상쇄 시장에 대한 신뢰를 회복하려면 독립적인 제삼자 검증과 표준화된 기준이 시급하다고 주장한다.",
        questions: [
          { kr: "", question: "What is carbon offsetting theoretically supposed to do?", options: ["bring net emissions close to zero by compensating emissions with reduction projects elsewhere", "eliminate all industrial emissions immediately", "replace the need for emissions trading entirely", "only apply to ocean-based projects"], answer: "bring net emissions close to zero by compensating emissions with reduction projects elsewhere" },
          { kr: "", question: "What suspicion was raised about many forest-based offset projects?", options: ["they targeted forests that were unlikely to be logged in the first place", "they caused massive deforestation", "they were located only in cities", "they had no cost at all"], answer: "they targeted forests that were unlikely to be logged in the first place" },
          { kr: "", question: "What fundamental limitation does the passage identify as 'additionality'?", options: ["the difficulty of verifying whether reductions would have happened without the project", "the difficulty of measuring carbon at all", "the high cost of forest land", "the lack of international cooperation"], answer: "the difficulty of verifying whether reductions would have happened without the project" },
          { kr: "", question: "What do some experts say is urgently needed to restore trust in offset markets?", options: ["independent third-party verification and standardized criteria", "abolishing all carbon markets", "lowering the price of carbon credits", "relying solely on government self-reporting"], answer: "independent third-party verification and standardized criteria" },
        ],
      },
      {
        passage:
          "칼 포퍼는 과학과 비과학을 가르는 기준으로 반증 가능성을 제시했다. 그에 따르면 어떤 이론이 과학적이려면 그것을 반박할 수 있는 관찰이 원리적으로 존재해야 하며, 어떠한 경험적 증거로도 반박될 수 없는 주장은 아무리 그럴듯해 보여도 과학의 범주에 들지 않는다. 이 기준은 프로이트의 정신분석학처럼 어떤 결과가 나오든 사후적으로 이론에 끼워 맞출 수 있는 담론을 비판하는 데 유용하게 쓰였다. 그러나 과학철학자들은 이후 이 기준이 지나치게 단순하다고 비판했다. 실제 과학사에서는 반증 사례가 나와도 과학자들이 이론을 곧바로 폐기하지 않고 보조 가설을 수정해 이론을 유지하는 경우가 흔하기 때문이다. 이러한 관찰은 반증 가능성만으로는 실제 과학 활동의 복잡성을 온전히 설명할 수 없다는 결론으로 이어졌다.",
        questions: [
          { kr: "", question: "What criterion did Karl Popper propose for distinguishing science from non-science?", options: ["falsifiability — there must in principle exist observations that could refute a theory", "peer review by other scientists", "mathematical formalization", "public popularity of the theory"], answer: "falsifiability — there must in principle exist observations that could refute a theory" },
          { kr: "", question: "What kind of discourse did this criterion help critique?", options: ["theories that can be fitted to any outcome after the fact, like psychoanalysis", "theories that are too mathematically precise", "theories that are too widely accepted", "theories with no practical applications"], answer: "theories that can be fitted to any outcome after the fact, like psychoanalysis" },
          { kr: "", question: "What criticism did philosophers of science later raise against Popper's criterion?", options: ["scientists often preserve a theory by revising auxiliary hypotheses instead of discarding it after falsification", "no theory has ever been falsified in history", "falsifiability is too difficult to define", "scientists never use auxiliary hypotheses"], answer: "scientists often preserve a theory by revising auxiliary hypotheses instead of discarding it after falsification" },
          { kr: "", question: "What conclusion does this observation lead to?", options: ["falsifiability alone cannot fully explain the complexity of actual scientific activity", "falsifiability is the only valid scientific criterion", "science should abandon empirical testing", "psychoanalysis should be considered fully scientific"], answer: "falsifiability alone cannot fully explain the complexity of actual scientific activity" },
        ],
      },
      {
        passage:
          "세대 간 계층 이동을 측정하는 연구는 흔히 부모와 자녀의 소득 순위를 비교하는 방식에 의존해 왔다. 그러나 이 방법론은 소득이라는 단일 지표에 지나치게 의존한다는 한계를 안고 있다는 비판이 제기된다. 소득만으로는 자산 보유, 교육 수준, 건강 상태, 사회적 지위와 같은 다차원적 요소를 포착하지 못하기 때문이다. 예컨대 소득은 비슷하더라도 상속받은 부동산이나 인적 네트워크의 차이가 자녀 세대의 실질적 기회를 좌우할 수 있다. 이에 일부 연구자들은 소득 이동성 지표를 자산, 교육, 건강을 아우르는 복합 지수로 대체할 것을 제안하지만, 자료 수집의 어려움과 국가 간 비교 가능성 저하라는 실질적 장벽에 부딪히고 있다.",
        questions: [
          { kr: "", question: "What method has intergenerational mobility research typically relied on?", options: ["comparing the income rank of parents and children", "surveying subjective happiness levels", "measuring years of formal schooling only", "tracking migration patterns"], answer: "comparing the income rank of parents and children" },
          { kr: "", question: "What is the criticized limitation of relying on income alone?", options: ["it fails to capture multidimensional factors like assets, education, health, and social status", "it is too expensive to collect", "it cannot be measured across generations", "it only applies to developing countries"], answer: "it fails to capture multidimensional factors like assets, education, health, and social status" },
          { kr: "", question: "What example illustrates the limits of income-based measures?", options: ["similar incomes can mask differences in inherited property or social networks that shape real opportunity", "children always earn more than their parents", "income is impossible to measure accurately", "education levels never affect income"], answer: "similar incomes can mask differences in inherited property or social networks that shape real opportunity" },
          { kr: "", question: "What practical barrier do researchers face in adopting a composite index?", options: ["difficulty of data collection and reduced comparability across countries", "lack of any interest from economists", "governments refusing to fund research", "the index being too simple to be useful"], answer: "difficulty of data collection and reduced comparability across countries" },
        ],
      },
      {
        passage:
          "전통적인 역사 서술에서 식민지 피지배 민중이나 노예, 하층 여성과 같은 '서발턴' 집단의 목소리는 좀처럼 직접 드러나지 않는다. 이들은 대개 지배 세력이 남긴 행정 문서나 재판 기록 속에서 범죄자나 반란자로만 언급될 뿐, 스스로의 언어로 자신의 경험을 기록할 기회를 거의 갖지 못했기 때문이다. 탈식민주의 역사학자들은 이러한 침묵을 단순한 자료 부족이 아니라 아카이브 자체가 권력관계를 반영해 형성된 결과로 해석한다. 이들은 지배자의 문서를 결대로 읽는 대신 '결을 거슬러' 읽음으로써, 기록되지 않은 목소리의 흔적을 재구성하려 시도한다. 다만 이러한 재구성이 얼마나 신뢰할 수 있는가에 대해서는 방법론적 논쟁이 계속되고 있다.",
        questions: [
          { kr: "", question: "How do subaltern groups typically appear in traditional historical documents?", options: ["only as criminals or rebels mentioned in administrative or court records", "as celebrated heroes in official histories", "not mentioned in any archive whatsoever", "as authors of widely read memoirs"], answer: "only as criminals or rebels mentioned in administrative or court records" },
          { kr: "", question: "How do postcolonial historians interpret this silence?", options: ["as a result of the archive itself being shaped by power relations, not just a lack of sources", "as proof that subaltern groups never existed", "as an unavoidable and unimportant gap", "as evidence that colonial rule was benevolent"], answer: "as a result of the archive itself being shaped by power relations, not just a lack of sources" },
          { kr: "", question: "What method do these historians use to reconstruct unrecorded voices?", options: ["reading colonial documents 'against the grain' rather than at face value", "ignoring colonial documents entirely", "relying solely on oral folklore", "translating documents into multiple languages"], answer: "reading colonial documents 'against the grain' rather than at face value" },
          { kr: "", question: "What ongoing debate does the passage mention?", options: ["how reliable such reconstructions of unrecorded voices can be", "whether colonial archives should be destroyed", "whether subaltern studies should be banned from universities", "whether oral history is scientifically valid"], answer: "how reliable such reconstructions of unrecorded voices can be" },
        ],
      },
      {
        passage:
          "선거 제도는 크게 다수대표제와 비례대표제로 나뉘며, 어느 쪽을 채택하느냐에 따라 정당 체계의 형태가 크게 달라진다. 소선거구 다수대표제는 한 지역구에서 최다 득표자만 당선되는 구조로, 군소 정당의 원내 진입을 어렵게 만들어 양당제로 수렴하는 경향이 있다고 알려져 있다. 반면 비례대표제는 정당 득표율에 비례해 의석을 배분함으로써 다양한 정치 세력의 대표성을 높이지만, 군소 정당의 난립으로 연립 정부 구성이 잦아지고 정치적 불안정성이 커질 수 있다는 우려도 제기된다. 이 때문에 상당수 국가는 두 제도를 혼합해 지역 대표성과 비례성을 동시에 확보하려 시도하지만, 혼합형 제도 역시 유권자가 투표 방식을 이해하기 어렵다는 새로운 문제를 낳는다는 지적이 있다.",
        questions: [
          { kr: "", question: "What tendency is single-member-district plurality voting associated with?", options: ["converging toward a two-party system by making it hard for small parties to win seats", "producing highly fragmented multi-party parliaments", "guaranteeing proportional representation", "eliminating elections altogether"], answer: "converging toward a two-party system by making it hard for small parties to win seats" },
          { kr: "", question: "What benefit does proportional representation offer?", options: ["higher representation for diverse political forces based on vote share", "guaranteed single-party majorities", "faster election counting", "elimination of coalition governments"], answer: "higher representation for diverse political forces based on vote share" },
          { kr: "", question: "What concern is raised about proportional representation?", options: ["frequent coalition governments and greater political instability from many small parties", "it always produces authoritarian rule", "it is illegal in most democracies", "it requires no voting at all"], answer: "frequent coalition governments and greater political instability from many small parties" },
          { kr: "", question: "What new problem can mixed electoral systems create?", options: ["voters finding the voting method difficult to understand", "the complete disappearance of regional representation", "an automatic ban on small parties", "the elimination of proportionality entirely"], answer: "voters finding the voting method difficult to understand" },
        ],
      },
      {
        passage:
          "리와일딩, 즉 생태계 재야생화는 인간의 개입을 최소화하고 핵심종을 복원함으로써 자연이 스스로 균형을 되찾도록 돕는 보전 전략이다. 대표적 사례로 옐로스톤 국립공원에 늑대를 재도입한 실험은 늑대가 초식 동물의 개체 수와 행동을 조절함으로써 식생 회복과 하천 생태계 안정으로까지 이어지는 연쇄 효과를 낳았다고 보고되었다. 이러한 성공 사례는 최상위 포식자가 생태계 전체의 구조를 좌우하는 '핵심종'의 역할을 한다는 이론을 뒷받침하는 근거로 널리 인용된다. 그러나 일부 생태학자들은 옐로스톤의 사례가 과도하게 단순화되어 대중에게 전달되었으며, 실제 생태계 회복에는 기후, 인간의 사냥 규제, 다른 요인들도 복합적으로 작용했다고 지적한다. 따라서 리와일딩 정책을 다른 지역에 그대로 적용하기 전에 지역별 생태적 맥락을 면밀히 검토해야 한다는 신중론이 제기된다.",
        questions: [
          { kr: "", question: "What is rewilding as a conservation strategy?", options: ["minimizing human intervention and restoring keystone species so nature can rebalance itself", "planting only non-native species for biodiversity", "converting forests into farmland", "removing all predators from an ecosystem"], answer: "minimizing human intervention and restoring keystone species so nature can rebalance itself" },
          { kr: "", question: "What chain effect did reintroducing wolves to Yellowstone reportedly produce?", options: ["vegetation recovery and stabilization of river ecosystems through control of herbivore populations", "a collapse of the entire park ecosystem", "an increase in wildfires", "no measurable ecological change"], answer: "vegetation recovery and stabilization of river ecosystems through control of herbivore populations" },
          { kr: "", question: "What criticism do some ecologists raise about the Yellowstone story?", options: ["it was oversimplified for the public, and other factors like climate also contributed", "wolves were never actually reintroduced", "the story is entirely fabricated", "predators have no effect on vegetation"], answer: "it was oversimplified for the public, and other factors like climate also contributed" },
          { kr: "", question: "What caution do these ecologists urge before applying rewilding elsewhere?", options: ["carefully examining the ecological context specific to each region", "banning rewilding policies entirely", "applying the Yellowstone model identically everywhere", "removing all top predators as a precaution"], answer: "carefully examining the ecological context specific to each region" },
        ],
      },
      {
        passage:
          "토머스 쿤은 과학의 발전이 지식의 점진적 축적이 아니라 패러다임의 단절적 전환을 통해 이루어진다고 주장했다. 그에 따르면 정상 과학의 시기에는 대다수 과학자들이 지배적 패러다임 안에서 퍼즐을 풀듯 문제를 해결하지만, 기존 패러다임으로 설명되지 않는 변칙 사례가 누적되면 위기가 발생하고, 결국 새로운 패러다임으로의 혁명적 전환이 일어난다. 흥미로운 점은 쿤이 서로 다른 패러다임 사이에는 공통된 척도가 존재하지 않는다는 '공약 불가능성'을 제시했다는 것인데, 이는 뉴턴 역학과 상대성 이론처럼 새 패러다임이 반드시 이전 패러다임보다 객관적으로 우월하다고 단언할 수 없음을 함의한다. 이 주장은 과학의 객관성과 진보 개념을 지나치게 상대화한다는 비판을 받았으며, 오늘날에도 과학철학계에서 뜨거운 논쟁의 대상으로 남아 있다.",
        questions: [
          { kr: "", question: "How did Thomas Kuhn characterize scientific progress?", options: ["as occurring through discontinuous paradigm shifts rather than gradual accumulation", "as a smooth, linear accumulation of facts", "as driven entirely by government funding", "as impossible to describe historically"], answer: "as occurring through discontinuous paradigm shifts rather than gradual accumulation" },
          { kr: "", question: "What happens during a period of 'normal science'?", options: ["most scientists solve puzzle-like problems within the dominant paradigm", "scientists constantly overturn established theories", "no research is conducted", "paradigms shift every year"], answer: "most scientists solve puzzle-like problems within the dominant paradigm" },
          { kr: "", question: "What does Kuhn's concept of 'incommensurability' imply?", options: ["a new paradigm cannot be declared objectively superior to the old one by a common standard", "all paradigms are mathematically identical", "old paradigms are always proven completely wrong", "scientific revolutions never actually occur"], answer: "a new paradigm cannot be declared objectively superior to the old one by a common standard" },
          { kr: "", question: "What criticism has Kuhn's theory received?", options: ["that it overly relativizes the objectivity and progress of science", "that it ignores the existence of scientific revolutions", "that it applies only to physics", "that it has never been debated by philosophers"], answer: "that it overly relativizes the objectivity and progress of science" },
        ],
      },
      {
        passage:
          "사회 규범 위반에 대한 낙인은 공동체의 결속을 유지하는 기능을 한다고 오랫동안 설명되어 왔지만, 사회학자들은 낙인이 누구에게 어떤 방식으로 부과되는지가 균등하지 않다는 점에 주목한다. 동일한 규범 위반이라도 사회적 지위가 높은 사람에게는 관대하게, 주변화된 집단에게는 가혹하게 적용되는 경향이 실증 연구를 통해 반복적으로 확인되었다. 이러한 비대칭성은 낙인이 단순히 규범을 지키기 위한 중립적 장치가 아니라 기존의 권력 구조를 재생산하는 기제로 작동할 수 있음을 시사한다. 일부 학자들은 이에 대응해 낙인 대신 회복적 사법과 같이 가해자의 재통합을 목표로 하는 대안적 접근을 제안하지만, 피해자의 정의감을 충분히 충족시키지 못한다는 반론도 존재한다.",
        questions: [
          { kr: "", question: "What function has stigma for norm violations traditionally been said to serve?", options: ["maintaining community cohesion", "increasing crime rates", "eliminating all social norms", "reducing government authority"], answer: "maintaining community cohesion" },
          { kr: "", question: "What asymmetry have empirical studies repeatedly confirmed about stigma?", options: ["the same violation is treated leniently for high-status people but harshly for marginalized groups", "stigma is applied completely equally to everyone", "only marginalized groups ever violate norms", "high-status people are never stigmatized"], answer: "the same violation is treated leniently for high-status people but harshly for marginalized groups" },
          { kr: "", question: "What does this asymmetry suggest about stigma's function?", options: ["it can reproduce existing power structures rather than acting as a neutral mechanism", "it always operates neutrally regardless of status", "it has been completely eliminated in modern societies", "it only exists in authoritarian countries"], answer: "it can reproduce existing power structures rather than acting as a neutral mechanism" },
          { kr: "", question: "What criticism is raised against restorative justice as an alternative?", options: ["it may not sufficiently satisfy victims' sense of justice", "it always increases crime", "it has never been tried anywhere", "it costs far more than stigma"], answer: "it may not sufficiently satisfy victims' sense of justice" },
        ],
      },
      {
        passage:
          "역사적 사건에 대한 집단 기억은 시간이 지나며 고정되기보다 그 시대의 정치적 필요에 따라 끊임없이 재구성된다. 역사수정주의는 흔히 부정적인 의미로 쓰이지만, 학계에서는 기존 통설을 새로운 사료나 관점으로 재검토하는 정당한 학문적 작업과, 정치적 목적을 위해 사실 자체를 왜곡하는 시도를 구분해야 한다고 강조한다. 문제는 이 둘의 경계가 대중의 눈에는 명확히 드러나지 않는다는 데 있다. 특히 국가가 공교육 교과서 서술을 통제할 수 있는 사회에서는, 특정 사건에 대한 기억이 정권의 정당성을 뒷받침하는 방향으로 편집될 위험이 상존한다. 이 때문에 다수의 역사가들은 사료에 대한 공개적 접근성과 독립적인 검증 체계가 역사 왜곡을 막는 최소한의 안전장치라고 강조한다.",
        questions: [
          { kr: "", question: "How does collective memory of historical events change over time, according to the passage?", options: ["it is continually reconstructed according to the political needs of the era", "it remains completely fixed once recorded", "it disappears entirely within a generation", "it is determined solely by archaeological evidence"], answer: "it is continually reconstructed according to the political needs of the era" },
          { kr: "", question: "What distinction does academia emphasize regarding historical revisionism?", options: ["between legitimate reexamination with new sources and politically motivated distortion of facts", "between ancient and modern history", "between oral and written sources only", "between domestic and foreign historians"], answer: "between legitimate reexamination with new sources and politically motivated distortion of facts" },
          { kr: "", question: "What risk exists in societies where the state controls textbook narratives?", options: ["memory of certain events may be edited to support the regime's legitimacy", "textbooks become too expensive to print", "students learn no history at all", "historians are automatically imprisoned"], answer: "memory of certain events may be edited to support the regime's legitimacy" },
          { kr: "", question: "What do many historians say is a minimal safeguard against historical distortion?", options: ["public access to sources and independent verification systems", "banning all revisionist research", "letting governments write the only accepted history", "abolishing history education entirely"], answer: "public access to sources and independent verification systems" },
        ],
      },
      {
        passage:
          "연방제와 단일 중앙집권 체제는 권력을 지역에 분산시키느냐, 중앙에 집중시키느냐를 두고 오랫동안 대비되어 왔다. 연방제 옹호자들은 지역 정부가 각 지역의 고유한 필요에 더 신속하고 유연하게 대응할 수 있으며, 여러 지역이 상이한 정책을 실험함으로써 성공적인 정책이 다른 지역으로 확산될 여지가 커진다고 주장한다. 반면 중앙집권을 지지하는 이들은 지역 간 정책 격차가 오히려 불평등을 심화시키고, 전국적 위기 상황에서 신속하고 일관된 대응을 어렵게 만든다고 반박한다. 실제로 감염병 대응이나 기후 재난처럼 지역 경계를 넘나드는 문제 앞에서는 연방제의 분산적 구조가 조정 비용을 크게 늘린다는 비판이 제기된 바 있다. 결국 어느 체제가 우월한가는 다루는 문제의 성격에 따라 달라진다는 절충적 견해가 널리 받아들여지고 있다.",
        questions: [
          { kr: "", question: "What advantage do federalism advocates claim regional governments have?", options: ["they can respond more quickly and flexibly to region-specific needs, and successful policies can spread", "they eliminate the need for any national government", "they always produce identical policies nationwide", "they guarantee equal outcomes across all regions"], answer: "they can respond more quickly and flexibly to region-specific needs, and successful policies can spread" },
          { kr: "", question: "What criticism do centralization supporters raise against federalism?", options: ["policy gaps between regions can deepen inequality and hinder consistent national crisis response", "it makes government too efficient", "it is only used in small countries", "it guarantees rapid economic growth"], answer: "policy gaps between regions can deepen inequality and hinder consistent national crisis response" },
          { kr: "", question: "What example is given where federalism's decentralized structure raised coordination costs?", options: ["responses to infectious disease outbreaks or climate disasters that cross regional borders", "local elections", "regional tax collection", "school curriculum design"], answer: "responses to infectious disease outbreaks or climate disasters that cross regional borders" },
          { kr: "", question: "What is the widely accepted conclusion the passage reaches?", options: ["which system is superior depends on the nature of the problem being addressed", "federalism is always superior to centralization", "centralization is always superior to federalism", "the two systems are functionally identical"], answer: "which system is superior depends on the nature of the problem being addressed" },
        ],
      },
      {
        passage:
          "미세플라스틱 오염은 해양 생태계뿐 아니라 인체 건강에도 위협이 될 수 있다는 우려가 커지고 있다. 연구자들은 이미 인간의 혈액과 폐 조직에서까지 미세플라스틱 입자가 검출되었다고 보고했지만, 이 입자들이 실제로 인체에 어떤 장기적 영향을 미치는지에 대해서는 아직 결정적인 인과관계가 규명되지 않았다. 이러한 불확실성에도 불구하고 일부 정책 입안자들은 사전예방 원칙에 따라 플라스틱 생산과 소비를 규제해야 한다고 주장한다. 반면 산업계는 인과관계가 명확히 입증되기 전까지 과도한 규제는 경제적 손실만 초래할 수 있다고 반박한다. 이 논쟁은 과학적 불확실성이 남아 있는 상황에서 정책 결정을 어떻게 내려야 하는가라는 보다 근본적인 질문으로 이어진다.",
        questions: [
          { kr: "", question: "What has raised concern beyond marine ecosystems regarding microplastics?", options: ["a potential threat to human health", "a threat only to freshwater rivers", "an effect only on plant life", "no concern has been raised at all"], answer: "a potential threat to human health" },
          { kr: "", question: "What have researchers reported finding, yet remains scientifically unresolved?", options: ["microplastic particles in human blood and lung tissue, but not their long-term causal effects", "definitive proof that microplastics cause cancer", "that microplastics have completely disappeared from oceans", "that plastic production has already stopped"], answer: "microplastic particles in human blood and lung tissue, but not their long-term causal effects" },
          { kr: "", question: "What principle do some policymakers cite to justify regulating plastics despite uncertainty?", options: ["the precautionary principle", "the principle of free trade", "the principle of majority rule", "the principle of cost-benefit maximization"], answer: "the precautionary principle" },
          { kr: "", question: "What does industry argue against regulation before causation is proven?", options: ["excessive regulation could cause only economic losses", "regulation would have no economic impact at all", "microplastics do not exist", "regulation is scientifically impossible to design"], answer: "excessive regulation could cause only economic losses" },
        ],
      },
      {
        passage:
          "뒤앙-콰인 논제로 알려진 과학철학의 통약 불가능성 주장은, 하나의 가설을 단독으로 검증하는 것은 원리적으로 불가능하며 언제나 배경 가정들의 묶음과 함께 검증될 수밖에 없다고 주장한다. 이 논제에 따르면 실험 결과가 예측과 어긋날 때, 과학자는 핵심 가설을 폐기할 수도 있고 대신 보조 가정 중 하나를 수정할 수도 있어, 어떤 관찰도 단독으로 특정 이론을 결정적으로 반증하지 못한다. 이는 앞서 살펴본 반증 가능성 논의와 긴장 관계에 놓인다. 이러한 '증거에 의한 이론의 미결정성'은 서로 다른 이론이 동일한 관찰 자료와 양립할 수 있음을 뜻하며, 극단적으로 밀고 가면 상대주의로 이어질 위험이 있다는 비판을 받는다. 그럼에도 대다수 과학철학자들은 이 논제가 과학적 추론의 복잡성을 정직하게 드러낸다는 점에서 여전히 유효하다고 평가한다.",
        questions: [
          { kr: "", question: "What does the Duhem-Quine thesis claim about testing a single hypothesis?", options: ["it is impossible in principle — testing always involves a bundle of background assumptions", "any hypothesis can always be tested in complete isolation", "hypotheses cannot be tested at all", "only mathematical hypotheses can be tested"], answer: "it is impossible in principle — testing always involves a bundle of background assumptions" },
          { kr: "", question: "What can scientists do when an experimental result contradicts a prediction, according to the thesis?", options: ["either discard the core hypothesis or revise one of the auxiliary assumptions", "always immediately discard the entire field", "ignore the result permanently", "declare the experiment scientifically invalid"], answer: "either discard the core hypothesis or revise one of the auxiliary assumptions" },
          { kr: "", question: "What does 'underdetermination of theory by evidence' mean?", options: ["different theories can be compatible with the same observational data", "evidence always determines a single correct theory", "theories require no evidence at all", "evidence is entirely subjective and meaningless"], answer: "different theories can be compatible with the same observational data" },
          { kr: "", question: "How do most philosophers of science ultimately regard this thesis?", options: ["as still valid for honestly revealing the complexity of scientific reasoning", "as completely refuted and abandoned", "as proof that science is entirely arbitrary", "as relevant only to psychology"], answer: "as still valid for honestly revealing the complexity of scientific reasoning" },
        ],
      },
      {
        passage:
          "뒤르켐은 급속한 도시화와 산업화가 전통적 규범 체계를 해체하면서 개인이 명확한 행위 기준을 상실하는 상태를 아노미라 명명했다. 그는 아노미가 단순한 심리적 불안이 아니라 사회 구조 변화의 산물이라고 보았으며, 이를 자살률과 같은 사회적 통계 자료로 실증하려 했다. 오늘날 일부 도시사회학자들은 이 개념을 현대 대도시의 익명성과 연결 지어 재조명한다. 이웃 간의 유대가 약화된 대도시에서는 전통적인 지역 공동체가 수행하던 비공식적 사회 통제 기능이 약화되고, 이는 개인의 소외감과 규범 부재로 이어질 수 있다는 것이다. 다만 다른 연구자들은 대도시가 오히려 익명성 덕분에 개인에게 전통적 공동체의 억압적 감시로부터 벗어날 자유를 제공한다고 반박하며, 아노미 개념을 무비판적으로 현대 도시에 적용하는 데 신중해야 한다고 지적한다.",
        questions: [
          { kr: "", question: "What did Durkheim name the state where individuals lose clear behavioral norms amid urbanization?", options: ["anomie", "alienation", "assimilation", "socialization"], answer: "anomie" },
          { kr: "", question: "How did Durkheim try to empirically demonstrate anomie?", options: ["using social statistics such as suicide rates", "conducting laboratory experiments on individuals", "analyzing personal diaries", "measuring income inequality only"], answer: "using social statistics such as suicide rates" },
          { kr: "", question: "How do some urban sociologists reconnect anomie to modern cities?", options: ["weakened neighborhood ties reduce informal social control and can lead to alienation and normlessness", "cities have eliminated anomie entirely through technology", "anomie only applies to rural areas today", "anomie is now measured only through crime statistics"], answer: "weakened neighborhood ties reduce informal social control and can lead to alienation and normlessness" },
          { kr: "", question: "What counterargument do other researchers make?", options: ["anonymity in big cities can free individuals from the oppressive surveillance of traditional communities", "big cities have no anonymity at all", "anomie has been scientifically disproven", "traditional communities never exercised social control"], answer: "anonymity in big cities can free individuals from the oppressive surveillance of traditional communities" },
        ],
      },
      {
        passage:
          "구비 서사시는 문자로 고정되기 전 세대를 거쳐 구송자의 기억과 즉흥적 재구성을 통해 전승되어 왔다. 밀먼 패리와 앨버트 로드의 연구는 호메로스의 서사시가 한 사람의 독창적 창작물이 아니라, 정형화된 어구와 운율 공식을 반복적으로 활용하는 구송 전통의 산물임을 밝혀냈다. 이러한 공식구는 구송자가 방대한 분량의 이야기를 실시간으로 기억하고 재현할 수 있도록 돕는 일종의 인지적 장치였다는 것이다. 이 발견은 문자 문화의 관점에서 저자성과 원본성을 서사시에 투사해 온 기존 해석에 근본적인 의문을 제기했다. 다만 일부 고전학자들은 문자 기록이 등장한 이후에도 구송 공식이 문학적 관습으로 의도적으로 차용되었을 가능성을 배제할 수 없다고 지적하며, 구비성과 문자성을 엄격히 이분법으로 나누는 데 신중을 기해야 한다고 본다.",
        questions: [
          { kr: "", question: "How were oral epics transmitted before being fixed in writing?", options: ["through the memory and improvised recomposition of performers across generations", "through standardized printed manuscripts", "through translations commissioned by kings", "through formal schooling systems"], answer: "through the memory and improvised recomposition of performers across generations" },
          { kr: "", question: "What did Milman Parry and Albert Lord's research reveal about Homer's epics?", options: ["they were products of an oral tradition using repeated formulaic phrases, not one person's original creation", "they were written entirely by one historical author named Homer", "they were composed using modern printing techniques", "they contained no repeated linguistic patterns"], answer: "they were products of an oral tradition using repeated formulaic phrases, not one person's original creation" },
          { kr: "", question: "What function did these formulaic phrases serve for performers?", options: ["a cognitive device helping them remember and recreate vast stories in real time", "a way to disguise their identity", "a purely decorative literary device with no practical use", "a method for teaching children to read"], answer: "a cognitive device helping them remember and recreate vast stories in real time" },
          { kr: "", question: "What caution do some classicists raise about this finding?", options: ["oral formulas may have been deliberately borrowed as a literary convention even after writing emerged", "the finding has been completely disproven", "Homer never existed in any form", "oral tradition ended immediately once writing was invented"], answer: "oral formulas may have been deliberately borrowed as a literary convention even after writing emerged" },
        ],
      },
      {
        passage:
          "사법 심사 제도는 입법부가 제정한 법률이 헌법에 합치하는지를 법원이 판단할 수 있도록 함으로써 권력 분립의 핵심 축을 이룬다. 이 제도를 옹호하는 이들은 다수의 일시적 감정에 휩쓸리기 쉬운 입법부와 달리, 선출되지 않은 법관이 소수자의 기본권을 보다 안정적으로 보호할 수 있다고 주장한다. 그러나 비판자들은 선출되지 않은 사법부가 국민이 선출한 대표의 입법 결정을 뒤집는 것이 민주적 정당성의 결핍이라는 '반다수주의적 난점'을 야기한다고 지적한다. 이러한 긴장은 사법부가 어느 정도까지 적극적으로 정책적 판단에 개입해야 하는가라는 사법 적극주의와 사법 자제주의 사이의 오랜 논쟁으로 이어진다. 결국 두 입장 사이의 균형점은 각국의 헌정사와 정치 문화에 따라 다르게 형성되어 왔다는 것이 비교헌법학자들의 대체적인 평가다.",
        questions: [
          { kr: "", question: "What core function does judicial review serve in the separation of powers?", options: ["allowing courts to determine whether laws passed by the legislature conform to the constitution", "allowing courts to write new laws directly", "allowing the executive to overrule the legislature", "eliminating the need for a constitution"], answer: "allowing courts to determine whether laws passed by the legislature conform to the constitution" },
          { kr: "", question: "What do supporters of judicial review argue?", options: ["unelected judges can more stably protect minority rights than a legislature swayed by majority sentiment", "judges should never have any power over legislation", "elected legislatures are always more trustworthy than courts", "judicial review guarantees perfect outcomes"], answer: "unelected judges can more stably protect minority rights than a legislature swayed by majority sentiment" },
          { kr: "", question: "What is the 'counter-majoritarian difficulty' that critics raise?", options: ["unelected courts overturning decisions of elected representatives lacks democratic legitimacy", "courts always agree with the majority", "legislatures never pass unconstitutional laws", "judicial review has never been challenged"], answer: "unelected courts overturning decisions of elected representatives lacks democratic legitimacy" },
          { kr: "", question: "What do comparative constitutional scholars conclude about the balance between judicial activism and restraint?", options: ["it varies by each country's constitutional history and political culture", "one universal balance point applies to all countries", "judicial restraint is always the correct approach", "judicial activism has been abandoned everywhere"], answer: "it varies by each country's constitutional history and political culture" },
        ],
      },
      {
        passage:
          "외래 침입종 관리 정책은 흔히 토착종 보호라는 명분 아래 침입종의 전면적 박멸을 목표로 설정해 왔다. 그러나 최근 보전 생태학계에서는 이러한 이분법적 접근에 의문이 제기되고 있다. 일부 침입종은 도입된 지 수십 년이 지나면서 이미 지역 생태계의 먹이 사슬과 상호작용 구조에 편입되어, 이를 갑작스럽게 제거할 경우 오히려 생태계 균형이 무너질 수 있다는 것이다. 이러한 관점을 지지하는 학자들은 종의 기원이 아니라 실제로 미치는 생태적 영향을 기준으로 관리 여부를 판단해야 한다고 주장한다. 반면 전통적 입장을 고수하는 학자들은 이러한 접근이 침입종 확산을 방치하는 구실이 될 위험이 있다며, 특히 섬 생태계처럼 취약한 환경에서는 여전히 엄격한 박멸 정책이 필요하다고 반박한다.",
        questions: [
          { kr: "", question: "What goal have invasive species management policies traditionally set?", options: ["complete eradication of invasive species in the name of protecting native species", "encouraging the spread of invasive species", "ignoring invasive species entirely", "relocating native species instead"], answer: "complete eradication of invasive species in the name of protecting native species" },
          { kr: "", question: "What concern has recently been raised about sudden removal of long-established invasive species?", options: ["they may already be integrated into local food chains, and removal could destabilize the ecosystem", "removal is always completely safe and beneficial", "removal is scientifically impossible", "they have no ecological impact at all"], answer: "they may already be integrated into local food chains, and removal could destabilize the ecosystem" },
          { kr: "", question: "What standard do scholars supporting this view propose for management decisions?", options: ["a species' actual ecological impact rather than its origin", "whichever species arrived first", "public opinion polls", "the economic value of the species"], answer: "a species' actual ecological impact rather than its origin" },
          { kr: "", question: "What risk do traditionalist scholars warn this approach poses?", options: ["it could become an excuse to let invasive species spread unchecked, especially in fragile island ecosystems", "it would end all scientific research on ecosystems", "it would make eradication policies mandatory everywhere", "it would eliminate native species entirely"], answer: "it could become an excuse to let invasive species spread unchecked, especially in fragile island ecosystems" },
        ],
      },
      {
        passage:
          "최근 십여 년간 심리학과 생의학을 포함한 여러 실증 과학 분야에서 이른바 '재현성 위기'가 심각한 문제로 대두되었다. 다수의 유명 연구들을 독립적인 연구팀이 동일한 절차로 재현하려 했으나 원래의 결과가 재현되지 않는 사례가 속출한 것이다. 이러한 현상의 원인으로는 통계적으로 유의미한 결과만 선별적으로 보고하는 관행, 표본 크기의 부족, 그리고 새롭고 놀라운 결과를 우선시하는 학술지의 게재 관행이 지목된다. 이에 대응해 일부 학술지는 연구 설계와 가설을 데이터 수집 이전에 미리 등록하도록 요구하는 '사전 등록제'를 도입했으며, 재현 연구 자체를 독립적인 학문적 성과로 인정해야 한다는 목소리도 커지고 있다. 다만 이러한 제도 개혁이 실제로 과학의 신뢰성을 얼마나 회복시킬 수 있을지는 아직 지켜봐야 한다는 신중한 평가도 존재한다.",
        questions: [
          { kr: "", question: "What has emerged as a serious problem across many empirical sciences in recent years?", options: ["the 'reproducibility crisis' — many famous results could not be replicated by independent teams", "a complete lack of funding for scientific research", "the disappearance of peer review", "a shortage of trained scientists"], answer: "the 'reproducibility crisis' — many famous results could not be replicated by independent teams" },
          { kr: "", question: "What practices are cited as causes of the reproducibility crisis?", options: ["selectively reporting only statistically significant results, small sample sizes, and journals favoring surprising findings", "researchers using too large sample sizes", "journals refusing to publish any research", "excessive government regulation of laboratories"], answer: "selectively reporting only statistically significant results, small sample sizes, and journals favoring surprising findings" },
          { kr: "", question: "What is 'preregistration', as introduced by some journals?", options: ["requiring research design and hypotheses to be registered before data collection", "requiring researchers to register with a national database after publication", "requiring peer reviewers to register their identities publicly", "requiring universities to register all funding sources"], answer: "requiring research design and hypotheses to be registered before data collection" },
          { kr: "", question: "What cautious assessment does the passage end with?", options: ["it remains to be seen how much these reforms will actually restore scientific trust", "the reproducibility crisis has already been fully resolved", "preregistration has proven to be a complete failure", "reproducibility is no longer considered important"], answer: "it remains to be seen how much these reforms will actually restore scientific trust" },
        ],
      },
      {
        passage:
          "플랫폼 기반 긱 이코노미의 확산은 노동시장에 유연성을 더했다는 긍정적 평가를 받는 동시에, 노동자를 새로운 방식으로 계층화한다는 우려를 낳고 있다. 알고리즘은 배차나 업무 배정을 자동으로 결정하는데, 이 과정에서 평점이 낮거나 특정 시간대에 활동이 적은 노동자는 점차 양질의 업무 기회로부터 배제되는 경향이 나타난다. 문제는 이러한 배제의 기준이 불투명하게 설계되어 노동자가 자신이 왜 특정 기회에서 배제되었는지 알기 어렵다는 데 있다. 일부 연구자들은 이를 '알고리즘적 관리'라 부르며, 전통적 고용 관계에서는 존재했던 인사 담당자와의 협상이나 이의 제기 절차가 플랫폼 노동에서는 사실상 사라졌다고 지적한다. 이에 따라 알고리즘 결정 과정에 대한 설명 요구권을 노동법에 명문화해야 한다는 제안이 힘을 얻고 있다.",
        questions: [
          { kr: "", question: "What positive evaluation has the spread of platform-based gig work received?", options: ["it added flexibility to the labor market", "it eliminated the need for any regulation", "it guaranteed higher wages for all workers", "it ended unemployment entirely"], answer: "it added flexibility to the labor market" },
          { kr: "", question: "What pattern emerges from algorithmic dispatch and task assignment?", options: ["workers with low ratings or less activity during certain hours are gradually excluded from good opportunities", "all workers receive identical opportunities regardless of rating", "algorithms randomly assign tasks with no pattern", "only new workers are excluded from opportunities"], answer: "workers with low ratings or less activity during certain hours are gradually excluded from good opportunities" },
          { kr: "", question: "What problem does the passage identify with the criteria for exclusion?", options: ["they are designed opaquely, making it hard for workers to know why they were excluded", "they are published openly for all workers to see", "they are decided by a worker vote", "they change too slowly to matter"], answer: "they are designed opaquely, making it hard for workers to know why they were excluded" },
          { kr: "", question: "What proposal is gaining support in response to 'algorithmic management'?", options: ["codifying a right to explanation for algorithmic decisions into labor law", "banning all gig economy platforms", "removing all algorithms from platform work", "eliminating labor law protections entirely"], answer: "codifying a right to explanation for algorithmic decisions into labor law" },
        ],
      },
      {
        passage:
          "고고학 유물의 해석은 발굴된 물건 자체가 스스로 말해 주는 것이 아니라, 해석자가 지닌 이론적 틀과 당대의 문화적 전제에 크게 좌우된다. 예컨대 과거 여러 고분에서 발견된 부장품이 오랫동안 남성 전사의 무덤으로 단정되어 왔으나, 최근 골격에 대한 정밀한 생물고고학적 분석 결과 상당수가 여성의 유해였음이 밝혀진 사례가 보고되었다. 이는 발굴 당시 연구자들이 무기류 부장품을 남성성과 자동적으로 연결 짓는 무의식적 전제를 갖고 있었음을 드러낸다. 이러한 사례는 고고학적 증거의 객관성이 절대적이지 않으며, 해석 과정에서 연구자 자신이 속한 사회의 성별 규범이 개입될 수 있음을 보여 준다. 이에 따라 최근 고고학계에서는 발굴 자료를 재해석할 때 해석자의 이론적 전제를 명시적으로 밝히는 관행이 강조되고 있다.",
        questions: [
          { kr: "", question: "What does the passage say determines the interpretation of archaeological artifacts?", options: ["the interpreter's theoretical framework and contemporary cultural assumptions", "the artifact itself, which speaks for itself objectively", "only the age of the artifact", "government funding priorities"], answer: "the interpreter's theoretical framework and contemporary cultural assumptions" },
          { kr: "", question: "What did recent bioarchaeological analysis reveal about certain grave goods long assumed to belong to male warriors?", options: ["a significant number of the skeletal remains were actually female", "the graves were completely empty", "the weapons were never actually buried", "the graves belonged only to children"], answer: "a significant number of the skeletal remains were actually female" },
          { kr: "", question: "What unconscious assumption does this case reveal researchers held?", options: ["automatically linking weapon-based grave goods with masculinity", "assuming all graves belonged to royalty", "assuming pottery indicates female burials", "assuming no burials contained metal objects"], answer: "automatically linking weapon-based grave goods with masculinity" },
          { kr: "", question: "What practice is now being emphasized in archaeology as a result?", options: ["explicitly stating the interpreter's theoretical assumptions when reinterpreting excavated data", "abandoning all reinterpretation of past excavations", "excluding all gender-related analysis from archaeology", "requiring every excavation to be repeated twice"], answer: "explicitly stating the interpreter's theoretical assumptions when reinterpreting excavated data" },
        ],
      },
    ],
  },
];

export function testForGrade(from: CefrLevel): PromotionTestSpec | null {
  return PROMOTION_TESTS.find((t) => t.from === from) ?? null;
}

export type SkillScores = { listening: number; reading: number; writing: number };

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
};
