import type { CefrLevel } from "@/lib/tree";

// 조사 빈칸 — the "particle blank" step that closes a writing chapter.
// The grammar page (68 lessons) left the app in the 2026-09-07 restructure;
// its 은/는 vs 이/가 lesson lives on here as the *reason* shown when a pick is
// wrong, right under the sentence. Rules and examples follow lib/grammar.ts
// `topic-vs-subject` so nothing here contradicts what the app taught before.
// 2026-09-11 (user: "목적어 뒤에는 을를... 있어야 하는데 없어"): this only ever
// blanked 은/는/이/가 — every writing example sentence has objects taking
// 을/를 right there in the text, but the closing quiz never once asked about
// them. Added a matching object-marker set so the blank now covers all
// three families a learner actually needs: topic, subject, object.
//
// Every sentence is chosen so that its context FORCES one particle: an
// answer to "who?/what?", 있다/없다/아니다/되다, a question word, a clause
// under 아무리, a contrast pair — never a bare "X는 Y예요" where 이/가 would
// also pass. 은/는 both fit far too many sentences; a blank that has two
// right answers would make "why it's wrong" a lie. The same bar applies to
// the object items: a topicalized object can drop 을/를 for 은/는 in real
// Korean ("이 책은 읽었어요"), so every object sentence here answers a
// question word or states a plain fact with no contrast set up — nothing
// that would make 은/는 sound natural in the blank.

export type Particle = "은" | "는" | "이" | "가" | "을" | "를";
export const PARTICLE_OPTIONS: Particle[] = ["은", "는", "이", "가", "을", "를"];

export type ParticleItem = {
  id: string;
  level: CefrLevel;
  /** Korean with `__` where the particle goes. */
  kr: string;
  en: string;
  answer: Particle;
  why: { rule: string; examples: string[] };
};

const SHAPE = "After a consonant (받침) the particle is 은 / 이; after a vowel it is 는 / 가.";
const TOPIC = "은/는 marks the topic — \"as for…\" — and hints at a contrast with something else.";
const SUBJECT = "이/가 points at the subject itself: new information, the answer to \"who?\" or \"what?\", and the word before 있다/없다/아니다/되다 and feeling words like 좋다/아프다.";
const OBJECT = "을/를 marks the object — the thing a verb like 먹다/마시다/좋아하다/만나다/보다/사다/배우다 directly acts on. After a consonant it's 을; after a vowel it's 를.";

export const PARTICLE_ITEMS: ParticleItem[] = [
  // ── A1 ────────────────────────────────────────────────────────────────
  {
    id: "a1-1", level: "A1", kr: "저__ 학생이에요.", en: "I'm a student.", answer: "는",
    why: { rule: `Introducing yourself sets the topic, so it takes 은/는. 저 ends in a vowel → 는. ${SHAPE}`,
      examples: ["저는 학생이에요.", "저는 미국 사람이에요.", "선생님은 한국 사람이에요."] },
  },
  {
    id: "a1-2", level: "A1", kr: "선생님__ 한국 사람이에요.", en: "The teacher is Korean.", answer: "은",
    why: { rule: `"The teacher, as for them…" is a topic, so 은/는. 님 ends in a consonant → 은. ${SHAPE}`,
      examples: ["선생님은 한국 사람이에요.", "저는 학생이에요.", "친구는 일본 사람이에요."] },
  },
  {
    id: "a1-3", level: "A1", kr: "누가 왔어요? — 친구__ 왔어요.", en: "Who came? — My friend came.", answer: "가",
    why: { rule: `The answer to "who?" is new information, so it takes 이/가, not 은/는. 친구 ends in a vowel → 가. ${SHAPE}`,
      examples: ["누가 왔어요? — 친구가 왔어요.", "누가 했어요? — 제가 했어요.", "누가 전화했어요? — 엄마가 전화했어요."] },
  },
  {
    id: "a1-4", level: "A1", kr: "시간__ 없어요.", en: "I don't have time.", answer: "이",
    why: { rule: `있어요/없어요 always take 이/가 on the thing that exists or doesn't. 시간 ends in a consonant → 이. ${SHAPE}`,
      examples: ["시간이 없어요.", "돈이 없어요.", "친구가 있어요."] },
  },
  {
    id: "a1-5", level: "A1", kr: "날씨__ 좋아요.", en: "The weather is nice.", answer: "가",
    why: { rule: `Descriptive verbs like 좋다 take 이/가 on the thing being described. 날씨 ends in a vowel → 가. ${SHAPE}`,
      examples: ["날씨가 좋아요.", "기분이 좋아요.", "머리가 아파요."] },
  },
  {
    id: "a1-6", level: "A1", kr: "커피__ 좋아해요. 차는 안 좋아해요.", en: "Coffee I like. Tea I don't.", answer: "는",
    why: { rule: `Two things set against each other take 은/는 on both — the second half already says 차는. 커피 ends in a vowel → 는. ${TOPIC}`,
      examples: ["커피는 좋아해요. 차는 안 좋아해요.", "고기는 먹어요. 생선은 안 먹어요.", "형은 커요. 저는 작아요."] },
  },
  {
    id: "a1-7", level: "A1", kr: "저는 학생__ 아니에요.", en: "I'm not a student.", answer: "이",
    why: { rule: `아니에요 needs 이/가 on the word right before it (X이/가 아니에요). 학생 ends in a consonant → 이. ${SHAPE}`,
      examples: ["저는 학생이 아니에요.", "이건 제 책이 아니에요.", "그 사람은 의사가 아니에요."] },
  },
  {
    id: "a1-8", level: "A1", kr: "뭐가 제일 맛있어요? — 김치__ 제일 맛있어요.", en: "What's the tastiest? — Kimchi is.", answer: "가",
    why: { rule: `The answer to "what?" identifies the subject, so 이/가. 김치 ends in a vowel → 가. ${SUBJECT}`,
      examples: ["뭐가 제일 맛있어요? — 김치가 제일 맛있어요.", "뭐가 문제예요? — 시간이 문제예요.", "누가 왔어요? — 친구가 왔어요."] },
  },
  {
    id: "a1-9", level: "A1", kr: "형__ 키가 커요. 저는 작아요.", en: "My brother is tall. I'm short.", answer: "은",
    why: { rule: `A contrast pair (형 vs 저) takes 은/는 on both sides; 키가 is already the subject inside. 형 ends in a consonant → 은. ${TOPIC}`,
      examples: ["형은 키가 커요. 저는 작아요.", "서울은 물가가 비싸요.", "커피는 좋아해요. 차는 안 좋아해요."] },
  },

  // ── A2 ────────────────────────────────────────────────────────────────
  {
    id: "a2-1", level: "A2", kr: "어제 비__ 왔어요.", en: "It rained yesterday.", answer: "가",
    why: { rule: `Something that simply happened is new information — the subject takes 이/가. 비 ends in a vowel → 가. ${SUBJECT}`,
      examples: ["어제 비가 왔어요.", "눈이 와요.", "갑자기 전화가 왔어요."] },
  },
  {
    id: "a2-2", level: "A2", kr: "방에 고양이__ 있어요.", en: "There's a cat in the room.", answer: "가",
    why: { rule: `있어요 takes 이/가 on what exists. 고양이 ends in a vowel → 가. ${SHAPE}`,
      examples: ["방에 고양이가 있어요.", "집에 강아지가 있어요.", "냉장고에 우유가 없어요."] },
  },
  {
    id: "a2-3", level: "A2", kr: "오늘__ 바쁘지만 내일은 괜찮아요.", en: "Today I'm busy, but tomorrow is fine.", answer: "은",
    why: { rule: `Today vs tomorrow is a contrast, so both take 은/는 — 내일은 is already there. 오늘 ends in a consonant → 은. ${TOPIC}`,
      examples: ["오늘은 바쁘지만 내일은 괜찮아요.", "아침은 안 먹지만 점심은 꼭 먹어요.", "평일은 일하고 주말은 쉬어요."] },
  },
  {
    id: "a2-4", level: "A2", kr: "누가 이 케이크를 만들었어요? — 엄마__ 만들었어요.", en: "Who made this cake? — Mom did.", answer: "가",
    why: { rule: `The answer to "who?" takes 이/가. 엄마 ends in a vowel → 가. ${SUBJECT}`,
      examples: ["누가 만들었어요? — 엄마가 만들었어요.", "누가 왔어요? — 친구가 왔어요.", "누가 이겼어요? — 우리 팀이 이겼어요."] },
  },
  {
    id: "a2-5", level: "A2", kr: "어느 게 더 싸요? — 이 가방__ 더 싸요.", en: "Which one is cheaper? — This bag is.", answer: "이",
    why: { rule: `Picking one out of several ("which one?") is 이/가 territory. 가방 ends in a consonant → 이. ${SUBJECT}`,
      examples: ["어느 게 더 싸요? — 이 가방이 더 싸요.", "어느 게 더 커요? — 저 집이 더 커요.", "뭐가 제일 맛있어요? — 김치가 제일 맛있어요."] },
  },
  {
    id: "a2-6", level: "A2", kr: "머리__ 아파요.", en: "My head hurts.", answer: "가",
    why: { rule: `Feeling/state words like 아프다 take 이/가 on the body part. 머리 ends in a vowel → 가. ${SUBJECT}`,
      examples: ["머리가 아파요.", "배가 아파요.", "목이 아파요."] },
  },
  {
    id: "a2-7", level: "A2", kr: "영어__ 잘하지만 한국어는 아직 어려워요.", en: "English I'm good at, but Korean is still hard.", answer: "는",
    why: { rule: `English vs Korean is a contrast — both sides take 은/는 (한국어는 is already there). 영어 ends in a vowel → 는. ${TOPIC}`,
      examples: ["영어는 잘하지만 한국어는 아직 어려워요.", "커피는 좋아해요. 차는 안 좋아해요.", "형은 키가 커요. 저는 작아요."] },
  },
  {
    id: "a2-8", level: "A2", kr: "지갑__ 없어졌어요.", en: "My wallet is gone.", answer: "이",
    why: { rule: `없어지다 (to disappear) behaves like 없다 — the thing takes 이/가. 지갑 ends in a consonant → 이. ${SHAPE}`,
      examples: ["지갑이 없어졌어요.", "열쇠가 없어졌어요.", "시간이 없어요."] },
  },
  {
    id: "a2-9", level: "A2", kr: "무슨 색__ 제일 좋아요?", en: "Which colour do you like best?", answer: "이",
    why: { rule: `좋다 takes 이/가 on the thing that is liked, and a "which?" question is always 이/가. 색 ends in a consonant → 이. ${SUBJECT}`,
      examples: ["무슨 색이 제일 좋아요?", "어떤 계절이 제일 좋아요?", "날씨가 좋아요."] },
  },

  // ── B1 ────────────────────────────────────────────────────────────────
  {
    id: "b1-1", level: "B1", kr: "문제__ 생겼어요.", en: "A problem has come up.", answer: "가",
    why: { rule: `생기다 announces something new appearing — new information takes 이/가. 문제 ends in a vowel → 가. ${SUBJECT}`,
      examples: ["문제가 생겼어요.", "일이 생겼어요.", "갑자기 전화가 왔어요."] },
  },
  {
    id: "b1-2", level: "B1", kr: "서울__ 물가가 비싸요.", en: "In Seoul, prices are high.", answer: "은",
    why: { rule: `Topic + its own subject: 서울 is what we're talking about (은/는), 물가가 is the subject inside. 서울 ends in a consonant → 은. ${TOPIC}`,
      examples: ["서울은 물가가 비싸요.", "형은 키가 커요.", "한국은 겨울이 추워요."] },
  },
  {
    id: "b1-3", level: "B1", kr: "이 노래__ 누가 불렀어요?", en: "This song — who sang it?", answer: "는",
    why: { rule: `The question already has its subject (누가), so 이 노래 can only be the topic: 은/는. 노래 ends in a vowel → 는. ${TOPIC}`,
      examples: ["이 노래는 누가 불렀어요?", "이 책은 누가 썼어요?", "저 건물은 뭐예요?"] },
  },
  {
    id: "b1-4", level: "B1", kr: "누가 먼저 도착했어요? — 제__ 먼저 도착했어요.", en: "Who arrived first? — I did.", answer: "가",
    why: { rule: `Answering "who?" with yourself uses 제가 (저 + 가 → 제가), never 저는. ${SUBJECT}`,
      examples: ["누가 먼저 도착했어요? — 제가 먼저 도착했어요.", "누가 할래요? — 제가 할게요.", "누가 왔어요? — 친구가 왔어요."] },
  },
  {
    id: "b1-5", level: "B1", kr: "냉장고에 우유__ 하나도 없어요.", en: "There's no milk at all in the fridge.", answer: "가",
    why: { rule: `없어요 takes 이/가 on what's missing. 우유 ends in a vowel → 가. ${SHAPE}`,
      examples: ["냉장고에 우유가 하나도 없어요.", "시간이 없어요.", "방에 고양이가 있어요."] },
  },
  {
    id: "b1-6", level: "B1", kr: "형__ 운동을 좋아하는데 저는 책을 좋아해요.", en: "My brother likes sports, but I like books.", answer: "은",
    why: { rule: `형 vs 저 is a contrast pair — 저는 on the other side gives it away. 형 ends in a consonant → 은. ${TOPIC}`,
      examples: ["형은 운동을 좋아하는데 저는 책을 좋아해요.", "오늘은 바쁘지만 내일은 괜찮아요.", "영어는 잘하지만 한국어는 아직 어려워요."] },
  },
  {
    id: "b1-7", level: "B1", kr: "어떤 계절__ 제일 좋아요?", en: "Which season do you like best?", answer: "이",
    why: { rule: `"Which one?" questions and 좋다 both call for 이/가. 계절 ends in a consonant → 이. ${SUBJECT}`,
      examples: ["어떤 계절이 제일 좋아요?", "무슨 색이 제일 좋아요?", "어느 게 더 싸요? — 이 가방이 더 싸요."] },
  },
  {
    id: "b1-8", level: "B1", kr: "갑자기 전화__ 왔어요.", en: "Suddenly a call came in.", answer: "가",
    why: { rule: `A sudden event is new information — its subject takes 이/가. 전화 ends in a vowel → 가. ${SUBJECT}`,
      examples: ["갑자기 전화가 왔어요.", "어제 비가 왔어요.", "문제가 생겼어요."] },
  },
  {
    id: "b1-9", level: "B1", kr: "질문__ 있으면 언제든지 물어보세요.", en: "If you have a question, ask any time.", answer: "이",
    why: { rule: `있으면 is a form of 있다, which takes 이/가 on the thing that exists. 질문 ends in a consonant → 이. ${SHAPE}`,
      examples: ["질문이 있으면 언제든지 물어보세요.", "시간이 있으면 같이 가요.", "돈이 없어요."] },
  },

  // ── B2 (C1/C2 draw from this pool too) ───────────────────────────────
  {
    id: "b2-1", level: "B2", kr: "그는 결국 의사__ 되었어요.", en: "He eventually became a doctor.", answer: "가",
    why: { rule: `되다 takes 이/가 on what someone becomes (X이/가 되다) — 은/는 can't sit there. 의사 ends in a vowel → 가. ${SUBJECT}`,
      examples: ["그는 결국 의사가 되었어요.", "동생은 선생님이 됐어요.", "저는 학생이 아니에요."] },
  },
  {
    id: "b2-2", level: "B2", kr: "이번 실패는 노력__ 부족해서가 아니에요.", en: "This failure wasn't from a lack of effort.", answer: "이",
    why: { rule: `Inside an embedded clause (노력이 부족해서) the subject takes 이/가; 은/는 belongs to the main topic, which 실패는 already took. 노력 ends in a consonant → 이. ${SUBJECT}`,
      examples: ["이번 실패는 노력이 부족해서가 아니에요.", "문제는 돈이 아니라 시간이에요.", "저는 시간이 없어서 못 갔어요."] },
  },
  {
    id: "b2-3", level: "B2", kr: "이론__ 알겠는데 실제로 하기는 어려워요.", en: "The theory I get, but actually doing it is hard.", answer: "은",
    why: { rule: `Theory vs practice is a contrast — the other side already carries 는 (하기는). 이론 ends in a consonant → 은. ${TOPIC}`,
      examples: ["이론은 알겠는데 실제로 하기는 어려워요.", "말은 쉽지만 행동은 어려워요.", "영어는 잘하지만 한국어는 아직 어려워요."] },
  },
  {
    id: "b2-4", level: "B2", kr: "누가 이 프로젝트를 맡을 거예요? — 김 대리__ 맡기로 했어요.", en: "Who will take this project? — Mr. Kim will.", answer: "가",
    why: { rule: `The answer to "who?" takes 이/가. 대리 ends in a vowel → 가. ${SUBJECT}`,
      examples: ["누가 맡을 거예요? — 김 대리가 맡기로 했어요.", "누가 먼저 도착했어요? — 제가 먼저 도착했어요.", "누가 왔어요? — 친구가 왔어요."] },
  },
  {
    id: "b2-5", level: "B2", kr: "무엇__ 가장 중요한지 다시 생각해 봐야 해요.", en: "We should think again about what matters most.", answer: "이",
    why: { rule: `A question word (무엇, 누구, 어느) as subject always takes 이/가 — it is by definition unknown, so it can't be a topic. 무엇 ends in a consonant → 이. ${SUBJECT}`,
      examples: ["무엇이 가장 중요한지 다시 생각해 봐야 해요.", "누가 옳은지 아직 몰라요.", "어떤 계절이 제일 좋아요?"] },
  },
  {
    id: "b2-6", level: "B2", kr: "요즘__ 예전만큼 시간이 많지 않아요.", en: "These days I don't have as much time as before.", answer: "은",
    why: { rule: `A time frame set against another (요즘 vs 예전) is a topic with contrast: 은/는. 시간이 is the subject inside. 요즘 ends in a consonant → 은. ${TOPIC}`,
      examples: ["요즘은 예전만큼 시간이 많지 않아요.", "오늘은 바쁘지만 내일은 괜찮아요.", "서울은 물가가 비싸요."] },
  },
  {
    id: "b2-7", level: "B2", kr: "아무리 계획__ 좋아도 실행하지 않으면 소용없어요.", en: "However good the plan, it's useless if you don't act on it.", answer: "이",
    why: { rule: `Under 아무리 … -아/어도 the clause subject takes 이/가; the topic marker can't reach inside a concessive clause. 계획 ends in a consonant → 이. ${SUBJECT}`,
      examples: ["아무리 계획이 좋아도 실행하지 않으면 소용없어요.", "아무리 날씨가 나빠도 갈 거예요.", "질문이 있으면 언제든지 물어보세요."] },
  },
  {
    id: "b2-8", level: "B2", kr: "문제는 돈__ 아니라 시간이에요.", en: "The problem isn't money, it's time.", answer: "이",
    why: { rule: `X이/가 아니라 Y — 아니다 always takes 이/가 on the thing denied; the topic slot is already taken by 문제는. 돈 ends in a consonant → 이. ${SUBJECT}`,
      examples: ["문제는 돈이 아니라 시간이에요.", "저는 학생이 아니에요.", "이번 실패는 노력이 부족해서가 아니에요."] },
  },
  {
    id: "b2-9", level: "B2", kr: "결과보다 과정__ 더 중요하다고 생각해요.", en: "I think the process matters more than the result.", answer: "이",
    why: { rule: `Picking one thing over another with -보다 identifies the subject: 이/가. 과정 ends in a consonant → 이. ${SUBJECT}`,
      examples: ["결과보다 과정이 더 중요하다고 생각해요.", "어느 게 더 싸요? — 이 가방이 더 싸요.", "무엇이 가장 중요한지 다시 생각해 봐야 해요."] },
  },

  // ── A1 objects (을/를) ───────────────────────────────────────────────
  {
    id: "a1-o1", level: "A1", kr: "뭐 마셔요? — 저는 물__ 마셔요.", en: "What do you drink? — I drink water.", answer: "을",
    why: { rule: `The answer to "what?" names the thing acted on — the object takes 을/를. 물 ends in a consonant → 을. ${OBJECT}`,
      examples: ["뭐 마셔요? — 저는 물을 마셔요.", "뭐 먹어요? — 저는 빵을 먹어요.", "뭐 읽어요? — 저는 책을 읽어요."] },
  },
  {
    id: "a1-o2", level: "A1", kr: "뭐 좋아해요? — 저는 사과__ 좋아해요.", en: "What do you like? — I like apples.", answer: "를",
    why: { rule: `좋아하다 needs an object — the thing liked takes 을/를. 사과 ends in a vowel → 를. ${OBJECT}`,
      examples: ["뭐 좋아해요? — 저는 사과를 좋아해요.", "뭐 봐요? — 저는 영화를 봐요.", "뭘 마시고 싶어요? — 저는 커피를 마시고 싶어요."] },
  },
  {
    id: "a1-o3", level: "A1", kr: "뭐 읽어요? — 저는 책__ 읽어요.", en: "What are you reading? — I'm reading a book.", answer: "을",
    why: { rule: `읽다 takes an object — the thing read. 책 ends in a consonant → 을. ${OBJECT}`,
      examples: ["뭐 읽어요? — 저는 책을 읽어요.", "뭐 먹어요? — 저는 빵을 먹어요.", "뭐 마셔요? — 저는 물을 마셔요."] },
  },
  {
    id: "a1-o4", level: "A1", kr: "뭐 봐요? — 저는 영화__ 봐요.", en: "What are you watching? — I'm watching a movie.", answer: "를",
    why: { rule: `보다 takes an object — the thing watched. 영화 ends in a vowel → 를. ${OBJECT}`,
      examples: ["뭐 봐요? — 저는 영화를 봐요.", "뭐 좋아해요? — 저는 사과를 좋아해요.", "뭘 마시고 싶어요? — 저는 커피를 마시고 싶어요."] },
  },
  {
    id: "a1-o5", level: "A1", kr: "뭐 먹어요? — 저는 빵__ 먹어요.", en: "What are you eating? — I'm eating bread.", answer: "을",
    why: { rule: `먹다 takes an object — the thing eaten. 빵 ends in a consonant → 을. ${OBJECT}`,
      examples: ["뭐 먹어요? — 저는 빵을 먹어요.", "뭐 읽어요? — 저는 책을 읽어요.", "뭐 마셔요? — 저는 물을 마셔요."] },
  },
  {
    id: "a1-o6", level: "A1", kr: "뭘 마시고 싶어요? — 저는 커피__ 마시고 싶어요.", en: "What do you want to drink? — I want to drink coffee.", answer: "를",
    why: { rule: `마시다 takes an object — the thing drunk. 커피 ends in a vowel → 를. ${OBJECT}`,
      examples: ["뭘 마시고 싶어요? — 저는 커피를 마시고 싶어요.", "뭐 좋아해요? — 저는 사과를 좋아해요.", "뭐 봐요? — 저는 영화를 봐요."] },
  },

  // ── A2 objects (을/를) ───────────────────────────────────────────────
  {
    id: "a2-o1", level: "A2", kr: "뭘 만들었어요? — 저는 케이크__ 만들었어요.", en: "What did you make? — I made a cake.", answer: "를",
    why: { rule: `만들다 takes an object — the thing made. 케이크 ends in a vowel → 를. ${OBJECT}`,
      examples: ["뭘 만들었어요? — 저는 케이크를 만들었어요.", "뭘 찾아요? — 저는 열쇠를 찾아요.", "뭘 정리했어요? — 저는 가구를 정리했어요."] },
  },
  {
    id: "a2-o2", level: "A2", kr: "뭘 샀어요? — 저는 신발__ 샀어요.", en: "What did you buy? — I bought shoes.", answer: "을",
    why: { rule: `사다 takes an object — the thing bought. 신발 ends in a consonant → 을. ${OBJECT}`,
      examples: ["뭘 샀어요? — 저는 신발을 샀어요.", "뭘 잃어버렸어요? — 저는 지갑을 잃어버렸어요.", "뭘 배웠어요? — 저는 한국말을 배웠어요."] },
  },
  {
    id: "a2-o3", level: "A2", kr: "뭘 찾아요? — 저는 열쇠__ 찾아요.", en: "What are you looking for? — I'm looking for my keys.", answer: "를",
    why: { rule: `찾다 takes an object — the thing looked for. 열쇠 ends in a vowel → 를. ${OBJECT}`,
      examples: ["뭘 찾아요? — 저는 열쇠를 찾아요.", "뭘 만들었어요? — 저는 케이크를 만들었어요.", "뭘 정리했어요? — 저는 가구를 정리했어요."] },
  },
  {
    id: "a2-o4", level: "A2", kr: "뭘 배웠어요? — 저는 한국말__ 배웠어요.", en: "What did you learn? — I learned Korean.", answer: "을",
    why: { rule: `배우다 takes an object — the thing learned. 한국말 ends in a consonant → 을. ${OBJECT}`,
      examples: ["뭘 배웠어요? — 저는 한국말을 배웠어요.", "뭘 샀어요? — 저는 신발을 샀어요.", "뭘 잃어버렸어요? — 저는 지갑을 잃어버렸어요."] },
  },
  {
    id: "a2-o5", level: "A2", kr: "뭘 잃어버렸어요? — 저는 지갑__ 잃어버렸어요.", en: "What did you lose? — I lost my wallet.", answer: "을",
    why: { rule: `잃어버리다 takes an object — the thing lost. 지갑 ends in a consonant → 을. ${OBJECT}`,
      examples: ["뭘 잃어버렸어요? — 저는 지갑을 잃어버렸어요.", "뭘 배웠어요? — 저는 한국말을 배웠어요.", "뭘 샀어요? — 저는 신발을 샀어요."] },
  },
  {
    id: "a2-o6", level: "A2", kr: "뭘 정리했어요? — 저는 가구__ 정리했어요.", en: "What did you organize? — I organized the furniture.", answer: "를",
    why: { rule: `정리하다 takes an object — the thing organized. 가구 ends in a vowel → 를. ${OBJECT}`,
      examples: ["뭘 정리했어요? — 저는 가구를 정리했어요.", "뭘 찾아요? — 저는 열쇠를 찾아요.", "뭘 만들었어요? — 저는 케이크를 만들었어요."] },
  },

  // ── B1 objects (을/를) ───────────────────────────────────────────────
  {
    id: "b1-o1", level: "B1", kr: "저는 어제 새로 나온 영화__ 봤어요.", en: "Yesterday I watched a newly released movie.", answer: "를",
    why: { rule: `보다 takes an object — a plain statement with no contrast set up, so it stays 을/를, never 은/는. 영화 ends in a vowel → 를. ${OBJECT}`,
      examples: ["저는 어제 새로 나온 영화를 봤어요.", "저는 이번 학기에 새로운 언어를 배우고 있어요.", "저는 주말에 어려운 문제를 풀었어요."] },
  },
  {
    id: "b1-o2", level: "B1", kr: "저는 지난주에 친구 생일 선물__ 준비했어요.", en: "Last week I prepared a birthday gift for my friend.", answer: "을",
    why: { rule: `준비하다 takes an object — the thing prepared. 선물 ends in a consonant → 을. ${OBJECT}`,
      examples: ["저는 지난주에 친구 생일 선물을 준비했어요.", "저는 아침에 중요한 이메일을 확인했어요.", "저는 방학 동안 재미있는 책을 여러 권 읽었어요."] },
  },
  {
    id: "b1-o3", level: "B1", kr: "저는 이번 학기에 새로운 언어__ 배우고 있어요.", en: "This semester I'm learning a new language.", answer: "를",
    why: { rule: `배우다 takes an object — the thing learned. 언어 ends in a vowel → 를. ${OBJECT}`,
      examples: ["저는 이번 학기에 새로운 언어를 배우고 있어요.", "저는 어제 새로 나온 영화를 봤어요.", "저는 주말에 어려운 문제를 풀었어요."] },
  },
  {
    id: "b1-o4", level: "B1", kr: "저는 아침에 중요한 이메일__ 확인했어요.", en: "In the morning I checked an important email.", answer: "을",
    why: { rule: `확인하다 takes an object — the thing checked. 이메일 ends in a consonant → 을. ${OBJECT}`,
      examples: ["저는 아침에 중요한 이메일을 확인했어요.", "저는 지난주에 친구 생일 선물을 준비했어요.", "저는 방학 동안 재미있는 책을 여러 권 읽었어요."] },
  },
  {
    id: "b1-o5", level: "B1", kr: "저는 주말에 어려운 문제__ 풀었어요.", en: "On the weekend I solved a difficult problem.", answer: "를",
    why: { rule: `풀다 takes an object — the thing solved. 문제 ends in a vowel → 를. ${OBJECT}`,
      examples: ["저는 주말에 어려운 문제를 풀었어요.", "저는 이번 학기에 새로운 언어를 배우고 있어요.", "저는 어제 새로 나온 영화를 봤어요."] },
  },
  {
    id: "b1-o6", level: "B1", kr: "저는 방학 동안 재미있는 책__ 여러 권 읽었어요.", en: "During the vacation I read several interesting books.", answer: "을",
    why: { rule: `읽다 takes an object — the thing read. 책 ends in a consonant → 을. ${OBJECT}`,
      examples: ["저는 방학 동안 재미있는 책을 여러 권 읽었어요.", "저는 아침에 중요한 이메일을 확인했어요.", "저는 지난주에 친구 생일 선물을 준비했어요."] },
  },

  // ── B2 objects (을/를, C1/C2 draw from this pool too) ────────────────
  {
    id: "b2-o1", level: "B2", kr: "정부는 새로운 정책__ 발표했어요.", en: "The government announced a new policy.", answer: "을",
    why: { rule: `발표하다 takes an object — the thing announced; the topic slot is already taken by 정부는. 정책 ends in a consonant → 을. ${OBJECT}`,
      examples: ["정부는 새로운 정책을 발표했어요.", "위원회는 그 제안을 검토하고 있어요.", "그는 마침내 오랜 꿈을 이루었어요."] },
  },
  {
    id: "b2-o2", level: "B2", kr: "회사는 이번 분기에 좋은 성과__ 거두었어요.", en: "The company achieved good results this quarter.", answer: "를",
    why: { rule: `거두다 takes an object — the thing achieved. 성과 ends in a vowel → 를. ${OBJECT}`,
      examples: ["회사는 이번 분기에 좋은 성과를 거두었어요.", "연구팀은 흥미로운 결과를 발견했어요.", "학생들은 발표 자료를 준비했어요."] },
  },
  {
    id: "b2-o3", level: "B2", kr: "연구팀은 흥미로운 결과__ 발견했어요.", en: "The research team discovered an interesting result.", answer: "를",
    why: { rule: `발견하다 takes an object — the thing discovered. 결과 ends in a vowel → 를. ${OBJECT}`,
      examples: ["연구팀은 흥미로운 결과를 발견했어요.", "회사는 이번 분기에 좋은 성과를 거두었어요.", "학생들은 발표 자료를 준비했어요."] },
  },
  {
    id: "b2-o4", level: "B2", kr: "위원회는 그 제안__ 검토하고 있어요.", en: "The committee is reviewing that proposal.", answer: "을",
    why: { rule: `검토하다 takes an object — the thing reviewed. 제안 ends in a consonant (안 has 받침 ㄴ) → 을. ${OBJECT}`,
      examples: ["위원회는 그 제안을 검토하고 있어요.", "정부는 새로운 정책을 발표했어요.", "그는 마침내 오랜 꿈을 이루었어요."] },
  },
  {
    id: "b2-o5", level: "B2", kr: "그는 마침내 오랜 꿈__ 이루었어요.", en: "He finally achieved his long-held dream.", answer: "을",
    why: { rule: `이루다 takes an object — the thing achieved. 꿈 ends in a consonant → 을. ${OBJECT}`,
      examples: ["그는 마침내 오랜 꿈을 이루었어요.", "정부는 새로운 정책을 발표했어요.", "위원회는 그 제안을 검토하고 있어요."] },
  },
  {
    id: "b2-o6", level: "B2", kr: "학생들은 발표 자료__ 준비했어요.", en: "The students prepared presentation materials.", answer: "를",
    why: { rule: `준비하다 takes an object — the thing prepared. 자료 ends in a vowel → 를. ${OBJECT}`,
      examples: ["학생들은 발표 자료를 준비했어요.", "회사는 이번 분기에 좋은 성과를 거두었어요.", "연구팀은 흥미로운 결과를 발견했어요."] },
  },
];

const isObjectAnswer = (p: Particle) => p === "을" || p === "를";

/** Spread the object items evenly through the rest so a run of `count`
 * consecutive items (one chapter) usually includes one of each kind,
 * instead of every object item landing in the same handful of chapters. */
function interleaveByFamily(items: ParticleItem[]): ParticleItem[] {
  const rest = items.filter((i) => !isObjectAnswer(i.answer));
  const objects = items.filter((i) => isObjectAnswer(i.answer));
  if (objects.length === 0) return rest;
  const ratio = rest.length / objects.length;
  const out: ParticleItem[] = [];
  let taken = 0;
  objects.forEach((o, i) => {
    const want = Math.round((i + 1) * ratio) - taken;
    for (let k = 0; k < want; k++) out.push(rest[taken + k]);
    taken += want;
    out.push(o);
  });
  while (taken < rest.length) out.push(rest[taken++]);
  return out;
}

/** C1/C2 have no items of their own — the B2 pool is the hardest one. */
export function particlePool(level: CefrLevel): ParticleItem[] {
  const own = PARTICLE_ITEMS.filter((p) => p.level === level);
  return interleaveByFamily(own.length ? own : PARTICLE_ITEMS.filter((p) => p.level === "B2"));
}

/** The chapter's three items — deterministic per (level, chapter) so a reload shows the same set. */
export function particlesForChapter(level: CefrLevel, chapterIndex: number, count = 3): ParticleItem[] {
  const pool = particlePool(level);
  const start = (chapterIndex * count) % pool.length;
  return Array.from({ length: Math.min(count, pool.length) }, (_, i) => pool[(start + i) % pool.length]);
}

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;

/** True when a syllable ends in a final consonant (받침). */
export function hasBatchim(char: string): boolean {
  const c = char.charCodeAt(0);
  if (c < HANGUL_BASE || c > HANGUL_END) return false;
  return (c - HANGUL_BASE) % 28 !== 0;
}

/** The noun the blank attaches to — the Hangul run right before `__`. */
export function stemBefore(kr: string): string {
  const before = kr.split("__")[0] ?? "";
  const m = before.match(/[가-힣]+$/);
  return m ? m[0] : before.trim();
}

type Family = "topic" | "subject" | "object";
function family(p: Particle): Family {
  if (p === "은" || p === "는") return "topic";
  if (p === "이" || p === "가") return "subject";
  return "object";
}
// The one particle each family takes after a consonant vs a vowel — used
// both for the shape check and to name "the right one" in an explanation.
const CONSONANT_FORM: Record<Family, Particle> = { topic: "은", subject: "이", object: "을" };
const VOWEL_FORM: Record<Family, Particle> = { topic: "는", subject: "가", object: "를" };
const FAMILY_ROLE: Record<Family, string> = {
  topic: 'the topic ("as for…")',
  subject: "the subject",
  object: "the object — the thing a verb acts on",
};

export type WrongExplanation = { headline: string; rule: string; examples: string[] };

/**
 * Why the learner's pick is wrong, in the order a person would say it: the
 * shape mismatch first when they had the right *kind* of particle (은 for
 * 는), otherwise which of topic/subject/object this sentence actually needs
 * — then the sentence's own rule.
 */
export function explainWrong(item: ParticleItem, picked: Particle): WrongExplanation {
  const stem = stemBefore(item.kr);
  const last = stem.slice(-1);
  const consonant = hasBatchim(last);
  const pickedFamily = family(picked);
  const answerFamily = family(item.answer);
  const rightForm = consonant ? CONSONANT_FORM[answerFamily] : VOWEL_FORM[answerFamily];
  const shapeNote = `${stem} ends in a ${consonant ? "consonant (받침)" : "vowel"}, so here it's ${rightForm}.`;

  let headline: string;
  if (pickedFamily === answerFamily) {
    // right family, wrong shape
    headline = `${picked} is the right kind of particle but the wrong shape. ${shapeNote}`;
  } else {
    headline = `${picked} marks ${stem} as ${FAMILY_ROLE[pickedFamily]}, but this sentence needs it as ${FAMILY_ROLE[answerFamily]} — ${item.answer}.`;
    const pickedShapeMatches = (consonant ? CONSONANT_FORM[pickedFamily] : VOWEL_FORM[pickedFamily]) === picked;
    if (!pickedShapeMatches) headline += ` (also: ${shapeNote})`;
  }
  return { headline, rule: item.why.rule, examples: item.why.examples };
}

/** Wrong-pick sanity: every item's answer must match its stem's 받침. Used by tests/dev only. */
export function itemShapeOk(item: ParticleItem): boolean {
  const consonant = hasBatchim(stemBefore(item.kr).slice(-1));
  const expected = consonant ? CONSONANT_FORM[family(item.answer)] : VOWEL_FORM[family(item.answer)];
  return expected === item.answer;
}
