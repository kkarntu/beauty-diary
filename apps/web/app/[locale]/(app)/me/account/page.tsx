import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { AccountSection } from '@/components/me/account-section';
import { SettingsShell } from '@/components/me/settings-shell';
import type { Locale } from '@/i18n/routing';
import { fetchCurrentUser } from '@/lib/server/me';

export default async function MeAccountPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('profile');

  const me = await fetchCurrentUser();
  if (!me) redirect('/login');

  return (
    <SettingsShell active="account" title={t('accountTitle')}>
      <AccountSection email={me.email} />
    </SettingsShell>
  );
}
