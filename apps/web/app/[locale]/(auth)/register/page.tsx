import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';
import type { Locale } from '@/i18n/routing';
import { fetchCurrentUser } from '@/lib/server/me';
import { routes } from '@/lib/routes';

export default async function RegisterPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await fetchCurrentUser();
  if (me) redirect(routes.feed);
  const t = await getTranslations('auth.register');
  const tIllu = await getTranslations('auth.illustration.register');

  return (
    <AuthShell
      title={t('title')}
      subtitle={t('subtitle')}
      illustrationTitle={tIllu('title')}
      illustrationBody={tIllu('body')}
    >
      <RegisterForm />
    </AuthShell>
  );
}
