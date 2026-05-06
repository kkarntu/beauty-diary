import { getTranslations, setRequestLocale } from 'next-intl/server';
import { OutboxRetryButton } from '@/components/admin/outbox-retry-button';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { fetchFailedOutbox } from '@/lib/server/admin-outbox';

export default async function AdminOutboxPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const tO = await getTranslations('admin.outbox');

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const pageSize = 50;
  const { items, total } = await fetchFailedOutbox(page, pageSize);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const dateFmt = new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-6">
      <div>
        <h2
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-2xl font-medium text-foreground mb-1"
        >
          {tO('title')}
        </h2>
        <p className="text-sm text-foreground-muted">{tO('subtitle')}</p>
      </div>

      {items.length === 0 ? (
        <p className="py-12 text-center text-foreground-muted">{tO('empty')}</p>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-foreground-muted">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">{tO('table.when')}</th>
                  <th className="px-4 py-3 font-medium">{tO('table.recipient')}</th>
                  <th className="px-4 py-3 font-medium">{tO('table.subject')}</th>
                  <th className="px-4 py-3 font-medium">{tO('table.attempts')}</th>
                  <th className="px-4 py-3 font-medium">{tO('table.error')}</th>
                  <th className="px-4 py-3 font-medium">{tO('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-t border-border align-top">
                    <td className="px-4 py-3 text-foreground-muted whitespace-nowrap">
                      {dateFmt.format(new Date(row.createdAt))}
                    </td>
                    <td className="px-4 py-3 text-foreground">{row.toEmail}</td>
                    <td className="px-4 py-3 text-foreground">{row.subject}</td>
                    <td className="px-4 py-3 text-foreground-muted tabular-nums">
                      {row.attempts}
                    </td>
                    <td className="px-4 py-3 text-foreground-muted text-xs">
                      <pre className="font-mono whitespace-pre-wrap break-all max-w-xs">
                        {row.lastError ?? '—'}
                      </pre>
                    </td>
                    <td className="px-4 py-3">
                      <OutboxRetryButton id={row.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-3 pt-4">
          {page > 1 ? (
            <Link
              href={`/admin/email-outbox${page > 2 ? `?page=${page - 1}` : ''}`}
              className="text-sm font-medium text-foreground hover:text-primary"
            >
              ← {t('previous')}
            </Link>
          ) : null}
          <span className="text-sm text-foreground-muted tabular-nums">
            {t('pageOf', { page, total: totalPages })}
          </span>
          {page < totalPages ? (
            <Link
              href={`/admin/email-outbox?page=${page + 1}`}
              className="text-sm font-medium text-foreground hover:text-primary"
            >
              {t('next')} →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
