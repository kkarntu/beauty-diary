'use client';

import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo,
  Undo,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/**
 * Tiptap rich-text editor — outputs HTML which the API sanitizes on save.
 * Imports its own font tokens so the editor body inherits the page's
 * Cormorant + Inter pairing.
 */
export function RichTextEditor({ content, onChange, placeholder }: Props) {
  const t = useTranslations('editor');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder ?? t('placeholder'),
      }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'post-content max-w-none min-h-[400px] p-4 focus:outline-none text-foreground',
      },
    },
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
  });

  if (!editor) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-surface">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-surface-muted">
        <ToolbarButton
          icon={Bold}
          label={t('bold')}
          editor={editor}
          isActive={editor.isActive('bold')}
          onActivate={(e) => e.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          icon={Italic}
          label={t('italic')}
          editor={editor}
          isActive={editor.isActive('italic')}
          onActivate={(e) => e.chain().focus().toggleItalic().run()}
        />
        <Divider />
        <ToolbarButton
          icon={Heading2}
          label="H2"
          editor={editor}
          isActive={editor.isActive('heading', { level: 2 })}
          onActivate={(e) => e.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          icon={Heading3}
          label="H3"
          editor={editor}
          isActive={editor.isActive('heading', { level: 3 })}
          onActivate={(e) => e.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <Divider />
        <ToolbarButton
          icon={List}
          label={t('bulletList')}
          editor={editor}
          isActive={editor.isActive('bulletList')}
          onActivate={(e) => e.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          icon={ListOrdered}
          label={t('orderedList')}
          editor={editor}
          isActive={editor.isActive('orderedList')}
          onActivate={(e) => e.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          icon={Quote}
          label={t('blockquote')}
          editor={editor}
          isActive={editor.isActive('blockquote')}
          onActivate={(e) => e.chain().focus().toggleBlockquote().run()}
        />
        <Divider />
        <ToolbarButton
          icon={Undo}
          label={t('undo')}
          editor={editor}
          isActive={false}
          disabled={!editor.can().undo()}
          onActivate={(e) => e.chain().focus().undo().run()}
        />
        <ToolbarButton
          icon={Redo}
          label={t('redo')}
          editor={editor}
          isActive={false}
          disabled={!editor.can().redo()}
          onActivate={(e) => e.chain().focus().redo().run()}
        />
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

interface ToolbarButtonProps {
  icon: LucideIcon;
  label: string;
  editor: Editor;
  isActive: boolean;
  disabled?: boolean;
  onActivate: (editor: Editor) => void;
}

function ToolbarButton({
  icon: Icon,
  label,
  editor,
  isActive,
  disabled,
  onActivate,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={label}
      disabled={disabled}
      // CRITICAL: prevent the default mousedown so the editor doesn't lose
      // selection before our click handler runs. Without this, block-level
      // commands like toggleHeading and toggleBulletList silently no-op
      // because there's no active selection by the time they execute.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onActivate(editor)}
      className={cn(isActive && 'bg-primary/10 text-primary')}
    >
      <Icon className="w-4 h-4" />
    </Button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-border mx-1" />;
}
