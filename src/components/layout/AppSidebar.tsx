'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth/AuthContext';
import { useOnboarding } from '@/components/onboarding/OnboardingTour';
import { useConversationContext } from '@/lib/contexts/ConversationContext';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { startTour } = useOnboarding();
  const { conversations, currentConversationId, setCurrentConversationId, deleteConversation } = useConversationContext();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('neurograph_sidebar_collapsed');
    if (savedState) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

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
    { label: 'Review', href: '/app/review', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    )},
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 64 : 288 }}
      className="flex flex-col border-r border-white/5 bg-neural-dark/30 h-full shrink-0 overflow-hidden relative z-20"
      data-tour="sidebar"
    >
      {/* Header / Toggle */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 h-14 border-b border-white/5`}>
        {!isCollapsed && (
          <span className="text-xs font-bold uppercase tracking-widest text-neural-light/40">
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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-neural-cyan/10 text-neural-cyan border border-neural-cyan/20' 
                  : 'text-neural-light/60 hover:text-neural-light hover:bg-white/5 border border-transparent'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Conversations Section */}
      <div className="flex-1 flex flex-col min-h-0 mt-4 border-t border-white/5">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4`}>
          {!isCollapsed && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-neural-light/40">Conversations</p>
          )}
          <button
            type="button"
            onClick={() => {
              handleNewConversation();
            }}
            className={`flex items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs font-medium text-neural-light/80 transition hover:bg-white/10 hover:text-neural-cyan hover:border-neural-cyan/30 ${
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

        <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-hide">
          {conversations.map((conversation) => (
            <div key={conversation.id} className="group relative">
              <button
                type="button"
                onClick={() => {
                  handleSelectConversation(conversation.id);
                }}
                className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                  currentConversationId === conversation.id && pathname === '/app'
                    ? 'border-neural-cyan/30 bg-neural-cyan/5 text-neural-cyan shadow-[0_0_15px_-3px_rgba(6,182,212,0.1)]'
                    : 'border-transparent text-neural-light/60 hover:bg-white/5 hover:text-neural-light'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
                title={isCollapsed ? conversation.title : undefined}
              >
                {isCollapsed ? (
                  <div className="w-2 h-2 rounded-full bg-current mx-auto" />
                ) : (
                  <>
                    <p className="truncate font-medium pr-6">{conversation.title}</p>
                    <p className="truncate text-[10px] text-neural-light/30 mt-0.5 group-hover:text-neural-light/50 transition-colors">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </p>
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
          ))}
        </div>
      </div>

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
            className="p-2 rounded-md text-neural-light/40 hover:text-neural-cyan hover:bg-white/5 transition-colors"
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
