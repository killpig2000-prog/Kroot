"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NameEditor({ userId, name }: { userId: string; name: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next = value.trim().slice(0, 30);
    if (!next || next === name) {
      setEditing(false);
      setValue(name);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: next })
      .eq("id", userId);
    setSaving(false);
    if (!error) {
      setEditing(false);
      router.refresh();
    }
  };

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-1.5">
        {name}
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit name"
          title="Edit name"
          className="text-[12px] text-[#A19A8C] hover:text-[#16A34A] transition-colors"
        >
          ✏️
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        autoFocus
        value={value}
        maxLength={30}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void save();
          if (e.key === "Escape") {
            setEditing(false);
            setValue(name);
          }
        }}
        className="w-[160px] rounded-lg border-[1.5px] border-[#BBF7D0] bg-white px-2 py-0.5 text-sm font-semibold outline-none focus:border-[#16A34A]"
      />
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="rounded-lg bg-[#16A34A] px-2.5 py-1 text-[12px] font-bold text-white hover:bg-[#15803D] transition-colors disabled:opacity-60"
      >
        {saving ? "…" : "Save"}
      </button>
    </span>
  );
}
