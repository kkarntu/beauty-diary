'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateCommentDto } from '@beauty-diary/shared';
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
import { useUpdateComment } from '@/lib/queries/comments';

type FormValues = z.infer<typeof UpdateCommentDto>;

interface Props {
  postId: string;
  commentId: string;
  initialContent: string;
  onCancel: () => void;
  onSaved: () => void;
}

export function CommentEditForm({ postId, commentId, initialContent, onCancel, onSaved }: Props) {
  const t = useTranslations('postDetail.comments');
  const update = useUpdateComment(postId);

  const form = useForm<FormValues>({
    resolver: zodResolver(UpdateCommentDto),
    defaultValues: { content: initialContent },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync({ commentId, data: { content: values.content } });
      onSaved();
    } catch {
      toast.error(t('errorUpdate'));
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-2">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea rows={3} autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button type="submit" size="sm" disabled={update.isPending}>
            {update.isPending ? t('savingEdit') : t('saveEdit')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
