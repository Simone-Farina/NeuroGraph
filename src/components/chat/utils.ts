import { RelationshipType } from '@/types/chat';

export function edgeSuggestionKey(suggestion: {
  source_crystal_id: string;
  target_crystal_id: string;
  type: RelationshipType;
}) {
  return `${suggestion.source_crystal_id}:${suggestion.target_crystal_id}:${suggestion.type}`;
}
