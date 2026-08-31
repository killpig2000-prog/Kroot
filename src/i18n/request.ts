import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  // Load and merge all namespaced message files for this locale
  // Pattern: messages/{locale}/{namespace}.json
  const messages: Record<string, Record<string, any>> = {};

  const namespaces = ['common', 'nav', 'onboarding', 'vocabulary', 'words', 'ui', 'listening', 'writing', 'pronunciation', 'landing', 'dashboard', 'reading', 'slang', 'tree', 'profile', 'shop', 'community', 'levelTest', 'grammarUi', 'hangul', 'auth', 'notFound', 'guide'];

  for (const namespace of namespaces) {
    try {
      const mod = await import(`../../messages/${locale}/${namespace}.json`);
      messages[namespace] = mod.default || mod;
    } catch (error) {
      // Missing namespace — log but don't crash. next-intl will return
      // the key itself when a translation is not found.
      console.warn(`No ${namespace}.json found for locale ${locale}`);
    }
  }

  return {
    locale,
    messages: messages as any,
  };
});
