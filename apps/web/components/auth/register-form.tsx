'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterDto } from '@beauty-diary/shared';
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
import { useRegister } from '@/lib/queries/auth';
import { routes } from '@/lib/routes';

type FormValues = z.infer<typeof RegisterDto>;

export function RegisterForm() {
  const t = useTranslations('auth.register');
  const router = useRouter();
  const register = useRegister();

  const form = useForm<FormValues>({
    resolver: zodResolver(RegisterDto),
    defaultValues: { email: '', password: '', nickname: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await register.mutateAsync(values);
      router.push(routes.feed);
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === 'EMAIL_TAKEN') {
        form.setError('email', { message: t('errors.emailTaken') });
      } else if (code === 'NICKNAME_TAKEN') {
        form.setError('nickname', { message: t('errors.nicknameTaken') });
      } else {
        toast.error(t('errors.unknown'));
      }
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
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('nicknameLabel')}</FormLabel>
              <FormControl>
                <Input autoComplete="username" placeholder={t('nicknamePlaceholder')} {...field} />
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
              <FormLabel>{t('passwordLabel')}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('passwordPlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={register.isPending}>
          {register.isPending ? t('submitting') : t('submit')}
        </Button>

        <p className="text-foreground-muted text-center text-sm">
          {t('haveAccount')}{' '}
          <Link href={routes.login} className="text-primary font-medium hover:underline">
            {t('login')}
          </Link>
        </p>
      </form>
    </Form>
  );
}
