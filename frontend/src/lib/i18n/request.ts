import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, isAppLocale } from './config';

const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * Resolve o locale por:
 *   1. cookie NEXT_LOCALE
 *   2. header Accept-Language
 *   3. fallback (defaultLocale = pt-BR)
 *
 * Carrega as mensagens do arquivo correspondente em src/messages/.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  let locale = isAppLocale(cookieLocale) ? cookieLocale : undefined;

  if (!locale) {
    const headerStore = await headers();
    const accept = headerStore.get('accept-language') ?? '';
    const preferred = accept.split(',')[0]?.trim();
    if (isAppLocale(preferred)) {
      locale = preferred;
    }
  }

  if (!locale) {
    locale = defaultLocale;
  }

  const messages = (await import(`@/messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: 'America/Sao_Paulo',
  };
});
