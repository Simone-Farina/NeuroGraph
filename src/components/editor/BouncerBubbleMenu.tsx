'use client';

import type { Editor } from '@tiptap/core';
import { useState, useRef, useCallback, useEffect } from 'react';

interface BouncerBubbleMenuProps {
  editor: Editor;
  neuronTitle?: string;
}

type BouncerMode = 'toolbar' | 'chat' | 'loading';

/**
 * The Bouncer - a floating bubble menu that appears when text is selected.
 * Offers quick AI actions and an inline conversational interface
 * tied explicitly to the selected text passage.
 *
 * Uses editor selection state to position itself without external tippy dependency.
 */
export function BouncerBubbleMenu({ editor, neuronTitle }: BouncerBubbleMenuProps) {
  const [mode, setMode] = useState<BouncerMode>('toolbar');
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [proposedReplacement, setProposedReplacement] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Track editor selection to show/hide and position the menu
  useEffect(() => {
    const updateMenu = () => {
      const { selection } = editor.state;

      if (selection.empty || !editor.isFocused) {
        setMenuPosition(null);
        setSelectedText('');
        return;
      }

      const text = editor.state.doc.textBetween(selection.from, selection.to, ' ');
      if (!text.trim()) {
        setMenuPosition(null);
        return;
      }

      setSelectedText(text);

      // Get the DOM selection to compute coordinates
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) {
        setMenuPosition(null);
        return;
      }

      const range = domSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorEl = editor.view.dom;
      const editorRect = editorEl.getBoundingClientRect();

      setMenuPosition({
        top: rect.top - editorRect.top - 8, // above selection
        left: rect.left - editorRect.left + rect.width / 2,
      });
    };

    editor.on('selectionUpdate', updateMenu);
    editor.on('focus', updateMenu);
    editor.on('blur', () => {
      // Delay so clicks on the menu itself are registered first
      setTimeout(() => {
        if (!menuRef.current?.contains(document.activeElement)) {
          setMenuPosition(null);
        }
      }, 150);
    });

    return () => {
      editor.off('selectionUpdate', updateMenu);
    };
  }, [editor]);

  const runAiAction = useCallback(
    async (actionType: string, userMessage?: string) => {
      if (!selectedText.trim()) return;

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setMode('loading');
      setIsStreaming(true);
      setChatResponse('');
      setProposedReplacement(null);

      try {
        const response = await fetch('/api/neurons/ai-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: actionType,
            content: userMessage
              ? `User request: ${userMessage}\n\nSelected text:\n${selectedText}`
              : selectedText,
            selection: selectedText,
            neuronTitle: neuronTitle || '',
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          setChatResponse('The Bouncer encountered an error. Try again.');
          setMode('chat');
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setChatResponse(accumulated);
        }

        setProposedReplacement(accumulated.trim());
        setMode('chat');
      } catch (error) {
        if ((error as Error)?.name !== 'AbortError') {
          setChatResponse('Stream interrupted. Please try again.');
          setMode('chat');
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [selectedText, neuronTitle]
  );

  const handleAcceptReplacement = useCallback(() => {
    if (!proposedReplacement) return;
    editor.chain().focus().deleteSelection().insertContent(proposedReplacement).run();
    setMode('toolbar');
    setChatResponse(null);
    setProposedReplacement(null);
    setMenuPosition(null);
  }, [editor, proposedReplacement]);

  const handleDismiss = useCallback(() => {
    setMode('toolbar');
    setChatResponse(null);
    setProposedReplacement(null);
    setChatInput('');
    abortControllerRef.current?.abort();
  }, []);

  const handleChatSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim()) return;
      const message = chatInput;
      setChatInput('');
      runAiAction('inline-chat', message);
    },
    [chatInput, runAiAction]
  );

  if (!menuPosition || !selectedText) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 pointer-events-auto"
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden max-w-sm w-max">
        {mode === 'toolbar' && (
          <div className="flex items-center gap-0.5 p-1.5">
            <button
              onMouseDown={(e) => { e.preventDefault(); runAiAction('rewrite'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap"
            >
              <span className="text-xs">↺</span>
              Rewrite
            </button>
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <button
              onMouseDown={(e) => { e.preventDefault(); runAiAction('expand'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap"
            >
              <span className="text-xs">⟴</span>
              Expand
            </button>
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <button
              onMouseDown={(e) => { e.preventDefault(); runAiAction('challenge'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap"
            >
              <span className="text-xs">⚡</span>
              Challenge
            </button>
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <button
              onMouseDown={(e) => { e.preventDefault(); setMode('chat'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap"
            >
              <span className="text-xs">◎</span>
              Chat
            </button>
          </div>
        )}

        {mode === 'loading' && (
          <div className="p-4 space-y-2 min-w-[220px]">
            <div className="flex items-center gap-2 text-white/40 text-xs">
              <div className="animate-spin rounded-full h-3 w-3 border border-white/20 border-t-white/60" />
              <span className="font-sans tracking-wide">Bouncer thinking...</span>
            </div>
            {chatResponse && (
              <p className="text-white/70 text-[13px] font-serif leading-relaxed whitespace-pre-wrap">
                {chatResponse}
              </p>
            )}
          </div>
        )}

        {mode === 'chat' && (
          <div className="min-w-[300px] max-w-sm space-y-0">
            {/* Selected text preview */}
            <div className="px-4 pt-3 pb-2 border-b border-white/5">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5 font-sans">
                Selected passage
              </p>
              <p className="text-[12px] text-white/50 font-serif italic line-clamp-2 leading-relaxed">
                &ldquo;{selectedText}&rdquo;
              </p>
            </div>

            {/* AI Response */}
            {chatResponse && (
              <div className="px-4 py-3 border-b border-white/5 max-h-40 overflow-y-auto">
                <p className="text-[13px] text-white/80 font-serif leading-relaxed whitespace-pre-wrap">
                  {chatResponse}
                  {isStreaming && (
                    <span className="inline-block w-0.5 h-3.5 bg-white/50 ml-0.5 animate-pulse align-middle" />
                  )}
                </p>
              </div>
            )}

            {/* Accept / Dismiss actions */}
            {proposedReplacement && !isStreaming && (
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                <button
                  onClick={handleAcceptReplacement}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[12px] font-medium transition-colors"
                >
                  Accept replacement
                </button>
                <button
                  onClick={handleDismiss}
                  className="py-1.5 px-3 rounded-lg text-white/40 hover:text-white text-[12px] transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Chat input */}
            <form onSubmit={handleChatSubmit} className="flex items-center gap-2 p-2">
              <input
                autoFocus
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about this passage..."
                className="flex-1 bg-transparent text-[13px] text-white/80 placeholder-white/30 focus:outline-none font-serif px-2 py-1"
                disabled={isStreaming}
              />
              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white transition-colors text-xs"
                >
                  ✕
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/80 disabled:opacity-30 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              )}
            </form>

            <button
              onClick={handleDismiss}
              className="w-full py-1.5 text-[10px] text-white/25 hover:text-white/50 transition-colors uppercase tracking-widest font-sans border-t border-white/5"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
