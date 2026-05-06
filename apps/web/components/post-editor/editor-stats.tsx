import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

interface Props {
  contentHtml: string;
}

const WORDS_PER_MINUTE = 200;

export function EditorStats({ contentHtml }: Props) {
  const t = useTranslations('postEditor.stats');

  const { words, minutes } = useMemo(() => {
    const text = contentHtml.replace(/<[^>]*>/g, ' ');
    const w = text.trim().split(/\s+/u).filter(Boolean).length;
    return { words: w, minutes: Math.max(1, Math.ceil(w / WORDS_PER_MINUTE)) };
  }, [contentHtml]);

  return (
    <div className="bg-surface-muted rounded-lg p-5">
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <p
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-2xl font-medium tabular-nums"
          >
            {words}
          </p>
          <p className="caption text-foreground-muted mt-1">{t('words')}</p>
        </div>
        <div>
          <p
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-2xl font-medium tabular-nums"
          >
            {minutes}
          </p>
          <p className="caption text-foreground-muted mt-1">{t('minutes')}</p>
        </div>
      </div>
    </div>
  );
}
