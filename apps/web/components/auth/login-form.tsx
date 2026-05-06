'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoginDto } from '@beauty-diary/shared';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Link, useRouter } from '@/i18n/navigation';
import { getApiErrorCode } from '@/lib/api';
import { useLogin } from '@/lib/queries/auth';
import { routes } from '@/lib/routes';

type FormValues = z.infer<typeof LoginDto>;

export function LoginForm() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const login = useLogin();

  const form = useForm<FormValues>({
    resolver: zodResolver(LoginDto),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      router.push(routes.feed);
    } catch (err) {
      const code = getApiErrorCode(err);
      const messageKey =
        code === 'INVALID_CREDENTIALS'
          ? 'errors.invalidCredentials'
          : code === 'ACCOUNT_BLOCKED'
            ? 'errors.blocked'
            : 'errors.unknown';
      toast.error(t(messageKey));
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('emailLabel')}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={t('emailPlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>{t('passwordLabel')}</FormLabel>
                <Link
                  href={routes.forgotPassword}
                  className="text-sm text-primary hover:underline"
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('passwordPlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? t('submitting') : t('submit')}
        </Button>

        <p className="text-sm text-foreground-muted text-center">
          {t('noAccount')}{' '}
          <Link href={routes.register} className="text-primary hover:underline font-medium">
            {t('register')}
          </Link>
        </p>
      </form>
    </Form>
  );
}
