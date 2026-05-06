import { setRequestLocale } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { PostEditorForm } from '@/components/post-editor/editor-form';
import type { Locale } from '@/i18n/routing';
import { fetchCategories } from '@/lib/server/categories';
import { fetchCurrentUser } from '@/lib/server/me';
import { isNotFound } from '@/lib/server/fetch';
import { fetchPostBySlug } from '@/lib/server/posts';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const me = await fetchCurrentUser();
  if (!me) redirect('/login');

  let post;
  try {
    post = await fetchPostBySlug(slug);
  } catch (err) {
    if (isNotFound(err)) notFound();
    throw err;
  }

  // Owner-only — admins can manage via /admin if needed.
  if (post.author.id !== me.id) notFound();

  const categories = await fetchCategories();

  return (
    <div className="px-6 lg:px-20">
      <PostEditorForm categories={categories} existingPost={post} />
    </div>
  );
}
