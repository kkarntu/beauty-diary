'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { Link } from '@/i18n/navigation';
import { useResetPassword } from '@/lib/queries/auth';
import { routes } from '@/lib/routes';

const FormSchema = z.object({
  password: z.string().min(8).max(128),
});
type FormValues = z.infer<typeof FormSchema>;

export function ResetPasswordForm({ token }: { token: string | null }) {
  const t = useTranslations('auth.resetPassword');
  const reset = useResetPassword();
  const [done, setDone] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { password: '' },
  });

  if (!token) {
    return (
      <div className="space-y-6">
        <p className="text-foreground-muted text-sm">{t('missingToken')}</p>
        <Button asChild variant="outline" className="w-full">
          <Link href={routes.forgotPassword}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <div className="bg-success/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
          <CheckCircle2 className="text-success h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-foreground text-2xl font-medium"
          >
            {t('successTitle')}
          </h2>
          <p className="text-foreground-muted">{t('success')}</p>
        </div>
        <Button asChild className="w-full">
          <Link href={routes.login}>{t('back')}</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await reset.mutateAsync({ token, password: values.password });
      setDone(true);
    } catch {
      form.setError('password', { message: t('invalidToken') });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-5">
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
        <Button type="submit" className="w-full" disabled={reset.isPending}>
          {reset.isPending ? t('submitting') : t('submit')}
        </Button>
      </form>
    </Form>
  );
}
