import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/feedback/PageHeader';
import { PlaceholderState } from '@/components/feedback/PlaceholderState';

export default function SettingsPage() {
  const t = useTranslations('nav');
  return (
    <>
      <PageHeader title={t('settings')} />
      <PlaceholderState />
    </>
  );
}
