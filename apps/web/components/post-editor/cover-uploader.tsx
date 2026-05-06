'use client';

import { ImageIcon, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useImageUpload, UploadValidationError } from '@/lib/queries/media';

interface Props {
  value: string;
  onChange: (url: string) => void;
  hasError?: boolean;
}

export function CoverUploader({ value, onChange, hasError }: Props) {
  const t = useTranslations('postEditor.cover');
  const upload = useImageUpload();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File) => {
    try {
      const url = await upload.mutateAsync(file);
      onChange(url);
    } catch (err) {
      if (err instanceof UploadValidationError) {
        toast.error(err.code === 'mime' ? t('errors.mime') : t('errors.size'));
      } else {
        toast.error(t('errors.upload'));
      }
    }
  };

  if (value) {
    return (
      <div className="relative h-64 md:h-80 rounded-lg overflow-hidden bg-surface-muted group">
        <Image
          src={value}
          alt={t('previewAlt')}
          fill
          sizes="(min-width: 1024px) 768px, 100vw"
          className="object-cover"
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => onChange('')}
          aria-label={t('remove')}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <label
      className={`block border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer space-y-3 ${
        hasError ? 'border-destructive' : 'border-border'
      }`}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) void handleFile(file);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        hidden
        disabled={upload.isPending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      {upload.isPending ? (
        <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
      ) : (
        <ImageIcon className="w-12 h-12 mx-auto text-foreground-muted" />
      )}
      <p className="text-sm text-foreground-muted">
        {upload.isPending ? t('uploading') : t('upload')}
      </p>
      <p className="caption text-foreground-muted">{t('hint')}</p>
    </label>
  );
}
