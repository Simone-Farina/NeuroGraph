'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

import { BouncerBubbleMenu } from '@/components/editor/BouncerBubbleMenu';
import {
  createSlashCommandExtension,
  createSlashCommands,
  type SlashMenuState,
} from '@/components/editor/SlashCommandMenu';
import type { Neuron } from '@/types/database';

interface LiquidDocumentEditorProps {
  neuron: Neuron;
  onSave: (updates: {
    title: string;
    content: string;
    definition?: string;
    core_insight?: string;
  }) => Promise<void>;
  isSaving?: boolean;
}

type ExtractionState = 'idle' | 'extracting' | 'done' | 'error';

/**
 * The Liquid Document Editor.
 * A beautiful, AI-assisted WYSIWYG writing surface for a single Neuron.
 *
 * Features:
 * - TipTap WYSIWYG with Newsreader typography
 * - Background AI extraction of definition + core_insight
 * - Slash commands (/) for AI text actions
 * - The Bouncer: bubble menu for highlight + inline chat
 * - Subtle visual indicators for bloom level, state, retrievability
 */
export function LiquidDocumentEditor({
  neuron,
  onSave,
  isSaving = false,
}: LiquidDocumentEditorProps) {
  const [title, setTitle] = useState(neuron.title || '');
  const [isDirty, setIsDirty] = useState(false);
  const [extractionState, setExtractionState] = useState<ExtractionState>('idle');
  const [extractedMeta, setExtractedMeta] = useState<{
    definition: string;
    core_insight: string;
    bloom_level: string;
  } | null>(null);
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState>({
    active: false,
    query: '',
    position: { top: 0, left: 0 },
    commands: [],
    selectedIndex: 0,
  });

  const extractionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // AI action handler for slash commands
  const handleAiAction = useCallback(
    async (type: string, content: string): Promise<void> => {
      setAiOutput(null);
      setAiOutput('');

      try {
        const response = await fetch('/api/neurons/ai-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            content,
            neuronTitle: title,
          }),
        });

        if (!response.ok || !response.body) {
          setAiOutput('AI action failed. Please try again.');
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setAiOutput(accumulated);
        }
      } catch {
        setAiOutput('Stream interrupted. Please try again.');
      }
    },
    [title]
  );

  const slashCommands = useMemo(() => createSlashCommands(handleAiAction), [handleAiAction]);
  const slashExtension = useMemo(
    () => createSlashCommandExtension(slashCommands, setSlashMenu),
    [slashCommands]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Typography,
      Placeholder.configure({
        placeholder: 'Write freely. The AI will extract the knowledge graph for you...',
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            'text-white/70 underline underline-offset-4 decoration-white/30 hover:decoration-white/60 transition-colors',
        },
      }),
      slashExtension,
    ],
    content: neuron.content || '',
    editorProps: {
      attributes: {
        class: [
          'prose prose-invert max-w-none',
          'font-serif text-[15px] leading-[1.8] text-white/88',
          'focus:outline-none',
          'prose-headings:font-serif prose-headings:text-white prose-headings:font-semibold prose-headings:tracking-tight',
          'prose-h1:text-[1.6rem] prose-h1:mb-4 prose-h1:mt-8',
          'prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-6',
          'prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-5',
          'prose-p:mb-4',
          'prose-strong:text-white prose-strong:font-semibold',
          'prose-em:text-white/72 prose-em:italic',
          'prose-code:text-white/80 prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:font-mono prose-code:border prose-code:border-white/[0.06] prose-code:not-italic',
          'prose-pre:bg-[#0c0c0e] prose-pre:border prose-pre:border-white/[0.07] prose-pre:rounded-xl prose-pre:p-5',
          'prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5',
          'prose-li:mb-1.5',
          'prose-blockquote:border-l-2 prose-blockquote:border-white/15 prose-blockquote:pl-4 prose-blockquote:text-white/55 prose-blockquote:italic',
          'prose-hr:border-white/8',
        ].join(' '),
      },
    },
    onUpdate: () => {
      setIsDirty(true);

      // Debounced AI extraction: fire after 2.5s of inactivity
      if (extractionTimerRef.current) {
        clearTimeout(extractionTimerRef.current);
      }
      extractionTimerRef.current = setTimeout(() => {
        triggerExtraction();
      }, 2500);
    },
  });

  const triggerExtraction = useCallback(async () => {
    if (!editor) return;
    const content = editor.getText().trim();
    if (!title.trim() || content.length < 40) return;

    setExtractionState('extracting');
    try {
      const response = await fetch('/api/neurons/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        setExtractionState('error');
        return;
      }

      const data = await response.json();
      setExtractedMeta(data);
      setExtractionState('done');
    } catch {
      setExtractionState('error');
    }
  }, [editor, title]);

  // Sync neuron data when it changes externally
  useEffect(() => {
    setTitle(neuron.title || '');
    setIsDirty(false);
    setExtractedMeta(null);
    setExtractionState('idle');
    setAiOutput(null);
  }, [neuron.id, neuron.title]);

  useEffect(() => {
    if (!editor) return;
    if (!editor.isFocused) {
      editor.commands.setContent(neuron.content || '');
    }
  }, [neuron.content, editor]);

  const handleSave = useCallback(async () => {
    if (!editor) return;

    await onSave({
      title,
      content: editor.getHTML(),
      definition: extractedMeta?.definition,
      core_insight: extractedMeta?.core_insight,
    });

    setIsDirty(false);
  }, [editor, title, extractedMeta, onSave]);

  // Keyboard shortcut: Cmd/Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty) handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isDirty, handleSave]);

  const bloomColor: Record<string, string> = {
    Remember: 'text-white/40',
    Understand: 'text-emerald-400/70',
    Apply: 'text-sky-400/70',
    Analyze: 'text-violet-400/70',
    Evaluate: 'text-amber-400/70',
    Create: 'text-rose-400/70',
  };

  const stateColor: Record<string, string> = {
    New: 'bg-white/5 text-white/40',
    Learning: 'bg-sky-500/10 text-sky-400/70',
    Review: 'bg-emerald-500/10 text-emerald-400/70',
    Relearning: 'bg-amber-500/10 text-amber-400/70',
  };

  const retrievabilityPct = Math.round((neuron.retrievability ?? 1) * 100);

  const bloomLevel = (extractedMeta?.bloom_level || neuron.bloom_level) as string;

  return (
    <div className="flex flex-col h-full">
      {/* Title bar */}
      <div className="flex-shrink-0 px-6 pt-6 pb-0">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setIsDirty(true);
          }}
          placeholder="Neuron Title"
          className="w-full bg-transparent text-white text-2xl font-serif font-semibold tracking-tight placeholder-white/20 focus:outline-none border-none leading-tight"
        />
      </div>

      {/* Metadata tags row */}
      <div className="flex-shrink-0 flex items-center gap-2 px-6 pt-3 pb-4 border-b border-white/5">
        {/* State badge */}
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
            stateColor[neuron.state] || stateColor['New']
          }`}
        >
          {neuron.state}
        </span>

        {/* Bloom level */}
        <span
          className={`text-[10px] font-medium uppercase tracking-wider ${
            bloomColor[bloomLevel] || 'text-white/40'
          }`}
        >
          {bloomLevel}
        </span>

        {/* Retrievability */}
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/25 transition-all duration-300"
              style={{ width: `${retrievabilityPct}%` }}
            />
          </div>
          <span className="text-[10px] text-white/25 tabular-nums">{retrievabilityPct}%</span>
        </div>

        {/* Extraction indicator */}
        {extractionState === 'extracting' && (
          <div className="flex items-center gap-1 text-white/30">
            <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse" />
            <span className="text-[9px] uppercase tracking-wider">Extracting</span>
          </div>
        )}
        {extractionState === 'done' && (
          <div className="flex items-center gap-1 text-emerald-400/50">
            <span className="text-[9px] uppercase tracking-wider">Graph updated</span>
          </div>
        )}
      </div>

      {/* Editor area */}
      <div
        ref={editorContainerRef}
        className="flex-1 overflow-y-auto px-6 py-5 relative custom-scrollbar"
        onClick={() => editor?.commands.focus()}
      >
        {editor && <BouncerBubbleMenu editor={editor} neuronTitle={title} />}

        {/* Slash command overlay */}
        {slashMenu.active && slashMenu.commands.length > 0 && (
          <div
            className="absolute z-50 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[220px]"
            style={{
              top: slashMenu.position.top,
              left: slashMenu.position.left,
            }}
          >
            <div className="px-3 py-2 border-b border-white/5">
              <span className="text-[9px] text-white/30 uppercase tracking-widest font-sans">
                AI Commands
              </span>
            </div>
            <div className="p-1.5 space-y-0.5">
              {slashMenu.commands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    index === slashMenu.selectedIndex
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                  onClick={() => {
                    setSlashMenu((s) => ({ ...s, active: false }));
                    cmd.action(editor!);
                  }}
                  onMouseEnter={() =>
                    setSlashMenu((s) => ({ ...s, selectedIndex: index }))
                  }
                >
                  <span className="text-sm leading-none">{cmd.icon}</span>
                  <div>
                    <div className="text-[13px] font-medium font-sans">{cmd.title}</div>
                    <div className="text-[11px] text-white/35">{cmd.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <EditorContent editor={editor} />

        {/* AI Output panel (slash command results) */}
        {aiOutput !== null && (
          <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/30 uppercase tracking-widest font-sans">
                AI Response
              </span>
              <button
                onClick={() => setAiOutput(null)}
                className="text-white/25 hover:text-white/60 text-xs transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-[14px] text-white/75 font-serif leading-relaxed whitespace-pre-wrap">
              {aiOutput}
              {aiOutput !== null && aiOutput.length === 0 && (
                <span className="inline-block w-0.5 h-4 bg-white/40 animate-pulse align-middle" />
              )}
            </p>
            {aiOutput && (
              <button
                onClick={() => {
                  editor?.chain().focus().insertContentAt(editor.state.doc.content.size, `\n\n${aiOutput}`).run();
                  setAiOutput(null);
                  setIsDirty(true);
                }}
                className="text-[11px] text-white/40 hover:text-white/70 transition-colors underline underline-offset-2"
              >
                Insert into document
              </button>
            )}
          </div>
        )}

        {/* Extracted metadata preview */}
        {extractedMeta && extractionState === 'done' && (
          <div className="mt-6 p-4 rounded-xl bg-white/[0.015] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/25 uppercase tracking-widest font-sans">
                Extracted Metadata
              </span>
              <button
                onClick={() => setExtractedMeta(null)}
                className="text-white/20 hover:text-white/50 text-xs transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-[9px] text-white/25 uppercase tracking-wider mb-1 font-sans">
                  Definition
                </div>
                <p className="text-[13px] text-white/60 font-serif leading-relaxed">
                  {extractedMeta.definition}
                </p>
              </div>
              <div>
                <div className="text-[9px] text-white/25 uppercase tracking-wider mb-1 font-sans">
                  Core Insight
                </div>
                <p className="text-[13px] text-white/60 font-serif italic leading-relaxed">
                  {extractedMeta.core_insight}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save footer */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
        <p className="text-[11px] text-white/25 font-sans">
          {isDirty
            ? 'Unsaved changes · Cmd+S to save'
            : 'All changes saved'}
        </p>
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
            isDirty && !isSaving
              ? 'bg-white/90 text-black hover:bg-white active:scale-[0.98]'
              : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
          }`}
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-black/20 border-t-black" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          )}
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
