"use client";

import { Link } from "@/i18n/navigation";
import { track } from "@/lib/analytics";
import { SKILL_ICONS, type ResumeRow } from "@/lib/resume";

// The one big button a returning learner wants: pick up exactly where they
// left off. Falls back to the day's quest when nothing is in progress.
export default function ContinueCard({
  resume,
  fallback,
  quest,
}: {
  resume: ResumeRow | null;
  fallback: { href: string; label: string; detail: string; icon: string };
  /** Today's quest — shown as a footer line when the card resumes something else. */
  quest?: { label: string; href: string; done: boolean };
}) {
  const target = resume
    ? { href: resume.href, label: resume.label, detail: resume.detail ?? "", icon: SKILL_ICONS[resume.skill] ?? "🌱" }
    : fallback;
  const pct = resume?.progress ?? null;
  const ago = resume ? relativeTime(resume.updated_at) : null;
  // When nothing is in progress the card IS the quest, so no footer.
  const questFooter = resume && quest ? quest : null;

  return (
    <div className="mb-[30px]">
    <Link
      href={target.href}
      onClick={() => track("continue_clicked", { skill: resume?.skill ?? "quest", resumed: !!resume })}
      className={`group flex items-center gap-4 rounded-[16px] border-[1.5px] border-success bg-success-bg px-5 py-4 transition-all hover:-translate-y-0.5 hover:bg-[#DCFCE7] ${
        questFooter ? "rounded-b-none" : ""
      }`}
    >
      <span className="flex-none w-12 h-12 rounded-[12px] bg-cream border border-success-line flex items-center justify-center text-[22px] transition-transform group-hover:scale-110">
        {target.icon}
      </span>
      <span className="flex-1 min-w-0">
        <small className="block text-[11.5px] font-bold tracking-[.06em] uppercase text-success-deep">
          {resume ? "Continue where you left off" : "Start today"}
        </small>
        <b className="block font-semibold text-[15.5px] truncate text-charcoal">{target.label}</b>
        <span className="block text-[12.5px] text-[#4D7C5F] truncate">
          {target.detail}
          {ago ? ` · ${ago}` : ""}
        </span>
        {pct !== null && pct > 0 && (
          <span className="mt-1.5 block h-[5px] max-w-[220px] rounded-full bg-cream border border-success-line overflow-hidden">
            <span className="block h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
          </span>
        )}
      </span>
      <span className="flex-none rounded-full bg-success text-white text-[13px] font-bold px-4 py-2 transition-transform group-hover:translate-x-0.5">
        {resume ? "Continue →" : "Go →"}
      </span>
    </Link>
    {questFooter && (
      <Link
        href={questFooter.href}
        className="flex items-center gap-2 rounded-b-[16px] border-[1.5px] border-t-0 border-success-line bg-cream px-5 py-2 text-[12.5px] text-muted hover:bg-warm transition-colors"
      >
        <span aria-hidden="true">🎯</span>
        <span className="flex-1 min-w-0 truncate">
          Today&apos;s quest · <b className="font-semibold text-charcoal">{questFooter.label}</b>
        </span>
        <span className={`flex-none font-semibold ${questFooter.done ? "text-success" : "text-faint"}`}>
          {questFooter.done ? "Done ✓" : "+10 coins →"}
        </span>
      </Link>
    )}
    </div>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 2) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}
