import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthShell } from '@/components/auth/auth-shell';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import type { Locale } from '@/i18n/routing';

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('auth.resetPassword');
  const tIllu = await getTranslations('auth.illustration.forgotPassword');

  return (
    <AuthShell
      title={t('title')}
      subtitle={t('subtitle')}
      illustrationTitle={tIllu('title')}
      illustrationBody={tIllu('body')}
    >
      <ResetPasswordForm token={token ?? null} />
    </AuthShell>
  );
}
