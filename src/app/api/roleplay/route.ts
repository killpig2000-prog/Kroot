import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";
import { gradeWithGemini } from "@/lib/gemini";
import { trackServer } from "@/lib/analytics";
import { isCefrLevel } from "@/lib/tree";
import {
  MAX_TURNS,
  goalsFor,
  scenarioByKey,
  type RoleplayMessage,
  type RoleplayReply,
} from "@/lib/roleplay";

// One turn of AI roleplay. The whole transcript travels with each request
// (no server-side session), so the handler stays stateless and cheap.
const MAX_KR_CHARS = 300;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    reply_kr: { type: "STRING", description: "Your next line, in Korean only, staying in character." },
    reply_en: { type: "STRING", description: "Natural English translation of reply_kr." },
    correction: {
      type: "OBJECT",
      nullable: true,
      description:
        "Only when the learner's LAST message contains a real grammar or word error. null if it was fine or just short.",
      properties: {
        original: { type: "STRING", description: "The learner's last message, verbatim." },
        corrected: { type: "STRING", description: "The natural, correct Korean version." },
        note: { type: "STRING", description: "One short English sentence naming what changed." },
      },
      required: ["original", "corrected", "note"],
    },
    goals_done: {
      type: "ARRAY",
      description: "Cumulative 0-based indices of goals the learner has now achieved (include previously done ones).",
      items: { type: "INTEGER" },
    },
    finished: {
      type: "BOOLEAN",
      description: "true when all goals are done, or the conversation has naturally ended (goodbye exchanged).",
    },
    praise_en: {
      type: "STRING",
      description: "When finished: one warm, specific sentence of praise in English. Empty string otherwise.",
    },
  },
  required: ["reply_kr", "reply_en", "goals_done", "finished", "praise_en"],
};

const LEVEL_STYLE: Record<string, string> = {
  A1: "Very short, simple sentences (3-7 words). Polite 요-form only. Basic vocabulary. One question at a time.",
  A2: "Short, simple sentences. Polite 요-form. Everyday vocabulary, simple connectors like 그리고/그런데.",
  B1: "Natural everyday sentences of moderate length. Polite speech. Introduce the scenario's complication naturally.",
  B2: "Natural, fluent speech with some idiomatic expressions. Polite speech. Push back gently so the learner has to negotiate.",
  C1: "Fully natural native speech, including indirect expressions and formal register where appropriate. Be a realistic, slightly demanding counterpart.",
  C2: "Native, nuanced speech with idioms and register shifts. Do not simplify. Be a realistic counterpart with real constraints.",
};

function isMessage(m: unknown): m is RoleplayMessage {
  if (!m || typeof m !== "object") return false;
  const { role, kr } = m as { role?: unknown; kr?: unknown };
  return (role === "ai" || role === "user") && typeof kr === "string" && kr.length > 0 && kr.length <= MAX_KR_CHARS;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (isRateLimited("roleplay", user.id, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "rate_limited", message: "You're chatting fast! Give it a minute." },
      { status: 429 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "roleplay_unavailable" }, { status: 503 });

  let body: { situationKey?: unknown; level?: unknown; messages?: unknown; goalsDone?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const scenario = typeof body.situationKey === "string" ? scenarioByKey(body.situationKey) : undefined;
  if (!scenario) return NextResponse.json({ error: "unknown_situation" }, { status: 400 });
  const level = typeof body.level === "string" && isCefrLevel(body.level) ? body.level : "A1";

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0 || messages.length > MAX_TURNS * 2 || !messages.every(isMessage)) {
    return NextResponse.json({ error: "bad_messages" }, { status: 400 });
  }
  if (messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "bad_messages" }, { status: 400 });
  }

  const goals = goalsFor(scenario, level);
  const goalsDone = new Set(
    (Array.isArray(body.goalsDone) ? body.goalsDone : []).filter(
      (g): g is number => Number.isInteger(g) && g >= 0 && g < goals.length
    )
  );
  const userTurns = messages.filter((m) => m.role === "user").length;
  const lastTurn = userTurns >= MAX_TURNS;

  const transcript = messages
    .map((m) => `${m.role === "ai" ? scenario.aiName : "학습자"}: ${m.kr}`)
    .join("\n");

  const prompt = `You are running a Korean-language roleplay for a learner at CEFR level ${level}.

SCENARIO: ${scenario.title}
YOU PLAY: ${scenario.aiRole} (name shown as "${scenario.aiName}")
THE LEARNER PLAYS: ${scenario.learnerRole}

SPEECH STYLE FOR ${level}: ${LEVEL_STYLE[level]}

LEARNER GOALS (0-based index):
${goals.map((g, i) => `${i}. ${g.en}${goalsDone.has(i) ? " — ALREADY DONE" : ""}`).join("\n")}

RULES:
- Stay fully in character. Reply ONLY with what your character would say next, in Korean (reply_kr), plus its English translation (reply_en). No meta commentary, no teaching inside reply_kr.
- Keep reply_kr to 1-2 sentences${level === "A1" || level === "A2" ? " and very simple" : ""}.
- Steer the conversation so the learner gets a natural chance to do the remaining goals, one at a time. Do not do the goals for them.
- Be forgiving of small typos and missing particles — count a goal as done if the intent is clearly communicated in Korean. If the learner writes in English or romanization, gently stay in Korean and do NOT count the goal.
- correction: only if the learner's LAST message has a genuine grammar/vocabulary error a teacher would fix. Otherwise null. Never correct politeness level unless it's rude.
- goals_done must be cumulative (keep the ALREADY DONE ones).
- finished: true when all ${goals.length} goals are done (say a natural closing line), or when both sides have said goodbye.${lastTurn ? "\n- This is the learner's LAST allowed turn: wrap up naturally now and set finished = true." : ""}
- praise_en: when finished, one warm specific sentence in English about what the learner did well. Otherwise "".

TRANSCRIPT SO FAR:
${transcript}

Now produce your next turn as JSON.`;

  const outcome = await gradeWithGemini<RoleplayReply>({ apiKey, prompt, responseSchema: RESPONSE_SCHEMA });
  if (!outcome.ok) {
    return NextResponse.json(
      { error: outcome.error, message: outcome.message ?? "The roleplay partner didn't answer. Try again." },
      { status: outcome.status }
    );
  }

  const r = outcome.result;
  const mergedGoals = [
    ...new Set([
      ...goalsDone,
      ...(Array.isArray(r.goals_done) ? r.goals_done : []).filter(
        (g): g is number => Number.isInteger(g) && g >= 0 && g < goals.length
      ),
    ]),
  ].sort((a, b) => a - b);
  const finished = Boolean(r.finished) || lastTurn || mergedGoals.length === goals.length;

  const reply: RoleplayReply = {
    reply_kr: typeof r.reply_kr === "string" ? r.reply_kr.trim() : "",
    reply_en: typeof r.reply_en === "string" ? r.reply_en.trim() : "",
    correction:
      r.correction &&
      typeof r.correction === "object" &&
      typeof r.correction.corrected === "string" &&
      r.correction.corrected.trim() &&
      r.correction.corrected.trim() !== (r.correction.original ?? "").trim()
        ? {
            original: r.correction.original ?? messages[messages.length - 1].kr,
            corrected: r.correction.corrected.trim(),
            note: typeof r.correction.note === "string" ? r.correction.note : "",
          }
        : null,
    goals_done: mergedGoals,
    finished,
    praise_en: finished && typeof r.praise_en === "string" ? r.praise_en : "",
  };
  if (!reply.reply_kr) {
    return NextResponse.json({ error: "grading_failed", message: "The partner went quiet. Try again." }, { status: 502 });
  }

  if (finished) {
    await trackServer(supabase, user.id, "roleplay_finished", {
      situation: scenario.key,
      level,
      turns: userTurns,
      goals: mergedGoals.length,
    });
  }

  return NextResponse.json(reply);
}
