'use client';

import { useCallback } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import { CreatedCrystalResponse, EdgeSuggestion, RelationshipType, SuggestionToolPart } from '@/types/chat';
import { UIMessage } from 'ai';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isToolPartWithId(part: unknown, toolCallId: string): part is SuggestionToolPart {
  if (!part || typeof part !== 'object') return false;

  const candidate = part as { type?: unknown; toolCallId?: unknown };
  return (
    typeof candidate.type === 'string' &&
    candidate.type.startsWith('tool-') &&
    typeof candidate.toolCallId === 'string' &&
    candidate.toolCallId === toolCallId
  );
}

type UseCrystallizationProps = {
  messages: UIMessage[];
  conversationId: string | null;
  setMessages: (messages: UIMessage[] | ((prev: UIMessage[]) => UIMessage[])) => void;
  showConnectionsNotice: (message: string) => void;
  upsertEdgesInStore: (edges: Array<{
    id: string;
    source_crystal_id: string;
    target_crystal_id: string;
    type: RelationshipType;
  }>) => void;
  addEdgeSuggestions: (suggestions: EdgeSuggestion[]) => void;
};

export function useCrystallization({
  messages,
  conversationId,
  setMessages,
  showConnectionsNotice,
  upsertEdgesInStore,
  addEdgeSuggestions,
}: UseCrystallizationProps) {
  const handleCrystallize = useCallback(
    async (toolCallId: string) => {
      // 1. Find the message and tool invocation
      const message = messages.find((m) =>
        m.parts.some((part) => isToolPartWithId(part, toolCallId))
      );

      if (!message) {
        console.error('Message not found for tool call');
        return;
      }

      const part = message.parts.find((messagePart) => isToolPartWithId(messagePart, toolCallId));

      if (!part?.input) {
        console.error('Tool part or input not found');
        return;
      }

      // 2. Validate message ID
      if (!conversationId) {
        console.error('No conversation ID');
        return;
      }

      const input = part.input;
      const sourceMessageIds = isUuid(message.id) ? [message.id] : undefined;

      try {
        // 3. Call API
        const response = await fetch('/api/crystals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: input.title,
            definition: input.definition,
            core_insight: input.core_insight,
            bloom_level: input.bloom_level,
            source_conversation_id: conversationId,
            source_message_ids: sourceMessageIds,
            related_crystals: input.related_crystals ?? [],
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to crystallize:', error);
          alert('Failed to save crystal: ' + (error.error || 'Unknown error'));
          return;
        }

        const { crystal, edges, edge_suggestions } = (await response.json()) as CreatedCrystalResponse;

        // 4. Update Graph Store Optimistically
        const { addNode } = useGraphStore.getState();

        addNode({
          id: crystal.id,
          type: 'crystal',
          position: { x: 0, y: 0 },
          data: {
            title: crystal.title,
            retrievability: crystal.retrievability,
          },
        });

        if (edges && edges.length > 0) {
          upsertEdgesInStore(edges);
        }

        if (edge_suggestions && edge_suggestions.length > 0) {
          addEdgeSuggestions(edge_suggestions);
        }

        const connectionCount = (edges?.length ?? 0) + (edge_suggestions?.length ?? 0);
        if (connectionCount > 0) {
          showConnectionsNotice(
            connectionCount === 1 ? 'Connections found: 1' : `Connections found: ${connectionCount}`
          );
        }

        // 5. Update UI State
        setMessages((prev) =>
          prev.map((msg) => ({
            ...msg,
            parts: msg.parts.map((p) => {
              if (isToolPartWithId(p, toolCallId)) {
                return {
                  type: p.type,
                  toolCallId: p.toolCallId,
                  providerExecuted: p.providerExecuted,
                  input: p.input,
                  state: 'output-available',
                  output: { status: 'crystallized' },
                };
              }
              return p;
            }),
          }))
        );

      } catch (error) {
        console.error('Crystallization error:', error);
        alert('An error occurred while crystallizing.');
      }
    },
    [messages, conversationId, setMessages, showConnectionsNotice, upsertEdgesInStore, addEdgeSuggestions]
  );

  const handleDismiss = useCallback((toolCallId: string) => {
    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        parts: msg.parts.map((part) => {
          if (isToolPartWithId(part, toolCallId)) {
            return {
              type: part.type,
              toolCallId: part.toolCallId,
              providerExecuted: part.providerExecuted,
              input: part.input,
              state: 'output-available',
              output: { status: 'dismissed' },
            };
          }
          return part;
        }),
      }))
    );
  }, [setMessages]);

  return {
    handleCrystallize,
    handleDismiss,
  };
}
