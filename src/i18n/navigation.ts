import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// locale-aware Link, redirect, usePathname, useRouter, getPathname
// Drop-in replacements for next/link and next/navigation.
// All existing href and redirect(...) calls work unchanged — the locale
// prefix is applied automatically by these wrappers.
export const {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing);
