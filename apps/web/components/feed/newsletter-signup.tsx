'use client';

import { Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNewsletterSubscribe } from '@/lib/queries/newsletter';

/**
 * Sidebar widget that subscribes the entered email to the newsletter.
 * The backend treats duplicate addresses as silent no-ops, so the user
 * sees the same success message either way — no enumeration risk.
 */
export function NewsletterSignup() {
  const t = useTranslations('feed.sidebar.newsletter');
  const [email, setEmail] = useState('');
  const subscribe = useNewsletterSubscribe();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    try {
      await subscribe.mutateAsync({ email: trimmed });
      setEmail('');
      toast.success(t('success'));
    } catch {
      toast.error(t('error'));
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="bg-surface rounded-lg border border-border p-6 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Mail className="w-5 h-5 text-primary" />
        <h3 style={{ fontFamily: 'var(--font-display)' }} className="text-lg font-medium">
          {t('title')}
        </h3>
      </div>
      <p className="text-sm text-foreground-muted">{t('description')}</p>
      <Input
        type="email"
        required
        placeholder={t('placeholder')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={subscribe.isPending}
      />
      <Button type="submit" className="w-full" disabled={subscribe.isPending}>
        {subscribe.isPending ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
