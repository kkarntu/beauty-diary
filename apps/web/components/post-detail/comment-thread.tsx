'use client';

import type { CommentDto } from '@beauty-diary/shared';
import { Pencil, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { useCurrentUser } from '@/lib/queries/auth';
import { useCommentStream } from '@/lib/queries/comment-stream';
import { useComments, useDeleteComment } from '@/lib/queries/comments';
import { formatRelative } from '@/lib/format';
import { routes } from '@/lib/routes';
import { useMounted } from '@/lib/use-mounted';
import { CommentEditForm } from './comment-edit-form';
import { CommentForm } from './comment-form';

interface Props {
  postId: string;
  initialComments: CommentDto[];
}

export function CommentThread({ postId, initialComments }: Props) {
  const t = useTranslations('postDetail.comments');
  const locale = useLocale();
  // Treat the viewer as anonymous until the component has mounted on
  // the client. Otherwise owner-only Edit/Delete buttons can render
  // during SSR with the cached user, then re-render without them on
  // hydration, producing a markup mismatch.
  const mounted = useMounted();
  const { data: cachedUser } = useCurrentUser();
  const user = mounted ? cachedUser : undefined;
  const { data: comments = initialComments } = useComments(postId, initialComments);
  const deleteComment = useDeleteComment(postId);
  useCommentStream(postId);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const top: CommentDto[] = [];
    const replies = new Map<string, CommentDto[]>();
    for (const c of comments) {
      if (c.parentId === null) {
        top.push(c);
      } else {
        const existing = replies.get(c.parentId) ?? [];
        existing.push(c);
        replies.set(c.parentId, existing);
      }
    }
    return { top, replies };
  }, [comments]);

  const onDelete = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync(commentId);
    } catch {
      toast.error(t('errorDelete'));
    }
  };

  const renderRow = (comment: CommentDto, isReply: boolean) => {
    const isOwner = user?.id === comment.author.id;
    const canDelete = isOwner || user?.role === 'admin';
    const canEdit = isOwner;

    if (editingId === comment.id) {
      return (
        <div className="flex gap-3">
          <Avatar nickname={comment.author.nickname} avatarUrl={comment.author.avatarUrl} />
          <div className="min-w-0 flex-1">
            <CommentEditForm
              postId={postId}
              commentId={comment.id}
              initialContent={comment.content}
              onCancel={() => setEditingId(null)}
              onSaved={() => setEditingId(null)}
            />
          </div>
        </div>
      );
    }

    return (
      <CommentRow
        comment={comment}
        locale={locale}
        canDelete={canDelete}
        canEdit={canEdit}
        onReply={
          !isReply ? () => setReplyingTo(replyingTo === comment.id ? null : comment.id) : undefined
        }
        onEdit={() => setEditingId(comment.id)}
        onDelete={() => onDelete(comment.id)}
        replyLabel={t('reply')}
        editLabel={t('edit')}
        deleteLabel={t('delete')}
        editedLabel={t('edited')}
      />
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)' }} className="mb-4 text-2xl font-medium">
          {t('title', { count: comments.length })}
        </h2>
        <CommentForm postId={postId} />
      </div>

      <ul className="space-y-6">
        {grouped.top.map((c) => {
          const childReplies = grouped.replies.get(c.id) ?? [];
          return (
            <li key={c.id} className="space-y-4">
              {renderRow(c, false)}

              {childReplies.length > 0 ? (
                <ul className="border-border ml-12 space-y-4 border-l pl-6">
                  {childReplies.map((reply) => (
                    <li key={reply.id}>{renderRow(reply, true)}</li>
                  ))}
                </ul>
              ) : null}

              {replyingTo === c.id && user ? (
                <div className="border-border ml-12 border-l pl-6">
                  <CommentForm
                    postId={postId}
                    parentId={c.id}
                    autoFocus
                    onSubmitted={() => setReplyingTo(null)}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {grouped.top.length === 0 ? (
        <p className="text-foreground-muted py-8 text-center text-sm">{t('empty')}</p>
      ) : null}
    </div>
  );
}

function Avatar({ nickname, avatarUrl }: { nickname: string; avatarUrl: string | null }) {
  const initials = nickname.slice(0, 1).toUpperCase();
  return (
    <Link
      href={routes.author(nickname)}
      className="bg-surface-muted text-foreground-muted flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-medium"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatars are tiny + already CDN-served
        <img src={avatarUrl} alt={nickname} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </Link>
  );
}

function CommentRow({
  comment,
  locale,
  canDelete,
  canEdit,
  onReply,
  onEdit,
  onDelete,
  replyLabel,
  editLabel,
  deleteLabel,
  editedLabel,
}: {
  comment: CommentDto;
  locale: string;
  canDelete: boolean;
  canEdit: boolean;
  onReply?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  replyLabel?: string;
  editLabel: string;
  deleteLabel: string;
  editedLabel: string;
}) {
  const isDeleted = comment.content === '[deleted]';

  return (
    <article className="flex gap-3">
      <Avatar nickname={comment.author.nickname} avatarUrl={comment.author.avatarUrl} />
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline gap-2">
          <Link
            href={routes.author(comment.author.nickname)}
            className="text-foreground hover:text-primary text-sm font-medium"
          >
            {comment.author.nickname}
          </Link>
          <span className="caption text-foreground-muted">
            {formatRelative(comment.createdAt, locale)}
            {comment.editedAt ? ` · ${editedLabel}` : ''}
          </span>
        </header>
        <p className="text-foreground mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
        <footer className="mt-2 flex items-center gap-3">
          {onReply && !isDeleted ? (
            <button
              type="button"
              onClick={onReply}
              className="caption text-foreground-muted hover:text-foreground"
            >
              {replyLabel}
            </button>
          ) : null}
          {canEdit && !isDeleted ? (
            <button
              type="button"
              onClick={onEdit}
              className="caption text-foreground-muted hover:text-foreground inline-flex items-center gap-1"
            >
              <Pencil className="h-3 w-3" />
              {editLabel}
            </button>
          ) : null}
          {canDelete && !isDeleted ? (
            <button
              type="button"
              onClick={onDelete}
              className="caption text-foreground-muted hover:text-destructive inline-flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              {deleteLabel}
            </button>
          ) : null}
        </footer>
      </div>
    </article>
  );
}
