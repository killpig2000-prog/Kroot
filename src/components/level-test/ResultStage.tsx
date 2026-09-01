"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import TreeEvolution from "@/components/level-test/TreeEvolution";
import {
  COOLDOWN_HOURS,
  SKILL_LABELS,
  testVerdict,
  type ServedPromotionTest,
  type SkillScores,
} from "@/lib/promotion-test";
import { treeStageForLevel } from "@/lib/level";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";

const BTN_GREEN = buttonClassName("success");

export default function ResultStage({
  spec,
  scores,
  promoted,
  playerLevel,
}: {
  spec: ServedPromotionTest;
  scores: SkillScores | null;
  promoted: boolean;
  playerLevel: number;
}) {
  const t = useTranslations("levelTest");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const verdict = scores ? testVerdict(scores) : null;

  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>(spec.to);
  const [busy, setBusy] = useState(false);

  async function applyLevel() {
    if (selectedLevel === spec.to) {
      router.push("/dashboard");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.rpc("apply_level_test", { p_level: selectedLevel });
      if (!error) {
        try {
          localStorage.setItem("kroot-tree-species", selectedLevel);
        } catch {
          // storage blocked
        }
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="border border-line rounded-[14px] p-6">
      {verdict?.passed ? (
        <div className="text-center mb-5">
          <TreeEvolution from={spec.from} to={spec.to} stage={treeStageForLevel(playerLevel)} />
          <b className="text-[19px] block mt-2">{t("result.passedTitle", { level: spec.to })}</b>
          <p className="text-[13.5px] text-muted mt-1">
            {t.rich("result.passedBody", {
              from: t(`species.${spec.from}`),
              to: t(`species.${spec.to}`),
              b: (chunks) => <b>{chunks}</b>,
            })}{" "}
            {promoted
              ? t("result.contentOpen", { level: spec.to })
              : t("result.promotionFailed")}
          </p>
        </div>
      ) : (
        <div className="text-center mb-5">
          <p className="text-[34px] mb-1">🌱</p>
          <b className="text-[19px]">{t("result.failedTitle")}</b>
          <p className="text-[13.5px] text-muted mt-1">{t("result.failedBody", { hours: COOLDOWN_HOURS })}</p>
        </div>
      )}

      {scores && (
        <div className="grid gap-2 mb-4">
          {(Object.keys(scores) as (keyof SkillScores)[]).map((k) => (
            <div key={k} className="flex items-center gap-3">
              <span className="flex-none w-[72px] text-[13px] font-semibold">
                {t(`skills.${k}`)}
              </span>
              <span className="flex-1 h-2.5 rounded-full bg-[var(--tint-stone)] overflow-hidden">
                <span
                  className={`block h-full rounded-full ${scores[k] >= 60 ? "bg-success" : "bg-[#EF4444]"}`}
                  style={{ width: `${scores[k]}%` }}
                />
              </span>
              <b className="flex-none w-9 text-right text-[13px] tabular-nums">{scores[k]}</b>
            </div>
          ))}
        </div>
      )}

      {!verdict?.passed && verdict && (
        <div className="border border-amber-line bg-[var(--tint-amber)] rounded-[12px] px-4 py-3 text-[13.5px] mb-4">
          {t.rich("result.weakest", {
            skill: t(`skills.${verdict.weakest}`),
            b: (chunks) => <b>{chunks}</b>,
          })}{" "}
          <Link href={SKILL_LABELS[verdict.weakest].href} className="font-bold text-success hover:underline">
            {t("result.practice", { skill: t(`skills.${verdict.weakest}`) })}
          </Link>
        </div>
      )}

      {verdict?.passed && (
        <>
          {/* Content preview */}
          <div className="bg-cream rounded-[12px] px-4 py-3.5 mb-4 border border-line">
            <p className="text-[11.5px] font-bold text-faint uppercase tracking-[0.05em] mb-3">
              {t("result.preview", { level: spec.to })}
            </p>
            <p className="text-[12.5px] text-muted mb-3">{t("result.previewNote")}</p>
            <div className="grid gap-2">
              {spec.reading.length > 0 && (
                <div className="text-[12px] bg-white rounded-[9px] px-3 py-2 border border-line">
                  <span className="font-semibold text-charcoal">📖</span> {spec.reading[0].passage.slice(0, 60)}...
                </div>
              )}
              {spec.listening.length > 0 && (
                <div className="text-[12px] bg-white rounded-[9px] px-3 py-2 border border-line">
                  <span className="font-semibold text-charcoal">🎧</span> {spec.listening[0].kr.slice(0, 60)}...
                </div>
              )}
              {spec.writing.length > 0 && (
                <div className="text-[12px] bg-white rounded-[9px] px-3 py-2 border border-line">
                  <span className="font-semibold text-charcoal">✍️</span> {spec.writing[0].prompt_kr}
                </div>
              )}
            </div>
          </div>

          {/* Level adjustment */}
          <div className="bg-[#FEF9F5] rounded-[12px] px-4 py-3.5 mb-4 border border-line">
            <p className="text-[12.5px] font-bold mb-2.5">{t("result.adjustLevel")}</p>
            <p className="text-[11.5px] text-muted mb-3">{t("result.adjustNote")}</p>
            <div className="flex gap-2">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as CefrLevel)}
                disabled={busy}
                className="flex-1 rounded-[9px] border border-line bg-white px-3 py-2 text-[12.5px] font-semibold text-charcoal disabled:opacity-50"
              >
                {LEVEL_ORDER.filter((lv) => {
                  const idx = LEVEL_ORDER.indexOf(lv);
                  const targetIdx = LEVEL_ORDER.indexOf(spec.to);
                  return idx <= targetIdx;
                }).map((lv) => (
                  <option key={lv} value={lv}>
                    {t(`species.${lv}`)}
                  </option>
                ))}
              </select>
              <button
                onClick={applyLevel}
                disabled={busy}
                className={`flex-none px-4 py-2 rounded-[9px] text-[12.5px] font-bold ${
                  busy ? "opacity-50 cursor-not-allowed" : ""
                } ${BTN_GREEN}`}
              >
                {busy ? "..." : t("result.startLevel", { level: t(`species.${selectedLevel}`) })}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="flex gap-2">
        {!verdict?.passed ? (
          <Link href="/dashboard" className={BTN_GREEN}>
            {t("result.backToGarden")}
          </Link>
        ) : (
          <button onClick={() => router.push("/dashboard")} className={BTN_GREEN}>
            {t("result.backToGarden")}
          </button>
        )}
      </div>
    </div>
  );
}
