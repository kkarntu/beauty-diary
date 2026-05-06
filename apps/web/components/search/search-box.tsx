'use client';

import { Search as SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

interface Props {
  initialQuery?: string;
  placeholder: string;
}

export function SearchBox({ initialQuery = '', placeholder }: Props) {
  const t = useTranslations('search');
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      router.push(routes.search);
    } else {
      router.push(`${routes.search}?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <SearchIcon className="text-foreground-muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
          autoFocus
        />
      </div>
      <Button type="submit">{t('submit')}</Button>
    </form>
  );
}
