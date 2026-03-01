'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type TextSelection = {
    isSelected: boolean;
    text: string;
    position: { x: number; y: number };
};

const EMPTY_SELECTION: TextSelection = {
    isSelected: false,
    text: '',
    position: { x: 0, y: 0 },
};

/**
 * Hook that tracks text selection within elements matching a given CSS selector.
 * Uses mouseup/mousedown to avoid re-render storms from selectionchange.
 */
export function useTextSelection(selector = '.message-content'): TextSelection {
    const [selection, setSelection] = useState<TextSelection>(EMPTY_SELECTION);
    const lastTextRef = useRef('');

    const handleMouseUp = useCallback(() => {
        // Defer to next tick so the browser selection is finalized
        requestAnimationFrame(() => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed || !sel.rangeCount) {
                return; // Don't clear here — mousedown handles that
            }

            const text = sel.toString().trim();
            if (!text || text === lastTextRef.current) return;

            // Check if the selection is within a matching element
            const anchorNode = sel.anchorNode;
            const element = anchorNode instanceof HTMLElement
                ? anchorNode
                : anchorNode?.parentElement;

            if (!element?.closest(selector)) return;

            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            lastTextRef.current = text;
            setSelection({
                isSelected: true,
                text,
                position: {
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10,
                },
            });
        });
    }, [selector]);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        // Only clear if clicking outside the toolbar itself
        const target = e.target as HTMLElement;
        if (target.closest('[data-selection-toolbar]')) return;

        if (lastTextRef.current) {
            lastTextRef.current = '';
            setSelection(EMPTY_SELECTION);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, [handleMouseUp, handleMouseDown]);

    return selection;
}
