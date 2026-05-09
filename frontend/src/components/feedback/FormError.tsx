'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import type { ApiErrorBody } from '@/lib/api/browser';

interface FormErrorProps {
  error?: ApiErrorBody['error'];
}

export function FormError({ error }: FormErrorProps) {
  const t = useTranslations('errors');
  if (!error) return null;

  let message = error.message ?? '';
  if (error.message_key) {
    const key = error.message_key.replace(/^errors\./, '');
    try {
      message = t(key);
    } catch {
      // chave ausente: cai no message bruto
    }
  } else if (!message) {
    message = t('generic');
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        <p>{message}</p>
        {error.fields ? (
          <ul className="list-inside list-disc text-xs">
            {Object.entries(error.fields).map(([field, msgs]) => (
              <li key={field}>
                {field}: {msgs.join(', ')}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
