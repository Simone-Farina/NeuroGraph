'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

interface NeuronTipTapEditorProps {
  content: string;
  placeholder?: string;
  onChange?: (json: string) => void;
  editable?: boolean;
  className?: string;
}

/**
 * Core TipTap editor component styled to the "Danish Computation" aesthetic.
 * Uses Newsreader serif font and Graphite/Charcoal color scales.
 * Supports markdown shortcuts (**, __, ##, etc.) via StarterKit + Typography.
 */
export function NeuronTipTapEditor({
  content,
  placeholder = 'Write freely. The AI will extract the knowledge graph for you...',
  onChange,
  editable = true,
  className = '',
}: NeuronTipTapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Enable markdown shortcut parsing
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Typography,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-white/70 underline underline-offset-4 decoration-white/30 hover:decoration-white/60 transition-colors',
        },
      }),
    ],
    content: content || '',
    editable,
    editorProps: {
      attributes: {
        class: [
          'prose prose-invert max-w-none',
          'font-serif text-[15px] leading-[1.75] text-white/90',
          'focus:outline-none',
          'prose-headings:font-serif prose-headings:text-white prose-headings:font-semibold',
          'prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-8 prose-h1:tracking-tight',
          'prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-6',
          'prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-5',
          'prose-p:mb-4 prose-p:leading-[1.75]',
          'prose-strong:text-white prose-strong:font-semibold',
          'prose-em:text-white/75 prose-em:italic',
          'prose-code:text-white/80 prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:font-mono prose-code:border prose-code:border-white/[0.06]',
          'prose-pre:bg-[#0f0f0f] prose-pre:border prose-pre:border-white/[0.08] prose-pre:rounded-xl prose-pre:p-5',
          'prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6',
          'prose-li:mb-1.5 prose-li:leading-[1.75]',
          'prose-blockquote:border-l-2 prose-blockquote:border-white/20 prose-blockquote:pl-4 prose-blockquote:text-white/60 prose-blockquote:italic',
          'prose-hr:border-white/10',
          className,
        ].join(' '),
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(JSON.stringify(editor.getJSON()));
      }
    },
  });

  // Sync external content changes (e.g., when neuron loads)
  // Compare JSON serializations to avoid spurious setContent calls.
  // setContent(_, false) prevents triggering onChange on programmatic sync.
  useEffect(() => {
    if (!editor) return;
    if (editor.isFocused) return;
    const currentJson = JSON.stringify(editor.getJSON());
    const incoming = content || '';
    if (incoming !== currentJson) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [editor, content]);

  // Update editable state
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  return (
    <EditorContent
      editor={editor}
      className="min-h-[120px] cursor-text"
    />
  );
}
