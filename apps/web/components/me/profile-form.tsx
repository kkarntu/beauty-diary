'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type CurrentUserDto, UpdateProfileDto, type PublicUserDto } from '@beauty-diary/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { authKeys } from '@/lib/queries/auth';
import { useImageUpload, UploadValidationError } from '@/lib/queries/media';

type FormValues = z.infer<typeof UpdateProfileDto>;

interface Props {
  user: CurrentUserDto;
}

export function ProfileForm({ user }: Props) {
  const t = useTranslations('profile');
  const tCover = useTranslations('postEditor.cover');
  const qc = useQueryClient();
  const router = useRouter();
  const upload = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(UpdateProfileDto),
    defaultValues: {
      displayName: user.displayName ?? '',
      bio: user.bio ?? '',
      avatarUrl: user.avatarUrl ?? '',
    },
  });

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload: FormValues = {
        displayName: values.displayName?.trim() ? values.displayName.trim() : null,
        bio: values.bio?.trim() ? values.bio.trim() : null,
        avatarUrl: values.avatarUrl ? values.avatarUrl : null,
      };
      const res = await api.patch<PublicUserDto>('/api/users/me', payload);
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: authKeys.currentUser() });
      // Server components (header avatar, /me page) read from cookies on
      // each render — refresh so they pick up the new profile fields.
      router.refresh();
      toast.success(t('saved'));
    },
    onError: () => {
      toast.error(t('saveFailed'));
    },
  });

  const onAvatarFile = async (file: File) => {
    try {
      const url = await upload.mutateAsync(file);
      form.setValue('avatarUrl', url, { shouldDirty: true });
    } catch (err) {
      if (err instanceof UploadValidationError) {
        toast.error(err.code === 'mime' ? tCover('errors.mime') : tCover('errors.size'));
      } else {
        toast.error(tCover('errors.upload'));
      }
    }
  };

  const onSubmit = form.handleSubmit((values) => save.mutate(values));
  const avatarUrl = form.watch('avatarUrl');
  const initial = (user.displayName ?? user.nickname).slice(0, 1).toUpperCase();

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Avatar */}
        <div>
          <p className="text-foreground mb-3 block text-sm font-medium">{t('avatar.label')}</p>
          <div className="flex items-center gap-4">
            <div className="bg-surface-muted text-foreground relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-2xl font-medium">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" fill sizes="80px" className="object-cover" />
              ) : (
                <span style={{ fontFamily: 'var(--font-display)' }}>{initial}</span>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onAvatarFile(f);
                  e.target.value = '';
                }}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={upload.isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {upload.isPending ? t('avatar.uploading') : t('avatar.upload')}
                </Button>
                {avatarUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => form.setValue('avatarUrl', '', { shouldDirty: true })}
                  >
                    {t('avatar.remove')}
                  </Button>
                ) : null}
              </div>
              <p className="text-foreground-muted text-xs">{t('avatar.hint')}</p>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('displayName.label')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder={t('displayName.placeholder')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('bio.label')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  placeholder={t('bio.placeholder')}
                  rows={4}
                />
              </FormControl>
              <FormDescription className="text-xs">{t('bio.hint')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? t('saving') : t('save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
