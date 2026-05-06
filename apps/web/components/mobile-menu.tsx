'use client';

import { Bookmark, FileText, Menu, Settings, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Link } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

const CATEGORY_SLUGS = ['skincare', 'makeup', 'hair', 'wellness', 'fashion', 'lifestyle'] as const;

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('navigation');
  const tCat = useTranslations('categories');

  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground-muted hover:text-foreground"
          aria-label={t('openMenu')}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        {/* Required by Radix Dialog for screen-reader users; visually hidden. */}
        <SheetTitle className="sr-only">{t('openMenu')}</SheetTitle>
        <div className="flex flex-col gap-6 mt-8">
          <div className="space-y-1">
            <h3 className="font-medium text-foreground mb-3 px-3">{t('categories')}</h3>
            {CATEGORY_SLUGS.map((slug) => (
              <Link key={slug} href={routes.category(slug)} onClick={close}>
                <Button variant="ghost" className="w-full justify-start text-base">
                  {tCat(slug)}
                </Button>
              </Link>
            ))}
          </div>

          <div className="space-y-1 pt-4 border-t border-border">
            <h3 className="font-medium text-foreground mb-3 px-3">{t('profile')}</h3>
            <Link href={routes.me} onClick={close}>
              <Button variant="ghost" className="w-full justify-start gap-3 text-base">
                <Settings className="w-5 h-5" />
                {t('settings')}
              </Button>
            </Link>
            <Link href={routes.myPosts} onClick={close}>
              <Button variant="ghost" className="w-full justify-start gap-3 text-base">
                <FileText className="w-5 h-5" />
                {t('myPosts')}
              </Button>
            </Link>
            <Link href={routes.myFavorites} onClick={close}>
              <Button variant="ghost" className="w-full justify-start gap-3 text-base">
                <Bookmark className="w-5 h-5" />
                {t('favorites')}
              </Button>
            </Link>
            <Link href={routes.login} onClick={close}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-base text-destructive hover:text-destructive"
              >
                <User className="w-5 h-5" />
                {t('logout')}
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
