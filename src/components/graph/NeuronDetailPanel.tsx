'use client';

import { useEffect, useState } from 'react';

import { useGraphStore } from '@/stores/graphStore';
import { Neuron } from '@/types/database';

export function NeuronDetailPanel() {
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode);
  const updateNode = useGraphStore((state) => state.updateNode);

  const [neuron, setNeuron] = useState<Neuron | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    definition: '',
    core_insight: '',
    content: '',
  });

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!selectedNodeId) {
      setNeuron(null);
      return;
    }

    const fetchNeuron = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/neurons/${selectedNodeId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch neuron details');
        }

        const payload = await response.json();
        const entity = payload.neuron ?? payload;
        setNeuron(entity);
        setFormData({
          title: entity.title || '',
          definition: entity.definition || '',
          core_insight: entity.core_insight || '',
          content: entity.content || '',
        });
        setIsDirty(false);
      } catch (error) {
        console.error(error);
        setError('Could not load neuron details.');
      } finally {
        setLoading(false);
      }
    };

    fetchNeuron();
  }, [selectedNodeId]);

  const handleClose = () => {
    setSelectedNode(null);
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!selectedNodeId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/neurons/${selectedNodeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update neuron');
      }

      const payload = await response.json();
      const updatedNeuron = payload.neuron ?? payload;
      setNeuron(updatedNeuron);
      setIsDirty(false);

      updateNode(selectedNodeId, {
        title: updatedNeuron.title,
      });
    } catch (error) {
      console.error(error);
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (!selectedNodeId) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-neural-gray-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
        <h2 className="text-xl font-bold text-neural-light flex items-center gap-2">
          <span className="text-neural-cyan">✦</span>
          Neuron Details
        </h2>
        <button
          onClick={handleClose}
          aria-label="Close details"
          className="p-2 rounded-full hover:bg-white/10 text-neural-light/60 hover:text-neural-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neural-cyan"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neural-cyan" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        ) : neuron ? (
          <>
            <div className="space-y-2">
              <label htmlFor="title" className="text-xs font-medium text-neural-light/40 uppercase tracking-wider">Title</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(event) => handleChange('title', event.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-neural-light focus:outline-none focus:border-neural-cyan/50 focus:ring-1 focus:ring-neural-cyan/50 transition-all"
                placeholder="Neuron Title"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="definition" className="text-xs font-medium text-neural-light/40 uppercase tracking-wider">Definition</label>
              <textarea
                id="definition"
                value={formData.definition}
                onChange={(event) => handleChange('definition', event.target.value)}
                rows={3}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-neural-light focus:outline-none focus:border-neural-cyan/50 focus:ring-1 focus:ring-neural-cyan/50 transition-all resize-none"
                placeholder="What is this concept?"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="core_insight" className="text-xs font-medium text-neural-light/40 uppercase tracking-wider">Core Insight</label>
              <textarea
                id="core_insight"
                value={formData.core_insight}
                onChange={(event) => handleChange('core_insight', event.target.value)}
                rows={3}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-neural-light focus:outline-none focus:border-neural-cyan/50 focus:ring-1 focus:ring-neural-cyan/50 transition-all resize-none"
                placeholder="The key takeaway..."
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="text-xs font-medium text-neural-light/40 uppercase tracking-wider">Detailed Content</label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(event) => handleChange('content', event.target.value)}
                rows={10}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-neural-light/90 focus:outline-none focus:border-neural-cyan/50 focus:ring-1 focus:ring-neural-cyan/50 transition-all font-mono text-sm leading-relaxed"
                placeholder="Detailed notes and explanations..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="text-xs text-neural-light/40 mb-1">Bloom Level</div>
                <div className="text-sm font-medium text-neural-cyan">{neuron.bloom_level}</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="text-xs text-neural-light/40 mb-1">State</div>
                <div className="text-sm font-medium text-neural-purple">{neuron.state}</div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-md">
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            isDirty
              ? 'bg-neural-cyan text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
