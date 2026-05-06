'use client';

import { Bookmark, FileText, LogOut, Settings, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useRouter } from '@/i18n/navigation';
import { useCurrentUser, useLogout } from '@/lib/queries/auth';
import { routes } from '@/lib/routes';

export function UserMenu() {
  const t = useTranslations('navigation');
  const { data: user, isPending } = useCurrentUser();
  const logout = useLogout();
  const router = useRouter();

  // While the first /auth/me call is in flight we render a placeholder
  // button to avoid layout shift in the header.
  if (isPending) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label={t('userMenu')}>
        <User className="w-5 h-5" />
      </Button>
    );
  }

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href={routes.login}>{t('signIn')}</Link>
      </Button>
    );
  }

  const onLogout = async () => {
    await logout.mutateAsync();
    router.replace(routes.home);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground-muted hover:text-foreground"
          aria-label={t('userMenu')}
        >
          <User className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              {user.displayName ?? user.nickname}
            </span>
            <span className="caption text-foreground-muted truncate">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={routes.me} className="cursor-pointer flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            {t('settings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={routes.myPosts} className="cursor-pointer flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            {t('myPosts')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={routes.myFavorites} className="cursor-pointer flex items-center">
            <Bookmark className="w-4 h-4 mr-2" />
            {t('favorites')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          disabled={logout.isPending}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
