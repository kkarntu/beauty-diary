import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';
import type { Locale } from '@/i18n/routing';

export default async function LoginPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth.login');
  const tIllu = await getTranslations('auth.illustration.login');

  return (
    <AuthShell
      title={t('title')}
      subtitle={t('subtitle')}
      illustrationTitle={tIllu('title')}
      illustrationBody={tIllu('body')}
    >
      <LoginForm />
    </AuthShell>
  );
}
