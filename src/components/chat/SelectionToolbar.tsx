'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTextSelection } from '@/hooks/useTextSelection';
import { useGraphStore } from '@/stores/graphStore';

type SelectedNeuron = { id: string; title: string };

export function SelectionToolbar() {
    const { isSelected, text, position } = useTextSelection('.message-content');
    const nodes = useGraphStore((state) => state.nodes);

    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedNeuron, setSelectedNeuron] = useState<SelectedNeuron | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const [isBusy, setIsBusy] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset state when selection changes
    useEffect(() => {
        if (!isSelected) {
            setIsExpanded(false);
            setSelectedNeuron(null);
            setSearchQuery('');
        }
    }, [isSelected]);

    // Focus search input when expanded
    useEffect(() => {
        if (isExpanded && !selectedNeuron && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isExpanded, selectedNeuron]);

    const filteredNeurons = nodes.filter((node) => {
        const title = (node.data as { title?: string })?.title || '';
        return title.toLowerCase().includes(searchQuery.toLowerCase());
    }).slice(0, 6);

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        const timeout = type === 'error' ? 2500 : 2000;
        setTimeout(() => {
            setToastMessage(null);
            setIsExpanded(false);
            setSelectedNeuron(null);
            setSearchQuery('');
        }, timeout);
    }, []);

    const handleQuoteAppend = useCallback(async () => {
        if (!text || !selectedNeuron || isBusy) return;

        setIsBusy(true);
        try {
            const response = await fetch(`/api/neurons/${selectedNeuron.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ append_content: text }),
            });

            if (!response.ok) throw new Error('Failed to append content');

            window.getSelection()?.removeAllRanges();
            showToast(`Aggiunto a "${selectedNeuron.title}"`);
        } catch (error) {
            console.error('Append error:', error);
            showToast('Errore durante l\'aggiunta', 'error');
        } finally {
            setIsBusy(false);
        }
    }, [text, selectedNeuron, isBusy, showToast]);

    const handleSynthesize = useCallback(async () => {
        if (!text || !selectedNeuron || isBusy) return;

        setIsBusy(true);
        try {
            const response = await fetch(`/api/neurons/${selectedNeuron.id}/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newText: text }),
            });

            if (!response.ok) throw new Error('Synthesis failed');

            window.getSelection()?.removeAllRanges();
            showToast(`Sintetizzato in "${selectedNeuron.title}"`);
        } catch (error) {
            console.error('Synthesize error:', error);
            showToast('Errore durante la sintesi', 'error');
        } finally {
            setIsBusy(false);
        }
    }, [text, selectedNeuron, isBusy, showToast]);

    if (!isSelected && !toastMessage) return null;

    return (
        <div
            data-selection-toolbar
            className="fixed z-[200] -translate-x-1/2 -translate-y-full"
            style={{ left: position.x, top: position.y }}
        >
            {toastMessage ? (
                <div className={`rounded-lg backdrop-blur-xl px-4 py-2 text-sm font-medium shadow-xl animate-in fade-in ${
                    toastType === 'error'
                        ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                        : 'bg-green-500/20 border border-green-500/30 text-green-400'
                }`}>
                    {toastType === 'error' ? '✗' : '✓'} {toastMessage}
                </div>
            ) : selectedNeuron ? (
                /* Dual-action buttons after neuron selection */
                <div className="rounded-xl bg-neural-gray-900/95 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
                        <span className="text-neural-cyan text-xs">✦</span>
                        <span className="text-xs text-neural-light/70 truncate max-w-[180px]">{selectedNeuron.title}</span>
                        <button
                            type="button"
                            onClick={() => setSelectedNeuron(null)}
                            className="ml-auto text-neural-light/30 hover:text-neural-light/60 transition-colors text-xs"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="flex gap-1 p-2">
                        <button
                            type="button"
                            onClick={handleQuoteAppend}
                            disabled={isBusy}
                            className="flex-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 text-xs font-medium text-neural-light/80 hover:text-neural-light transition-colors disabled:opacity-50"
                        >
                            {isBusy ? '...' : '❝ Citazione'}
                        </button>
                        <button
                            type="button"
                            onClick={handleSynthesize}
                            disabled={isBusy}
                            className="flex-1 rounded-lg bg-neural-purple/15 hover:bg-neural-purple/25 border border-neural-purple/20 px-3 py-2 text-xs font-medium text-neural-purple hover:text-purple-300 transition-colors disabled:opacity-50"
                        >
                            {isBusy ? '...' : '✦ Sintetizza'}
                        </button>
                    </div>
                </div>
            ) : isExpanded ? (
                /* Neuron search dropdown */
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
                                        onClick={() => setSelectedNeuron({ id: node.id, title })}
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
                /* Initial trigger button */
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
