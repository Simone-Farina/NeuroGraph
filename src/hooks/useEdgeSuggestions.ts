'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Edge, MarkerType } from '@xyflow/react';
import { useGraphStore } from '@/stores/graphStore';
import { EdgeSuggestion, EdgeUpsertResponse, RelationshipType } from '@/types/chat';

function markerForEdge(type: RelationshipType) {
  if (type === 'RELATED') return undefined;

  return {
    type: MarkerType.ArrowClosed,
    color: type === 'PREREQUISITE' ? '#22d3ee' : '#f59e0b',
  };
}

export function toGraphEdge(edge: {
  id: string;
  source_crystal_id: string;
  target_crystal_id: string;
  type: RelationshipType;
}): Edge {
  return {
    id: edge.id,
    source: edge.source_crystal_id,
    target: edge.target_crystal_id,
    type: 'crystalEdge',
    data: { typeLabel: edge.type },
    markerEnd: markerForEdge(edge.type),
  };
}

export function edgeSuggestionKey(suggestion: {
  source_crystal_id: string;
  target_crystal_id: string;
  type: RelationshipType;
}) {
  return `${suggestion.source_crystal_id}:${suggestion.target_crystal_id}:${suggestion.type}`;
}

export function useEdgeSuggestions() {
  const [edgeSuggestions, setEdgeSuggestions] = useState<EdgeSuggestion[]>([]);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showConnectionsNotice = useCallback((message: string) => {
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }

    setConnectionNotice(message);
    noticeTimeoutRef.current = setTimeout(() => {
      setConnectionNotice(null);
    }, 2400);
  }, []);

  const clearConnectionNotice = useCallback(() => {
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
      noticeTimeoutRef.current = null;
    }
    setConnectionNotice(null);
  }, []);

  const clearEdgeSuggestions = useCallback(() => {
    setEdgeSuggestions([]);
  }, []);

  const addEdgeSuggestions = useCallback((newSuggestions: EdgeSuggestion[]) => {
    setEdgeSuggestions((prev) => {
      const merged = [...newSuggestions, ...prev];
      const deduped = new Map<string, EdgeSuggestion>();

      merged.forEach((suggestion) => {
        deduped.set(edgeSuggestionKey(suggestion), suggestion);
      });

      return Array.from(deduped.values()).slice(0, 8);
    });
  }, []);

  const upsertEdgeInStore = useCallback(
    (edgeInput: {
      id: string;
      source_crystal_id: string;
      target_crystal_id: string;
      type: RelationshipType;
    }) => {
      const { edges: currentEdges, addEdge } = useGraphStore.getState();

      const exists = currentEdges.some((existing) => {
        const data = existing.data as { typeLabel?: RelationshipType } | undefined;
        return (
          existing.id === edgeInput.id ||
          (existing.source === edgeInput.source_crystal_id &&
            existing.target === edgeInput.target_crystal_id &&
            data?.typeLabel === edgeInput.type)
        );
      });

      if (exists) return;

      addEdge(toGraphEdge(edgeInput));
    },
    []
  );

  const handleConfirmEdgeSuggestion = useCallback(
    async (suggestion: EdgeSuggestion) => {
      try {
        const response = await fetch(`/api/crystals/${suggestion.source_crystal_id}/edges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_id: suggestion.target_crystal_id,
            type: suggestion.type,
            weight: suggestion.weight,
            ai_suggested: true,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to confirm edge suggestion', error);
          showConnectionsNotice('Connection could not be created');
          return;
        }

        const payload = (await response.json()) as EdgeUpsertResponse;

        if (payload.edge) {
          upsertEdgeInStore(payload.edge);
        }

        const suggestionId = edgeSuggestionKey(suggestion);
        setEdgeSuggestions((prev) =>
          prev.filter((candidate) => edgeSuggestionKey(candidate) !== suggestionId)
        );
        showConnectionsNotice('Connection added');
      } catch (error) {
        console.error('Connection confirmation failed', error);
        showConnectionsNotice('Connection could not be created');
      }
    },
    [showConnectionsNotice, upsertEdgeInStore]
  );

  const handleDismissEdgeSuggestion = useCallback((suggestionId: string) => {
    setEdgeSuggestions((prev) => prev.filter((candidate) => edgeSuggestionKey(candidate) !== suggestionId));
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);

  return {
    edgeSuggestions,
    connectionNotice,
    showConnectionsNotice,
    clearConnectionNotice,
    clearEdgeSuggestions,
    addEdgeSuggestions,
    upsertEdgeInStore,
    handleConfirmEdgeSuggestion,
    handleDismissEdgeSuggestion,
  };
}
