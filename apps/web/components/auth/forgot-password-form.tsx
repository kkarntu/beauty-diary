'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { RequestPasswordResetDto } from '@beauty-diary/shared';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Link } from '@/i18n/navigation';
import { useRequestPasswordReset } from '@/lib/queries/auth';
import { routes } from '@/lib/routes';

type FormValues = z.infer<typeof RequestPasswordResetDto>;

export function ForgotPasswordForm() {
  const t = useTranslations('auth.forgotPassword');
  const requestReset = useRequestPasswordReset();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(RequestPasswordResetDto),
    defaultValues: { email: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await requestReset.mutateAsync(values);
    } finally {
      // Always show success — backend returns 204 regardless of whether
      // the email exists. Surfacing "user not found" would enable account
      // enumeration.
      setSubmitted(true);
    }
  });

  if (submitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="bg-success/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
          <MailCheck className="text-success h-6 w-6" />
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
        <Button asChild variant="outline" className="w-full">
          <Link href={routes.login}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Link>
        </Button>
      </div>
    );
  }

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

        <Button type="submit" className="w-full" disabled={requestReset.isPending}>
          {requestReset.isPending ? t('submitting') : t('submit')}
        </Button>

        <p className="text-foreground-muted text-center text-sm">
          <Link href={routes.login} className="text-primary font-medium hover:underline">
            {t('back')}
          </Link>
        </p>
      </form>
    </Form>
  );
}
