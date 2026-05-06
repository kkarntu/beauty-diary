import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { fetchAuditLog } from '@/lib/server/admin';
import { routes } from '@/lib/routes';

const PAGE_SIZE = 50;

export default async function AdminAuditLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ page?: string; action?: string; targetType?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const tA = await getTranslations('admin.audit');

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const action = sp.action || undefined;
  const targetType = sp.targetType || undefined;

  const { items, total } = await fetchAuditLog({
    page,
    pageSize: PAGE_SIZE,
    action,
    targetType,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const dateFmt = new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const pageHref = (n: number) => {
    const p = new URLSearchParams();
    if (action) p.set('action', action);
    if (targetType) p.set('targetType', targetType);
    if (n > 1) p.set('page', String(n));
    const qs = p.toString();
    return `${routes.adminAuditLog}${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-foreground mb-1 text-2xl font-medium"
        >
          {tA('title')}
        </h2>
        <p className="text-foreground-muted text-sm">{tA('subtitle')}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-foreground-muted py-12 text-center">{tA('empty')}</p>
      ) : (
        <div className="bg-surface border-border overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-foreground-muted">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">{tA('table.when')}</th>
                  <th className="px-4 py-3 font-medium">{tA('table.actor')}</th>
                  <th className="px-4 py-3 font-medium">{tA('table.action')}</th>
                  <th className="px-4 py-3 font-medium">{tA('table.target')}</th>
                  <th className="px-4 py-3 font-medium">{tA('table.metadata')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-border border-t align-top">
                    <td className="text-foreground-muted whitespace-nowrap px-4 py-3">
                      {dateFmt.format(new Date(row.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      {row.actorNickname ? (
                        <Link
                          href={routes.author(row.actorNickname)}
                          className="text-foreground hover:text-primary"
                        >
                          @{row.actorNickname}
                        </Link>
                      ) : (
                        <span className="text-foreground-muted italic">{tA('system')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <code className="bg-surface-muted rounded px-2 py-0.5 text-xs">
                        {row.action}
                      </code>
                    </td>
                    <td className="text-foreground-muted px-4 py-3 text-xs">
                      <span className="font-medium">{row.targetType}</span>
                      {row.targetId ? (
                        <span className="block break-all opacity-70">{row.targetId}</span>
                      ) : null}
                    </td>
                    <td className="text-foreground-muted px-4 py-3 text-xs">
                      {Object.keys(row.metadata).length > 0 ? (
                        <pre className="max-w-xs whitespace-pre-wrap break-all font-mono">
                          {JSON.stringify(row.metadata, null, 2)}
                        </pre>
                      ) : (
                        '—'
                      )}
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
              href={pageHref(page - 1)}
              className="text-foreground hover:text-primary text-sm font-medium"
            >
              ← {t('previous')}
            </Link>
          ) : null}
          <span className="text-foreground-muted text-sm tabular-nums">
            {t('pageOf', { page, total: totalPages })}
          </span>
          {page < totalPages ? (
            <Link
              href={pageHref(page + 1)}
              className="text-foreground hover:text-primary text-sm font-medium"
            >
              {t('next')} →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
