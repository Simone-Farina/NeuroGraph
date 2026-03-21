'use client';

import { Extension } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Editor } from '@tiptap/core';

export type SlashCommand = {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: (editor: Editor) => void | Promise<void>;
};

const SLASH_COMMAND_PLUGIN_KEY = new PluginKey('slashCommand');

/**
 * Returns the default set of slash command definitions.
 * Each action receives the TipTap editor instance.
 */
export function createSlashCommands(
  onAiAction: (type: string, content: string, editor: Editor) => Promise<void>
): SlashCommand[] {
  return [
    {
      id: 'summarize',
      title: 'Summarize',
      description: 'Condense this note into key points',
      icon: '◈',
      action: async (editor) => {
        await onAiAction('summarize', editor.getText(), editor);
      },
    },
    {
      id: 'expand',
      title: 'Expand',
      description: 'Elaborate on this idea with examples',
      icon: '⟴',
      action: async (editor) => {
        await onAiAction('expand', editor.getText(), editor);
      },
    },
    {
      id: 'rewrite',
      title: 'Rewrite',
      description: 'Rephrase for clarity and precision',
      icon: '↺',
      action: async (editor) => {
        await onAiAction('rewrite', editor.getText(), editor);
      },
    },
    {
      id: 'challenge',
      title: 'Challenge',
      description: 'Find counterarguments or weak points',
      icon: '⚡',
      action: async (editor) => {
        await onAiAction('challenge', editor.getText(), editor);
      },
    },
    {
      id: 'connect',
      title: 'Connect Neurons',
      description: 'Find related concepts in your graph',
      icon: '◎',
      action: async (editor) => {
        await onAiAction('connect', editor.getText(), editor);
      },
    },
  ];
}

export type SlashMenuState = {
  active: boolean;
  query: string;
  position: { top: number; left: number };
  commands: SlashCommand[];
  selectedIndex: number;
};

/**
 * TipTap extension that detects `/` keystrokes and emits state
 * for a React-rendered slash command menu overlay.
 *
 * Instead of mounting via Tippy, state is surfaced via the editor's
 * `slashMenu` meta so the parent React component can render the overlay.
 */
export function createSlashCommandExtension(
  commands: SlashCommand[],
  onStateChange: (state: SlashMenuState) => void
): Extension {
  return Extension.create({
    name: 'slashCommand',

    addProseMirrorPlugins() {
      const editorRef = this.editor;
      return [
        new Plugin({
          key: SLASH_COMMAND_PLUGIN_KEY,

          props: {
            handleKeyDown: (view, event) => {
              const meta = SLASH_COMMAND_PLUGIN_KEY.getState(view.state) as SlashMenuState | null;
              if (!meta?.active) return false;

              if (event.key === 'Escape') {
                onStateChange({ ...meta, active: false, query: '', selectedIndex: 0 });
                return true;
              }

              if (event.key === 'ArrowDown') {
                const next = (meta.selectedIndex + 1) % meta.commands.length;
                onStateChange({ ...meta, selectedIndex: next });
                return true;
              }

              if (event.key === 'ArrowUp') {
                const prev = (meta.selectedIndex + meta.commands.length - 1) % meta.commands.length;
                onStateChange({ ...meta, selectedIndex: prev });
                return true;
              }

              if (event.key === 'Enter' && meta.commands.length > 0) {
                const chosen = meta.commands[meta.selectedIndex];
                if (chosen) {
                  // Delete the slash + query text
                  const { state } = view;
                  const { $from } = state.selection;
                  const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
                  const slashIndex = textBefore.lastIndexOf('/');
                  if (slashIndex >= 0) {
                    const startPos = $from.pos - $from.parentOffset + slashIndex;
                    const endPos = $from.pos;
                    view.dispatch(state.tr.deleteRange(startPos, endPos));
                  }
                  chosen.action(editorRef);
                  onStateChange({ ...meta, active: false, query: '', selectedIndex: 0 });
                  return true;
                }
              }

              return false;
            },
          },

          state: {
            init: (): SlashMenuState => ({
              active: false,
              query: '',
              position: { top: 0, left: 0 },
              commands: [],
              selectedIndex: 0,
            }),
            apply: (tr, prev): SlashMenuState => {
              const meta = tr.getMeta(SLASH_COMMAND_PLUGIN_KEY);
              if (meta !== undefined) return meta;
              return prev;
            },
          },

          view() {
            return {
              update(view) {
                const { state } = view;
                const { selection } = state;
                const { $from, empty } = selection;

                const currentState = SLASH_COMMAND_PLUGIN_KEY.getState(state) as SlashMenuState;

                if (!empty) {
                  if (currentState.active) {
                    const next: SlashMenuState = { ...currentState, active: false, query: '' };
                    view.dispatch(view.state.tr.setMeta(SLASH_COMMAND_PLUGIN_KEY, next));
                    onStateChange(next);
                  }
                  return;
                }

                const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
                const slashIdx = textBefore.lastIndexOf('/');

                if (slashIdx === -1) {
                  if (currentState.active) {
                    const next: SlashMenuState = { ...currentState, active: false, query: '' };
                    view.dispatch(view.state.tr.setMeta(SLASH_COMMAND_PLUGIN_KEY, next));
                    onStateChange(next);
                  }
                  return;
                }

                const query = textBefore.slice(slashIdx + 1).toLowerCase();
                const filtered = query
                  ? commands.filter(
                      (c) =>
                        c.title.toLowerCase().includes(query) ||
                        c.description.toLowerCase().includes(query)
                    )
                  : commands;

                const coords = view.coordsAtPos($from.pos);
                const editorRect = view.dom.getBoundingClientRect();
                const position = {
                  top: coords.bottom - editorRect.top + 8,
                  left: coords.left - editorRect.left,
                };

                const next: SlashMenuState = {
                  active: true,
                  query,
                  position,
                  commands: filtered,
                  selectedIndex: Math.min(
                    currentState.selectedIndex,
                    Math.max(filtered.length - 1, 0)
                  ),
                };

                view.dispatch(view.state.tr.setMeta(SLASH_COMMAND_PLUGIN_KEY, next));
                onStateChange(next);
              },
            };
          },
        }),
      ];
    },
  });
}
