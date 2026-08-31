"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 3 * 1024 * 1024;

export default function AvatarUploader({
  userId,
  avatarUrl,
}: {
  userId: string;
  avatarUrl: string | null;
}) {
  const t = useTranslations("profile.avatar");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t("errType"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("errSize", { mb: MAX_BYTES / (1024 * 1024) }));
      return;
    }

    setError(null);
    setUploading(true);
    try {
      await upload(file);
    } catch {
      setError(t("errUpload"));
    } finally {
      setUploading(false);
    }
  }

  async function upload(file: File) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    const bustCache = `${publicUrl}?v=${crypto.randomUUID()}`;

    // The file is in storage, but until the profile row points at it nobody
    // sees the new avatar. Showing it anyway made a failed update look like a
    // save that mysteriously reverted on the next load.
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: bustCache })
      .eq("id", userId);

    if (profileError) {
      setError(profileError.message);
      return;
    }

    setPreview(bustCache);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={t("change")}
        className="relative w-14 h-14 rounded-full overflow-hidden bg-success-bg border border-line flex items-center justify-center text-2xl group"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          "🦊"
        )}
        <span className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
          {uploading ? "…" : t("edit")}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {error && <p className="text-[11px] text-danger font-semibold mt-1 max-w-[110px]">{error}</p>}
    </div>
  );
}
