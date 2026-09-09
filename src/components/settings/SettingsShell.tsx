import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";

// The frame every Settings screen shares: the app's sidebar / tab bar, and
// a 560px column with a title. Detail screens get a "‹ Settings" line above
// the title so the way back is always in the same place.

export type ShellUser = {
  displayName: string;
  email: string;
  streakDays: number;
  avatarUrl: string | null;
};

export default function SettingsShell({
  user,
  title,
  back,
  caption,
  children,
}: {
  user: ShellUser;
  title: string;
  /** Label of the parent screen; present on every screen but the first. */
  back?: string;
  /** One quiet line under the title — the reminder screen's schedule. */
  caption?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <Sidebar
          displayName={user.displayName}
          email={user.email}
          streakDays={user.streakDays}
          avatarUrl={user.avatarUrl}
        />

        <main className="min-w-0 px-[clamp(18px,3vw,36px)] pt-[20px] pb-[100px] xl:pb-[60px]">
          <div className="max-w-[560px] flex flex-col gap-[14px]">
            <header className="flex flex-col gap-0.5 pb-1">
              {back ? (
                <Link href="/settings" className="self-start text-[13px] font-bold text-success hover:text-success-deep">
                  ‹ {back}
                </Link>
              ) : null}
              <h1 className="text-[clamp(22px,5vw,28px)] font-bold leading-tight">{title}</h1>
              {caption ? <p className="text-[12.5px] text-muted mt-1">{caption}</p> : null}
            </header>
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
