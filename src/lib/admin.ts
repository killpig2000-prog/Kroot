// The one owner account — gates the /admin dashboard and any dev/testing
// conveniences (e.g. Pronunciation's chapters-all-unlocked bypass) that
// should never reach a real learner.
const ADMIN_EMAIL = "killpig2000@gmail.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  return (email ?? "").toLowerCase() === ADMIN_EMAIL;
}
