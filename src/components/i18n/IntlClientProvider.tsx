"use client";

import { IntlErrorCode, NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { humanizeMessageKey } from "@/i18n/fallback";

// Client-side twin of the fallback in i18n/request.ts — functions can't be
// handed from a Server Component to the provider, so it's set here.
export default function IntlClientProvider({
  locale,
  messages,
  timeZone,
  children,
}: {
  locale: string;
  messages: AbstractIntlMessages;
  timeZone: string;
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={timeZone}
      getMessageFallback={({ key, namespace }) => humanizeMessageKey(namespace ? `${namespace}.${key}` : key)}
      onError={(error) => {
        if (error.code === IntlErrorCode.MISSING_MESSAGE) console.warn(error.message);
        else console.error(error);
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}
