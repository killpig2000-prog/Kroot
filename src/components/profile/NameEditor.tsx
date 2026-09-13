"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import Glyph from "@/components/dashboard/Glyph";

export default function NameEditor({ userId, name }: { userId: string; name: string }) {
  const t = useTranslations("profile.name");
  const ts = useTranslations("settings");
  const tc = useTranslations("common");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const save = async () => {
    const next = value.trim().slice(0, 30);
    if (!next || next === name) {
      setEditing(false);
      setValue(name);
      return;
    }
    setSaving(true);
    setFailed(false);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: next })
        .eq("id", userId);
      if (error) setFailed(true);
      else {
        setEditing(false);
        router.refresh();
      }
    } catch {
      // Stay in edit mode with the draft intact so the save can be retried.
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-1.5">
        {name}
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={t("edit")}
          title={t("edit")}
          className="inline-flex items-center justify-center w-11 h-11 -my-3 -ml-3 text-[12.5px] text-faint hover:text-success transition-colors"
        >
          <Glyph name="pencil" className="w-[13px] h-[13px]" />
        </button>
      </span>
    );
  }

  const cancel = () => {
    setEditing(false);
    setValue(name);
    setFailed(false);
  };

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <input
        autoFocus
        value={value}
        maxLength={30}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void save();
          if (e.key === "Escape") cancel();
        }}
        className="min-w-0 w-[10rem] max-w-full rounded-lg border-[1.5px] border-success-line bg-cream px-2 py-1.5 text-sm font-semibold outline-none focus:border-success"
      />
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="min-h-[44px] rounded-lg bg-success px-3 text-[12.5px] font-bold text-white hover:bg-success-deep transition-colors disabled:opacity-60"
      >
        {saving ? "…" : t("save")}
      </button>
      <button
        type="button"
        onClick={cancel}
        disabled={saving}
        className="min-h-[44px] rounded-lg border border-line px-3 text-[12.5px] font-bold text-muted hover:text-charcoal transition-colors disabled:opacity-60"
      >
        {tc("cancel")}
      </button>
      {failed && (
        <span role="alert" className="text-[12px] font-semibold text-danger">
          {ts("saveFailed")}
        </span>
      )}
    </span>
  );
}
