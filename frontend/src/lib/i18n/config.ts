/**
 * Configuração centralizada de idiomas suportados.
 * Para adicionar um novo idioma:
 *   1. Adicionar a chave aqui
 *   2. Criar `src/messages/{locale}.json`
 *   3. (Opcional) atualizar `getLocaleLabel`
 */
export const locales = ['pt-BR', 'en-US'] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'pt-BR';

export const localeLabels: Record<AppLocale, string> = {
  'pt-BR': 'Português (Brasil)',
  'en-US': 'English (US)',
};

export function isAppLocale(value: string | undefined): value is AppLocale {
  return !!value && (locales as readonly string[]).includes(value);
}
