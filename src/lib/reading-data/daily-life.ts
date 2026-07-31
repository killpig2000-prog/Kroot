import type { RawPassage } from "./types";

export const DAILY_LIFE_PASSAGES: RawPassage[] = [
  {
    level: "A1",
    title_kr: "카페에서",
    title_en: "At the cafe",
    body_kr: "저는 카페에 가요. 커피를 마셔요. 친구도 같이 있어요. 우리는 이야기를 해요.",
    body_en: "I go to a cafe. I drink coffee. My friend is there too. We talk.",
    questions: [
      { question_en: "Where does the person go?", options: ["A cafe", "A school", "A hospital", "Home"], answerIndex: 0 },
      { question_en: "Who is with them?", options: ["A friend", "A teacher", "A sister", "No one"], answerIndex: 0 },
    ],
  },
  {
    level: "A1",
    title_kr: "아침 일과",
    title_en: "Morning routine",
    body_kr: "저는 아침 일곱 시에 일어나요. 얼굴을 씻어요. 아침을 먹어요. 그리고 학교에 가요.",
    body_en: "I wake up at seven in the morning. I wash my face. I eat breakfast. Then I go to school.",
    questions: [
      { question_en: "What time do they wake up?", options: ["7 AM", "8 AM", "9 AM", "6 AM"], answerIndex: 0 },
      { question_en: "What do they do after breakfast?", options: ["Go to school", "Go to sleep", "Watch TV", "Go to work"], answerIndex: 0 },
    ],
  },
  {
    level: "A2",
    title_kr: "주말 계획",
    title_en: "Weekend plans",
    body_kr: "이번 주말에 저는 친구를 만나요. 우리는 영화를 볼 거예요. 그다음에 저녁을 먹을 거예요. 정말 기대돼요.",
    body_en: "This weekend I'm meeting a friend. We're going to watch a movie. After that we'll eat dinner. I'm really looking forward to it.",
    questions: [
      { question_en: "What will they do first?", options: ["Watch a movie", "Eat dinner", "Go home", "Sleep"], answerIndex: 0 },
      { question_en: "How does the person feel?", options: ["Excited", "Bored", "Sad", "Angry"], answerIndex: 0 },
    ],
  },
  {
    level: "A2",
    title_kr: "병원 가는 길",
    title_en: "Going to the hospital",
    body_kr: "저는 오늘 몸이 안 좋아요. 그래서 병원에 가요. 병원은 집에서 가까워요. 버스로 십 분쯤 걸려요.",
    body_en: "I don't feel well today. So I'm going to the hospital. The hospital is close to my house. It takes about ten minutes by bus.",
    questions: [
      { question_en: "Why are they going to the hospital?", options: ["They don't feel well", "For a checkup", "To visit a friend", "For work"], answerIndex: 0 },
      { question_en: "How do they get there?", options: ["By bus", "By subway", "Walking", "By taxi"], answerIndex: 0 },
    ],
  },
  {
    level: "B1",
    title_kr: "새로운 습관",
    title_en: "A new habit",
    body_kr: "저는 요즘 아침마다 운동을 해요. 처음에는 힘들었지만 지금은 습관이 됐어요. 운동을 하면 기분이 좋아져요. 그래서 계속하려고 해요.",
    body_en: "These days I exercise every morning. It was hard at first, but now it's become a habit. Exercising makes me feel good. So I'm going to keep it up.",
    questions: [
      { question_en: "How did the person feel about exercise at first?", options: ["It was hard", "It was easy", "It was boring", "It was fun"], answerIndex: 0 },
      { question_en: "Why do they want to continue?", options: ["It makes them feel good", "Their doctor told them to", "It's cheap", "Their friend does it too"], answerIndex: 0 },
    ],
  },
  {
    level: "B1",
    title_kr: "회사에서 생긴 일",
    title_en: "Something that happened at work",
    body_kr: "오늘 회사에서 실수를 했어요. 중요한 자료를 잘못 보냈어요. 상사님께 죄송하다고 말씀드렸어요. 다행히 큰 문제는 없었어요.",
    body_en: "I made a mistake at work today. I sent the wrong important document. I apologized to my boss. Fortunately, it wasn't a big problem.",
    questions: [
      { question_en: "What mistake did they make?", options: ["Sent the wrong document", "Was late", "Missed a meeting", "Forgot a call"], answerIndex: 0 },
      { question_en: "What happened in the end?", options: ["It wasn't a big problem", "They got fired", "They were promoted", "Nothing happened"], answerIndex: 0 },
    ],
  },
  {
    level: "B2",
    title_kr: "대인관계 고민",
    title_en: "Worrying about a relationship",
    body_kr: "저는 요즘 동료와의 관계 때문에 고민이 많아요. 사소한 오해로 갈등이 생겼거든요. 직접 이야기해서 풀어야 할 것 같아요. 미루면 더 힘들어질 테니까요.",
    body_en: "Lately I've been worrying a lot about my relationship with a coworker. A small misunderstanding caused a conflict. I think I need to talk it out directly. If I put it off, it'll only get harder.",
    questions: [
      { question_en: "What caused the conflict?", options: ["A small misunderstanding", "A big fight", "Money", "A mistake at work"], answerIndex: 0 },
      { question_en: "What does the person plan to do?", options: ["Talk it out directly", "Ignore it", "Quit the job", "Ask a manager to intervene"], answerIndex: 0 },
    ],
  },
  {
    level: "B2",
    title_kr: "효율적인 하루",
    title_en: "An efficient day",
    body_kr: "저는 우선순위를 정하고 하루를 시작해요. 중요한 일부터 처리하면 마음이 편해요. 예전에는 시간 관리가 어려웠지만 이제는 익숙해졌어요. 균형 잡힌 하루가 가장 중요한 것 같아요.",
    body_en: "I set priorities and start my day. Handling important things first puts my mind at ease. Time management used to be hard, but now I'm used to it. I think a balanced day matters most.",
    questions: [
      { question_en: "What does the person do first each day?", options: ["Set priorities", "Check email", "Eat breakfast", "Exercise"], answerIndex: 0 },
      { question_en: "What used to be difficult?", options: ["Time management", "Waking up early", "Making friends", "Cooking"], answerIndex: 0 },
    ],
  },
  {
    level: "C1",
    title_kr: "편견에 대하여",
    title_en: "On prejudice",
    body_kr: "우리는 종종 자신도 모르게 편견을 가지고 사람을 판단해요. 이런 편향은 대인관계에 부정적인 영향을 미칠 수 있어요. 그래서 끊임없이 자기 성찰이 필요해요. 열린 마음으로 사람을 대하는 노력이 중요합니다.",
    body_en: "We often judge people with prejudice without even realizing it. This kind of bias can negatively affect our relationships. That's why constant self-reflection is necessary. Making an effort to treat people with an open mind is important.",
    questions: [
      { question_en: "What can bias negatively affect?", options: ["Relationships", "Health", "Finances", "Weather"], answerIndex: 0 },
      { question_en: "What does the writer say is necessary?", options: ["Self-reflection", "More money", "Less sleep", "Traveling"], answerIndex: 0 },
    ],
  },
  {
    level: "C1",
    title_kr: "사회적 담론",
    title_en: "Social discourse",
    body_kr: "최근 이 주제에 대한 사회적 담론이 활발해지고 있어요. 다양한 여론이 충돌하면서 논란이 커지고 있습니다. 객관적인 시각으로 쟁점을 바라보는 것이 중요해요. 고정관념에서 벗어나야 건설적인 논의가 가능합니다.",
    body_en: "Recently, social discourse on this topic has become active. As diverse public opinions clash, the controversy is growing. It's important to look at the issue objectively. We need to break free from stereotypes for constructive discussion.",
    questions: [
      { question_en: "What is growing according to the passage?", options: ["Controversy", "Trade", "Population", "Traffic"], answerIndex: 0 },
      { question_en: "What must we break free from?", options: ["Stereotypes", "Tradition", "Technology", "Language"], answerIndex: 0 },
    ],
  },
  {
    level: "C2",
    title_kr: "새옹지마",
    title_en: "A blessing in disguise",
    body_kr: "그는 회사에서 해고를 당했지만 오히려 그 일을 계기로 자기 사업을 시작했어요. 몇 년 후 사업은 크게 성공했습니다. 사람들은 그의 이야기를 새옹지마라고 말해요. 위기가 곧 기회가 될 수 있다는 것을 보여준 셈이죠.",
    body_en: "He was laid off from his company, but that became the trigger to start his own business. A few years later, the business became a great success. People call his story a blessing in disguise. It shows that a crisis can become an opportunity.",
    questions: [
      { question_en: "What did he do after being laid off?", options: ["Started his own business", "Retired", "Traveled the world", "Went back to school"], answerIndex: 0 },
      { question_en: "What does his story show?", options: ["A crisis can become an opportunity", "Hard work always fails", "Luck doesn't matter", "Businesses always fail"], answerIndex: 0 },
    ],
  },
  {
    level: "C2",
    title_kr: "우여곡절 끝에",
    title_en: "After many twists and turns",
    body_kr: "이 프로젝트는 정말 우여곡절이 많았어요. 예산 문제부터 인력 부족까지 여러 고비를 넘겼습니다. 결국 팀의 저력으로 시행착오를 극복하고 성공적으로 마무리했어요. 모두가 학수고대하던 순간이었습니다.",
    body_en: "This project really went through many twists and turns. We overcame several crises, from budget issues to staff shortages. In the end, the team's latent strength helped us overcome trial and error and finish successfully. It was a moment everyone had been eagerly awaiting.",
    questions: [
      { question_en: "What problems did the project face?", options: ["Budget and staff shortages", "Weather delays", "Legal issues", "Language barriers"], answerIndex: 0 },
      { question_en: "How did the team succeed?", options: ["Through their latent strength", "By hiring outside help", "By luck", "By canceling half the project"], answerIndex: 0 },
    ],
  },
];
