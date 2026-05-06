import { format, formatDistanceToNow } from 'date-fns';
import { enUS, uk } from 'date-fns/locale';

const locales = { uk, en: enUS } as const;

function pickLocale(locale: string) {
  return locales[locale as keyof typeof locales] ?? uk;
}

/** "5 травня 2026" / "May 5, 2026" depending on locale */
export function formatLongDate(date: string | Date, locale: string): string {
  return format(new Date(date), 'd MMMM yyyy', { locale: pickLocale(locale) });
}

/** "2 хв тому" / "2 minutes ago" */
export function formatRelative(date: string | Date, locale: string): string {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: pickLocale(locale),
  });
}
