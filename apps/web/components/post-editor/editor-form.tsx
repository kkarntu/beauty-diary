'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { CategoryDto, PostDetailDto } from '@beauty-diary/shared';
import { CreatePostDto } from '@beauty-diary/shared';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { CoverUploader } from '@/components/post-editor/cover-uploader';
import { EditorStats } from '@/components/post-editor/editor-stats';
import { RichTextEditor } from '@/components/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Link, useRouter } from '@/i18n/navigation';
import { getApiErrorCode } from '@/lib/api';
import { useAutoSaveDraft } from '@/lib/queries/post-autosave';
import { useCreatePost, useUpdatePost } from '@/lib/queries/posts';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

type FormValues = z.infer<typeof CreatePostDto>;

const KNOWN_CATEGORY_SLUGS = ['skincare', 'makeup', 'hair', 'wellness', 'fashion', 'lifestyle'];

interface Props {
  categories: CategoryDto[];
  existingPost?: PostDetailDto & { categoryId?: string };
}

export function PostEditorForm({ categories, existingPost }: Props) {
  const t = useTranslations('postEditor');
  const tCat = useTranslations('categories');
  const router = useRouter();
  const create = useCreatePost();
  const update = useUpdatePost(existingPost?.id ?? '');
  const isEdit = Boolean(existingPost);

  // Resolve categoryId: PostDetailDto carries category.slug/name but we need
  // the id for the form. Look it up against the categories list.
  const initialCategoryId = existingPost
    ? (categories.find((c) => c.slug === existingPost.category.slug)?.id ?? '')
    : '';

  const form = useForm<FormValues>({
    resolver: zodResolver(CreatePostDto, {
      errorMap: (issue, ctx) => {
        if (issue.path[0] === 'categoryId') {
          return { message: t('category.required') };
        }
        return { message: ctx.defaultError };
      },
    }),
    defaultValues: {
      title: existingPost?.title ?? '',
      excerpt: existingPost?.excerpt ?? '',
      contentHtml: existingPost?.contentHtml ?? '',
      categoryId: initialCategoryId,
      tagSlugs: existingPost?.tags.map((t) => t.slug) ?? [],
      coverImageUrl: existingPost?.coverImageUrl ?? '',
      status: existingPost?.status === 'published' ? 'published' : 'draft',
      allowComments: existingPost?.allowComments ?? true,
      showInFeed: existingPost?.showInFeed ?? true,
    },
  });

  const contentHtml = form.watch('contentHtml') ?? '';
  const coverError = form.formState.errors.coverImageUrl;

  const [tagsRaw, setTagsRaw] = useState(
    existingPost ? existingPost.tags.map((t) => t.slug).join(', ') : '',
  );
  const [showPreview, setShowPreview] = useState(false);
  const allowComments = form.watch('allowComments') ?? true;
  const showInFeed = form.watch('showInFeed') ?? true;

  const submit = async (values: FormValues, status: 'draft' | 'published') => {
    try {
      const tagSlugs = tagsRaw
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const payload: FormValues = {
        ...values,
        status,
        tagSlugs,
        excerpt: values.excerpt && values.excerpt.length > 0 ? values.excerpt : undefined,
        coverImageUrl:
          values.coverImageUrl && values.coverImageUrl.length > 0
            ? values.coverImageUrl
            : undefined,
      };

      if (isEdit && existingPost) {
        await update.mutateAsync(payload);
        toast.success(status === 'published' ? t('toast.published') : t('toast.savedDraft'));
        // Slug may have changed if title changed; re-fetch by id is not in the
        // API, so navigate using the slug we already know.
        router.push(routes.postDetail(existingPost.slug));
        router.refresh();
      } else {
        const result = await create.mutateAsync(payload);
        toast.success(status === 'published' ? t('toast.published') : t('toast.savedDraft'));
        router.push(routes.postDetail(result.slug));
      }
    } catch (err) {
      const code = getApiErrorCode(err);
      toast.error(code === 'POST_SLUG_CONFLICT' ? t('toast.slugConflict') : t('toast.unknown'));
    }
  };

  const isSubmitting = create.isPending || update.isPending;

  // Drafts auto-save: only when editing an existing post, only when the
  // form is valid enough that the API would accept a PATCH. Debounces 2.5s.
  const watched = form.watch();
  const tagSlugsForAutosave = tagsRaw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const autosavePayload = {
    title: watched.title,
    excerpt: watched.excerpt && watched.excerpt.length > 0 ? watched.excerpt : undefined,
    contentHtml: watched.contentHtml,
    categoryId: watched.categoryId || undefined,
    tagSlugs: tagSlugsForAutosave,
    coverImageUrl:
      watched.coverImageUrl && watched.coverImageUrl.length > 0 ? watched.coverImageUrl : undefined,
    allowComments: watched.allowComments,
    showInFeed: watched.showInFeed,
  };
  const autoSaveEnabled = Boolean(
    isEdit &&
    existingPost &&
    watched.title &&
    watched.title.length >= 3 &&
    watched.contentHtml &&
    watched.contentHtml.length > 0 &&
    watched.categoryId,
  );
  const { status: autoSaveStatus, lastSavedAt } = useAutoSaveDraft({
    postId: existingPost?.id,
    payload: autosavePayload,
    enabled: autoSaveEnabled,
  });

  const onInvalid = () => {
    toast.error(t('toast.validation'));
  };
  const onSaveDraft = form.handleSubmit((values) => submit(values, 'draft'), onInvalid);
  const onPublish = form.handleSubmit((values) => submit(values, 'published'), onInvalid);

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        {/* Sticky action bar */}
        <div className="bg-background/80 border-border sticky top-16 z-30 -mx-6 border-b px-6 py-3 backdrop-blur lg:-mx-20 lg:px-20">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link href={routes.myPosts}>
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t('backToMyPosts')}</span>
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              {isEdit && existingPost ? (
                <span className="text-foreground-muted hidden text-xs md:inline">
                  {autoSaveStatus === 'pending'
                    ? t('autosave.saving')
                    : autoSaveStatus === 'error'
                      ? t('autosave.error')
                      : lastSavedAt
                        ? t('autosave.savedAt', {
                            time: lastSavedAt.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            }),
                          })
                        : null}
                </span>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSaveDraft}
                disabled={isSubmitting}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {isSubmitting ? t('actions.saving') : t('actions.saveDraft')}
                </span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onPublish}
                disabled={isSubmitting}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? t('actions.publishing') : t('actions.publishShort')}
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] px-0 py-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Main column */}
            <div className="space-y-6 lg:col-span-8">
              <FormField
                control={form.control}
                name="coverImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <CoverUploader
                        value={field.value ?? ''}
                        onChange={(url) => field.onChange(url)}
                        hasError={!!coverError}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <input
                        {...field}
                        type="text"
                        placeholder={t('title.placeholder')}
                        aria-invalid={!!form.formState.errors.title}
                        style={{ fontFamily: 'var(--font-display)' }}
                        className={cn(
                          'placeholder:text-foreground-muted/50 text-foreground w-full border-0 bg-transparent px-3 py-2 text-3xl font-medium outline-none focus:outline-none md:text-4xl',
                          form.formState.errors.title && 'text-destructive',
                        )}
                      />
                    </FormControl>
                    <FormMessage className="px-3" />
                  </FormItem>
                )}
              />

              {/* Edit / Preview tabs — underline style with primary accent */}
              <div className="border-border flex gap-6 border-b">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className={cn(
                    'px-1 pb-3 text-sm font-medium transition-colors',
                    !showPreview
                      ? 'text-foreground border-primary -mb-px border-b-2'
                      : 'text-foreground-muted hover:text-foreground',
                  )}
                >
                  {t('tabs.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className={cn(
                    'px-1 pb-3 text-sm font-medium transition-colors',
                    showPreview
                      ? 'text-foreground border-primary -mb-px border-b-2'
                      : 'text-foreground-muted hover:text-foreground',
                  )}
                >
                  {t('tabs.preview')}
                </button>
              </div>

              <FormField
                control={form.control}
                name="contentHtml"
                render={({ field }) => (
                  <FormItem>
                    {showPreview ? (
                      contentHtml ? (
                        <div
                          className="post-content border-border bg-surface min-h-[400px] rounded-lg border px-6 py-4"
                          dangerouslySetInnerHTML={{ __html: contentHtml }}
                        />
                      ) : (
                        <div className="border-border bg-surface text-foreground-muted min-h-[400px] rounded-lg border px-6 py-4 italic">
                          {t('preview.empty')}
                        </div>
                      )
                    ) : (
                      <FormControl>
                        <RichTextEditor
                          content={field.value ?? ''}
                          onChange={field.onChange}
                          placeholder={t('content.placeholder')}
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sticky sidebar */}
            <aside className="lg:col-span-4">
              <div className="space-y-6 lg:sticky lg:top-32">
                <div className="bg-surface border-border rounded-lg border p-5">
                  <h3 className="text-foreground mb-3 font-medium">{t('category.label')}</h3>
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t('category.placeholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {KNOWN_CATEGORY_SLUGS.includes(c.slug) ? tCat(c.slug) : c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-surface border-border rounded-lg border p-5">
                  <h3 className="text-foreground mb-3 font-medium">{t('tags.label')}</h3>
                  <Input
                    placeholder={t('tags.placeholder')}
                    value={tagsRaw}
                    onChange={(e) => {
                      setTagsRaw(e.target.value);
                      const slugs = e.target.value
                        .split(',')
                        .map((s) => s.trim().toLowerCase())
                        .filter(Boolean);
                      form.setValue('tagSlugs', slugs);
                    }}
                    className="text-sm"
                  />
                  <p className="text-foreground-muted mt-2 text-xs">{t('tags.description')}</p>
                </div>

                <div className="bg-surface border-border rounded-lg border p-5">
                  <h3 className="text-foreground mb-3 font-medium">{t('excerpt.label')}</h3>
                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea {...field} placeholder={t('excerpt.placeholder')} rows={3} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {t('excerpt.description')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-surface border-border rounded-lg border p-5">
                  <h3 className="text-foreground mb-4 font-medium">{t('settings.title')}</h3>
                  <div className="space-y-4">
                    <label className="group flex cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={allowComments}
                        onCheckedChange={(checked) =>
                          form.setValue('allowComments', checked === true, {
                            shouldDirty: true,
                          })
                        }
                      />
                      <span className="text-foreground group-hover:text-primary text-sm transition-colors">
                        {t('settings.allowComments')}
                      </span>
                    </label>
                    <label className="group flex cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={showInFeed}
                        onCheckedChange={(checked) =>
                          form.setValue('showInFeed', checked === true, {
                            shouldDirty: true,
                          })
                        }
                      />
                      <span className="text-foreground group-hover:text-primary text-sm transition-colors">
                        {t('settings.showInFeed')}
                      </span>
                    </label>
                  </div>
                </div>

                <EditorStats contentHtml={contentHtml} />
              </div>
            </aside>
          </div>
        </div>
      </form>
    </Form>
  );
}
