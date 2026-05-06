import { setRequestLocale } from 'next-intl/server';
import { PostEditorForm } from '@/components/post-editor/editor-form';
import type { Locale } from '@/i18n/routing';
import { fetchCategories } from '@/lib/server/categories';

export default async function NewPostPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const categories = await fetchCategories();

  return (
    <div className="px-6 lg:px-20">
      <PostEditorForm categories={categories} />
    </div>
  );
}
