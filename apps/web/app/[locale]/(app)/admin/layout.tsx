import { Mail, ScrollText, Users } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { fetchCurrentUser } from '@/lib/server/me';
import { routes } from '@/lib/routes';

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  const me = await fetchCurrentUser();
  if (!me) redirect('/login');

  if (me.role !== 'admin') {
    return (
      <div className="mx-auto max-w-[640px] space-y-4 px-6 py-20 text-center">
        <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl font-medium">
          {t('forbidden.title')}
        </h1>
        <p className="text-foreground-muted">{t('forbidden.subtitle')}</p>
        <Button asChild>
          <Link href={routes.home}>{t('forbidden.back')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-[1280px] px-6 py-8 lg:px-20">
        <h1
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-foreground mb-8 text-3xl font-medium"
        >
          {t('title')}
        </h1>

        <div className="grid gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <nav className="space-y-2 lg:sticky lg:top-24">
              <Link
                href={routes.adminUsers}
                className="text-foreground-muted hover:bg-surface-muted hover:text-foreground flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors"
              >
                <Users className="h-5 w-5" />
                <span className="font-medium">{t('nav.users')}</span>
              </Link>
              <Link
                href={routes.adminAuditLog}
                className="text-foreground-muted hover:bg-surface-muted hover:text-foreground flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors"
              >
                <ScrollText className="h-5 w-5" />
                <span className="font-medium">{t('nav.auditLog')}</span>
              </Link>
              <Link
                href="/admin/email-outbox"
                className="text-foreground-muted hover:bg-surface-muted hover:text-foreground flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span className="font-medium">{t('nav.outbox')}</span>
              </Link>
            </nav>
          </aside>

          <div className="lg:col-span-9">{children}</div>
        </div>
      </div>
    </div>
  );
}
