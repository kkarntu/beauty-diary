import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';
import type { Locale } from '@/i18n/routing';

export default async function RegisterPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
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
