'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth/AuthContext';
import { useOnboarding } from '@/components/onboarding/OnboardingTour';
import { useConversationContext } from '@/lib/contexts/ConversationContext';
import { useQueueStore } from '@/stores/queueStore';

type KeyUIState = 'loading' | 'no-key' | 'has-key' | 'generating' | 'revealed' | 'confirm-regenerate';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { startTour } = useOnboarding();
  const { conversations, currentConversationId, setCurrentConversationId, deleteConversation } = useConversationContext();
  const inboxCount = useQueueStore((state) => state.inboxCount);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // API key management state
  const [keyState, setKeyState] = useState<KeyUIState>('loading');
  const [keyPrefix, setKeyPrefix] = useState<string | null>(null);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('neurograph_sidebar_collapsed');
    if (savedState) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  // Fetch active API key on mount
  useEffect(() => {
    fetch('/api/keys')
      .then(res => res.json())
      .then(data => {
        if (data.key) {
          setKeyPrefix(data.key.prefix);
          setKeyState('has-key');
        } else {
          setKeyState('no-key');
        }
      })
      .catch(() => setKeyState('no-key'));
  }, []);

  const handleGenerate = async () => {
    // If key exists and not in confirm state, show confirmation first
    if (keyState === 'has-key') {
      setKeyState('confirm-regenerate');
      return;
    }
    setKeyState('generating');
    try {
      const res = await fetch('/api/keys', { method: 'POST' });
      const data = await res.json();
      setRawKey(data.key);
      setKeyPrefix(data.prefix);
      setKeyState('revealed');
    } catch {
      setKeyState(keyPrefix ? 'has-key' : 'no-key');
    }
  };

  const handleRevoke = async () => {
    try {
      await fetch('/api/keys', { method: 'DELETE' });
      setKeyPrefix(null);
      setRawKey(null);
      setKeyState('no-key');
    } catch {
      // Silent fail -- key state unchanged
    }
  };

  const handleCopy = async () => {
    if (!rawKey) return;
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismissReveal = () => {
    setRawKey(null);
    setKeyState('has-key');
  };

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('neurograph_sidebar_collapsed', String(newState));
  };

  const handleSelectConversation = (id: string) => {
    if (pathname !== '/app') {
      router.push('/app');
    }
    setCurrentConversationId(id);
  };

  const handleNewConversation = () => {
    if (pathname !== '/app') {
      router.push('/app');
    }
    setCurrentConversationId(null);
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(id);
    }
  };

  const navItems = [
    { label: 'Chat', href: '/app', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    )},
    { label: 'Queue', href: '/app/queue', badgeCount: inboxCount, icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12H8"/><path d="M21 6H8"/><path d="M21 18H8"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
    )},
    { label: 'Review', href: '/app/review', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    )},
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 64 : 288 }}
      transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
      className="flex flex-col border-r border-white/5 bg-neural-dark/30 h-full shrink-0 overflow-hidden relative z-20"
      data-tour="sidebar"
    >
      {/* Header / Toggle */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 h-14 border-b border-white/5`}>
        {!isCollapsed && (
          <span className="text-[10px] font-medium uppercase tracking-widest text-white/25">
            Navigation
          </span>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-md text-neural-light/40 hover:text-neural-light hover:bg-white/5 transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/[0.06] text-white/90 border border-white/[0.08]'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/[0.03] border border-transparent'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!isCollapsed && <span className="min-w-0 flex-1">{item.label}</span>}
              {typeof item.badgeCount === 'number' && item.badgeCount > 0 ? (
                <span
                  aria-label={`${item.label} unread count: ${item.badgeCount}`}
                  className={
                    isCollapsed
                      ? 'absolute right-1.5 top-1.5 inline-flex min-w-[1rem] items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.08] px-1 text-[9px] font-medium text-white/65'
                      : 'inline-flex min-w-[1.4rem] items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-white/60'
                  }
                >
                  {item.badgeCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Conversations Section */}
      <div className="flex-1 flex flex-col min-h-0 mt-4 border-t border-white/5">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 pb-2`}>
          {!isCollapsed && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-neural-light/40">Conversations</p>
          )}
          <button
            type="button"
            onClick={() => {
              handleNewConversation();
            }}
            className={`flex items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-xs font-medium text-white/60 transition hover:bg-white/[0.08] hover:text-white/90 hover:border-white/15 ${
              isCollapsed ? 'w-8 h-8 p-0' : 'px-2.5 py-1.5'
            }`}
            title="New Chat"
          >
            {isCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ) : (
              '+ New Chat'
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-hide py-1">
          {(() => {
            const now = new Date();
            const activeConversations = conversations.filter(c => {
              const updatedAt = new Date(c.updated_at);
              return (now.getTime() - updatedAt.getTime()) <= 48 * 60 * 60 * 1000;
            });

            const fadingConversations = conversations.filter(c => {
              const updatedAt = new Date(c.updated_at);
              return (now.getTime() - updatedAt.getTime()) > 48 * 60 * 60 * 1000;
            });

            const renderConversationItem = (conversation: any, isFading: boolean) => {
              const createdAt = new Date(conversation.created_at || conversation.updated_at);
              const expiresAt = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
              const timeRemainingMs = expiresAt.getTime() - now.getTime();
              const daysRemaining = Math.max(0, Math.ceil(timeRemainingMs / (1000 * 60 * 60 * 24)));
              
              const ttlText = timeRemainingMs <= 0 ? 'Expired' : `${daysRemaining}d left`;
              const isActiveChat = currentConversationId === conversation.id && pathname === '/app';
              
              let containerClass = isActiveChat
                  ? 'border-white/[0.08] bg-white/[0.04] text-white/90'
                  : 'border-transparent text-white/70 hover:bg-white/[0.03] hover:text-white/90';
              let titleClass = 'truncate font-medium pr-6';
              let metaClass = 'text-[10px] text-neural-light/30 group-hover:text-neural-light/50 transition-colors';

              if (isFading) {
                  containerClass = isActiveChat
                      ? 'border-orange-500/20 bg-orange-500/5 text-orange-500/90'
                      : 'border-transparent text-orange-500/60 hover:bg-orange-500/10 hover:text-orange-500/80 opacity-70';
                  titleClass = 'truncate font-medium pr-6 text-orange-500/80';
                  metaClass = 'text-[10px] text-orange-500/40 group-hover:text-orange-500/60 transition-colors';
              }

              return (
                <div key={conversation.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-all ${containerClass} ${isCollapsed ? 'justify-center px-2' : ''}`}
                    title={isCollapsed ? conversation.title : undefined}
                  >
                    {isCollapsed ? (
                      <div className="w-2 h-2 rounded-full bg-current mx-auto" />
                    ) : (
                      <>
                        <p className={titleClass}>{conversation.title}</p>
                        <div className="flex justify-between items-center mt-0.5">
                          <p className={metaClass}>{ttlText}</p>
                        </div>
                      </>
                    )}
                  </button>
                  {!isCollapsed && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(e, conversation.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-neural-light/30 hover:text-red-400 transition-all"
                      title="Delete conversation"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  )}
                </div>
              );
            };

            return (
              <>
                {activeConversations.length > 0 && (
                  <div className="space-y-1">
                    {!isCollapsed && <p className="px-2 text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Active / Recent</p>}
                    {activeConversations.map(c => renderConversationItem(c, false))}
                  </div>
                )}
                {fadingConversations.length > 0 && (
                  <div className="space-y-1">
                    {!isCollapsed && <p className="px-2 text-[9px] font-bold uppercase tracking-widest text-orange-500/40 mb-1">Fading</p>}
                    {fadingConversations.map(c => renderConversationItem(c, true))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* API Key Management Section */}
      {!isCollapsed && keyState !== 'loading' && (
        <div className="px-4 pb-2 border-b border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neural-light/40 mb-2">API</p>

          {keyState === 'no-key' && (
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              Generate key
            </button>
          )}

          {keyState === 'has-key' && (
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-white/50 truncate">{keyPrefix}...</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleGenerate}
                  className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
                  title="Regenerate key"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                </button>
                <button
                  onClick={handleRevoke}
                  className="p-1.5 rounded-md text-white/30 hover:text-red-400/70 hover:bg-white/[0.04] transition-colors"
                  title="Revoke key"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          )}

          {keyState === 'confirm-regenerate' && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-white/40">This will revoke your existing key. Any shortcuts using the old key will stop working.</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setKeyState('has-key'); }}
                  className="px-2 py-1 rounded text-[10px] text-white/40 hover:text-white/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setKeyState('no-key'); handleGenerate(); }}
                  className="px-2 py-1 rounded text-[10px] text-white/50 hover:text-white/80 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}

          {keyState === 'generating' && (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-3 h-3 border border-white/30 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-white/30">Generating...</span>
            </div>
          )}

          {keyState === 'revealed' && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <code className="flex-1 font-mono text-xs text-white/70 bg-white/[0.04] px-2 py-1.5 rounded border border-white/[0.08] truncate select-all">
                  {rawKey}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-colors shrink-0"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-white/30">This key won&apos;t be shown again.</p>
              <button
                onClick={handleDismissReveal}
                className="text-[10px] text-white/40 hover:text-white/70 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer / User */}
      <div className="p-4 border-t border-white/5">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-neural-light">{user?.email}</p>
            </div>
          )}
          <button
            onClick={startTour}
            className="p-2 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
            title="Start Tour"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </button>
          <button
            onClick={signOut}
            className="p-2 rounded-md text-neural-light/40 hover:text-neural-light hover:bg-white/5 transition-colors"
            title="Sign Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
