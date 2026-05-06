import { Bell } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { NotificationsTimeline } from '@/components/notifications/notifications-timeline';
import type { Locale } from '@/i18n/routing';
import { fetchCurrentUser } from '@/lib/server/me';

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const me = await fetchCurrentUser();
  if (!me) redirect('/login');

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-[760px] px-6 py-8 lg:px-20">
        <NotificationsTimeline />
      </div>
    </div>
  );
}

// Re-export for sidebar icons that need both Bell and the page.
export { Bell };
