import { getTranslations, setRequestLocale } from 'next-intl/server';
import { UserActions } from '@/components/admin/user-actions';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { formatLongDate } from '@/lib/format';
import { fetchAdminUsers } from '@/lib/server/admin';
import { fetchCurrentUser } from '@/lib/server/me';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

type FilterId = 'all' | 'active' | 'blocked' | 'admins';

interface SearchParams {
  page?: string;
  filter?: FilterId;
  q?: string;
}

const FILTERS: FilterId[] = ['all', 'active', 'blocked', 'admins'];

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const tU = await getTranslations('admin.users');

  const me = await fetchCurrentUser();
  const sp = await searchParams;
  const filter: FilterId =
    sp.filter && FILTERS.includes(sp.filter) ? sp.filter : 'all';
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const search = sp.q && sp.q.trim().length > 0 ? sp.q.trim() : undefined;

  const { items, total } = await fetchAdminUsers({
    page,
    pageSize: PAGE_SIZE,
    search,
    role: filter === 'admins' ? 'admin' : undefined,
    isBlocked: filter === 'active' ? false : filter === 'blocked' ? true : undefined,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filterHref = (f: FilterId) => {
    const p = new URLSearchParams();
    if (f !== 'all') p.set('filter', f);
    if (search) p.set('q', search);
    const qs = p.toString();
    return `${routes.adminUsers}${qs ? `?${qs}` : ''}`;
  };
  const pageHref = (n: number) => {
    const p = new URLSearchParams();
    if (filter !== 'all') p.set('filter', filter);
    if (search) p.set('q', search);
    if (n > 1) p.set('page', String(n));
    const qs = p.toString();
    return `${routes.adminUsers}${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-2xl font-medium text-foreground mb-1"
        >
          {tU('title')}
        </h2>
        <p className="text-sm text-foreground-muted">{tU('subtitle')}</p>
      </div>

      {/* Search + filters */}
      <form className="flex gap-2" method="get" action={routes.adminUsers}>
        {filter !== 'all' ? <input type="hidden" name="filter" value={filter} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={search ?? ''}
          placeholder={tU('search')}
          className="flex-1 h-9 rounded-md border border-border bg-input-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        />
      </form>

      <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={filterHref(f)}
            className={cn(
              'px-3 h-9 inline-flex items-center text-sm font-medium rounded-md whitespace-nowrap transition-colors',
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-foreground-muted hover:text-foreground hover:bg-surface-muted',
            )}
          >
            {tU(`filters.${f}`)}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="py-12 text-center text-foreground-muted">{tU('empty')}</p>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-foreground-muted">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">{tU('table.user')}</th>
                  <th className="px-4 py-3 font-medium">{tU('table.email')}</th>
                  <th className="px-4 py-3 font-medium">{tU('table.role')}</th>
                  <th className="px-4 py-3 font-medium">{tU('table.status')}</th>
                  <th className="px-4 py-3 font-medium">{tU('table.joined')}</th>
                  <th className="px-4 py-3 font-medium">{tU('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="border-t border-border align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {u.displayName ?? u.nickname}
                      </p>
                      <p className="text-xs text-foreground-muted">@{u.nickname}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'border-0',
                          u.role === 'admin' && 'bg-primary/10 text-primary',
                        )}
                      >
                        {tU(`role.${u.role}`)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'border-0',
                          u.isBlocked
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-surface-muted text-foreground-muted',
                        )}
                      >
                        {u.isBlocked ? tU('status.blocked') : tU('status.active')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">
                      {formatLongDate(u.createdAt, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <UserActions
                        userId={u.id}
                        isBlocked={u.isBlocked}
                        role={u.role}
                        isSelf={me?.id === u.id}
                      />
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
              href={pageHref(page + 1)}
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
