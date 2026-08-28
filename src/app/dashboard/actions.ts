"use server";

import { cookies } from "next/headers";
import { SHOW_ALL_COOKIE } from "@/lib/first-visit";

// Escape hatch for the first-visit dashboard: remember that this browser
// wants the full Garden. A cookie (not localStorage) so the server component
// renders the right layout on the first byte — no flash of the gated view.
// Setting a cookie in a server action re-renders the current page.
export async function showEverything(): Promise<void> {
  const store = await cookies();
  store.set(SHOW_ALL_COOKIE, "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}
