import { describe, expect, it } from "vitest";
import {
  BAND_PASS,
  PER_BAND,
  TEST_BANDS,
  answerRun,
  buildTest,
  currentQuestion,
  decodePlacement,
  encodePlacement,
  levelFromRun,
  orderForGoal,
  placementFromRun,
  replaceCurrent,
  skippedPlacement,
  startRun,
  type FirstLesson,
  type Run,
} from "./level-test";

function answerBand(run: Run, rights: boolean[]): Run {
  let r = run;
  for (const right of rights) {
    const q = currentQuestion(r)!;
    r = answerRun(r, right ? q.ans : -1);
  }
  return r;
}

describe("buildTest", () => {
  it("draws PER_BAND questions per band, easiest first", () => {
    const paper = buildTest(0);
    expect(paper).toHaveLength(TEST_BANDS.length * PER_BAND);
    for (let i = 1; i < paper.length; i++) expect(paper[i].lv).toBeGreaterThanOrEqual(paper[i - 1].lv);
  });
});

describe("adaptive run", () => {
  it("stops at the first band that can no longer be passed", () => {
    const run = answerBand(startRun(buildTest(1)), [false, false]);
    expect(run.done).toBe(true);
    expect(run.stoppedAt).toBe(1);
    expect(run.answered).toBe(2);
    expect(levelFromRun(run).code).toBe("A1");
  });

  it("moves up as soon as a band is certain", () => {
    const run = answerBand(startRun(buildTest(2)), [true, true]);
    expect(run.done).toBe(false);
    expect(run.band).toBe(2);
    expect(run.passed).toEqual([1]);
    expect(currentQuestion(run)!.lv).toBe(2);
  });

  it("uses the third question when the first two split", () => {
    let run = answerBand(startRun(buildTest(3)), [true, false]);
    expect(run.done).toBe(false);
    expect(run.band).toBe(1);
    run = answerBand(run, [true]);
    expect(run.passed).toEqual([1]);
    expect(run.bandHits).toBe(0);
  });

  it("places a learner who fails B1 at A2 with B1 as the next goal", () => {
    let run = answerBand(startRun(buildTest(4)), [true, true]); // A1
    run = answerBand(run, [true, true]); // A2
    run = answerBand(run, [false, false]); // B1
    expect(run.done).toBe(true);
    const p = placementFromRun(run, "drama");
    expect(p.level).toBe("A2");
    expect(p.stoppedAt).toBe("B1");
    expect(p.total).toBe(6);
    expect(p.skipped).toBe(false);
  });

  it("clears every band to reach C2", () => {
    let run = startRun(buildTest(5));
    for (let b = 0; b < TEST_BANDS.length; b++) run = answerBand(run, Array(BAND_PASS).fill(true));
    expect(run.done).toBe(true);
    expect(run.stoppedAt).toBeNull();
    expect(levelFromRun(run).code).toBe("C2");
  });

  it("ignores answers once done", () => {
    const run = answerBand(startRun(buildTest(6)), [false, false]);
    expect(answerRun(run, 0)).toBe(run);
  });

  it("replaces the current question from the same band without penalty", () => {
    const run = startRun(buildTest(7));
    const before = currentQuestion(run)!;
    const next = replaceCurrent(run);
    const after = currentQuestion(next)!;
    expect(after).not.toBe(before);
    expect(after.lv).toBe(before.lv);
    expect(next.answered).toBe(0);
    expect(next.paper).toHaveLength(run.paper.length);
  });
});

describe("placement", () => {
  it("round-trips through the URL encoding", () => {
    const run = answerBand(startRun(buildTest(8)), [true, true, false, false]);
    const p = placementFromRun(run, "travel");
    expect(decodePlacement(encodePlacement(p))).toEqual(p);
  });

  it("rejects garbage", () => {
    expect(decodePlacement("not-base64!")).toBeNull();
    expect(decodePlacement(null)).toBeNull();
  });

  it("routes non-readers to Hangul", () => {
    expect(skippedPlacement(false, null).route).toBe("hangul");
    expect(skippedPlacement(true, null).route).toBe("A1");
  });
});

describe("orderForGoal", () => {
  const lessons: FirstLesson[] = [
    { href: "/hangul", label: "h", skill: "hangul", minutes: 6 },
    { href: "/g", label: "g", skill: "grammar", minutes: 6 },
    { href: "/w", label: "w", skill: "words", minutes: 8 },
    { href: "/l", label: "l", skill: "listening", minutes: 5 },
  ];
  it("keeps Hangul first and leads with the goal's skill", () => {
    expect(orderForGoal(lessons, "drama").map((l) => l.skill)).toEqual(["hangul", "listening", "grammar", "words"]);
    expect(orderForGoal(lessons, null)).toBe(lessons);
  });
});
