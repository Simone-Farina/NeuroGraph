'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

import { useGraphStore } from '@/stores/graphStore';
import { Neuron } from '@/types/database';

function processWikiLinks(markdown: string): string {
  return markdown.replace(
    /\[\[([^\]]+)\]\]/g,
    (_, title) => `[${title}](#wiki-${encodeURIComponent(title)})`
  );
}

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

  const [formData, setFormData] = useState({
    title: '',
    definition: '',
    core_insight: '',
    content: '',
  });

  const [backlinks, setBacklinks] = useState<Pick<Neuron, 'id' | 'title'>[]>([]);
  const [wikiToast, setWikiToast] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [contentMode, setContentMode] = useState<'edit' | 'preview'>('preview');

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
  }, [activeNeuronId]);

  const handleClose = () => {
    openChat();
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!activeNeuronId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/neurons/${activeNeuronId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
      setIsDirty(false);

      updateNode(activeNeuronId, {
        title: updatedNeuron.title,
      });
    } catch (error) {
      console.error(error);
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const titleToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const node of nodes) {
      const title = node.data?.title;
      if (typeof title === 'string') {
        map.set(title.toLowerCase(), node.id);
      }
    }
    return map;
  }, [nodes]);

  const handleWikiClick = useCallback(
    (title: string) => {
      const nodeId = titleToId.get(title.toLowerCase());
      if (nodeId) {
        openNeuronDetail(nodeId);
      } else {
        setWikiToast('Neurone non ancora creato');
        setTimeout(() => setWikiToast(null), 2000);
      }
    },
    [titleToId, openNeuronDetail]
  );

  const markdownComponents = useMemo<Components>(
    () => ({
      a: ({ href, children, ...props }) => {
        if (href?.startsWith('#wiki-')) {
          const title = decodeURIComponent(href.slice('#wiki-'.length));
          return (
            <a
              href={href}
              onClick={(e) => {
                e.preventDefault();
                handleWikiClick(title);
              }}
              className="text-neural-cyan hover:text-cyan-300 underline decoration-neural-cyan/40 hover:decoration-cyan-300 cursor-pointer transition-colors"
              {...props}
            >
              {children}
            </a>
          );
        }
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
            {children}
          </a>
        );
      },
    }),
    [handleWikiClick]
  );

  return (
    <div className="absolute right-0 top-0 h-full w-[450px] bg-neural-dark/95 backdrop-blur-xl border-l border-white/5 shadow-2xl z-50 flex flex-col pointer-events-auto animate-in slide-in-from-right-8 duration-300">
      <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.01]">
        <h2 className="text-sm font-medium tracking-wider text-white/50 uppercase">Neuron Editor</h2>
        <button
          onClick={handleClose}
          className="flex flex-col items-center justify-center h-8 w-8 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/80" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        ) : neuron ? (
          <>
            <div className="space-y-2">
              <label className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => handleChange('title', event.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all font-serif text-lg"
                placeholder="Neuron Title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Definition</label>
              <textarea
                value={formData.definition}
                onChange={(event) => handleChange('definition', event.target.value)}
                rows={3}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all resize-none font-serif text-[15px] leading-relaxed"
                placeholder="What is this concept?"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Core Insight</label>
              <textarea
                value={formData.core_insight}
                onChange={(event) => handleChange('core_insight', event.target.value)}
                rows={3}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all resize-none font-serif text-[15px] italic leading-relaxed"
                placeholder="The key takeaway..."
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Detailed Content</label>
                <div className="flex rounded-lg border border-white/10 bg-white/[0.02] p-0.5">
                  <button
                    type="button"
                    onClick={() => setContentMode('edit')}
                    className={`px-3 py-1 text-[11px] font-medium uppercase tracking-wider rounded-md transition-all ${contentMode === 'edit'
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                      }`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentMode('preview')}
                    className={`px-3 py-1 text-[11px] font-medium uppercase tracking-wider rounded-md transition-all ${contentMode === 'preview'
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                      }`}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {contentMode === 'edit' ? (
                <textarea
                  value={formData.content}
                  onChange={(event) => handleChange('content', event.target.value)}
                  rows={12}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-4 text-white/90 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all font-mono text-xs leading-relaxed resize-y min-h-[200px] shadow-inner"
                  placeholder="Write Markdown here..."
                />
              ) : (
                <div className="w-full bg-white/[0.01] border border-white/5 rounded-xl px-5 py-4 min-h-[200px] overflow-y-auto markdown-content prose prose-invert font-serif prose-headings:font-sans prose-a:text-white prose-a:underline-offset-4 max-w-none">
                  {formData.content ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={markdownComponents}
                    >
                      {processWikiLinks(formData.content)}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-white/30 text-sm italic">No content yet. Switch to Edit to add Markdown.</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5 mt-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 shadow-sm">
                <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5">Bloom Level</div>
                <div className="text-sm font-medium text-white/90">{neuron.bloom_level}</div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 shadow-sm">
                <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5">State</div>
                <div className="text-sm font-medium text-white/90">{neuron.state}</div>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-white/5 mt-4">
              <label className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Backlinks</label>
              {backlinks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {backlinks.map((bl) => (
                    <button
                      key={bl.id}
                      onClick={() => openNeuronDetail(bl.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.03] border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all shadow-sm"
                    >
                      {bl.title}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-white/30 text-xs italic">No backlinks</p>
              )}
            </div>

            {wikiToast && (
              <div className="rounded-lg bg-amber-500/15 border border-amber-500/25 px-4 py-2 text-sm text-amber-400 font-medium animate-in fade-in">
                {wikiToast}
              </div>
            )}
          </>
        ) : null}
      </div>

      <div className="p-5 border-t border-white/5 bg-white/[0.02]">
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all shadow-sm ${isDirty
            ? 'bg-white/90 text-black hover:bg-white active:scale-[0.98]'
            : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
            }`}
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-black/20 border-t-black" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
