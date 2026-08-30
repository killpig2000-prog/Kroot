import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { dialogueById } from "@/lib/listening-dialogues";
import { routing } from "@/i18n/routing";

// Clips play inside the situation page (`?clip=`). This route only survives
// for older links — dashboard resume rows, bookmarks — and forwards them.
export default async function DialoguePage({
  params,
}: {
  params: Promise<{ locale: string; situationKey: string; dialogueId: string }>;
}) {
  const { locale, situationKey, dialogueId } = await params;
  const dialogue = dialogueById(dialogueId);
  if (!dialogue || dialogue.situationKey !== situationKey) return notFound();
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  redirect(`${prefix}/listening/${situationKey}?level=${dialogue.level}&clip=${dialogue.id}`);
}
