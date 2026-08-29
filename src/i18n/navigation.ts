import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// locale-aware Link, usePathname, useRouter, getPathname
// Drop-in replacements for next/link and next/navigation.
export const {
  Link,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing);

// next-intl's own server-side redirect() requires an explicit `locale` arg
// (not inferred), which would mean touching every redirect("/x") call site
// across the app. Since the default locale is unprefixed ("as-needed"),
// plain next/navigation redirect works unchanged for English (today's only
// live locale) — revisit once Spanish is actually reachable and redirects
// need to preserve the active locale.
// Re-exported (not aliased via `const`) so TypeScript still narrows a
// preceding `if (!x) redirect(...)` check — a `const redirect = ...`
// re-binding breaks that control-flow analysis.
export { redirect } from 'next/navigation';
