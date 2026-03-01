'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTextSelection } from '@/hooks/useTextSelection';
import { useGraphStore } from '@/stores/graphStore';

export function SelectionToolbar() {
    const { isSelected, text, position } = useTextSelection('.message-content');
    const nodes = useGraphStore((state) => state.nodes);

    const [isExpanded, setIsExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isAppending, setIsAppending] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset expanded state when selection changes
    useEffect(() => {
        if (!isSelected) {
            setIsExpanded(false);
            setSearchQuery('');
        }
    }, [isSelected]);

    // Focus search input when expanded
    useEffect(() => {
        if (isExpanded && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isExpanded]);

    const filteredNeurons = nodes.filter((node) => {
        const title = (node.data as { title?: string })?.title || '';
        return title.toLowerCase().includes(searchQuery.toLowerCase());
    }).slice(0, 6);

    const handleAppend = useCallback(async (neuronId: string, neuronTitle: string) => {
        if (!text || isAppending) return;

        setIsAppending(true);
        try {
            const response = await fetch(`/api/neurons/${neuronId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ append_content: text }),
            });

            if (!response.ok) {
                throw new Error('Failed to append content');
            }

            setToastMessage(`Aggiunto a "${neuronTitle}"`);
            window.getSelection()?.removeAllRanges();

            setTimeout(() => {
                setToastMessage(null);
                setIsExpanded(false);
                setSearchQuery('');
            }, 2000);
        } catch (error) {
            console.error('Append error:', error);
            setToastMessage('Errore durante l\'aggiunta');
            setTimeout(() => setToastMessage(null), 2500);
        } finally {
            setIsAppending(false);
        }
    }, [text, isAppending]);

    if (!isSelected && !toastMessage) return null;

    return (
        <div
            data-selection-toolbar
            className="fixed z-[200] -translate-x-1/2 -translate-y-full"
            style={{ left: position.x, top: position.y }}
        >
            {toastMessage ? (
                <div className="rounded-lg bg-green-500/20 border border-green-500/30 backdrop-blur-xl px-4 py-2 text-sm text-green-400 font-medium shadow-xl animate-in fade-in">
                    ✓ {toastMessage}
                </div>
            ) : isExpanded ? (
                <div className="w-72 rounded-xl bg-neural-gray-900/95 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-white/5">
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cerca Neurone..."
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-neural-light placeholder:text-neural-light/30 focus:outline-none focus:border-neural-cyan/40"
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filteredNeurons.length === 0 ? (
                            <div className="px-3 py-4 text-xs text-neural-light/40 text-center">
                                Nessun Neurone trovato
                            </div>
                        ) : (
                            filteredNeurons.map((node) => {
                                const title = (node.data as { title?: string })?.title || node.id;
                                return (
                                    <button
                                        key={node.id}
                                        type="button"
                                        onClick={() => handleAppend(node.id, title)}
                                        disabled={isAppending}
                                        className="w-full text-left px-3 py-2.5 text-sm text-neural-light/80 hover:bg-white/5 hover:text-neural-cyan transition-colors flex items-center gap-2 border-b border-white/5 last:border-0"
                                    >
                                        <span className="text-neural-cyan text-xs">✦</span>
                                        <span className="truncate">{title}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className="rounded-lg bg-neural-cyan/90 hover:bg-neural-cyan text-black px-4 py-2 text-xs font-bold shadow-xl shadow-neural-cyan/20 transition-all hover:shadow-neural-cyan/30 flex items-center gap-1.5"
                >
                    <span className="text-sm">+</span>
                    Aggiungi a Neurone
                </button>
            )}
        </div>
    );
}
