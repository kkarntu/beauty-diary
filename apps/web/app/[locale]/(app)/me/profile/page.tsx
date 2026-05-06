import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/me/profile-form';
import { SettingsShell } from '@/components/me/settings-shell';
import type { Locale } from '@/i18n/routing';
import { fetchCurrentUser } from '@/lib/server/me';

export default async function MeProfilePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('profile');

  const me = await fetchCurrentUser();
  if (!me) redirect('/login');

  return (
    <SettingsShell active="profile" title={t('infoTitle')}>
      <ProfileForm user={me} />

      <div className="border-t border-border pt-6">
        <p className="text-sm font-medium text-foreground mb-2">{t('email.label')}</p>
        <p className="text-foreground-muted">{me.email}</p>
      </div>
    </SettingsShell>
  );
}
