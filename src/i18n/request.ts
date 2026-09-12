import { hasLocale, IntlErrorCode } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { humanizeMessageKey } from './fallback';

// The message shape next-intl expects back, derived from its own signature
// rather than restated as `any`.
type RequestConfig = Awaited<ReturnType<Parameters<typeof getRequestConfig>[0]>>;
type Messages = NonNullable<RequestConfig['messages']>;
type Tree = Record<string, Messages[string]>;

const namespaces = ['common', 'nav', 'onboarding', 'vocabulary', 'words', 'ui', 'listening', 'writing', 'pronunciation', 'landing', 'dashboard', 'reading', 'slang', 'tree', 'profile', 'shop', 'community', 'levelTest', 'grammarUi', 'grammarGuide', 'readingGuide', 'listeningGuide', 'hangulGuide', 'writingGuide', 'pronunciationGuide', 'hangul', 'auth', 'notFound', 'guide', 'error', 'tour', 'ranking', 'myroom', 'settings'];

// Pattern: messages/{locale}/{namespace}.json
async function loadMessages(locale: string): Promise<Tree> {
  const messages: Tree = {};
  for (const namespace of namespaces) {
    try {
      const mod = await import(`../../messages/${locale}/${namespace}.json`);
      messages[namespace] = mod.default || mod;
    } catch {
      console.warn(`No ${namespace}.json found for locale ${locale}`);
    }
  }
  return messages;
}

// A key one locale is missing shows the English line, not a dotted path.
function withFallback(primary: Tree, fallback: Tree): Tree {
  const out: Tree = { ...fallback };
  for (const [key, value] of Object.entries(primary)) {
    const base = fallback[key];
    out[key] =
      typeof value === 'object' && typeof base === 'object'
        ? (withFallback(value as Tree, base as Tree) as Messages[string])
        : value;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const own = await loadMessages(locale);
  const messages =
    locale === routing.defaultLocale ? own : withFallback(own, await loadMessages(routing.defaultLocale));

  return {
    locale,
    messages,
    getMessageFallback: ({ key, namespace }) => humanizeMessageKey(namespace ? `${namespace}.${key}` : key),
    onError: (error) => {
      if (error.code === IntlErrorCode.MISSING_MESSAGE) console.warn(error.message);
      else console.error(error);
    },
  };
});
