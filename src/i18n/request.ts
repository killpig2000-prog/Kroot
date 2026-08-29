import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the requested locale is supported
  if (!routing.locales.includes(locale as unknown as (typeof routing.locales)[number])) {
    // Note: this should not happen in production if the [locale]
    // dynamic segment is set up correctly with proper validation
    console.error(`Unsupported locale: ${locale}`);
  }

  // Load and merge all namespaced message files for this locale
  // Pattern: messages/{locale}/{namespace}.json
  const messages: Record<string, Record<string, any>> = {};

  const namespaces = ['common', 'nav', 'onboarding', 'vocabulary', 'words'];

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
    messages: messages as any,
    // Flatten namespace keys for convenience: common.key → key
    // (Alternatively, use namespace-prefixed keys — adjust consumers accordingly)
    // For simplicity, we merge all namespaces into one flat object.
    // If you prefer namespace separation, remove this line.
  };
});
