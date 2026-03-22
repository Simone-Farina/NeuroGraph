'use client';

import { useCallback, useEffect, useState } from 'react';

import { useGraphStore } from '@/stores/graphStore';
import { Neuron } from '@/types/database';
import { LiquidDocumentEditor } from '@/components/editor/LiquidDocumentEditor';

export function NeuronDetailPanel() {
  const activeNeuronId = useGraphStore((state) => state.activeNeuronId);
  const nodes = useGraphStore((state) => state.nodes);
  const openChat = useGraphStore((state) => state.openChat);
  const openNeuronDetail = useGraphStore((state) => state.openNeuronDetail);
  const updateNode = useGraphStore((state) => state.updateNode);

  const [neuron, setNeuron] = useState<Neuron | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backlinks, setBacklinks] = useState<Pick<Neuron, 'id' | 'title'>[]>([]);

  useEffect(() => {
    if (!activeNeuronId) {
      setNeuron(null);
      return;
    }

    const fetchNeuron = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/neurons/${activeNeuronId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch neuron details');
        }

        const payload = await response.json();
        const entity = payload.neuron ?? payload;
        setNeuron(entity);
        setBacklinks(payload.backlinks ?? []);
      } catch (err) {
        console.error(err);
        setError('Could not load neuron details.');
      } finally {
        setLoading(false);
      }
    };

    fetchNeuron();
  }, [activeNeuronId]);

  const handleClose = () => {
    openChat();
  };

  const handleSave = useCallback(
    async (updates: {
      title: string;
      content: string;
      definition?: string;
      core_insight?: string;
      bloom_level?: string;
    }) => {
      if (!activeNeuronId) return;

      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/neurons/${activeNeuronId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: updates.title,
            content: updates.content,
            ...(updates.definition ? { definition: updates.definition } : {}),
            ...(updates.core_insight ? { core_insight: updates.core_insight } : {}),
            ...(updates.bloom_level ? { bloom_level: updates.bloom_level } : {}),
          }),
        });

        if (response.status === 409) {
          const body = await response.json();
          setError(body.error ?? 'A neuron with this title already exists');
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to update neuron');
        }

        const payload = await response.json();
        const updatedNeuron = payload.neuron ?? payload;
        setNeuron(updatedNeuron);

        updateNode(activeNeuronId, { title: updatedNeuron.title });
      } catch (err) {
        console.error(err);
        setError('Failed to save changes.');
      } finally {
        setSaving(false);
      }
    },
    [activeNeuronId, updateNode]
  );

  return (
    <div className="absolute right-0 top-0 h-full w-[480px] bg-neural-dark/95 backdrop-blur-xl border-l border-white/5 shadow-2xl z-50 flex flex-col pointer-events-auto animate-in slide-in-from-right-8 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01] flex-shrink-0">
        <h2 className="text-[10px] font-medium tracking-widest text-white/30 uppercase font-sans">
          Neuron
        </h2>
        <button
          onClick={handleClose}
          className="flex items-center justify-center h-7 w-7 rounded-full text-white/30 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Close editor"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/40" />
          </div>
        ) : error ? (
          <div className="m-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-sans">
            {error}
          </div>
        ) : neuron ? (
          <LiquidDocumentEditor
            neuron={neuron}
            onSave={handleSave}
            isSaving={saving}
          />
        ) : null}
      </div>

      {/* Backlinks footer */}
      {backlinks.length > 0 && !loading && neuron && (
        <div className="flex-shrink-0 px-6 py-4 border-t border-white/5 bg-white/[0.01]">
          <p className="text-[9px] text-white/25 uppercase tracking-widest mb-2 font-sans">
            Backlinks
          </p>
          <div className="flex flex-wrap gap-1.5">
            {backlinks.map((bl) => (
              <button
                key={bl.id}
                onClick={() => openNeuronDetail(bl.id)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/[0.03] border border-white/8 text-white/55 hover:bg-white/8 hover:text-white transition-all"
              >
                {bl.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
