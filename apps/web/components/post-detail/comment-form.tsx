'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreateCommentDto } from '@beauty-diary/shared';
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
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Link } from '@/i18n/navigation';
import { useCurrentUser } from '@/lib/queries/auth';
import { useCreateComment } from '@/lib/queries/comments';
import { routes } from '@/lib/routes';
import { useMounted } from '@/lib/use-mounted';

type FormValues = z.infer<typeof CreateCommentDto>;

interface Props {
  postId: string;
  parentId?: string | null;
  onSubmitted?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({ postId, parentId = null, onSubmitted, autoFocus }: Props) {
  const t = useTranslations('postDetail.comments');
  // SSR has no auth state, so we render a sized placeholder until the
  // component has mounted on the client and `useCurrentUser` resolves.
  const mounted = useMounted();
  const { data: user } = useCurrentUser();
  const createComment = useCreateComment(postId);

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateCommentDto),
    defaultValues: { content: '', parentId: parentId ?? undefined },
  });

  if (!mounted) {
    return <div aria-hidden className="h-[120px] rounded-lg bg-surface-muted/40" />;
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-border bg-surface-muted p-4 text-sm text-foreground-muted">
        <Link href={routes.login} className="text-primary hover:underline font-medium">
          {t('signInToComment')}
        </Link>
      </div>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createComment.mutateAsync({
        content: values.content,
        parentId: parentId ?? undefined,
      });
      form.reset({ content: '', parentId: parentId ?? undefined });
      onSubmitted?.();
    } catch {
      toast.error(t('errorCreate'));
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-3">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder={parentId ? t('replyPlaceholder') : t('placeholder')}
                  rows={parentId ? 3 : 4}
                  autoFocus={autoFocus}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={createComment.isPending}>
            {createComment.isPending ? t('submitting') : t('submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
