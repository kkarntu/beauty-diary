import { Bell, Lock, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

type SectionId = 'profile' | 'account' | 'notifications';

interface Props {
  active: SectionId;
  title: string;
  children: ReactNode;
}

export function SettingsShell({ active, title, children }: Props) {
  const tSection = useTranslations('profile.section');
  const tProfile = useTranslations('profile');

  const items: Array<{ id: SectionId; href: string; label: string; Icon: typeof User }> = [
    { id: 'profile', href: routes.meProfile, label: tSection('info'), Icon: User },
    { id: 'account', href: routes.meAccount, label: tSection('account'), Icon: Lock },
    {
      id: 'notifications',
      href: routes.meNotifications,
      label: tSection('notifications'),
      Icon: Bell,
    },
  ];

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-[1280px] px-6 py-8 lg:px-20">
        <h1
          style={{ fontFamily: 'var(--font-display)' }}
          className="text-foreground mb-8 text-3xl font-medium"
        >
          {tProfile('title')}
        </h1>

        <div className="grid gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <nav className="space-y-2 lg:sticky lg:top-24">
              {items.map(({ id, href, label, Icon }) => (
                <Link
                  key={id}
                  href={href}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors',
                    active === id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{label}</span>
                </Link>
              ))}
            </nav>
          </aside>

          <div className="lg:col-span-9">
            <div className="bg-surface border-border space-y-6 rounded-xl border p-4 sm:p-6 lg:p-8">
              <h2
                style={{ fontFamily: 'var(--font-display)' }}
                className="text-foreground text-2xl font-medium"
              >
                {title}
              </h2>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
